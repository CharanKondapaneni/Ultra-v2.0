-- Group 5: Disclosures (3 tables)
-- esign_consent, disclosures, changed_circumstances

-- esign_consent created first; disclosures references it
CREATE TABLE IF NOT EXISTS esign_consent (
    consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(member_id),
    loan_id UUID REFERENCES loan_accounts(loan_id),
    consent_date TIMESTAMPTZ NOT NULL,
    consent_method TEXT CHECK (consent_method IN ('WEBSITE','EMAIL','BRANCH')),
    ip_address TEXT,
    device_info TEXT,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revocation_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_esign_member ON esign_consent(member_id);
CREATE INDEX idx_esign_loan ON esign_consent(loan_id);
CREATE INDEX idx_esign_revoked ON esign_consent(revoked);

CREATE TABLE IF NOT EXISTS disclosures (
    disclosure_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loan_accounts(loan_id),
    application_id UUID REFERENCES loan_applications(application_id),
    disclosure_type TEXT NOT NULL CHECK (disclosure_type IN (
        'LOAN_ESTIMATE','CLOSING_DISCLOSURE','MLA_DISCLOSURE','SCRA_NOTICE',
        'TRID_LE','TRID_CD','RIGHT_OF_RESCISSION'
    )),
    required_date DATE,
    provided_date DATE,
    timely BOOLEAN,
    delivery_method TEXT CHECK (delivery_method IN ('ELECTRONIC','PAPER','IN_PERSON')),
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    esign_consent_id UUID REFERENCES esign_consent(consent_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_disclosures_loan ON disclosures(loan_id);
CREATE INDEX idx_disclosures_application ON disclosures(application_id);
CREATE INDEX idx_disclosures_type ON disclosures(disclosure_type);
CREATE INDEX idx_disclosures_timely ON disclosures(timely);

CREATE TABLE IF NOT EXISTS changed_circumstances (
    change_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES loan_applications(application_id),
    change_date DATE NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN (
        'BORROWER_REQUEST','INTEREST_RATE_LOCK','ELIGIBILITY','VALUE','EXPIRATION','OTHER'
    )),
    description TEXT,
    revised_le_issued BOOLEAN NOT NULL DEFAULT FALSE,
    revised_le_date DATE,
    within_3_days BOOLEAN,
    created_by UUID REFERENCES staff(staff_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_changed_circ_application ON changed_circumstances(application_id);
CREATE INDEX idx_changed_circ_date ON changed_circumstances(change_date);
