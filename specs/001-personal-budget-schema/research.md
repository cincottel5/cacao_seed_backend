# Phase 0 Research: Personal Budget App Data Model API

All items requested by the user brief are concrete technology choices rather
than open unknowns, so this research resolves each choice against the
constitution (Clean Architecture, Simplicity, Security by Design) and the
feature spec's constraints instead of leaving `NEEDS CLARIFICATION` markers.

## 1. Runtime & language

- **Decision**: Node.js 24 (LTS) with TypeScript 5.x, compiled with `tsc` for
  production and run directly via `tsx` in development/tests.
- **Rationale**: Explicitly requested. Node 24 is the active LTS line at the
  feature's creation date; TypeScript gives compile-time safety for the many
  interrelated entities (books, details, transactions) described in the spec.
- **Alternatives considered**: Plain JavaScript (rejected — loses type safety
  across the many book/transaction variants); Node's experimental native TS
  type-stripping only, no build step (rejected — production build should be a
  plain, portable `dist/` of JS, keeping the runtime simple per Principle IV).

## 2. HTTP framework

- **Decision**: Express (latest LTS-equivalent 4.x/5.x stable release).
- **Rationale**: Explicitly requested; minimal, well understood, fits
  Simplicity (Principle IV) better than a heavier full-stack framework.
- **Alternatives considered**: Fastify/NestJS (rejected — not requested, and
  NestJS's DI/module system is more ceremony than this feature needs).

## 3. Database access

- **Decision**: `pg` (node-postgres) driver with parameterized queries behind
  a repository interface per aggregate (Repository pattern, Principle VI). No
  ORM.
- **Rationale**: `docs/database/schema.sql` is already a fully normalized,
  hand-designed schema (enums, checks, composite keys); an ORM would fight the
  schema (e.g. per-type detail tables, derived values) more than it would
  help. Raw parameterized SQL keeps queries transparent and reviewable for
  Principle X (query optimization) and Principle III (no injection risk).
- **Alternatives considered**: Prisma/TypeORM (rejected — would require either
  hand-authoring a matching schema-first Prisma model or fighting introspection
  of enums/derived-value tables, adding complexity for no functional gain);
  Knex query builder (rejected — adds a layer without solving anything raw
  parameterized `pg` queries don't already solve simply).

## 4. Schema migrations

- **Decision**: Keep `docs/database/schema.sql` as the authoritative schema
  reference and mirror it as ordered, numbered `.sql` files under
  `src/infrastructure/db/migrations/`, applied by a small custom runner (a
  `schema_migrations` tracking table + sequential file execution) invoked via
  an npm script (`npm run migrate`).
- **Rationale**: Avoids adding a migration-framework dependency for what is,
  at this stage, a linear list of DDL files; matches Simplicity (Principle IV).
- **Alternatives considered**: `node-pg-migrate`/Knex migrations (rejected —
  extra dependency and its own DSL for something a ~40-line runner covers);
  applying `schema.sql` directly with no migration history (rejected — no way
  to evolve the schema safely later).

## 5. Authentication

- **Decision**: Google Sign-In on the client obtains a Google ID token; the
  client sends it once to `POST /api/v1/auth/google`; the backend verifies it
  server-side with `google-auth-library`, upserts the `users` row
  (`google_id`, `email`, `email_verified`, `name`, `avatar_url`), and issues a
  first-party JWT (HS256, signed with a server-only secret from `.env`) as the
  single access token used on all subsequent requests via
  `Authorization: Bearer <token>`.
- **Rationale**: Matches the explicit request for "Google authentication" +
  "JWT tokens for authentication"; verifying the Google token server-side
  (never trusting a client-asserted identity) satisfies Principle III.
- **Alternatives considered**: Server-side session cookies (rejected — not
  requested, and stateless JWT is simpler to scale); short-lived access token
  + refresh token pair (considered, but deferred: no stated requirement for
  revocation/rotation, so a single reasonably-scoped-lifetime JWT is chosen
  per Principle IV; documented as a trade-off, not a Constitution violation).

## 6. Input validation

- **Decision**: `zod` schemas per endpoint (request params/query/body), applied
  through one shared `validate(schema)` Express middleware; response shapes
  are typed from the same schemas where practical.
- **Rationale**: Explicitly requested; centralizes validation at the trust
  boundary (Principle III) and is reusable (Principle V).
- **Alternatives considered**: `joi`/`class-validator` (rejected — not
  requested, and would duplicate what Zod already covers with TS inference).

## 7. Testing strategy

- **Decision**: Node's built-in `node:test` runner + `supertest` for HTTP
  contract tests (one file per endpoint under `tests/contract/`), executed via
  `tsx --test`; separate `tests/unit/` for pure domain/application logic
  (period lifecycle, occurrence status derivation, saving progress
  calculation) with no HTTP or DB involved.
- **Rationale**: Explicitly requested ("supertest and node test libraries");
  per-endpoint contract tests give direct traceability to the interface
  contracts produced in Phase 1.
- **Alternatives considered**: Jest/Vitest (rejected — not requested, and
  `node:test` avoids an extra test-framework dependency).

## 8. Linting

- **Decision**: ESLint flat config (`eslint.config.js`) with
  `@typescript-eslint` recommended + type-checked rules, `eslint-config-prettier`
  to avoid formatting conflicts if Prettier is added later.
- **Rationale**: Explicitly requested; flat config is the current ESLint
  standard.
- **Alternatives considered**: Legacy `.eslintrc` (rejected — deprecated
  format for new projects).

## 9. Environment configuration

- **Decision**: `dotenv` loads a local `.env` (git-ignored) at process start;
  all required variables are parsed and validated once through a Zod schema in
  `src/config/env.ts`, which throws on startup if anything required is
  missing/malformed. `.env.example` documents every variable.
- **Rationale**: Explicitly requested ("use dotenv() for environment
  variables"); validating env at startup turns configuration mistakes into a
  fast, explicit failure instead of a runtime error deep in a request
  (Principle III/IV).
- **Alternatives considered**: Reading `process.env` ad hoc across the
  codebase (rejected — duplicated, unvalidated access is a code smell per
  Principle VI).

## 10. Monetary value handling

- **Decision**: Represent `DECIMAL(18,2)` columns as strings at the DB
  boundary (`pg` returns numeric as string by default) and only convert to
  numbers for arithmetic using a small money-safe helper (integer cents), never
  native floating point directly on user-facing totals.
- **Rationale**: The spec explicitly derives values (actual expense spend,
  saved amount) from transaction sums; floating-point drift would produce
  incorrect derived totals, violating SC-001/SC-003.
- **Alternatives considered**: Plain JS `number` end-to-end (rejected —
  floating-point rounding risk on money); a big-decimal library (deferred —
  not needed yet given `DECIMAL(18,2)` and integer-cent arithmetic is
  sufficient; can be introduced later without contract changes).

## Output

All technology choices above are resolved; no `NEEDS CLARIFICATION` markers
remain in the Technical Context.
