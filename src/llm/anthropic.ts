import Anthropic from "@anthropic-ai/sdk";
import { LLMError, type LLMClient, type LLMRequest } from "./types.js";

export class AnthropicClient implements LLMClient {
  private client: Anthropic;

  constructor(private model = "claude-opus-5-5") {
    if (!process.env.ANTHROPIC_API_KEY) throw new LLMError("ANTHROPIC_API_KEY is not set on the server.", 500);
    this.client = new Anthropic();
  }

  async completeJson({ system, user, jsonSchema }: LLMRequest): Promise<unknown> {
    try {
      const response = await this.client.beta.messages.create({
        model: this.model,
        max_tokens: 8000,
        // Retry on another model server-side if safety classifiers decline.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system,
        output_config: {
          effort: "medium",
          format: { type: "json_schema", schema: jsonSchema },
        },
        messages: [{ role: "user", content: user }],
      } as Anthropic.Beta.MessageCreateParamsNonStreaming);

      if (response.stop_reason === "refusal") {
        throw new LLMError("The model declined to analyze this input.", 422);
      }
      if (response.stop_reason === "max_tokens") {
        throw new LLMError("The analysis was cut off; try a shorter snippet.", 502);
      }
      const text = response.content.find((b) => b.type === "text");
      if (!text || text.type !== "text") throw new LLMError("Empty response from model.");
      try {
        return JSON.parse(text.text);
      } catch {
        throw new LLMError("Model returned invalid JSON.");
      }
    } catch (err) {
      if (err instanceof LLMError) throw err;
      if (err instanceof Anthropic.AuthenticationError) throw new LLMError("LLM credentials are invalid or missing.", 500);
      if (err instanceof Anthropic.RateLimitError) throw new LLMError("LLM rate limit hit; retry shortly.", 429);
      if (err instanceof Anthropic.APIError) throw new LLMError(`LLM API error (${err.status}): ${err.message}`);
      throw err;
    }
  }
}
