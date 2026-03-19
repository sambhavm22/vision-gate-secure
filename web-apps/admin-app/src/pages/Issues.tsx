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
    useToast,
} from "@vision-gate/ui";
import { format } from "date-fns";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Eye,
    MessageSquare,
    Search,
    Send,
    Shield,
    XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type StatusFilter = "all" | "open" | "in_review" | "resolved" | "rejected";

interface Dispute {
    id: string;
    booking_id: string;
    user_id: string;
    worker_id: string | null;
    raised_by: string;
    raised_by_role: string;
    issue_type: string;
    description: string;
    evidence_urls: string[];
    status: string;
    resolution_note: string | null;
    created_at: string;
    updated_at: string;
    user?: { full_name: string; email: string } | null;
    worker?: { full_name: string } | null;
    booking?: { scheduled_at: string; total_amount: number; service?: { name: string } } | null;
}

interface Message {
    id: string;
    dispute_id: string;
    sender_id: string;
    sender_role: string;
    message: string;
    attachments: string[];
    created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof Clock }> = {
    open: { label: "Open", className: "bg-amber-100 text-amber-800 border-amber-200", icon: AlertCircle },
    in_review: { label: "In Review", className: "bg-blue-100 text-blue-800 border-blue-200", icon: Eye },
    resolved: { label: "Resolved", className: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

const ISSUE_LABELS: Record<string, string> = {
    payment: "💳 Payment",
    service_quality: "⭐ Service Quality",
    no_show: "🚫 No Show",
    damage: "🔨 Damage",
    other: "📝 Other",
};

export default function Issues() {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [resolutionNote, setResolutionNote] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [sendingMsg, setSendingMsg] = useState(false);
    const [saving, setSaving] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const fetchDisputes = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("disputes")
            .select(`
                *,
                user:user_id(full_name, email),
                worker:worker_id(full_name),
                booking:booking_id(scheduled_at, total_amount, service:service_id(name))
            `)
            .order("created_at", { ascending: false });

        if (!error && data) setDisputes(data as any);
        setLoading(false);
    }, []);

    useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

    // Real-time updates
    useEffect(() => {
        const channel = supabase
            .channel("admin-disputes-rt")
            .on("postgres_changes", { event: "*", schema: "public", table: "disputes" }, () => fetchDisputes())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchDisputes]);

    const fetchMessages = useCallback(async (disputeId: string) => {
        const { data } = await supabase
            .from("support_messages")
            .select("*")
            .eq("dispute_id", disputeId)
            .order("created_at", { ascending: true });
        setMessages(data || []);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }, []);

    const openDispute = useCallback((dispute: Dispute) => {
        setSelectedDispute(dispute);
        setNewStatus(dispute.status);
        setResolutionNote(dispute.resolution_note || "");
        fetchMessages(dispute.id);
    }, [fetchMessages]);

    // Real-time chat
    useEffect(() => {
        if (!selectedDispute) return;
        const channel = supabase
            .channel(`admin-chat-${selectedDispute.id}`)
            .on("postgres_changes", {
                event: "INSERT", schema: "public", table: "support_messages",
                filter: `dispute_id=eq.${selectedDispute.id}`,
            }, (payload) => {
                const msg = payload.new as Message;
                setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [selectedDispute?.id]);

    const handleSendMessage = async () => {
        const text = newMessage.trim();
        if (!text || !selectedDispute) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        setSendingMsg(true);
        setNewMessage("");
        const { error } = await supabase.from("support_messages").insert({
            dispute_id: selectedDispute.id,
            sender_id: session.user.id,
            sender_role: "admin",
            message: text,
            attachments: [],
        });
        if (error) { setNewMessage(text); toast({ title: "Error", description: error.message, variant: "destructive" }); }
        setSendingMsg(false);
    };

    const handleSaveResolution = async () => {
        if (!selectedDispute) return;
        setSaving(true);
        const { error } = await supabase
            .from("disputes")
            .update({ status: newStatus, resolution_note: resolutionNote || null })
            .eq("id", selectedDispute.id);

        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Dispute Updated", description: `Status changed to ${newStatus}.` });
            setSelectedDispute(prev => prev ? { ...prev, status: newStatus, resolution_note: resolutionNote } : null);
            fetchDisputes();
        }
        setSaving(false);
    };

    const filtered = disputes.filter(d => {
        const matchesStatus = statusFilter === "all" || d.status === statusFilter;
        const matchesSearch = !search ||
            d.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            d.worker?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            d.issue_type.includes(search.toLowerCase()) ||
            d.id.includes(search);
        return matchesStatus && matchesSearch;
    });

    const counts = {
        all: disputes.length,
        open: disputes.filter(d => d.status === "open").length,
        in_review: disputes.filter(d => d.status === "in_review").length,
        resolved: disputes.filter(d => d.status === "resolved").length,
        rejected: disputes.filter(d => d.status === "rejected").length,
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Disputes & Support</h2>
                    <p className="text-muted-foreground">Manage customer and worker dispute cases</p>
                </div>
                <Button onClick={fetchDisputes} variant="outline">Refresh</Button>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-2 flex-wrap">
                {(["all", "open", "in_review", "resolved", "rejected"] as StatusFilter[]).map(s => {
                    const cfg = STATUS_CONFIG[s] || { label: "All", className: "bg-muted text-muted-foreground" };
                    return (
                        <Button
                            key={s}
                            variant={statusFilter === s ? "default" : "outline"}
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setStatusFilter(s)}
                        >
                            {s === "all" ? "All" : cfg.label}
                            <span className="text-xs opacity-70">({counts[s]})</span>
                        </Button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by user, worker, issue..." className="pl-10 h-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Table */}
            <div className="border rounded-xl bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Issue</TableHead>
                            <TableHead>Raised By</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Worker</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-8">Loading disputes...</TableCell></TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No disputes found.</TableCell></TableRow>
                        ) : filtered.map(d => {
                            const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.open;
                            const StatusIcon = cfg.icon;
                            return (
                                <TableRow key={d.id} className={cn(d.status === "open" && "bg-amber-50/50 dark:bg-amber-950/10")}>
                                    <TableCell>
                                        <div className="font-semibold text-sm">{ISSUE_LABELS[d.issue_type] || d.issue_type}</div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{d.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px] capitalize">{d.raised_by_role}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{d.user?.full_name || "—"}</TableCell>
                                    <TableCell className="text-sm">{d.worker?.full_name || "—"}</TableCell>
                                    <TableCell>
                                        <Badge className={cn("capitalize border text-[10px] gap-1", cfg.className)}>
                                            <StatusIcon className="h-3 w-3" />{cfg.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(d.created_at), "MMM d, HH:mm")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => openDispute(d)} className="gap-1">
                                            <MessageSquare className="h-4 w-4" /> View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Dispute Detail Dialog */}
            <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Dispute Details
                        </DialogTitle>
                        <DialogDescription>
                            {selectedDispute && `${ISSUE_LABELS[selectedDispute.issue_type]} — #${selectedDispute.id.slice(0, 8)}`}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedDispute && (
                        <div className="flex-1 overflow-auto space-y-4 pr-1">
                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-muted/50 rounded-lg p-3">
                                    <span className="text-muted-foreground">User</span>
                                    <p className="font-semibold">{selectedDispute.user?.full_name || "—"}</p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-3">
                                    <span className="text-muted-foreground">Worker</span>
                                    <p className="font-semibold">{selectedDispute.worker?.full_name || "—"}</p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-3">
                                    <span className="text-muted-foreground">Service</span>
                                    <p className="font-semibold">{(selectedDispute.booking as any)?.service?.name || "—"}</p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-3">
                                    <span className="text-muted-foreground">Amount</span>
                                    <p className="font-semibold">₹{(selectedDispute.booking as any)?.total_amount || 0}</p>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="bg-muted/30 rounded-lg p-3 text-sm">
                                <span className="text-muted-foreground text-xs font-medium block mb-1">Description</span>
                                <p>{selectedDispute.description}</p>
                            </div>

                            {/* Evidence */}
                            {selectedDispute.evidence_urls.length > 0 && (
                                <div>
                                    <span className="text-xs font-medium text-muted-foreground">Evidence</span>
                                    <div className="flex gap-2 mt-1 overflow-x-auto">
                                        {selectedDispute.evidence_urls.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                                <img src={url} alt={`Evidence ${i + 1}`} className="h-20 w-20 rounded-lg object-cover border hover:opacity-80 transition" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Admin Actions */}
                            <div className="border rounded-lg p-3 space-y-3">
                                <span className="text-xs font-bold flex items-center gap-1"><Shield className="h-3 w-3" /> Admin Actions</span>
                                <div className="flex items-center gap-3">
                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                        <SelectTrigger className="w-[160px]">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="in_review">In Review</SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button size="sm" onClick={handleSaveResolution} disabled={saving} className="gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        {saving ? "Saving..." : "Save"}
                                    </Button>
                                </div>
                                <Textarea
                                    placeholder="Add a resolution note for the customer/worker..."
                                    value={resolutionNote}
                                    onChange={e => setResolutionNote(e.target.value)}
                                    className="min-h-[60px] text-sm"
                                />
                            </div>

                            {/* Chat */}
                            <div className="border rounded-lg">
                                <div className="px-3 py-2 border-b bg-muted/30 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                    <MessageSquare className="h-3.5 w-3.5" /> Messages
                                </div>
                                <div className="max-h-[200px] overflow-auto p-3 space-y-2">
                                    {messages.length === 0 ? (
                                        <p className="text-center text-xs text-muted-foreground py-4">No messages yet</p>
                                    ) : messages.map(msg => (
                                        <div key={msg.id} className={cn("flex", msg.sender_role === "admin" ? "justify-end" : "justify-start")}>
                                            <div className={cn(
                                                "max-w-[75%] rounded-xl px-3 py-2 text-sm",
                                                msg.sender_role === "admin"
                                                    ? "bg-primary text-primary-foreground rounded-br-sm"
                                                    : msg.sender_role === "worker"
                                                        ? "bg-amber-100 dark:bg-amber-900/30 text-foreground rounded-bl-sm"
                                                        : "bg-muted rounded-bl-sm"
                                            )}>
                                                <span className="text-[10px] font-bold opacity-70 capitalize block">{msg.sender_role}</span>
                                                <p>{msg.message}</p>
                                                <span className="text-[10px] opacity-50 block text-right mt-0.5">
                                                    {format(new Date(msg.created_at), "HH:mm")}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>
                                <div className="flex gap-2 p-2 border-t">
                                    <Input
                                        placeholder="Message user/worker..."
                                        className="h-9 text-sm"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                                    />
                                    <Button size="sm" onClick={handleSendMessage} disabled={!newMessage.trim() || sendingMsg}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedDispute(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
