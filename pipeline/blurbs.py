"""El párrafo "por qué este orden" de cada ruta personalizada (Fase 4 de Rumbo).

Lo genera el pipeline, no la web: el espacio de rutas es finito (objetivos ×
partidas) y el grafo cambia poco. Una fila existe si y solo si su hash coincide
con la ruta actual — si el LLM falla o el párrafo no ancla, la fila vieja se
borra, porque describe una ruta que ya no existe. Mañana se reintenta.

El modelo redacta sobre hechos ya decididos (la ruta, en orden) y nunca decide:
validar_anclaje rechaza cualquier párrafo que nombre un nodo ajeno a la ruta.
"""

import hashlib
import json
import logging
import re
import unicodedata
from collections import Counter
from typing import Iterable

import psycopg

from pipeline.db import quarantine
from pipeline.roadmap import Objetivo, PuntoDePartida, Roadmap, RoadmapNode, derivar_ruta

logger = logging.getLogger("de_radar.blurbs")

# Cambiar el prompt tiene que regenerar los párrafos: forma parte del hash.
PROMPT_VERSION = 1
MAX_CARACTERES = 700


def hash_ruta(
    ruta: list[RoadmapNode], sabidos: list[RoadmapNode], objetivo: Objetivo, partida: PuntoDePartida
) -> str:
    """sha256 del JSON canónico de todo lo que el párrafo puede mencionar."""
    payload = {
        "prompt": PROMPT_VERSION,
        "objetivo": [objetivo.nombre, objetivo.descripcion],
        "partida": partida.nombre,
        "ruta": [[n.slug, n.nombre, n.resuelve] for n in ruta],
        "sabidos": [n.nombre for n in sabidos],
    }
    canonico = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(canonico.encode()).hexdigest()


def _normalizar(texto: str) -> str:
    return unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode().lower()


def validar_anclaje(texto: str, permitidos: Iterable[str], todos: Iterable[str]) -> str | None:
    """None si el texto solo nombra nodos permitidos; si no, el primer nombre ajeno
    que aparece. Sin mayúsculas ni acentos, con borde de palabra."""
    plano = _normalizar(texto)
    ok = {_normalizar(n) for n in permitidos}
    for nombre in todos:
        n = _normalizar(nombre)
        if n in ok:
            continue
        if re.search(rf"(?<![a-z0-9]){re.escape(n)}(?![a-z0-9])", plano):
            return nombre
    return None


def _guardar(cur: psycopg.Cursor, objetivo: str, partida: str, ruta_hash: str, texto: str) -> None:
    cur.execute(
        "INSERT INTO roadmap_route_blurb (objetivo, partida, ruta_hash, texto, generated_at) "
        "VALUES (%s, %s, %s, %s, now()) "
        "ON CONFLICT (objetivo, partida) DO UPDATE SET "
        "ruta_hash = EXCLUDED.ruta_hash, texto = EXCLUDED.texto, generated_at = EXCLUDED.generated_at",
        (objetivo, partida, ruta_hash, texto),
    )


def _borrar(cur: psycopg.Cursor, objetivo: str, partida: str) -> None:
    cur.execute("DELETE FROM roadmap_route_blurb WHERE objetivo = %s AND partida = %s", (objetivo, partida))


def generar(conn: psycopg.Connection, roadmap: Roadmap, llm) -> dict[str, int]:
    """Para cada (objetivo, partida): deriva, hashea, compara con la fila existente;
    llama al LLM solo si el hash cambió; valida; escribe o borra. Borra también las
    combinaciones que ya no existen. Nunca levanta por una combinación: el fallo
    se cuenta y se sigue con la siguiente."""
    stats: Counter[str] = Counter(generados=0, reutilizados=0, rechazados=0, fallidos=0)
    todos_los_nombres = [n.nombre for n in roadmap.nodes]

    with conn.cursor() as cur:
        cur.execute("SELECT objetivo, partida, ruta_hash, texto FROM roadmap_route_blurb")
        existentes = {(o, p): (h, t) for o, p, h, t in cur.fetchall()}
        vigentes: set[tuple[str, str]] = set()

        for objetivo in roadmap.objetivos:
            for partida in roadmap.puntos_de_partida:
                clave = (objetivo.slug, partida.slug)
                vigentes.add(clave)
                ruta, sabidos = derivar_ruta(roadmap, objetivo, partida)
                if not ruta:
                    # Con lo que sabe, no hay nada pendiente: no hay orden que explicar.
                    _borrar(cur, *clave)
                    continue

                ruta_hash = hash_ruta(ruta, sabidos, objetivo, partida)
                vieja = existentes.get(clave)
                if vieja and vieja[0] == ruta_hash:
                    permitidos = [n.nombre for n in ruta + sabidos]
                    if validar_anclaje(vieja[1], permitidos, todos_los_nombres) is None:
                        stats["reutilizados"] += 1
                        continue
                    # El grafo cambió en otro lado y el párrafo publicado ya no
                    # ancla contra el conjunto de nombres actual: regenerar en
                    # vez de reutilizar, aunque el hash de la ruta no cambió.

                try:
                    texto = llm.draft_route_blurb(
                        objetivo=objetivo.nombre,
                        descripcion=objetivo.descripcion.strip(),
                        partida=partida.nombre,
                        nodos=[(n.nombre, n.resuelve) for n in ruta],
                        sabidos=[n.nombre for n in sabidos],
                    )
                except Exception:
                    logger.exception("no se pudo generar el párrafo de %s/%s", *clave)
                    stats["fallidos"] += 1
                    _borrar(cur, *clave)
                    continue

                texto = texto.strip()
                motivo = None
                if not texto:
                    motivo = "párrafo vacío"
                elif len(texto) > MAX_CARACTERES:
                    motivo = f"párrafo de {len(texto)} caracteres (máximo {MAX_CARACTERES})"
                else:
                    ajeno = validar_anclaje(texto, [n.nombre for n in ruta + sabidos], todos_los_nombres)
                    if ajeno:
                        motivo = f"menciona '{ajeno}', que no está en la ruta"

                if motivo:
                    quarantine(conn, f"blurb:{objetivo.slug}/{partida.slug}", "anclaje", motivo, texto)
                    logger.warning("párrafo rechazado %s/%s: %s", *clave, motivo)
                    stats["rechazados"] += 1
                    _borrar(cur, *clave)
                    continue

                _guardar(cur, *clave, ruta_hash, texto)
                stats["generados"] += 1

        for clave in set(existentes) - vigentes:
            _borrar(cur, *clave)

    return dict(stats)
