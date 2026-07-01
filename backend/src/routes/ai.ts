import { Hono } from "hono";
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
  const report = await aiService.generateWeeklyReport(userId);
  return c.json(report);
});
