-- ─── Markets ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS Markets (
  id           VARCHAR(100) PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  icon_url     VARCHAR(500),
  gradient_from VARCHAR(20),
  gradient_to   VARCHAR(20),
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Clients ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS Clients (
  id            VARCHAR(100) PRIMARY KEY,
  market_id     VARCHAR(100) REFERENCES Markets(id),
  name          VARCHAR(255) NOT NULL,
  name_lines    JSONB,         -- e.g. ["United States Senate", "Federal Credit Union"]
  tagline       VARCHAR(255),
  logo_url      VARCHAR(500),
  primary_color VARCHAR(20),
  slug          VARCHAR(100) NOT NULL UNIQUE,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Personas ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS Personas (
  id          VARCHAR(100) PRIMARY KEY,  -- e.g. penfed_maya
  client_id   VARCHAR(100) NOT NULL REFERENCES Clients(id),
  name        VARCHAR(255) NOT NULL,
  initials    VARCHAR(10)  NOT NULL,
  role        VARCHAR(255),
  greeting    VARCHAR(100),
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  nav         JSONB,          -- array of { key, label, path, icon_url }
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Seed: Markets ────────────────────────────────────────────────────────────

INSERT INTO Markets (id, name, icon_url, gradient_from, gradient_to) VALUES
  ('financial-services',  'Financial Services',         'icons/markets/financial-services.svg', '#3b82f6', '#6366f1'),
  ('health-care',         'Health Care',                'icons/markets/health-care.svg',         '#10b981', '#0ea5e9'),
  ('commercial',          'Commercial',                 'icons/markets/commercial.svg',           '#F27121', '#E94057'),
  ('oil-gas',             'Oil & Gas',                  'icons/markets/oil-gas.svg',              '#475569', '#F59E0B'),
  ('telecommunications',  'Telecommunications',         'icons/markets/telecommunications.svg',  '#3EB1EA', '#00388F'),
  ('sled',                'State, Local & Education',   'icons/markets/sle.svg',                  '#c8122c', '#1a4480')
ON CONFLICT (id) DO NOTHING;

-- ─── Seed: Clients ────────────────────────────────────────────────────────────

INSERT INTO Clients (id, market_id, name, name_lines, tagline, logo_url, primary_color, slug) VALUES
  ('ussfcu',           'financial-services', 'United States Senate Federal Credit Union', '["United States Senate","Federal Credit Union"]', 'AI Platform',               'logos/ussfcu-seal.png',          '#003087', 'ussfcu'),
  ('penfed',           'financial-services', 'Pentagon Federal Credit Union',             '["Pentagon Federal","Credit Union"]',              'AI Platform',               'logos/penfed-logo.svg',          '#003087', 'penfed'),
  ('esfcu',            'financial-services', 'Educational Systems Federal Credit Union',  NULL,                                               'Executive Intelligence',    'logos/esfcu-logo.svg',           '#003768', 'esfcu'),
  ('nfcu',             'financial-services', 'Navy Federal Credit Union',                 NULL,                                               'Workforce AI Platform',     'logos/nfcu-logo.svg',            '#003087', 'nfcu'),
  ('financial_services','financial-services','Financial Services',                        NULL,                                               'AI Platform',               'logos/fs-logo.svg',              '#003087', 'fs'),
  ('newfold_digital',  'commercial',         'Newfold Digital',                           NULL,                                               'Customer Care Intelligence','logos/newfold-icon.svg',         '#F27121', 'newfold'),
  ('aramco',           'oil-gas',            'Aramco',                                    NULL,                                               'HSE Intelligence',          'logos/aramco-emblem.png',        '#0071CE', 'aramco'),
  ('att',              'telecommunications', 'AT&T',                                      NULL,                                               'AI Billing Workbench',      'logos/att-globe.png',            '#0568AE', 'att'),
  ('doit',             'sled',               'Maryland DoIT',                             NULL,                                               'Voice of the Resident',     'logos/maryland-doit-mark.svg',   '#1a4480', 'doit'),
  ('amisa',            'sled',               'AMISA',                                     NULL,                                               'Better Together',           'logos/amisa-mark.png',           '#DB3D38', 'amisa'),
  ('md_comptroller',   'sled',               'Comptroller of Maryland',                   NULL,                                               'Trusted Revenue Data',      'logos/md-comptroller-mark.svg',  '#0B5563', 'comptroller'),
  ('sclac',            'sled',               'Superior Court of Los Angeles County',      NULL,                                               'Ask the KPI',               'logos/sclac-seal.png',           '#005EA2', 'sclac')
ON CONFLICT (id) DO NOTHING;

-- ─── Seed: Personas — ussfcu ──────────────────────────────────────────────────

INSERT INTO Personas (id, client_id, name, initials, role, greeting, is_default, nav) VALUES
  ('ussfcu_finance', 'ussfcu', 'Fiona F.',          'FI', 'Finance Team',                           'Fiona', TRUE,  '[{"key":"ask","label":"Ask the AI","path":"/ask","icon_url":"icons/nav/ask.svg"},{"key":"portfolioRisk","label":"Portfolio and Limits","path":"/portfolio-risk","icon_url":"icons/nav/portfolio-risk.svg"},{"key":"scenarios","label":"Scenarios and Modeling","path":"/scenarios","icon_url":"icons/nav/scenarios.svg"},{"key":"dataSources","label":"Data Sources","path":"/data-sources","icon_url":"icons/nav/data-sources.svg"}]'),
  ('ussfcu_evelyn',  'ussfcu', 'Evelyn Marsh',      'EM', 'VP, Compliance & Public Policy',         'Evelyn',FALSE, '[{"key":"ask","label":"Ask the AI","path":"/ask","icon_url":"icons/nav/ask.svg"},{"key":"complianceQuery","label":"Compliance Query","path":"/compliance-query","icon_url":"icons/nav/compliance-query.svg"},{"key":"disclosureCalendar","label":"Disclosure Calendar","path":"/disclosure-calendar","icon_url":"icons/nav/disclosure-calendar.svg"},{"key":"dataSources","label":"Data Sources","path":"/data-sources","icon_url":"icons/nav/data-sources.svg"}]'),
  ('ussfcu_ceo',     'ussfcu', 'Timothy L. Anderson','TA','President & Chief Executive Officer',    'Tim',   FALSE, '[{"key":"ask","label":"Ask the AI","path":"/ask","icon_url":"icons/nav/ask.svg"},{"key":"businessPerformance","label":"Business Performance","path":"/businessPerformance","icon_url":"icons/nav/business-performance.svg"},{"key":"prioritySignals","label":"Priority Signals","path":"/prioritySignals","icon_url":"icons/nav/priority-signals.svg"},{"key":"dataSources","label":"Data Sources","path":"/data-sources","icon_url":"icons/nav/data-sources.svg"}]'),
  ('ussfcu_cfo',     'ussfcu', 'Sylvia Reyes',      'SR', 'Chief Financial Officer',                'Sylvia',FALSE, '[{"key":"ask","label":"Ask the AI","path":"/ask","icon_url":"icons/nav/ask.svg"},{"key":"dataflow","label":"Data Flow & Lineage","path":"/dataflow","icon_url":"icons/nav/dataflow.svg"},{"key":"governanceSignals","label":"Governance Signals","path":"/governanceSignals","icon_url":"icons/nav/governance-signals.svg"},{"key":"dataSources","label":"Data Sources","path":"/data-sources","icon_url":"icons/nav/data-sources.svg"}]'),
  ('ussfcu_nadia',   'ussfcu', 'Nadia Hassan',      'NH', 'Compliance Analyst',                     'Nadia', FALSE, '[{"key":"ask","label":"Ask the AI","path":"/ask","icon_url":"icons/nav/ask.svg"},{"key":"complianceQuery","label":"Compliance Query","path":"/compliance-query","icon_url":"icons/nav/compliance-query.svg"},{"key":"disclosureCalendar","label":"Disclosure Calendar","path":"/disclosure-calendar","icon_url":"icons/nav/disclosure-calendar.svg"},{"key":"dataSources","label":"Data Sources","path":"/data-sources","icon_url":"icons/nav/data-sources.svg"}]')
ON CONFLICT (id) DO NOTHING;

-- ─── Seed: Personas — penfed ──────────────────────────────────────────────────

INSERT INTO Personas (id, client_id, name, initials, role, greeting, is_default, nav) VALUES
  ('penfed_maya',   'penfed', 'Maya J',    'MJ', 'Operations & Analytics', 'Maya',   TRUE,  '[{"key":"ask","label":"Ask the AI","path":"/ask","icon_url":"icons/nav/ask.svg"},{"key":"memberJourney","label":"Member Journey","path":"/member-journey","icon_url":"icons/nav/member-journey.svg"},{"key":"riskSignals","label":"Risk Signals","path":"/risk-signals","icon_url":"icons/nav/risk-signals.svg"},{"key":"dataSources","label":"Data Sources","path":"/data-sources","icon_url":"icons/nav/data-sources.svg"}]'),
  ('penfed_priya',  'penfed', 'Priya K',   'PK', 'CX Transformation',      'Priya',  FALSE, '[{"key":"ask","label":"Ask the AI","path":"/ask","icon_url":"icons/nav/ask.svg"},{"key":"memberJourney","label":"Member Journey","path":"/member-journey","icon_url":"icons/nav/member-journey.svg"},{"key":"riskSignals","label":"Risk Signals","path":"/risk-signals","icon_url":"icons/nav/risk-signals.svg"},{"key":"dataSources","label":"Data Sources","path":"/data-sources","icon_url":"icons/nav/data-sources.svg"}]'),
  ('penfed_derek',  'penfed', 'Derek T',   'DT', 'Member Retention',       'Derek',  FALSE, '[{"key":"ask","label":"Ask the AI","path":"/ask","icon_url":"icons/nav/ask.svg"},{"key":"memberJourney","label":"Member Journey","path":"/member-journey","icon_url":"icons/nav/member-journey.svg"},{"key":"riskSignals","label":"Risk Signals","path":"/risk-signals","icon_url":"icons/nav/risk-signals.svg"},{"key":"dataSources","label":"Data Sources","path":"/data-sources","icon_url":"icons/nav/data-sources.svg"}]'),
  ('penfed_james',  'penfed', 'James R',   'JR', 'Risk & Fraud',           'James',  FALSE, '[{"key":"ask","label":"Ask the AI","path":"/ask","icon_url":"icons/nav/ask.svg"},{"key":"memberJourney","label":"Member Journey","path":"/member-journey","icon_url":"icons/nav/member-journey.svg"},{"key":"riskSignals","label":"Risk Signals","path":"/risk-signals","icon_url":"icons/nav/risk-signals.svg"},{"key":"dataSources","label":"Data Sources","path":"/data-sources","icon_url":"icons/nav/data-sources.svg"}]'),
  ('penfed_sowmya', 'penfed', 'Sowmya Ha', 'SH', 'Capital Markets Risk',   'Sowmya', FALSE, '[{"key":"ask","label":"Ask the AI","path":"/ask","icon_url":"icons/nav/ask.svg"},{"key":"memberJourney","label":"Member Journey","path":"/member-journey","icon_url":"icons/nav/member-journey.svg"},{"key":"riskSignals","label":"Risk Signals","path":"/risk-signals","icon_url":"icons/nav/risk-signals.svg"},{"key":"dataSources","label":"Data Sources","path":"/data-sources","icon_url":"icons/nav/data-sources.svg"}]')
ON CONFLICT (id) DO NOTHING;
