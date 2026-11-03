# OpsLens — three-minute defense demo

Before presenting: run `npm install`, set `VITE_MOCK_ERROR_RATE=0` in `.env.local`, then `npm run dev`. Open `/`, use the light theme, and keep the browser wide enough to read the tables. All records and results are sample data. An export downloads a CSV, not a purchase order.

## 0:00–0:25 — The buyer’s question

“Distributors need to know what to order, how much, and when. OpsLens puts that decision in one workspace and explains its numbers. This is a frontend prototype using 60 seeded beverage items, not a live GP connection or a trained AI model.”

Point to the persistent Sample data label and the dashboard’s four metrics. Explain that planned service is the average configured target, not a predicted result.

## 0:25–0:55 — Find the work that matters

Open Recommendations. Filter timing to Order now and choose a supplier. Sort by order quantity. Select one or two rows and export the review list.

“The buyer can narrow the list, compare demand and stock, and download suggestions. This action never places an order or writes to GP.”

Clear the filters and search `BEV-1001` to reach the item used in the next step.

## 0:55–1:40 — Explain one order

Open Sparkling Water · 250 ml can (`/items/bev-001`). Explain the last 28 days of observed demand and the next 28 illustrative forecast days. Expand the chart’s table alternative if useful.

“For this sample item, expected demand during the seven-day lead time is 28 units. At a 95% target, the rule adds 31 units of safety stock: target 59. Nine units are on hand and 18 on order, so inventory position is 27. The gap is 32. Packs of six round the order to 36.”

Change the target to 99%. Point out the immediate quantity and explanation update, then the save confirmation.

“The service target changes the buffer. The sample uses a transparent normal-approximation rule; it is not a calibrated intermittent-demand forecast. Holding cost is context, not an optimization input in this rule.”

## 1:40–2:20 — Compare the trade-off

Open Evaluation. Show the table and two charts.

“The first 56 historical days set the rules; the next 56 are replayed. Each policy starts with the same inventory and delivery schedule. We compare stock-out item-days, holding cost, unit fill rate, and range coverage. These are illustrative simulation results, not evidence of real model performance.”

Explain that fill rate differs from the item service target. More buffer may improve availability but costs more to hold. Coverage should be near the band’s intended 80%; higher coverage alone is not necessarily better.

## 2:20–2:45 — Show the boundary

Open Settings. Run Test connection. Select CSV upload preview, show the required columns, and download the example if desired. Show that GP is disabled.

“The test is simulated. CSV files can be checked locally but don’t replace the sample inventory. A future backend will supply read-only GP access; this frontend cannot edit business records.”

## 2:45–3:00 — Close on what is built

Switch appearance to dark or narrow the browser to demonstrate responsive navigation.

“The completed frontend separates screens from a typed API client. The backend can replace the mock at that boundary. We have tested the sample calculations, errors, user interactions, and production build; live integration and model evaluation remain future work.”
