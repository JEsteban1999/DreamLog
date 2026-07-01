import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface Slice {
  mood: string;
  count: number;
}

const COLORS = ["#7c3aed", "#2563eb", "#0891b2", "#16a34a", "#ca8a04", "#dc2626", "#64748b"];

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
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">Aún no hay suficientes registros completos.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="mood"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          label={(entry) => MOOD_LABELS[entry.mood] ?? entry.mood}
        >
          {data.map((entry, i) => (
            <Cell key={entry.mood} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number, _name, item) => [value, MOOD_LABELS[item.payload.mood] ?? item.payload.mood]} />
        <Legend formatter={(value: string) => MOOD_LABELS[value] ?? value} />
      </PieChart>
    </ResponsiveContainer>
  );
}
