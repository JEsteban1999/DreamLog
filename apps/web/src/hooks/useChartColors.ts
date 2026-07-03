import { useUIStore } from "../store/ui.store";

export interface ChartColors {
  cool: string;
  warm: string;
  success: string;
  danger: string;
  faint: string;
  gridline: string;
  heat: [string, string, string, string, string];
  /** paleta categórica (donut de ánimo, etc.) */
  categorical: string[];
}

const DARK: ChartColors = {
  cool: "#8ca0ff",
  warm: "#f7b27a",
  success: "#5fd3a3",
  danger: "#f08a8a",
  faint: "#6e7794",
  gridline: "#212a44",
  heat: ["#1a2138", "#39406b", "#6e7ce8", "#e89a5c", "#f7c77a"],
  categorical: ["#f7b27a", "#5fd3a3", "#8ca0ff", "#6e7794", "#f08a8a", "#c084fc", "#5eead4"],
};

const LIGHT: ChartColors = {
  cool: "#5b67d8",
  warm: "#d98246",
  success: "#0e9f6e",
  danger: "#e05555",
  faint: "#8a90a8",
  gridline: "#edeff6",
  heat: ["#edeff6", "#c7cef2", "#8c9aee", "#f0b27a", "#ee9a4c"],
  categorical: ["#d98246", "#0e9f6e", "#5b67d8", "#8a90a8", "#e05555", "#9333ea", "#0d9488"],
};

/** Colores de gráficas que siguen el tema activo (reactivo al toggle). */
export function useChartColors(): ChartColors {
  const isDark = useUIStore((s) => s.isDark);
  return isDark ? DARK : LIGHT;
}
