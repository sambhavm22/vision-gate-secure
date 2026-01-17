import { supabase } from "@vision-gate/supabase/client";
import { format, isAfter, isBefore, parseISO, startOfDay, subDays } from "date-fns";
import { useEffect, useState } from "react";

export type DateRange = "today" | "7d" | "30d" | "all";

export interface NeedsAttentionItem {
    id: string;
    type: "unassigned" | "late" | "cancelled";
    title: string;
    description: string;
    createdAt: string;
}

export interface RecentActivityItem {
    id: string;
    type: "booking" | "cancellation" | "completion";
    customerName: string;
    serviceName: string;
    createdAt: string;
    status: string;
}

export interface DashboardStats {
    totalRevenue: number;
    totalBookings: number;
    activeWorkers: number;
    completionRate: number;
    pendingJobs: number;
    revenueTrend: { date: string; amount: number }[];
    bookingStatus: { name: string; value: number; color: string }[];
    topServices: { name: string; value: number }[];
    areaDistribution: { name: string; value: number }[];
    needsAttention: NeedsAttentionItem[];
    recentActivity: RecentActivityItem[];
}

export function useDashboardData(range: DateRange) {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                // Calculate start date based on range
                let startDate: Date | null = null;
                const today = new Date();

                if (range === "today") startDate = startOfDay(today);
                else if (range === "7d") startDate = subDays(today, 7);
                else if (range === "30d") startDate = subDays(today, 30);

                // Fetch raw data
                const [bookingsResponse, workersResponse] = await Promise.all([
                    supabase.from("bookings").select("*, profiles(full_name)").order("created_at", { ascending: false }),
                    supabase.from("workers_public").select("*"),
                ]);

                if (bookingsResponse.error) throw bookingsResponse.error;
                if (workersResponse.error) throw workersResponse.error;

                const allBookings = bookingsResponse.data || [];
                const allWorkers = workersResponse.data || [];

                // Filter data based on date range
                const filteredBookings = startDate
                    ? allBookings.filter(b => b.created_at && isAfter(parseISO(b.created_at), startDate))
                    : allBookings;

                // 1. KPIs
                const totalRevenue = filteredBookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
                const totalBookings = filteredBookings.length;
                const activeWorkers = allWorkers.filter(w => w.is_online).length;
                const completedBookings = filteredBookings.filter(b => b.status === 'completed').length;
                const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
                const pendingJobs = filteredBookings.filter(b =>
                    b.status === 'pending' || b.status === 'searching' || !b.worker_id
                ).length;

                // 2. Revenue Trend (Daily)
                const revenueMap = new Map<string, number>();
                filteredBookings.forEach(b => {
                    if (!b.created_at) return;
                    const dateKey = format(parseISO(b.created_at), "yyyy-MM-dd");
                    const amount = Number(b.total_amount) || 0;
                    revenueMap.set(dateKey, (revenueMap.get(dateKey) || 0) + amount);
                });
                const revenueTrend = Array.from(revenueMap.entries())
                    .map(([date, amount]) => ({ date, amount }))
                    .sort((a, b) => a.date.localeCompare(b.date));

                // 3. Booking Status Distribution
                const statusCounts = filteredBookings.reduce((acc, b) => {
                    const status = b.status || 'unknown';
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const bookingStatus = [
                    { name: "Completed", value: statusCounts['completed'] || 0, color: "#10B981" },
                    { name: "Pending", value: (statusCounts['pending'] || 0) + (statusCounts['searching'] || 0), color: "#F59E0B" },
                    { name: "Cancelled", value: statusCounts['cancelled'] || 0, color: "#EF4444" },
                    { name: "In Progress", value: (statusCounts['accepted'] || 0) + (statusCounts['assigned'] || 0) + (statusCounts['in_progress'] || 0), color: "#3B82F6" }
                ].filter(item => item.value > 0);

                // 4. Top Services
                const serviceCounts = filteredBookings.reduce((acc, b) => {
                    const service = b.service_name || "Unknown";
                    acc[service] = (acc[service] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const topServices = Object.entries(serviceCounts)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);

                // 5. Area Distribution
                const areaCounts = filteredBookings.reduce((acc, b) => {
                    const area = b.city || b.postal_code || "Unknown";
                    acc[area] = (acc[area] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const areaDistribution = Object.entries(areaCounts)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);

                // 6. Needs Attention
                const needsAttention: NeedsAttentionItem[] = [];

                // Unassigned bookings
                const unassignedBookings = allBookings.filter(b =>
                    (b.status === 'pending' || b.status === 'searching') && !b.worker_id
                ).slice(0, 5);

                unassignedBookings.forEach(b => {
                    needsAttention.push({
                        id: b.id,
                        type: "unassigned",
                        title: "Unassigned Booking",
                        description: `${b.service_name} - ${(b.profiles as any)?.full_name || 'Customer'}`,
                        createdAt: b.created_at || ''
                    });
                });

                // Late bookings (scheduled time passed but not started)
                const lateBookings = allBookings.filter(b => {
                    if (!b.scheduled_at) return false;
                    const scheduledTime = parseISO(b.scheduled_at);
                    return isBefore(scheduledTime, today) &&
                        !['completed', 'cancelled', 'in_progress'].includes(b.status || '');
                }).slice(0, 5);

                lateBookings.forEach(b => {
                    needsAttention.push({
                        id: b.id,
                        type: "late",
                        title: "Overdue Job",
                        description: `${b.service_name} was scheduled for ${b.scheduled_at ? format(parseISO(b.scheduled_at), "MMM d") : 'unknown'}`,
                        createdAt: b.created_at || ''
                    });
                });

                // 7. Recent Activity
                const recentActivity: RecentActivityItem[] = [];

                // Last 10 bookings
                allBookings.slice(0, 10).forEach(b => {
                    recentActivity.push({
                        id: b.id,
                        type: b.status === 'cancelled' ? 'cancellation' : b.status === 'completed' ? 'completion' : 'booking',
                        customerName: (b.profiles as any)?.full_name || 'Unknown',
                        serviceName: b.service_name || 'Unknown',
                        createdAt: b.created_at || '',
                        status: b.status || 'unknown'
                    });
                });

                setStats({
                    totalRevenue,
                    totalBookings,
                    activeWorkers,
                    completionRate,
                    pendingJobs,
                    revenueTrend,
                    bookingStatus,
                    topServices,
                    areaDistribution,
                    needsAttention,
                    recentActivity
                });

            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [range]);

    return { stats, loading };
}
