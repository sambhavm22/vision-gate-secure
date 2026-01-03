import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { ticketId, name, email, mobile, category, description, attachmentUrl } = await req.json();

        if (!RESEND_API_KEY) {
            console.error("RESEND_API_KEY is not set");
            return new Response(
                JSON.stringify({ success: false, error: 'Email provider not configured (Missing RESEND_API_KEY)' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'HelperHub Support <onboarding@resend.dev>',
                to: 'sambhavm22@gmail.com',
                subject: `[Support Ticket] ${category} - ${name}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #2563eb;">New Support Ticket Received</h2>
                        <hr />
                        <p><strong>Ticket ID:</strong> ${ticketId}</p>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Mobile:</strong> ${mobile}</p>
                        <p><strong>Category:</strong> ${category}</p>
                        <p><strong>Description:</strong></p>
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 5px;">
                            ${description.replace(/\n/g, '<br/>')}
                        </div>
                        ${attachmentUrl ? `
                        <p style="margin-top: 20px;">
                            <strong>Attachment:</strong> <br/>
                            <a href="${attachmentUrl}" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">View Photo/Video</a>
                        </p>` : ''}
                        <hr style="margin-top: 30px;" />
                        <p style="font-size: 12px; color: #6b7280;">This is an automated notification from the HelperHub Support System.</p>
                    </div>
                `,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Failed to send email via Resend');
        }

        return new Response(
            JSON.stringify({ success: true, data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error: any) {
        console.error('Edge Function Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
