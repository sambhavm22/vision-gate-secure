
import { PDFDocument, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // 1. Auth Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) throw new Error('Invalid user token');

        const { format, from_date, to_date, role } = await req.json();

        if (!['pdf', 'xlsx'].includes(format)) throw new Error('Invalid format. Use pdf or xlsx');
        if (!['user', 'worker'].includes(role)) throw new Error('Invalid role');

        // 2. Fetch Data
        let query = supabase.from('bookings').select(`
      id,
      created_at,
      scheduled_at,
      status,
      total_amount,
      service_name:services(name),
      customer:profiles!bookings_customer_id_fkey(full_name),
      worker:workers_public!bookings_worker_id_fkey(full_name)
    `);

        // Role filtering logic
        if (role === 'user') {
            query = query.eq('customer_id', user.id);
            // Validate that the requestor is indeed this user (already effectively done by getUser)
        } else if (role === 'worker') {
            // Need to look up worker_id from auth.id
            const { data: workerProfile } = await supabase.from('workers_public').select('id').eq('profile_id', user.id).single();
            if (!workerProfile) throw new Error('Worker profile not found');
            query = query.eq('worker_id', workerProfile.id);
        }

        if (from_date) query = query.gte('scheduled_at', from_date);
        if (to_date) query = query.lte('scheduled_at', to_date);

        const { data: bookings, error: fetchError } = await query;

        if (fetchError) throw new Error(`Error fetching bookings: ${fetchError.message}`);

        // 3. Generate File
        let fileBuffer;
        let contentType;
        const timestamp = new Date().toISOString();
        const filename = `${user.id}/${timestamp}.${format}`;

        if (format === 'pdf') {
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage();
            const { width, height } = page.getSize();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontSize = 12;

            page.drawText('Booking History', { x: 50, y: height - 50, size: 20, font });

            let y = height - 100;

            // Simple list output for this iteration
            // In production, use a table drawing library or manual computation for columns
            bookings.forEach((b: any) => {
                if (y < 50) { pdfDoc.addPage(); y = height - 50; }

                const date = new Date(b.scheduled_at).toLocaleDateString();
                const service = b.service_name?.name || 'Service';
                const amount = b.total_amount || 0;
                const text = `${date} | ${service} | ${b.status} | INR ${amount}`;

                page.drawText(text, { x: 50, y, size: 10, font });
                y -= 20;
            });

            const pdfBytes = await pdfDoc.save();
            fileBuffer = pdfBytes;
            contentType = 'application/pdf';

        } else {
            // XLSX
            const rows = bookings.map((b: any) => ({
                'Booking ID': b.id,
                'Date': b.scheduled_at,
                'Service': b.service_name?.name,
                'Status': b.status,
                'Amount': b.total_amount,
                'Customer': b.customer?.full_name || '',
                'Worker': b.worker?.full_name || ''
            }));

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(rows);
            XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");

            // write to buffer
            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            fileBuffer = new Uint8Array(wbout);
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        }

        // 4. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from('exports')
            .upload(filename, fileBuffer, {
                contentType: contentType,
                upsert: false
            });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        // 5. Generate Signed URL
        const { data: signedUrlData, error: signError } = await supabase.storage
            .from('exports')
            .createSignedUrl(filename, 3600); // 1 hour

        if (signError) throw new Error(`Signing URL failed: ${signError.message}`);

        // 6. Log Export
        await supabase.from('export_logs').insert({
            user_id: user.id,
            role,
            format,
            from_date,
            to_date,
            file_path: filename
        });

        return new Response(
            JSON.stringify({
                success: true,
                downloadUrl: signedUrlData.signedUrl
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (error: any) {
        console.error('Error:', error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
