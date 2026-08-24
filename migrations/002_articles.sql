CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_tool_slug_kind_key;
CREATE UNIQUE INDEX IF NOT EXISTS sources_tool_slug_kind_url_idx
    ON sources (tool_slug, kind, url);

CREATE TABLE IF NOT EXISTS articles (
    id               BIGSERIAL PRIMARY KEY,
    feed_source_id   BIGINT      NOT NULL REFERENCES sources(id),
    url              TEXT        NOT NULL,
    url_normalized   TEXT        NOT NULL,
    title            TEXT        NOT NULL,
    author           TEXT,
    published_at     TIMESTAMPTZ NOT NULL,
    summary_text     TEXT        NOT NULL,   -- texto crudo del feed (título+resumen/contenido), documento de anclaje
    content_hash     TEXT        NOT NULL,
    relevance_score  REAL        NOT NULL,
    ingested_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (url_normalized)
);

CREATE INDEX IF NOT EXISTS articles_content_trgm_idx
    ON articles USING gin (summary_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS articles_published_idx ON articles (published_at DESC);

CREATE TABLE IF NOT EXISTS fct_article_mention (
    id          BIGSERIAL PRIMARY KEY,
    article_id  BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tool_slug   TEXT   NOT NULL,
    UNIQUE (article_id, tool_slug)
);

-- Solo resúmenes ya anclados: lo que falla validación no entra acá, va a `quarantine`.
CREATE TABLE IF NOT EXISTS summaries (
    id           BIGSERIAL PRIMARY KEY,
    article_id   BIGINT      NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    idioma       TEXT        NOT NULL,  -- 'en' | 'es'
    text         TEXT        NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (article_id, idioma)
);

-- Solo citas ya ancladas: span_start/span_end los calcula el pipeline, nunca el LLM.
CREATE TABLE IF NOT EXISTS claims (
    id          BIGSERIAL PRIMARY KEY,
    summary_id  BIGINT  NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
    quoted_text TEXT    NOT NULL,
    span_start  INTEGER NOT NULL,
    span_end    INTEGER NOT NULL
);

-- Medición de veracidad de la paráfrasis (decisión 12), independiente de la
-- aceptación del claim: el anclaje ya lo aceptó, esto solo mide error rate.
CREATE TABLE IF NOT EXISTS entailment_checks (
    id          BIGSERIAL PRIMARY KEY,
    claim_id    BIGINT  NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    is_entailed BOOLEAN NOT NULL,
    checked_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
