-- Group 14: Income & GL (3 tables)
-- income_statement_monthly, general_ledger_account, gl_reconciliation

CREATE TABLE IF NOT EXISTS income_statement_monthly (
    statement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_month DATE NOT NULL UNIQUE,
    interest_income_loans NUMERIC(15,2),
    interest_income_investments NUMERIC(15,2),
    total_interest_income NUMERIC(15,2),
    interest_expense_deposits NUMERIC(15,2),
    interest_expense_borrowings NUMERIC(15,2),
    total_interest_expense NUMERIC(15,2),
    net_interest_income NUMERIC(15,2),
    provision_for_loan_losses NUMERIC(15,2),
    net_interest_income_after_provision NUMERIC(15,2),
    fee_income NUMERIC(15,2),
    service_charge_income NUMERIC(15,2),
    other_non_interest_income NUMERIC(15,2),
    total_non_interest_income NUMERIC(15,2),
    compensation_expense NUMERIC(15,2),
    occupancy_expense NUMERIC(15,2),
    technology_expense NUMERIC(15,2),
    other_operating_expense NUMERIC(15,2),
    total_non_interest_expense NUMERIC(15,2),
    net_income NUMERIC(15,2),
    efficiency_ratio NUMERIC(6,4),
    nim NUMERIC(6,4),
    roa NUMERIC(6,4),
    roe NUMERIC(6,4),
    budget_net_income NUMERIC(15,2),
    variance_vs_budget NUMERIC(15,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_income_month ON income_statement_monthly(statement_month);

CREATE TABLE IF NOT EXISTS general_ledger_account (
    gl_account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number TEXT UNIQUE NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('ASSET','LIABILITY','EQUITY','INCOME','EXPENSE')),
    sub_type TEXT,
    normal_balance TEXT NOT NULL CHECK (normal_balance IN ('DEBIT','CREDIT')),
    parent_account_id UUID REFERENCES general_ledger_account(gl_account_id),
    is_summary BOOLEAN NOT NULL DEFAULT FALSE,
    budget_annual NUMERIC(15,2),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_gl_type ON general_ledger_account(account_type);
CREATE INDEX idx_gl_parent ON general_ledger_account(parent_account_id);
CREATE INDEX idx_gl_active ON general_ledger_account(active);

CREATE TABLE IF NOT EXISTS gl_reconciliation (
    recon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recon_date DATE NOT NULL,
    gl_account_id UUID NOT NULL REFERENCES general_ledger_account(gl_account_id),
    gl_balance NUMERIC(15,2),
    sub_ledger_balance NUMERIC(15,2),
    variance NUMERIC(15,2),
    variance_pct NUMERIC(6,4),
    reconciled BOOLEAN NOT NULL DEFAULT FALSE,
    reconciled_by UUID REFERENCES staff(staff_id),
    reconciliation_notes TEXT,
    exceptions_count INT NOT NULL DEFAULT 0,
    material_variance BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_recon_date ON gl_reconciliation(recon_date);
CREATE INDEX idx_recon_account ON gl_reconciliation(gl_account_id);
CREATE INDEX idx_recon_material ON gl_reconciliation(material_variance);
