-- Spark, Kafka y Flink publican tags en GitHub, no Releases: /releases devuelve []
-- y la fuente figuraba en verde para siempre con 0 filas. El catálogo ahora lo
-- declara (github_releases: false) y el sitio puede decirlo en vez de mostrar
-- un historial vacío sin explicación.
--
-- Atributo de operación, no de negocio: se actualiza en la fila vigente sin abrir
-- una versión nueva de la dimensión (SCD Tipo 1). Si fuera rastreado, agregar la
-- columna partiría las 10 herramientas en dos versiones sin que nada de negocio
-- haya cambiado.
ALTER TABLE dim_tool ADD COLUMN IF NOT EXISTS github_releases BOOLEAN NOT NULL DEFAULT TRUE;
