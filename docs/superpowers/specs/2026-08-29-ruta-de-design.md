# Ruta DE — diseño

**Fecha:** 2026-08-29
**Estado:** aprobado para planear
**Nombre de la sección:** Rumbo (`/ruta`)
**Contexto en el vault:** `04 - Proyectos Personales/Proyectos DE/DE Radar/Ruta DE.md`

---

## Antes de implementar: leer las skills de `de-*`

Este diseño toca ingesta, modelado, orquestación y principios de diseño de pipelines. **Antes de escribir código, cargar y aplicar como checklist las seis skills de Data Engineering disponibles:**

- `de-arquitectura-de-datos` — forma general de la plataforma, observabilidad, costo
- `de-data-lakes` — zonas, particionamiento, formatos
- `de-ingesta-y-etl` — ETL vs ELT, carga incremental, cambios de esquema en la fuente
- `de-modelado-dimensional` — grano, hechos y dimensiones, capas de dbt
- `de-orquestacion-airflow` — schedule, dependencias, idempotencia de tareas
- `de-principios-de-diseno` — configuración como dato, jobs paramétricos, manejo de errores, testabilidad

La auditoría con estas skills sobre DE Radar (decisión 21) encontró cuatro bugs reales que ninguna revisión por task había visto. Correrlas **antes** en vez de después es el punto de este párrafo.

Además, el proyecto ya tiene decisiones cerradas que este diseño hereda y no puede contradecir: catálogo como dato y no como código (7), cuarentena en vez de descarte (8), LLM al final de la cadena (15), la web nunca escribe (6). Leer `Contexto - Diseño y Decisiones.md` antes de planear.

---

## Problema

DE Radar está desplegado y funcionando, pero su propia auditoría reconoce dos huecos: no hay razón para que alguien vuelva, y no hay canal de distribución. Una ruta de aprendizaje con URL propia y compartible ataca los dos, reusando el pipeline, el catálogo y los marts que ya existen.

El espacio de roadmaps está saturado y además se volvió commodity frente a los LLMs. El único ángulo defendible es el que solo este proyecto puede dar: **una ruta conectada al estado real y verificado del ecosistema**, apoyada en la maquinaria anti-alucinación que ya existe.

## No-objetivos

- No es un producto separado ni un negocio.
- No es un roadmap de herramientas: el objetivo es formar un buen DE, no preparar para una oferta puntual.
- No reproduce contenido de cursos de terceros (ver "Límite ético").
- No introduce autenticación ni escritura desde la web.

---

## Arquitectura

### Principio estructural: el concepto es el nodo

Invertido respecto a los roadmaps clásicos. Orquestación es el nodo; Airflow, Dagster y GitHub Actions son formas de practicarlo. Lo mismo para cloud: *object storage* es el nodo; S3, GCS y ADLS son implementaciones con grado de equivalencia explícito.

Consecuencia económica, que es la razón real: **lo que se cura a mano es la parte estable** (el concepto, que sigue vigente en diez años) y **lo que cambia se mantiene solo** (los datos vivos, que vienen del pipeline diario).

### Flujo de datos

```
catalog/roadmap.yaml  ──sync_roadmap()──>  Postgres (nodos + aristas)
                                                  │
catalog/tools.yaml ──> pipeline ──> marts ────────┤
                                                  ▼
                                          dbt: mart_roadmap
                                                  ▼
                                        Next.js /ruta (solo lectura, ISR)
```

Un nodo que coincide por slug con una herramienta del catálogo recibe encima la capa de datos vivos (`mart_ecosystem`). Un nodo que no coincide muestra su ficha sin esa capa. **`catalog/tools.yaml` no se modifica.**

### Por qué YAML en el repo y no edición en base

El grafo es dato curado que cambia poco, y el control de calidad que importa es que cada arista se revise a mano: git da diff, historial y revisión en PR gratis. `tools.yaml` ya funciona así, así que no se inventa un patrón nuevo — `sync_roadmap()` reusa la forma de `sync_catalog()`.

**Alternativa descartada:** importar el YAML en build time y joinear en TypeScript. Menos piezas, pero rompe la frontera de "la web es solo lectura de Postgres" y el grafo dejaría de refrescarse con la revalidación on-demand que ya existe.

---

## Modelo de datos

**`roadmap_node`** — grano: un nodo del grafo.
`slug` (PK natural), `tipo` (`concepto` | `herramienta` | `capacidad-cloud`), `nombre`, `resuelve`, `dominado_cuando`, `orden_sugerido` (entero, solo desempata nodos que el orden topológico deja al mismo nivel — nunca lo contradice).

**`roadmap_edge`** — grano: una arista de prerequisito.
`from_slug`, `to_slug`, `UNIQUE(from_slug, to_slug)`. Sin ciclos (ver validación).

**`roadmap_experience`** — grano: un bloque `lo_vi_romperse` por nodo.
`node_slug`, `texto`, `link`, nullable. Su ausencia es lo que dispara el marcador visible.

**`roadmap_source`** — grano: una fuente por nodo. `node_slug`, `url`, `por_que`.

**`roadmap_implementation`** — grano: una implementación por nodo.
`node_slug`, `tool_slug` (nullable, para joinear con el catálogo), `proveedor` (nullable: `aws`|`gcp`|`azure`|`portable`), `equivalencia` (`alta`|`media`|`baja`, nullable), `nota`.

Una sola tabla para herramientas y servicios cloud porque el grano es el mismo —"una forma de practicar este nodo"— y separarlas obligaría a dos joins para la misma pregunta.

**Idempotencia:** `sync_roadmap()` hace upsert por clave natural y borra lo que ya no está en el YAML. Correrlo diez veces deja el mismo estado que correrlo una vez. Sin SCD2: el grafo no necesita historial, a diferencia de `dim_tool`.

---

## Anatomía de un nodo (YAML)

```yaml
- id: idempotencia
  tipo: concepto
  prerequisitos: [ingesta, orquestacion]

  resuelve: >
    Correr el mismo proceso dos veces tiene que dejar el mismo estado.
    Sin esto, un reintento duplica datos y un backfill corrompe el histórico.

  lo_vi_romperse:
    texto: >
      El hash de contenido se calculaba sobre el JSON crudo de GitHub, que trae
      download_count por asset. Cambiaba con que alguien descargara un archivo,
      sin release nuevo — cada corrida guardaba una fila nueva.
    link: <commit / decisión>

  dominado_cuando: >
    Podés correr tu pipeline dos veces seguidas y comprobar que el estado
    de la base es idéntico.

  fuentes:
    - url: ...
      por_que: ...

  se_practica_con: [airflow, dbt]
```

Para `tipo: capacidad-cloud`, `se_practica_con` se reemplaza por:

```yaml
  implementaciones:
    - proveedor: aws
      nombre: S3
      equivalencia: alta
    - proveedor: gcp
      nombre: BigQuery
      equivalencia: media
      nota: cómputo y almacenamiento separados, cobro por consulta
```

---

## Validación (esto no es opcional)

El grafo es dato curado y una arista mal puesta enseña mal. `sync_roadmap()` valida **antes** de escribir y falla la corrida entera si algo no pasa:

1. **Sin ciclos** en `prerequisitos` — un ciclo hace que el orden topológico no exista. Detección por DFS.
2. **Toda arista apunta a un nodo que existe.**
3. **Todo `tool_slug` de una implementación existe en `catalog/tools.yaml`, o es nulo.** Un slug mal escrito rompería silenciosamente la capa de datos vivos: el nodo se vería bien pero sin datos, y nadie lo notaría.
4. **`equivalencia` solo en nodos `capacidad-cloud`**, y siempre con `nota` cuando es `media` o `baja`. Una equivalencia media sin explicación es exactamente la tabla que miente.
5. **Enum cerrado** para `tipo`, `proveedor` y `equivalencia`.

Fallar la corrida y no escribir nada es coherente con la decisión 8: el error se ve, no se degrada en silencio.

---

## Frontend

La sección se llama **Rumbo**. Ruta real en `/ruta` — el nombre visible y la URL difieren a propósito: "ruta" es la palabra que la gente busca y la que se lee en un link compartido; "Rumbo" sigue la metáfora náutica que ya abrió *Radar*. Mismo criterio que "Digest" mostrándose sobre `#digest`.

### Cambios en el navbar

Estado actual: `Radar · Manifiesto · Ecosistema · Artículos · Digest`, todas anclas de una sola página, más un pill de "Buscar ⌘K" a la derecha. Con Rumbo serían 6 ítems más el buscador.

1. **Sacar Manifiesto del navbar.** Es una sección que se lee una vez; no necesita espacio permanente. Vuelve a 5 ítems sin tocar arquitectura. La sección sigue existiendo en la página, solo pierde el link de navegación.
2. **Separar Rumbo visualmente** del grupo de anclas (divisor o pill aparte). Los otros cuatro son secciones de esta página; Rumbo es una ruta que saca de acá. Hoy se ven iguales y son cosas distintas — separarlos comunica la estructura en vez de esconderla.
3. **Anclas a links absolutos.** `#radar` -> `/#radar`, etc. Desde `/ruta` las anclas relativas no resuelven. **Rompe silenciosamente si se pasa por alto** — se ve bien y no navega.
4. **Bajar de jerarquia el buscador, no eliminarlo.** Quitar el texto "Buscar" y el badge ⌘K del desktop; dejar solo el ícono, como ya está en mobile. El atajo ⌘K sigue funcionando.

> **Por qué no se agrupan Ecosistema/Artículos/Digest en un desplegable**, que fue la alternativa considerada: son todo el contenido que el sitio produce, y esconderlas para hacerle lugar a la sección nueva prioriza lo nuevo sobre lo que ya funciona. Además, agrupar *anclas* en un dropdown es el peor de los dos mundos — el desplegable promete páginas distintas y entrega scroll de la misma página, agregando un clic y un estado para no llevar a ningún lado. En mobile ya existe overlay, así que ahí no hay problema que resolver. Si en algún momento esas tres pasan a ser rutas reales, agruparlas sí tendría sentido.

> **Por qué no se elimina el buscador:** hoy es decoración —con 10 herramientas visibles scrolleando, compite contra el scroll y pierde— pero Rumbo suma 27 nodos y ahí "¿dónde estaba lo de idempotencia?" deja de contestarse con scroll. El componente ya existe y ya se depuró (tenía datasets falsos hardcodeados). Lo que satura es la etiqueta, no la función.

Cada nodo renderiza los cuatro bloques. Cuando `roadmap_experience` está vacío para ese nodo, muestra el marcador **visible** de "todavía no lo practiqué", redactado como progreso.

Reusar los patrones visuales ya aprobados: brillo estático al hover, **sin spotlight que siga el cursor** (decisión 23 de DE Radar).

---

## Límite ético con material de terceros

El curso de Fundamentos Data Engineering es un producto que alguien vende. Los hechos y la estructura del campo no son de nadie; la expresión, los ejemplos y **la secuencia de enseñanza** sí son del autor.

1. No copiar la secuencia de módulos de ningún curso. La estructura sale del modelo concepto → implementación.
2. Nada citado de memoria en contenido publicado.
3. Escribir desde lo que se hizo. Para lo no vivido: documentación oficial, specs y libros publicados, linkeados y atribuidos, nunca transcritos.
4. Linkear el curso con atribución cuando cubra bien un tema.

**Regla operativa para quien implemente:** ningún nodo lleva exposición teórica. Si un bloque `resuelve` empieza a parecer un capítulo, está mal.

> **`Ruta Data Engineer.md` del vault tiene `fuente: Claude`.** Es contenido generado por IA sin verificar. Sirve como esqueleto estructural. Sus afirmaciones —qué herramienta reemplaza a cuál, qué certificación es la más demandada— **no entran a la ruta sin verificación contra fuente primaria.**

---

## Fases

Cada fase es desplegable y verificable sola, sin depender de la siguiente. Misma disciplina que las fases 1-4 de DE Radar.

### Fase 1 — Grafo estático y ruta navegable *(la v1)*
Migración de tablas, `catalog/roadmap.yaml` con el primer conjunto de nodos, `sync_roadmap()` con validación, mart de dbt, página `/ruta`, navbar (incluido el arreglo de anclas), marcador de "todavía no lo practiqué", capa de datos vivos en los nodos que coinciden con el catálogo. **Sin wizard**: la ruta completa, ordenada topológicamente.

*Listo cuando:* la ruta se recorre entera, ningún nodo tiene contenido inventado, la validación rechaza un grafo con ciclo o con slug inexistente, y los datos vivos se actualizan con el cron diario.

### Fase 2 — Ruta personalizada
Wizard de 3-4 preguntas de opción cerrada que mapean a tags del grafo, orden topológico sobre el subgrafo, URL propia (`/ruta/<hash>`) compartible. Sin LLM.

*Listo cuando:* dos respuestas iguales producen la misma ruta y la URL se comparte.

### Fase 3 — Ruta inversa y filtro por stack
*"Ya sé X, Y, Z — ¿qué me falta?"*: el grafo devuelve la frontera alcanzable. Filtro de proveedor cloud que cambia implementaciones sin cambiar la ruta.

### Fase 4 — Capa de LLM y progreso local
Mapeo de respuesta libre a enum cerrado (lo que caiga fuera se descarta en código), párrafo de "por qué esta ruta" anclado a los nodos ya elegidos, cacheado por hash de respuestas. Progreso por nodo en `localStorage`.

**El LLM nunca elige nodos ni orden** (decisión 15 de DE Radar). Si lo hiciera, la ruta dejaría de ser reproducible y podría inventar herramientas.

---

## Estrategia de pruebas

- **Validación del grafo:** casos con ciclo, arista huérfana, `tool_slug` inexistente y equivalencia sin nota — **todos deben fallar**. Un validador que nunca rechaza no valida (decisión 17 de DE Radar).
- **`sync_roadmap()`:** contra Postgres real, incluyendo idempotencia (correr dos veces = mismo estado) y borrado de nodos que salieron del YAML.
- **Orden topológico:** un grafo sintético con orden conocido.
- **dbt:** `not_null`, `accepted_values` sobre `tipo`/`proveedor`/`equivalencia`, y `relationships` de `roadmap_implementation.tool_slug` contra el catálogo.

---

## Riesgos

**El grafo es el producto y es todo manual.** El código es un orden topológico y unos componentes de React; el contenido curado es el 90% del trabajo y no se delega sin revisar arista por arista.

**El modo de fallo de una ruta de conceptos es volverse un temario** que nadie puede ejecutar. `dominado_cuando` y `se_practica_con` son lo que lo evita; si se diluyen, la ruta se muere.

**Contenido inventado en `lo_vi_romperse`** sería el peor resultado posible: tira abajo la credibilidad que el proyecto se ganó siendo riguroso. Por eso el marcador de ausencia es visible y obligatorio.

---

## Columna de nodos de la Fase 1

27 nodos. La estructura sale del modelo concepto → implementación anclado al ciclo de vida de Reis & Housley (marco publicado, se cita y se linkea) — **no de la secuencia de ningún curso**.

**Base:** `sql`, `python-para-datos`, `git`, `linea-de-comandos`, `contenedores`
**Modelo mental:** `ciclo-de-vida-del-dato`, `batch-vs-streaming`
**Ingesta:** `ingesta-desacoplada`, `idempotencia`, `carga-incremental`, `salud-de-fuentes`
**Almacenamiento:** `zonas-y-capas`, `particionamiento`, `formatos-columnares`, `table-formats`
**Analítico:** `oltp-vs-olap`, `lake-vs-warehouse-vs-lakehouse`
**Transformación:** `modelado-dimensional`, `historizacion-scd`, `elt-y-capas-de-transformacion`, `calidad-y-tests-de-datos`
**Orquestación:** `orquestacion`, `backfill-y-reprocesamiento`
**Sin practicar:** `mensajeria-y-logs-de-eventos`, `garantias-de-entrega`, `procesamiento-distribuido`
**Transversales:** `observabilidad`, `costo`, `gobernanza-y-datos-personales`
**Capacidades cloud:** `object-storage`, `computo-serverless`, `contenedores-gestionados`, `orquestacion-gestionada` (equivalencia alta) y `warehouse-gestionado` (media, con nota obligatoria)

**14 de 27 tienen `lo_vi_romperse` real** documentado en DE Radar o en la bitácora de SQL. Los otros 13 llevan el marcador visible. El detalle de qué evidencia respalda cada nodo está en `Ruta DE.md` del vault.

> **Regla para quien implemente:** si un nodo no tiene evidencia listada en esa tabla, su bloque `lo_vi_romperse` va vacío. No se redacta uno plausible. Inventarlo es el peor resultado posible del proyecto.

### Afirmaciones verificadas y desmentidas

No re-verificar sin razón nueva:
- El Zoomcamp de DataTalks Club **ya no enseña Airflow** — su README oficial muestra Kestra para orquestación y Bruin para plataformas.
- **"Flink está reemplazando a Spark Streaming" es falso** — Spark Structured Streaming mantiene adopción más amplia; Flink es preferido para cargas stateful de baja latencia.
- La convergencia Iceberg/Delta está **sin verificar contra fuente primaria** — solo blogs del ecosistema. Si entra a un nodo, entra marcada.


---

## Listo para planear

No quedan decisiones de diseño abiertas para la Fase 1. Lo único externo al código es contar herramientas en ~40 ofertas reales de DE para validar el filtro de empleabilidad de la decisión 8 — no bloquea la implementación, calibra el catálogo después.
