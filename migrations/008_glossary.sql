-- Fase 1 de Glosario: nombres de nivel como dato (antes triplicados en el
-- frontend) y el glosario granular curado. Sin SCD2 a propósito, mismo
-- criterio que roadmap_node: git ya guarda el historial de ediciones.

CREATE TABLE IF NOT EXISTS roadmap_level (
    nivel  INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS glossary_term (
    slug             TEXT PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    termino          TEXT NOT NULL,
    definicion       TEXT NOT NULL,
    nivel            INTEGER NOT NULL REFERENCES roadmap_level(nivel),
    nodo_relacionado TEXT REFERENCES roadmap_node(slug) ON DELETE SET NULL,
    uso_texto        TEXT,
    uso_link         TEXT,
    -- Un link sin texto que lo explique es una referencia muda.
    CHECK (uso_link IS NULL OR uso_texto IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS glossary_source (
    term_slug TEXT NOT NULL REFERENCES glossary_term(slug) ON DELETE CASCADE,
    url       TEXT NOT NULL,
    por_que   TEXT NOT NULL,
    UNIQUE (term_slug, url)
);

CREATE INDEX IF NOT EXISTS glossary_source_term_idx ON glossary_source (term_slug);
