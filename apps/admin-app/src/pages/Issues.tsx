import { Card, CardContent, CardHeader, CardTitle } from "@vision-gate/ui";
import { Construction } from "lucide-react";

export default function Issues() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-black tracking-tight">Issues & Support</h2>
                <p className="text-muted-foreground">Manage customer and worker support requests</p>
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
                        Support ticket management features will be available in a future update.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
