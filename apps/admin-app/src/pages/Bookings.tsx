import { supabase } from "@vision-gate/supabase/client";
import {
    Badge,
    Button,
    cn,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Textarea,
    useToast
} from "@vision-gate/ui";
import { format, isBefore, parseISO, startOfDay, subDays } from "date-fns";
import { AlertCircle, MoreHorizontal, Search, UserPlus, UserRoundCheck } from "lucide-react";
import { useEffect, useState } from "react";

type DateFilter = "today" | "7d" | "30d" | "all";
type StatusFilter = "all" | "pending" | "assigned" | "completed" | "cancelled";

export default function Bookings() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState<DateFilter>("7d");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const { toast } = useToast();

    // Dialog states
    const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState("");

    const [reassignBooking, setReassignBooking] = useState<any | null>(null);
    const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");

    const fetchData = async () => {
        setLoading(true);
        const [bookingsRes, workersRes] = await Promise.all([
            supabase.from("bookings").select(`
        *,
        customer:customer_id(full_name, email),
        worker:worker_id(full_name),
        service:service_id(name)
      `).order("scheduled_at", { ascending: false }),
            supabase.from("workers_public").select("id, full_name, is_online, service_types")
        ]);

        if (!bookingsRes.error) setBookings(bookingsRes.data);
        if (!workersRes.error) setWorkers(workersRes.data);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
            case "cancelled": return "bg-red-100 text-red-800 border-red-200";
            case "matched":
            case "assigned":
            case "accepted": return "bg-blue-100 text-blue-800 border-blue-200";
            case "pending":
            case "searching":
            case "requested": return "bg-amber-100 text-amber-800 border-amber-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const isUnassigned = (booking: any) => !booking.worker_id && !['completed', 'cancelled'].includes(booking.status);

    const isLate = (booking: any) => {
        if (!booking.scheduled_at) return false;
        const scheduledTime = parseISO(booking.scheduled_at);
        return isBefore(scheduledTime, new Date()) && !['completed', 'cancelled', 'in_progress'].includes(booking.status);
    };

    const handleStatusChange = async (id: string, newStatus: string, reason: string = "Admin manual update") => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const booking = bookings.find(b => b.id === id);
        if (!booking) return;

        const { error: updateError } = await supabase
            .from("bookings")
            .update({ status: newStatus })
            .eq("id", id);

        if (!updateError) {
            await supabase.from("admin_audit_logs").insert({
                admin_id: session.user.id,
                action: "status_change",
                entity_type: "booking",
                entity_id: id,
                old_data: { status: booking.status },
                new_data: { status: newStatus },
                reason: reason
            });

            toast({ title: "Status Updated", description: `Booking is now ${newStatus}.` });
            fetchData();
        }
    };

    const handleCancelConfirm = async () => {
        if (!cancelBookingId || !cancelReason) return;
        await handleStatusChange(cancelBookingId, "cancelled", cancelReason);
        setCancelBookingId(null);
        setCancelReason("");
    };

    const handleReassign = async () => {
        if (!reassignBooking || !selectedWorkerId) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { error } = await supabase
            .from("bookings")
            .update({ worker_id: selectedWorkerId, status: "matched" })
            .eq("id", reassignBooking.id);

        if (!error) {
            await supabase.from("admin_audit_logs").insert({
                admin_id: session.user.id,
                action: reassignBooking.worker_id ? "worker_reassign" : "worker_assign",
                entity_type: "booking",
                entity_id: reassignBooking.id,
                old_data: { worker_id: reassignBooking.worker_id },
                new_data: { worker_id: selectedWorkerId },
                reason: "Admin manual assignment"
            });
            toast({ title: "Worker Assigned", description: "Worker has been manually updated." });
            setReassignBooking(null);
            fetchData();
        }
    };

    // Apply filters
    const filteredBookings = bookings.filter(b => {
        // Search filter
        const matchesSearch = b.customer?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            b.service?.name?.toLowerCase().includes(search.toLowerCase()) ||
            b.status?.includes(search.toLowerCase());

        // Date filter
        let matchesDate = true;
        if (dateFilter !== "all" && b.scheduled_at) {
            const scheduledDate = parseISO(b.scheduled_at);
            const today = startOfDay(new Date());
            if (dateFilter === "today") matchesDate = scheduledDate >= today;
            else if (dateFilter === "7d") matchesDate = scheduledDate >= subDays(today, 7);
            else if (dateFilter === "30d") matchesDate = scheduledDate >= subDays(today, 30);
        }

        // Status filter
        let matchesStatus = true;
        if (statusFilter !== "all") {
            if (statusFilter === "pending") matchesStatus = ['pending', 'searching', 'requested'].includes(b.status);
            else if (statusFilter === "assigned") matchesStatus = ['assigned', 'matched', 'accepted', 'in_progress'].includes(b.status);
            else matchesStatus = b.status === statusFilter;
        }

        return matchesSearch && matchesDate && matchesStatus;
    });

    // Count for quick stats
    const unassignedCount = bookings.filter(isUnassigned).length;
    const lateCount = bookings.filter(isLate).length;

    // Filter eligible workers based on service skill
    const eligibleWorkers = reassignBooking
        ? workers.filter(w =>
            // Include worker if they have the skill OR if it's the already assigned worker
            (w.service_types && w.service_types.includes(reassignBooking.service.name)) ||
            w.id === reassignBooking.worker_id
        ).sort((a, b) => (b.is_online === a.is_online) ? 0 : b.is_online ? 1 : -1)
        : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Booking Management</h2>
                    <p className="text-muted-foreground">Monitor and manage all service requests</p>
                </div>
                <Button onClick={fetchData} variant="outline" className="gap-2">
                    Refresh
                </Button>
            </div>

            {/* Quick Alerts */}
            {(unassignedCount > 0 || lateCount > 0) && (
                <div className="flex flex-wrap gap-2">
                    {unassignedCount > 0 && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 cursor-pointer" onClick={() => setStatusFilter("pending")}>
                            <AlertCircle className="h-3 w-3" />
                            {unassignedCount} Unassigned
                        </Badge>
                    )}
                    {lateCount > 0 && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {lateCount} Overdue
                        </Badge>
                    )}
                </div>
            )}

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search customers, services..."
                        className="pl-10 h-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="7d">Last 7 Days</SelectItem>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-xl bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Scheduled At</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Worker</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && bookings.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-8">Loading bookings...</TableCell></TableRow>
                        ) : filteredBookings.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No bookings found matching your filters.</TableCell></TableRow>
                        ) : filteredBookings.map((booking) => (
                            <TableRow
                                key={booking.id}
                                className={cn(
                                    isUnassigned(booking) && "bg-amber-50 dark:bg-amber-950/20",
                                    isLate(booking) && "bg-red-50 dark:bg-red-950/20"
                                )}
                            >
                                <TableCell className="font-medium">
                                    {format(new Date(booking.scheduled_at), "MMM d, HH:mm")}
                                    {isLate(booking) && <span className="ml-1 text-xs text-red-500">(Late)</span>}
                                </TableCell>
                                <TableCell>
                                    <div className="font-semibold">{booking.customer?.full_name}</div>
                                    <div className="text-xs text-muted-foreground">{booking.customer?.email}</div>
                                </TableCell>
                                <TableCell>{booking.service?.name}</TableCell>
                                <TableCell>
                                    {booking.worker?.full_name || <span className="text-amber-600 italic font-medium">Unassigned</span>}
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn("capitalize border text-[10px]", getStatusColor(booking.status))}>
                                        {booking.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>₹{booking.total_amount}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleStatusChange(booking.id, "matched")}>Mark Matched</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleStatusChange(booking.id, "completed")}>Mark Completed</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                setReassignBooking(booking);
                                                setSelectedWorkerId(booking.worker_id || "");
                                            }}>
                                                {booking.worker_id ? (
                                                    <>
                                                        <UserRoundCheck className="h-4 w-4 mr-2" /> Reassign Worker
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus className="h-4 w-4 mr-2" /> Assign Worker
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive font-bold" onClick={() => setCancelBookingId(booking.id)}>
                                                Cancel Booking
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Cancellation Dialog */}
            <Dialog open={!!cancelBookingId} onOpenChange={(open) => !open && setCancelBookingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Booking</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for cancelling this booking. This action will be logged.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="e.g., Worker unavailable, User requested cancellation..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelBookingId(null)}>Back</Button>
                        <Button variant="destructive" disabled={!cancelReason} onClick={handleCancelConfirm}>Confirm Cancellation</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign/Reassign Dialog */}
            <Dialog open={!!reassignBooking} onOpenChange={(open) => !open && setReassignBooking(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{reassignBooking?.worker_id ? "Reassign Worker" : "Assign Worker"}</DialogTitle>
                        <DialogDescription>
                            Select a qualified worker for <strong>{reassignBooking?.service?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Worker</label>
                            <Select onValueChange={setSelectedWorkerId} value={selectedWorkerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a worker" />
                                </SelectTrigger>
                                <SelectContent>
                                    {eligibleWorkers.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground text-center">No workers with matching skill</div>
                                    ) : (
                                        eligibleWorkers.map(w => (
                                            <SelectItem key={w.id} value={w.id}>
                                                <div className="flex items-center w-full justify-between gap-4">
                                                    <span>{w.full_name}</span>
                                                    {!w.is_online && <span className="text-xs text-muted-foreground">(Offline)</span>}
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReassignBooking(null)}>Cancel</Button>
                        <Button disabled={!selectedWorkerId} onClick={handleReassign}>
                            {reassignBooking?.worker_id ? "Reassign" : "Assign"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
