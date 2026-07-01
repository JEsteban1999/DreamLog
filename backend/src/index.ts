import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth.js";
import { sleepRoutes } from "./routes/sleep.js";
import { aiRoutes } from "./routes/ai.js";
import { userRoutes } from "./routes/user.js";
import { internalRoutes } from "./routes/internal.js";

const app = new Hono();

app.use("*", cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" }));

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/auth", authRoutes);
app.route("/sleep", sleepRoutes);
app.route("/ai", aiRoutes);
app.route("/user", userRoutes);
app.route("/internal", internalRoutes);

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`DreamLog backend escuchando en http://localhost:${info.port}`);
});
