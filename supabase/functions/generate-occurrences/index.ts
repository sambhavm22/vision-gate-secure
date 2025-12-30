import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { RRule, rrulestr } from 'npm:rrule@2.7.2';

// GENERATION HORIZON: Create occurrences 48h ahead
const GENERATION_HORIZON_HOURS = 48;

// Type definitions (minimal)
interface RecurringBooking {
    id: string;
    rrule: string;
    timezone: string;
    start_date: string;
    end_date: string | null;
    max_occurrences: number | null;
    preferred_time_start: string;
    status: string;
}

Deno.serve(async (req: Request) => {
    // 1. Validation & Setup
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date();
    const horizon = new Date(now.getTime() + GENERATION_HORIZON_HOURS * 60 * 60 * 1000);

    try {
        // 2. Fetch Active Recurring Bookings
        // We fetch bookings that are active AND (no end date OR end date is in future)
        const { data: activeBookings, error } = await supabase
            .from('recurring_bookings')
            .select('id, rrule, timezone, start_date, end_date, max_occurrences, preferred_time_start, status')
            .eq('status', 'active')
            .or(`end_date.is.null,end_date.gte.${now.toISOString().split('T')[0]}`);

        if (error) throw error;

        let generatedCount = 0;
        let skippedCount = 0;

        // 3. Process Each Booking
        for (const booking of (activeBookings as RecurringBooking[]) || []) {
            try {
                // A. Get existing occurrences to determine next index
                const { data: existingOccurrences } = await supabase
                    .from('recurring_booking_occurrences')
                    .select('occurrence_index, scheduled_for')
                    .eq('recurring_booking_id', booking.id)
                    .order('occurrence_index', { ascending: false })
                    .limit(1);

                const lastIndex = existingOccurrences?.[0]?.occurrence_index ?? 0;

                // Determine start date for generation
                // If we have existing occurrences, start after the last one
                // Otherwise start from booking start_date
                let startGenDate: Date;
                if (existingOccurrences?.[0]?.scheduled_for) {
                    startGenDate = new Date(existingOccurrences[0].scheduled_for);
                    // Add 1 second to avoid inclusive duplicate of last occurrence
                    startGenDate.setSeconds(startGenDate.getSeconds() + 1);
                } else {
                    startGenDate = new Date(booking.start_date);
                    // If pending start date is in past relative to now, we still might need to generate it 
                    // if it hasn't been generated yet (e.g. created today for today)
                    // But generally we clamp to MAX(start_date, now) if we don't want to backfill
                    // For this system, let's assume we want to backfill missed ones if they are recent? 
                    // No, let's strictly follow RRule from start_date, but only insert if > now (or slightly past)?
                    // actually safer to just generate from start_date and let the unique constraint handle it?
                    // No, that's too expensive if start_date was 1 year ago.

                    // Optimization: Start from MAX(start_date, (now - 1 day)) to catch any immediate missed ones
                    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    if (startGenDate < yesterday) {
                        startGenDate = yesterday;
                    }
                }

                // B. Parse RRULE
                // Note: rrule.js requires DTSTART in options if not in string
                const ruleOptions = RRule.parseString(booking.rrule);
                ruleOptions.dtstart = new Date(booking.start_date);

                // Adjust dtstart timezone if needed? 
                // For simplicity in this v1, we assume rrule string handles complexity or we use UTC dates.

                const rule = new RRule(ruleOptions);

                // C. Generate Dates
                // We generate occurrences between startGenDate and Horizon
                const nextDates = rule.between(startGenDate, horizon, true);

                // D. Insert Occurrences
                for (let i = 0; i < nextDates.length; i++) {
                    const occDate = nextDates[i];

                    // Calculate true index (approximate if we jumped time, but we rely on lastIndex)
                    // Actually, if we use RRule count, we need the true count. 
                    // If we rely on stored lastIndex, we just increment. (Lazy infinite generation)
                    // If booking has max_occurrences, we should strictly check.

                    const occIndex = lastIndex + i + 1;

                    if (booking.max_occurrences && occIndex > booking.max_occurrences) {
                        break;
                    }

                    // Combine Date + Preferred Time
                    // occDate from rrule is usually 00:00 or start_date time. 
                    // We force set the time to preferred_time_start
                    const [hours, minutes] = booking.preferred_time_start.split(':').map(Number);
                    const finalScheduled = new Date(occDate);
                    finalScheduled.setHours(hours, minutes, 0, 0);

                    // Insert
                    const { error: insertError } = await supabase
                        .from('recurring_booking_occurrences')
                        .insert({
                            recurring_booking_id: booking.id,
                            occurrence_index: occIndex,
                            scheduled_for: finalScheduled.toISOString(),
                            status: 'pending'
                        })
                        .select()
                        .single();

                    if (insertError) {
                        // 23505 = unique_violation (idempotency safety)
                        if (insertError.code === '23505') {
                            skippedCount++;
                        } else {
                            console.error(`Failed to insert occurrence for ${booking.id}:`, insertError);
                        }
                    } else {
                        generatedCount++;
                    }
                }

            } catch (err) {
                console.error(`Error processing booking ${booking.id}:`, err);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Generation complete',
                stats: { generated: generatedCount, skipped: skippedCount }
            }),
            { headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
