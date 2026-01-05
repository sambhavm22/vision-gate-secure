
import { supabase } from "@vision-gate/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, ScrollArea } from "@vision-gate/ui";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Notification {
    id: string;
    title: string;
    message: string;
    priority: string;
    is_read: boolean;
    created_at: string;
}

interface NotificationsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
}

export function NotificationsDialog({ open, onOpenChange, userId }: NotificationsDialogProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && userId) {
            fetchNotifications();
        }
    }, [open, userId]);

    const fetchNotifications = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (!error && data) {
            setNotifications(data);
        }
        setLoading(false);
    };

    const markAsRead = async (notification: Notification) => {
        if (notification.is_read) return;

        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );

        await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", notification.id);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Notifications</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No notifications</p>
                    ) : (
                        <div className="space-y-4">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => markAsRead(notification)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${notification.is_read
                                            ? "bg-background border-border"
                                            : "bg-primary/5 border-primary/20 hover:bg-primary/10"
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`text-sm font-semibold ${!notification.is_read ? "text-primary" : ""}`}>
                                            {notification.title}
                                        </h4>
                                        {!notification.is_read && (
                                            <span className="h-2 w-2 rounded-full bg-primary" />
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                                    <p className="text-xs text-muted-foreground/60">
                                        {format(new Date(notification.created_at), "MMM d, h:mm a")}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
