import type { Context, Next } from "hono";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../lib/prisma.js";

const supabase = createClient(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_SERVICE_ROLE_KEY ?? "");

export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "No autenticado" }, 401);
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return c.json({ error: "Token inválido" }, 401);
  }

  // El id del usuario en Supabase Auth es la fuente de verdad; se sincroniza
  // con la fila local en Postgres en cada request (costo despreciable a escala personal).
  await prisma.user.upsert({
    where: { id: data.user.id },
    update: {},
    create: { id: data.user.id, email: data.user.email ?? "" },
  });

  c.set("userId", data.user.id);
  await next();
}
