```sql
-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE budgets_type AS ENUM (
    'personal',
    'household',
    'travel',
    'vacation'
);

CREATE TYPE budgets_periods_mode AS ENUM (
    'each_income',
    'biweekly',
    'each_month',
    'weekly',
    'range'
);

CREATE TYPE users_budgets_role AS ENUM (
    'admin',
    'member',
    'viewer'
);

CREATE TYPE books_type AS ENUM (
    'account',
    'saving',
    'expense',
    'debt',
    'investment'
);

CREATE TYPE transactions_currency AS ENUM (
    'crc',
    'usd'
);

CREATE TYPE transactions_type AS ENUM (
    'movement',
    'expense',
    'saving',
    'income',
    'investment',
    'debt_payment'
);

CREATE TYPE user_settings_currency AS ENUM (
    'crc',
    'usd'
);

CREATE TYPE user_settings_language AS ENUM (
    'es',
    'en'
);

CREATE TYPE expense_book_details_control_level AS ENUM (
    'fixed',
    'adjustable',
    'easy_adjustable'
);

CREATE TYPE expense_book_details_priority_level AS ENUM (
    'needs',
    'wish'
);

CREATE TYPE saving_book_details_saving_mode AS ENUM (
    'to_date',
    'to_amount',
    'each_month'
);

CREATE TYPE book_scheduling_frequency AS ENUM (
    'each_month',
    'each_year'
);


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    google_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- USER SETTINGS
-- ============================================================

CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY,
    currency user_settings_currency NOT NULL DEFAULT 'crc',
    language user_settings_language NOT NULL DEFAULT 'es',

    CONSTRAINT fk_user_settings_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
);


-- ============================================================
-- BUDGETS
-- ============================================================

CREATE TABLE budgets (
    budget_id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type budgets_type NOT NULL DEFAULT 'personal',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    periods_mode budgets_periods_mode NOT NULL DEFAULT 'each_month',

    -- Used only when periods_mode = 'weekly'
    weekly_mode_day SMALLINT NULL,

    -- Used only when periods_mode = 'range'
    range_mode_from_date DATE NULL,
    range_mode_to_date DATE NULL,

    CONSTRAINT chk_budgets_weekly_mode_day
        CHECK (
            weekly_mode_day IS NULL
            OR weekly_mode_day BETWEEN 0 AND 6
        ),

    CONSTRAINT chk_budgets_range_dates
        CHECK (
            range_mode_from_date IS NULL
            OR range_mode_to_date IS NULL
            OR range_mode_from_date <= range_mode_to_date
        )
);


-- ============================================================
-- USERS <-> BUDGETS
-- ============================================================

CREATE TABLE users_budgets (
    user_id UUID NOT NULL,
    budget_id UUID NOT NULL,
    role users_budgets_role NOT NULL DEFAULT 'admin',

    PRIMARY KEY (user_id, budget_id),

    CONSTRAINT fk_users_budgets_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_users_budgets_budget
        FOREIGN KEY (budget_id)
        REFERENCES budgets (budget_id)
        ON DELETE CASCADE
);


-- ============================================================
-- BUDGET PERIOD START DAYS
--
-- Examples:
--
-- monthly:
--   budget_id | start_day
--   ----------+----------
--   A         | 1
--
-- biweekly:
--   budget_id | start_day
--   ----------+----------
--   A         | 12
--   A         | 26
-- ============================================================

CREATE TABLE budget_periods_start_days (
    budget_id UUID NOT NULL,
    start_day SMALLINT NOT NULL DEFAULT 1,

    PRIMARY KEY (budget_id, start_day),

    CONSTRAINT fk_budget_periods_start_days_budget
        FOREIGN KEY (budget_id)
        REFERENCES budgets (budget_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_budget_periods_start_day
        CHECK (start_day BETWEEN 1 AND 31)
);


-- ============================================================
-- ACTUAL BUDGET PERIODS
--
-- end_date is NULL while the period is open.
-- ============================================================

CREATE TABLE budget_periods (
    period_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    budget_id UUID NOT NULL,

    CONSTRAINT fk_budget_periods_budget
        FOREIGN KEY (budget_id)
        REFERENCES budgets (budget_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_budget_periods_dates
        CHECK (
            end_date IS NULL
            OR start_date <= end_date
        )
);


-- ============================================================
-- BOOKS
-- ============================================================

CREATE TABLE books (
    book_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    budget_id UUID NOT NULL,
    type books_type NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_books_budget
        FOREIGN KEY (budget_id)
        REFERENCES budgets (budget_id)
        ON DELETE CASCADE
);


-- ============================================================
-- ACCOUNT BOOK DETAILS
-- ============================================================

CREATE TABLE account_book_details (
    book_id INTEGER PRIMARY KEY,
    card_last_digits VARCHAR(4) NOT NULL,

    CONSTRAINT fk_account_book_details_book
        FOREIGN KEY (book_id)
        REFERENCES books (book_id)
        ON DELETE CASCADE
);


-- ============================================================
-- EXPENSE BOOK DETAILS
-- ============================================================

CREATE TABLE expense_book_details (
    book_id INTEGER PRIMARY KEY,
    estimated_amount DECIMAL(18,2) NOT NULL,
    adjusted_amount DECIMAL(18,2) NULL,
    control_level expense_book_details_control_level NOT NULL DEFAULT 'fixed',
    priority_level expense_book_details_priority_level NOT NULL DEFAULT 'needs',
    real_amount DECIMAL(18,2) NOT NULL,
    parent_book_id INTEGER NOT NULL,

    CONSTRAINT fk_expense_book_details_book
        FOREIGN KEY (book_id)
        REFERENCES books (book_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_expense_book_details_parent
        FOREIGN KEY (parent_book_id)
        REFERENCES books (book_id)
);


-- ============================================================
-- SAVING BOOK DETAILS
-- ============================================================

CREATE TABLE saving_book_details (
    book_id INTEGER PRIMARY KEY,
    account_book_id INTEGER NOT NULL,
    goal_amount DECIMAL(18,2) NOT NULL,
    period_amount DECIMAL(18,2) NOT NULL,
    saving_mode saving_book_details_saving_mode NOT NULL,
    is_emergency_savings BOOLEAN NOT NULL DEFAULT FALSE,
    start_date DATE NOT NULL,
    goal_date DATE NOT NULL,
    priority SMALLINT NOT NULL DEFAULT 1,
    continue_if_fulfilled BOOLEAN NOT NULL,
    initial_balance DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT fk_saving_book_details_book
        FOREIGN KEY (book_id)
        REFERENCES books (book_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_saving_book_details_account
        FOREIGN KEY (account_book_id)
        REFERENCES books (book_id),

    CONSTRAINT chk_saving_book_details_dates
        CHECK (start_date <= goal_date)
);


-- ============================================================
-- DEBT BOOK DETAILS
-- ============================================================

CREATE TABLE debt_book_details (
    book_id INTEGER PRIMARY KEY,
    original_debt_amount DECIMAL(18,2) NOT NULL,
    installments INTEGER NOT NULL,
    interest_rate DECIMAL(18,6) NOT NULL,

    CONSTRAINT fk_debt_book_details_book
        FOREIGN KEY (book_id)
        REFERENCES books (book_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_debt_installments
        CHECK (installments > 0),

    CONSTRAINT chk_debt_interest_rate
        CHECK (interest_rate >= 0)
);


-- ============================================================
-- BOOK SCHEDULING
-- ============================================================

CREATE TABLE book_scheduling (
    book_id INTEGER PRIMARY KEY,
    frequency book_scheduling_frequency NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    take_from_book_id INTEGER NOT NULL,
    automatic_transaction BOOLEAN NOT NULL,

    CONSTRAINT fk_book_scheduling_book
        FOREIGN KEY (book_id)
        REFERENCES books (book_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_book_scheduling_take_from_book
        FOREIGN KEY (take_from_book_id)
        REFERENCES books (book_id),

    CONSTRAINT chk_book_scheduling_dates
        CHECK (
            end_date IS NULL
            OR start_date <= end_date
        )
);


-- ============================================================
-- TRANSACTIONS
-- ============================================================

CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY,

    amount DECIMAL(18,2) NOT NULL,
    currency transactions_currency NOT NULL,
    user_currency_amount DECIMAL(18,2) NOT NULL,

    comments VARCHAR(528) NULL,

    type transactions_type NOT NULL,
    date TIMESTAMPTZ NOT NULL,

    take_in_book_id INTEGER NOT NULL,
    take_from_book_id INTEGER NOT NULL,

    exchange_rate DECIMAL(18,6) NOT NULL,

    reference_number VARCHAR(255) NULL,
    authorization_number VARCHAR(255) NULL,
    merchant VARCHAR(255) NULL,

    CONSTRAINT fk_transactions_take_in_book
        FOREIGN KEY (take_in_book_id)
        REFERENCES books (book_id),

    CONSTRAINT fk_transactions_take_from_book
        FOREIGN KEY (take_from_book_id)
        REFERENCES books (book_id)
);


-- ============================================================
-- INDEXES
-- ============================================================

-- ------------------------------------------------------------
-- users_budgets
--
-- PK already indexes (user_id, budget_id).
-- This index supports:
--   "give me all budgets for this user"        -> PK
--   "give me all users belonging to this budget" -> this index
-- ------------------------------------------------------------

CREATE INDEX idx_users_budgets_budget_id
    ON users_budgets (budget_id);


-- ------------------------------------------------------------
-- budgets
--
-- Useful when retrieving active/non-deleted budgets.
-- ------------------------------------------------------------

CREATE INDEX idx_budgets_active
    ON budgets (budget_id)
    WHERE is_deleted = FALSE;


-- ------------------------------------------------------------
-- budget_periods_start_days
--
-- PK (budget_id, start_day) already efficiently supports
-- retrieving start days for a budget.
-- No additional index required.
-- ------------------------------------------------------------


-- ------------------------------------------------------------
-- budget_periods
--
-- Supports retrieving periods belonging to a budget ordered
-- chronologically.
-- ------------------------------------------------------------

CREATE INDEX idx_budget_periods_budget_start_date
    ON budget_periods (budget_id, start_date);


-- ------------------------------------------------------------
-- books
--
-- Most important index for the budget -> books relationship.
-- ------------------------------------------------------------

CREATE INDEX idx_books_budget_id
    ON books (budget_id);


CREATE INDEX idx_books_active_by_budget
    ON books (budget_id, book_id)
    WHERE is_deleted = FALSE;


-- ------------------------------------------------------------
-- transactions
--
-- Transactions will commonly be queried by book and date.
-- Separate indexes are needed because a transaction has
-- two book relationships.
-- ------------------------------------------------------------

CREATE INDEX idx_transactions_take_from_book_date
    ON transactions (take_from_book_id, date DESC);


CREATE INDEX idx_transactions_take_in_book_date
    ON transactions (take_in_book_id, date DESC);


-- Useful for chronological transaction queries/reporting.
CREATE INDEX idx_transactions_date
    ON transactions (date DESC);


-- ------------------------------------------------------------
-- book_scheduling
--
-- Useful when finding scheduled movements originating
-- from a particular book.
-- ------------------------------------------------------------

CREATE INDEX idx_book_scheduling_take_from_book
    ON book_scheduling (take_from_book_id);


-- ============================================================
-- NOTES
-- ============================================================
--
-- 1. Transactions are intentionally NOT related directly
--    to budget_periods.
--
-- 2. budget_periods represents actual generated periods.
--
-- 3. For each_income:
--
--      current period:
--          start_date = income date
--          end_date   = NULL
--
--    When a qualifying new income arrives, close the current
--    period and create the new one.
--
-- 4. For each_income, the application can enforce the
--    minimum period length (currently 7 days) without adding
--    another database table or configuration field.
--
-- 5. budget_periods_start_days is intentionally a simple
--    many-to-one configuration:
--
--      monthly:
--          (budget_id, 1)
--
--      biweekly:
--          (budget_id, 12)
--          (budget_id, 26)
--
-- 6. The database does not enforce that a book referenced by
--    account_book_id, parent_book_id, etc. has the expected
--    books.type. That validation is intentionally left to
--    the application to keep the model simple.
--
-- ============================================================
```
