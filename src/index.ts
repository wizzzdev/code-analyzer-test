import { Hono } from "hono";
import { createApp } from "./create-app.js";

// Vercel's Hono preset picks up the default export; static files in /public are served by the CDN.
const app = new Hono();
// The catch-all function route shadows the CDN for "/", so send it to the static page.
app.get("/", (c) => c.redirect("/index.html"));
app.route("/", createApp());

export default app;
