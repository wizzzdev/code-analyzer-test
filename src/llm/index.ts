import { AnthropicClient } from "./anthropic.js";
import type { LLMClient } from "./types.js";

export function createLLMClient(env: NodeJS.ProcessEnv = process.env): LLMClient {
  const provider = env.LLM_PROVIDER ?? "anthropic";
  switch (provider) {
    case "anthropic":
      return new AnthropicClient(env.ANALYZER_MODEL || undefined);
    default:
      throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
  }
}
export * from "./types.js";
