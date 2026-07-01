import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Point {
  date: string;
  duration: number;
}

export function DurationBarChart({ data, goalHours }: { data: Point[]; goalHours: number }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">Aún no hay suficientes registros completos.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <ReferenceLine y={goalHours} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Objetivo", fontSize: 12 }} />
        <Bar dataKey="duration" fill="#7c3aed" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
