# 🌙 DreamLog

Diario de sueño inteligente. La visión completa del producto está en [README_SleepDiary.md](./README_SleepDiary.md).

**Fase actual:** Fase 1 (MVP core, web-only). Mobile (React Native + Expo) se evalúa para una fase posterior.

## Producción

- **Web:** https://dream-log-web.vercel.app (Vercel)
- **Backend:** https://dreamlog-backend.onrender.com (Render, free tier — puede tardar ~30-60s en despertar tras inactividad)
- **DB/Auth:** Supabase (Postgres + Auth)

## Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **Web:** React 19 + Vite + Tailwind CSS v4 + React Router + Zustand
- **Backend:** Hono.js + Prisma + PostgreSQL, build empaquetado con esbuild
- **IA:** Anthropic SDK (Claude)
- **Auth/DB prod:** Supabase

## Estructura

```
dreamlog/
├── apps/web/       # React + Vite
├── backend/        # Hono.js + Prisma
├── packages/shared/ # Tipos y esquemas Zod compartidos
└── docker-compose.yml # Postgres local (mismo motor que prod)
```

## Desarrollo local

```bash
pnpm install

# Levantar Postgres local
pnpm db:up

# Backend: copiar .env.example -> .env y completar credenciales
cd backend
cp .env.example .env
pnpm db:migrate   # aplica el schema de Prisma

# Desde la raíz: levanta backend + web en paralelo
pnpm dev
```

- Backend: http://localhost:3000
- Web: http://localhost:5173 (proxya `/api` hacia el backend)

## Variables de entorno

- `backend/.env.example` — DB, Supabase, Anthropic API key
- `apps/web/.env.local.example` — Supabase (cliente) + `VITE_API_URL` (solo producción)

## Despliegue

- **Backend (Render):** Root en la raíz del repo (monorepo). Build: `pnpm install --frozen-lockfile && pnpm --filter backend build`. Start: `pnpm --filter backend start` (corre `prisma migrate deploy` antes de levantar el server). `DATABASE_URL` usa el **Session Pooler** de Supabase (puerto 5432), no la conexión directa ni el Transaction Pooler.
- **Frontend (Vercel):** Root Directory `apps/web`, detecta Vite automáticamente.
- El build del backend usa `esbuild` para empaquetar `@dreamlog/shared` junto con el código — Node en producción no puede resolver los imports internos del paquete workspace sin esto.

## Notificaciones push

- Web Push (VAPID) + Service Worker (`apps/web/public/sw.js`). El usuario activa/desactiva desde Ajustes.
- Render (free tier) no tiene cron persistente, así que un **GitHub Actions workflow** (`.github/workflows/notifications.yml`) llama cada 15 min a `POST /internal/notifications/check` (protegido con `CRON_SECRET`, no con sesión de usuario).
- Ese endpoint calcula la hora local de cada usuario (según su `timezone`) y envía el recordatorio si coincide con `bedtime_time`/`wakeup_time`, evitando reenvíos el mismo día.
- Secrets del workflow (`BACKEND_URL`, `CRON_SECRET`) van en **Settings → Secrets and variables → Actions** a nivel de repositorio — no en un "Environment", ya que el workflow no declara `environment:` y no vería esos secrets.

Fase 1 (MVP core) completa.
