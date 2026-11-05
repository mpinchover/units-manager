# UnitManager (web app)

A minimalist web app for landlords to manage buildings, units, tenants and leases, generate lease PDFs, and get emailed before leases expire.

- **This folder:** the Next.js 16 UI (App Router, Server Components, Server Actions).
- **`../server`:** the Flask API that owns all server operations and talks to Firebase (Auth + Firestore). See `../server/README.md`.

## How it fits together

1. The browser signs in with the Firebase JS SDK (`firebase/firebase.js`): **Google** or **email/password**.
2. The fresh ID token goes to a Server Action, which asks the API to mint a Firebase **session cookie** and stores it as an httpOnly cookie.
3. Server Components and Server Actions call the API with that session; the API verifies it on every request and scopes all data to the user.
4. PDFs and photos are streamed through `app/api/...` route handlers, so the session never leaves the server.

## Getting started

```bash
npm install
cp .env.example .env.local
# start the API first (../server/README.md), then:
npm run dev        # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop, build and serve |
| `npm test` | Unit tests for lease status, dates and formatting |
| `npm run lint` | ESLint |

## Notes

- Occupancy is derived from leases: a unit is occupied when a *finalized* lease covers today.
- Generate Lease collects the template variables, shows a preview of the filled lease, and Download PDF saves it. Amending a lease adds a new PDF version and keeps the old ones.
- In production, serve both apps over HTTPS. Session cookies are `Secure` and HSTS is sent when `NODE_ENV=production`.
