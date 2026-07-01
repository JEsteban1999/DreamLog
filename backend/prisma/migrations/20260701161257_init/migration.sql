-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Bogota',
    "goal_hours" DOUBLE PRECISION NOT NULL DEFAULT 8.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SleepEntry" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sleep_date" TIMESTAMP(3) NOT NULL,
    "sleep_time" TIMESTAMP(3),
    "notes_before" TEXT,
    "caffeine_cups" INTEGER NOT NULL DEFAULT 0,
    "caffeine_last_hour" TIMESTAMP(3),
    "exercise" BOOLEAN NOT NULL DEFAULT false,
    "exercise_type" TEXT,
    "exercise_hour" TIMESTAMP(3),
    "screen_time_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "screen_before_sleep" BOOLEAN NOT NULL DEFAULT false,
    "stress_level" INTEGER,
    "stress_source" TEXT,
    "alcohol" BOOLEAN NOT NULL DEFAULT false,
    "alcohol_drinks" INTEGER NOT NULL DEFAULT 0,
    "heavy_meal" BOOLEAN NOT NULL DEFAULT false,
    "nap_today" BOOLEAN NOT NULL DEFAULT false,
    "nap_duration_min" INTEGER NOT NULL DEFAULT 0,
    "wake_time" TIMESTAMP(3),
    "sleep_quality" INTEGER,
    "mood_on_wake" TEXT,
    "energy_level" INTEGER,
    "dream_had" BOOLEAN NOT NULL DEFAULT false,
    "dream_notes" TEXT,
    "dream_type" TEXT,
    "awakenings" INTEGER NOT NULL DEFAULT 0,
    "notes_morning" TEXT,
    "duration_hours" DOUBLE PRECISION,
    "sleep_efficiency" DOUBLE PRECISION,
    "ai_prediction" JSONB,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SleepEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIReport" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "period_from" TIMESTAMP(3) NOT NULL,
    "period_to" TIMESTAMP(3) NOT NULL,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bedtime_reminder" BOOLEAN NOT NULL DEFAULT true,
    "bedtime_time" TEXT NOT NULL DEFAULT '22:00',
    "wakeup_reminder" BOOLEAN NOT NULL DEFAULT true,
    "wakeup_time" TEXT NOT NULL DEFAULT '07:30',
    "weekly_report" BOOLEAN NOT NULL DEFAULT true,
    "sleep_debt_alert" BOOLEAN NOT NULL DEFAULT true,
    "sleep_debt_threshold" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "streak_reminder" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SleepEntry_user_id_sleep_date_idx" ON "SleepEntry"("user_id", "sleep_date");

-- CreateIndex
CREATE INDEX "AIReport_user_id_type_period_from_idx" ON "AIReport"("user_id", "type", "period_from");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_user_id_key" ON "NotificationSettings"("user_id");

-- AddForeignKey
ALTER TABLE "SleepEntry" ADD CONSTRAINT "SleepEntry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIReport" ADD CONSTRAINT "AIReport_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSettings" ADD CONSTRAINT "NotificationSettings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
