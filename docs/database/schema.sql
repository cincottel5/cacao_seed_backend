-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE budgets_type AS ENUM (
    'personal',
    'household',
    'travel',
    'vacation'
);

CREATE TYPE periods_mode AS ENUM (
    'at_demand',
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
    'debt_payment',
    'account_initial_balance'
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
    'wants'
);

CREATE TYPE saving_book_details_saving_mode AS ENUM (
    'to_date',
    'to_amount',
    'each_month'
);

CREATE TYPE book_scheduling_frequency AS ENUM (
    'each_week',
    'each_two_weeks',
    'each_month',
    'each_year'
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE FUNCTION is_valid_period_start_days(days SMALLINT[])
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT
        cardinality(days) > 0
        AND array_length(days, 1) IS NOT NULL
        AND NOT EXISTS (
            SELECT 1
            FROM unnest(days) AS day
            WHERE day < 1 OR day > 31
        );
$$;

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    user_id UUID NOT NULL PRIMARY KEY,
    google_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);


-- ============================================================
-- USER SETTINGS
-- ============================================================

CREATE TABLE user_settings (
    user_id UUID NOT NULL PRIMARY KEY,

    currency user_settings_currency NOT NULL DEFAULT 'crc',
    language user_settings_language NOT NULL DEFAULT 'es',

    periods_mode periods_mode NOT NULL DEFAULT 'each_month',

    -- Example:
    -- [1]       -> starts on the 1st
    -- [12, 26]  -> starts on the 12th and 26th
    periods_start_days SMALLINT[] NOT NULL DEFAULT ARRAY[1],

    -- Mainly used by at_demand.
    minimum_period_days SMALLINT NOT NULL DEFAULT 7,

    CONSTRAINT fk_user_settings_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id),

    CONSTRAINT chk_user_settings_minimum_period_days
        CHECK (minimum_period_days > 0),

    CONSTRAINT chk_user_settings_periods_start_days
    CHECK (is_valid_period_start_days(periods_start_days))
);


-- ============================================================
-- BUDGETS
-- ============================================================

CREATE TABLE budgets (
    budget_id UUID NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type budgets_type NOT NULL DEFAULT 'personal',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
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
        REFERENCES users (user_id),

    CONSTRAINT fk_users_budgets_budget
        FOREIGN KEY (budget_id)
        REFERENCES budgets (budget_id)
);


-- ============================================================
-- PERIODS
-- ============================================================

CREATE TABLE periods (
    period_id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,

    CONSTRAINT fk_periods_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id),

    CONSTRAINT chk_periods_dates
        CHECK (
            end_date IS NULL
            OR end_date >= start_date
        )
);


-- ============================================================
-- BOOKS
-- ============================================================

CREATE TABLE books (
    book_id INTEGER NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    budget_id UUID NOT NULL,
    type books_type NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_books_budget
        FOREIGN KEY (budget_id)
        REFERENCES budgets (budget_id)
);


-- ============================================================
-- ACCOUNT BOOK DETAILS
-- ============================================================

CREATE TABLE account_book_details (
    book_id INTEGER NOT NULL PRIMARY KEY,
    card_last_digits VARCHAR(4) NOT NULL,

    CONSTRAINT fk_account_book_details_book
        FOREIGN KEY (book_id)
        REFERENCES books (book_id)
);


-- ============================================================
-- EXPENSE BOOK DETAILS
-- ============================================================

CREATE TABLE expense_book_details (
    book_id INTEGER NOT NULL PRIMARY KEY,

    estimated_amount DECIMAL(18,2) NOT NULL,

    adjusted_amount DECIMAL(18,2) NULL,

    control_level expense_book_details_control_level
        NOT NULL DEFAULT 'fixed',

    priority_level expense_book_details_priority_level
        NOT NULL DEFAULT 'needs',

    parent_expense_id INTEGER NOT NULL,

    is_subscription BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_expense_book_details_book
        FOREIGN KEY (book_id)
        REFERENCES books (book_id),

    CONSTRAINT fk_expense_book_details_parent
        FOREIGN KEY (parent_expense_id)
        REFERENCES books (book_id),

    CONSTRAINT chk_expense_estimated_amount
        CHECK (estimated_amount >= 0),

    CONSTRAINT chk_expense_adjusted_amount
        CHECK (
            adjusted_amount IS NULL
            OR adjusted_amount >= 0
        )
);


-- ============================================================
-- SAVING BOOK DETAILS
-- ============================================================

CREATE TABLE saving_book_details (
    book_id INTEGER NOT NULL PRIMARY KEY,

    account_book_id INTEGER NOT NULL,

    goal_amount DECIMAL(18,2) NOT NULL,

    saving_mode saving_book_details_saving_mode NOT NULL,

    period_amount DECIMAL(18,2) NOT NULL,

    priority SMALLINT NOT NULL DEFAULT 1,

    is_emergency_savings BOOLEAN NOT NULL DEFAULT FALSE,

    start_date DATE NOT NULL,
    goal_date DATE NOT NULL,

    continue_if_fulfilled BOOLEAN NOT NULL,

    initial_balance DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT fk_saving_book_details_book
        FOREIGN KEY (book_id)
        REFERENCES books (book_id),

    CONSTRAINT fk_saving_book_details_account
        FOREIGN KEY (account_book_id)
        REFERENCES books (book_id),

    CONSTRAINT chk_saving_goal_amount
        CHECK (goal_amount >= 0),

    CONSTRAINT chk_saving_period_amount
        CHECK (period_amount >= 0),

    CONSTRAINT chk_saving_priority
        CHECK (priority > 0),

    CONSTRAINT chk_saving_initial_balance
        CHECK (initial_balance >= 0),

    CONSTRAINT chk_saving_dates
        CHECK (goal_date >= start_date)
);


-- ============================================================
-- DEBT BOOK DETAILS
-- ============================================================

CREATE TABLE debt_book_details (
    book_id INTEGER NOT NULL PRIMARY KEY,

    original_debt_amount DECIMAL(18,2) NOT NULL,
    installments INTEGER NOT NULL,
    interest_rate DECIMAL(18,2) NOT NULL,

    CONSTRAINT fk_debt_book_details_book
        FOREIGN KEY (book_id)
        REFERENCES books (book_id),

    CONSTRAINT chk_debt_original_amount
        CHECK (original_debt_amount >= 0),

    CONSTRAINT chk_debt_installments
        CHECK (installments > 0),

    CONSTRAINT chk_debt_interest_rate
        CHECK (interest_rate >= 0)
);


-- ============================================================
-- BOOK SCHEDULING
-- ============================================================

CREATE TABLE book_scheduling (
    book_id INTEGER NOT NULL PRIMARY KEY,

    frequency book_scheduling_frequency NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NULL,

    take_from_book_id INTEGER NOT NULL,

    automatic_transaction BOOLEAN NOT NULL,

    CONSTRAINT fk_book_scheduling_book
        FOREIGN KEY (book_id)
        REFERENCES books (book_id),

    CONSTRAINT fk_book_scheduling_take_from_book
        FOREIGN KEY (take_from_book_id)
        REFERENCES books (book_id),

    CONSTRAINT chk_book_scheduling_dates
        CHECK (end_date >= start_date)
);


-- ============================================================
-- TRANSACTIONS
-- ============================================================

CREATE TABLE transactions (
    transaction_id UUID NOT NULL PRIMARY KEY,

    amount DECIMAL(18,2) NOT NULL,
    currency transactions_currency NOT NULL,

    user_currency_amount DECIMAL(18,2) NOT NULL,

    comments VARCHAR(528) NULL,

    type transactions_type NOT NULL,

    date TIMESTAMPTZ NOT NULL,

    take_in_book_id INTEGER NULL,
    take_from_book_id INTEGER NULL,

    exchange_rate DECIMAL(18,6) NOT NULL,

    reference_number VARCHAR(255) NULL,
    authorization_number VARCHAR(255) NULL,
    merchant VARCHAR(255) NULL,

    CONSTRAINT fk_transactions_take_in_book
        FOREIGN KEY (take_in_book_id)
        REFERENCES books (book_id),

    CONSTRAINT fk_transactions_take_from_book
        FOREIGN KEY (take_from_book_id)
        REFERENCES books (book_id),

    CONSTRAINT chk_transactions_amount
        CHECK (amount >= 0),

    CONSTRAINT chk_transactions_user_currency_amount
        CHECK (user_currency_amount >= 0),

    CONSTRAINT chk_transactions_exchange_rate
        CHECK (exchange_rate > 0),

    CONSTRAINT chk_transactions_at_least_one_book
        CHECK (
            take_in_book_id IS NOT NULL
            OR take_from_book_id IS NOT NULL
        )
);


-- ============================================================
-- EXPENSE OCCURRENCES
-- ============================================================

CREATE TABLE expense_occurrences (
    occurrence_id UUID NOT NULL PRIMARY KEY,

    expense_book_id INTEGER NOT NULL,
    period_id UUID NOT NULL,

    due_date DATE NOT NULL,

    expected_amount DECIMAL(18,2) NOT NULL,

    transaction_id UUID NULL,

    CONSTRAINT fk_expense_occurrences_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions (transaction_id),

    CONSTRAINT fk_expense_occurrences_expense_book
        FOREIGN KEY (expense_book_id)
        REFERENCES expense_book_details (book_id),

    CONSTRAINT fk_expense_occurrences_period
        FOREIGN KEY (period_id)
        REFERENCES periods (period_id),

    CONSTRAINT chk_expense_occurrences_expected_amount
        CHECK (expected_amount >= 0),

    CONSTRAINT uq_expense_occurrences_book_period
        UNIQUE (expense_book_id, period_id)
);


-- ============================================================
-- INDEXES
-- ============================================================

-- User -> budgets
CREATE INDEX idx_users_budgets_budget_id
    ON users_budgets (budget_id);


-- User -> periods
CREATE INDEX idx_periods_user_start_date
    ON periods (user_id, start_date);


-- Useful for finding the currently open period.
CREATE INDEX idx_periods_user_open
    ON periods (user_id)
    WHERE end_date IS NULL;


-- Budget -> books
CREATE INDEX idx_books_budget_id
    ON books (budget_id);


-- Useful when retrieving books by budget and type.
CREATE INDEX idx_books_budget_type
    ON books (budget_id, type);


-- Transactions from an account/book over time.
CREATE INDEX idx_transactions_from_book_date
    ON transactions (take_from_book_id, date);


-- Transactions into an account/book over time.
CREATE INDEX idx_transactions_in_book_date
    ON transactions (take_in_book_id, date);


-- Useful when querying transactions by type and date.
CREATE INDEX idx_transactions_type_date
    ON transactions (type, date);


-- Expense occurrences by expense.
CREATE INDEX idx_expense_occurrences_expense_book
    ON expense_occurrences (expense_book_id);


-- Expense occurrences by period.
CREATE INDEX idx_expense_occurrences_period
    ON expense_occurrences (period_id);


-- Pending/upcoming occurrences by due date.
CREATE INDEX idx_expense_occurrences_due_date
    ON expense_occurrences (due_date);


-- Scheduling lookup by source account.
CREATE INDEX idx_book_scheduling_take_from_book
    ON book_scheduling (take_from_book_id);