import {
  sleepPredictionSchema,
  weeklyReportSchema,
  monthlyReportSchema,
  type SleepPrediction,
  type WeeklyReport,
  type MonthlyReport,
  type ChatMessage,
} from "@dreamlog/shared";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import { anthropic, CLAUDE_MODEL } from "../lib/anthropic.js";
import { prisma } from "../lib/prisma.js";

const PREDICTION_FORMAT = jsonSchemaOutputFormat({
  type: "object",
  properties: {
    predicted_quality: { type: "integer", minimum: 1, maximum: 10 },
    confidence: { type: "string", enum: ["alta", "media", "baja"] },
    reasoning: { type: "string" },
    tip_for_tonight: { type: "string" },
  },
  required: ["predicted_quality", "confidence", "reasoning", "tip_for_tonight"],
  additionalProperties: false,
} as const);

const WEEKLY_REPORT_FORMAT = jsonSchemaOutputFormat({
  type: "object",
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
        additionalProperties: false,
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
        additionalProperties: false,
      },
    },
    trend: { type: "string", enum: ["improving", "declining", "stable"] },
  },
  required: ["summary", "patterns_detected", "best_day", "worst_day", "recommendations", "trend"],
  additionalProperties: false,
} as const);

const MONTHLY_REPORT_FORMAT = jsonSchemaOutputFormat({
  type: "object",
  properties: {
    summary: { type: "string" },
    top_factors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          factor: { type: "string" },
          impact: { type: "string", enum: ["positive", "negative"] },
          description: { type: "string" },
        },
        required: ["factor", "impact", "description"],
        additionalProperties: false,
      },
    },
    comparison_with_previous_month: { type: "string" },
    suggested_goal: { type: "string" },
    highlights: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "top_factors", "comparison_with_previous_month", "suggested_goal", "highlights"],
  additionalProperties: false,
} as const);

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

  const message = await anthropic.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    output_config: { format: PREDICTION_FORMAT, effort: "medium" },
    messages: [
      {
        role: "user",
        content: `Factores de esta noche:\n${JSON.stringify(tonightFactors)}\n\nHistorial de los últimos 30 días:\n${JSON.stringify(last30Days)}`,
      },
    ],
  });

  if (!message.parsed_output) throw new Error("Claude no devolvió una predicción válida");
  return sleepPredictionSchema.parse(message.parsed_output);
}

export async function generateWeeklyReport(userId: string): Promise<WeeklyReport> {
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const entries = await prisma.sleepEntry.findMany({
    where: { user_id: userId, deleted_at: null, is_complete: true, sleep_date: { gte: from } },
    orderBy: { sleep_date: "asc" },
  });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const message = await anthropic.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    output_config: { format: WEEKLY_REPORT_FORMAT, effort: "medium" },
    messages: [
      {
        role: "user",
        content: `Analiza esta semana de registros de sueño y detecta patrones y recomendaciones.\nObjetivo de horas: ${user.goal_hours}\nEntradas:\n${JSON.stringify(entries)}`,
      },
    ],
  });

  if (!message.parsed_output) throw new Error("Claude no devolvió un reporte válido");
  const report = weeklyReportSchema.parse(message.parsed_output);

  await prisma.aIReport.create({
    data: { user_id: userId, type: "weekly", period_from: from, period_to: new Date(), content: report },
  });

  return report;
}

const REPORT_CACHE_WINDOW_MS = 20 * 60 * 60 * 1000;

export async function getOrGenerateWeeklyReport(userId: string): Promise<WeeklyReport> {
  const cached = await prisma.aIReport.findFirst({
    where: { user_id: userId, type: "weekly", created_at: { gte: new Date(Date.now() - REPORT_CACHE_WINDOW_MS) } },
    orderBy: { created_at: "desc" },
  });
  if (cached) return weeklyReportSchema.parse(cached.content);
  return generateWeeklyReport(userId);
}

export async function getOrGenerateMonthlyReport(userId: string): Promise<MonthlyReport> {
  const cached = await prisma.aIReport.findFirst({
    where: { user_id: userId, type: "monthly", created_at: { gte: new Date(Date.now() - REPORT_CACHE_WINDOW_MS) } },
    orderBy: { created_at: "desc" },
  });
  if (cached) return monthlyReportSchema.parse(cached.content);
  return generateMonthlyReport(userId);
}

export async function generateMonthlyReport(userId: string): Promise<MonthlyReport> {
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const prevFrom = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const [entries, prevEntries, user] = await Promise.all([
    prisma.sleepEntry.findMany({
      where: { user_id: userId, deleted_at: null, is_complete: true, sleep_date: { gte: from } },
      orderBy: { sleep_date: "asc" },
    }),
    prisma.sleepEntry.findMany({
      where: { user_id: userId, deleted_at: null, is_complete: true, sleep_date: { gte: prevFrom, lt: from } },
      orderBy: { sleep_date: "asc" },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
  ]);

  const message = await anthropic.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 3072,
    thinking: { type: "adaptive" },
    output_config: { format: MONTHLY_REPORT_FORMAT, effort: "medium" },
    messages: [
      {
        role: "user",
        content: `Analiza el último mes de registros de sueño frente al mes anterior. Objetivo de horas: ${user.goal_hours}.\n\nMes actual:\n${JSON.stringify(entries)}\n\nMes anterior:\n${JSON.stringify(prevEntries)}`,
      },
    ],
  });

  if (!message.parsed_output) throw new Error("Claude no devolvió un reporte válido");
  const report = monthlyReportSchema.parse(message.parsed_output);

  await prisma.aIReport.create({
    data: { user_id: userId, type: "monthly", period_from: from, period_to: new Date(), content: report },
  });

  return report;
}

const CHAT_MESSAGE_LIMIT = 20;

export async function chatAboutSleepData(userId: string, history: ChatMessage[]): Promise<string> {
  if (history.length > CHAT_MESSAGE_LIMIT) {
    throw new Error(`Límite de ${CHAT_MESSAGE_LIMIT} mensajes por sesión alcanzado`);
  }

  const [entries, user] = await Promise.all([
    prisma.sleepEntry.findMany({
      where: { user_id: userId, deleted_at: null, is_complete: true },
      orderBy: { sleep_date: "desc" },
      take: 90,
    }),
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
  ]);

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system: `Eres un asistente que responde preguntas sobre el historial de sueño del usuario, dentro de una burbuja de chat angosta (móvil incluido). Responde en prosa conversacional breve, en párrafos cortos. No uses tablas, encabezados markdown (#/##) ni bloques de código — si necesitas enumerar cosas, usa una lista simple con guiones. Objetivo de horas: ${user.goal_hours}. Historial (hasta 90 noches, más reciente primero):\n${JSON.stringify(entries)}`,
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Claude no devolvió una respuesta de texto");
  return textBlock.text;
}
