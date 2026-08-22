CREATE TABLE IF NOT EXISTS dim_tool (
    tool_key        BIGSERIAL PRIMARY KEY,
    slug            TEXT        NOT NULL,
    name            TEXT        NOT NULL,
    category        TEXT        NOT NULL,
    vendor          TEXT,
    repo            TEXT,
    homepage        TEXT,
    effective_from  TIMESTAMPTZ NOT NULL,
    effective_to    TIMESTAMPTZ,
    is_current      BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS dim_tool_current_slug_idx
    ON dim_tool (slug) WHERE is_current;

CREATE TABLE IF NOT EXISTS sources (
    id                   BIGSERIAL PRIMARY KEY,
    tool_slug            TEXT        NOT NULL,
    kind                 TEXT        NOT NULL,
    url                  TEXT        NOT NULL,
    last_success_at      TIMESTAMPTZ,
    consecutive_failures INTEGER     NOT NULL DEFAULT 0,
    is_degraded          BOOLEAN     NOT NULL DEFAULT FALSE,
    UNIQUE (tool_slug, kind)
);

-- Particionada por content_hash, no por fecha: el free tier de Neon da 0.5 GB
-- y una fila diaria por herramienta lo llena en meses. La mayoría de los días
-- el payload es idéntico al anterior, así que solo guardamos versiones distintas.
CREATE TABLE IF NOT EXISTS raw_fetches (
    id            BIGSERIAL PRIMARY KEY,
    source_id     BIGINT      NOT NULL REFERENCES sources(id),
    content_hash  TEXT        NOT NULL,
    first_seen_ds DATE        NOT NULL,
    last_seen_ds  DATE        NOT NULL,
    fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    payload       TEXT        NOT NULL,
    UNIQUE (source_id, content_hash)
);

CREATE TABLE IF NOT EXISTS fct_release (
    id           BIGSERIAL PRIMARY KEY,
    tool_slug    TEXT        NOT NULL,
    version      TEXT        NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    source_url   TEXT        NOT NULL,
    has_breaking BOOLEAN     NOT NULL DEFAULT FALSE,
    body         TEXT        NOT NULL,
    ingested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tool_slug, version)
);

CREATE TABLE IF NOT EXISTS release_changes (
    id         BIGSERIAL PRIMARY KEY,
    release_id BIGINT NOT NULL REFERENCES fct_release(id) ON DELETE CASCADE,
    kind       TEXT   NOT NULL,
    text       TEXT   NOT NULL,
    UNIQUE (release_id, kind, text)
);

CREATE TABLE IF NOT EXISTS quarantine (
    id          BIGSERIAL PRIMARY KEY,
    source_ref  TEXT        NOT NULL,
    stage       TEXT        NOT NULL,
    error       TEXT        NOT NULL,
    payload     TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fct_release_published_idx ON fct_release (published_at DESC);
