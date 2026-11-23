-- Group 11: Loan Portfolio Analytics (3 tables)
-- loan_delinquency, charge_off_records, loan_portfolio_snapshot

CREATE TABLE IF NOT EXISTS loan_delinquency (
    delinquency_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loan_accounts(loan_id),
    as_of_date DATE NOT NULL,
    days_past_due INT NOT NULL DEFAULT 0,
    delinquency_bucket TEXT NOT NULL CHECK (delinquency_bucket IN ('CURRENT','30DPD','60DPD','90DPD','120DPD','180DPD_PLUS')),
    delinquent_balance NUMERIC(15,2),
    delinquent_principal NUMERIC(15,2),
    delinquent_interest NUMERIC(15,2),
    hardship_flag BOOLEAN NOT NULL DEFAULT FALSE,
    government_shutdown_related BOOLEAN NOT NULL DEFAULT FALSE,
    collection_status TEXT CHECK (collection_status IN ('NONE','SOFT_LETTER','HARD_LETTER','CALL','LEGAL','CHARGE_OFF_PENDING')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_delinquency_loan ON loan_delinquency(loan_id);
CREATE INDEX idx_delinquency_date ON loan_delinquency(as_of_date);
CREATE INDEX idx_delinquency_bucket ON loan_delinquency(delinquency_bucket);
CREATE INDEX idx_delinquency_shutdown ON loan_delinquency(government_shutdown_related);

CREATE TABLE IF NOT EXISTS charge_off_records (
    charge_off_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loan_accounts(loan_id),
    member_id UUID NOT NULL REFERENCES members(member_id),
    charge_off_date DATE NOT NULL,
    charge_off_amount NUMERIC(15,2),
    charge_off_principal NUMERIC(15,2),
    charge_off_interest NUMERIC(15,2),
    charge_off_fees NUMERIC(15,2),
    recovery_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    net_charge_off NUMERIC(15,2),
    charge_off_reason TEXT,
    collection_agency_assigned BOOLEAN NOT NULL DEFAULT FALSE,
    bankruptcy_filed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_charge_off_loan ON charge_off_records(loan_id);
CREATE INDEX idx_charge_off_member ON charge_off_records(member_id);
CREATE INDEX idx_charge_off_date ON charge_off_records(charge_off_date);

CREATE TABLE IF NOT EXISTS loan_portfolio_snapshot (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    product_id UUID REFERENCES loan_products(product_id),
    total_loans INT,
    total_balance NUMERIC(15,2),
    avg_balance NUMERIC(15,2),
    avg_rate NUMERIC(6,4),
    avg_term_months NUMERIC(8,2),
    weighted_avg_ltv NUMERIC(5,4),
    weighted_avg_dti NUMERIC(5,4),
    weighted_avg_fico NUMERIC(6,2),
    delinquency_rate NUMERIC(5,4),
    npa_rate NUMERIC(5,4),
    charge_off_rate NUMERIC(5,4),
    prepayment_rate NUMERIC(5,4),
    modified_loan_count INT,
    modified_loan_balance NUMERIC(15,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_lps_date ON loan_portfolio_snapshot(snapshot_date);
CREATE INDEX idx_lps_product ON loan_portfolio_snapshot(product_id);
