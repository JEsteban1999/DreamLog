import { Hono } from "hono";
import { eveningEntrySchema, morningEntrySchema } from "@dreamlog/shared";
import { requireAuth } from "../middleware/auth.js";
import * as sleepService from "../services/sleep.service.js";
import { DuplicateEntryError } from "../services/sleep.service.js";

type Variables = { userId: string };

export const sleepRoutes = new Hono<{ Variables: Variables }>();

sleepRoutes.use("*", requireAuth);

sleepRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const from = c.req.query("from");
  const to = c.req.query("to");
  const limit = c.req.query("limit");

  const entries = await sleepService.listEntries(userId, {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  return c.json({ entries });
});

sleepRoutes.get("/stats/summary", async (c) => {
  const userId = c.get("userId");
  const days = c.req.query("days");
  const stats = await sleepService.getSummaryStats(userId, days ? Number(days) : undefined);
  return c.json(stats);
});

sleepRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const entry = await sleepService.getEntry(id, userId);
  return c.json({ entry });
});

sleepRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();

  const parsed = eveningEntrySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  try {
    const entry = await sleepService.createEveningEntry(userId, parsed.data);
    return c.json({ entry }, 201);
  } catch (e) {
    if (e instanceof DuplicateEntryError) {
      return c.json({ error: e.message }, 409);
    }
    throw e;
  }
});

sleepRoutes.patch("/:id/morning", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = await c.req.json();

  const parsed = morningEntrySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const entry = await sleepService.completeMorningEntry(id, userId, parsed.data);
  return c.json({ entry });
});

sleepRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  await sleepService.softDeleteEntry(id, userId);
  return c.body(null, 204);
});
