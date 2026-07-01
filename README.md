# 🌙 DreamLog

Diario de sueño inteligente. La visión completa del producto está en [README_SleepDiary.md](./README_SleepDiary.md).

**Fase actual:** Fase 1 (MVP core, web-only). Mobile (React Native + Expo) se evalúa para una fase posterior.

## Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **Web:** React 19 + Vite + Tailwind CSS v4 + React Router + Zustand
- **Backend:** Hono.js + Prisma + PostgreSQL
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
- `apps/web/.env.local.example` — Supabase (cliente)

## Pendiente para completar la Fase 1

- Conectar Supabase Auth real en el frontend (login/logout) y wiring del `apiClient` con el token de sesión
- Formularios de registro nocturno/matutino (React Hook Form + Zod, usando los esquemas de `@dreamlog/shared`)
- Gráficas del dashboard con Recharts
- Notificaciones push (Web Push + Service Worker)
