import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-canvas text-sm text-faint">Cargando...</div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
