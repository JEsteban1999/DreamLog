import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartColors } from "../../hooks/useChartColors";
import { chartTooltip } from "./tooltip";

interface Point {
  date: string;
  quality: number;
}

export function QualityLineChart({ data }: { data: Point[] }) {
  const c = useChartColors();

  if (data.length === 0) {
    return <p className="text-sm text-faint">Aún no hay suficientes registros completos.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 5" stroke={c.gridline} vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: c.faint }} stroke={c.gridline} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: c.faint }} stroke={c.gridline} />
        <Tooltip {...chartTooltip} />
        <Line
          type="monotone"
          dataKey="quality"
          name="Calidad"
          stroke={c.warm}
          strokeWidth={2.5}
          dot={{ r: 2.5, fill: c.warm, strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
