-- Group 17: Computed Analytics Layer (6 tables)
-- kpi_registry, kpi_current, signals, data_lineage_map, business_performance_snapshot, digital_engagement

CREATE TABLE IF NOT EXISTS kpi_registry (
    kpi_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_code TEXT UNIQUE NOT NULL,
    kpi_name TEXT NOT NULL,
    kpi_category TEXT NOT NULL CHECK (kpi_category IN ('COMPLIANCE','FINANCE','MEMBER','RISK','STRATEGIC','OPERATIONAL')),
    persona_audience TEXT[],
    calculation_logic TEXT,
    data_sources TEXT[],
    unit TEXT,
    threshold_green NUMERIC,
    threshold_yellow NUMERIC,
    threshold_red NUMERIC,
    higher_is_better BOOLEAN NOT NULL DEFAULT TRUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_kpi_category ON kpi_registry(kpi_category);
CREATE INDEX idx_kpi_active ON kpi_registry(active);

CREATE TABLE IF NOT EXISTS kpi_current (
    current_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id UUID NOT NULL REFERENCES kpi_registry(kpi_id),
    as_of_date DATE NOT NULL,
    current_value NUMERIC(15,4),
    prior_period_value NUMERIC(15,4),
    change_abs NUMERIC(15,4),
    change_pct NUMERIC(8,4),
    status TEXT NOT NULL CHECK (status IN ('GREEN','YELLOW','RED')),
    trend TEXT NOT NULL CHECK (trend IN ('UP','DOWN','FLAT')),
    ytd_value NUMERIC(15,4),
    budget_value NUMERIC(15,4),
    variance_vs_budget NUMERIC(15,4),
    percentile_vs_peers NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_kpi_current_kpi ON kpi_current(kpi_id);
CREATE INDEX idx_kpi_current_date ON kpi_current(as_of_date);
CREATE INDEX idx_kpi_current_status ON kpi_current(status);
CREATE INDEX idx_kpi_current_latest ON kpi_current(kpi_id, as_of_date DESC);

CREATE TABLE IF NOT EXISTS signals (
    signal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_date DATE NOT NULL,
    signal_type TEXT NOT NULL CHECK (signal_type IN ('ANOMALY','PROACTIVE','PREDICTIVE','ALERT')),
    severity TEXT NOT NULL CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW','INFO')),
    category TEXT NOT NULL CHECK (category IN ('COMPLIANCE','FINANCE','MEMBER','RISK','OPERATIONAL')),
    title TEXT NOT NULL,
    description TEXT,
    affected_entity_type TEXT,
    affected_entity_id UUID,
    metric_name TEXT,
    current_value NUMERIC(15,4),
    threshold_value NUMERIC(15,4),
    recommended_action TEXT,
    persona_audience TEXT[],
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_by UUID REFERENCES staff(staff_id),
    acknowledged_at TIMESTAMPTZ,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_signals_date ON signals(signal_date);
CREATE INDEX idx_signals_type ON signals(signal_type);
CREATE INDEX idx_signals_severity ON signals(severity);
CREATE INDEX idx_signals_category ON signals(category);
CREATE INDEX idx_signals_resolved ON signals(resolved);

CREATE TABLE IF NOT EXISTS data_lineage_map (
    lineage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_table TEXT NOT NULL,
    target_column TEXT NOT NULL,
    source_table TEXT NOT NULL,
    source_column TEXT NOT NULL,
    transformation_logic TEXT,
    refresh_frequency TEXT,
    last_refreshed_at TIMESTAMPTZ,
    data_quality_score NUMERIC(5,4),
    row_count BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_lineage_target ON data_lineage_map(target_table);
CREATE INDEX idx_lineage_source ON data_lineage_map(source_table);

CREATE TABLE IF NOT EXISTS business_performance_snapshot (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('DAILY','WEEKLY','MONTHLY','QUARTERLY')),
    total_members INT,
    new_members_period INT,
    closed_members_period INT,
    net_member_growth INT,
    total_loans_outstanding NUMERIC(15,2),
    loan_originations_period NUMERIC(15,2),
    total_deposits NUMERIC(15,2),
    net_deposit_growth NUMERIC(15,2),
    nim NUMERIC(6,4),
    efficiency_ratio NUMERIC(6,4),
    roa NUMERIC(6,4),
    capital_ratio NUMERIC(6,4),
    delinquency_rate NUMERIC(6,4),
    charge_off_rate NUMERIC(6,4),
    compliance_score NUMERIC(5,4),
    digital_adoption_rate NUMERIC(5,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_bps_date ON business_performance_snapshot(snapshot_date);
CREATE INDEX idx_bps_period ON business_performance_snapshot(period_type);

CREATE TABLE IF NOT EXISTS digital_engagement (
    engagement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_date DATE NOT NULL,
    member_id UUID NOT NULL REFERENCES members(member_id),
    channel TEXT NOT NULL CHECK (channel IN ('MOBILE_APP','ONLINE_BANKING','CHATBOT','ALEXA','OTHER')),
    sessions_count INT NOT NULL DEFAULT 0,
    transactions_count INT NOT NULL DEFAULT 0,
    products_viewed INT NOT NULL DEFAULT 0,
    support_requests INT NOT NULL DEFAULT 0,
    avg_session_minutes NUMERIC(6,2),
    feature_flags TEXT[],
    government_shutdown_period BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_digital_member ON digital_engagement(member_id);
CREATE INDEX idx_digital_date ON digital_engagement(engagement_date);
CREATE INDEX idx_digital_channel ON digital_engagement(channel);
