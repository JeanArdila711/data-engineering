"""El párrafo se publica solo si está anclado a la ruta, y se genera solo si la ruta cambió."""

from pipeline.blurbs import generar, hash_ruta, validar_anclaje
from pipeline.roadmap import Objetivo, PuntoDePartida, Roadmap, RoadmapNode, derivar_ruta


def _nodo(slug: str, nombre: str, **extra) -> RoadmapNode:
    base = dict(slug=slug, tipo="concepto", nombre=nombre, resuelve=f"resuelve {slug}",
                dominado_cuando="", nivel=0)
    base.update(extra)
    return RoadmapNode(**base)


# sql <- ingesta <- orquestacion ; kafka suelto
GRAFO = Roadmap(
    nodes=[
        _nodo("sql", "SQL"),
        _nodo("ingesta", "Ingesta desacoplada", nivel=1, prerequisitos=["sql"]),
        _nodo("orquestacion", "Orquestación", nivel=2, prerequisitos=["ingesta"]),
        _nodo("kafka", "Mensajería y logs de eventos"),
    ],
    objetivos=[Objetivo(slug="batch", nombre="Batch", descripcion="lotes", metas=["orquestacion"])],
    puntos_de_partida=[
        PuntoDePartida(slug="cero", nombre="Desde cero", descripcion=""),
        PuntoDePartida(slug="sql", nombre="Ya sé SQL", descripcion="", conocidos=["sql"]),
    ],
)
NOMBRES = [n.nombre for n in GRAFO.nodes]


class _LLM:
    def __init__(self, texto="Arrancás por SQL, seguís con Ingesta desacoplada y cerrás con Orquestación."):
        self.texto = texto
        self.llamadas = 0

    def draft_route_blurb(self, objetivo, descripcion, partida, nodos, sabidos):
        self.llamadas += 1
        if isinstance(self.texto, Exception):
            raise self.texto
        return self.texto


def test_anclaje_acepta_nombres_de_la_ruta_y_de_lo_sabido():
    permitidos = ["Ingesta desacoplada", "Orquestación", "SQL"]
    assert validar_anclaje("Como ya sabés SQL, arrancás por ingesta desacoplada.", permitidos, NOMBRES) is None


def test_anclaje_rechaza_un_nombre_ajeno_sin_importar_mayusculas_ni_acentos():
    permitidos = ["Ingesta desacoplada", "Orquestación"]
    assert validar_anclaje("Después viene mensajeria y logs de eventos.", permitidos, NOMBRES) == "Mensajería y logs de eventos"


def test_anclaje_respeta_bordes_de_palabra():
    todos = ["Git", "SQL"]
    assert validar_anclaje("Lo digital pesa.", ["SQL"], todos) is None
    assert validar_anclaje("Usá git para esto.", ["SQL"], todos) == "Git"


def test_hash_es_estable_y_cambia_con_el_contenido():
    o, p = GRAFO.objetivos[0], GRAFO.puntos_de_partida[0]
    ruta, sabidos = derivar_ruta(GRAFO, o, p)
    h1 = hash_ruta(ruta, sabidos, o, p)
    assert h1 == hash_ruta(ruta, sabidos, o, p)
    ruta[0] = ruta[0].model_copy(update={"resuelve": "otra cosa"})
    assert hash_ruta(ruta, sabidos, o, p) != h1


def test_genera_una_vez_y_reutiliza_si_el_grafo_no_cambio(db_conn):
    llm = _LLM()
    assert generar(db_conn, GRAFO, llm) == {"generados": 2, "reutilizados": 0, "rechazados": 0, "fallidos": 0}
    assert generar(db_conn, GRAFO, llm) == {"generados": 0, "reutilizados": 2, "rechazados": 0, "fallidos": 0}
    assert llm.llamadas == 2
    with db_conn.cursor() as cur:
        cur.execute("SELECT objetivo, partida FROM roadmap_route_blurb ORDER BY partida")
        assert cur.fetchall() == [("batch", "cero"), ("batch", "sql")]


def test_revalida_el_anclaje_al_reutilizar_y_regenera_si_el_grafo_cambio_en_otro_lado(db_conn):
    # El párrafo publicado nombra "costo" (todavía no es un nodo). Más tarde el
    # grafo gana un nodo con ese nombre en otro lado: el hash de la ruta no
    # cambia, pero el párrafo ya publicado deja de anclar contra el conjunto
    # de nombres actual y debe regenerarse en vez de reutilizarse.
    texto_con_costo = "Arrancás por SQL, seguís con Ingesta desacoplada, cerrás con Orquestación sin perder de vista el costo."
    generar(db_conn, GRAFO, _LLM(texto_con_costo))

    con_nodo_nuevo = GRAFO.model_copy(deep=True)
    con_nodo_nuevo.nodes = con_nodo_nuevo.nodes + [_nodo("costo", "Costo")]
    llm_limpio = _LLM()
    stats = generar(db_conn, con_nodo_nuevo, llm_limpio)
    assert stats == {"generados": 2, "reutilizados": 0, "rechazados": 0, "fallidos": 0}
    assert llm_limpio.llamadas == 2
    with db_conn.cursor() as cur:
        cur.execute("SELECT texto FROM roadmap_route_blurb")
        assert all("costo" not in texto.lower() for (texto,) in cur.fetchall())


def test_regenera_solo_las_rutas_cuyo_contenido_cambio(db_conn):
    llm = _LLM()
    generar(db_conn, GRAFO, llm)
    cambiado = GRAFO.model_copy(deep=True)
    # sql está en la ruta de 'cero' (su `resuelve` entra al hash) pero es un sabido
    # en 'sql' (solo entra su nombre): cambia una ruta, no las dos.
    cambiado.nodes[0] = cambiado.nodes[0].model_copy(update={"resuelve": "consultar datos"})  # sql
    stats = generar(db_conn, cambiado, llm)
    assert (stats["generados"], stats["reutilizados"]) == (1, 1)
    # orquestacion está en las dos rutas: cambian las dos.
    cambiado.nodes[2] = cambiado.nodes[2].model_copy(update={"resuelve": "coordinar"})  # orquestacion
    assert generar(db_conn, cambiado, llm)["generados"] == 2
    assert llm.llamadas == 5


def test_un_parrafo_no_anclado_no_se_escribe_y_va_a_cuarentena(db_conn):
    llm = _LLM("Arrancás por SQL y después Mensajería y logs de eventos.")
    stats = generar(db_conn, GRAFO, llm)
    assert stats["rechazados"] == 2 and stats["generados"] == 0
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM roadmap_route_blurb")
        assert cur.fetchone()[0] == 0
        cur.execute("SELECT stage, error FROM quarantine")
        filas = cur.fetchall()
        assert len(filas) == 2 and all(s == "anclaje" and "Mensajería" in e for s, e in filas)


def test_un_parrafo_vacio_o_larguisimo_se_rechaza(db_conn):
    assert generar(db_conn, GRAFO, _LLM(""))["rechazados"] == 2
    assert generar(db_conn, GRAFO, _LLM("x" * 701))["rechazados"] == 2


def test_un_fallo_del_llm_no_levanta_y_borra_el_parrafo_viejo(db_conn):
    generar(db_conn, GRAFO, _LLM())
    cambiado = GRAFO.model_copy(deep=True)
    cambiado.nodes[2] = cambiado.nodes[2].model_copy(update={"resuelve": "otra"})
    stats = generar(db_conn, cambiado, _LLM(RuntimeError("red caída")))
    assert stats == {"generados": 0, "reutilizados": 0, "rechazados": 0, "fallidos": 2}
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM roadmap_route_blurb")
        assert cur.fetchone()[0] == 0


def test_borra_las_combinaciones_que_dejaron_de_existir(db_conn):
    generar(db_conn, GRAFO, _LLM())
    menos = GRAFO.model_copy(update={"puntos_de_partida": GRAFO.puntos_de_partida[:1]})
    generar(db_conn, menos, _LLM())
    with db_conn.cursor() as cur:
        cur.execute("SELECT partida FROM roadmap_route_blurb")
        assert cur.fetchall() == [("cero",)]


def test_una_ruta_sin_pendientes_no_tiene_parrafo(db_conn):
    todo_sabido = GRAFO.model_copy(update={"puntos_de_partida": [
        PuntoDePartida(slug="todo", nombre="Todo", descripcion="", conocidos=["orquestacion"])
    ]})
    llm = _LLM()
    assert generar(db_conn, todo_sabido, llm) == {"generados": 0, "reutilizados": 0, "rechazados": 0, "fallidos": 0}
    assert llm.llamadas == 0
