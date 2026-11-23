-- Group 9: Exam & Regulatory (5 tables)
-- exam_cycles, compliance_findings, exam_readiness_score, regulatory_items, training_completions

CREATE TABLE IF NOT EXISTS exam_cycles (
    exam_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_type TEXT NOT NULL CHECK (exam_type IN ('NCUA','STATE','INTERNAL_AUDIT','PEER_REVIEW')),
    exam_year INT NOT NULL,
    exam_start_date DATE,
    exam_end_date DATE,
    examiner_agency TEXT,
    lead_examiner TEXT,
    scope TEXT[],
    camel_rating INT CHECK (camel_rating BETWEEN 1 AND 5),
    component_ratings JSONB,
    exam_status TEXT NOT NULL CHECK (exam_status IN ('SCHEDULED','IN_PROGRESS','COMPLETED','REPORT_ISSUED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_exam_year ON exam_cycles(exam_year);
CREATE INDEX idx_exam_type ON exam_cycles(exam_type);
CREATE INDEX idx_exam_status ON exam_cycles(exam_status);

CREATE TABLE IF NOT EXISTS compliance_findings (
    finding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exam_cycles(exam_id),
    finding_date DATE NOT NULL,
    finding_type TEXT NOT NULL CHECK (finding_type IN ('MRA','RECOMMENDATION','BEST_PRACTICE','VIOLATION')),
    regulatory_area TEXT NOT NULL CHECK (regulatory_area IN ('FAIR_LENDING','BSA','TRID','HMDA','MLA','SCRA','CRA','CAPITAL','OTHER')),
    severity TEXT NOT NULL CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW')),
    description TEXT,
    citation TEXT,
    corrective_action TEXT,
    due_date DATE,
    status TEXT NOT NULL CHECK (status IN ('OPEN','IN_PROGRESS','REMEDIATED','VERIFIED_CLOSED','OVERDUE')),
    assigned_to UUID REFERENCES staff(staff_id),
    closed_date DATE,
    verified_by UUID REFERENCES staff(staff_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_findings_exam ON compliance_findings(exam_id);
CREATE INDEX idx_findings_severity ON compliance_findings(severity);
CREATE INDEX idx_findings_status ON compliance_findings(status);
CREATE INDEX idx_findings_area ON compliance_findings(regulatory_area);
CREATE INDEX idx_findings_date ON compliance_findings(finding_date);

CREATE TABLE IF NOT EXISTS exam_readiness_score (
    score_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    score_date DATE NOT NULL,
    regulatory_area TEXT NOT NULL,
    domain TEXT,
    score NUMERIC(6,2),
    max_score NUMERIC(6,2),
    score_pct NUMERIC(5,4),
    prior_score NUMERIC(6,2),
    trend TEXT CHECK (trend IN ('IMPROVING','STABLE','DECLINING')),
    gap_detail TEXT,
    action_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_readiness_date ON exam_readiness_score(score_date);
CREATE INDEX idx_readiness_area ON exam_readiness_score(regulatory_area);

CREATE TABLE IF NOT EXISTS regulatory_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type TEXT NOT NULL CHECK (item_type IN ('RULE','GUIDANCE','EXAM_FINDING','POLICY_UPDATE','DEADLINE')),
    regulatory_body TEXT NOT NULL CHECK (regulatory_body IN ('NCUA','CFPB','FINCEN','FFIEC','STATE')),
    title TEXT NOT NULL,
    effective_date DATE,
    due_date DATE,
    description TEXT,
    impact_areas TEXT[],
    status TEXT NOT NULL CHECK (status IN ('PENDING','IN_PROGRESS','COMPLETED','OVERDUE')),
    assigned_to UUID REFERENCES staff(staff_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reg_items_due ON regulatory_items(due_date);
CREATE INDEX idx_reg_items_status ON regulatory_items(status);
CREATE INDEX idx_reg_items_body ON regulatory_items(regulatory_body);

CREATE TABLE IF NOT EXISTS training_completions (
    training_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(staff_id),
    course_code TEXT NOT NULL,
    course_name TEXT NOT NULL,
    training_type TEXT NOT NULL CHECK (training_type IN ('BSA','FAIR_LENDING','TRID','MLA','SCRA','GENERAL_COMPLIANCE','ETHICS')),
    required BOOLEAN NOT NULL DEFAULT TRUE,
    required_completion_date DATE,
    completion_date DATE,
    score NUMERIC(5,2),
    passed BOOLEAN,
    certification_expiry DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_training_staff ON training_completions(staff_id);
CREATE INDEX idx_training_type ON training_completions(training_type);
CREATE INDEX idx_training_passed ON training_completions(passed);
CREATE INDEX idx_training_required_date ON training_completions(required_completion_date);
