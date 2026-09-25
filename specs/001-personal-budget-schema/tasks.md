---

description: "Task list for feature implementation"
---

# Tasks: Personal Budget App Data Model

**Input**: Design documents from `/specs/001-personal-budget-schema/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/rest-api.md`, and `quickstart.md`

**Tests**: Contract tests are required by the REST contract and unit tests are required for the domain/application rules identified in the plan and constitution.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated as an independent increment after the shared foundation is complete.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the TypeScript/Node.js service and repository layout.

- [x] T001 Create the Clean Architecture source and test directories from the implementation plan: `src/config`, `src/domain/entities`, `src/domain/repositories`, `src/application/use-cases`, `src/infrastructure/db/migrations`, `src/infrastructure/repositories`, `src/infrastructure/auth`, `src/interfaces/http/routes`, `src/interfaces/http/controllers`, `src/interfaces/http/middlewares`, `src/interfaces/http/schemas`, `tests/unit`, and `tests/contract`
- [x] T002 Initialize `package.json` for Node.js 24 and TypeScript 5.x with Express, `pg`, `zod`, `jsonwebtoken`, `google-auth-library`, `dotenv`, `helmet`, `cors`, `tsx`, `supertest`, ESLint, and the Node.js built-in test runner dependencies/scripts defined in `specs/001-personal-budget-schema/research.md`
- [x] T003 [P] Create `tsconfig.json` with strict TypeScript settings, source-root compilation, and a production `dist/` output
- [x] T004 [P] Create `eslint.config.js` using the flat config with recommended `@typescript-eslint` type-checked rules and `eslint-config-prettier`
- [x] T005 [P] Create `.env.example` documenting `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `GOOGLE_CLIENT_ID`; ensure `.env` is ignored by `.gitignore`
- [x] T006 [P] Add the initial `src/interfaces/http/server.ts` entry point and npm `dev`, `build`, `start`, `lint`, `test:unit`, `test:contract`, `test`, and `migrate` scripts without putting `listen()` in the Express app factory

### Phase 1 completion note

The repository has been scaffolded for the TypeScript/Node.js backend, including the required project directories, configuration files, environment template, and a minimal Express app entry point. The Phase 1 setup tasks are complete and ready for the foundational Phase 2 implementation work.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish database, configuration, security, shared HTTP, and repository boundaries before any user story implementation.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T007 Create `src/config/env.ts` to load `dotenv`, validate all required environment variables with Zod at startup, and expose typed configuration without ad-hoc `process.env` access
- [x] T008 [P] Create `src/infrastructure/db/pool.ts` with an injectable `pg.Pool` factory, safe shutdown support, and parameterized-query-only repository access
- [x] T009 [P] Create the first ordered migration under `src/infrastructure/db/migrations/001_initial_schema.sql` from `docs/database/schema.sql`, preserving all enums, tables, checks, foreign keys, unique constraints, indexes, and the `schema_migrations` tracking requirement; explicitly review the schema/document mismatch where `parent_expense_id` is `NOT NULL` in SQL but described as optional in `data-model.md`
- [x] T010 [P] Implement `src/infrastructure/db/migrate.ts` to create migration tracking metadata and apply numbered SQL files sequentially and transactionally, with a corresponding `npm run migrate` entry point
- [x] T011 [P] Add `src/domain/entities/shared.ts` and `src/domain/entities/user.ts` value types for UUIDs, ISO dates, supported currencies (`crc`/`usd`), and decimal-string money values so `DECIMAL(18,2)` is never handled as native floating-point arithmetic
- [x] T012 Create shared repository ports in `src/domain/repositories/` for users, settings, periods, budgets, memberships, books, transactions, occurrences, and schedules, using dependency injection and interfaces independent of `pg` and Express
- [x] T013 Create `src/interfaces/http/app.ts` with JSON parsing, `helmet`, configured `cors`, `/api/v1` routing, a health response, and centralized error handling; keep it importable by contract tests without opening a network listener
- [x] T014 [P] Implement `src/interfaces/http/middlewares/error-handler.ts` with the documented `{ error: { code, message, details } }` shape and mappings for validation, authentication, authorization, not-found, and conflict failures
- [x] T015 [P] Implement `src/interfaces/http/middlewares/validate.ts` for Zod request params, query, and body validation at every HTTP boundary
- [x] T016 [P] Implement `src/infrastructure/auth/google.ts` to verify Google ID tokens against `GOOGLE_CLIENT_ID` and return only verified identity claims
- [x] T017 [P] Implement `src/infrastructure/auth/jwt.ts` to issue and verify first-party JWTs using the configured secret and expiry, with a typed user subject
- [x] T018 Implement `src/interfaces/http/middlewares/auth.ts` to require `Authorization: Bearer <jwt>`, attach the authenticated user to the request, and return `401` for missing or invalid tokens
- [x] T019 Create shared pagination schemas/helpers in `src/interfaces/http/schemas/pagination.ts` enforcing defaults `page=1`, `pageSize=20`, and maximum `pageSize=100`
- [x] T020 Create shared authorization/membership policy helpers in `src/application/authorization/budget-permissions.ts` for the documented matrix: viewers may view only, members/admins may create/edit books and transactions, only admins manage members/delete budgets, and a budget must retain at least one member
- [x] T021 Implement `src/infrastructure/repositories/base-postgres-repository.ts` helpers for parameterized SQL, decimal-string mapping, pagination, and consistent not-found/conflict translation without N+1 list queries
- [x] T022 Add unit tests in `tests/unit/money.test.ts`, `tests/unit/authorization.test.ts`, and `tests/unit/pagination.test.ts` covering decimal-safe arithmetic, role permissions, last-member protection, and pagination bounds

**Checkpoint**: The service starts with validated configuration, can apply the authoritative schema, exposes a testable Express app, authenticates JWTs, validates requests, and has reusable repository/policy boundaries.

---

## Phase 3: User Story 1 - Track spending against recurring budget periods (Priority: P1) 🎯 MVP

**Goal**: Configure a user's period mode and ensure transaction recording creates or advances one shared, non-overlapping timeline.

**Independent Test**: Configure `each_month` with start day `1`, record transactions across a month boundary, and verify one closed period plus the new open period; repeat with `at_demand` and `minimum_period_days=7` to verify a transaction at day 3 stays in the current period and one at day 8 opens a new period.

### Tests for User Story 1

- [x] T023 [P] [US1] Add `tests/unit/period-lifecycle.test.ts` for first-transaction period creation, monthly/weekly/biweekly/range boundaries, on-demand minimum-day behavior, non-overlap, single-open-period enforcement, and invalid calendar days falling back to the month’s last day
- [x] T024 [P] [US1] Add `tests/contract/settings.get.test.ts` and `tests/contract/settings.update.test.ts` covering authenticated access, enum validation, non-empty `periodsStartDays` with every value in `1..31`, and `minimumPeriodDays > 0`
- [x] T025 [P] [US1] Add `tests/contract/periods.list.test.ts` and `tests/contract/periods.current.test.ts` covering pagination/date filters, newest-first ordering, authenticated access, and `404` before any transaction creates an open period
- [ ] T026 [P] [US1] Add `tests/contract/transactions.create-period.test.ts` covering transaction validation, first-period creation, period assignment, and the fixed/on-demand lifecycle side effect

### Implementation for User Story 1

- [x] T027 [P] [US1] Define user and settings entities plus repository adapters in `src/domain/entities/user.ts`, `src/domain/entities/user-settings.ts`, `src/infrastructure/repositories/user-repository.ts`, and `src/infrastructure/repositories/user-settings-repository.ts`, enforcing the SQL constraints `periods_start_days` non-empty with each day in `1..31` and `minimum_period_days > 0`
- [x] T028 [P] [US1] Implement period boundary strategies in `src/domain/entities/period-boundary.ts` for `each_month`, `biweekly`, `weekly`, `range`, and `at_demand`, including the rule that a nonexistent day such as 31 in February resolves to the month’s last day
- [x] T029 [US1] Implement `src/application/use-cases/evaluate-period-lifecycle.ts` to create the first period before a transaction, close/open fixed periods, open an on-demand period only when elapsed days are at least `minimum_period_days`, and enforce non-overlap/single-open invariants
- [x] T030 [US1] Implement `src/infrastructure/repositories/period-repository.ts` with user-scoped indexed queries, transactional close/open operations, and paginated period/date-filter retrieval
- [x] T031 [US1] Implement `src/application/use-cases/update-user-settings.ts` and the settings schemas/controllers/routes in `src/interfaces/http/schemas/settings.ts`, `src/interfaces/http/controllers/settings-controller.ts`, and `src/interfaces/http/routes/settings.ts`
- [x] T032 [US1] Implement `src/application/use-cases/list-periods.ts` and `src/interfaces/http/controllers/period-controller.ts` plus `src/interfaces/http/routes/periods.ts` for `GET /api/v1/periods` and `GET /api/v1/periods/current`
- [x] T033 [US1] Implement the authenticated Google exchange flow in `src/application/use-cases/authenticate-google-user.ts`, `src/interfaces/http/schemas/auth.ts`, `src/interfaces/http/controllers/auth-controller.ts`, and `src/interfaces/http/routes/auth.ts`, including user upsert, default settings creation, `201` on first login, and `200` for existing users
- [x] T034 [US1] Implement `src/interfaces/http/controllers/me-controller.ts` and `src/interfaces/http/routes/me.ts` for `GET /api/v1/auth/me`, returning the documented profile fields

**Checkpoint**: A user can authenticate, configure settings, record the first transaction through the later transaction flow, and inspect the resulting shared period timeline independently of budgets.

---

## Phase 4: User Story 2 - Manage multiple budgets that share the same timeline (Priority: P1)

**Goal**: Create and soft-delete multiple budgets, share them with role-based permissions, and ensure all budgets for a user reuse the user-level periods from US1.

**Independent Test**: Create two budgets, verify both resolve the same period IDs/boundaries, add a viewer and member, verify viewer writes return `403` while member writes succeed, and verify soft-deleted budgets/books are absent from active lists.

### Tests for User Story 2

- [ ] T035 [P] [US2] Add contract tests in `tests/contract/budgets.list.test.ts`, `tests/contract/budgets.create.test.ts`, `tests/contract/budgets.update.test.ts`, and `tests/contract/budgets.delete.test.ts` for pagination, creation, admin-only updates/deletion, membership visibility, and soft-delete behavior
- [ ] T036 [P] [US2] Add contract tests in `tests/contract/budget-members.list.test.ts`, `tests/contract/budget-members.create.test.ts`, `tests/contract/budget-members.update.test.ts`, and `tests/contract/budget-members.delete.test.ts` for existing-user lookup, duplicate membership conflict, role permissions, and last-member rejection
- [ ] T037 [P] [US2] Add `tests/unit/budget-period-sharing.test.ts` proving multiple budgets for one user resolve the same user-level period timeline and never create budget-specific periods

### Implementation for User Story 2

- [ ] T038 [P] [US2] Define budget and membership entities in `src/domain/entities/budget.ts` and `src/domain/entities/budget-membership.ts`, including `personal|household|travel|vacation` and `admin|member|viewer` values
- [ ] T039 [US2] Implement `src/infrastructure/repositories/budget-repository.ts` and `src/infrastructure/repositories/budget-membership-repository.ts` with soft-delete filtering, membership joins, pagination, and queries that expose the caller’s role
- [ ] T040 [US2] Implement `src/application/use-cases/manage-budgets.ts` for create/list/get/update/soft-delete, automatically creating the creator’s `admin` membership and retaining historical records
- [ ] T041 [US2] Implement `src/application/use-cases/manage-budget-members.ts` for add/list/update/remove, enforcing existing Google-signed-in users, role checks, duplicate conflicts, and the invariant that a budget always has at least one member
- [ ] T042 [US2] Add budget and membership Zod schemas in `src/interfaces/http/schemas/budgets.ts` and `src/interfaces/http/schemas/budget-members.ts`, including `name` length `1..255`
- [ ] T043 [US2] Implement `src/interfaces/http/controllers/budget-controller.ts`, `src/interfaces/http/controllers/budget-member-controller.ts`, `src/interfaces/http/routes/budgets.ts`, and `src/interfaces/http/routes/budget-members.ts` for all budget and membership endpoints in `contracts/rest-api.md`
- [ ] T044 [US2] Add budget membership scope checks to `src/application/authorization/budget-permissions.ts` and ensure every budget-scoped controller hides deleted/non-member resources as specified

**Checkpoint**: Budget creation/sharing/soft deletion works with role enforcement, and all budgets query the existing user periods without duplicating or reconfiguring the timeline.

---

## Phase 5: User Story 3 - Plan and monitor recurring/expected expenses per period (Priority: P2)

**Goal**: Create expense books and period occurrences, then derive pending/partially-paid/paid status from all matching expense transactions.

**Independent Test**: Create a Netflix expense with expected amount `8000`, materialize its occurrence, record two `4000` expense transactions, and verify derived `paidAmount` changes from `0` to `4000` to `8000` and status changes from `pending` to `partially_paid` to `paid` without a stored status field.

### Tests for User Story 3

- [ ] T045 [P] [US3] Add `tests/unit/expense-occurrence-status.test.ts` covering `active_target_amount = adjusted_amount ?? estimated_amount`, zero/partial/full payment, multiple payments, closed-period pending status, and occurrence uniqueness
- [ ] T046 [P] [US3] Add `tests/contract/expense-occurrences.list.test.ts` and `tests/contract/expense-occurrences.create.test.ts` covering required `periodId` or `bookId`, idempotent create (`201` then `200`), cross-user validation, and computed response fields
- [ ] T047 [P] [US3] Add `tests/contract/expenses.subscription.test.ts` covering expense detail validation, parent grouping, `needs|wants`, control levels, and distinguishing subscriptions from one-off expenses

### Implementation for User Story 3

- [ ] T048 [P] [US3] Define book and expense entities in `src/domain/entities/book.ts` and `src/domain/entities/expense-details.ts`, preserving immutable book type and constraints `estimated_amount >= 0`, `adjusted_amount >= 0 when present`, and `is_subscription` support
- [ ] T049 [US3] Implement `src/infrastructure/repositories/book-repository.ts` with discriminated detail-row creation/update, exact-one-detail enforcement, type matching, active-book filtering, and budget/type pagination
- [ ] T050 [US3] Implement `src/application/use-cases/manage-expense-occurrences.ts` to validate that expense book and period belong to the same user, snapshot the active target amount, enforce one occurrence per `(expense_book_id, period_id)`, and derive paid amount/status from all matching transactions
- [ ] T051 [US3] Implement `src/infrastructure/repositories/expense-occurrence-repository.ts` with indexed occurrence queries and aggregate payment sums grouped by occurrence without storing status
- [ ] T052 [US3] Implement `src/interfaces/http/schemas/books.ts`, `src/interfaces/http/schemas/expense-occurrences.ts`, `src/interfaces/http/controllers/book-controller.ts`, `src/interfaces/http/controllers/expense-occurrence-controller.ts`, and corresponding routes under `src/interfaces/http/routes/`
- [ ] T053 [US3] Implement `src/application/use-cases/record-transaction.ts` and `src/infrastructure/repositories/transaction-repository.ts` for validated money movement, direct source/destination book references, period lifecycle triggering, and parameterized paginated transaction queries
- [ ] T054 [US3] Implement `src/interfaces/http/schemas/transactions.ts`, `src/interfaces/http/controllers/transaction-controller.ts`, and `src/interfaces/http/routes/transactions.ts` for transaction create/list/detail/update/delete, enforcing at least one book reference and immutable type/book references after creation

**Checkpoint**: Expense planning and derived payment status work through the API, including the quickstart partial-payment flow.

---

## Phase 6: User Story 4 - Track savings goals with priority ordering (Priority: P2)

**Goal**: Create savings books, compute progress from transaction history, carry planned contributions across periods, and order goals by reduction priority.

**Independent Test**: Create two saving goals with different priorities, record saving transactions, and verify accumulated saved amounts and contribution counts are derived per goal while the lower-priority goal is selected first for reduction.

### Tests for User Story 4

- [ ] T055 [P] [US4] Add `tests/unit/saving-progress.test.ts` covering initial balance, accumulated saved amount, contribution count, `to_date` period-amount calculation, goal-date continuation, and no native floating-point money arithmetic
- [ ] T056 [P] [US4] Add `tests/contract/savings.test.ts` covering saving detail cross-field validation, linked account scope, emergency flag, priority ordering, and contribution response values

### Implementation for User Story 4

- [ ] T057 [P] [US4] Define saving entities and money calculations in `src/domain/entities/saving-details.ts` and `src/domain/entities/saving-progress.ts`, enforcing `goal_amount >= 0`, `period_amount >= 0`, `priority > 0`, `initial_balance >= 0`, and `goal_date >= start_date`
- [ ] T058 [US4] Implement `src/application/use-cases/manage-saving-goals.ts` to validate linked account ownership, calculate `to_date` contributions from remaining periods, derive progress from saving transactions, and rank goals by ascending priority where lower values are reduced first
- [ ] T059 [US4] Extend `src/infrastructure/repositories/book-repository.ts` and `src/infrastructure/repositories/transaction-repository.ts` with saving-detail joins and aggregate progress queries that avoid N+1 queries
- [ ] T060 [US4] Extend `src/interfaces/http/schemas/books.ts`, `src/interfaces/http/controllers/book-controller.ts`, and `src/interfaces/http/routes/books.ts` for saving create/update/read responses and priority-ordered savings views

**Checkpoint**: Savings goals expose correct derived progress, periodic planning, emergency labeling, and deterministic reduction ordering without storing accumulated totals.

---

## Phase 7: User Story 5 - Track debts, accounts, and investments alongside budgeting (Priority: P3)

**Goal**: Support account, debt, and investment books and transactions connecting source and destination books.

**Independent Test**: Create an account, debt, and investment book, record an account initial balance, then record a debt payment linked from the account to the debt and verify all details and direct book references.

### Tests for User Story 5

- [ ] T061 [P] [US5] Add `tests/contract/books.account.test.ts`, `tests/contract/books.debt.test.ts`, and `tests/contract/books.investment.test.ts` covering type-specific creation, retrieval, update, soft deletion, and `cardLastDigits` exactly 4 digits
- [ ] T062 [P] [US5] Add `tests/contract/transactions.financial-types.test.ts` covering `account_initial_balance`, debt payments, investments, source/destination references, and currency conversion fields
- [ ] T063 [P] [US5] Add `tests/unit/book-type-invariants.test.ts` proving exactly one matching detail row per typed book and rejecting mismatched detail rows

### Implementation for User Story 5

- [ ] T064 [P] [US5] Define account and debt detail entities in `src/domain/entities/account-details.ts` and `src/domain/entities/debt-details.ts`, enforcing `card_last_digits` exactly 4 digits, `original_debt_amount >= 0`, `installments > 0`, and `interest_rate >= 0`
- [ ] T065 [US5] Extend `src/infrastructure/repositories/book-repository.ts` and `src/application/use-cases/manage-books.ts` for account, debt, and investment discriminated detail handling, including immutable `type` and soft deletion
- [ ] T066 [US5] Extend `src/application/use-cases/record-transaction.ts` and `src/interfaces/http/schemas/transactions.ts` for initial balances, debt payments, investments, and server-side `userCurrencyAmount`/`exchangeRate` conversion using CRC/USD decimal-safe values
- [ ] T067 [US5] Add cross-book ownership and budget-scope checks in `src/application/authorization/budget-permissions.ts` so source and destination books cannot cross unauthorized budgets while preserving direct references and transaction history

**Checkpoint**: Account/card identification, debt metadata, investments, opening balances, and debt-payment movements are available through the same budget API.

---

## Phase 8: User Story 6 - Automate recurring transactions (Priority: P3)

**Goal**: Configure one recurring schedule per book and generate exactly one transaction per active occurrence within its date range.

**Independent Test**: Schedule an `each_two_weeks` transfer with automatic generation, evaluate the schedule across several dates, verify one transaction per due date, and verify no transaction is generated after `endDate`.

### Tests for User Story 6

- [ ] T068 [P] [US6] Add `tests/unit/book-scheduling.test.ts` covering weekly, biweekly, monthly, yearly recurrence dates, inclusive start/end range behavior, past-end termination, idempotency, and no missed/duplicate occurrences
- [ ] T069 [P] [US6] Add `tests/contract/book-scheduling.get.test.ts`, `tests/contract/book-scheduling.upsert.test.ts`, and `tests/contract/book-scheduling.delete.test.ts` covering role checks, `endDate >= startDate`, idempotent replacement, and `404` when absent

### Implementation for User Story 6

- [ ] T070 [P] [US6] Define scheduling entities and recurrence calculation in `src/domain/entities/book-scheduling.ts`, enforcing frequencies `each_week|each_two_weeks|each_month|each_year` and `end_date >= start_date` when present
- [ ] T071 [US6] Implement `src/application/use-cases/manage-book-scheduling.ts` and `src/application/use-cases/generate-scheduled-transactions.ts` to validate source/target scope, generate only automatic schedules in their active range, and record idempotency keys or equivalent duplicate protection
- [ ] T072 [US6] Implement `src/infrastructure/repositories/book-scheduling-repository.ts` with one-schedule-per-book upsert/delete and efficient due-schedule lookup
- [ ] T073 [US6] Implement `src/interfaces/http/schemas/book-scheduling.ts`, `src/interfaces/http/controllers/book-scheduling-controller.ts`, and `src/interfaces/http/routes/book-scheduling.ts` for GET/PUT/DELETE scheduling endpoints
- [ ] T074 [US6] Add the schedule evaluator entry point in `src/interfaces/http/server.ts` or a dedicated `src/infrastructure/scheduling/schedule-runner.ts`, documenting how deployment invokes it without introducing a second application framework

**Checkpoint**: Recurring schedules can be configured, replaced, removed, and evaluated without duplicate or out-of-range transactions.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Complete traceability, security, performance, documentation, and end-to-end validation across all stories.

- [ ] T075 [P] Add contract tests for every remaining endpoint listed in `contracts/rest-api.md` under `tests/contract/`, covering happy path, `400`, `401`, and applicable `403`/`404`/`409` responses with mocked Google/JWT boundaries
- [ ] T076 [P] Add repository integration coverage under `tests/integration/` for migration application, foreign-key/check constraints, indexed pagination, and aggregate queries against a disposable PostgreSQL database
- [ ] T077 [P] Document public modules, use cases, controllers, and non-obvious business rules with concise JSDoc/comments in `src/`, including named Repository and Strategy pattern usage required by the constitution
- [ ] T078 [P] Update `specs/001-personal-budget-schema/quickstart.md` and the repository README with exact install, migration, dev, build, lint, unit-test, contract-test, and full-test commands plus the Google token setup requirements
- [ ] T079 Run dependency audit and security review for authentication, authorization, input validation, SQL parameterization, CORS, Helmet, secrets, and dependency vulnerabilities; record findings in the implementation review notes
- [ ] T080 Run performance checks for paginated list endpoints and expense/saving aggregate queries, verify no N+1 queries, and document any measured trade-offs against the plan’s p95 `< 300ms` default goal
- [ ] T081 Run `npm run lint`, `npm run test:unit`, `npm run test:contract`, `npm test`, `npm run build`, and the `quickstart.md` flow; fix only feature-related failures and record any environment-dependent PostgreSQL/Google prerequisites

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; T003-T006 can proceed in parallel after T001/T002 establish the project files.
- **Foundational (Phase 2)**: Depends on Setup; T008-T010 and T014-T022 can proceed in parallel where their shared interfaces are available. This phase blocks every user story.
- **User Stories (Phases 3-8)**: Depend on Phase 2. US1 must provide authentication/settings/period lifecycle before transaction-dependent work is exercised. US2 depends on US1’s user/period identity boundaries. US3 depends on US1 and US2 for transactions, periods, books, and membership authorization. US4 depends on US3’s book/transaction foundations. US5 depends on US3’s book/transaction foundations. US6 depends on US3’s transaction foundation and can proceed in parallel with US4/US5.
- **Polish (Phase 9)**: Depends on all desired user stories and their checkpoints.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational; owns user settings, authentication, and period lifecycle; no dependency on other stories.
- **US2 (P1)**: Starts after Foundational and uses US1’s user-level period ports; its budget/membership behavior is independently testable.
- **US3 (P2)**: Depends on US1 periods and US2 budget authorization; delivers the transaction and expense-occurrence core.
- **US4 (P2)**: Depends on US3 book and transaction infrastructure; savings calculations remain independently unit-testable.
- **US5 (P3)**: Depends on US3 book and transaction infrastructure; account/debt/investment behavior is independently contract-testable.
- **US6 (P3)**: Depends on US3 transaction infrastructure; can proceed in parallel with US4 and US5 after the shared transaction contract is stable.

### Parallel Opportunities

- Setup configuration, lint, environment, and server scaffolding: T003-T006.
- Foundational database, auth, middleware, shared types, and repository-port work: T008-T021, subject to their listed file dependencies.
- US1 test files and period/settings/auth modules: T023-T028 and T033-T034 where interfaces do not overlap.
- US2 budget, membership, schemas, and contract test files: T035-T044 can be split by resource.
- US3 occurrence tests, detail entities, repository work, and HTTP schemas: T045-T052 can be split by layer after book/transaction ports exist.
- US4 and US5 can proceed in parallel after US3’s book/transaction interfaces stabilize; US6 can proceed alongside them.
- Final documentation, tests, audit, and performance work: T075-T080.

## Parallel Example: User Story 1

```text
Task: T023 period lifecycle unit tests in tests/unit/period-lifecycle.test.ts
Task: T024 settings contract tests in tests/contract/settings.*.test.ts
Task: T025 period contract tests in tests/contract/periods.*.test.ts
Task: T028 period boundary strategies in src/domain/entities/period-boundary.ts
```

## Implementation Strategy

### MVP First (User Stories 1 and 2, with the transaction slice from US3)

1. Complete Phase 1 Setup.
2. Complete Phase 2 Foundational and verify the app, migration runner, auth middleware, and validation work.
3. Complete US1 for authentication, settings, period lifecycle, and period reads.
4. Complete US2 for multiple budgets, shared periods, and viewer/member/admin permissions.
5. Complete the transaction and expense-occurrence portions of US3 needed by `quickstart.md`.
6. Validate the monthly/on-demand period flow and partial-payment flow independently before expanding scope.

### Incremental Delivery

1. Add US3 expense planning and derived statuses; validate the quickstart flow.
2. Add US4 savings progress and priority ordering; validate from transaction history.
3. Add US5 account/debt/investment books and cross-book transactions.
4. Add US6 recurring scheduling and idempotent generation.
5. Complete Phase 9 quality, security, performance, and documentation gates.

## Notes

- Every task uses the required checklist format: checkbox, sequential ID, optional `[P]`, required story label in story phases, and an exact file path in the description.
- The schema is authoritative at `docs/database/schema.sql`; implementation must resolve the documented `parent_expense_id` nullability mismatch before migration release.
- Monetary database values use decimal strings/integer-safe helpers; no native floating-point arithmetic is permitted for user-facing totals.
- Periods are never created through a public period-write endpoint; transaction use cases own period evaluation and creation.