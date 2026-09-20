# API Contracts: Personal Budget App

Base URL: `/api/v1`. All request/response bodies are JSON. All endpoints
except `POST /auth/google` require `Authorization: Bearer <jwt>`. Every
endpoint listed here MUST have a corresponding contract test in
`tests/contract/` (one file per endpoint, per Principle IX and the user
brief).

Common error shape (all endpoints):

```json
{ "error": { "code": "string", "message": "string", "details": [] } }
```

Standard status codes used throughout: `200` OK, `201` Created, `204` No
Content, `400` validation error, `401` missing/invalid JWT, `403` insufficient
role, `404` not found (or not visible to the caller), `409` conflict (e.g.
duplicate occurrence, last-member removal).

Pagination convention for list endpoints: query params `?page=1&pageSize=20`
(defaults `1`/`20`, max `pageSize=100`); response wraps results as
`{ "items": [...], "page": 1, "pageSize": 20, "total": 42 }`.

---

## Auth

### `POST /auth/google`

Exchange a Google ID token for a first-party JWT. Creates the user on first
login.

- **Auth required**: no
- **Request body** (Zod `GoogleAuthRequestSchema`): `{ "idToken": string }`
- **201/200 response**: `{ "token": string, "user": { "id": uuid, "email": string, "name": string, "avatarUrl": string } }` (`201` on first-time user creation, `200` on existing user)
- **Errors**: `400` malformed body, `401` invalid/expired Google ID token

### `GET /auth/me`

- **Auth required**: yes
- **200 response**: current user profile `{ "id", "email", "name", "avatarUrl", "emailVerified", "createdAt" }`

---

## User Settings

### `GET /users/me/settings`

- **200**: `{ "currency", "language", "periodsMode", "periodsStartDays": number[], "minimumPeriodDays" }`

### `PATCH /users/me/settings`

- **Request body** (`UpdateUserSettingsSchema`, all fields optional): `currency?`, `language?`, `periodsMode?`, `periodsStartDays?`, `minimumPeriodDays?`
- **200**: updated settings object
- **Errors**: `400` invalid enum value / invalid `periodsStartDays` (must be non-empty, each `1..31`) / `minimumPeriodDays <= 0`

---

## Periods (read-only via API; created internally by the transaction use-cases)

### `GET /periods`

- **Query**: `page`, `pageSize`, optional `from`, `to` date filters
- **200**: paginated list of `{ "id", "startDate", "endDate" }` for the current user, newest first

### `GET /periods/current`

- **200**: the caller's currently open period, or `404` if none exists yet (no transactions recorded)

---

## Budgets

### `GET /budgets`

- **200**: paginated list of the caller's non-deleted budgets, each with the caller's `role`

### `POST /budgets`

- **Request body** (`CreateBudgetSchema`): `{ "name": string(1..255), "type": "personal"|"household"|"travel"|"vacation" }`
- **201**: created budget; creator is added to `users_budgets` with role `admin`

### `GET /budgets/:budgetId`

- **200**: budget detail (requires caller to be a member); `403` if not a member, `404` if deleted/nonexistent

### `PATCH /budgets/:budgetId`

- **Role required**: `admin`
- **Request body** (`UpdateBudgetSchema`, optional fields): `name?`, `type?`
- **200**: updated budget

### `DELETE /budgets/:budgetId`

- **Role required**: `admin`
- **204**: soft-deletes (`is_deleted = true`); history/transactions retained

---

## Budget Members

### `GET /budgets/:budgetId/members`

- **200**: list of `{ "userId", "email", "name", "role" }`

### `POST /budgets/:budgetId/members`

- **Role required**: `admin`
- **Request body** (`AddBudgetMemberSchema`): `{ "email": string, "role": "admin"|"member"|"viewer" }` (user must already exist via Google sign-in)
- **201**: created membership
- **Errors**: `404` if no user with that email exists yet, `409` if already a member

### `PATCH /budgets/:budgetId/members/:userId`

- **Role required**: `admin`
- **Request body**: `{ "role": "admin"|"member"|"viewer" }`
- **200**: updated membership

### `DELETE /budgets/:budgetId/members/:userId`

- **Role required**: `admin`
- **204**: removes membership
- **Errors**: `409` if this is the budget's last remaining member

---

## Books

### `GET /budgets/:budgetId/books`

- **Query**: `page`, `pageSize`, optional `type` filter
- **200**: paginated list of non-deleted books, each including its type-specific detail object (e.g. `expenseDetails`, `savingDetails`)

### `POST /budgets/:budgetId/books`

- **Role required**: `admin` or `member`
- **Request body** (discriminated union `CreateBookSchema` on `type`):
  - `account`: `{ type: "account", name, cardLastDigits: string(4) }`
  - `expense`: `{ type: "expense", name, estimatedAmount, adjustedAmount?, controlLevel?, priorityLevel?, parentExpenseId?, isSubscription? }`
  - `saving`: `{ type: "saving", name, accountBookId, goalAmount, savingMode, periodAmount?, priority?, isEmergencySavings?, startDate, goalDate, continueIfFulfilled, initialBalance? }`
  - `debt`: `{ type: "debt", name, originalDebtAmount, installments, interestRate }`
  - `investment`: `{ type: "investment", name }`
- **201**: created book (with its detail object)
- **Errors**: `400` on schema/cross-field validation (e.g. `goalDate < startDate`)

### `GET /budgets/:budgetId/books/:bookId`

- **200**: book + type-specific details

### `PATCH /budgets/:budgetId/books/:bookId`

- **Role required**: `admin` or `member`
- **Request body**: `name?` plus the same type-specific optional fields as create (type itself is immutable)
- **200**: updated book

### `DELETE /budgets/:budgetId/books/:bookId`

- **Role required**: `admin` or `member`
- **204**: soft delete (`is_deleted = true`)

---

## Book Scheduling

### `GET /budgets/:budgetId/books/:bookId/scheduling`

- **200**: `{ "frequency", "startDate", "endDate", "takeFromBookId", "automaticTransaction" }` or `404` if none configured

### `PUT /budgets/:budgetId/books/:bookId/scheduling`

- **Role required**: `admin` or `member`
- **Request body** (`UpsertBookSchedulingSchema`): `{ "frequency": "each_week"|"each_two_weeks"|"each_month"|"each_year", "startDate", "endDate"?, "takeFromBookId", "automaticTransaction" }`
- **200**: created or replaced schedule (idempotent upsert on `book_id`)
- **Errors**: `400` if `endDate < startDate`

### `DELETE /budgets/:budgetId/books/:bookId/scheduling`

- **Role required**: `admin` or `member`
- **204**: removes the schedule

---

## Transactions

### `GET /budgets/:budgetId/transactions`

- **Query**: `page`, `pageSize`, optional `bookId`, `periodId`, `type`, `from`, `to`
- **200**: paginated list of transactions touching any book in the budget

### `POST /budgets/:budgetId/transactions`

- **Role required**: `admin` or `member`
- **Request body** (`CreateTransactionSchema`): `{ "amount", "currency": "crc"|"usd", "type", "date"?, "takeInBookId"?, "takeFromBookId"?, "comments"?, "referenceNumber"?, "authorizationNumber"?, "merchant"? }` — at least one of `takeInBookId`/`takeFromBookId` required
- **201**: created transaction, with `userCurrencyAmount` and `exchangeRate` computed server-side from the recording user's settings currency
- **Side effect**: triggers period evaluation/creation for the acting user per the Period Lifecycle in `data-model.md`
- **Errors**: `400` if neither book reference is present, or referenced books don't belong to this budget

### `GET /budgets/:budgetId/transactions/:transactionId`

- **200**: transaction detail

### `PATCH /budgets/:budgetId/transactions/:transactionId`

- **Role required**: `admin` or `member`
- **Request body**: same optional fields as create except `type`/book references are immutable after creation (correcting a miscategorized transaction requires delete + recreate, keeping the use-case simple per Principle IV)
- **200**: updated transaction

### `DELETE /budgets/:budgetId/transactions/:transactionId`

- **Role required**: `admin` or `member`
- **204**: hard delete (transactions have no soft-delete flag in the schema)

---

## Expense Occurrences

### `GET /budgets/:budgetId/expense-occurrences`

- **Query**: `page`, `pageSize`, required `periodId` OR `bookId` (at least one)
- **200**: paginated list, each item: `{ "id", "expenseBookId", "periodId", "dueDate", "expectedAmount", "paidAmount", "status": "pending"|"partially_paid"|"paid" }` — `paidAmount`/`status` are computed per `data-model.md`, never stored

### `POST /budgets/:budgetId/books/:bookId/expense-occurrences`

Generates (or returns the existing) occurrence for the expense book in a given
period — exposed for cases where the caller wants to materialize an occurrence
ahead of any payment.

- **Role required**: `admin` or `member`
- **Request body**: `{ "periodId": uuid, "dueDate": date }` (`expectedAmount` is snapshotted server-side from the expense's active target amount)
- **201**: created occurrence, or **200** with the existing one if `(expense_book_id, period_id)` already exists (idempotent per the schema's unique constraint)

---

## Endpoint-to-Test Mapping

Each endpoint above maps 1:1 to a file under `tests/contract/`, e.g.
`tests/contract/auth.google.test.ts`, `tests/contract/budgets.create.test.ts`,
`tests/contract/transactions.create.test.ts`, etc. Contract tests cover: happy
path, validation failure (`400`), auth failure (`401`), and role/permission
failure (`403`) where applicable, using `supertest` against the Express `app`
instance (no real Google/JWT network calls — tokens are signed/mocked in
tests).
