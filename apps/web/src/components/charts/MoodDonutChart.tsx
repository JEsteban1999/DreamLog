import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useChartColors } from "../../hooks/useChartColors";
import { chartTooltip } from "./tooltip";

interface Slice {
  mood: string;
  count: number;
}

const MOOD_LABELS: Record<string, string> = {
  rested: "Descansado",
  neutral: "Neutral",
  groggy: "Aturdido",
  anxious: "Ansioso",
  happy: "Feliz",
  sad: "Triste",
  irritable: "Irritable",
};

export function MoodDonutChart({ data }: { data: Slice[] }) {
  const c = useChartColors();

  if (data.length === 0) {
    return <p className="text-sm text-faint">Aún no hay suficientes registros completos.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="mood" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((entry, i) => (
            <Cell key={entry.mood} fill={c.categorical[i % c.categorical.length]} stroke="var(--card)" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          {...chartTooltip}
          formatter={(value: number, _name, item) => [value, MOOD_LABELS[item.payload.mood] ?? item.payload.mood]}
        />
        <Legend
          formatter={(value: string) => (
            <span style={{ color: "var(--fg2)", fontSize: 12 }}>{MOOD_LABELS[value] ?? value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
