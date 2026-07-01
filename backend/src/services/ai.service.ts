import { sleepPredictionSchema, weeklyReportSchema, type SleepPrediction, type WeeklyReport } from "@dreamlog/shared";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, CLAUDE_MODEL } from "../lib/anthropic.js";
import { prisma } from "../lib/prisma.js";

const PREDICTION_TOOL = {
  name: "record_sleep_prediction",
  description: "Registra la predicción de calidad de sueño para esta noche.",
  input_schema: {
    type: "object" as const,
    properties: {
      predicted_quality: { type: "integer", minimum: 1, maximum: 10 },
      confidence: { type: "string", enum: ["alta", "media", "baja"] },
      reasoning: { type: "string" },
      tip_for_tonight: { type: "string" },
    },
    required: ["predicted_quality", "confidence", "reasoning", "tip_for_tonight"],
  },
};

const WEEKLY_REPORT_TOOL = {
  name: "record_weekly_report",
  description: "Registra el análisis semanal de sueño.",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: { type: "string" },
      patterns_detected: {
        type: "array",
        items: {
          type: "object",
          properties: {
            pattern: { type: "string" },
            confidence: { type: "string", enum: ["alta", "media", "baja"] },
            data_points: { type: "integer" },
          },
          required: ["pattern", "confidence", "data_points"],
        },
      },
      best_day: { type: "string" },
      worst_day: { type: "string" },
      recommendations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            priority: { type: "string", enum: ["alta", "media", "baja"] },
            category: { type: "string" },
            recommendation: { type: "string" },
            evidence: { type: "string" },
          },
          required: ["priority", "category", "recommendation", "evidence"],
        },
      },
      trend: { type: "string", enum: ["improving", "declining", "stable"] },
    },
    required: ["summary", "patterns_detected", "best_day", "worst_day", "recommendations", "trend"],
  },
};

function extractToolInput(message: Anthropic.Message, toolName: string): unknown {
  const block = message.content.find((c) => c.type === "tool_use" && c.name === toolName);
  if (!block || block.type !== "tool_use") {
    throw new Error(`Claude no invocó la tool esperada: ${toolName}`);
  }
  return block.input;
}

export async function predictTonightQuality(userId: string, tonightFactors: unknown): Promise<SleepPrediction> {
  const last30Days = await prisma.sleepEntry.findMany({
    where: {
      user_id: userId,
      deleted_at: null,
      is_complete: true,
      sleep_date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { sleep_date: "desc" },
  });

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    tools: [PREDICTION_TOOL],
    tool_choice: { type: "tool", name: PREDICTION_TOOL.name },
    messages: [
      {
        role: "user",
        content: `Factores de esta noche:\n${JSON.stringify(tonightFactors)}\n\nHistorial de los últimos 30 días:\n${JSON.stringify(last30Days)}`,
      },
    ],
  });

  return sleepPredictionSchema.parse(extractToolInput(message, PREDICTION_TOOL.name));
}

export async function generateWeeklyReport(userId: string): Promise<WeeklyReport> {
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const entries = await prisma.sleepEntry.findMany({
    where: { user_id: userId, deleted_at: null, is_complete: true, sleep_date: { gte: from } },
    orderBy: { sleep_date: "asc" },
  });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    tools: [WEEKLY_REPORT_TOOL],
    tool_choice: { type: "tool", name: WEEKLY_REPORT_TOOL.name },
    messages: [
      {
        role: "user",
        content: `Analiza esta semana de registros de sueño y detecta patrones y recomendaciones.\nObjetivo de horas: ${user.goal_hours}\nEntradas:\n${JSON.stringify(entries)}`,
      },
    ],
  });

  const report = weeklyReportSchema.parse(extractToolInput(message, WEEKLY_REPORT_TOOL.name));

  await prisma.aIReport.create({
    data: {
      user_id: userId,
      type: "weekly",
      period_from: from,
      period_to: new Date(),
      content: report,
    },
  });

  return report;
}
