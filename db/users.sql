-- =============================================================
-- Table: Users
-- =============================================================

CREATE TABLE IF NOT EXISTS Users (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(100)  NOT NULL UNIQUE,
  email         VARCHAR(255)  UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  client_id     VARCHAR(50),
  persona_id    VARCHAR(50),
  market_id     VARCHAR(50),
  role          VARCHAR(20)   NOT NULL CHECK (role IN ('platform', 'client')),
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- =============================================================
-- Seed Data
-- Passwords (plain text, hashed below with bcrypt cost=12):
--   ultra@9705   → ultra
--   ussfcu@9705  → fiona, evelyn, timothy, sylvia, nadia
--   penfed@9705  → maya, priya, derek, james, sowmya
-- =============================================================

INSERT INTO Users (username, email, password_hash, client_id, persona_id, market_id, role) VALUES

  -- Platform
  ('ultra',   NULL, '$2b$12$VlV2H2jKw8oFf1Q4jogOSObwS0JnF92qkxFb.YPeIjlzKp0Run3Gy', NULL,     NULL,      NULL,      'platform'),

  -- USSFCU
  ('fiona',   NULL, '$2b$12$5DVUpmCU1n1K.783VIJ9A.ufrmo0L5Bmh0NNEEo3WjPZSXKEII98e', 'ussfcu', 'fiona',   'finance', 'client'),
  ('evelyn',  NULL, '$2b$12$5DVUpmCU1n1K.783VIJ9A.ufrmo0L5Bmh0NNEEo3WjPZSXKEII98e', 'ussfcu', 'evelyn',  'finance', 'client'),
  ('timothy', NULL, '$2b$12$5DVUpmCU1n1K.783VIJ9A.ufrmo0L5Bmh0NNEEo3WjPZSXKEII98e', 'ussfcu', 'timothy', 'finance', 'client'),
  ('sylvia',  NULL, '$2b$12$5DVUpmCU1n1K.783VIJ9A.ufrmo0L5Bmh0NNEEo3WjPZSXKEII98e', 'ussfcu', 'sylvia',  'finance', 'client'),
  ('nadia',   NULL, '$2b$12$5DVUpmCU1n1K.783VIJ9A.ufrmo0L5Bmh0NNEEo3WjPZSXKEII98e', 'ussfcu', 'nadia',   'finance', 'client'),

  -- PenFed
  ('maya',    NULL, '$2b$12$eDB8fCo.fNU.Qzj8ZBAtwOFAoZjj54srdf8Fo6F9N/7FYVCxQhNUW', 'penfed', 'maya',    'finance', 'client'),
  ('priya',   NULL, '$2b$12$eDB8fCo.fNU.Qzj8ZBAtwOFAoZjj54srdf8Fo6F9N/7FYVCxQhNUW', 'penfed', 'priya',   'finance', 'client'),
  ('derek',   NULL, '$2b$12$eDB8fCo.fNU.Qzj8ZBAtwOFAoZjj54srdf8Fo6F9N/7FYVCxQhNUW', 'penfed', 'derek',   'finance', 'client'),
  ('james',   NULL, '$2b$12$eDB8fCo.fNU.Qzj8ZBAtwOFAoZjj54srdf8Fo6F9N/7FYVCxQhNUW', 'penfed', 'james',   'finance', 'client'),
  ('sowmya',  NULL, '$2b$12$eDB8fCo.fNU.Qzj8ZBAtwOFAoZjj54srdf8Fo6F9N/7FYVCxQhNUW', 'penfed', 'sowmya',  'finance', 'client')

ON CONFLICT (username) DO NOTHING;
