import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartColors } from "../../hooks/useChartColors";
import { chartTooltip } from "./tooltip";

export function ExerciseComparisonChart({
  withExercise,
  withoutExercise,
}: {
  withExercise: number | null;
  withoutExercise: number | null;
}) {
  const c = useChartColors();

  if (withExercise === null && withoutExercise === null) {
    return <p className="text-sm text-faint">Aún no hay suficientes registros completos.</p>;
  }

  const data = [
    { label: "✅ Con ejercicio", quality: withExercise ?? 0, fill: c.warm },
    { label: "Sin ejercicio", quality: withoutExercise ?? 0, fill: c.faint },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 5" stroke={c.gridline} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: c.faint }} stroke={c.gridline} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: c.faint }} stroke={c.gridline} />
        <Tooltip {...chartTooltip} cursor={{ fill: c.gridline, fillOpacity: 0.4 }} />
        <Bar dataKey="quality" name="Calidad" radius={[6, 6, 2, 2]}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
