-- Group 15: Scenarios & Rates (4 tables)
-- rate_environment, rate_scenarios, ml_scenario_results, playbook_actions

CREATE TABLE IF NOT EXISTS rate_environment (
    rate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate_date DATE NOT NULL UNIQUE,
    fed_funds_rate NUMERIC(6,4),
    prime_rate NUMERIC(6,4),
    sofr_rate NUMERIC(6,4),
    treasury_1yr NUMERIC(6,4),
    treasury_2yr NUMERIC(6,4),
    treasury_5yr NUMERIC(6,4),
    treasury_10yr NUMERIC(6,4),
    treasury_30yr NUMERIC(6,4),
    fhlb_advance_rate_1yr NUMERIC(6,4),
    yield_curve_slope NUMERIC(6,4),
    rate_change_basis_points INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rate_env_date ON rate_environment(rate_date);

CREATE TABLE IF NOT EXISTS rate_scenarios (
    scenario_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_name TEXT NOT NULL UNIQUE,
    scenario_type TEXT NOT NULL CHECK (scenario_type IN ('BASE','UP200','UP400','DOWN100','FLAT','CUSTOM')),
    created_date DATE NOT NULL DEFAULT CURRENT_DATE,
    rate_shock_basis_points INT,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES staff(staff_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_scenarios_type ON rate_scenarios(scenario_type);
CREATE INDEX idx_scenarios_active ON rate_scenarios(active);

CREATE TABLE IF NOT EXISTS ml_scenario_results (
    result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES rate_scenarios(scenario_id),
    model_name TEXT NOT NULL,
    run_date DATE NOT NULL,
    projection_months INT NOT NULL CHECK (projection_months > 0),
    projected_nim NUMERIC(6,4),
    projected_net_income NUMERIC(15,2),
    projected_capital_ratio NUMERIC(6,4),
    projected_liquidity_ratio NUMERIC(6,4),
    projected_loan_growth NUMERIC(6,4),
    projected_deposit_growth NUMERIC(6,4),
    projected_charge_off_rate NUMERIC(6,4),
    projected_efficiency_ratio NUMERIC(6,4),
    projected_delinquency_rate NUMERIC(6,4),
    projected_modification_volume INT,
    government_shutdown_included BOOLEAN NOT NULL DEFAULT FALSE,
    confidence_interval_low NUMERIC(6,4),
    confidence_interval_high NUMERIC(6,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ml_scenario ON ml_scenario_results(scenario_id);
CREATE INDEX idx_ml_run_date ON ml_scenario_results(run_date);
CREATE INDEX idx_ml_projection_months ON ml_scenario_results(projection_months);
CREATE INDEX idx_ml_scenario_latest ON ml_scenario_results(scenario_id, run_date DESC);

CREATE TABLE IF NOT EXISTS playbook_actions (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES rate_scenarios(scenario_id),
    action_sequence INT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'RATE_REPRICE','BORROWING_DRAW','INVESTMENT_PURCHASE',
        'LOAN_PROMOTION','DEPOSIT_CAMPAIGN','COST_REDUCTION'
    )),
    action_description TEXT,
    projected_impact NUMERIC(15,2),
    trigger_condition TEXT,
    assigned_to UUID REFERENCES staff(staff_id),
    status TEXT NOT NULL CHECK (status IN ('RECOMMENDED','APPROVED','EXECUTED','DEFERRED')),
    execution_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_playbook_scenario ON playbook_actions(scenario_id);
CREATE INDEX idx_playbook_status ON playbook_actions(status);
