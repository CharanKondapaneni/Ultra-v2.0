-- Group 13: Capital & Liquidity (4 tables)
-- capital_liquidity_snapshot, liquidity_projections, borrowing_lines, alll_reserves

CREATE TABLE IF NOT EXISTS capital_liquidity_snapshot (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL UNIQUE,
    total_assets NUMERIC(15,2),
    total_loans NUMERIC(15,2),
    total_deposits NUMERIC(15,2),
    total_equity NUMERIC(15,2),
    net_worth_ratio NUMERIC(6,4),
    risk_weighted_assets NUMERIC(15,2),
    tier1_capital_ratio NUMERIC(6,4),
    total_capital_ratio NUMERIC(6,4),
    leverage_ratio NUMERIC(6,4),
    well_capitalized_threshold NUMERIC(6,4),
    adequately_capitalized_threshold NUMERIC(6,4),
    ncua_net_worth_category TEXT CHECK (ncua_net_worth_category IN (
        'WELL_CAPITALIZED','ADEQUATELY_CAPITALIZED','UNDERCAPITALIZED',
        'SIGNIFICANTLY_UNDERCAPITALIZED','CRITICALLY_UNDERCAPITALIZED'
    )),
    liquidity_ratio NUMERIC(6,4),
    loan_to_share_ratio NUMERIC(6,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cap_liq_date ON capital_liquidity_snapshot(snapshot_date);

CREATE TABLE IF NOT EXISTS liquidity_projections (
    projection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projection_date DATE NOT NULL,
    scenario TEXT NOT NULL CHECK (scenario IN ('BASE','STRESS','GOVERNMENT_SHUTDOWN','RATE_SHOCK')),
    projection_horizon_days INT NOT NULL,
    projected_cash_inflows NUMERIC(15,2),
    projected_cash_outflows NUMERIC(15,2),
    net_cash_position NUMERIC(15,2),
    borrowing_capacity_available NUMERIC(15,2),
    minimum_liquidity_requirement NUMERIC(15,2),
    liquidity_buffer NUMERIC(15,2),
    liquidity_sufficient BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_liq_proj_date ON liquidity_projections(projection_date);
CREATE INDEX idx_liq_proj_scenario ON liquidity_projections(scenario);

CREATE TABLE IF NOT EXISTS borrowing_lines (
    line_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lender_name TEXT NOT NULL,
    line_type TEXT NOT NULL CHECK (line_type IN ('FHLB','FED_DISCOUNT_WINDOW','CLF','CORPORATE_CU','REPO')),
    credit_limit NUMERIC(15,2),
    current_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
    available_balance NUMERIC(15,2),
    utilization_pct NUMERIC(5,4),
    rate NUMERIC(6,4),
    collateral_pledged NUMERIC(15,2),
    collateral_type TEXT,
    maturity_date DATE,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED')),
    last_draw_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_borrowing_type ON borrowing_lines(line_type);
CREATE INDEX idx_borrowing_status ON borrowing_lines(status);

CREATE TABLE IF NOT EXISTS alll_reserves (
    reserve_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserve_date DATE NOT NULL,
    product_id UUID REFERENCES loan_products(product_id),
    loan_segment TEXT,
    beginning_balance NUMERIC(15,2),
    provision_expense NUMERIC(15,2),
    charge_offs NUMERIC(15,2),
    recoveries NUMERIC(15,2),
    ending_balance NUMERIC(15,2),
    loan_balance NUMERIC(15,2),
    reserve_rate NUMERIC(6,4),
    qualitative_adjustment NUMERIC(15,2),
    model_loss_estimate NUMERIC(15,2),
    management_overlay NUMERIC(15,2),
    cecl_compliant BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_alll_date ON alll_reserves(reserve_date);
CREATE INDEX idx_alll_product ON alll_reserves(product_id);
