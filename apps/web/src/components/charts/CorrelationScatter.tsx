import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { useChartColors } from "../../hooks/useChartColors";
import { chartTooltip } from "./tooltip";

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
  const c = useChartColors();

  if (data.length === 0) {
    return <p className="text-sm text-faint">Aún no hay suficientes registros completos.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ScatterChart margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 5" stroke={c.gridline} />
        <XAxis type="number" dataKey="x" name={xLabel} tick={{ fontSize: 11, fill: c.faint }} stroke={c.gridline} />
        <YAxis
          type="number"
          dataKey="y"
          name={yLabel}
          domain={[0, 10]}
          tick={{ fontSize: 11, fill: c.faint }}
          stroke={c.gridline}
        />
        <Tooltip {...chartTooltip} cursor={{ strokeDasharray: "3 3", stroke: c.gridline }} />
        <Scatter data={data} fill={c.cool} fillOpacity={0.8} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
