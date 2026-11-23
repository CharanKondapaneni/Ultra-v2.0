-- Group 16: Strategic & Peers (4 tables)
-- investments, peer_benchmarks, strategic_projections, initiatives

CREATE TABLE IF NOT EXISTS investments (
    investment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cusip TEXT UNIQUE,
    security_name TEXT NOT NULL,
    security_type TEXT NOT NULL CHECK (security_type IN ('TREASURY','AGENCY','MBS','CMO','MUNICIPAL','CORPORATE')),
    portfolio_classification TEXT NOT NULL CHECK (portfolio_classification IN ('AVAILABLE_FOR_SALE','HELD_TO_MATURITY')),
    par_value NUMERIC(15,2),
    book_value NUMERIC(15,2),
    fair_value NUMERIC(15,2),
    unrealized_gain_loss NUMERIC(15,2),
    coupon_rate NUMERIC(6,4),
    yield_to_maturity NUMERIC(6,4),
    maturity_date DATE,
    duration_years NUMERIC(6,2),
    weighted_avg_life NUMERIC(6,2),
    purchase_date DATE,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE','MATURED','SOLD','CALLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_investments_type ON investments(security_type);
CREATE INDEX idx_investments_maturity ON investments(maturity_date);
CREATE INDEX idx_investments_status ON investments(status);

CREATE TABLE IF NOT EXISTS peer_benchmarks (
    benchmark_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benchmark_date DATE NOT NULL,
    peer_group TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_category TEXT NOT NULL CHECK (metric_category IN ('CAPITAL','EARNINGS','LIQUIDITY','ASSET_QUALITY','GROWTH','EFFICIENCY','COMPLIANCE')),
    ussfcu_value NUMERIC(15,4),
    peer_median NUMERIC(15,4),
    peer_top_quartile NUMERIC(15,4),
    peer_bottom_quartile NUMERIC(15,4),
    percentile_rank NUMERIC(5,2),
    trend TEXT CHECK (trend IN ('IMPROVING','STABLE','DECLINING')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_peer_date ON peer_benchmarks(benchmark_date);
CREATE INDEX idx_peer_category ON peer_benchmarks(metric_category);
CREATE INDEX idx_peer_metric ON peer_benchmarks(metric_name);

CREATE TABLE IF NOT EXISTS strategic_projections (
    projection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_year INT NOT NULL,
    scenario TEXT NOT NULL CHECK (scenario IN ('BASE','OPTIMISTIC','PESSIMISTIC')),
    total_assets_projected NUMERIC(15,2),
    total_loans_projected NUMERIC(15,2),
    total_deposits_projected NUMERIC(15,2),
    net_worth_ratio_projected NUMERIC(6,4),
    net_income_projected NUMERIC(15,2),
    membership_projected INT,
    nim_projected NUMERIC(6,4),
    efficiency_ratio_projected NUMERIC(6,4),
    roa_projected NUMERIC(6,4),
    loan_growth_rate NUMERIC(6,4),
    deposit_growth_rate NUMERIC(6,4),
    capital_adequacy_buffer NUMERIC(6,4),
    government_shutdown_sensitivity NUMERIC(15,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_strat_proj_year ON strategic_projections(fiscal_year);
CREATE INDEX idx_strat_proj_scenario ON strategic_projections(scenario);

CREATE TABLE IF NOT EXISTS initiatives (
    initiative_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_name TEXT NOT NULL,
    initiative_type TEXT NOT NULL CHECK (initiative_type IN ('TECHNOLOGY','COMPLIANCE','GROWTH','EFFICIENCY','RISK','MEMBER_EXPERIENCE')),
    strategic_goal TEXT,
    fiscal_year INT,
    budget_allocated NUMERIC(15,2),
    budget_spent NUMERIC(15,2),
    budget_variance NUMERIC(15,2),
    status TEXT NOT NULL CHECK (status IN ('ON_TRACK','AT_RISK','DELAYED','COMPLETED','CANCELLED')),
    completion_pct NUMERIC(5,2),
    start_date DATE,
    target_completion DATE,
    actual_completion DATE,
    sponsor_staff_id UUID REFERENCES staff(staff_id),
    board_reported BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_initiatives_type ON initiatives(initiative_type);
CREATE INDEX idx_initiatives_status ON initiatives(status);
CREATE INDEX idx_initiatives_year ON initiatives(fiscal_year);
