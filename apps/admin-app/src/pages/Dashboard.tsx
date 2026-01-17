import { useState } from "react";
import { AreaDistributionChart } from "../components/dashboard/AreaDistributionChart";
import { BookingStatusChart } from "../components/dashboard/BookingStatusChart";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { NeedsAttentionPanel } from "../components/dashboard/NeedsAttentionPanel";
import { RecentActivity } from "../components/dashboard/RecentActivity";
import { RevenueChart } from "../components/dashboard/RevenueChart";
import { StatsCards } from "../components/dashboard/StatsCards";
import { TopServicesChart } from "../components/dashboard/TopServicesChart";
import { DateRange, useDashboardData } from "../hooks/useDashboardData";

export default function Dashboard() {
    const [dateRange, setDateRange] = useState<DateRange>("7d");
    const { stats, loading } = useDashboardData(dateRange);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <DashboardHeader dateRange={dateRange} setDateRange={setDateRange} />

            {/* KPI Cards */}
            <StatsCards stats={stats} loading={loading} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Revenue Chart (Spans 3 cols on desktop) */}
                <RevenueChart data={stats?.revenueTrend || []} />

                {/* Booking Status Pie Chart (Spans 1 col) */}
                <BookingStatusChart data={stats?.bookingStatus || []} />
            </div>

            {/* Secondary Row: Alerts + Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Needs Attention Panel */}
                <NeedsAttentionPanel items={stats?.needsAttention || []} loading={loading} />

                {/* Top Services Chart */}
                <TopServicesChart data={stats?.topServices || []} />

                {/* Area Distribution Chart */}
                <AreaDistributionChart data={stats?.areaDistribution || []} />
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentActivity items={stats?.recentActivity || []} loading={loading} />
            </div>
        </div>
    );
}
