import { Badge, Card, CardContent, CardHeader, CardTitle, cn } from "@vision-gate/ui";
import { format, parseISO } from "date-fns";
import { RecentActivityItem } from "../../hooks/useDashboardData";

interface RecentActivityProps {
    items: RecentActivityItem[];
    loading: boolean;
}

export function RecentActivity({ items, loading }: RecentActivityProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "bg-emerald-500/10 text-emerald-600";
            case "cancelled": return "bg-red-500/10 text-red-600";
            case "pending":
            case "searching": return "bg-amber-500/10 text-amber-600";
            case "assigned":
            case "accepted":
            case "in_progress": return "bg-blue-500/10 text-blue-600";
            default: return "bg-muted text-muted-foreground";
        }
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    if (loading) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (items.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No recent activity to show.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
                {items.slice(0, 8).map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {item.serviceName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {item.customerName} • {item.createdAt ? format(parseISO(item.createdAt), "MMM d, h:mm a") : ''}
                            </p>
                        </div>
                        <Badge variant="outline" className={cn("text-xs shrink-0 ml-2", getStatusColor(item.status))}>
                            {formatStatus(item.status)}
                        </Badge>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
