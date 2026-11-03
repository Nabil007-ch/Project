# Data contract

Screens import the singleton `api` from `src/api` or the TanStack Query hooks from `queries.ts`. They must not import `mock/generate.ts`. Types live in `types/index.ts`. No screen depends on an implementation.

## Switch to a backend

Default: mock API, 250 ms simulated latency, 2% simulated failures. Records use seed 27017 and a fixed as-of date of November 2, 2026. Set `VITE_MOCK_ERROR_RATE=0` in `.env.local` for reliable demos, or `1` to exercise error states; restart Vite after changing environment settings. The error sequence is seeded separately from the records. Query retries may mask occasional errors; force rate 1 to test retry UI.

One configuration line selects HTTP instead:

```dotenv
VITE_API_BASE_URL=https://your-service.example/api
```

`VITE_` variables are public browser configuration; never put credentials in them. The backend must implement the following JSON contract and enable CORS for the frontend origin when hosted separately. HTTP requests time out after 15 seconds. There is no backend in this project, so only the HTTP adapter itself has been tested with mocked fetch responses.

| Client method       | Request                                                       | JSON response        |
| ------------------- | ------------------------------------------------------------- | -------------------- |
| getItems            | GET /items?search=&supplierId=&state=                         | Item[]               |
| getSuppliers        | GET /suppliers                                                | Supplier[]           |
| getRecommendations  | GET /recommendations?search=&supplierId=&urgency=             | RecommendationRow[]  |
| getItemDetail       | GET /items/:id                                                | ItemDetail           |
| updateServiceLevel  | PATCH /items/:id/service-level, body `{ "serviceLevel": 99 }` | Updated ItemDetail   |
| getBacktestResults  | GET /evaluation                                               | BacktestResults      |
| getDataSourceStatus | GET /data-source                                              | DataSourceStatus     |
| testConnection      | POST /data-source/test                                        | ConnectionTestResult |

These are the stage 2 **sample-data** response types. When live or CSV integration is implemented, extend the source discriminator and forecast method types together with the backend. The current types deliberately make no claim to live data or trained model results. Responses are TypeScript contracts, not runtime schema validation; the future backend must return conforming JSON.

## Units and semantics

- Quantities are individual units. Costs are USD. Dates are ISO calendar dates in UTC.
- Supplier lead time and standard deviation are days. Annual holding rate `0.22` means 22% of unit cost per year.
- Service targets are cycle-service percentages: 90, 95, 98, 99. Backtest service is a unit fill rate (also 0–100), which is a different measure; the response carries definitions.
- `getRecommendations` includes all 60 items, including zero-quantity recommendations (`urgency: none`), for filtering and comparison.
- Sample target changes last for the client session and reset on refresh. They do not alter the stock snapshot or historical evaluation. Query mutations optimistically update the detail cache, restore the previous detail on failure, and refresh item/recommendation lists after success. The preview calculation stays inside the API/query layer; screen components do not import mock logic.
- Empty queries return `[]`; unknown IDs raise `ApiError` 404. Unsupported service levels raise 400. Simulated interruptions raise 503. `ApiError` exposes a safe message, status, and code.

## Recommendation policy

`src/lib/recommendation.ts` contains the shared pure sample policy (also re-exported by `mock/recommendation.ts`):

1. Expected demand = daily sample mean proxy × average supplier lead time.
2. Lead-time demand variance = lead days × daily demand variance + daily mean² × lead-time standard deviation².
3. Safety stock = ceiling(z-score for service target × lead-time demand standard deviation).
4. Target stock = expected lead-time demand + safety stock.
5. Inventory position = on hand + on order − allocated.
6. Order = positive target gap, rounded up to whole supplier packs.

For example, expected demand 85 and standard deviation 20 at a 95% target give safety stock 33 and target 118. With 20 on hand, 12 on order, and 2 allocated, inventory position is 30. The gap is 88; packs of 12 give an order of 96, including 8 rounding units.

The mock uses a constant sample mean as a P50 proxy and normal-approximation ranges. For intermittent demand these are not calibrated medians or probabilities. Range endpoints are independently constructed for the lead-time horizon; summing daily endpoints would incorrectly assume perfectly correlated daily uncertainty. The future probabilistic model must replace these assumptions. P10–P90 is an illustrative 80% band, not a guaranteed interval. Existing open orders are assumed to arrive in time; the mock does not track their receipt dates. Holding cost is displayed as an input and measured during replay but does not optimize the sample ordering rule.

## Evaluation replay

`mock/backtest.ts` compares three transparent policies on the last 56 of 112 historical days, after parameter estimation on the first 56. Each policy starts from the same stock and receives the same simulated lead-time schedule. Unmet demand is counted as lost sales. OpsLens uses lead-time uncertainty in its safety buffer; the standard rule holds three days of safety stock; seasonal naive repeats demand from seven days earlier. This is an illustrative rule comparison, not real model performance. Holding cost excludes purchases and shortage costs. Stock-out days are aggregated **item-days**, up to 60 × 56; they can exceed 56 calendar days.
