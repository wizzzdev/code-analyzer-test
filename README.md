# Code Analyzer

An API service and web UI that sends source code to an LLM (Claude) and returns a structured review: summary, issues, suggestions and metrics.

**Live:** https://prompting-techniques-test.vercel.app

Built with TypeScript, [Hono](https://hono.dev), [Zod](https://zod.dev) and the [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript). Deployed on Vercel.

## How it works

```
POST /analyze  {"code": "...", "language": "python"}
   │  Zod validates the request
   ├─ system prompt + line-numbered code ──▶ LLM (JSON-schema constrained output)
   │  Zod validates the model's response
   └─▶ {summary, issues[], suggestions[], metrics{}}
```

- Code is sent with `N | ` line prefixes so the model reports accurate line numbers.
- The LLM is given a JSON Schema (generated from the Zod schema) so output is constrained, then re-validated with Zod before being returned.
- The code is treated as data: the system prompt tells the model to ignore any instructions embedded in it.

## Getting started

Requires Node 20+ and an [Anthropic API key](https://console.anthropic.com/).

```bash
npm install
cp .env.example .env     # then set ANTHROPIC_API_KEY
npm run dev              # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with reload; serves the API and the UI |
| `npm test` | Runs tests (uses a fake LLM, no API key needed) |
| `npm run typecheck` | Type-checks with `tsc` |

### Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | yes | | Anthropic credentials |
| `ANALYZER_MODEL` | no | `claude-opus-5-5` | Model used for analysis |
| `LLM_PROVIDER` | no | `anthropic` | LLM backend (only `anthropic` is implemented) |
| `PORT` | no | `3000` | Local dev port |

## API

### `GET /health`
```json
{"status": "ok", "time": "2026-10-06T22:45:54.837Z"}
```

### `POST /analyze`

Request:
```json
{"code": "def f(x):\n  return eval(x)\n", "language": "python"}
```
`code` is required (max 50,000 characters). `language` defaults to `"other"`.

Response (`200`):
```json
{
  "summary": "2-3 sentence overview.",
  "issues": [
    {
      "severity": "critical",
      "line": 2,
      "category": "security",
      "description": "eval(x) executes arbitrary code...",
      "suggestion": "Use ast.literal_eval(x)..."
    }
  ],
  "suggestions": ["Add unit tests..."],
  "metrics": {
    "complexity": "low",
    "readability": "medium",
    "test_coverage_estimate": "none"
  }
}
```

| Field | Values |
|---|---|
| `severity` | `low` `medium` `high` `critical` |
| `category` | `bug` `security` `performance` `style` `maintainability` |
| `line` | 1-based line number, or `null` if not tied to one line |
| `complexity`, `readability` | `low` `medium` `high` |
| `test_coverage_estimate` | `none` `low` `medium` `high` |

Errors return `{"error": "..."}` with status `400` (invalid request), `422` (model declined), `429` (LLM rate limit), `500` (server misconfiguration) or `502` (LLM failure or invalid output).

```bash
curl -X POST https://prompting-techniques-test.vercel.app/analyze \
  -H 'content-type: application/json' \
  -d '{"code": "x = eval(input())", "language": "python"}'
```

## Project structure

```
src/
  index.ts         Vercel entrypoint (default-exports the Hono app)
  dev.ts           Local server: API + static files from public/
  create-app.ts    Routes: /health, /analyze
  analyzer.ts      Calls the LLM and validates the result
  prompt.ts        System prompt and user-message builder
  schema.ts        Zod schemas (request, response) + JSON Schema for the LLM
  llm/             LLM client abstraction (types.ts, anthropic.ts, index.ts)
public/index.html  Web UI (paste/upload, language picker, results panel)
samples/           Intentionally flawed code to try in the analyzer
test/              Tests with a fake LLM
```

### Adding another LLM provider

Implement `LLMClient` from `src/llm/types.ts` (one method, `completeJson`), then register it in the `switch` in `src/llm/index.ts`.

## Deploying to Vercel

```bash
vercel link
vercel env add ANTHROPIC_API_KEY production
vercel --prod
```

Notes:
- Vercel's Hono preset detects `src/index.ts` (a file that imports `hono` and default-exports the app). Don't name another file in `src/` `app.ts`, `server.ts` or `index.ts`.
- Relative imports use `.js` extensions because Vercel runs the compiled output as native ESM.
- `public/` is served by the CDN; `/` redirects to `/index.html`.
- The API key is Production-only unless you also add it for Preview/Development.

## Security notes

`/analyze` is unauthenticated and spends LLM credits per call. Before sharing the URL widely, add rate limiting or an auth check.
