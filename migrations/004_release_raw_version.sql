-- version guarda el semver normalizado (clave de dedup con tool_slug); tags
-- que no son semver (Trino: "483") se rellenan a "483.0.0", que es correcto
-- para deduplicar pero falso para mostrar. raw_version guarda el tag_name
-- tal cual llegó, para mostrar.
ALTER TABLE fct_release ADD COLUMN IF NOT EXISTS raw_version TEXT;

-- Backfill: el tag_name original de releases ya ingeridos no se guardó en
-- ningún lado, así que no es recuperable. Usar la versión normalizada como
-- mejor aproximación para filas viejas; releases nuevos guardan el tag real.
UPDATE fct_release SET raw_version = version WHERE raw_version IS NULL;

ALTER TABLE fct_release ALTER COLUMN raw_version SET NOT NULL;
