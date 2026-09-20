# Feature Specification: Personal Budget App Data Model

**Feature Branch**: `[001-personal-budget-schema]`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Personal Budget App — Schema Design Handoff: a simple personal budget web app data model covering users, user-level periods, multiple budgets per user, books (account/expense/saving/debt/investment), transactions, expense occurrences, saving details, debt details, and recurring book scheduling. Emphasizes normalization, deriving values instead of storing them, avoiding polymorphic relationships, and keeping periods shared across a user's budgets."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Track spending against recurring budget periods (Priority: P1)

A user wants their income and expenses grouped into recurring periods (e.g. twice a month, monthly, or weekly) so they can see how much they have spent and how much is left before the next period begins.

**Why this priority**: Period-based tracking is the foundation of the entire budgeting experience — without it, expenses and savings have no time context. This is the minimum viable slice of the product.

**Independent Test**: Can be fully tested by configuring a period mode (e.g. "each month" starting on the 1st), letting the system generate periods, and confirming that a user's transactions are correctly attributed to the period that contains their date.

**Acceptance Scenarios**:

1. **Given** a user with `periods_mode = each_month` and start day `1`, **When** a new calendar month begins, **Then** a new period is created starting on the 1st and the previous period is closed on the last day of the prior month.
2. **Given** a user with `periods_mode = at_demand` and `minimum_period_days = 7`, **When** the user records income only 3 days after the current period started, **Then** no new period is created and the income is attributed to the current period.
3. **Given** the same user, **When** the user records income 8 days after the current period started, **Then** the current period is closed the day before and a new period starts on the income date.
4. **Given** a user with multiple budgets (e.g. Personal, Household, Vacation), **When** a new period is created, **Then** it applies to all of the user's budgets simultaneously rather than being duplicated per budget.

---

### User Story 2 - Manage multiple budgets that share the same timeline (Priority: P1)

A user wants to organize their finances into separate budgets (e.g. Personal, Household, Vacation) without having to reconfigure periods separately for each one, and wants to invite others to collaborate on a shared budget with different permission levels.

**Why this priority**: Multi-budget support with shared periods is a core differentiator of the data model and is required before any expense/saving/debt tracking can be scoped correctly.

**Independent Test**: Can be fully tested by creating two budgets for the same user, confirming both see identical period boundaries, and confirming a second user added to a budget with a "viewer" role can see but not modify its books.

**Acceptance Scenarios**:

1. **Given** a user with existing periods, **When** the user creates a new budget, **Then** the new budget immediately uses the user's existing periods without creating duplicates.
2. **Given** a budget shared with another user, **When** that budget owner assigns the collaborator the "member" role, **Then** the collaborator can add and edit books and transactions but role-specific restrictions (e.g. "viewer") prevent edits.
3. **Given** a budget marked as deleted, **When** a user lists their active budgets, **Then** the deleted budget no longer appears.

---

### User Story 3 - Plan and monitor recurring/expected expenses per period (Priority: P2)

A user wants to define expected expenses (e.g. Rent, Netflix) once and automatically see, for each period, whether that expense is still pending, partially paid, or fully paid — without manually tracking payment status.

**Why this priority**: This turns raw transactions into actionable budget insight (what's left to pay this period) and is the main planning value-add beyond simple transaction logging.

**Independent Test**: Can be fully tested by defining an expense with an expected amount, generating an occurrence for the current period, recording a partial payment transaction against it, and confirming the computed status changes from "pending" to "partially paid" and then to "paid" as more matching transactions are recorded.

**Acceptance Scenarios**:

1. **Given** an expense "Netflix" with expected amount ₡8,000 and a due date in the current period, **When** no transaction has been recorded against it, **Then** its status is shown as pending.
2. **Given** the same expense occurrence, **When** a transaction of ₡4,000 is recorded against it, **Then** its status is shown as partially paid.
3. **Given** the same expense occurrence, **When** a second transaction of ₡4,000 is recorded against it, **Then** its status is shown as paid.
4. **Given** an expense with `adjusted_amount` set lower than its `estimated_amount`, **When** the user views the expense, **Then** the system uses the adjusted amount as the active target rather than the estimated amount.
5. **Given** a recurring expense flagged as a subscription, **When** the user views their list of expenses, **Then** subscriptions are distinguishable from one-off planned expenses.

---

### User Story 4 - Track savings goals with priority ordering (Priority: P2)

A user wants to set up savings goals (e.g. Emergency Fund, Vacation) with either a target date, a target amount, or a fixed monthly contribution, and wants the system to know which goals to reduce first if money needs to be freed up.

**Why this priority**: Savings goals are a primary budgeting feature beyond expense tracking, and priority ordering is what makes multiple concurrent goals usable.

**Independent Test**: Can be fully tested by creating two savings goals with different priorities, contributing to both via transactions, and confirming the saved amount and remaining goal amount are correctly computed from transaction history for each.

**Acceptance Scenarios**:

1. **Given** a savings goal with `saving_mode = each_month` and a fixed `period_amount`, **When** the period changes, **Then** the same planned contribution amount applies to the new period.
2. **Given** a savings goal with `saving_mode = to_date` and a goal date, **When** the user views the goal, **Then** the required contribution amount is calculated and shown as `period_amount`.
3. **Given** two savings goals with different priority values, **When** the user needs to free up money, **Then** the lower-priority goal is presented as the one to reduce first.
4. **Given** a savings goal marked as emergency savings, **When** the user reviews their savings, **Then** it is distinguishable from regular goals.

---

### User Story 5 - Track debts, accounts, and investments alongside budgeting (Priority: P3)

A user wants to record accounts (bank/card), debts (loans/credit), and investments as part of their overall financial picture, and move money between them via transactions.

**Why this priority**: Rounds out the financial picture but is not required for the core budgeting loop (periods + expenses + savings) to deliver value.

**Independent Test**: Can be fully tested by creating an account, a debt with installments and interest rate, and recording a debt payment transaction that moves money from the account to the debt.

**Acceptance Scenarios**:

1. **Given** a new account book, **When** the user records its opening balance, **Then** an `account_initial_balance` transaction establishes the starting balance without needing a source book.
2. **Given** a debt with an original amount, number of installments, and interest rate, **When** the user records a debt payment transaction, **Then** the payment is linked to both the source account and the debt book.
3. **Given** an account with a linked card, **When** the user views the account, **Then** the last 4 digits of the card are shown for identification.

---

### User Story 6 - Automate recurring transactions (Priority: P3)

A user wants recurring money movements (e.g. a fixed weekly transfer to savings) to happen automatically instead of being entered manually every time.

**Why this priority**: A convenience/automation layer on top of the core model; valuable but not required for manual budgeting to work.

**Independent Test**: Can be fully tested by scheduling a recurring transfer from an account to a savings book on a weekly frequency and confirming a transaction is generated automatically on each scheduled date within the configured start/end range.

**Acceptance Scenarios**:

1. **Given** a book scheduling entry with frequency "each_two_weeks" and `automatic_transaction = true`, **When** a scheduled date arrives, **Then** a transaction is automatically created from the source book to the target book.
2. **Given** a scheduling entry with an end date in the past, **When** the schedule is evaluated, **Then** no further transactions are generated.

### Edge Cases

- What happens when a user has no periods yet and records their first transaction (e.g. first-ever income under `at_demand` mode)? A period should be created first
- How does the system handle an expense occurrence whose period closes before any payment is recorded — does it roll over, stay pending against the closed period, or both? Stay pending
- What happens when a payment transaction is recorded after its period has already closed? A new period is created, and the transaction is assigned to that period
- How does the system handle a savings goal whose `goal_date` has already passed without reaching `goal_amount`? A saving goal whose goal_date has already passed, should continue 
- What happens when a user is removed from a shared budget that still has books/transactions they created? Transactions remain the same, each budget should always have at least one user. I'll manage this problem after. 
- How does the system handle a transaction whose `currency` differs from the user's settings currency (exchange rate application)? when user currency differs from transaction currency a convertion ocurrs. currency, amount, currency, user_currency_amount, exchange_rate fields are used for this reason.
- What happens when `periods_start_days` contains a day that doesn't exist in a given month (e.g. day 31 in February)? System should calculate the last day of the month instead.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow each user to configure a currency, language, period mode, period start day(s), and minimum period length as personal settings.
- **FR-002**: System MUST generate periods at the user level (not per budget) so that all of a user's budgets share the exact same period timeline.
- **FR-003**: System MUST support at least these period modes: fixed monthly, fixed biweekly, fixed weekly, a custom date range, and an on-demand mode driven by income activity.
- **FR-004**: In on-demand period mode, System MUST NOT start a new period when the elapsed time since the current period began is less than the user's configured minimum period length; it MUST close the current period and start a new one once that minimum is exceeded and a new qualifying transaction occurs.
- **FR-005**: System MUST allow a single user to own multiple budgets (e.g. Personal, Household, Vacation) simultaneously.
- **FR-006**: System MUST allow a budget to be shared with other users, each with an assigned role (admin, member, or viewer) that governs their permissions on that budget.
- **FR-007**: System MUST support marking budgets and books as deleted (soft delete) rather than removing their history.
- **FR-008**: System MUST allow each budget to contain multiple books, each with a type of account, expense, saving, debt, or investment.
- **FR-009**: System MUST record financial movements as transactions that reference a source book and/or a destination book, allowing either side to be absent (e.g. income has no source book, initial balance has no source book).
- **FR-010**: System MUST support transaction types covering general movements, expenses, savings contributions, income, investments, debt payments, and initial account balances.
- **FR-011**: System MUST record, per transaction, the amount, currency, an equivalent amount in the user's settings currency, exchange rate, date/time, and optional reference details (comments, reference number, authorization number, merchant).
- **FR-012**: System MUST identify which expense/saving/debt/investment book a transaction affects through the transaction's direct book references, without relying on a generic/polymorphic entity reference.
- **FR-013**: System MUST allow an expense book to define an estimated amount, an optional adjusted (target) amount, a control level, a priority level (needs/wants), whether it recurs as a subscription, and an optional parent expense for grouping.
- **FR-014**: System MUST calculate a period's actual expense spending from the sum of transactions linked to that expense, rather than storing a separately maintained "actual amount" field.
- **FR-015**: System MUST support generating one expense occurrence per expense per period, each carrying its own due date and expected amount for that period, with at most one occurrence per expense/period combination.
- **FR-016**: System MUST derive an expense occurrence's payment status (pending, partially paid, or paid) from the transactions recorded against it and its expected amount, rather than storing a status field.
- **FR-017**: System MUST allow an expense occurrence to be satisfied by more than one transaction (e.g. two partial payments), without requiring a single transaction reference on the occurrence.
- **FR-018**: System MUST allow a saving book to define a goal amount, a saving mode (toward a date, toward an amount, or a fixed periodic amount), a per-period contribution amount, a priority ranking, an emergency-savings flag, start/goal dates, an initial balance, and whether contributions continue after the goal is fulfilled.
- **FR-019**: System MUST calculate a saving book's accumulated saved amount and number of contributions from its transaction history rather than storing them directly.
- **FR-020**: System MUST use each saving book's priority ranking to determine the order in which savings should be reduced when funds need to be reallocated.
- **FR-021**: System MUST allow a debt book to define its original debt amount, number of installments, and interest rate.
- **FR-022**: System MUST allow an account book to store identifying details such as the last 4 digits of a linked card.
- **FR-023**: System MUST allow any book to define a recurring schedule (frequency, start date, optional end date, source book, and whether transactions are generated automatically) independent of expense-specific occurrence tracking.
- **FR-024**: System MUST support at least these scheduling frequencies: weekly, every two weeks, monthly, and yearly.

### Key Entities

- **User**: An individual who owns settings, periods, and one or more budgets.
- **User Settings**: Per-user configuration — currency, language, period mode, period start day(s), and minimum period length. One per user.
- **Period**: A user-level, date-bounded window (start date, optional open-ended end date) used to group transactions and expense occurrences over time. Belongs to a user, not to a specific budget.
- **Budget**: A named container (type: personal, household, travel, vacation) that groups books for a shared purpose. Can be shared across multiple users via roles.
- **User-Budget Membership**: The association between a user and a budget, carrying the user's role (admin, member, viewer) on that budget.
- **Book**: A named financial entity within a budget, typed as account, expense, saving, debt, or investment; the target/source of transactions.
- **Account Details**: Extra attributes specific to an account-type book (e.g. linked card identifier).
- **Expense Details**: Extra attributes specific to an expense-type book (estimated/adjusted amounts, control level, priority, subscription flag, optional parent expense).
- **Saving Details**: Extra attributes specific to a saving-type book (goal amount, saving mode, per-period contribution amount, priority, emergency flag, start/goal dates, initial balance, continuation behavior, linked account).
- **Debt Details**: Extra attributes specific to a debt-type book (original amount, installments, interest rate).
- **Transaction**: A recorded financial movement with amount, currency, date, optional source book, optional destination book, and descriptive metadata; the sole source of truth for actual money movement.
- **Expense Occurrence**: The expected instance of an expense book within a specific period (due date, expected amount); payment status is derived, not stored.
- **Book Scheduling**: A recurring-transaction plan attached to a book (frequency, date range, source book, automatic-generation flag).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can see how much of their expected spending has been paid, partially paid, or is still pending for the current period without manually reconciling any transaction list themselves.
- **SC-002**: A user managing 3 separate budgets sees identical period start/end dates across all of them, with zero manual re-entry of period configuration per budget.
- **SC-003**: A user can determine their current saved amount toward any goal, and how many contributions they've made, purely from their transaction history, with no discrepancy between computed and expected values.
- **SC-004**: When two users share a budget, a user assigned the "viewer" role cannot make changes to that budget's books or transactions, while a "member" or "admin" can.
- **SC-005**: A user switching from a fixed period schedule to on-demand periods sees at most one new period created per qualifying income event that is at least the configured minimum number of days after the current period's start.
- **SC-006**: A recurring scheduled transaction (e.g. weekly transfer) is generated on every occurrence of its schedule within its active date range without duplicate or missed occurrences.

## Assumptions

- Each user has exactly one settings record; there is no need for per-budget currency/language overrides.
- Periods never overlap for a given user, and at most one period per user is open-ended (has no `end_date`) at a time.
- The application layer (not the database) is responsible for validating that an expense occurrence's expense book and period belong to the same user, since the data model intentionally does not enforce this via a composite foreign key.
- The exact real-time trigger mechanism for closing/opening on-demand periods (e.g. background job vs. on next transaction write) and the precise rule for matching an incoming transaction to a specific expense occurrence are implementation/business-logic details to be defined during planning, not schema changes.
- Whether a payment recorded after a period closes can still satisfy the previous period's occurrence is a business-rule decision to be finalized during planning; the data model supports either behavior since occurrence-to-transaction matching is not a stored relationship.
- Supported currencies are limited to CRC and USD, and supported languages to Spanish and English, per current settings enums.
- "Deleted" budgets and books are hidden from normal views but retain their historical transactions for integrity/reporting.
