# MERSAD AI

Arabic RTL finance tracker for home restaurants in Kuwait: income, expenses, and monthly profit in KWD.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mersad-ai` — web frontend.
- `artifacts/api-server/src/routes/finance.ts` — financial operations and dashboard aggregation.
- `lib/api-spec/openapi.yaml` — API contract; regenerate clients after changes.
- `lib/db/src/schema` — database schema.

## Architecture decisions

- Currency is stored as integer fils, never floating-point dinars. **Why:** KWD uses three decimal places and financial totals must remain exact.
- This first release is a shared demonstration, not private financial storage. **Why:** authentication was not part of the initial request. Keep the demo warning visible and add authentication plus ownership checks before inviting real financial data.
- Stitch screens were inaccessible behind Google sign-in. **Why:** the initial implementation follows the user's written visual direction, not a claimed reproduction of unseen screens.

## Product

- Current-month revenue, expenses, net profit, changes versus the previous month, and six-month trend.
- Search and filter transactions by type and month; create, edit, and delete persisted records.
- Initial records are explicitly labeled examples.

## User preferences

- The user wants white, light gray, and light navy, with an organized Arabic interface and comfortable whitespace.
- Product audience: home restaurants in Kuwait.

## Gotchas

- OpenAPI date-only fields are coerced to Date by generated Zod schemas. Validate output but serialize calendar dates as `YYYY-MM-DD`, not date-time strings.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
