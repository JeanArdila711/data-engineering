-- Fase 2 de Glosario: minería de candidatos a término, mismo mecanismo y
-- misma tabla-gemela que tool_candidates/tool_candidate_mentions (decisión
-- 20 de DE Radar). El glosario nunca se modifica solo — esto solo registra
-- menciones y deja que send_glossary_candidate_alerts abra un issue.

CREATE TABLE IF NOT EXISTS glossary_candidates (
    id              BIGSERIAL PRIMARY KEY,
    normalized_term TEXT        NOT NULL UNIQUE,
    display_term    TEXT        NOT NULL,
    first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    status          TEXT        NOT NULL DEFAULT 'pending',
    CONSTRAINT glossary_candidates_status_check
        CHECK (status IN ('pending', 'proposed', 'dismissed'))
);

-- Grano: una mención de un término candidato en un artículo. El UNIQUE es lo
-- que hace idempotente reprocesar el mismo artículo — nunca un contador que
-- se incrementa (misma lección de tool_candidate_mentions).
CREATE TABLE IF NOT EXISTS glossary_candidate_mentions (
    id           BIGSERIAL PRIMARY KEY,
    candidate_id BIGINT NOT NULL REFERENCES glossary_candidates(id) ON DELETE CASCADE,
    article_url  TEXT   NOT NULL,
    UNIQUE (candidate_id, article_url)
);
