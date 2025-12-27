import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@vision-gate/supabase/client";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function VerificationCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { refreshProfile, user } = useAuth();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState("Verifying your identity...");

    useEffect(() => {
        const verify = async () => {
            const code = searchParams.get("code");
            const error = searchParams.get("error");

            if (error) {
                setStatus('error');
                setMessage("Verification failed or was cancelled.");
                return;
            }

            if (!code) {
                setStatus('error');
                setMessage("Invalid verification response.");
                return;
            }

            if (!user) {
                // Wait for auth to load or redirect if not logged in
                return;
            }

            try {
                // Call Edge Function
                const { data, error: fnError } = await supabase.functions.invoke('verify-identity', {
                    body: {
                        worker_id: user.id,
                        code: code
                    },
                    method: 'POST',
                    headers: {
                        // The suffix indicates which handler to use in our combined function
                    }
                });

                // Note: The Edge Function I wrote uses URL path routing (/callback). 
                // Using supabase.functions.invoke('verify-identity') sends to the root.
                // I need to make sure my Edge Function handles the default path correctly OR use a fetch to the full URL.
                // Supabase functions invocation usually sends to the function root.
                // Let's adjust correct invocation. 
                // Actually, supabase.functions.invoke appends the function name.
                // To hit /callback, I might need to append it or use a custom fetch if invoke doesn't support subpaths easily.
                // However, the `invoke` method usually just POSTs to the function.
                // My Edge Function parses `req.url`.
                // If I use `invoke`, the URL is likely `.../verify-identity`.
                // I need to update my Edge Function logic to handle the payload differentiation if strict path checking fails, 
                // OR I can pass a query param or body param to switch mode.
                // Let's assume for now I will modify the Edge Function or use a trick.
                // Actually, I can pass a body param `action: 'callback'`.

                // Let's use `fetch` to be precise with the URL.
                const { data: sessionData } = await supabase.auth.getSession();
                const token = sessionData.session?.access_token;

                const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-identity/callback`;

                const response = await fetch(functionUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ worker_id: user.id, code })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Verification failed');
                }

                await refreshProfile();
                setStatus('success');
                setMessage("Identity verified successfully!");

                // Auto redirect after success
                setTimeout(() => {
                    navigate('/profile');
                }, 3000);

            } catch (err: any) {
                console.error(err);
                setStatus('error');
                setMessage(err.message || "An error occurred during verification.");
            }
        };

        verify();
    }, [searchParams, user, navigate, refreshProfile]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-center">Identity Verification</CardTitle>
                    <CardDescription className="text-center">Processing your DigiLocker response</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 py-8">
                    {status === 'loading' && (
                        <>
                            <Loader2 className="h-16 w-16 text-primary animate-spin" />
                            <p className="text-muted-foreground">{message}</p>
                        </>
                    )}
                    {status === 'success' && (
                        <>
                            <CheckCircle className="h-16 w-16 text-green-500" />
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-semibold text-green-600">Verified!</h3>
                                <p className="text-muted-foreground">{message}</p>
                                <p className="text-xs">Redirecting to profile...</p>
                            </div>
                            <Button onClick={() => navigate('/profile')}>Return to Profile</Button>
                        </>
                    )}
                    {status === 'error' && (
                        <>
                            <XCircle className="h-16 w-16 text-destructive" />
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-semibold text-destructive">Verification Failed</h3>
                                <p className="text-muted-foreground">{message}</p>
                            </div>
                            <Button onClick={() => navigate('/profile')}>Back to Profile</Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
