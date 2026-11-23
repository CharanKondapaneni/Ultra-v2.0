-- Group 4: Lending & Origination (5 tables)
-- loan_applications, loan_accounts, loan_transactions, loan_modifications, adverse_action_notices

CREATE TABLE IF NOT EXISTS loan_applications (
    application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(member_id),
    lo_id UUID REFERENCES loan_officers(lo_id),
    product_id UUID NOT NULL REFERENCES loan_products(product_id),
    application_date DATE NOT NULL,
    application_amount NUMERIC(15,2),
    application_status TEXT NOT NULL CHECK (application_status IN ('PENDING','APPROVED','DENIED','WITHDRAWN','INCOMPLETE')),
    denial_reason TEXT,
    denial_reason_code TEXT,
    decision_date DATE,
    decisioning_days INT,
    branch_id UUID REFERENCES branches(branch_id),
    hmda_reportable BOOLEAN NOT NULL DEFAULT FALSE,
    race TEXT,
    ethnicity TEXT,
    sex TEXT,
    income NUMERIC(15,2),
    dti_ratio NUMERIC(5,4),
    ltv_ratio NUMERIC(5,4),
    credit_score INT,
    purpose_code TEXT,
    occupancy_type TEXT,
    property_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_loan_app_member ON loan_applications(member_id);
CREATE INDEX idx_loan_app_lo ON loan_applications(lo_id);
CREATE INDEX idx_loan_app_product ON loan_applications(product_id);
CREATE INDEX idx_loan_app_status ON loan_applications(application_status);
CREATE INDEX idx_loan_app_date ON loan_applications(application_date);
CREATE INDEX idx_loan_app_hmda ON loan_applications(hmda_reportable);

CREATE TABLE IF NOT EXISTS loan_accounts (
    loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES loan_applications(application_id),
    member_id UUID NOT NULL REFERENCES members(member_id),
    lo_id UUID REFERENCES loan_officers(lo_id),
    product_id UUID NOT NULL REFERENCES loan_products(product_id),
    branch_id UUID REFERENCES branches(branch_id),
    origination_date DATE NOT NULL,
    maturity_date DATE,
    original_balance NUMERIC(15,2),
    current_balance NUMERIC(15,2),
    interest_rate NUMERIC(6,4),
    rate_type TEXT CHECK (rate_type IN ('FIXED','VARIABLE','HYBRID')),
    term_months INT,
    monthly_payment NUMERIC(15,2),
    next_payment_date DATE,
    loan_status TEXT NOT NULL CHECK (loan_status IN ('CURRENT','DELINQUENT','DEFAULT','CHARGED_OFF','PAID_OFF','MODIFIED')),
    days_past_due INT NOT NULL DEFAULT 0,
    mla_covered BOOLEAN NOT NULL DEFAULT FALSE,
    scra_protected BOOLEAN NOT NULL DEFAULT FALSE,
    modified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_loan_accounts_member ON loan_accounts(member_id);
CREATE INDEX idx_loan_accounts_product ON loan_accounts(product_id);
CREATE INDEX idx_loan_accounts_status ON loan_accounts(loan_status);
CREATE INDEX idx_loan_accounts_origination ON loan_accounts(origination_date);
CREATE INDEX idx_loan_accounts_scra ON loan_accounts(scra_protected);
CREATE INDEX idx_loan_accounts_mla ON loan_accounts(mla_covered);

CREATE TABLE IF NOT EXISTS loan_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loan_accounts(loan_id),
    transaction_date DATE NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('PAYMENT','ADVANCE','FEE','INTEREST_ACCRUAL','PAYOFF','CHARGE_OFF')),
    amount NUMERIC(15,2) NOT NULL,
    principal_portion NUMERIC(15,2),
    interest_portion NUMERIC(15,2),
    fee_portion NUMERIC(15,2),
    escrow_portion NUMERIC(15,2),
    running_balance NUMERIC(15,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_loan_txn_loan ON loan_transactions(loan_id);
CREATE INDEX idx_loan_txn_date ON loan_transactions(transaction_date);
CREATE INDEX idx_loan_txn_type ON loan_transactions(transaction_type);

CREATE TABLE IF NOT EXISTS loan_modifications (
    modification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loan_accounts(loan_id),
    modification_date DATE NOT NULL,
    modification_type TEXT NOT NULL CHECK (modification_type IN ('RATE_REDUCTION','TERM_EXTENSION','PAYMENT_DEFERRAL','PRINCIPAL_FORGIVENESS','COMBINATION')),
    pre_mod_rate NUMERIC(6,4),
    post_mod_rate NUMERIC(6,4),
    pre_mod_term INT,
    post_mod_term INT,
    pre_mod_payment NUMERIC(15,2),
    post_mod_payment NUMERIC(15,2),
    hardship_reason TEXT,
    approved_by UUID REFERENCES staff(staff_id),
    effective_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_loan_mod_loan ON loan_modifications(loan_id);
CREATE INDEX idx_loan_mod_date ON loan_modifications(modification_date);
CREATE INDEX idx_loan_mod_type ON loan_modifications(modification_type);

CREATE TABLE IF NOT EXISTS adverse_action_notices (
    notice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES loan_applications(application_id),
    member_id UUID NOT NULL REFERENCES members(member_id),
    notice_type TEXT NOT NULL CHECK (notice_type IN ('DENIAL','COUNTEROFFER','INCOMPLETE')),
    generated_date DATE NOT NULL,
    required_mail_date DATE,
    actual_mail_date DATE,
    days_to_mail INT,
    timely BOOLEAN,
    denial_reasons TEXT[],
    denial_reason_codes TEXT[],
    mailed_by UUID REFERENCES staff(staff_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_aan_application ON adverse_action_notices(application_id);
CREATE INDEX idx_aan_member ON adverse_action_notices(member_id);
CREATE INDEX idx_aan_timely ON adverse_action_notices(timely);
CREATE INDEX idx_aan_generated ON adverse_action_notices(generated_date);
