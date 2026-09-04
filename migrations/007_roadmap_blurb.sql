-- Fase 4 de Rumbo: el párrafo "por qué este orden" de cada ruta personalizada.
-- Lo escribe pipeline/blurbs.py una vez por (objetivo, partida) y por versión
-- del grafo: ruta_hash es el hash de todo lo que el párrafo puede mencionar.
-- Sin FK a roadmap_wizard_option (su PK es (kind, slug)): blurbs.generar()
-- borra las combinaciones que dejaron de existir.
CREATE TABLE IF NOT EXISTS roadmap_route_blurb (
    objetivo     TEXT NOT NULL,
    partida      TEXT NOT NULL,
    ruta_hash    TEXT NOT NULL,
    texto        TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (objetivo, partida)
);
