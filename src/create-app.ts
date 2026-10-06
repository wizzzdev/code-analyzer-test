import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { AnalyzeRequestSchema } from "./schema.js";
import { analyzeCode } from "./analyzer.js";
import { createLLMClient, LLMError, type LLMClient } from "./llm/index.js";

export function createApp(getLLM: () => LLMClient = createLLMClient) {
  const app = new Hono();
  let llm: LLMClient | undefined;

  app.use("/analyze", cors());

  app.get("/health", (c) => c.json({ status: "ok", time: new Date().toISOString() }));

  app.post(
    "/analyze",
    zValidator("json", AnalyzeRequestSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: "Invalid request", details: result.error.issues }, 400);
      }
    }),
    async (c) => {
      const { code, language } = c.req.valid("json");
      try {
        llm ??= getLLM();
        return c.json(await analyzeCode(llm, code, language));
      } catch (err) {
        if (err instanceof LLMError) {
          return c.json({ error: err.message }, err.status as 422 | 429 | 500 | 502);
        }
        console.error(err);
        return c.json({ error: "Internal error" }, 500);
      }
    },
  );

  return app;
}
