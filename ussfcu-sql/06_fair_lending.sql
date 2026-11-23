-- Group 6: Fair Lending (3 tables)
-- fair_lending_snapshot, hmda_lar_records, procedure_adherence

CREATE TABLE IF NOT EXISTS fair_lending_snapshot (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    product_id UUID REFERENCES loan_products(product_id),
    demographic_group TEXT,
    race TEXT,
    ethnicity TEXT,
    sex TEXT,
    age_band TEXT,
    total_applications INT,
    approvals INT,
    denials INT,
    withdrawals INT,
    approval_rate NUMERIC(5,4),
    avg_rate_spread NUMERIC(6,4),
    avg_dti NUMERIC(5,4),
    avg_ltv NUMERIC(5,4),
    avg_credit_score NUMERIC(6,2),
    disparity_index NUMERIC(6,4),
    risk_flag BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_fl_snapshot_date ON fair_lending_snapshot(snapshot_date);
CREATE INDEX idx_fl_snapshot_product ON fair_lending_snapshot(product_id);
CREATE INDEX idx_fl_risk_flag ON fair_lending_snapshot(risk_flag);

CREATE TABLE IF NOT EXISTS hmda_lar_records (
    lar_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES loan_applications(application_id),
    lar_year INT NOT NULL,
    lar_sequence INT,
    action_taken INT,
    action_taken_date DATE,
    loan_type INT,
    loan_purpose INT,
    owner_occupancy INT,
    loan_amount NUMERIC(15,2),
    property_type INT,
    preapproval INT,
    census_tract TEXT,
    msa_md TEXT,
    state_code TEXT,
    county_code TEXT,
    applicant_race_1 INT,
    applicant_race_2 INT,
    applicant_ethnicity INT,
    applicant_sex INT,
    applicant_income INT,
    purchaser_type INT,
    denial_reason_1 INT,
    denial_reason_2 INT,
    denial_reason_3 INT,
    rate_spread NUMERIC(6,4),
    hoepa_status INT,
    lien_status INT,
    edit_status TEXT CHECK (edit_status IN ('PASS','FAIL','WARNING','PENDING')),
    submitted BOOLEAN NOT NULL DEFAULT FALSE,
    submission_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_hmda_application ON hmda_lar_records(application_id);
CREATE INDEX idx_hmda_year ON hmda_lar_records(lar_year);
CREATE INDEX idx_hmda_edit_status ON hmda_lar_records(edit_status);
CREATE INDEX idx_hmda_submitted ON hmda_lar_records(submitted);

CREATE TABLE IF NOT EXISTS procedure_adherence (
    adherence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_date DATE NOT NULL,
    procedure_code TEXT NOT NULL,
    procedure_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('FAIR_LENDING','BSA','TRID','HMDA','MLA','SCRA','CRA')),
    loan_id UUID REFERENCES loan_accounts(loan_id),
    application_id UUID REFERENCES loan_applications(application_id),
    lo_id UUID REFERENCES loan_officers(lo_id),
    passed BOOLEAN NOT NULL,
    finding_detail TEXT,
    remediated BOOLEAN NOT NULL DEFAULT FALSE,
    remediation_date DATE,
    reviewed_by UUID REFERENCES staff(staff_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_proc_adh_date ON procedure_adherence(check_date);
CREATE INDEX idx_proc_adh_category ON procedure_adherence(category);
CREATE INDEX idx_proc_adh_passed ON procedure_adherence(passed);
CREATE INDEX idx_proc_adh_lo ON procedure_adherence(lo_id);
