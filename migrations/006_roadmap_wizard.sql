-- Opciones cerradas del wizard de Rumbo (Fase 2). Una sola tabla para las dos
-- preguntas porque el grano es el mismo: "una opción que el usuario elige y
-- que nombra un conjunto de nodos". La clausura de prerequisitos se calcula
-- al leer; acá solo va lo declarado en el YAML.

CREATE TABLE IF NOT EXISTS roadmap_wizard_option (
    kind        TEXT NOT NULL CHECK (kind IN ('objetivo', 'partida')),
    -- Es un segmento de URL (/ruta/<objetivo>/<partida>): se valida acá para
    -- que un slug con espacio o mayúscula falle al cargar y no como 404 mudo.
    slug        TEXT NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    nombre      TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    orden       INTEGER NOT NULL,
    PRIMARY KEY (kind, slug)
);

-- Metas de un objetivo, o nodos conocidos de un punto de partida.
CREATE TABLE IF NOT EXISTS roadmap_wizard_option_node (
    kind      TEXT NOT NULL,
    slug      TEXT NOT NULL,
    node_slug TEXT NOT NULL REFERENCES roadmap_node(slug) ON DELETE CASCADE,
    PRIMARY KEY (kind, slug, node_slug),
    FOREIGN KEY (kind, slug) REFERENCES roadmap_wizard_option(kind, slug) ON DELETE CASCADE
);
