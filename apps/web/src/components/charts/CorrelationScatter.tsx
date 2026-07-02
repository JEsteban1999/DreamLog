import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";

interface Point {
  x: number;
  y: number;
}

export function CorrelationScatter({
  data,
  xLabel,
  yLabel = "Calidad",
}: {
  data: Point[];
  xLabel: string;
  yLabel?: string;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">Aún no hay suficientes registros completos.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ScatterChart margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
        <XAxis type="number" dataKey="x" name={xLabel} tick={{ fontSize: 12 }} />
        <YAxis type="number" dataKey="y" name={yLabel} domain={[0, 10]} tick={{ fontSize: 12 }} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value: number) => value} />
        <Scatter data={data} fill="#7c3aed" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
