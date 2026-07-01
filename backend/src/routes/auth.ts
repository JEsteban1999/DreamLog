import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_ANON_KEY ?? "");

export const authRoutes = new Hono();

// Registro público desactivado en fase personal (single-user).
authRoutes.post("/register", async (c) => {
  return c.json({ error: "Registro deshabilitado en esta fase" }, 403);
});

authRoutes.post("/login", async (c) => {
  const { email, password } = await c.req.json();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return c.json({ error: error.message }, 401);
  return c.json(data);
});

authRoutes.post("/logout", async (c) => {
  const { error } = await supabase.auth.signOut();
  if (error) return c.json({ error: error.message }, 400);
  return c.body(null, 204);
});

authRoutes.post("/refresh", async (c) => {
  const { refresh_token } = await c.req.json();
  const { data, error } = await supabase.auth.refreshSession({ refresh_token });
  if (error) return c.json({ error: error.message }, 401);
  return c.json(data);
});

authRoutes.post("/forgot-password", async (c) => {
  const { email } = await c.req.json();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) return c.json({ error: error.message }, 400);
  return c.body(null, 204);
});
