# 🌙 DreamLog — Diario de Sueño Inteligente

> Aplicación personal de seguimiento y análisis de sueño con inteligencia artificial, orientada a detectar patrones, correlaciones y generar recomendaciones personalizadas basadas en el historial del usuario.

---

## 📋 Tabla de Contenidos

- [Visión General](#visión-general)
- [Objetivos del Proyecto](#objetivos-del-proyecto)
- [Stack Tecnológico Propuesto](#stack-tecnológico-propuesto)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Módulos y Funcionalidades](#módulos-y-funcionalidades)
  - [1. Autenticación y Perfil](#1-autenticación-y-perfil)
  - [2. Registro de Sueño](#2-registro-de-sueño)
  - [3. Dashboard Visual](#3-dashboard-visual)
  - [4. Motor de IA (Claude API)](#4-motor-de-ia-claude-api)
  - [5. Notificaciones y Recordatorios](#5-notificaciones-y-recordatorios)
  - [6. Reportes y Exportación](#6-reportes-y-exportación)
- [Modelo de Datos](#modelo-de-datos)
- [Diseño de API (Backend)](#diseño-de-api-backend)
- [Flujos de Usuario](#flujos-de-usuario)
- [Consideraciones de Privacidad y Seguridad](#consideraciones-de-privacidad-y-seguridad)
- [Fases de Desarrollo](#fases-de-desarrollo)
- [Estructura de Carpetas del Proyecto](#estructura-de-carpetas-del-proyecto)
- [Variables de Entorno](#variables-de-entorno)
- [Escalabilidad Futura](#escalabilidad-futura)

---

## Visión General

**DreamLog** es una aplicación personal (web + móvil) para registrar, visualizar y analizar los patrones de sueño del usuario. Va más allá de un simple tracker: conecta los datos de sueño con los factores del día a día (cafeína, ejercicio, estrés, pantallas) y utiliza la API de Claude (Anthropic) para interpretar el historial acumulado, detectar correlaciones no evidentes y generar recomendaciones personalizadas.

El usuario parte desde un uso **estrictamente personal**, con la arquitectura diseñada para soportar escalar a múltiples usuarios en el futuro sin refactorizaciones mayores.

---

## Objetivos del Proyecto

| # | Objetivo |
|---|----------|
| 1 | Registrar diariamente datos de sueño con mínima fricción |
| 2 | Visualizar tendencias históricas con gráficas interactivas |
| 3 | Detectar correlaciones entre factores del día y calidad de sueño |
| 4 | Generar recomendaciones personalizadas con IA (Claude API) |
| 5 | Predecir calidad de sueño basada en hábitos del día actual |
| 6 | Enviar recordatorios contextuales (antes de dormir / al despertar) |
| 7 | Producir reportes semanales y mensuales exportables |

---

## Stack Tecnológico Propuesto

### Frontend Web
| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Framework | **React 18 + TypeScript** | Ecosistema robusto, tipado estricto, fácil migración a React Native |
| Build tool | **Vite** | Dev experience rápida, HMR eficiente |
| UI Components | **shadcn/ui + Tailwind CSS** | Componentes accesibles, altamente personalizables |
| Gráficas | **Recharts** | Nativo para React, flexible, responsive |
| Estado global | **Zustand** | Liviano, sin boilerplate excesivo |
| Formularios | **React Hook Form + Zod** | Validación declarativa con esquemas tipados |
| Ruteo | **React Router v6** | Estándar de facto para SPA |

### Frontend Móvil
| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Framework | **React Native + Expo** | Código compartido ~70% con la web, acceso nativo a notificaciones push |
| Notificaciones | **Expo Notifications** | Soporte Android/iOS, scheduling local y remoto |
| Almacenamiento local | **Expo SecureStore + AsyncStorage** | Cache offline y tokens seguros |

### Backend
| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Runtime | **Node.js 20 LTS** | Ecosistema JS unificado con el frontend |
| Framework | **FastAPI (Python)** *(alternativa)* | Si se prefiere reutilizar el stack de PROSPECTIVE |
| Framework principal | **Hono.js** | Ultraligero, edge-compatible, excelente DX con TypeScript |
| ORM | **Prisma** | Type-safe, migraciones declarativas, soporte multi-DB |
| Validación | **Zod** (compartido con frontend) | Esquemas reutilizables entre capas |

### Base de Datos
| Entorno | Motor | Justificación |
|---------|-------|---------------|
| Desarrollo local | **SQLite** (via Prisma) | Cero configuración, portable |
| Producción (personal) | **PostgreSQL en Supabase** | Free tier generoso, auth integrado, real-time opcional, escalable a multi-usuario |
| Alternativa producción | **PlanetScale (MySQL)** | Branching de DB, serverless-friendly |

> **Recomendación final de almacenamiento:** Supabase. Ofrece PostgreSQL gestionado, autenticación lista para usar (email/password + OAuth), almacenamiento de archivos, y un free tier suficiente para uso personal extendido. Si en el futuro se escala a producto, el salto es mínimo.

### IA
| Componente | Tecnología |
|-----------|-----------|
| Motor de análisis | **Claude API (claude-sonnet-4-6)** vía Anthropic SDK |
| Acceso | Membresía personal de Claude / API key propia |
| Integración | Llamadas desde el backend; el frontend nunca expone la API key |

### Infraestructura
| Componente | Servicio |
|-----------|---------|
| Hosting backend | **Railway** o **Render** (free tier en inicio) |
| Hosting frontend web | **Vercel** |
| Base de datos | **Supabase** |
| CI/CD | **GitHub Actions** |
| Monitoreo | **Sentry** (errores) |

---

## Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────┐
│                     CLIENTE                              │
│                                                          │
│  ┌─────────────────┐      ┌──────────────────────────┐  │
│  │   Web App       │      │   Mobile App             │  │
│  │   React + Vite  │      │   React Native + Expo    │  │
│  └────────┬────────┘      └────────────┬─────────────┘  │
│           │                            │                 │
└───────────┼────────────────────────────┼─────────────────┘
            │         HTTPS/REST         │
            ▼                            ▼
┌───────────────────────────────────────────────────────────┐
│                     BACKEND (Hono.js / Node)              │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Auth       │  │  Sleep API   │  │  AI Service     │  │
│  │  Routes     │  │  Routes      │  │  (Claude)       │  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬────────┘  │
│         │                │                   │           │
│         └────────────────┼───────────────────┘           │
│                          ▼                               │
│                   ┌─────────────┐                        │
│                   │   Prisma    │                        │
│                   │   ORM       │                        │
│                   └──────┬──────┘                        │
└──────────────────────────┼────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐  ┌─────────┐  ┌──────────────┐
        │PostgreSQL│  │Supabase │  │Anthropic API │
        │(Supabase)│  │  Auth   │  │(Claude)      │
        └──────────┘  └─────────┘  └──────────────┘
```

---

## Módulos y Funcionalidades

### 1. Autenticación y Perfil

#### 1.1 Estrategia de autenticación
Se utiliza **Supabase Auth** con soporte para:
- Registro e inicio de sesión con **email + contraseña**
- Login con **Google (OAuth 2.0)** — opción recomendada para el uso desde móvil
- Sesiones persistentes con refresh tokens
- Recuperación de contraseña por email

> Para la fase personal (un solo usuario), se puede desactivar el registro público en Supabase y mantener solo las credenciales del propietario. Esto también previene accesos no autorizados si el backend es público.

#### 1.2 Perfil de usuario
Campos del perfil:
- Nombre o alias
- Hora habitual de dormir (para calibrar recordatorios)
- Hora habitual de despertar
- Zona horaria
- Preferencias de notificaciones (on/off por tipo)
- Unidad de evaluación preferida (escala 1-5 o 1-10)
- Avatar (opcional)

---

### 2. Registro de Sueño

Esta es la funcionalidad núcleo de la app. Cada entrada representa **una noche de sueño**.

#### 2.1 Formulario de Registro Nocturno (antes de dormir)

Se activa via notificación push o acceso manual. Campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `sleep_date` | Date | Fecha de la noche (se registra como la fecha en que el usuario se va a dormir) |
| `sleep_time` | Time | Hora en que el usuario se acuesta a dormir |
| `factors_evening` | Object | Factores del día/noche previos al sueño (ver detalle abajo) |
| `notes_before` | Text | Notas libres antes de dormir (pensamientos, preocupaciones, etc.) |

**Factores del día (`factors_evening`):**
```json
{
  "caffeine_cups": 0,          // Tazas de café/energizantes consumidas
  "caffeine_last_hour": null,  // Hora del último café
  "exercise": false,           // ¿Hizo ejercicio hoy?
  "exercise_type": null,       // "cardio" | "weights" | "yoga" | "walk" | "other"
  "exercise_hour": null,       // Hora del ejercicio
  "screen_time_hours": 0,      // Horas frente a pantallas
  "screen_before_sleep": false,// ¿Usó pantallas en los últimos 60 min antes de dormir?
  "stress_level": 0,           // Nivel de estrés del día (1-10)
  "stress_source": null,       // "work" | "personal" | "health" | "other"
  "alcohol": false,            // ¿Consumió alcohol?
  "alcohol_drinks": 0,         // Número de bebidas
  "heavy_meal": false,         // ¿Comida pesada en las últimas 3h?
  "nap_today": false,          // ¿Tomó siesta?
  "nap_duration_min": 0        // Duración de la siesta en minutos
}
```

#### 2.2 Formulario de Registro Matutino (al despertar)

Se activa via notificación push o acceso manual. Campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `wake_time` | Time | Hora en que el usuario despertó |
| `sleep_quality` | Integer (1-10) | Calidad percibida del sueño |
| `mood_on_wake` | Enum | Estado de ánimo al despertar |
| `energy_level` | Integer (1-10) | Nivel de energía al despertar |
| `dream_had` | Boolean | ¿Tuvo sueños? |
| `dream_notes` | Text | Descripción libre del sueño (si lo recuerda) |
| `dream_type` | Enum | Clasificación del sueño |
| `awakenings` | Integer | Número de veces que despertó durante la noche |
| `notes_morning` | Text | Notas adicionales de la mañana |

**Valores del campo `mood_on_wake`:**
`rested` | `neutral` | `groggy` | `anxious` | `happy` | `sad` | `irritable`

**Valores del campo `dream_type`:**
`neutral` | `pleasant` | `nightmare` | `lucid` | `recurring` | `forgot`

#### 2.3 Métricas calculadas automáticamente
Tras completar ambas partes del registro, el sistema calcula:

| Métrica | Fórmula |
|---------|---------|
| `duration_hours` | `wake_time - sleep_time` (ajustado por medianoche) |
| `sleep_efficiency` | Calculado con base en despertares vs. duración total |
| `weekly_avg_quality` | Promedio de `sleep_quality` de los últimos 7 días |
| `sleep_debt` | Horas de sueño acumuladas vs. objetivo configurado (default: 8h) |

#### 2.4 Historial de Registros
- Vista de lista con filtros por fecha, calidad, y factores
- Vista de calendario (heatmap de calidad por día)
- Acceso a edición de cualquier entrada (correcciones permitidas hasta 48h después)
- Eliminación suave (soft delete) con posibilidad de restaurar

---

### 3. Dashboard Visual

El dashboard es la vista principal del usuario y consolida toda la información histórica en gráficas interactivas.

#### 3.1 Métricas de resumen (tarjetas KPI)
- 🌙 Horas promedio de sueño (semana actual vs. semana anterior)
- ⭐ Calidad promedio (semana actual vs. semana anterior)
- 📈 Racha actual de registros consecutivos
- 💤 Deuda de sueño acumulada (semana)
- 😊 Mood más frecuente al despertar (últimos 7 días)

#### 3.2 Gráficas

| Gráfica | Tipo | Descripción |
|---------|------|-------------|
| Calidad de sueño en el tiempo | Línea | Evolución de `sleep_quality` por día, últimos 30/60/90 días |
| Duración del sueño | Barras | Horas de sueño por noche con línea de objetivo |
| Hora de dormir vs. despertar | Scatter | Visualiza patrones de horario |
| Factores vs. calidad | Heatmap de correlación | Correlación entre cada factor y la calidad del sueño |
| Distribución de moods | Donut chart | Frecuencia de cada estado de ánimo al despertar |
| Sueños por tipo | Barras apiladas | Frecuencia de tipos de sueño en el período |
| Calidad por día de semana | Radar | Identifica qué días de la semana se duerme mejor |
| Cafeína vs. calidad | Scatter con tendencia | Relación entre tazas de café y calidad percibida |
| Estrés vs. calidad | Scatter con tendencia | Relación entre nivel de estrés y calidad |
| Ejercicio: con vs. sin | Comparativa | Calidad de sueño en días con y sin ejercicio |

#### 3.3 Controles del dashboard
- Selector de rango temporal: 7 / 14 / 30 / 90 días / personalizado
- Toggle entre modo oscuro y claro (el contexto nocturno de la app hace que el dark mode sea crítico)
- Exportar gráficas como PNG o PDF

---

### 4. Motor de IA (Claude API)

Esta es la capa diferenciadora de la app. Toda la comunicación con Claude ocurre en el **backend** para proteger la API key.

#### 4.1 Análisis semanal automático

**Trigger:** Se ejecuta automáticamente cada domingo a las 9:00 AM (job programado) o manualmente desde el dashboard.

**Input que se envía a Claude:**
```json
{
  "period": "2024-01-15 al 2024-01-21",
  "entries": [ /* últimas 7 entradas completas */ ],
  "user_goal_hours": 8,
  "historical_avg_quality": 6.8
}
```

**Output esperado de Claude:**
```json
{
  "summary": "Texto de resumen de la semana",
  "patterns_detected": [
    {
      "pattern": "Los días en que consumiste más de 2 cafés, tu calidad bajó en promedio 2.1 puntos",
      "confidence": "alta",
      "data_points": 5
    }
  ],
  "best_day": "Miércoles",
  "worst_day": "Viernes",
  "recommendations": [
    {
      "priority": "alta",
      "category": "cafeína",
      "recommendation": "Evitar café después de las 2PM",
      "evidence": "En 4 de 5 noches con café después de las 3PM, tu calidad fue menor a 5"
    }
  ],
  "trend": "improving" | "declining" | "stable"
}
```

**Presentación en la app:**
- Card expandible en el dashboard con el resumen en lenguaje natural
- Badge de tendencia (mejorando / estable / empeorando)
- Lista de patrones detectados con nivel de confianza visual
- Recomendaciones priorizadas (alta / media / baja) con su evidencia

#### 4.2 Predicción de calidad de sueño

**Trigger:** Al completar el formulario nocturno (antes de dormir).

**Lógica:** Se envía a Claude el registro nocturno actual + los últimos 30 días de historial. Claude predice la calidad de sueño esperada para esa noche.

**Input:**
```json
{
  "tonight_factors": { /* factores del día actual */ },
  "last_30_days": [ /* historial */ ]
}
```

**Output:**
```json
{
  "predicted_quality": 7,
  "confidence": "media",
  "reasoning": "Basándome en tus patrones, las noches en que el estrés supera 7 y el ejercicio fue leve, tu calidad promedia 6-7.",
  "tip_for_tonight": "Considera una rutina de 10 min de respiración antes de dormir"
}
```

**Presentación:** Después de guardar el formulario nocturno, aparece una card con la predicción y el tip para esa noche.

#### 4.3 Chat con tus datos de sueño

**Descripción:** Interfaz de chat donde el usuario puede hacerle preguntas en lenguaje natural a Claude sobre su propio historial de sueño.

**Ejemplos de preguntas:**
- "¿En qué mes dormí mejor este año?"
- "¿El ejercicio realmente me ayuda a dormir mejor?"
- "¿Qué diferencia hay entre cómo duermo los lunes vs. los viernes?"
- "¿Cuándo fue la última vez que tuve una semana con calidad promedio mayor a 8?"

**Implementación:**
- El backend inyecta el historial relevante como contexto en el system prompt de Claude
- Conversación multi-turn con historial de la sesión (no persiste entre sesiones)
- Límite de 20 mensajes por sesión para controlar costos de API
- El chat es accesible desde el dashboard como un panel lateral o modal

#### 4.4 Reporte mensual con insights de IA

**Trigger:** El primer día de cada mes (o manual).

**Contenido generado por Claude:**
- Resumen narrativo del mes
- Top 3 factores que más impactaron el sueño (positiva y negativamente)
- Comparación con el mes anterior
- Objetivo sugerido para el siguiente mes
- Logros destacados (rachas, mejoras, etc.)

**Formato de salida:** El reporte puede exportarse como PDF o enviarse al email del usuario.

#### 4.5 Gestión de costos de API

| Funcionalidad | Frecuencia estimada | Tokens aprox. |
|--------------|--------------------|--------------:|
| Análisis semanal | 1x semana | ~3,000 tokens |
| Predicción nocturna | 1x día | ~1,500 tokens |
| Chat | Variable (max 20 msg/sesión) | ~500 tokens/msg |
| Reporte mensual | 1x mes | ~5,000 tokens |

> Estimado total mensual con uso normal: **~100,000 tokens/mes**, dentro del tier estándar de la API de Anthropic.

---

### 5. Notificaciones y Recordatorios

#### 5.1 Tipos de notificación

| Tipo | Canal | Timing | Mensaje ejemplo |
|------|-------|--------|----------------|
| Recordatorio nocturno | Push (móvil) | Hora configurable (default: 10:00 PM) | "🌙 ¿Listo para dormir? Registra tus factores del día antes de acostarte." |
| Recordatorio matutino | Push (móvil) | Hora configurable (default: 7:30 AM) | "☀️ Buenos días. ¿Cómo dormiste? Toma 1 minuto para registrarlo." |
| Reporte semanal listo | Push + Email | Lunes 9:00 AM | "📊 Tu análisis semanal de sueño está listo. Claude encontró 2 patrones nuevos." |
| Alerta de deuda de sueño | Push | Cuando deuda > 5h acumuladas | "⚠️ Llevas 5+ horas de deuda de sueño esta semana. Tu cuerpo lo necesita." |
| Racha en riesgo | Push | Si no registró en 20h desde recordatorio | "📝 No olvides registrar tu sueño de anoche. Llevas 6 días de racha." |

#### 5.2 Configuración de notificaciones

El usuario puede personalizar:
- Activar / desactivar cada tipo de notificación independientemente
- Hora del recordatorio nocturno
- Hora del recordatorio matutino
- Día y hora del reporte semanal
- Umbral de alerta de deuda de sueño

#### 5.3 Implementación técnica

- **Móvil:** `expo-notifications` con scheduling local para los recordatorios diarios. No requiere servidor para las notificaciones básicas.
- **Reportes semanales/mensuales:** Jobs en el backend (cron via `node-cron` o Supabase Edge Functions) + push notification remota.
- **Web:** Web Push API + Service Worker para notificaciones en navegador (opcional, depende del browser del usuario).

---

### 6. Reportes y Exportación

#### 6.1 Reporte semanal
- Generado automáticamente cada lunes
- Incluye: resumen estadístico + insights de IA + gráficas del período
- Exportable como **PDF** o **CSV**
- Visualizable dentro de la app como página dedicada

#### 6.2 Reporte mensual
- Generado el primer día de cada mes
- Más detallado que el semanal: incluye comparativas mes a mes
- Exportable como **PDF**
- Narrado por Claude en lenguaje natural

#### 6.3 Exportación de datos crudos
- Exportar todo el historial como **CSV** o **JSON**
- Permite portabilidad total de los datos del usuario
- Útil si en el futuro se quiere analizar en otras herramientas (Excel, Python, etc.)

#### 6.4 Modo sin conexión (offline)
- La app móvil permite registrar entradas sin conexión a internet
- Los registros se almacenan localmente (`AsyncStorage`) y se sincronizan al reconectarse
- Las funcionalidades de IA requieren conexión (no se ejecutan offline)

---

## Modelo de Datos

### Entidad: `User`
```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  name            String?
  timezone        String   @default("America/Bogota")
  goal_hours      Float    @default(8.0)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  preferences     UserPreferences?
  sleep_entries   SleepEntry[]
  ai_reports      AIReport[]
  notifications   NotificationSettings?
}
```

### Entidad: `SleepEntry`
```prisma
model SleepEntry {
  id                  String   @id @default(cuid())
  user_id             String
  sleep_date          DateTime // Fecha de la noche (sin hora)
  
  // === REGISTRO NOCTURNO ===
  sleep_time          DateTime? // Timestamp completo
  notes_before        String?
  
  // Factores del día
  caffeine_cups       Int      @default(0)
  caffeine_last_hour  DateTime?
  exercise            Boolean  @default(false)
  exercise_type       String?  // cardio|weights|yoga|walk|other
  exercise_hour       DateTime?
  screen_time_hours   Float    @default(0)
  screen_before_sleep Boolean  @default(false)
  stress_level        Int?     // 1-10
  stress_source       String?
  alcohol             Boolean  @default(false)
  alcohol_drinks      Int      @default(0)
  heavy_meal          Boolean  @default(false)
  nap_today           Boolean  @default(false)
  nap_duration_min    Int      @default(0)
  
  // === REGISTRO MATUTINO ===
  wake_time           DateTime?
  sleep_quality       Int?     // 1-10
  mood_on_wake        String?  // rested|neutral|groggy|anxious|happy|sad|irritable
  energy_level        Int?     // 1-10
  dream_had           Boolean  @default(false)
  dream_notes         String?
  dream_type          String?  // neutral|pleasant|nightmare|lucid|recurring|forgot
  awakenings          Int      @default(0)
  notes_morning       String?
  
  // === MÉTRICAS CALCULADAS ===
  duration_hours      Float?
  sleep_efficiency    Float?
  
  // === IA ===
  ai_prediction       Json?    // Predicción generada antes de dormir
  
  // === METADATA ===
  is_complete         Boolean  @default(false) // Tiene ambas partes
  deleted_at          DateTime? // Soft delete
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  
  user                User     @relation(fields: [user_id], references: [id])
  
  @@index([user_id, sleep_date])
}
```

### Entidad: `AIReport`
```prisma
model AIReport {
  id          String   @id @default(cuid())
  user_id     String
  type        String   // weekly|monthly
  period_from DateTime
  period_to   DateTime
  content     Json     // Respuesta estructurada de Claude
  created_at  DateTime @default(now())
  
  user        User     @relation(fields: [user_id], references: [id])
}
```

### Entidad: `NotificationSettings`
```prisma
model NotificationSettings {
  id                    String   @id @default(cuid())
  user_id               String   @unique
  bedtime_reminder      Boolean  @default(true)
  bedtime_time          String   @default("22:00") // HH:MM
  wakeup_reminder       Boolean  @default(true)
  wakeup_time           String   @default("07:30")
  weekly_report         Boolean  @default(true)
  sleep_debt_alert      Boolean  @default(true)
  sleep_debt_threshold  Float    @default(5.0)
  streak_reminder       Boolean  @default(true)
  
  user                  User     @relation(fields: [user_id], references: [id])
}
```

---

## Diseño de API (Backend)

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registro de usuario (desactivado en fase personal) |
| POST | `/auth/login` | Login con email/password |
| POST | `/auth/logout` | Cerrar sesión |
| POST | `/auth/refresh` | Renovar access token |
| POST | `/auth/forgot-password` | Solicitar reset de contraseña |

### Sleep Entries
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/sleep` | Listar entradas (con filtros y paginación) |
| POST | `/sleep` | Crear nueva entrada (nocturna o matutina) |
| GET | `/sleep/:id` | Obtener entrada por ID |
| PATCH | `/sleep/:id` | Actualizar entrada parcialmente |
| DELETE | `/sleep/:id` | Soft delete de una entrada |
| GET | `/sleep/stats/summary` | KPIs del dashboard (últimos N días) |
| GET | `/sleep/stats/correlations` | Datos de correlación para gráficas |

### IA
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/ai/predict` | Predicción de calidad para esta noche |
| GET | `/ai/report/weekly` | Obtener o generar reporte semanal |
| GET | `/ai/report/monthly` | Obtener o generar reporte mensual |
| POST | `/ai/chat` | Enviar mensaje al chat con los datos de sueño |

### Usuario y Configuración
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/user/profile` | Obtener perfil |
| PATCH | `/user/profile` | Actualizar perfil |
| GET | `/user/notifications` | Obtener configuración de notificaciones |
| PATCH | `/user/notifications` | Actualizar configuración de notificaciones |
| GET | `/user/export` | Exportar datos como JSON o CSV |

---

## Flujos de Usuario

### Flujo 1: Primera vez en la app
```
Registro/Login → Configurar perfil (horarios, objetivo de horas)
→ Configurar notificaciones → Tutorial rápido (3 pantallas)
→ Dashboard vacío con CTA "Registra tu primera noche"
```

### Flujo 2: Registro nocturno (vía notificación)
```
Notificación push 10:00 PM → Abrir app → Formulario nocturno
→ Ingresar factores del día → Guardar
→ Pantalla de predicción: "Claude predice calidad 6/10 esta noche"
→ Tip de la noche → Cerrar app
```

### Flujo 3: Registro matutino (vía notificación)
```
Notificación push 7:30 AM → Abrir app → Formulario matutino
→ Ingresar calidad, mood, sueños, despertares → Guardar
→ Resumen de la noche: "Dormiste 7.5h · Calidad: 7/10"
→ Comparativa con promedio → Dashboard actualizado
```

### Flujo 4: Consultar el dashboard
```
Abrir app → Dashboard con KPIs actualizados
→ Navegar gráficas → Seleccionar rango temporal
→ Ver card de análisis semanal de IA
→ Explorar patrones y recomendaciones
```

### Flujo 5: Chat con IA
```
Dashboard → Botón "Pregúntale a Claude"
→ Interfaz de chat → Escribir pregunta en lenguaje natural
→ Claude responde con base en el historial real del usuario
→ Continuar conversación o cerrar
```

---

## Consideraciones de Privacidad y Seguridad

| Aspecto | Implementación |
|---------|---------------|
| API Key de Claude | Solo en variables de entorno del backend. Nunca expuesta al cliente. |
| Tokens de sesión | JWT con expiración corta (15 min) + refresh tokens (7 días) en httpOnly cookies |
| Datos en tránsito | HTTPS obligatorio en producción (TLS 1.2+) |
| Datos en reposo | PostgreSQL en Supabase con cifrado at-rest habilitado |
| Datos enviados a Claude | Solo datos de sueño propios, sin PII identificable (nombre, email) en el contexto enviado |
| Rate limiting | Límite de requests por IP y por usuario en endpoints de IA |
| Soft delete | Las entradas eliminadas no se borran físicamente; se mantienen para el historial de IA |
| Exportación | Solo el propio usuario puede exportar sus datos (autenticación requerida) |

---

## Fases de Desarrollo

### Fase 1 — MVP Core (Semanas 1-4)
- [ ] Setup del proyecto (monorepo: backend + web + mobile)
- [ ] Autenticación con Supabase (email/password + Google)
- [ ] Modelo de datos completo en PostgreSQL + Prisma
- [ ] CRUD de sleep entries (nocturno + matutino)
- [ ] Dashboard básico con KPIs en tarjetas
- [ ] Gráfica de calidad de sueño en el tiempo
- [ ] Notificaciones push básicas (nocturna + matutina)
- [ ] Deploy inicial (Vercel + Railway + Supabase)

### Fase 2 — IA y Análisis (Semanas 5-8)
- [ ] Integración Claude API en el backend
- [ ] Predicción de calidad de sueño (formulario nocturno)
- [ ] Análisis semanal automático con insights
- [ ] Chat con los datos de sueño
- [ ] Gráficas de correlación (factores vs. calidad)
- [ ] Heatmap de calidad en vista de calendario

### Fase 3 — Reportes y Pulido (Semanas 9-12)
- [ ] Reporte mensual con IA
- [ ] Exportación a PDF y CSV
- [ ] Modo offline en la app móvil
- [ ] Notificaciones avanzadas (deuda de sueño, racha en riesgo)
- [ ] Todos los tipos de gráficas del dashboard
- [ ] Dark mode completo
- [ ] Pruebas de usabilidad y ajustes de UX

### Fase 4 — Escalabilidad (Futuro)
- [ ] Multi-usuario (habilitar registro público)
- [ ] Plan premium con análisis de IA más profundos
- [ ] Integración con wearables (Apple Health, Google Fit, Fitbit)
- [ ] Análisis de ciclos de sueño con datos de wearable
- [ ] Versión iOS App Store + Google Play

---

## Estructura de Carpetas del Proyecto

```
dreamlog/
├── apps/
│   ├── web/                    # React + Vite
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/         # shadcn/ui base components
│   │   │   │   ├── charts/     # Componentes de Recharts
│   │   │   │   ├── forms/      # Formularios de sueño
│   │   │   │   └── layout/     # Sidebar, Header, etc.
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── SleepLog.tsx
│   │   │   │   ├── NewEntry.tsx
│   │   │   │   ├── AIChat.tsx
│   │   │   │   ├── Reports.tsx
│   │   │   │   └── Settings.tsx
│   │   │   ├── store/          # Zustand stores
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── lib/            # API client, utils
│   │   │   └── types/          # TypeScript types compartidos
│   │   └── package.json
│   │
│   └── mobile/                 # React Native + Expo
│       ├── src/
│       │   ├── screens/        # Equivalente a pages/
│       │   ├── components/     # Componentes nativos
│       │   ├── notifications/  # Configuración expo-notifications
│       │   ├── store/          # Zustand (mismo que web)
│       │   └── offline/        # Lógica offline + sync
│       └── package.json
│
├── packages/
│   ├── shared/                 # Código compartido web + mobile
│   │   ├── types/              # Tipos TypeScript (SleepEntry, User, etc.)
│   │   ├── schemas/            # Esquemas Zod de validación
│   │   └── utils/              # Funciones utilitarias puras
│   │
│   └── api-client/             # Cliente HTTP tipado para el backend
│
├── backend/                    # Hono.js + Node.js
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── sleep.ts
│   │   │   ├── ai.ts
│   │   │   └── user.ts
│   │   ├── services/
│   │   │   ├── ai.service.ts   # Toda la lógica de Claude API
│   │   │   ├── sleep.service.ts
│   │   │   └── notification.service.ts
│   │   ├── jobs/               # Cron jobs (reportes, alertas)
│   │   ├── middleware/         # Auth, rate limit, error handling
│   │   └── index.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml              # Tests en PR
│       └── deploy.yml          # Deploy en push a main
│
├── docker-compose.yml          # PostgreSQL local para desarrollo
├── .env.example
└── README.md
```

---

## Variables de Entorno

### Backend (`.env`)
```bash
# Base de datos
DATABASE_URL="postgresql://user:pass@localhost:5432/dreamlog"

# Supabase
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # Solo en backend

# IA
ANTHROPIC_API_KEY="sk-ant-..."

# App
JWT_SECRET="..."
PORT=3000
NODE_ENV="development"

# Notificaciones (Expo Push)
EXPO_ACCESS_TOKEN="..."
```

### Web (`.env.local`)
```bash
VITE_API_URL="http://localhost:3000"
VITE_SUPABASE_URL="https://xxxx.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ..."
```

---

## Escalabilidad Futura

Si en el futuro se decide escalar a un producto multi-usuario, los cambios necesarios son mínimos gracias al diseño desde el inicio con `user_id` en todas las entidades:

| Cambio | Esfuerzo |
|--------|---------|
| Habilitar registro público en Supabase | Bajo (config) |
| Plan freemium (limitar llamadas a IA) | Medio (middleware de cuotas) |
| Integración Apple Health / Google Fit | Alto (nueva capa de ingestión de datos) |
| App stores (iOS + Android) | Medio (build de Expo ya está listo) |
| Landing page pública | Bajo |

---

*Documento generado como base para el desarrollo de DreamLog v1.0*
*Stack propuesto sujeto a ajustes según preferencias del desarrollador durante la implementación.*
