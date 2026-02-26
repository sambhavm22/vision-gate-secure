import { Card, CardContent, CardHeader, CardTitle, cn } from "@vision-gate/ui";
import { AlertTriangle, Clock, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NeedsAttentionItem } from "../../hooks/useDashboardData";

interface NeedsAttentionPanelProps {
    items: NeedsAttentionItem[];
    loading: boolean;
}

export function NeedsAttentionPanel({ items, loading }: NeedsAttentionPanelProps) {
    const navigate = useNavigate();

    const getIcon = (type: string) => {
        switch (type) {
            case "unassigned": return <UserX className="h-4 w-4" />;
            case "late": return <Clock className="h-4 w-4" />;
            default: return <AlertTriangle className="h-4 w-4" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case "unassigned": return "text-amber-500 bg-amber-500/10";
            case "late": return "text-red-500 bg-red-500/10";
            default: return "text-orange-500 bg-orange-500/10";
        }
    };

    const handleClick = (item: NeedsAttentionItem) => {
        // Navigate to bookings with filter
        navigate(`/bookings?status=${item.type === 'unassigned' ? 'pending' : 'all'}`);
    };

    if (loading) {
        return (
            <Card className="border-amber-500/30 bg-amber-500/5">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Needs Attention
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (items.length === 0) {
        return (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-emerald-600">
                        ✓ All Good
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No issues requiring your attention right now.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Needs Attention
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                        {items.length} issue{items.length !== 1 ? 's' : ''}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => handleClick(item)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                        <div className={cn("p-2 rounded-full", getColor(item.type))}>
                            {getIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
