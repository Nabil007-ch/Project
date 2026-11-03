# OpsLens

Purchasing intelligence for SMB distributors. Frontend only; **stages 1–2 of 7** are implemented. Workspace names and product-group labels are illustrative. No live data or model output is shown.

## Run

Requires Node.js 22.12+ or Node 24 and npm. From the repository root:

```sh
npm install
npm run dev
```

For repeatable installation with the lockfile use `npm ci`.

```sh
npm run build
npm test
```

Vite prints the local address. `npm run preview` serves the production build after building.

## Current capabilities

Responsive sidebar, mobile navigation, route highlighting, unknown-route recovery, sample-data status, and a persistent System / Light / Dark appearance selector. Shared CSS tokens support both themes. Keyboard focus, a skip link, and reduced-motion support are included. React Router, TanStack Query, Tailwind CSS, Recharts, and the test tooling are installed.

The overview, recommendations, evaluation, and settings pages are explicit stage placeholders. Data-driven loading, error, and empty states come with shared components in stage 3. The typed API is ready for screens to consume; stage 2 keeps the visible pages as placeholders. See [the data contract](src/api/README.md) for API endpoints, sample math, assumptions, and error controls.

## Structure and teamwork

- `src/api/`: API contract, mock implementation, and `types/` for shared response types (implemented in stage 2).
- `src/components/`: shared UI and theme provider.
- `src/features/`: screen ownership boundaries: dashboard, recommendations, item-detail, evaluation, settings.
- `src/lib/`: shared formatting and calculation helpers.
- `src/styles/tokens.css`: palette, spacing, radii, shadows, and type sizes.
- `src/styles/app.css`: responsive shell and stage 1 presentation.
- `src/App.tsx`: navigation and stage placeholders; `src/main.tsx`: providers.

Feature directories are intentionally empty until their screen stages; Git tracks them once implementations arrive. The API and helper folders are now implemented. Screen implementations will move from placeholders into their feature folders. For four teammates, split API/types, shared UI, purchasing screens, and evaluation/settings. Agree on API response types first; screens will consume query hooks rather than import mock data directly. Coordinate token and shared-component changes.

## Next

Stage 3: shared UI components, including loading, empty, error, and tooltip states.
