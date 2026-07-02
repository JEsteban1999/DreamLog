import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ExerciseComparisonChart({
  withExercise,
  withoutExercise,
}: {
  withExercise: number | null;
  withoutExercise: number | null;
}) {
  if (withExercise === null && withoutExercise === null) {
    return <p className="text-sm text-slate-500">Aún no hay suficientes registros completos.</p>;
  }

  const data = [
    { label: "Con ejercicio", quality: withExercise ?? 0 },
    { label: "Sin ejercicio", quality: withoutExercise ?? 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="quality" fill="#16a34a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
