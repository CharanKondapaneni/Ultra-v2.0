-- Group 1: Foundation (6 tables)
-- employers, seg_groups, branches, staff, loan_officers, fiscal_calendar

CREATE TABLE IF NOT EXISTS employers (
    employer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    employer_type TEXT NOT NULL CHECK (employer_type IN ('SEG','DIRECT','SPONSOR')),
    industry_code TEXT,
    federal_agency_code TEXT,
    shutdown_sensitivity TEXT CHECK (shutdown_sensitivity IN ('HIGH','MEDIUM','LOW')),
    shutdown_risk_level TEXT CHECK (shutdown_risk_level IN ('CRITICAL','HIGH','MEDIUM','LOW')),
    last_financial_review_date DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_employers_type ON employers(employer_type);
CREATE INDEX idx_employers_active ON employers(active);

CREATE TABLE IF NOT EXISTS seg_groups (
    seg_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID NOT NULL REFERENCES employers(employer_id),
    seg_name TEXT NOT NULL,
    seg_type TEXT NOT NULL CHECK (seg_type IN ('SENATE','HOUSE','CONTRACTOR','RETIREE','MILITARY')),
    estimated_eligible_count INT,
    effective_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_seg_groups_employer ON seg_groups(employer_id);
CREATE INDEX idx_seg_groups_type ON seg_groups(seg_type);

-- staff inserted before branches; branch_id nullable to break the circular FK
CREATE TABLE IF NOT EXISTS staff (
    staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT,
    branch_id UUID,
    hire_date DATE,
    termination_date DATE,
    manager_staff_id UUID REFERENCES staff(staff_id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_staff_branch ON staff(branch_id);
CREATE INDEX idx_staff_active ON staff(active);

CREATE TABLE IF NOT EXISTS branches (
    branch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state CHAR(2),
    zip TEXT,
    region TEXT,
    manager_staff_id UUID REFERENCES staff(staff_id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    opened_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_branches_active ON branches(active);
CREATE INDEX idx_branches_region ON branches(region);

-- Resolve circular FK: staff.branch_id -> branches
ALTER TABLE staff ADD CONSTRAINT fk_staff_branch FOREIGN KEY (branch_id) REFERENCES branches(branch_id);

CREATE TABLE IF NOT EXISTS loan_officers (
    lo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(staff_id),
    nmls_id TEXT UNIQUE,
    branch_id UUID REFERENCES branches(branch_id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    hire_date DATE,
    termination_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_lo_staff ON loan_officers(staff_id);
CREATE INDEX idx_lo_branch ON loan_officers(branch_id);

CREATE TABLE IF NOT EXISTS fiscal_calendar (
    fiscal_date DATE PRIMARY KEY,
    fiscal_year INT NOT NULL,
    fiscal_quarter INT NOT NULL CHECK (fiscal_quarter BETWEEN 1 AND 4),
    fiscal_month INT NOT NULL CHECK (fiscal_month BETWEEN 1 AND 12),
    fiscal_week INT,
    federal_holiday BOOLEAN NOT NULL DEFAULT FALSE,
    government_shutdown BOOLEAN NOT NULL DEFAULT FALSE,
    shutdown_day_number INT,
    pay_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    congressional_session BOOLEAN NOT NULL DEFAULT FALSE,
    special_period TEXT CHECK (special_period IN (
        'GOVERNMENT_SHUTDOWN','CONTINUING_RESOLUTION','COVID_EMERGENCY',
        'STIMULUS_ACTIVE','ZERO_RATE_ENV','RATE_HIKE_CYCLE','MILITARY_SURGE',
        'DEBT_CEILING_CRISIS','BANKING_SECTOR_STRESS','CONGRESSIONAL_TRANSITION',
        'POST_PANDEMIC_NORMALIZATION'
    )),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_fiscal_year ON fiscal_calendar(fiscal_year);
CREATE INDEX idx_fiscal_special_period ON fiscal_calendar(special_period);
CREATE INDEX idx_fiscal_shutdown ON fiscal_calendar(government_shutdown);
