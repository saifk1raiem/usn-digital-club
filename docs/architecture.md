# Architecture and Phase 1 plan

## Repository assessment

The repository was empty at project start. There was no application, schema, or asset to reuse.
The public site is intentionally not copied or replaced; selected content can later be exposed
through a read-only public API.

## Domain boundaries

`Club -> Season -> Category` is the core sporting hierarchy. A `Person` can independently have
a login (`User`), staff profile, player profile, guardian profile, and committee membership.
System access is many-to-many (`UserRole`) while real club work is historical and scoped through
`StaffAssignment(season, category?, position)`. This avoids conflating job titles with security.

Operational modules own their records but reference season/category consistently. Medical notes,
contracts and documents have explicit sensitivity/visibility fields. Historical records are never
rewritten when a new season starts.

## Authorization

1. Authenticate access tokens and rotate refresh tokens.
2. Resolve permissions from all active user roles.
3. Require the endpoint permission.
4. Apply category scope from active staff assignments (global roles may bypass this step).
5. Require elevated permissions for medical details and financial contract fields.
6. Record critical mutations in `AuditLog`.

The client uses permissions only to improve navigation. The API remains authoritative.

## Localization

Arabic (`ar`) is the default and renders with `dir=rtl`; French (`fr`) uses `dir=ltr`. Translation
keys are shared conceptually between web and mobile and grouped by `common`, `navigation`, and
feature namespace. Database content that editors translate has separate Arabic/French columns.

## Delivery phases

1. Foundation, authentication, users, roles, seasons, categories, staff and players.
2. Training, attendance, matches, squads, announcements and notifications.
3. Medical availability, physical tests, guardians and trials.
4. Equipment, kits, facilities, documents and contracts.
5. News/public API, meetings, auditing and advanced dashboards.

Phase 1 includes a usable branded dashboard, mobile shell, real API endpoints, schema, seed, input
validation, scoped permission guards, loading/error states, and Docker-based PostgreSQL.
