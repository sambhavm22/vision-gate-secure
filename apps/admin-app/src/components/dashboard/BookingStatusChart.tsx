import { Card, CardContent, CardHeader, CardTitle } from "@vision-gate/ui";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface BookingStatusChartProps {
    data: { name: string; value: number; color: string }[];
}

export function BookingStatusChart({ data }: BookingStatusChartProps) {
    return (
        <Card className="col-span-4 lg:col-span-1"> {/* Takes up less width */}
            <CardHeader>
                <CardTitle>Booking Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                            No booking data.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
