import type { TooltipProps } from "recharts";

// Estilo de tooltip compartido — usa CSS vars para seguir el tema.
export const chartTooltip: Partial<TooltipProps<number, string>> = {
  cursor: { stroke: "var(--border)", strokeWidth: 1 },
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    fontSize: 12,
    color: "var(--fg)",
    boxShadow: "0 6px 20px rgba(0,0,0,.18)",
  },
  labelStyle: { color: "var(--fg2)", marginBottom: 2 },
  itemStyle: { color: "var(--fg)" },
};
