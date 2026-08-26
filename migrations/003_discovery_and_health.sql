ALTER TABLE sources ADD COLUMN IF NOT EXISTS alerted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS tool_candidates (
    id               BIGSERIAL PRIMARY KEY,
    normalized_name  TEXT        NOT NULL UNIQUE,
    display_name     TEXT        NOT NULL,
    first_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    status           TEXT        NOT NULL DEFAULT 'pending',
    CONSTRAINT tool_candidates_status_check
        CHECK (status IN ('pending', 'proposed', 'dismissed'))
);

-- Grano: una mención de un candidato en un artículo. UNIQUE es lo que hace
-- idempotente re-procesar el mismo artículo (mismo criterio que fct_article_mention).
CREATE TABLE IF NOT EXISTS tool_candidate_mentions (
    id           BIGSERIAL PRIMARY KEY,
    candidate_id BIGINT NOT NULL REFERENCES tool_candidates(id) ON DELETE CASCADE,
    article_url  TEXT   NOT NULL,
    UNIQUE (candidate_id, article_url)
);
