-- Group 10: Compliance Operations (3 tables)
-- vendors, file_exceptions, action_artifacts

CREATE TABLE IF NOT EXISTS vendors (
    vendor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_name TEXT NOT NULL,
    vendor_type TEXT NOT NULL CHECK (vendor_type IN ('TECHNOLOGY','SERVICER','AUDITOR','CONSULTANT','LEGAL')),
    contract_start DATE,
    contract_end DATE,
    annual_contract_value NUMERIC(15,2),
    risk_tier TEXT NOT NULL CHECK (risk_tier IN ('CRITICAL','HIGH','MEDIUM','LOW')),
    last_risk_assessment_date DATE,
    next_assessment_due DATE,
    soc2_certified BOOLEAN NOT NULL DEFAULT FALSE,
    soc2_expiry DATE,
    pen_test_date DATE,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE','INACTIVE','UNDER_REVIEW')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_risk_tier ON vendors(risk_tier);
CREATE INDEX idx_vendors_next_assessment ON vendors(next_assessment_due);

CREATE TABLE IF NOT EXISTS file_exceptions (
    exception_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loan_accounts(loan_id),
    application_id UUID REFERENCES loan_applications(application_id),
    exception_type TEXT NOT NULL CHECK (exception_type IN ('MISSING_DOCUMENT','EXPIRED_DOCUMENT','DATA_DISCREPANCY','POLICY_DEVIATION')),
    description TEXT,
    identified_date DATE NOT NULL,
    identified_by UUID REFERENCES staff(staff_id),
    days_outstanding INT,
    resolution_due_date DATE,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolution_date DATE,
    resolved_by UUID REFERENCES staff(staff_id),
    exception_severity TEXT NOT NULL CHECK (exception_severity IN ('HIGH','MEDIUM','LOW')),
    lo_id UUID REFERENCES loan_officers(lo_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_exceptions_loan ON file_exceptions(loan_id);
CREATE INDEX idx_exceptions_severity ON file_exceptions(exception_severity);
CREATE INDEX idx_exceptions_resolved ON file_exceptions(resolved);
CREATE INDEX idx_exceptions_identified ON file_exceptions(identified_date);
CREATE INDEX idx_exceptions_lo ON file_exceptions(lo_id);

CREATE TABLE IF NOT EXISTS action_artifacts (
    artifact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL CHECK (source_type IN ('EXAM_FINDING','COMPLAINT','BSA_CASE','REGULATORY_ITEM','INTERNAL_AUDIT')),
    source_id UUID NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('POLICY_UPDATE','TRAINING','SYSTEM_CHANGE','PROCESS_CHANGE','COMMUNICATION','ESCALATION')),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES staff(staff_id),
    due_date DATE,
    status TEXT NOT NULL CHECK (status IN ('OPEN','IN_PROGRESS','COMPLETED','OVERDUE')),
    completed_date DATE,
    evidence_url TEXT,
    board_reported BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_artifacts_source ON action_artifacts(source_type, source_id);
CREATE INDEX idx_artifacts_status ON action_artifacts(status);
CREATE INDEX idx_artifacts_due ON action_artifacts(due_date);
