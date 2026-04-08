-- AgentBazaar PostgreSQL Schema
-- Version: 1.0.0
-- Run: psql $DATABASE_URL < database/schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search

-- ------------------------------------------------------------------ services
CREATE TABLE IF NOT EXISTS services (
  id                TEXT        PRIMARY KEY,
  name              TEXT        NOT NULL,
  category          TEXT        NOT NULL,
  description       TEXT        NOT NULL DEFAULT '',
  provider_address  TEXT        NOT NULL,
  endpoint          TEXT        NOT NULL,
  pricing_model     TEXT        NOT NULL DEFAULT 'fixed',
  price_amount      TEXT        NOT NULL DEFAULT '0',
  price_token       TEXT        NOT NULL DEFAULT 'EGLD',
  max_latency_ms    INTEGER     NOT NULL DEFAULT 1000,
  uptime_guarantee  NUMERIC(5,2) NOT NULL DEFAULT 99.0,
  reputation_score  INTEGER     NOT NULL DEFAULT 0,
  total_tasks       INTEGER     NOT NULL DEFAULT 0,
  ucp_compatible    BOOLEAN     NOT NULL DEFAULT TRUE,
  mcp_compatible    BOOLEAN     NOT NULL DEFAULT TRUE,
  tags              TEXT[]      NOT NULL DEFAULT '{}',
  active            BOOLEAN     NOT NULL DEFAULT TRUE,
  stake_amount      TEXT        NOT NULL DEFAULT '0',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_category        ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_provider        ON services(provider_address);
CREATE INDEX IF NOT EXISTS idx_services_active          ON services(active);
CREATE INDEX IF NOT EXISTS idx_services_reputation      ON services(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_services_name_trgm       ON services USING GIN(name gin_trgm_ops);

-- ------------------------------------------------------------------ tasks
CREATE TABLE IF NOT EXISTS tasks (
  id                TEXT        PRIMARY KEY,
  service_id        TEXT        NOT NULL REFERENCES services(id) ON DELETE SET NULL,
  consumer_id       TEXT        NOT NULL,
  provider_address  TEXT        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','running','completed','failed','disputed','refunded')),
  max_budget        TEXT        NOT NULL DEFAULT '0',
  payload_hash      TEXT,
  proof_hash        TEXT,
  escrow_tx_hash    TEXT,
  release_tx_hash   TEXT,
  latency_ms        INTEGER,
  error_message     TEXT,
  deadline          TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '5 minutes',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status             ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_consumer           ON tasks(consumer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_provider           ON tasks(provider_address);
CREATE INDEX IF NOT EXISTS idx_tasks_service            ON tasks(service_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at         ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline           ON tasks(deadline) WHERE status IN ('pending','running');

-- ------------------------------------------------------------------ reputation_snapshots
CREATE TABLE IF NOT EXISTS reputation_snapshots (
  id                BIGSERIAL   PRIMARY KEY,
  agent_address     TEXT        NOT NULL,
  composite_score   INTEGER     NOT NULL DEFAULT 0,
  completion_rate   NUMERIC(5,4) NOT NULL DEFAULT 0,
  total_tasks       INTEGER     NOT NULL DEFAULT 0,
  successful_tasks  INTEGER     NOT NULL DEFAULT 0,
  avg_latency_ms    INTEGER,
  slashed           BOOLEAN     NOT NULL DEFAULT FALSE,
  slash_count       INTEGER     NOT NULL DEFAULT 0,
  stake_amount      TEXT        NOT NULL DEFAULT '0',
  snapshot_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rep_agent                ON reputation_snapshots(agent_address);
CREATE INDEX IF NOT EXISTS idx_rep_score                ON reputation_snapshots(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_rep_snapshot_at          ON reputation_snapshots(snapshot_at DESC);

-- Latest reputation view
CREATE OR REPLACE VIEW reputation_latest AS
  SELECT DISTINCT ON (agent_address) *
  FROM reputation_snapshots
  ORDER BY agent_address, snapshot_at DESC;

-- ------------------------------------------------------------------ events
CREATE TABLE IF NOT EXISTS events (
  id                BIGSERIAL   PRIMARY KEY,
  type              TEXT        NOT NULL,
  tx_hash           TEXT,
  task_id           TEXT,
  service_id        TEXT,
  agent_address     TEXT,
  block_nonce       BIGINT,
  raw_data          JSONB,
  processed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_type              ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_tx_hash           ON events(tx_hash);
CREATE INDEX IF NOT EXISTS idx_events_task_id           ON events(task_id);
CREATE INDEX IF NOT EXISTS idx_events_processed_at      ON events(processed_at DESC);

-- ------------------------------------------------------------------ disputes
CREATE TABLE IF NOT EXISTS disputes (
  id                BIGSERIAL   PRIMARY KEY,
  task_id           TEXT        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  opened_by         TEXT        NOT NULL,
  reason            TEXT        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'open'
                                CHECK (status IN ('open','resolved_consumer','resolved_provider','dismissed')),
  arbitration_tx    TEXT,
  resolved_by       TEXT,
  opened_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_disputes_task_id         ON disputes(task_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status          ON disputes(status);

-- ------------------------------------------------------------------ analytics_daily (materialized)
CREATE TABLE IF NOT EXISTS analytics_daily (
  date              DATE        PRIMARY KEY,
  total_tasks       INTEGER     NOT NULL DEFAULT 0,
  completed_tasks   INTEGER     NOT NULL DEFAULT 0,
  failed_tasks      INTEGER     NOT NULL DEFAULT 0,
  disputed_tasks    INTEGER     NOT NULL DEFAULT 0,
  total_volume_wei  TEXT        NOT NULL DEFAULT '0',
  avg_latency_ms    INTEGER,
  new_services      INTEGER     NOT NULL DEFAULT 0,
  active_providers  INTEGER     NOT NULL DEFAULT 0,
  computed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------ triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_services_updated ON services;
CREATE TRIGGER trg_services_updated
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated ON tasks;
CREATE TRIGGER trg_tasks_updated
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
