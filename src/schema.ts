import { z } from "zod";

export const LANGUAGES = [
  "python", "javascript", "typescript", "java", "go", "rust", "c", "cpp",
  "csharp", "ruby", "php", "swift", "kotlin", "sql", "bash", "other",
] as const;

export const MAX_CODE_CHARS = 50_000;

export const AnalyzeRequestSchema = z.object({
  code: z.string().trim().min(1, "code is required").max(MAX_CODE_CHARS, `code must be at most ${MAX_CODE_CHARS} characters`),
  language: z.string().trim().min(1).max(40).default("other"),
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

const Level = z.enum(["low", "medium", "high"]);

export const IssueSchema = z.object({
  severity: z.enum(["low", "medium", "high", "critical"]),
  line: z.number().nullable().describe("1-based line number, or null if not tied to one line"),
  category: z.enum(["bug", "security", "performance", "style", "maintainability"]),
  description: z.string(),
  suggestion: z.string(),
});

export const AnalysisSchema = z.object({
  summary: z.string().describe("2-3 sentence overview"),
  issues: z.array(IssueSchema),
  suggestions: z.array(z.string()).describe("General improvements"),
  metrics: z.object({
    complexity: Level,
    readability: Level,
    test_coverage_estimate: z.enum(["none", "low", "medium", "high"]),
  }),
});
export type Analysis = z.infer<typeof AnalysisSchema>;
export type Issue = z.infer<typeof IssueSchema>;

/** JSON Schema handed to the LLM for constrained output. */
export const analysisJsonSchema = (() => {
  const { $schema: _omit, ...schema } = z.toJSONSchema(AnalysisSchema) as Record<string, unknown>;
  return schema;
})();
