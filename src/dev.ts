import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { createApp } from "./create-app.js";

const app = new Hono();
app.route("/", createApp());
app.use("/*", serveStatic({ root: "./public" }));

const port = Number(process.env.PORT) || 3005;
serve({ fetch: app.fetch, port }, () => console.log(`Code Analyzer running at http://localhost:${port}`));
