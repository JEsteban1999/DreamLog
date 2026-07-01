import { Hono } from "hono";
import { notificationSettingsSchema } from "@dreamlog/shared";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

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
