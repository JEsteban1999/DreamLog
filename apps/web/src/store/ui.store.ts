import { create } from "zustand";

const STORAGE_KEY = "dreamlog-dark-mode";

function getInitialDark(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) return stored === "true";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyDarkClass(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
}

interface UIState {
  isDark: boolean;
  toggleDark: () => void;
}

const initialDark = getInitialDark();
applyDarkClass(initialDark);

export const useUIStore = create<UIState>((set, get) => ({
  isDark: initialDark,
  toggleDark: () => {
    const next = !get().isDark;
    localStorage.setItem(STORAGE_KEY, String(next));
    applyDarkClass(next);
    set({ isDark: next });
  },
}));
