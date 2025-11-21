# Repository Guidelines

## Project Structure & Module Organization
This repo is a Node 20+ workspace where the root package only proxies scripts into the real MCP package under `mcp/`. Runtime code lives in `mcp/src`: `core/` wires the Model Context Protocol server, `tools/` and `resources/` expose the Riksdag and g0v fetchers, `utils/` holds HTTP helpers with caching/schema glue, and `server.ts` bootstraps the Express HTTP mode. Deployment descriptors (`render.yaml`, `server.json`, `Dockerfile`) and guides describe hosting choices. Bundled output lands in `mcp/dist/`; never edit it manually.

## Build, Test, and Development Commands
Run `npm run mcp:install` once to pull workspace dependencies. `npm run mcp:dev` starts the HTTP server with hot reload, while `npm run mcp:start` runs the compiled server from `dist`. Use `npm run mcp:build` before publishing to regenerate TypeScript output and `npm run mcp:type-check` for fast validation. Jest-based checks execute via `npm run mcp:test`; use `PORT=3333 npm run mcp:start` when reproducing STDIO adapters against a local port.

## Coding Style & Naming Conventions
Write modern TypeScript with ES modules, two-space indentation, and descriptive named exports (`fetchGovernmentDocuments`, `createMCPServer`). Schema validation flows through shared `zod` instances in `utils/` so Tool definitions remain consistent. Tool filenames follow `verbSubject.ts` (e.g., `search.ts`, `content.ts`) and shared helpers belong in `utils/`. Prefer async/await over promise chains, log with Winston, and keep response payloads camelCased to match the SDK.

## Testing Guidelines
Unit and integration tests belong next to the code under `mcp/src/**/*` as `<feature>.test.ts`, using `ts-jest` for TypeScript support. Mock outbound HTTP with `global.fetch` stubs or fixtures of `data.riksdagen.se` payloads so tests stay deterministic. Every new tool should ship schema coverage, a happy-path execution test, and one failure-path assertion (e.g., rate limiting).

## Commit & Pull Request Guidelines
Follow the short, imperative commit style already in history (`Remove cleanup docs and workflows`). Each PR should describe the tools/resources touched, list external endpoints impacted, and include verification notes such as ``npm run mcp:build && npm run mcp:test``. Attach screenshots or sample tool responses whenever formatting changes. Keep refactors separate and update README plus implementation guides when CLI usage or environment variables change.

## Security & Configuration Tips
Keep secrets in `.env` files (see `mcp/.env.example`) and never commit them. If you override the default Riksdag User-Agent (`RIKSDAG_USER_AGENT`) document it inside the PR so reviewers can reproduce request headers. When deploying HTTP mode, configure `API_KEY` so `/mcp` endpoints remain protected, and verify rate limiting remains enabled after middleware edits.
