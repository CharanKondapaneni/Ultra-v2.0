-- Group 8: BSA/AML & Military (3 tables)
-- bsa_cases, cip_documentation, mla_scra_checks

CREATE TABLE IF NOT EXISTS bsa_cases (
    case_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(member_id),
    case_type TEXT NOT NULL CHECK (case_type IN ('SAR','CTR','HIGH_RISK_REVIEW','EDD')),
    case_date DATE NOT NULL,
    alert_trigger TEXT,
    risk_category TEXT NOT NULL CHECK (risk_category IN ('HIGH','MEDIUM','LOW')),
    status TEXT NOT NULL CHECK (status IN ('OPEN','INVESTIGATING','CLOSED','FILED','ESCALATED')),
    assigned_to UUID REFERENCES staff(staff_id),
    fincen_filing_required BOOLEAN NOT NULL DEFAULT FALSE,
    fincen_filed BOOLEAN NOT NULL DEFAULT FALSE,
    fincen_filing_date DATE,
    fincen_reference TEXT,
    closed_date DATE,
    disposition TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_bsa_member ON bsa_cases(member_id);
CREATE INDEX idx_bsa_type ON bsa_cases(case_type);
CREATE INDEX idx_bsa_status ON bsa_cases(status);
CREATE INDEX idx_bsa_date ON bsa_cases(case_date);

CREATE TABLE IF NOT EXISTS cip_documentation (
    cip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(member_id),
    verification_date DATE NOT NULL,
    id_type TEXT NOT NULL CHECK (id_type IN ('PASSPORT','DRIVERS_LICENSE','STATE_ID','MILITARY_ID','OTHER')),
    id_number_hash TEXT,
    id_expiry DATE,
    verification_method TEXT NOT NULL CHECK (verification_method IN ('IN_PERSON','DOCUMENTARY','NON_DOCUMENTARY')),
    verified_by UUID REFERENCES staff(staff_id),
    beneficial_owner_verified BOOLEAN NOT NULL DEFAULT FALSE,
    pep_flag BOOLEAN NOT NULL DEFAULT FALSE,
    ofac_checked BOOLEAN NOT NULL DEFAULT FALSE,
    ofac_check_date DATE,
    deficiency_flag BOOLEAN NOT NULL DEFAULT FALSE,
    deficiency_detail TEXT,
    remediated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cip_member ON cip_documentation(member_id);
CREATE INDEX idx_cip_deficiency ON cip_documentation(deficiency_flag);
CREATE INDEX idx_cip_pep ON cip_documentation(pep_flag);
CREATE INDEX idx_cip_date ON cip_documentation(verification_date);

CREATE TABLE IF NOT EXISTS mla_scra_checks (
    check_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(member_id),
    loan_id UUID REFERENCES loan_accounts(loan_id),
    check_date DATE NOT NULL,
    check_type TEXT NOT NULL CHECK (check_type IN ('MLA','SCRA')),
    database_queried TEXT CHECK (database_queried IN ('DMDC','DEERS','BOTH')),
    is_covered BOOLEAN NOT NULL DEFAULT FALSE,
    coverage_start_date DATE,
    coverage_end_date DATE,
    mapr_rate NUMERIC(6,4),
    mapr_compliant BOOLEAN,
    oral_disclosure_provided BOOLEAN NOT NULL DEFAULT FALSE,
    written_disclosure_provided BOOLEAN NOT NULL DEFAULT FALSE,
    checked_by UUID REFERENCES staff(staff_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mla_member ON mla_scra_checks(member_id);
CREATE INDEX idx_mla_loan ON mla_scra_checks(loan_id);
CREATE INDEX idx_mla_type ON mla_scra_checks(check_type);
CREATE INDEX idx_mla_covered ON mla_scra_checks(is_covered);
CREATE INDEX idx_mla_date ON mla_scra_checks(check_date);
