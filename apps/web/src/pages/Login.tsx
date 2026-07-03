import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { Logo } from "../components/Logo";
import { btnPrimary, input, label } from "../lib/ui";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-canvas px-4 text-ink">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo size={44} />
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight">DreamLog</h1>
            <p className="mt-1 text-sm text-muted">Tu descanso, entendido.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-hair bg-card p-6">
          <label className={label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${input} mb-4`}
          />

          <label className={label} htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${input} mb-5`}
          />

          {error && <p className="mb-4 text-sm text-danger">{error}</p>}

          <button type="submit" disabled={submitting} className={`${btnPrimary} w-full`}>
            {submitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
