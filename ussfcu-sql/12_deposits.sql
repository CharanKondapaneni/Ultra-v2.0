-- Group 12: Deposits (4 tables)
-- share_accounts, share_transactions, certificate_maturity_schedule, seg_deposit_snapshot

CREATE TABLE IF NOT EXISTS share_accounts (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(member_id),
    product_id UUID NOT NULL REFERENCES share_products(product_id),
    branch_id UUID REFERENCES branches(branch_id),
    account_number TEXT UNIQUE NOT NULL,
    opened_date DATE NOT NULL,
    closed_date DATE,
    current_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
    available_balance NUMERIC(15,2),
    minimum_balance NUMERIC(15,2),
    dividend_rate NUMERIC(6,4),
    apy NUMERIC(6,4),
    account_status TEXT NOT NULL CHECK (account_status IN ('ACTIVE','DORMANT','CLOSED')),
    autopay_source BOOLEAN NOT NULL DEFAULT FALSE,
    direct_deposit BOOLEAN NOT NULL DEFAULT FALSE,
    digital_enrolled BOOLEAN NOT NULL DEFAULT FALSE,
    maturity_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_share_acct_member ON share_accounts(member_id);
CREATE INDEX idx_share_acct_product ON share_accounts(product_id);
CREATE INDEX idx_share_acct_status ON share_accounts(account_status);
CREATE INDEX idx_share_acct_maturity ON share_accounts(maturity_date);

CREATE TABLE IF NOT EXISTS share_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES share_accounts(account_id),
    transaction_date DATE NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('DEPOSIT','WITHDRAWAL','TRANSFER','DIVIDEND','FEE','INTEREST')),
    amount NUMERIC(15,2) NOT NULL,
    running_balance NUMERIC(15,2),
    channel TEXT CHECK (channel IN ('BRANCH','ATM','ACH','WIRE','MOBILE','ONLINE')),
    reference TEXT,
    government_shutdown_related BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_share_txn_account ON share_transactions(account_id);
CREATE INDEX idx_share_txn_date ON share_transactions(transaction_date);
CREATE INDEX idx_share_txn_type ON share_transactions(transaction_type);
CREATE INDEX idx_share_txn_shutdown ON share_transactions(government_shutdown_related);

CREATE TABLE IF NOT EXISTS certificate_maturity_schedule (
    schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES share_accounts(account_id),
    member_id UUID NOT NULL REFERENCES members(member_id),
    face_amount NUMERIC(15,2) NOT NULL,
    dividend_rate NUMERIC(6,4),
    apy NUMERIC(6,4),
    term_months INT,
    open_date DATE,
    maturity_date DATE NOT NULL,
    days_to_maturity INT,
    projected_dividend NUMERIC(15,2),
    renewal_intent TEXT CHECK (renewal_intent IN ('RENEW','REDEEM','UNDECIDED')),
    seg_id UUID REFERENCES seg_groups(seg_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cert_maturity ON certificate_maturity_schedule(maturity_date);
CREATE INDEX idx_cert_member ON certificate_maturity_schedule(member_id);
CREATE INDEX idx_cert_seg ON certificate_maturity_schedule(seg_id);

CREATE TABLE IF NOT EXISTS seg_deposit_snapshot (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    seg_id UUID NOT NULL REFERENCES seg_groups(seg_id),
    total_members_with_deposits INT,
    total_deposit_balance NUMERIC(15,2),
    avg_balance_per_member NUMERIC(15,2),
    checking_balance NUMERIC(15,2),
    savings_balance NUMERIC(15,2),
    certificate_balance NUMERIC(15,2),
    money_market_balance NUMERIC(15,2),
    government_shutdown_flag BOOLEAN NOT NULL DEFAULT FALSE,
    prior_shutdown_comparison NUMERIC(15,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_seg_dep_date ON seg_deposit_snapshot(snapshot_date);
CREATE INDEX idx_seg_dep_seg ON seg_deposit_snapshot(seg_id);
CREATE INDEX idx_seg_dep_shutdown ON seg_deposit_snapshot(government_shutdown_flag);
