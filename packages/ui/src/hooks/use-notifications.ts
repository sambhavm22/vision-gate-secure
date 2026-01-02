import { supabase } from "@vision-gate/supabase/client";
import { useEffect } from 'react';
import { useToast } from "./use-toast";

export function useNotifications(userId: string | undefined) {
    const { toast } = useToast();

    useEffect(() => {
        if (!userId) return;

        console.log("Subscribing to notifications for user:", userId);

        const channel = supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const newNotification = payload.new;
                    console.log("New notification received:", newNotification);

                    toast({
                        title: newNotification.title || "New Notification",
                        description: newNotification.message,
                        variant: "default",
                    });
                }
            )
            .subscribe((status) => {
                console.log(`Notification subscription status for ${userId}:`, status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, toast]);
}
