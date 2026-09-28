# USN Digital Club

Private club operating system for **Union Sportive de Nadhour**. Arabic is the default
language; French is fully supported. The public website remains a separate consumer of the
future public-content API.

## Workspace

- `apps/api` — NestJS REST API, Prisma, PostgreSQL and OpenAPI
- `apps/web` — Next.js private management dashboard
- `apps/mobile` — Expo SDK 57 / Expo Router mobile application
- `packages/types` — shared domain, DTO and authorization types
- `packages/config` — club identity, navigation and role/permission policy
- `packages/ui` — shared web design primitives
- `packages/utils` — shared date and display helpers

See [`docs/architecture.md`](docs/architecture.md) for the domain and authorization design.

## Local development

1. Copy `.env.example` to `.env` and change secrets.
2. Run `npm install`.
3. Start PostgreSQL with `docker compose up -d postgres`.
4. Run `npm run db:generate`, `npm run db:migrate`, then `npm run db:seed`.
5. Start the API with `npm run dev:api` and dashboard with `npm run dev:web`.

## Test on a phone

1. Put the computer and phone on the same Wi-Fi network.
2. Set `EXPO_PUBLIC_API_URL=http://<computer-lan-ip>:4000/api/v1` in `apps/mobile/.env`.
3. Start the API with `npm run dev:api`.
4. Start Expo with `npm run dev:mobile`, then scan the QR code in Expo Go.

Phase 2 includes database-backed training and attendance, matches and squads, internal announcements, and in-app notifications on both web and mobile.

Phase 3 adds category-scoped medical availability with confidential-note redaction, configurable
physical testing, guardian/player links, and the player-trial workflow. The Arabic/French dashboard
routes are `/medical`, `/performance`, `/guardians`, and `/trials`.

Seed login: `admin@usn.tn` / `ChangeMe123!` (development only; change immediately).

Production seeding requires a strong `SEED_ADMIN_PASSWORD`; the development default is rejected when `NODE_ENV=production`.

## Supabase database

The hosted database is provisioned in the **USN** Supabase organization as
`usn-digital-club` (project ref `kfkdqprvuyegdayhqkwq`, Paris `eu-west-3`). Its application
schema, RBAC foundation, seed data, RLS hardening, and foreign-key indexes are applied.

The Supabase Data API roles have no access to the private application tables. The Nest API is the
only supported data-access layer and must use a server-only PostgreSQL `DATABASE_URL`. Never expose
that URL through a `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*` variable. The hosted seed account is
`admin@usn.tn`; its generated password is stored only in the ignored `apps/api/.env` file.

See [`docs/architecture.md`](docs/architecture.md#supabase-hosting) for the security model and
deployment notes.
