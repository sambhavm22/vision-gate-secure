import { Card, CardContent, CardHeader, CardTitle } from "@vision-gate/ui";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface AreaDistributionChartProps {
    data: { name: string; value: number }[];
}

export function AreaDistributionChart({ data }: AreaDistributionChartProps) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle className="text-base">Bookings by Area</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={80}
                                    tick={{ fontSize: 11 }}
                                    interval={0}
                                    tickFormatter={(val) => val.length > 10 ? val.slice(0, 10) + '...' : val}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                            No area data yet.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
