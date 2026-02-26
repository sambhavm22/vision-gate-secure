import { supabase } from "@vision-gate/supabase/client";
import { format, parseISO, startOfDay, subDays } from "date-fns";
import { useEffect, useRef, useState } from "react";

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
    // Simple in-memory cache
    const cache = useRef<Record<string, DashboardStats>>({});

    useEffect(() => {
        async function fetchData() {
            // Check cache first
            if (cache.current[range]) {
                setStats(cache.current[range]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const today = new Date();
                let startDate: Date | null = null;

                if (range === "today") startDate = startOfDay(today);
                else if (range === "7d") startDate = subDays(today, 7);
                else if (range === "30d") startDate = subDays(today, 30);

                // 1. Fetch Stats Data (Filtered by Date)
                let query = supabase
                    .from("bookings")
                    .select("id, created_at, total_amount, status, services(name), addresses(city, postal_code), profiles(full_name)")
                    .order("created_at", { ascending: false });

                if (startDate) {
                    query = query.gte("created_at", startDate.toISOString());
                }

                // 2. Fetch Active Workers Count (Optimized)
                const workersQuery = supabase
                    .from("workers_public")
                    .select("*", { count: "exact", head: true })
                    .eq("is_online", true);

                // 3. Fetch Unassigned Bookings (Needs Attention - Global)
                const unassignedQuery = supabase
                    .from("bookings")
                    .select("id, created_at, services(name), profiles(full_name)")
                    .in("status", ["pending", "searching"])
                    .is("worker_id", null)
                    .order("created_at", { ascending: false })
                    .limit(5);

                // 4. Fetch Late Bookings (Needs Attention - Global)
                const lateQuery = supabase
                    .from("bookings")
                    .select("id, created_at, services(name), scheduled_at")
                    .lt("scheduled_at", today.toISOString())
                    .not("status", "in", ["completed", "cancelled", "in_progress"])
                    .order("scheduled_at", { ascending: true }) // Oldest first (most overdue)
                    .limit(5);

                // 5. Fetch Recent Activity (Global)
                const recentQuery = supabase
                    .from("bookings")
                    .select("id, created_at, status, services(name), profiles(full_name)")
                    .order("created_at", { ascending: false })
                    .limit(10);

                const [statsRes, workersRes, unassignedRes, lateRes, recentRes] = await Promise.all([
                    query,
                    workersQuery,
                    unassignedQuery,
                    lateQuery,
                    recentQuery
                ]);

                if (statsRes.error) throw statsRes.error;

                const filteredBookings = statsRes.data || [];
                const activeWorkersCount = workersRes.count || 0;
                const unassignedList = unassignedRes.data || [];
                const lateList = lateRes.data || [];
                const recentList = recentRes.data || [];

                // --- Calculate Derived Stats from filteredBookings ---

                // KPIs
                const totalRevenue = filteredBookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
                const totalBookings = filteredBookings.length;
                const completedBookings = filteredBookings.filter(b => b.status === "completed").length;
                const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
                // Pending jobs in the current view
                const pendingJobs = filteredBookings.filter(b =>
                    b.status === "pending" || b.status === "searching" || !(b as any).worker_id
                ).length;

                // Revenue Trend
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

                // Booking Status Distribution
                const statusCounts = filteredBookings.reduce((acc, b) => {
                    const status = b.status || "unknown";
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const bookingStatus = [
                    { name: "Completed", value: statusCounts["completed"] || 0, color: "#10B981" },
                    { name: "Pending", value: (statusCounts["pending"] || 0) + (statusCounts["searching"] || 0), color: "#F59E0B" },
                    { name: "Cancelled", value: statusCounts["cancelled"] || 0, color: "#EF4444" },
                    { name: "In Progress", value: (statusCounts["accepted"] || 0) + (statusCounts["assigned"] || 0) + (statusCounts["in_progress"] || 0), color: "#3B82F6" }
                ].filter(item => item.value > 0);

                // Top Services
                const serviceCounts = filteredBookings.reduce((acc, b: any) => {
                    // Use nested service name
                    const service = b.services?.name || "Unknown";
                    acc[service] = (acc[service] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const topServices = Object.entries(serviceCounts)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);

                // Area Distribution
                const areaCounts = filteredBookings.reduce((acc, b: any) => {
                    // Use nested address city/postal_code
                    const area = b.addresses?.city || b.addresses?.postal_code || "Unknown";
                    acc[area] = (acc[area] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const areaDistribution = Object.entries(areaCounts)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);

                // Build Needs Attention List
                const needsAttention: NeedsAttentionItem[] = [];

                unassignedList.forEach((b: any) => {
                    needsAttention.push({
                        id: b.id,
                        type: "unassigned",
                        title: "Unassigned Booking",
                        description: `${b.services?.name || "Service"} - ${(b.profiles as any)?.full_name || "Customer"}`,
                        createdAt: b.created_at || ""
                    });
                });

                lateList.forEach((b: any) => {
                    needsAttention.push({
                        id: b.id,
                        type: "late",
                        title: "Overdue Job",
                        description: `${b.services?.name || "Job"} scheduled for ${b.scheduled_at ? format(parseISO(b.scheduled_at), "MMM d") : "unknown"}`,
                        createdAt: b.created_at || ""
                    });
                });

                // Recent Activity
                let recentActivityItems: RecentActivityItem[] = [];
                recentList.forEach((b: any) => {
                    recentActivityItems.push({
                        id: b.id,
                        type: b.status === "cancelled" ? "cancellation" : b.status === "completed" ? "completion" : "booking",
                        customerName: (b.profiles as any)?.full_name || "Unknown",
                        serviceName: b.services?.name || "Unknown",
                        createdAt: b.created_at || "",
                        status: b.status || "unknown"
                    });
                });

                const newStats = {
                    totalRevenue,
                    totalBookings,
                    activeWorkers: activeWorkersCount,
                    completionRate,
                    pendingJobs,
                    revenueTrend,
                    bookingStatus,
                    topServices,
                    areaDistribution,
                    needsAttention,
                    recentActivity: recentActivityItems
                };

                // Update cache
                cache.current[range] = newStats;
                setStats(newStats);

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
