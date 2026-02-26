import { Card, CardContent, CardHeader, CardTitle } from "@vision-gate/ui";
import { Construction } from "lucide-react";

export default function Payments() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-black tracking-tight">Payments</h2>
                <p className="text-muted-foreground">Track and manage payment transactions</p>
            </div>

            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-muted-foreground">
                        <Construction className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Payment tracking and management features will be available in a future update.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
