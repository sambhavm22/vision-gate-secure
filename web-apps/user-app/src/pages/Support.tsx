import { supabase } from "@vision-gate/supabase/client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, useToast } from "@vision-gate/ui";
import { ArrowLeft, Send, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Support = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        mobile: "",
        email: "",
        category: "Booking issue",
        description: ""
    });

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                setFormData(prev => ({
                    ...prev,
                    name: user.user_metadata?.full_name || "",
                    email: user.email || ""
                }));
            }
        };
        checkUser();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const removeFile = () => {
        setFile(null);
        setPreviewUrl(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let attachment_url = null;

            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user?.id || 'anonymous'}/${Date.now()}.${fileExt}`;
                const { data, error: uploadError } = await supabase.storage
                    .from('support-attachments')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('support-attachments')
                    .getPublicUrl(fileName);

                attachment_url = publicUrl;
            }

            const { data, error } = await (supabase
                .from('support_tickets') as any)
                .insert([{
                    ...formData,
                    user_id: user?.id || null,
                    attachment_url
                }])
                .select()
                .single();

            if (error) throw error;
            const ticketData = data as any;

            // Trigger email notification
            if (ticketData) {
                try {
                    await supabase.functions.invoke('send-support-email', {
                        body: {
                            ticketId: ticketData.id,
                            name: formData.name,
                            email: formData.email,
                            mobile: formData.mobile,
                            category: formData.category,
                            description: formData.description,
                            attachmentUrl: attachment_url
                        }
                    });
                } catch (emailError) {
                    console.error("Failed to send support email notification:", emailError);
                    // We don't throw here because the ticket is already saved in DB
                }
            }

            toast({
                title: "Ticket Submitted",
                description: "We've received your inquiry. We'll get back to you soon!",
            });

            // Redirect back to profile after a short delay
            setTimeout(() => navigate("/profile"), 2000);

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to submit ticket",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background p-4 md:p-6 font-sans">
            <div className="max-w-2xl mx-auto space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/profile")}
                    className="hover:bg-transparent pl-0"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Profile
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Customer Support</CardTitle>
                        <p className="text-muted-foreground">How can we help you today?</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Name</label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Mobile</label>
                                    <Input
                                        required
                                        value={formData.mobile}
                                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                        placeholder="Your mobile number"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Your email address"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Issue Category</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option>Booking issue</option>
                                    <option>Payment issue</option>
                                    <option>Worker-related issue</option>
                                    <option>App not working / technical issue</option>
                                    <option>Account & login issue</option>
                                    <option>Refund / cancellation</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Issue Description</label>
                                <textarea
                                    required
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Please describe your issue in detail..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Attachment (Photo/Video)</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <Input
                                            type="file"
                                            accept="image/*,video/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="support-file-upload"
                                        />
                                        <label
                                            htmlFor="support-file-upload"
                                            className="flex items-center gap-2 cursor-pointer bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md transition-colors"
                                        >
                                            <Upload className="h-4 w-4" />
                                            Upload File
                                        </label>
                                    </div>
                                    {previewUrl && (
                                        <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-border">
                                            {file?.type.startsWith('image/') ? (
                                                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full bg-slate-200 flex items-center justify-center">
                                                    <Upload className="h-4 w-4 text-slate-400" />
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={removeFile}
                                                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:scale-110 transition-transform"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Submitting..." : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Submit Ticket
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Support;
