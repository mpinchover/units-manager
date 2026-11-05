# UnitManager (web app)

A minimalist web app for landlords to manage buildings, units, tenants and leases, and to generate lease PDFs.

- **This folder:** the Next.js 16 UI.
- **`../server`:** the Flask API (Firebase Auth + Firestore). See `../server/README.md`.

## Demo mode (current default)

The app currently runs as a **self-contained prototype**: sign-in is real (Firebase: Google or email/password), but everything else happens in the browser.

- It starts with fake data: 3 buildings, 7 units, 10 tenants and 3 leases (`lib/demo/seed.ts`).
- Adding, editing and deleting work, but only in that browser tab's memory. **Reloading the page resets everything** to the fake data.
- Lease previews and PDFs are generated in the browser from a bundled copy of the lease template (`lib/demo/lease-template.ts`).
- Nothing calls the Flask server, so it can be deployed on its own (e.g. Vercel) with no `API_URL`.

```bash
npm install
npm run dev        # http://localhost:3000
```

If you edit `../server/lease_templates/lease.txt`, refresh the demo's copy with `npm run sync-template`.

## Pointing the app back at the server (API mode)

All data access goes through one interface (`lib/data-source/types.ts`) with two implementations:

| `NEXT_PUBLIC_DATA_SOURCE` | Implementation | Data |
| --- | --- | --- |
| `demo` (default) | `lib/demo/store.ts` | In browser memory; reset on reload |
| `api` | `lib/data-source/api.ts` → `app/actions/api-source.ts` | The Flask API and Firestore |

To switch back:

1. Run the Flask server somewhere the Next.js server can reach (see `../server/README.md` for setup and hosting).
2. Set these environment variables (in `.env.local` locally, or Vercel → Settings → Environment Variables):
   ```bash
   NEXT_PUBLIC_DATA_SOURCE=api
   API_URL=https://your-api-host.example.com
   ```
3. Rebuild/redeploy. `NEXT_PUBLIC_*` values are baked in at build time, so a redeploy is required.

No code changes are needed. In API mode:

- After Firebase sign-in, the app exchanges the ID token for an httpOnly session cookie.
- `proxy.ts` sends signed-out visitors to `/login`.
- All reads and writes go through Server Actions to Flask; the browser never talks to Flask or Firestore directly.
- PDFs stream through `app/api/leases/...`.

## How it's organized

| Path | What |
| --- | --- |
| `components/app-provider.tsx` | Checks sign-in, loads data from the active source, and gives pages `useApp()` (data, formatting, actions) |
| `components/use-mutations.ts` | Save/delete handlers used by the forms (both modes) |
| `lib/data/portfolio.ts` | Turns raw records into linked views (units ↔ leases ↔ tenants) |
| `app/(app)/**/view.tsx` | The page UIs (client components); each `page.tsx` just renders its view |
| `lib/demo/*` | Demo mode: fake data, in-memory store, validation, lease template and PDF rendering |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop, build and serve |
| `npm test` | Unit tests for dates and formatting |
| `npm run lint` | ESLint |
| `npm run sync-template` | Copy `../server/lease_templates/lease.txt` into the demo bundle |
