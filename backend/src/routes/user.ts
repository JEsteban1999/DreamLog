import { Hono } from "hono";
import { z } from "zod";
import { notificationSettingsSchema } from "@dreamlog/shared";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { toCsv } from "../lib/csv.js";
import * as sleepService from "../services/sleep.service.js";

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

type Variables = { userId: string };

export const userRoutes = new Hono<{ Variables: Variables }>();

userRoutes.use("*", requireAuth);

userRoutes.get("/profile", async (c) => {
  const userId = c.get("userId");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return c.json(user);
});

userRoutes.patch("/profile", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: body.name,
      timezone: body.timezone,
      goal_hours: body.goal_hours,
    },
  });
  return c.json(user);
});

userRoutes.get("/notifications", async (c) => {
  const userId = c.get("userId");
  const settings = await prisma.notificationSettings.findUnique({ where: { user_id: userId } });
  return c.json(settings);
});

userRoutes.patch("/notifications", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = notificationSettingsSchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const settings = await prisma.notificationSettings.upsert({
    where: { user_id: userId },
    create: { user_id: userId, ...parsed.data },
    update: parsed.data,
  });
  return c.json(settings);
});

userRoutes.post("/push-subscription", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = pushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    create: {
      user_id: userId,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
    update: { user_id: userId, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth },
  });

  return c.body(null, 204);
});

userRoutes.delete("/push-subscription", async (c) => {
  const userId = c.get("userId");
  const { endpoint } = await c.req.json();
  await prisma.pushSubscription.deleteMany({ where: { endpoint, user_id: userId } });
  return c.body(null, 204);
});

userRoutes.get("/export", async (c) => {
  const userId = c.get("userId");
  const format = c.req.query("format") === "csv" ? "csv" : "json";
  const entries = await sleepService.getAllEntries(userId);

  if (format === "csv") {
    const rows = entries.map((e) => ({ ...e, ai_prediction: e.ai_prediction ? JSON.stringify(e.ai_prediction) : "" }));
    c.header("Content-Type", "text/csv; charset=utf-8");
    c.header("Content-Disposition", 'attachment; filename="dreamlog-export.csv"');
    return c.body(toCsv(rows));
  }

  c.header("Content-Type", "application/json; charset=utf-8");
  c.header("Content-Disposition", 'attachment; filename="dreamlog-export.json"');
  return c.body(JSON.stringify(entries, null, 2));
});
