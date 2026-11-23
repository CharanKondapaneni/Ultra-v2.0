-- Group 7: Complaints & Interactions (3 tables)
-- member_interactions, complaints, trigger_word_snapshot

CREATE TABLE IF NOT EXISTS member_interactions (
    interaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(member_id),
    interaction_date TIMESTAMPTZ NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('BRANCH','PHONE','CHAT','EMAIL','WEB','MOBILE')),
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('INQUIRY','COMPLAINT','TRANSACTION','ESCALATION')),
    department TEXT,
    staff_id UUID REFERENCES staff(staff_id),
    duration_seconds INT,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolution_date TIMESTAMPTZ,
    satisfaction_score INT CHECK (satisfaction_score BETWEEN 1 AND 5),
    nps_response INT CHECK (nps_response BETWEEN -100 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_interactions_member ON member_interactions(member_id);
CREATE INDEX idx_interactions_date ON member_interactions(interaction_date);
CREATE INDEX idx_interactions_channel ON member_interactions(channel);
CREATE INDEX idx_interactions_type ON member_interactions(interaction_type);

CREATE TABLE IF NOT EXISTS complaints (
    complaint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(member_id),
    interaction_id UUID REFERENCES member_interactions(interaction_id),
    received_date DATE NOT NULL,
    complaint_category TEXT NOT NULL CHECK (complaint_category IN ('FAIR_LENDING','BILLING','SERVICING','DISCLOSURE','BSA','OTHER')),
    product_id UUID REFERENCES loan_products(product_id),
    share_product_id UUID REFERENCES share_products(product_id),
    description TEXT,
    trigger_words_flagged TEXT[],
    status TEXT NOT NULL CHECK (status IN ('OPEN','INVESTIGATING','RESOLVED','ESCALATED','REGULATORY_REFERRAL')),
    assigned_to UUID REFERENCES staff(staff_id),
    resolution_date DATE,
    resolution_detail TEXT,
    regulatory_reported BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_complaints_member ON complaints(member_id);
CREATE INDEX idx_complaints_date ON complaints(received_date);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(complaint_category);

CREATE TABLE IF NOT EXISTS trigger_word_snapshot (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    channel TEXT NOT NULL,
    trigger_word TEXT NOT NULL,
    trigger_category TEXT NOT NULL CHECK (trigger_category IN ('DISCRIMINATION','DECEPTION','COERCION','UDAP')),
    occurrence_count INT NOT NULL DEFAULT 0,
    complaint_count INT NOT NULL DEFAULT 0,
    escalation_count INT NOT NULL DEFAULT 0,
    review_status TEXT CHECK (review_status IN ('PENDING','REVIEWED','ESCALATED','CLOSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_trigger_date ON trigger_word_snapshot(snapshot_date);
CREATE INDEX idx_trigger_category ON trigger_word_snapshot(trigger_category);
CREATE INDEX idx_trigger_word ON trigger_word_snapshot(trigger_word);
