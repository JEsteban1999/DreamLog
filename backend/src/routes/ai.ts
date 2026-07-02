import { Hono } from "hono";
import { chatMessageSchema } from "@dreamlog/shared";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import * as aiService from "../services/ai.service.js";

type Variables = { userId: string };

export const aiRoutes = new Hono<{ Variables: Variables }>();

aiRoutes.use("*", requireAuth);

aiRoutes.post("/predict", async (c) => {
  const userId = c.get("userId");
  const { tonight_factors } = await c.req.json();
  const prediction = await aiService.predictTonightQuality(userId, tonight_factors);
  return c.json(prediction);
});

aiRoutes.get("/report/weekly", async (c) => {
  const userId = c.get("userId");
  const report = await aiService.getOrGenerateWeeklyReport(userId);
  return c.json(report);
});

aiRoutes.get("/report/monthly", async (c) => {
  const userId = c.get("userId");
  const report = await aiService.getOrGenerateMonthlyReport(userId);
  return c.json(report);
});

const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1),
});

aiRoutes.post("/chat", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  try {
    const reply = await aiService.chatAboutSleepData(userId, parsed.data.messages);
    return c.json({ reply });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Límite de")) {
      return c.json({ error: e.message }, 429);
    }
    throw e;
  }
});
