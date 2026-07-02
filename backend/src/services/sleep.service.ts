import type { EveningEntryInput, MorningEntryInput } from "@dreamlog/shared";
import { prisma } from "../lib/prisma.js";

function calculateDurationHours(sleepTime: Date, wakeTime: Date): number {
  let diffMs = wakeTime.getTime() - sleepTime.getTime();
  if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // cruzó medianoche
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
}

function calculateSleepEfficiency(durationHours: number, awakenings: number): number {
  const penalty = Math.min(awakenings * 0.05, 0.4);
  return Math.round((1 - penalty) * 100 * 100) / 100;
}

export class DuplicateEntryError extends Error {
  constructor(public sleepDate: string) {
    super(`Ya existe un registro para la noche del ${sleepDate}`);
  }
}

export async function createEveningEntry(userId: string, input: EveningEntryInput) {
  const existing = await prisma.sleepEntry.findFirst({
    where: { user_id: userId, sleep_date: new Date(input.sleep_date), deleted_at: null },
  });
  if (existing) {
    throw new DuplicateEntryError(input.sleep_date);
  }

  return prisma.sleepEntry.create({
    data: {
      user_id: userId,
      sleep_date: new Date(input.sleep_date),
      sleep_time: new Date(input.sleep_time),
      notes_before: input.notes_before,
      caffeine_cups: input.caffeine_cups,
      caffeine_last_hour: input.caffeine_last_hour ? new Date(input.caffeine_last_hour) : null,
      exercise: input.exercise,
      exercise_type: input.exercise_type ?? null,
      exercise_hour: input.exercise_hour ? new Date(input.exercise_hour) : null,
      screen_time_hours: input.screen_time_hours,
      screen_before_sleep: input.screen_before_sleep,
      stress_level: input.stress_level,
      stress_source: input.stress_source ?? null,
      alcohol: input.alcohol,
      alcohol_drinks: input.alcohol_drinks,
      heavy_meal: input.heavy_meal,
      nap_today: input.nap_today,
      nap_duration_min: input.nap_duration_min,
    },
  });
}

export async function completeMorningEntry(entryId: string, userId: string, input: MorningEntryInput) {
  const entry = await prisma.sleepEntry.findFirstOrThrow({
    where: { id: entryId, user_id: userId, deleted_at: null },
  });

  const wakeTime = new Date(input.wake_time);
  const durationHours = entry.sleep_time ? calculateDurationHours(entry.sleep_time, wakeTime) : null;
  const sleepEfficiency = durationHours != null ? calculateSleepEfficiency(durationHours, input.awakenings) : null;

  return prisma.sleepEntry.update({
    where: { id: entryId },
    data: {
      wake_time: wakeTime,
      sleep_quality: input.sleep_quality,
      mood_on_wake: input.mood_on_wake,
      energy_level: input.energy_level,
      dream_had: input.dream_had,
      dream_notes: input.dream_notes,
      dream_type: input.dream_type,
      awakenings: input.awakenings,
      notes_morning: input.notes_morning,
      duration_hours: durationHours,
      sleep_efficiency: sleepEfficiency,
      is_complete: true,
    },
  });
}

export async function getEntry(entryId: string, userId: string) {
  return prisma.sleepEntry.findFirstOrThrow({
    where: { id: entryId, user_id: userId, deleted_at: null },
  });
}

export async function listEntries(userId: string, opts: { from?: Date; to?: Date; limit?: number } = {}) {
  return prisma.sleepEntry.findMany({
    where: {
      user_id: userId,
      deleted_at: null,
      sleep_date: {
        gte: opts.from,
        lte: opts.to,
      },
    },
    orderBy: { sleep_date: "desc" },
    take: opts.limit ?? 50,
  });
}

export async function getAllEntries(userId: string) {
  return prisma.sleepEntry.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: { sleep_date: "asc" },
  });
}

export async function softDeleteEntry(entryId: string, userId: string) {
  return prisma.sleepEntry.updateMany({
    where: { id: entryId, user_id: userId },
    data: { deleted_at: new Date() },
  });
}

export async function getSummaryStats(userId: string, days = 7) {
  const from = new Date();
  from.setDate(from.getDate() - days);

  const entries = await prisma.sleepEntry.findMany({
    where: { user_id: userId, deleted_at: null, is_complete: true, sleep_date: { gte: from } },
  });

  const avgQuality = entries.length
    ? entries.reduce((sum, e) => sum + (e.sleep_quality ?? 0), 0) / entries.length
    : null;
  const avgDuration = entries.length
    ? entries.reduce((sum, e) => sum + (e.duration_hours ?? 0), 0) / entries.length
    : null;

  return {
    period_days: days,
    entries_count: entries.length,
    avg_quality: avgQuality,
    avg_duration_hours: avgDuration,
  };
}
