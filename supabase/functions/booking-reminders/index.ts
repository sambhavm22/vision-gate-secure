import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
    // 1. Setup Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Define Time Window (jobs scheduled in the next 2 hours)
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    try {
        console.log(`Checking for bookings between ${now.toISOString()} and ${twoHoursFromNow.toISOString()}`);

        // 3. Fetch Bookings that need a reminder
        const { data: bookings, error: fetchError } = await supabase
            .from('bookings')
            .select(`
                id, 
                customer_id, 
                worker_id, 
                scheduled_at,
                services (name)
            `)
            .eq('status', 'accepted')
            .is('reminder_sent', false) // Use .is() for boolean false if needed, or .eq('reminder_sent', false)
            .gte('scheduled_at', now.toISOString())
            .lte('scheduled_at', twoHoursFromNow.toISOString());

        if (fetchError) throw fetchError;

        console.log(`Found ${bookings?.length || 0} bookings for reminders.`);

        const results = [];

        for (const booking of bookings || []) {
            const serviceName = (booking.services as any)?.name || 'service';
            const scheduledTime = new Date(booking.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // A. Notify Customer
            const { error: customerNotifError } = await supabase
                .from('notifications')
                .insert({
                    user_id: booking.customer_id,
                    title: 'Upcoming Job Reminder',
                    message: `Reminder: Your ${serviceName} booking is scheduled for ${scheduledTime}. Please be ready.`,
                    priority: 'Medium',
                    metadata: {
                        booking_id: booking.id,
                        type: 'booking_reminder'
                    }
                });

            if (customerNotifError) console.error(`Error notifying customer ${booking.customer_id}:`, customerNotifError);

            // B. Notify Worker (if assigned)
            if (booking.worker_id) {
                const { error: workerNotifError } = await supabase
                    .from('notifications')
                    .insert({
                        user_id: booking.worker_id,
                        title: 'Upcoming Job Reminder',
                        message: `Upcoming Job: You have a ${serviceName} scheduled for ${scheduledTime}. Please be ready.`,
                        priority: 'Medium',
                        metadata: {
                            booking_id: booking.id,
                            type: 'booking_reminder'
                        }
                    });

                if (workerNotifError) console.error(`Error notifying worker ${booking.worker_id}:`, workerNotifError);
            }

            // C. Mark Reminder as Sent
            const { error: updateError } = await supabase
                .from('bookings')
                .update({ reminder_sent: true } as any)
                .eq('id', booking.id);

            if (updateError) {
                console.error(`Error updating booking ${booking.id}:`, updateError);
            } else {
                results.push(booking.id);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Processed ${results.length} reminders`,
            processed_ids: results
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Error in booking-reminders function:', err);
        return new Response(JSON.stringify({
            success: false,
            error: err.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
