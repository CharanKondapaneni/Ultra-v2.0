-- Group 2: Members (3 tables)
-- members, membership_snapshot, member_share_of_wallet

CREATE TABLE IF NOT EXISTS members (
    member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_number TEXT UNIQUE NOT NULL,
    employer_id UUID REFERENCES employers(employer_id),
    seg_id UUID REFERENCES seg_groups(seg_id),
    branch_id UUID REFERENCES branches(branch_id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    ssn_hash TEXT,
    membership_date DATE NOT NULL,
    membership_type TEXT NOT NULL CHECK (membership_type IN ('PRIMARY','JOINT','BUSINESS')),
    status TEXT NOT NULL CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED','CLOSED')),
    military_status TEXT CHECK (military_status IN ('ACTIVE_DUTY','RESERVE','VETERAN','CIVILIAN')),
    state CHAR(2),
    zip TEXT,
    digital_enrolled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_members_employer ON members(employer_id);
CREATE INDEX idx_members_seg ON members(seg_id);
CREATE INDEX idx_members_branch ON members(branch_id);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_military ON members(military_status);
CREATE INDEX idx_members_membership_date ON members(membership_date);

CREATE TABLE IF NOT EXISTS membership_snapshot (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    seg_id UUID REFERENCES seg_groups(seg_id),
    total_members INT,
    new_members INT,
    closed_members INT,
    active_borrowers INT,
    avg_tenure_months NUMERIC(8,2),
    digital_adoption_rate NUMERIC(5,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_membership_snapshot_date ON membership_snapshot(snapshot_date);
CREATE INDEX idx_membership_snapshot_seg ON membership_snapshot(seg_id);

CREATE TABLE IF NOT EXISTS member_share_of_wallet (
    wallet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(member_id),
    snapshot_date DATE NOT NULL,
    checking_balance NUMERIC(15,2),
    savings_balance NUMERIC(15,2),
    loan_balance NUMERIC(15,2),
    certificates_balance NUMERIC(15,2),
    investment_balance NUMERIC(15,2),
    estimated_outside_deposits NUMERIC(15,2),
    share_of_wallet_pct NUMERIC(5,4),
    product_count INT,
    nps_score INT CHECK (nps_score BETWEEN -100 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_wallet_member ON member_share_of_wallet(member_id);
CREATE INDEX idx_wallet_date ON member_share_of_wallet(snapshot_date);
