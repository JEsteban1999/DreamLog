import { create } from "zustand";

interface UIState {
  isDark: boolean;
  toggleDark: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isDark: true,
  toggleDark: () => set((s) => ({ isDark: !s.isDark })),
}));
