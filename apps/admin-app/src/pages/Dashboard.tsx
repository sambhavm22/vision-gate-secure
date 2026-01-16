import { supabase } from "@vision-gate/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@vision-gate/ui";
import { CalendarDays, TrendingUp, UserRound, Users } from "lucide-react";
import { useEffect, useState } from "react";

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalWorkers: 0,
        totalBookings: 0,
        todaysBookings: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const [
                { count: users },
                { count: workers },
                { count: bookings },
                { count: todays }
            ] = await Promise.all([
                supabase.from("profiles").select("*", { count: "exact", head: true }),
                supabase.from("workers_public").select("*", { count: "exact", head: true }),
                supabase.from("bookings").select("*", { count: "exact", head: true }),
                supabase.from("bookings").select("*", { count: "exact", head: true })
                    .gte("scheduled_at", today.toISOString())
                    .lt("scheduled_at", tomorrow.toISOString())
            ]);

            setStats({
                totalUsers: users || 0,
                totalWorkers: workers || 0,
                totalBookings: bookings || 0,
                todaysBookings: todays || 0
            });
            setLoading(false);
        }
        fetchStats();
    }, []);

    const statCards = [
        { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600" },
        { title: "Total Workers", value: stats.totalWorkers, icon: UserRound, color: "text-green-600" },
        { title: "Total Bookings", value: stats.totalBookings, icon: CalendarDays, color: "text-purple-600" },
        { title: "Today's Bookings", value: stats.todaysBookings, icon: TrendingUp, color: "text-orange-600" },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-black tracking-tight">Admin Overview</h2>
                <p className="text-muted-foreground">Real-time performance metrics</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className={cn("h-4 w-4", stat.color)} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {loading ? "..." : stat.value.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// Utility to merge classes
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
