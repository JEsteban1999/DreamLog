import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { useUIStore } from "../../store/ui.store";
import { Logo } from "../Logo";

const NAV_ITEMS = [
  { to: "/", label: "Inicio", icon: "🏠", end: true },
  { to: "/log", label: "Historial", icon: "📖", end: true },
  { to: "/log/new", label: "Registro", icon: "🌙", end: false },
  { to: "/chat", label: "Chat", icon: "💬", end: false },
  { to: "/reports", label: "Reportes", icon: "📊", end: false },
  { to: "/settings", label: "Ajustes", icon: "⚙️", end: false },
];

// Tabs de la barra inferior en mobile (Ajustes vive en la barra superior).
const MOBILE_TABS = [
  { to: "/", label: "Inicio", icon: "🏠", end: true },
  { to: "/log", label: "Historial", icon: "📖", end: true },
  { to: "/chat", label: "Chat", icon: "💬", end: false },
  { to: "/reports", label: "Reportes", icon: "📊", end: false },
];

function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { isDark, toggleDark } = useUIStore();

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleDark}
        title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        className="rounded-full border border-hairsoft bg-card2 p-2 text-sm"
      >
        {isDark ? "☀️" : "🌙"}
      </button>
    );
  }

  return (
    <div className="flex gap-1.5 rounded-full border border-hairsoft bg-card2 p-1">
      <button
        type="button"
        onClick={() => isDark || toggleDark()}
        className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition ${
          isDark ? "bg-card text-ink shadow-sm" : "text-faint"
        }`}
      >
        🌙 Oscuro
      </button>
      <button
        type="button"
        onClick={() => isDark && toggleDark()}
        className={`flex-1 rounded-full py-1.5 text-xs font-medium transition ${
          !isDark ? "bg-card text-ink shadow-sm" : "text-faint"
        }`}
      >
        ☀️ Claro
      </button>
    </div>
  );
}

export function AppLayout() {
  const signOut = useAuthStore((s) => s.signOut);
  const session = useAuthStore((s) => s.session);
  const navigate = useNavigate();

  const email = session?.user?.email ?? "";
  const initial = (email[0] ?? "?").toUpperCase();

  return (
    <div className="min-h-svh bg-canvas text-ink">
      {/* Barra superior — solo mobile */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-hairsoft bg-panel/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2.5">
          <Logo size={24} />
          <span className="font-serif text-lg font-semibold tracking-tight">DreamLog</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <NavLink
            to="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-warmsoft text-sm font-semibold text-warm"
          >
            {initial}
          </NavLink>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl">
        {/* Sidebar — desde md */}
        <aside className="sticky top-0 hidden h-svh w-[236px] shrink-0 flex-col gap-6 border-r border-hairsoft bg-panel p-4 md:flex">
          <div className="flex items-center gap-2.5 px-1.5">
            <Logo />
            <span className="font-serif text-xl font-semibold tracking-tight">DreamLog</span>
          </div>

          <ThemeToggle />

          <nav className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition ${
                    isActive
                      ? "bg-coolsoft font-semibold text-ink"
                      : "font-medium text-muted hover:bg-card2 hover:text-ink"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute bottom-2.5 left-0 top-2.5 w-[3px] rounded-full bg-cool" />
                    )}
                    <span className="text-[15px]">{item.icon}</span>
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto flex items-center gap-2.5 rounded-xl border border-hairsoft p-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warmsoft text-[13px] font-semibold text-warm">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-semibold leading-tight">{email || "Mi cuenta"}</div>
              <button
                type="button"
                onClick={() => signOut()}
                className="text-[11px] text-faint hover:text-danger"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-7">
          <Outlet />
        </main>
      </div>

      {/* Bottom tab bar — solo mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-end justify-between border-t border-hairsoft bg-panel px-3 pb-5 pt-2.5 md:hidden">
        {MOBILE_TABS.slice(0, 2).map((tab) => (
          <MobileTab key={tab.to} {...tab} />
        ))}
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={() => navigate("/log/new")}
            className="-mt-8 flex h-14 w-14 flex-col items-center justify-center rounded-full border-4 border-canvas bg-primary text-primaryfg shadow-lg shadow-primary/40"
          >
            <span className="text-xl leading-none">🌙</span>
            <span className="mt-0.5 text-[8px] font-bold">Noche</span>
          </button>
        </div>
        {MOBILE_TABS.slice(2).map((tab) => (
          <MobileTab key={tab.to} {...tab} />
        ))}
      </nav>
    </div>
  );
}

function MobileTab({ to, label, icon, end }: { to: string; label: string; icon: string; end: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-0.5 ${isActive ? "text-cool" : "text-faint"}`
      }
    >
      {({ isActive }) => (
        <>
          <span className="text-[19px]">{icon}</span>
          <span className={`text-[9.5px] ${isActive ? "font-semibold" : ""}`}>{label}</span>
        </>
      )}
    </NavLink>
  );
}
