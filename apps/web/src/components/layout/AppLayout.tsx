import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/log", label: "Registro" },
  { to: "/chat", label: "Chat IA" },
  { to: "/reports", label: "Reportes" },
  { to: "/settings", label: "Ajustes" },
];

export function AppLayout() {
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <div className="min-h-svh bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-6xl">
        <aside className="hidden w-56 shrink-0 border-r border-slate-200 p-4 dark:border-slate-800 sm:block">
          <h1 className="mb-6 text-lg font-semibold">🌙 DreamLog</h1>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-6 w-full rounded-md px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            Cerrar sesión
          </button>
        </aside>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
