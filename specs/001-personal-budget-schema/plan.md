# Implementation Plan: Personal Budget App Data Model

**Branch**: `001-personal-budget-schema` | **Date**: 2026-09-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-personal-budget-schema/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Deliver a REST API backend for the personal budget app data model described in the
spec: user-level recurring periods, multiple shared budgets, typed books (account,
expense, saving, debt, investment) with per-type detail tables, transactions as the
single source of truth for money movement, derived (not stored) expense-occurrence
status and saving progress, and optional recurring book scheduling. The API is
built with Node.js 24 + TypeScript + Express on top of the existing PostgreSQL
schema (`docs/database/schema.sql`), authenticated via Google Sign-In + first-party
JWTs, validated at every boundary with Zod, and organized as a small Clean
Architecture (domain / application / infrastructure / interfaces) to keep business
rules (period lifecycle, occurrence status derivation, saving progress calculation)
independent of Express and the Postgres driver.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 24 (LTS)

**Primary Dependencies**: Express 5 (last LTS), `pg` (node-postgres) driver, `zod`
for schema validation, `jsonwebtoken` for issuing/verifying first-party JWTs,
`google-auth-library` for verifying Google ID tokens, `dotenv` for environment
variable loading, `helmet` + `cors` for baseline HTTP security headers/CORS

**Storage**: PostgreSQL, schema owned by `docs/database/schema.sql` (source of
truth for tables/enums/constraints); versioned as ordered SQL migration files
under `src/infrastructure/db/migrations` applied by a small custom migration
runner (no ORM — the schema is hand-designed and already normalized)

**Testing**: Node.js built-in `node:test` runner + `supertest` for HTTP contract
tests, run through `tsx` so tests can execute TypeScript directly; one contract
test file per endpoint plus unit tests for domain/application logic (period
lifecycle, occurrence status, saving progress)

**Target Platform**: Linux server (containerizable Node.js HTTP service)

**Project Type**: web-service (single backend project; no frontend in this repo)

**Performance Goals**: Not explicitly specified by the feature; adopt a
conservative default for a low/medium-traffic personal budgeting API — p95 <
300ms for single-resource reads/writes under normal load — and rely on the
existing schema indexes plus pagination on list endpoints (Principle X)

**Constraints**: Stateless JWT auth (no server-side session store); Google is the
sole identity provider; monetary values use `DECIMAL(18,2)` in Postgres and MUST
be handled in application code as integer-safe/string decimals (never native
floats) to avoid rounding errors; periods must never overlap for a user and at
most one open period may exist at a time (enforced in the application layer per
the spec's Assumptions, not by a DB constraint); soft-delete (`is_deleted`) for
budgets and books instead of hard deletes

**Scale/Scope**: Single-tenant-per-user data with multi-user budget sharing;
~13 core resources (users, user settings, periods, budgets, budget membership,
books + 4 per-type detail tables, transactions, expense occurrences, book
scheduling); expected low-to-moderate scale (personal/small-team budgeting, not
high-throughput)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluated against `.specify/memory/constitution.md` v1.1.0 (10 principles). All
gates **PASS** for the proposed approach; re-checked after Phase 1 design with no
new violations introduced.

| # | Principle | Gate status | How the plan satisfies it |
|---|-----------|-------------|----------------------------|
| I | Clean Architecture & Clean Code | PASS | `domain` → `application` → `infrastructure`/`interfaces` layering with dependencies pointing inward only (see Project Structure) |
| II | REST API as Core Structure | PASS | Versioned `/api/v1/...` resource endpoints with explicit contracts in `contracts/` before implementation |
| III | Security by Design | PASS | Google ID token verification + first-party JWT on every non-auth route, Zod validation at all input boundaries, parameterized SQL only (no string-built queries), secrets via `.env`/`dotenv` and never committed, `helmet`/`cors` baseline hardening |
| IV | Simplicity Over Complicated Logic | PASS | No ORM/framework beyond Express + `pg`; a single JWT access token (no refresh-token machinery) since the app has no requirement for token revocation at scale — documented trade-off, not a gate violation |
| V | Reusable Code | PASS | Shared base repository helpers, a single Zod-based `validate()` middleware, shared error-handling middleware reused by all routes |
| VI | Avoid Code Smells & Document Design Patterns | PASS | Repository pattern (ports in `domain/repositories`, adapters in `infrastructure/repositories`) and Strategy pattern (period-mode calculation) are explicitly named in code comments where used |
| VII | Code Documentation | PASS | Controllers/use-cases/endpoints documented with short JSDoc (purpose, inputs, outputs, errors); `quickstart.md` documents runnable validation |
| VIII | Well-Separated Project Structure | PASS | `src/` (app code), `tests/` (contract + unit), `docs/`/`specs/` (documentation) kept fully separate |
| IX | Testable Object-Oriented Code | PASS | Repositories/services depend on interfaces injected via constructor/factory functions, enabling in-memory fakes in unit tests; every endpoint gets a contract test |
| X | Code & Database Query Optimization | PASS | Reuses existing schema indexes, list endpoints are paginated and filtered server-side, no N+1 patterns (joins/batched lookups in repositories) |

No entries required in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/                          # this repository
├── src/
│   ├── config/
│   │   └── env.ts                # dotenv load + Zod-validated env schema
│   ├── domain/
│   │   ├── entities/              # User, Budget, Book, Transaction, Period, ...
│   │   └── repositories/          # repository interfaces (ports)
│   ├── application/
│   │   └── use-cases/             # e.g. RecordTransaction, EvaluatePeriod,
│   │                               #     ComputeOccurrenceStatus, ShareBudget
│   ├── infrastructure/
│   │   ├── db/
│   │   │   ├── pool.ts            # pg Pool factory
│   │   │   └── migrations/        # ordered .sql migrations (derived from
│   │   │                           #   docs/database/schema.sql)
│   │   ├── repositories/          # Postgres implementations of the ports
│   │   └── auth/
│   │       ├── google.ts          # Google ID token verification
│   │       └── jwt.ts             # first-party JWT sign/verify
│   └── interfaces/
│       └── http/
│           ├── app.ts             # Express app factory (no listen())
│           ├── server.ts          # entry point: loads env, starts listener
│           ├── routes/            # one router per resource
│           ├── controllers/       # thin handlers calling use-cases
│           ├── middlewares/       # auth, validate(zodSchema), error handler
│           └── schemas/           # Zod request/response schemas per endpoint
├── tests/
│   ├── contract/                  # one supertest file per endpoint
│   └── unit/                      # domain/application logic (no HTTP, no DB)
├── docs/                          # existing business + schema docs
├── specs/                         # existing spec-kit artifacts
├── .env.example
├── package.json
├── tsconfig.json
└── eslint.config.js
```

**Structure Decision**: Single backend project (Option 1) using Clean
Architecture layering instead of a flat `models/services/lib` split. There is no
frontend in this repository, so the "web application" split (Option 2) does not
apply. Dependencies point inward only: `interfaces` and `infrastructure` depend
on `application` and `domain`; `domain` depends on nothing else in `src`.

## Complexity Tracking

No violations — Constitution Check passed cleanly, so this table is
intentionally empty.
