import { Card, CardContent, CardHeader, CardTitle, cn, Skeleton } from "@vision-gate/ui";
import { AlertCircle, CalendarDays, DollarSign, TrendingUp, Users } from "lucide-react";

interface StatsCardsProps {
    stats: {
        totalRevenue: number;
        totalBookings: number;
        activeWorkers: number;
        completionRate: number;
        pendingJobs: number;
    } | null;
    loading: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
    const cards = [
        {
            title: "Total Revenue",
            value: stats ? `₹${stats.totalRevenue.toLocaleString()}` : "...",
            icon: DollarSign,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
        },
        {
            title: "Total Bookings",
            value: stats ? stats.totalBookings.toLocaleString() : "...",
            icon: CalendarDays,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
        },
        {
            title: "Active Workers",
            value: stats ? stats.activeWorkers.toLocaleString() : "...",
            icon: Users,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
        },
        {
            title: "Completion Rate",
            value: stats ? `${stats.completionRate.toFixed(1)}%` : "...",
            icon: TrendingUp,
            color: stats && stats.completionRate >= 80 ? "text-emerald-500" : stats && stats.completionRate >= 50 ? "text-amber-500" : "text-red-500",
            bgColor: stats && stats.completionRate >= 80 ? "bg-emerald-500/10" : stats && stats.completionRate >= 50 ? "bg-amber-500/10" : "bg-red-500/10",
        },
        {
            title: "Pending Jobs",
            value: stats ? stats.pendingJobs.toLocaleString() : "...",
            icon: AlertCircle,
            color: stats && stats.pendingJobs > 0 ? "text-amber-500" : "text-emerald-500",
            bgColor: stats && stats.pendingJobs > 0 ? "bg-amber-500/10" : "bg-emerald-500/10",
        },
    ];

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <Skeleton className="h-4 w-[80px]" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-[60px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {cards.map((card) => (
                <Card key={card.title} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                        <div className={cn("p-2 rounded-full", card.bgColor)}>
                            <card.icon className={cn("h-4 w-4", card.color)} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
