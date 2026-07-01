import { z } from "zod";

export const userProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().max(100).optional(),
  timezone: z.string().default("America/Bogota"),
  goal_hours: z.number().min(1).max(24).default(8),
});

export const notificationSettingsSchema = z.object({
  bedtime_reminder: z.boolean().default(true),
  bedtime_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default("22:00"),
  wakeup_reminder: z.boolean().default(true),
  wakeup_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default("07:30"),
  weekly_report: z.boolean().default(true),
  sleep_debt_alert: z.boolean().default(true),
  sleep_debt_threshold: z.number().min(0).default(5),
  streak_reminder: z.boolean().default(true),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
