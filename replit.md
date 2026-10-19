# MERSAD AI

Arabic RTL recipe costing and delivery-channel profitability tool for home restaurants in Kuwait. The former general ledger is retained for data preservation, not as the main product.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `node --experimental-strip-types --test scripts/tests/costing.test.mjs` — cost and margin regression tests
- `node --test scripts/tests/kitchen-api.test.mjs` — live development API flow (creates and cleans up its own test records)
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
- `artifacts/api-server/src/routes/kitchen.ts` — ingredients, dishes, recipes, channel fees.
- `artifacts/api-server/src/lib/costing.ts` — waste-adjusted unit costing and margin calculations.
- `artifacts/api-server/src/lib/kitchen-state.ts` — consistent costs, profits, price changes, alerts.
- `artifacts/api-server/src/routes/kitchen-advice.ts` — on-demand OpenAI advice grounded in computed numbers.
- `lib/api-spec/openapi.yaml` — API contract; regenerate clients after changes.
- `lib/db/src/schema` — database schema.

## Architecture decisions

- Currency is stored as integer fils, never floating-point dinars. **Why:** KWD uses three decimal places and financial totals must remain exact.
- This first release is a shared demonstration, not private financial storage. **Why:** authentication was not part of the initial request. Keep the demo warning visible and add authentication plus ownership checks before inviting real financial data.
- Stitch screens were inaccessible behind Google sign-in. **Why:** the initial implementation follows the user's written visual direction, not a claimed reproduction of unseen screens.
- Recipes represent one sold portion. Quantities are net usable amounts. Cost per line is purchase price × converted quantity ÷ usable yield after waste, rounded to fils; COGS is the line sum plus per-portion packaging.
- Profit per channel is that channel's selling price minus rounded commission, fixed channel fee, and COGS. It excludes unentered operating overhead. Suggested prices target a 20% margin on selling price, not a 20% markup on cost.
- Platform fees are illustrative editable inputs, never official rates or an API connection to delivery platforms.
- AI does not own arithmetic or change prices. Automatic alerts use verified calculations; OpenAI text is requested explicitly, cached against its source data, and fails visibly if unavailable. Ingredient increases compare against the last saved purchase-price change, not live supplier monitoring.

## Product

- Ingredient purchase units (kg, g, l, ml, piece), prices, waste percentages and recorded price-change alerts.
- Editable dish recipes, quantities, compatible unit conversions, packaging and per-channel selling-price overrides.
- Local, Talabat and Deliveroo profitability comparison, editable commissions/fixed fees, red loss warnings, break-even and target-margin prices.
- On-demand Arabic AI pricing advice with explicit loading/error states; initial data is labeled examples.
- The prior transaction records and API are retained without making them the main navigation.

## User preferences

- The user wants white, light gray, and light navy, with an organized Arabic interface and comfortable whitespace.
- Product audience: home restaurants in Kuwait.

## Gotchas

- OpenAPI date-only fields are coerced to Date by generated Zod schemas. Validate output but serialize calendar dates as `YYYY-MM-DD`, not date-time strings.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
