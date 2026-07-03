import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartColors } from "../../hooks/useChartColors";
import { chartTooltip } from "./tooltip";

interface Point {
  date: string;
  duration: number;
}

export function DurationBarChart({ data, goalHours }: { data: Point[]; goalHours: number }) {
  const c = useChartColors();

  if (data.length === 0) {
    return <p className="text-sm text-faint">Aún no hay suficientes registros completos.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 5" stroke={c.gridline} vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: c.faint }} stroke={c.gridline} />
        <YAxis tick={{ fontSize: 11, fill: c.faint }} stroke={c.gridline} />
        <Tooltip {...chartTooltip} />
        <ReferenceLine
          y={goalHours}
          stroke={c.warm}
          strokeDasharray="6 5"
          strokeWidth={1.5}
          label={{ value: "Objetivo", fontSize: 11, fill: c.warm, position: "insideTopRight" }}
        />
        <Bar dataKey="duration" name="Horas" fill={c.cool} radius={[5, 5, 2, 2]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
