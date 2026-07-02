import { z } from "zod";

export const aiPatternSchema = z.object({
  pattern: z.string(),
  confidence: z.enum(["alta", "media", "baja"]),
  data_points: z.number().int().min(0),
});

export const aiRecommendationSchema = z.object({
  priority: z.enum(["alta", "media", "baja"]),
  category: z.string(),
  recommendation: z.string(),
  evidence: z.string(),
});

export const weeklyReportSchema = z.object({
  summary: z.string(),
  patterns_detected: z.array(aiPatternSchema),
  best_day: z.string(),
  worst_day: z.string(),
  recommendations: z.array(aiRecommendationSchema),
  trend: z.enum(["improving", "declining", "stable"]),
});

export const sleepPredictionSchema = z.object({
  predicted_quality: z.number().int().min(1).max(10),
  confidence: z.enum(["alta", "media", "baja"]),
  reasoning: z.string(),
  tip_for_tonight: z.string(),
});

export const monthlyTopFactorSchema = z.object({
  factor: z.string(),
  impact: z.enum(["positive", "negative"]),
  description: z.string(),
});

export const monthlyReportSchema = z.object({
  summary: z.string(),
  top_factors: z.array(monthlyTopFactorSchema),
  comparison_with_previous_month: z.string(),
  suggested_goal: z.string(),
  highlights: z.array(z.string()),
});

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export type AIPattern = z.infer<typeof aiPatternSchema>;
export type AIRecommendation = z.infer<typeof aiRecommendationSchema>;
export type WeeklyReport = z.infer<typeof weeklyReportSchema>;
export type SleepPrediction = z.infer<typeof sleepPredictionSchema>;
export type MonthlyTopFactor = z.infer<typeof monthlyTopFactorSchema>;
export type MonthlyReport = z.infer<typeof monthlyReportSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
