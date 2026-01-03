import { useAuth } from "@/context/AuthContext";
import { supabase } from "@vision-gate/supabase/client";
import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    useToast
} from "@vision-gate/ui";
import { cn } from "@vision-gate/ui/utils";
import {
    addDays,
    addMonths,
    addWeeks,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    isToday as isTodayDate,
    startOfMonth,
    startOfWeek,
    subDays,
    subMonths,
    subWeeks
} from "date-fns";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    MoreHorizontal
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

type ViewType = 'day' | 'week' | 'month';

export default function CalendarPage() {
    const { workerProfile } = useAuth();
    const { t } = useTranslation();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<ViewType>('month');
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

    const fetchBookings = async () => {
        if (!workerProfile) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("bookings")
                .select(`
                    *,
                    service:services(name),
                    address:addresses(address_line1, city)
                `)
                .eq("worker_id", workerProfile.id)
                .neq("status", "requested")
                .gte("scheduled_at", new Date().toISOString())
                .order("scheduled_at", { ascending: true });

            if (error) throw error;
            setBookings(data || []);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Fetch error", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!workerProfile) return;
        fetchBookings();

        const channel = supabase
            .channel('calendar-sync')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'bookings',
                filter: `worker_id=eq.${workerProfile.id}`
            }, () => {
                fetchBookings();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [workerProfile]);

    const navigateDate = (direction: 'prev' | 'next') => {
        if (view === 'day') {
            setCurrentDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
        } else if (view === 'week') {
            setCurrentDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
        } else {
            setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
        }
    };

    const days = useMemo(() => {
        if (view === 'month') {
            const start = startOfWeek(startOfMonth(currentDate));
            const end = endOfWeek(endOfMonth(currentDate));
            const arr = [];
            let curr = start;
            while (curr <= end) {
                arr.push(new Date(curr));
                curr = addDays(curr, 1);
            }
            return arr;
        } else if (view === 'week') {
            const start = startOfWeek(currentDate);
            return Array.from({ length: 7 }, (_, i) => addDays(start, i));
        } else {
            return [currentDate];
        }
    }, [currentDate, view]);

    if (!workerProfile) return null;

    return (
        <div className="flex flex-col h-screen bg-[#020617] text-slate-100 selection:bg-primary/30 font-sans">
            {/* Main Navigation Header */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-[#020617] z-30">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-slate-400 hover:text-white hover:bg-slate-800">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <CalendarIcon className="h-5 w-5 text-slate-400" />
                        <h1 className="text-xl font-bold tracking-tight text-white">
                            {format(currentDate, 'MMMM yyyy')}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCurrentDate(new Date())}
                        className="bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 h-9 px-4"
                    >
                        Today
                    </Button>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                            onClick={() => navigateDate('prev')}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                            onClick={() => navigateDate('next')}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* View Switching Bar */}
            <div className="py-3 px-6 bg-[#020617] border-b border-slate-800 flex justify-center">
                <div className="bg-[#0f172a] p-1 rounded-xl border border-slate-800 flex pointer-events-auto">
                    {(['day', 'week', 'month'] as ViewType[]).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={cn(
                                "px-8 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 capitalize",
                                view === v
                                    ? "bg-[#1e293b] text-white shadow-lg"
                                    : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {/* Calendar Grid Body */}
            <main className="flex-1 overflow-auto bg-[#020617] relative">
                {view === 'month' ? (
                    <div className="h-full min-w-[800px] flex flex-col p-4">
                        {/* Weekday Names */}
                        <div className="grid grid-cols-7 mb-2">
                            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                                <div key={d} className="py-2 text-center text-[10px] font-bold text-slate-500 tracking-[0.2em]">
                                    {d}
                                </div>
                            ))}
                        </div>
                        {/* Days Grid */}
                        <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-px bg-slate-800 rounded-xl overflow-hidden border border-slate-800">
                            {days.map((date, idx) => {
                                const dateBookings = bookings.filter(b => isSameDay(new Date(b.scheduled_at), date));
                                const isCurrentMonth = isSameMonth(date, currentDate);
                                const isToday = isTodayDate(date);

                                return (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "min-h-[120px] bg-[#020617] p-3 transition-colors hover:bg-slate-900/50 relative group",
                                            !isCurrentMonth && "opacity-40"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={cn(
                                                "text-sm font-semibold h-7 w-7 flex items-center justify-center rounded-full transition-colors",
                                                isToday ? "bg-emerald-500 text-[#020617]" : "text-slate-400 group-hover:text-white"
                                            )}>
                                                {format(date, 'd')}
                                            </span>
                                            {dateBookings.length > 0 && <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                                        </div>
                                        <div className="space-y-1.5 max-h-[80px] overflow-y-auto custom-scrollbar pr-1">
                                            {dateBookings.map(b => (
                                                <div
                                                    key={b.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedBooking(b);
                                                    }}
                                                    className="px-2 py-1 bg-primary/20 hover:bg-primary/30 border border-primary/20 rounded-md cursor-pointer transition-all duration-200 group/pill"
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] text-white font-medium whitespace-nowrap">
                                                            {format(new Date(b.scheduled_at), 'p')}
                                                        </span>
                                                        <span className="text-[10px] text-slate-300 truncate font-normal">
                                                            {b.service?.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
                        {days.map((day, idx) => {
                            const dateBookings = bookings.filter(b => isSameDay(new Date(b.scheduled_at), day));

                            return (
                                <section key={idx} className="relative">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className={cn(
                                            "flex flex-col items-center justify-center min-w-[60px] h-[60px] rounded-xl border transition-all duration-300",
                                            isTodayDate(day)
                                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                                                : "bg-slate-800/30 border-slate-800 text-slate-400"
                                        )}>
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{format(day, 'EEE')}</span>
                                            <span className="text-xl font-black">{format(day, 'd')}</span>
                                        </div>
                                        <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
                                    </div>

                                    {dateBookings.length === 0 ? (
                                        <div className="ml-20 py-8 text-slate-600 italic text-sm border-l-2 border-dashed border-slate-800 pl-8">
                                            No jobs scheduled for this day
                                        </div>
                                    ) : (
                                        <div className="ml-20 space-y-4 relative border-l-2 border-slate-800 pl-8 pb-4">
                                            {dateBookings.map(b => (
                                                <div
                                                    key={b.id}
                                                    onClick={() => setSelectedBooking(b)}
                                                    className="group relative bg-[#0f172a] border border-slate-800 p-5 rounded-2xl hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.99]"
                                                >
                                                    <div className="absolute left-[-41px] top-6 w-5 h-5 rounded-full border-4 border-[#020617] bg-primary z-10 scale-0 group-hover:scale-100 transition-transform duration-300" />

                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-3">
                                                                <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                                                                    {b.service?.name}
                                                                </h3>
                                                                <span className={cn(
                                                                    "px-3 py-0.5 rounded-full text-[10px] font-bold tracking-tighter uppercase",
                                                                    b.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                                                                )}>
                                                                    {b.status}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="h-4 w-4 text-primary" />
                                                                    <span>{format(new Date(b.scheduled_at), 'p')} <span className="opacity-50">• {b.duration_minutes}m</span></span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin className="h-4 w-4 text-emerald-500" />
                                                                    <span className="max-w-[200px] truncate">{b.address?.address_line1}, {b.address?.city}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xl font-black text-emerald-400 tracking-tight">₹{b.total_amount}</div>
                                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Payout</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Booking Detail Dialog - Styled Dark Mode */}
            <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
                <DialogContent className="sm:max-w-md bg-[#0f172a] border-slate-800 text-slate-100 p-0 overflow-hidden rounded-3xl">
                    <div className="bg-primary/10 p-6 pb-20 relative">
                        <div
                            className="inline-flex items-center justify-center font-bold px-3 py-0.5 rounded-full text-[10px] bg-primary/20 border-primary/30 text-primary uppercase tracking-widest mb-3"
                        >
                            Booking Details
                        </div>
                        <DialogTitle className="text-3xl font-black tracking-tight text-white leading-tight">
                            {selectedBooking?.service?.name}
                        </DialogTitle>
                        <div className="absolute top-6 right-6 h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-white">
                            <Clock className="h-6 w-6 opacity-50" />
                        </div>
                    </div>

                    <div className="bg-[#0f172a] p-8 -mt-10 rounded-t-[40px] relative z-10">
                        {selectedBooking && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-y-6">
                                    <DetailItem label="Scheduled Date" value={format(new Date(selectedBooking.scheduled_at), 'PPPP')} />
                                    <DetailItem label="Start Time" value={format(new Date(selectedBooking.scheduled_at), 'p')} />
                                    <DetailItem label="Total Duration" value={`${selectedBooking.duration_minutes} minutes`} />
                                    <DetailItem label="Estimated Payout" value={`₹${selectedBooking.total_amount}`} className="text-emerald-400 font-black" />
                                </div>

                                <div className="pt-6 border-t border-slate-800">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Service Location</p>
                                    <div className="flex gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-800/50 flex items-center justify-center text-emerald-400 flex-shrink-0">
                                            <MapPin className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white leading-tight">{selectedBooking.address?.address_line1}</p>
                                            <p className="text-sm text-slate-400 mt-1">{selectedBooking.address?.city}</p>
                                        </div>
                                    </div>
                                </div>

                                {selectedBooking.notes && (
                                    <div className="pt-6 border-t border-slate-800">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Customer Notes</p>
                                        <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800 italic text-slate-300 text-sm leading-relaxed">
                                            "{selectedBooking.notes}"
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 flex gap-3">
                                    <Button className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 font-bold" onClick={() => setSelectedBooking(null)}>
                                        Go Back
                                    </Button>
                                    <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-800 bg-transparent text-white" onClick={() => setSelectedBooking(null)}>
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function DetailItem({ label, value, className = "" }: { label: string, value: string, className?: string }) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
            <p className={cn("text-base font-semibold text-slate-200", className)}>{value}</p>
        </div>
    );
}
