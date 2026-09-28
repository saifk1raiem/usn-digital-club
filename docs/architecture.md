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

Access tokens contain only the user ID and token type. On every protected request, the API reloads
the active account, roles, permissions, category grants, player membership, and guardian links from
PostgreSQL. Disabling an account or changing a grant therefore takes effect immediately; the API
does not trust stale authorization claims embedded in a JWT.

`UserRole` represents a security role. Each grant is either:

- club-wide (`isGlobal = true`), or
- category-scoped through one or more `UserRoleScope` records.

The resolved session stores scope per permission rather than one shared category list. This prevents
a permission from one role being used in a category granted to a different role. `PLAYER` and
`PARENT` membership is resolved separately from administrative grants: player actions are self-only,
guardian reads are limited to linked children, and neither relationship grants staff write access.

The request pipeline is:

1. Verify the short-lived access token and reload an `ACTIVE` user.
2. Resolve permissions and their exact scopes from current database grants.
3. Require the endpoint permission through `PermissionsGuard`.
4. Enforce the matching permission/category policy in `AuthorizationService`.
5. Apply ownership policies and response redaction for player and guardian access.
6. Record critical grant, account, roster, and operational mutations in `AuditLog`.

The client uses permissions only to improve navigation. The API remains authoritative. The last
active global `SUPER_ADMIN` cannot be removed or disabled.

## Database integrity

PostgreSQL enforces the invariants that must also hold for imports and future integrations:

- a category and all football records must reference the same season;
- a category and committee must reference a season from the same club;
- only one current season may exist per club;
- active jersey numbers are unique within a season/category;
- emails are unique case-insensitively;
- season, contract, training, meeting, score, intensity, progress, and quantity ranges are checked;
- core historical relations use restrictive deletion instead of destructive cascades;
- match-related players, converted trial players, evaluators, assignees, meeting participants, and
  news authors use real foreign keys;
- notification, attendance, squad, guardian, announcement, refresh-token, and grant lookup paths are
  indexed.

Categories are archived, staff assignments are ended, and players leave a season; core history is
not physically deleted. Sensitive medical and financial modules will use explicit field selection
and dedicated policies in their implementation phases.

## Supabase hosting

Production PostgreSQL is hosted by Supabase in the USN organization:

- project: `usn-digital-club`
- project ref: `kfkdqprvuyegdayhqkwq`
- region: Paris (`eu-west-3`)
- PostgreSQL: 17

The database remains a private backend database. All 49 application tables have RLS enabled and
the `anon`, `authenticated`, and `service_role` Data API roles have no table, sequence, or function
privileges in `public`. Having no Data API policies is deliberate: web and mobile clients call the
Nest API, which resolves scoped RBAC from the database and applies ownership/redaction rules.

The Nest process uses a dedicated, restricted PostgreSQL login through a server-only
`DATABASE_URL`. That role must have application DML access and an explicit RLS policy, but no
`CREATEDB`, `CREATEROLE`, superuser, or `BYPASSRLS` capability. Schema changes are applied through
reviewed migrations, not by the runtime role. The Supabase-specific RLS/revoke migration lives in
`supabase/migrations`; the Prisma schema and foreign-key index migration remain under
`apps/api/prisma`.

Supabase migration history currently contains, in order: `phase_1_foundation`,
`phase_2_operations`, `foundation_rbac_hardening`, `supabase_private_backend_hardening`, and
`foreign_key_query_indexes`. The runtime role, Phase 3 permissions, and physical-test catalog are
recorded as follow-up migrations under `supabase/migrations`.

## Phase 3 privacy boundaries

Medical, performance, guardian, and trial endpoints use the same permission-specific category
scope as football operations. Availability (`medical.viewAvailability`) is independent from
confidential treatment detail (`medical.viewDetails`); responses omit confidential case and update
fields unless the caller holds the detailed permission for that exact category. Only
`medical.edit` can create a case or record a status update.

Physical results require `performance.view` or `performance.edit`. Guardian management has its own
`guardians.view` and `guardians.manage` grants, while a parent-facing `/guardians/me` endpoint only
returns the authenticated guardian's links. Trial events, candidates, evaluations, status changes,
and player conversion use `trials.view` / `trials.manage`; conversion additionally requires
`players.create` in the same category.

## Access administration

`users.manage` protects the account and policy endpoints:

- `GET/POST /users`
- `PATCH /users/:id/access`
- `GET /users/roles`
- `GET /users/permissions`
- `PUT /users/roles/:roleKey/permissions`

Role and status changes revoke outstanding refresh tokens and are audited without password hashes.
The development seed reconciles removed as well as added role permissions. Production seeding
requires `SEED_ADMIN_PASSWORD`; the documented default password is development-only.

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
