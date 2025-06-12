import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Card, CardHeader, CardContent, CardTitle } from "./card";

interface ChartAreaGroupBetsProps {
  data: { name: string; wagered: number; payout: number }[];
}

export function ChartAreaGroupBets({ data }: ChartAreaGroupBetsProps) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="wagered" fill="#10b981" name="Wagered" radius={[4, 4, 0, 0]} />
          <Bar dataKey="payout" fill="#f59e42" name="Payout" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
