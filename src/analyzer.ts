import { AnalysisSchema, analysisJsonSchema, type Analysis } from "./schema.js";
import { SYSTEM_PROMPT, buildUserMessage } from "./prompt.js";
import { LLMError, type LLMClient } from "./llm/types.js";

export async function analyzeCode(llm: LLMClient, code: string, language: string): Promise<Analysis> {
  const raw = await llm.completeJson({
    system: SYSTEM_PROMPT,
    user: buildUserMessage(code, language),
    jsonSchema: analysisJsonSchema,
  });
  const parsed = AnalysisSchema.safeParse(raw);
  if (!parsed.success) throw new LLMError("Model output did not match the expected schema.");
  return parsed.data;
}
