export interface LLMRequest {
  system: string;
  user: string;
  /** JSON Schema the response must conform to. */
  jsonSchema: Record<string, unknown>;
}

/** Provider-agnostic client: returns the parsed (not yet validated) JSON object. */
export interface LLMClient {
  completeJson(req: LLMRequest): Promise<unknown>;
}

export class LLMError extends Error {
  constructor(message: string, readonly status: number = 502) {
    super(message);
  }
}
