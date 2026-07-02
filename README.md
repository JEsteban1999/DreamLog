# 🌙 DreamLog

Diario de sueño inteligente. La visión completa del producto está en [README_SleepDiary.md](./README_SleepDiary.md).

**Estado:** Fase 1, 2 y 3 del roadmap original completas y desplegadas. Web-only (mobile con React Native + Expo queda como posible Fase 4).

## Producción

- **Web:** https://dream-log-web.vercel.app (Vercel)
- **Backend:** https://dreamlog-backend.onrender.com (Render, free tier — puede tardar ~30-60s en despertar tras inactividad)
- **DB/Auth:** Supabase (Postgres + Auth)

## Funcionalidades

- **Auth:** Supabase Auth (email/password), registro público desactivado (fase personal).
- **Registro nocturno/matutino:** con validación, bloqueo de duplicados por noche, y vista de detalle.
- **Dashboard:** KPIs, gráfica de calidad, duración vs. objetivo, ánimo, heatmap de calendario, correlaciones (café/estrés/ejercicio vs. calidad).
- **IA (Claude Sonnet 5):** predicción de calidad al guardar el registro nocturno, reporte semanal y mensual con patrones/recomendaciones, chat conversacional sobre el historial.
- **Notificaciones push:** recordatorio nocturno/matutino, alerta de deuda de sueño, racha en riesgo.
- **Exportación:** CSV, JSON y PDF (gráficas del dashboard + tabla de historial) desde Ajustes.
- **Dark mode** con toggle persistente.

## Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **Web:** React 19 + Vite + Tailwind CSS v4 + React Router + Zustand + Recharts
- **Backend:** Hono.js + Prisma + PostgreSQL, build empaquetado con esbuild
- **IA:** Anthropic SDK (Claude Sonnet 5) — structured outputs vía `messages.parse()` + `jsonSchemaOutputFormat`
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

- `backend/.env.example` — DB, Supabase, Anthropic API key, VAPID keys, CRON_SECRET
- `apps/web/.env.local.example` — Supabase (cliente) + `VITE_API_URL` (solo producción) + `VITE_VAPID_PUBLIC_KEY`

## Despliegue

- **Backend (Render):** Root en la raíz del repo (monorepo). Build: `pnpm install --frozen-lockfile && pnpm --filter backend build`. Start: `pnpm --filter backend start` (corre `prisma migrate deploy` antes de levantar el server). `DATABASE_URL` usa el **Session Pooler** de Supabase (puerto 5432), no la conexión directa ni el Transaction Pooler.
- **Frontend (Vercel):** Root Directory `apps/web`, detecta Vite automáticamente.
- El build del backend usa `esbuild` para empaquetar `@dreamlog/shared` junto con el código — Node en producción no puede resolver los imports internos del paquete workspace sin esto.

## Notificaciones push

- Web Push (VAPID) + Service Worker (`apps/web/public/sw.js`). El usuario activa/desactiva desde Ajustes.
- Render (free tier) no tiene cron persistente, así que un **GitHub Actions workflow** (`.github/workflows/notifications.yml`) llama cada 15 min a `POST /internal/notifications/check` (protegido con `CRON_SECRET`, no con sesión de usuario).
- Ese endpoint calcula la hora local de cada usuario (según su `timezone`) y evalúa: recordatorio nocturno/matutino (a la hora configurada), deuda de sueño semanal (si supera el umbral configurado) y racha en riesgo (si tiene racha activa y aún no registró hoy, pasada la hora de acostarse). Cada tipo se envía como máximo una vez por día local.
- Secrets del workflow (`BACKEND_URL`, `CRON_SECRET`) van en **Settings → Secrets and variables → Actions** a nivel de repositorio — no en un "Environment", ya que el workflow no declara `environment:` y no vería esos secrets.

## Exportación a PDF

- `apps/web/src/lib/pdf-export.ts` usa `jsPDF` + `jspdf-autotable` + `html-to-image` (no `html2canvas`: Tailwind v4 genera colores en `oklch()`, que `html2canvas` no interpreta bien porque reimplementa el parser de CSS en JS; `html-to-image` delega el renderizado al motor real del navegador vía `foreignObject` de SVG).
- El botón vive en **Ajustes → Exportar datos**, junto a CSV/JSON. Como la captura necesita que las gráficas estén montadas en el DOM, `DashboardCharts` (compartido con el Dashboard) se renderiza oculto fuera de pantalla (`position: fixed; left: -9999px`) solo mientras se genera el PDF.

## Pendiente (fuera de alcance para uso personal)

- Modo offline (no aplica, la app es web-only).
- App móvil nativa, multiusuario, wearables — quedan como Fase 4 si en algún momento se decide escalar.
