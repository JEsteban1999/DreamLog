import { z } from "zod";

export const exerciseTypeSchema = z.enum(["cardio", "weights", "yoga", "walk", "other"]);
export const stressSourceSchema = z.enum(["work", "personal", "health", "other"]);
export const moodOnWakeSchema = z.enum([
  "rested",
  "neutral",
  "groggy",
  "anxious",
  "happy",
  "sad",
  "irritable",
]);
export const dreamTypeSchema = z.enum([
  "neutral",
  "pleasant",
  "nightmare",
  "lucid",
  "recurring",
  "forgot",
]);

export const eveningEntrySchema = z.object({
  sleep_date: z.string().date(),
  sleep_time: z.string().datetime(),
  notes_before: z.string().max(2000).optional(),
  caffeine_cups: z.number().int().min(0).default(0),
  caffeine_last_hour: z.string().datetime().optional().nullable(),
  exercise: z.boolean().default(false),
  exercise_type: exerciseTypeSchema.optional().nullable(),
  exercise_hour: z.string().datetime().optional().nullable(),
  screen_time_hours: z.number().min(0).default(0),
  screen_before_sleep: z.boolean().default(false),
  stress_level: z.number().int().min(1).max(10).optional(),
  stress_source: stressSourceSchema.optional().nullable(),
  alcohol: z.boolean().default(false),
  alcohol_drinks: z.number().int().min(0).default(0),
  heavy_meal: z.boolean().default(false),
  nap_today: z.boolean().default(false),
  nap_duration_min: z.number().int().min(0).default(0),
});

export const morningEntrySchema = z.object({
  wake_time: z.string().datetime(),
  sleep_quality: z.number().int().min(1).max(10),
  mood_on_wake: moodOnWakeSchema,
  energy_level: z.number().int().min(1).max(10),
  dream_had: z.boolean().default(false),
  dream_notes: z.string().max(2000).optional(),
  dream_type: dreamTypeSchema.optional(),
  awakenings: z.number().int().min(0).default(0),
  notes_morning: z.string().max(2000).optional(),
});

export const sleepEntrySchema = eveningEntrySchema.partial().merge(morningEntrySchema.partial()).extend({
  id: z.string(),
  user_id: z.string(),
  sleep_date: z.string().date(),
  duration_hours: z.number().optional().nullable(),
  sleep_efficiency: z.number().optional().nullable(),
  is_complete: z.boolean().default(false),
});

export type ExerciseType = z.infer<typeof exerciseTypeSchema>;
export type StressSource = z.infer<typeof stressSourceSchema>;
export type MoodOnWake = z.infer<typeof moodOnWakeSchema>;
export type DreamType = z.infer<typeof dreamTypeSchema>;
export type EveningEntryInput = z.infer<typeof eveningEntrySchema>;
export type MorningEntryInput = z.infer<typeof morningEntrySchema>;
export type SleepEntry = z.infer<typeof sleepEntrySchema>;
