# USN Digital Club

A club operations platform for managing teams, training sessions, attendance, matches,
announcements, medical availability, performance testing, guardians, and player trials.
Arabic is the default language, with French support across the web and mobile apps.

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

1. Copy `.env.example` to `.env`.
2. Replace every placeholder with your own local value. Never commit an `.env` file.
3. Run `npm install`.
4. Start PostgreSQL with `docker compose up -d postgres`.
5. Run `npm run db:generate`, `npm run db:migrate`, and `npm run db:seed`.
6. Start the API with `npm run dev:api` and the dashboard with `npm run dev:web`.

Create development users with credentials unique to your environment. Do not publish shared,
default, production, or hosted-environment credentials in documentation or source control.

## Test on a phone

1. Put the computer and phone on the same Wi-Fi network.
2. Set `EXPO_PUBLIC_API_URL=http://<computer-lan-ip>:4000/api/v1` in
   `apps/mobile/.env`.
3. Start the API with `npm run dev:api`.
4. Start Expo with `npm run dev:mobile`, then scan the QR code in Expo Go.

Only the API base URL may be exposed to the Expo client. Database credentials and service-role
keys must remain server-side.

## Database and security

The API supports PostgreSQL hosted locally or through Supabase. Configure the server-only
`DATABASE_URL` in the API environment and apply the Prisma migrations before starting the app.

The NestJS API is the supported data-access layer. Never place database connection strings,
service-role keys, signing secrets, or administrative credentials in `NEXT_PUBLIC_*` or
`EXPO_PUBLIC_*` variables.

Role-based authorization and category scoping are enforced by the API. Sensitive medical notes
are redacted from roles that do not have confidential-data permission.

## Public repository checklist

- Keep `.env` files and generated credentials untracked.
- Use placeholder values in examples and documentation.
- Rotate any credential that has ever been committed, even if it was later removed.
- Review staged changes for secrets before every push.
- Configure production users and secrets outside the repository.

## Validation

Use the workspace scripts to validate changes:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```
