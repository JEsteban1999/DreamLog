import { Hono } from "hono";
import { checkAndSendReminders } from "../services/notification.service.js";

export const internalRoutes = new Hono();

internalRoutes.post("/notifications/check", async (c) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token || token !== process.env.CRON_SECRET) {
    return c.json({ error: "No autorizado" }, 401);
  }

  await checkAndSendReminders();
  return c.json({ ok: true });
});
