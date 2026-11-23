-- Group 3: Products (2 tables)
-- loan_products, share_products

CREATE TABLE IF NOT EXISTS loan_products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    product_category TEXT NOT NULL CHECK (product_category IN ('MORTGAGE','AUTO','PERSONAL','HELOC','CREDIT_CARD','BUSINESS')),
    is_mla_covered BOOLEAN NOT NULL DEFAULT FALSE,
    is_hmda_reportable BOOLEAN NOT NULL DEFAULT FALSE,
    is_cra_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    rate_index TEXT,
    rate_spread NUMERIC(6,4),
    min_term_months INT,
    max_term_months INT,
    min_amount NUMERIC(15,2),
    max_amount NUMERIC(15,2),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_loan_products_category ON loan_products(product_category);
CREATE INDEX idx_loan_products_active ON loan_products(active);

CREATE TABLE IF NOT EXISTS share_products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    product_category TEXT NOT NULL CHECK (product_category IN ('CHECKING','SAVINGS','MONEY_MARKET','CERTIFICATE','IRA')),
    dividend_rate NUMERIC(6,4),
    apy NUMERIC(6,4),
    min_balance NUMERIC(15,2),
    is_insured BOOLEAN NOT NULL DEFAULT TRUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_share_products_category ON share_products(product_category);
CREATE INDEX idx_share_products_active ON share_products(active);
