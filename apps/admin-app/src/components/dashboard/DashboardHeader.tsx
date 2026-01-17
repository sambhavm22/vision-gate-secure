import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@vision-gate/ui";
import { DateRange } from "../../hooks/useDashboardData";

interface DashboardHeaderProps {
    dateRange: DateRange;
    setDateRange: (range: DateRange) => void;
}

export function DashboardHeader({ dateRange, setDateRange }: DashboardHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h2 className="text-3xl font-black tracking-tight text-foreground">Admin Overview</h2>
                <p className="text-muted-foreground">Real-time performance metrics & business analytics</p>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden md:inline-block">Time Range:</span>
                <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select Range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="7d">Last 7 Days</SelectItem>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
