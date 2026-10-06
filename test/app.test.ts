import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/create-app.js";

const fake = {
  completeJson: async () => ({
    summary: "ok",
    issues: [{ severity: "high", line: 1, category: "bug", description: "d", suggestion: "s" }],
    suggestions: ["a"],
    metrics: { complexity: "low", readability: "high", test_coverage_estimate: "none" },
  }),
};
const post = (app: ReturnType<typeof createApp>, body: unknown) =>
  app.request("/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

test("health", async () => {
  const res = await createApp(() => fake).request("/health");
  assert.equal(res.status, 200);
});
test("analyze ok", async () => {
  const res = await post(createApp(() => fake), { code: "x=1", language: "python" });
  assert.equal(res.status, 200);
  assert.equal((await res.json() as any).issues[0].severity, "high");
});
test("analyze rejects empty code", async () => {
  assert.equal((await post(createApp(() => fake), { code: "" })).status, 400);
});
test("analyze rejects bad LLM output", async () => {
  const bad = { completeJson: async () => ({ nope: 1 }) };
  assert.equal((await post(createApp(() => bad), { code: "x" })).status, 502);
});
