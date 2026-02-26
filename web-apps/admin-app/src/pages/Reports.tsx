import { Card, CardContent, CardHeader, CardTitle } from "@vision-gate/ui";
import { Construction } from "lucide-react";

export default function Reports() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-black tracking-tight">Reports</h2>
                <p className="text-muted-foreground">Generate business performance reports</p>
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
                        Report generation and export features will be available in a future update.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
