-- Fase 1 de Guía de Práctica (/practica). Dos mecanismos según el tipo de
-- habilidad: un directorio curado de recursos externos por nodo, y un reto
-- de punta a punta por objetivo del wizard. Ninguno de los dos historiza —
-- mismo criterio que roadmap_source/roadmap_wizard_option: cuando el YAML
-- cambia, la versión vieja estaba mal y git ya guarda el historial.

CREATE TABLE IF NOT EXISTS roadmap_practice_resource (
    node_slug TEXT NOT NULL REFERENCES roadmap_node(slug) ON DELETE CASCADE,
    nombre    TEXT NOT NULL,
    url       TEXT NOT NULL,
    por_que   TEXT NOT NULL,
    UNIQUE (node_slug, url)
);

-- Un reto por objetivo del wizard, tenga reto o no: el CHECK hace que el
-- estado inválido (ni escenario ni motivo, o los dos) sea imposible por
-- constraint, no por disciplina del código que llama (misma lección que la
-- decisión 20 de DE Radar sobre tool_candidate_mentions).
CREATE TABLE IF NOT EXISTS roadmap_challenge (
    objetivo_slug   TEXT PRIMARY KEY,
    kind            TEXT NOT NULL DEFAULT 'objetivo' CHECK (kind = 'objetivo'),
    escenario       TEXT,
    motivo_ausencia TEXT,
    CHECK ((escenario IS NULL) <> (motivo_ausencia IS NULL)),
    FOREIGN KEY (kind, objetivo_slug)
        REFERENCES roadmap_wizard_option(kind, slug) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS roadmap_challenge_check (
    objetivo_slug TEXT NOT NULL REFERENCES roadmap_challenge(objetivo_slug) ON DELETE CASCADE,
    node_slug     TEXT NOT NULL REFERENCES roadmap_node(slug) ON DELETE CASCADE,
    orden         INTEGER NOT NULL,
    PRIMARY KEY (objetivo_slug, node_slug)
);

CREATE INDEX IF NOT EXISTS roadmap_practice_resource_node_idx ON roadmap_practice_resource (node_slug);
CREATE INDEX IF NOT EXISTS roadmap_challenge_check_node_idx ON roadmap_challenge_check (node_slug);
