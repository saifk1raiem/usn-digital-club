# USN Digital Club

Private club operating system for **Union Sportive de Nadhour**. Arabic is the default
language; French is fully supported. The public website remains a separate consumer of the
future public-content API.

## Workspace

- `apps/api` — NestJS REST API, Prisma, PostgreSQL and OpenAPI
- `apps/web` — Next.js private management dashboard
- `apps/mobile` — Expo Router mobile application shell
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

Seed login: `admin@usn.tn` / `ChangeMe123!` (development only; change immediately).
