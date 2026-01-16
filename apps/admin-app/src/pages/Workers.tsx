import { supabase } from "@vision-gate/supabase/client";
import {
    Badge,
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    Input,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    useToast
} from "@vision-gate/ui";
import { Ban, MoreHorizontal, Search, ShieldAlert, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { useEffect, useState } from "react";

export default function Workers() {
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const { toast } = useToast();

    const fetchWorkers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("workers_public")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error) setWorkers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchWorkers();
    }, []);

    const handleUpdateWorker = async (id: string, updates: any, actionName: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const worker = workers.find(w => w.id === id);
        if (!worker) return;

        const { error } = await supabase
            .from("workers_public")
            .update(updates)
            .eq("id", id);

        if (!error) {
            await supabase.from("admin_audit_logs").insert({
                admin_id: session.user.id,
                action: `worker_${actionName}`,
                entity_type: "worker",
                entity_id: id,
                old_data: updates.hasOwnProperty('status') ? { status: worker.status } : { is_verified: worker.is_verified },
                new_data: updates,
                reason: `Admin manual update: ${actionName}`
            });
            toast({ title: "Updated", description: `Worker ${actionName} successfully.` });
            fetchWorkers();
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "blocked": return "bg-red-100 text-red-800 border-red-200";
            case "suspended": return "bg-orange-100 text-orange-800 border-orange-200";
            default: return "bg-green-100 text-green-800 border-green-200";
        }
    };

    const filtered = workers.filter(w =>
        w.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        w.bio?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Worker Management</h2>
                    <p className="text-muted-foreground">Approve and monitor service partners</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search workers..."
                        className="pl-10 h-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-xl bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Worker</TableHead>
                            <TableHead>Services</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Verification</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && workers.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8">Loading workers...</TableCell></TableRow>
                        ) : filtered.map((worker) => (
                            <TableRow key={worker.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary italic">
                                            {worker.full_name ? worker.full_name[0] : "?"}
                                        </div>
                                        <div>
                                            <div className="font-semibold">{worker.full_name}</div>
                                            <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{worker.bio}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {worker.service_types?.slice(0, 2).map((s: string) => (
                                            <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                                        ))}
                                        {(worker.service_types?.length > 2) && <Badge variant="outline" className="text-[10px]">+{worker.service_types.length - 2}</Badge>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 font-bold">
                                        {worker.rating} ★
                                        <span className="text-[10px] font-normal text-muted-foreground">({worker.total_reviews || 0})</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {worker.is_verified ? (
                                        <Badge className="bg-green-50 text-green-700 border-green-200 gap-1">
                                            <ShieldCheck className="h-3 w-3" /> Verified
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-orange-600 border-orange-200">Pending</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn("capitalize border text-[10px]", getStatusBadge(worker.status))}>
                                        {worker.status || "active"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Management</DropdownMenuLabel>
                                            {!worker.is_verified ? (
                                                <DropdownMenuItem onClick={() => handleUpdateWorker(worker.id, { is_verified: true }, "verify")}>
                                                    <ShieldCheck className="h-4 w-4 mr-2" /> Approve Worker
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem onClick={() => handleUpdateWorker(worker.id, { is_verified: false }, "unverify")}>
                                                    <ShieldAlert className="h-4 w-4 mr-2" /> Unverify
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel>Account Status</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleUpdateWorker(worker.id, { status: "active" }, "activate")}>
                                                <UserCheck className="h-4 w-4 mr-2 text-green-600" /> Mark Active
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleUpdateWorker(worker.id, { status: "suspended" }, "suspend")}>
                                                <UserX className="h-4 w-4 mr-2 text-orange-600" /> Suspend
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive font-bold" onClick={() => handleUpdateWorker(worker.id, { status: "blocked" }, "block")}>
                                                <Ban className="h-4 w-4 mr-2" /> Block Forever
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
