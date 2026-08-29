-- Grafo de la ruta de aprendizaje (Rumbo). Separado del catálogo de ingesta:
-- un nodo de la ruta no necesita feed, y una herramienta ingerida no
-- necesariamente es nodo de primer nivel. Sin SCD2 a propósito: cuando se
-- corrige una arista, la versión vieja estaba mal y git ya guarda el historial.

CREATE TABLE IF NOT EXISTS roadmap_node (
    slug             TEXT PRIMARY KEY,
    tipo             TEXT NOT NULL CHECK (tipo IN ('concepto', 'herramienta', 'capacidad-cloud')),
    nombre           TEXT NOT NULL,
    resuelve         TEXT NOT NULL,
    dominado_cuando  TEXT NOT NULL,
    nivel            INTEGER NOT NULL,
    orden_sugerido   INTEGER NOT NULL DEFAULT 0
);

-- from_slug es prerequisito de to_slug.
CREATE TABLE IF NOT EXISTS roadmap_edge (
    from_slug TEXT NOT NULL REFERENCES roadmap_node(slug) ON DELETE CASCADE,
    to_slug   TEXT NOT NULL REFERENCES roadmap_node(slug) ON DELETE CASCADE,
    UNIQUE (from_slug, to_slug),
    CHECK (from_slug <> to_slug)
);

-- Un nodo tiene a lo sumo una experiencia propia. Su ausencia es lo que
-- dispara el marcador visible de "todavía no lo practiqué".
CREATE TABLE IF NOT EXISTS roadmap_experience (
    node_slug TEXT PRIMARY KEY REFERENCES roadmap_node(slug) ON DELETE CASCADE,
    texto     TEXT NOT NULL,
    link      TEXT
);

CREATE TABLE IF NOT EXISTS roadmap_source (
    node_slug TEXT NOT NULL REFERENCES roadmap_node(slug) ON DELETE CASCADE,
    url       TEXT NOT NULL,
    por_que   TEXT NOT NULL,
    UNIQUE (node_slug, url)
);

-- Una forma de practicar un nodo: una herramienta del catálogo o un servicio
-- cloud. Misma tabla porque el grano es el mismo; separarlas obligaría a dos
-- joins para la misma pregunta.
CREATE TABLE IF NOT EXISTS roadmap_implementation (
    node_slug    TEXT NOT NULL REFERENCES roadmap_node(slug) ON DELETE CASCADE,
    nombre       TEXT NOT NULL,
    tool_slug    TEXT,
    proveedor    TEXT CHECK (proveedor IN ('aws', 'gcp', 'azure', 'portable')),
    equivalencia TEXT CHECK (equivalencia IN ('alta', 'media', 'baja')),
    nota         TEXT,
    UNIQUE (node_slug, nombre),
    -- Una equivalencia media o baja sin explicación es exactamente la tabla
    -- de tres columnas que miente (decisión 2).
    CHECK (equivalencia IN ('alta') OR equivalencia IS NULL OR nota IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS roadmap_edge_to_idx ON roadmap_edge (to_slug);
CREATE INDEX IF NOT EXISTS roadmap_impl_node_idx ON roadmap_implementation (node_slug);
