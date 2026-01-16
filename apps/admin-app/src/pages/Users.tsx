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
import { format } from "date-fns";
import { Ban, Calendar, Mail, MoreHorizontal, Phone, Search, UserCheck, UserX } from "lucide-react";
import { useEffect, useState } from "react";

export default function Users() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const { toast } = useToast();

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error) setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUpdateUser = async (id: string, updates: any, actionName: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const user = users.find(u => u.id === id);
        if (!user) return;

        const { error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", id);

        if (!error) {
            await supabase.from("admin_audit_logs").insert({
                admin_id: session.user.id,
                action: `user_${actionName}`,
                entity_type: "user",
                entity_id: id,
                old_data: { status: user.status },
                new_data: updates,
                reason: `Admin manual update: ${actionName}`
            });
            toast({ title: "Updated", description: `User account ${actionName} successfully.` });
            fetchUsers();
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "blocked": return "bg-red-100 text-red-800 border-red-200";
            case "suspended": return "bg-orange-100 text-orange-800 border-orange-200";
            default: return "bg-green-100 text-green-800 border-green-200";
        }
    };

    const filtered = users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">User Management</h2>
                    <p className="text-muted-foreground">Manage customer accounts and access</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
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
                            <TableHead>Customer</TableHead>
                            <TableHead>Contact Info</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8">Loading users...</TableCell></TableRow>
                        ) : filtered.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="font-semibold">{user.full_name || "Anonymous User"}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-xs">
                                            <Mail className="h-3 w-3 text-muted-foreground" /> {user.email}
                                        </div>
                                        {user.phone && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <Phone className="h-3 w-3 text-muted-foreground" /> {user.phone}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn("capitalize border text-[10px]", getStatusBadge(user.status))}>
                                        {user.status || "active"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-xs">
                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                        {user.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : "N/A"}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Account Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { status: "active" }, "activate")}>
                                                <UserCheck className="h-4 w-4 mr-2 text-green-600" /> Mark Active
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { status: "suspended" }, "suspend")}>
                                                <UserX className="h-4 w-4 mr-2 text-orange-600" /> Suspend Account
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive font-bold" onClick={() => handleUpdateUser(user.id, { status: "blocked" }, "block")}>
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
