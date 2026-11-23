-- Group 18: Supplemental Tables (6 tables)
-- interest_rate_swaps, dividend_declarations, nps_snapshot, succession_planning, employer_financial_health, fee_income_detail

CREATE TABLE IF NOT EXISTS interest_rate_swaps (
    swap_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counterparty TEXT NOT NULL,
    trade_date DATE NOT NULL,
    effective_date DATE,
    maturity_date DATE,
    notional_amount NUMERIC(15,2) NOT NULL,
    leg_type TEXT NOT NULL CHECK (leg_type IN ('PAY_FIXED','RECEIVE_FIXED')),
    fixed_rate NUMERIC(6,4),
    floating_index TEXT CHECK (floating_index IN ('SOFR','LIBOR','PRIME')),
    floating_spread NUMERIC(6,4),
    fair_value NUMERIC(15,2),
    unrealized_gain_loss NUMERIC(15,2),
    hedge_designation TEXT CHECK (hedge_designation IN ('FAIR_VALUE','CASH_FLOW','NOT_DESIGNATED')),
    hedged_item_description TEXT,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE','TERMINATED','EXPIRED','MATURED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_swaps_status ON interest_rate_swaps(status);
CREATE INDEX idx_swaps_maturity ON interest_rate_swaps(maturity_date);

CREATE TABLE IF NOT EXISTS dividend_declarations (
    declaration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES share_products(product_id),
    declaration_date DATE NOT NULL,
    record_date DATE,
    payment_date DATE,
    declared_rate NUMERIC(6,4) NOT NULL,
    declared_apy NUMERIC(6,4),
    period_type TEXT NOT NULL CHECK (period_type IN ('MONTHLY','QUARTERLY','ANNUAL')),
    total_dividends_paid NUMERIC(15,2),
    members_eligible INT,
    declared_by_board_resolution TEXT,
    fiscal_quarter INT CHECK (fiscal_quarter BETWEEN 1 AND 4),
    fiscal_year INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_div_decl_product ON dividend_declarations(product_id);
CREATE INDEX idx_div_decl_date ON dividend_declarations(declaration_date);
CREATE INDEX idx_div_decl_year ON dividend_declarations(fiscal_year);

CREATE TABLE IF NOT EXISTS nps_snapshot (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('WEEKLY','MONTHLY','QUARTERLY')),
    segment TEXT NOT NULL CHECK (segment IN ('ALL','SEG_SENATE','SEG_HOUSE','SEG_CONTRACTOR','SEG_RETIREE','BRANCH')),
    seg_id UUID REFERENCES seg_groups(seg_id),
    branch_id UUID REFERENCES branches(branch_id),
    CHECK (
        (seg_id IS NULL OR branch_id IS NULL)
    ),
    channel TEXT NOT NULL CHECK (channel IN ('ALL','BRANCH','PHONE','CHAT','WEB','MOBILE')),
    nps_score NUMERIC(5,2) CHECK (nps_score BETWEEN -100 AND 100),
    promoters_count INT,
    passives_count INT,
    detractors_count INT,
    total_responses INT,
    avg_satisfaction_score NUMERIC(4,2) CHECK (avg_satisfaction_score BETWEEN 1 AND 5),
    response_rate_pct NUMERIC(5,4),
    prior_period_nps NUMERIC(5,2),
    nps_trend TEXT CHECK (nps_trend IN ('IMPROVING','STABLE','DECLINING')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_nps_date ON nps_snapshot(snapshot_date);
CREATE INDEX idx_nps_segment ON nps_snapshot(segment);
CREATE INDEX idx_nps_period ON nps_snapshot(period_type);

CREATE TABLE IF NOT EXISTS succession_planning (
    succession_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_title TEXT NOT NULL,
    department TEXT,
    incumbent_staff_id UUID REFERENCES staff(staff_id),
    successor_staff_id UUID REFERENCES staff(staff_id),
    readiness_level TEXT NOT NULL CHECK (readiness_level IN ('READY_NOW','READY_1YR','READY_2_3YR','NO_SUCCESSOR')),
    criticality TEXT NOT NULL CHECK (criticality IN ('CRITICAL','HIGH','MEDIUM','LOW')),
    development_plan TEXT,
    last_review_date DATE,
    next_review_date DATE,
    board_reported BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE','FILLED','ELIMINATED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_succession_criticality ON succession_planning(criticality);
CREATE INDEX idx_succession_readiness ON succession_planning(readiness_level);
CREATE INDEX idx_succession_status ON succession_planning(status);

CREATE TABLE IF NOT EXISTS employer_financial_health (
    health_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID NOT NULL REFERENCES employers(employer_id),
    as_of_date DATE NOT NULL,
    credit_rating TEXT CHECK (credit_rating IN ('AAA','AA','A','BBB','BB','B','CCC','NR')),
    credit_rating_agency TEXT CHECK (credit_rating_agency IN ('MOODYS','SP','FITCH','NR')),
    financial_stability_score NUMERIC(4,2) CHECK (financial_stability_score BETWEEN 1 AND 10),
    layoff_risk_flag BOOLEAN NOT NULL DEFAULT FALSE,
    recent_layoff_count INT,
    budget_status TEXT CHECK (budget_status IN ('ENACTED','CONTINUING_RESOLUTION','SHUTDOWN_RISK','SHUTDOWN')),
    appropriations_status TEXT,
    headcount INT,
    headcount_change_pct NUMERIC(6,4),
    revenue_annual NUMERIC(15,2),
    notes TEXT,
    source TEXT CHECK (source IN ('OPM','NEWS','INTERNAL','PUBLIC_FILING')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_emp_health_employer ON employer_financial_health(employer_id);
CREATE INDEX idx_emp_health_date ON employer_financial_health(as_of_date);
CREATE INDEX idx_emp_health_budget ON employer_financial_health(budget_status);
CREATE INDEX idx_emp_health_layoff ON employer_financial_health(layoff_risk_flag);

CREATE TABLE IF NOT EXISTS fee_income_detail (
    fee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_date DATE NOT NULL,
    product_id UUID REFERENCES loan_products(product_id),
    share_product_id UUID REFERENCES share_products(product_id),
    fee_type TEXT NOT NULL CHECK (fee_type IN (
        'ORIGINATION','LATE','OVERDRAFT','ATM','WIRE','ANNUAL',
        'PREPAYMENT','NSF','SERVICE_CHARGE','OTHER'
    )),
    fee_amount NUMERIC(15,2) NOT NULL,
    member_id UUID NOT NULL REFERENCES members(member_id),
    loan_account_id UUID REFERENCES loan_accounts(loan_id),
    share_account_id UUID REFERENCES share_accounts(account_id),
    CHECK (
        (loan_account_id IS NOT NULL AND share_account_id IS NULL) OR
        (share_account_id IS NOT NULL AND loan_account_id IS NULL) OR
        (loan_account_id IS NULL AND share_account_id IS NULL)
    ),
    branch_id UUID REFERENCES branches(branch_id),
    waived BOOLEAN NOT NULL DEFAULT FALSE,
    waived_reason TEXT,
    gl_account_id UUID REFERENCES general_ledger_account(gl_account_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_fee_date ON fee_income_detail(fee_date);
CREATE INDEX idx_fee_type ON fee_income_detail(fee_type);
CREATE INDEX idx_fee_member ON fee_income_detail(member_id);
CREATE INDEX idx_fee_product ON fee_income_detail(product_id);
CREATE INDEX idx_fee_waived ON fee_income_detail(waived);
