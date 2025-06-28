import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Card, CardHeader, CardContent, CardTitle } from "./card";
import { TooltipProps } from "recharts";

interface ChartAreaGroupBetsProps {
  data: { name: string; wagered: number; payout: number }[];
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    const wagered = payload.find(p => p.dataKey === "wagered")?.value;
    const payout = payload.find(p => p.dataKey === "payout")?.value;
    return (
      <div className="rounded-md border bg-white dark:bg-zinc-900 p-3 shadow-md min-w-[160px]">
        <div className="font-semibold mb-1">{label}</div>
        <div className="flex items-center justify-between text-sm mb-0.5">
          <span className="text-muted-foreground">Wagered:</span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">${wagered}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Payout:</span>
          <span className="font-medium text-orange-500 dark:text-orange-300">${payout}</span>
        </div>
      </div>
    );
  }
  return null;
}

export function ChartAreaGroupBets({ data }: ChartAreaGroupBetsProps) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6", opacity: 0.3 }} />
          <Legend />
          <Bar dataKey="wagered" fill="#10b981" name="Wagered" radius={[4, 4, 0, 0]} />
          <Bar dataKey="payout" fill="#f59e42" name="Payout" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
