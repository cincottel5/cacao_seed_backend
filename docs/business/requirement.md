# Personal Budget App — Schema Design Handoff

## Goal

I'm building a **simple personal budget web app** with PostgreSQL.

The main design principles are:

* Keep the data model **simple and concrete**.
* Follow **normalization and PostgreSQL best practices**.
* Avoid unnecessary tables/entities.
* Prefer calculating derived values instead of storing them.
* Use real foreign keys where practical.
* Keep query performance good with appropriate indexes.
* Do not over-engineer the model.

The schema has already gone through several iterations and the decisions below are intentional.

---

# Core Architecture

The current conceptual structure is:

```text
USER
│
├── USER_SETTINGS
│     ├── currency
│     ├── language
│     ├── periods_mode
│     ├── periods_start_days[]
│     └── minimum_period_days
│
├── PERIODS
│     ├── user_id
│     ├── start_date
│     └── end_date
│
└── USERS_BUDGETS
      │
      └── BUDGET
            │
            └── BOOKS
                  ├── Account
                  ├── Expense
                  │     └── Expense Occurrences → Period
                  ├── Saving
                  ├── Debt
                  └── Investment
```

## Important period design decision

Periods are **user-level**, not budget-level.

A user can have multiple budgets:

```text
User
├── Personal
├── Household
└── Vacation
```

All of them share the same periods.

Therefore:

* `budget_periods` was removed.
* `budget_periods_start_days` was removed.
* `user_id` belongs directly on `periods`.
* `periods_mode` belongs to user settings, not budgets.

This prevents duplicating identical periods for every budget.

Example:

```text
User
├── Period 1: Sep 1 → Sep 15
├── Period 2: Sep 16 → Sep 30
│
├── Personal Budget
├── Household Budget
└── Vacation Budget
```

---

# Period Modes

Current enum:

```text
at_demand
biweekly
each_month
weekly
range
```

`each_income` was intentionally replaced with **`at_demand`**.

## `at_demand` behavior

The application creates periods when needed.

Example:

```text
Current period:
Sep 12 → ...

Income on Sep 15
→ only 3 days elapsed
→ don't create another period

Income on Sep 20
→ 8 days elapsed
→ close previous period on Sep 19
→ create new period starting Sep 20
```

The user preference:

```text
minimum_period_days
```

provides the minimum length, initially expected to be something like `7`.

This avoids treating two incomes close together as separate periods.

---

# Period Start Days

`periods_start_days` is stored as a PostgreSQL array.

Examples:

```text
each_month:
[1]
```

or:

```text
biweekly:
[12, 26]
```

The same concept can support weekly configurations.

This is intentionally an array instead of a separate table because it is simple user configuration rather than an independent entity.

---

# Budgets

Budget types:

```text
personal
household
travel
vacation
```

A budget has:

```text
budget_id
name
type
is_deleted
```

`periods_mode` was removed from budgets because periods are user-level.

---

# Users ↔ Budgets

Many-to-many relationship:

```text
users_budgets
```

with:

```text
user_id
budget_id
role
```

Roles:

```text
admin
member
viewer
```

Primary key:

```text
(user_id, budget_id)
```

---

# Books

Books belong to a budget.

Types:

```text
account
saving
expense
debt
investment
```

Basic fields:

```text
book_id
name
budget_id
type
is_deleted
```

Books are used as the main entities involved in transactions.

---

# Transactions

Transactions represent actual financial movements.

Current types:

```text
movement
expense
saving
income
investment
debt_payment
account_initial_balance
```

The `account_initial_balance` type was explicitly added.

Transaction relationship:

```text
transaction
├── take_from_book_id
└── take_in_book_id
```

Both are nullable because not every transaction necessarily has both sides (e.g. income or initial balance).

Transactions also contain:

```text
amount
currency
user_currency_amount
comments
type
date
exchange_rate
reference_number
authorization_number
merchant
```

Currencies:

```text
crc
usd
```

Transaction date is `TIMESTAMPTZ`.

---

# Important transaction design decision

We discussed adding a generic:

```text
entity_id
```

to transactions to identify the expense/saving/income being affected.

Decision: **do NOT add `entity_id`.**

Reason:

* It creates a polymorphic relationship.
* PostgreSQL cannot enforce what `entity_id` references.
* It weakens referential integrity.
* For expenses, `take_in_book_id` already identifies the expense book.

Example:

```text
Checking Account → Rent Expense
```

The transaction already tells us which expense book was involved.

---

# Expense Books

Expense details:

```text
estimated_amount
adjusted_amount
control_level
priority_level
parent_expense_id
is_subscription
```

Priority enum:

```text
needs
wants
```

The old `wish` value was replaced with `wants`.

Control levels:

```text
fixed
adjustable
easy_adjustable
```

## `adjusted_amount`

Nullable:

```text
adjusted_amount DECIMAL(18,2) NULL
```

Meaning:

* `NULL` → use the normal estimated amount.
* Value present → user has set a target amount they want to try to achieve.

Example:

```text
estimated_amount = 150000
adjusted_amount = 120000
```

The actual amount is calculated from transactions.

---

# Do NOT store real expense amount

We intentionally removed the concept of storing:

```text
real_amount
```

because actual spending can be calculated from transactions.

Example:

```text
September:
₡40,000
₡30,000
₡35,000

Actual = ₡105,000
```

This avoids duplicated state.

---

# Expense Subscriptions

Added:

```text
is_subscription BOOLEAN NOT NULL DEFAULT FALSE
```

This is intended to help identify recurring/planned expenses.

---

# Expense Occurrences

Approved approach for handling pending expenses.

Concept:

```text
Expense Book
    ↓
Expense Occurrence
    ↓
Period
```

Example:

```text
Expense:
Netflix

Occurrence:
period = September
due_date = Sep 15
expected_amount = ₡8,000
```

The occurrence table contains:

```text
occurrence_id
expense_book_id
period_id
due_date
expected_amount
```

Unique constraint:

```text
(expense_book_id, period_id)
```

## Important: no `status` column

Do NOT store:

```text
pending
paid
partially_paid
```

Payment status is derived from transactions.

Example:

```text
No matching payment
→ pending

Payment less than expected amount
→ partially paid

Payment >= expected amount
→ paid
```

This prevents inconsistent state.

## No transaction_id on occurrence

An occurrence can be paid using multiple transactions.

Example:

```text
Expected: ₡8,000

Transaction 1: ₡4,000
Transaction 2: ₡4,000
```

Therefore the occurrence should not have a single `transaction_id`.

---

# Saving Books

Saving details:

```text
book_id
account_book_id
goal_amount
saving_mode
period_amount
priority
is_emergency_savings
start_date
goal_date
continue_if_fulfilled
initial_balance
```

Saving modes:

```text
to_date
to_amount
each_month
```

## `period_amount`

This is intentionally stored:

```text
period_amount DECIMAL(18,2) NOT NULL
```

Meaning:

* For `each_month`, it is the user-defined amount to save each period.
* For `to_date` / `to_amount`, the application calculates the required amount and stores the resulting contribution amount.

The intention is to have a concrete planned contribution amount rather than constantly recomputing historical plans.

## `priority`

Added:

```text
priority SMALLINT NOT NULL DEFAULT 1
```

Used to decide which savings should be reduced first if the user needs to free money.

Example:

```text
Emergency Fund → priority 1
House → priority 2
Vacation → priority 3
```

The application can reduce lower-priority savings before higher-priority savings.

## Do NOT store

Do not add:

```text
num_of_contributions
saved_amount
```

Both are derived:

* Number of contributions can be calculated.
* Saved amount can be calculated from transactions.

---

# Saving Initial Balance

Current model includes:

```text
initial_balance
```

on saving details.

This is intentional.

---

# Book Scheduling

Scheduling belongs to books.

Table:

```text
book_scheduling
```

Fields:

```text
book_id
frequency
start_date
end_date
take_from_book_id
automatic_transaction
```

Frequency enum:

```text
each_week
each_two_weeks
each_month
each_year
```

The old frequency options were expanded with:

```text
each_week
each_two_weeks
```

---

# User Settings

Current settings include:

```text
currency
language
periods_mode
periods_start_days[]
minimum_period_days
```

Currencies:

```text
crc
usd
```

Languages:

```text
es
en
```

---

# Account Details

Account-specific information:

```text
book_id
card_last_digits VARCHAR(4)
```

---

# Debt Details

Debt-specific information:

```text
book_id
original_debt_amount
installments
interest_rate
```

---

# Database Normalization Principles

The schema intentionally follows these principles:

1. Don't duplicate user information on periods if the period already belongs to the user.
2. Don't duplicate budget information on transactions because transactions reference books and books reference budgets.
3. Don't use polymorphic `entity_id` relationships.
4. Don't store values that can reliably be derived from transactions.
5. Don't store payment status when it can be derived from occurrence + transactions.
6. Keep recurring/planned concepts separate from actual transactions.
7. Use foreign keys for real relationships.
8. Avoid introducing extra tables unless they solve a real requirement.

---

# Current Final DDL

The last proposed DDL contains these tables:

```text
users
user_settings
budgets
users_budgets
periods
books
account_book_details
expense_book_details
saving_book_details
debt_book_details
book_scheduling
transactions
expense_occurrences
```

And the relevant enums described above.

---

# Important implementation invariant

The database currently does not enforce that an `expense_occurrence`'s:

```text
expense_book_id
```

and:

```text
period_id
```

belong to the same user.

This is intentional to keep the schema simple.

The service/application layer should validate that:

```text
expense book → budget → user
period → user
```

refer to the same user.

Adding composite foreign keys to enforce this at the database level would make the model more complex, and the current preference is to avoid that.

---

# Performance / Indexes

The DDL should include indexes for:

```text
users_budgets(budget_id)

periods(user_id, start_date)

periods(user_id) WHERE end_date IS NULL

books(budget_id)

books(budget_id, type)

transactions(take_from_book_id, date)

transactions(take_in_book_id, date)

transactions(type, date)

expense_occurrences(expense_book_id)

expense_occurrences(period_id)

expense_occurrences(due_date)

book_scheduling(take_from_book_id)
```

The primary keys, unique constraints, and foreign-key-related lookup indexes should also be considered when reviewing the final schema.

---

# Main unresolved/future business rules

These are not necessarily schema changes yet:

1. Exactly how an `at_demand` period is opened/closed when income arrives.
2. How a transaction is matched to an expense occurrence.
3. Whether a payment made after a period closes can satisfy the previous occurrence.
4. How partial payments affect occurrence status.
5. How `adjusted_amount` interacts with `control_level`.
6. How lower-priority savings are reduced when money needs to be recovered.
7. Whether all budgets belonging to a user should permanently share the exact same periods.

The current architectural decision is **yes: all budgets belonging to a user share the user's periods**.

---

# Design Philosophy

When proposing future changes, prioritize:

> **Simple, normalized, concrete, and easy to query.**

Avoid adding abstractions, polymorphic relationships, event/history tables, or additional entities unless there is a clear requirement that cannot be handled cleanly with the existing model.
