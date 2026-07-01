import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="flex min-h-svh items-center justify-center text-sm text-slate-500">Cargando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
