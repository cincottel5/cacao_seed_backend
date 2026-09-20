# Quickstart: Personal Budget App API

Validates that the design in this plan works end-to-end. This is a run/verify
guide, not implementation code — see `contracts/rest-api.md` for endpoint
details and `data-model.md` for entity/field definitions.

## Prerequisites

- Node.js 24 (LTS)
- A running PostgreSQL instance (local Docker container or managed instance)
- A Google OAuth Client ID (for verifying ID tokens) — not needed to run
  contract tests, which mock Google verification

## 1. Environment setup

```bash
cp .env.example .env
```

Required variables (validated at startup by `src/config/env.ts`):

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port (e.g. `3000`) |
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Signing secret for first-party JWTs |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `GOOGLE_CLIENT_ID` | expected audience for Google ID token verification |

## 2. Install & apply schema

```bash
npm install
npm run migrate      # applies src/infrastructure/db/migrations against DATABASE_URL
```

## 3. Run the API

```bash
npm run dev          # tsx watch mode
# or
npm run build && npm start
```

## 4. Validate the core flow (manual/curl)

```bash
# 1. Exchange a Google ID token for an app JWT (use a test/mock token in dev)
curl -s -X POST http://localhost:3000/api/v1/auth/google \
  -H 'Content-Type: application/json' \
  -d '{"idToken":"<google-id-token>"}'
# -> { "token": "<jwt>", "user": { ... } }

TOKEN=<jwt from above>

# 2. Create a budget
curl -s -X POST http://localhost:3000/api/v1/budgets \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Personal","type":"personal"}'

# 3. Create an expense book in that budget
curl -s -X POST http://localhost:3000/api/v1/budgets/<budgetId>/books \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"type":"expense","name":"Netflix","estimatedAmount":"8000","isSubscription":true}'

# 4. Record a partial payment transaction against it (creates the first period automatically)
curl -s -X POST http://localhost:3000/api/v1/budgets/<budgetId>/transactions \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"amount":"4000","currency":"crc","type":"expense","takeInBookId":<expenseBookId>}'

# 5. Confirm the derived occurrence status is "partially_paid"
curl -s "http://localhost:3000/api/v1/budgets/<budgetId>/expense-occurrences?bookId=<expenseBookId>" \
  -H "Authorization: Bearer $TOKEN"

# 6. Record the remaining payment and re-check -> status becomes "paid"
```

Expected outcome: step 6's response shows `"status": "paid"` with
`"paidAmount": "8000.00"`, matching Acceptance Scenario 3 of User Story 3 in
`spec.md`.

## 5. Run automated tests

```bash
npm run lint          # eslint
npm run test:unit     # node:test, domain/application logic only
npm run test:contract # node:test + supertest, one file per endpoint (uses a test DB)
npm test              # both suites
```

## 6. Traceability back to the spec

| Spec scenario | Validated by |
|---|---|
| User Story 1 (periods) | `tests/unit/period-lifecycle.test.ts`, `tests/contract/periods.*.test.ts` |
| User Story 2 (multi-budget + roles) | `tests/contract/budgets.*.test.ts`, `tests/contract/budget-members.*.test.ts` |
| User Story 3 (expense occurrence status) | `tests/unit/expense-occurrence-status.test.ts`, `tests/contract/expense-occurrences.*.test.ts`, manual flow above |
| User Story 4 (savings priority) | `tests/unit/saving-progress.test.ts` |
| User Story 5 (accounts/debts/investments) | `tests/contract/books.*.test.ts` |
| User Story 6 (recurring scheduling) | `tests/unit/book-scheduling.test.ts` |
