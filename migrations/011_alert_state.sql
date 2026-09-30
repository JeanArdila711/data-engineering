-- Estado de las alertas que no cuelgan de una fila propia (a diferencia de
-- sources.alerted_at o tool_candidates.status). Crear un issue no es
-- idempotente, así que hay que recordar que ya se avisó; la clave permite que
-- cada alerta tenga su propio período sin una tabla por alerta.
CREATE TABLE IF NOT EXISTS alert_state (
    alert_key  TEXT        PRIMARY KEY,
    alerted_at TIMESTAMPTZ NOT NULL
);
