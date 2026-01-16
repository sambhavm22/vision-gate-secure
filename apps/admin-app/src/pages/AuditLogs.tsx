import { supabase } from "@vision-gate/supabase/client";
import {
    Badge,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@vision-gate/ui";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function AuditLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("admin_audit_logs")
            .select(`
        *,
        admin:admin_id(id)
      `)
            .order("created_at", { ascending: false });

        if (!error) setLogs(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Audit Logs</h2>
                    <p className="text-muted-foreground">Trace all administrative actions and changes</p>
                </div>
                <Button onClick={fetchLogs} variant="outline">Refresh</Button>
            </div>

            <div className="border rounded-xl bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Admin ID</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead className="text-right">Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8">Loading logs...</TableCell></TableRow>
                        ) : logs.map((log) => (
                            <>
                                <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}>
                                    <TableCell className="text-xs font-mono">
                                        {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                                    </TableCell>
                                    <TableCell className="text-xs font-mono truncate max-w-[100px]">
                                        {log.admin_id?.split("-")[0]}...
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">{log.action.replace("_", " ")}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs font-semibold uppercase text-muted-foreground mr-1">{log.entity_type}:</span>
                                        <span className="text-xs font-mono">{log.entity_id.split("-")[0]}...</span>
                                    </TableCell>
                                    <TableCell className="text-sm max-w-[200px] truncate">{log.reason}</TableCell>
                                    <TableCell className="text-right">
                                        {expandedRow === log.id ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                                    </TableCell>
                                </TableRow>
                                {expandedRow === log.id && (
                                    <TableRow className="bg-muted/30">
                                        <TableCell colSpan={6} className="p-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-bold uppercase text-muted-foreground">Old Data</h4>
                                                    <pre className="text-[10px] bg-card p-2 rounded border overflow-auto max-h-[200px]">
                                                        {JSON.stringify(log.old_data, null, 2)}
                                                    </pre>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-bold uppercase text-muted-foreground">New Data</h4>
                                                    <pre className="text-[10px] bg-card p-2 rounded border overflow-auto max-h-[200px]">
                                                        {JSON.stringify(log.new_data, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
