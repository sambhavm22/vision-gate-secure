import { supabase } from "@vision-gate/supabase/client";
import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Input,
    useToast
} from "@vision-gate/ui";
import React, { useState } from "react"; // Added React import for event types
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            if (session) {
                // Check if user is admin
                const { data: admin, error: adminError } = await supabase
                    .from("admin_users")
                    .select("role")
                    .eq("id", session.user.id)
                    .single();

                if (adminError || !admin) {
                    await supabase.auth.signOut();
                    toast({
                        title: "Unauthorized",
                        description: "You do not have admin access.",
                        variant: "destructive",
                    });
                } else {
                    toast({ title: "Welcome Admin", description: "Successfully logged in." });
                    navigate("/");
                }
            }
        } catch (error: any) {
            toast({
                title: "Login Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-black text-primary">HelperHub Admin</CardTitle>
                    <CardDescription>Enter your credentials to access the dashboard</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                placeholder="admin@helperhub.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full h-11 text-lg font-bold" type="submit" disabled={loading}>
                            {loading ? "Logging in..." : "Login to Dashboard"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
