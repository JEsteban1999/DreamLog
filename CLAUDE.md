# DreamLog — Guía para Claude Code

Diario de sueño inteligente (web-only). Monorepo pnpm + Turborepo. **Todo en español**: la UI, los comentarios y la conversación con el usuario.

## Estructura

- `apps/web` — Frontend React 19 + Vite 8 + Tailwind v4 (config en CSS, no hay tailwind.config). Router v7, Zustand, react-hook-form + Zod, Recharts, jsPDF/html-to-image para PDF.
- `backend` — API Hono + Prisma 6 + PostgreSQL. IA con `@anthropic-ai/sdk` (modelo en `backend/src/lib/anthropic.ts`).
- `packages/shared` — Esquemas Zod y tipos compartidos. Paquete *source-only* (apunta a `src/index.ts`, sin build); el backend lo empaqueta con esbuild.

Node >= 22.13 (`.node-version` = 22), pnpm 11.

## Comandos

| Qué | Cómo |
|---|---|
| Levantar Postgres | `pnpm db:up` (requiere Docker Desktop corriendo, ver abajo) |
| Dev backend | `pnpm dev` en `backend/` → puerto **3000** (tsx watch) |
| Dev web | `pnpm dev` en `apps/web/` → puerto **5173** (proxy `/api` → :3000) |
| Typecheck web | `pnpm exec tsc -b` en `apps/web/` |
| Typecheck backend/shared | `pnpm exec tsc --noEmit` en cada uno |
| Build backend | `pnpm build` en `backend/` (prisma generate + esbuild) |
| Migración local | `pnpm db:migrate` en `backend/` (`prisma migrate dev`) |
| Migración producción | `prisma migrate deploy` con la `DATABASE_URL` de Supabase leída desde archivo env — **nunca pegar la credencial inline en el comando** |

No hay tests; la verificación es typecheck + build + probar los flujos a mano.

## Entorno local (Windows) — reglas aprendidas

- **Docker Desktop suele estar apagado.** Antes de tocar la DB: `powershell -Command "Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'"`, esperar con `until docker info >/dev/null 2>&1; do sleep 3; done` y luego `docker compose up -d`.
- **Parar el dev server del backend ANTES de `pnpm build` o `prisma generate`.** Si tsx watch está corriendo, Prisma falla con `EPERM ... query_engine-windows.dll.node` (DLL bloqueado). Buscar el PID con `netstat -ano | grep ":3000"` y matarlo con `Stop-Process`.
- Lanzar dev servers con `run_in_background: true` del tool Bash, no con `&` + `sleep` + `curl`.
- `gh` CLI **no está instalado**; no hay claves SSH. El remote de git es **HTTPS**.
- Scripts Node de prueba desechables: crearlos **dentro del workspace** (p. ej. `apps/web/` o `backend/`), nunca en /tmp ni en el scratchpad — Node no resuelve las dependencias del monorepo desde fuera. Borrarlos al terminar.

## Deploy y producción

- Backend: Render (free tier, cold start 30–60 s) — `https://dreamlog-backend.onrender.com/health`
- Web: Vercel — `https://dream-log-web.vercel.app`
- DB/Auth: Supabase (la `DATABASE_URL` de producción usa el **Session Pooler**, puerto 5432).
- Ambos se auto-despliegan al hacer push a `main`. **Al terminar una feature: commit + push siempre** (dos veces en la sesión inicial se quedó trabajo sin pushear y el usuario vio fallos en producción). Verificar el deploy con `until curl -sf <url>; do sleep 5; done` en background.
- Toda migración nueva debe aplicarse también a Supabase (`prisma migrate deploy`).

## Convenciones de producto y código

- **Fecha de la noche:** una noche se etiqueta con la fecha del día en que empezó (acostarse el 2 a la 1 AM = noche del 1). Ya implementado en los formularios; mantener esta regla en cualquier feature nueva.
- Sistema de diseño **"Ocaso → Alba"**: tokens CSS en `apps/web/src/index.css` (`--cool` = noche/lo que controlas, `--warm` = mañana/lo que obtienes), dark mode como modo principal, fuente Spectral. Usar los tokens semánticos (canvas, panel, card, ink, muted, primary, heat0–4), no colores sueltos.
- DB: columnas snake_case, ids `cuid()`, soft delete con `deleted_at`.
- API montada en la raíz del backend: `/health`, `/auth`, `/sleep`, `/ai`, `/user`, `/internal` (este último protegido con `CRON_SECRET`, lo llama un GitHub Actions cada 15 min para las notificaciones push).
- Un registro por noche (el backend devuelve 409 en duplicados).
- **Al completar o avanzar una fase, actualizar `README.md`** (regla pedida por el usuario). El plan de fases vive en `README_SleepDiary.md`; Fases 1–3 completas, Fase 4 (multiusuario, wearables, apps nativas) no iniciada.

## Contexto del usuario

- Usa **Brave** como navegador: las notificaciones push requieren activar "Google Services for Push Messaging" en brave://settings/privacy.
- Los archivos `.env` van en `backend/.env` y `apps/web/.env.local` (raíz del workspace, no en `src/`).
