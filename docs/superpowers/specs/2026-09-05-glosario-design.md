# Glosario — diseño

**Fecha:** 2026-09-05
**Estado:** aprobado para planear
**Nombre de la sección:** `/glosario`
**Contexto en el vault:** `04 - Proyectos Personales/Proyectos DE/DE Radar/Glosario DE.md`
**Hermano:** `2026-09-05-guia-de-practica-design.md` — comparten taxonomía, navbar y criterio de curación

---

## Antes de implementar

**Decisiones heredadas que este diseño no puede contradecir.** Leer `Contexto - Diseño y Decisiones.md` y `Ruta DE.md`:

- **El LLM no interviene en ningún paso.** Ni para definir, ni para buscar, ni para clasificar (decisión 15 de DE Radar, 9 de Rumbo). Un glosario cuya gracia es ser verificable no puede tener definiciones generadas.
- **La web nunca escribe** (decisión 6 de DE Radar). **Sin cuentas** (decisión 11 de Rumbo).
- **El contenido curado es dato en git, no código** (decisión 7 de DE Radar).
- **Nada se publica sin fuente primaria** (decisión 12 de DE Radar, y el criterio de `fuentes` de Rumbo).

**Next.js.** `web/AGENTS.md` advierte que esta versión tiene cambios de API respecto al conocimiento de entrenamiento: leer `node_modules/next/dist/docs/` antes de escribir páginas o rutas.

---

## Problema

Rumbo enseña 34 conceptos con dependencias, evidencia propia y criterio de dominio. Pero su propia regla de poda (decisión 8) deja afuera, a propósito, la jerga granular: `XCom`, `shuffle`, `watermark`, `manifest file`, `DAG Factory`. Son términos que no merecen ser nodo —no tienen peso pedagógico propio— pero que un DE se encuentra constantemente leyendo un release o un artículo, justo el contenido que este sitio publica.

Hoy alguien lee un artículo en DE Radar, se topa con `predicate pushdown`, y el sitio no tiene nada que decirle.

**Lo que no se va a construir:** otro glosario genérico de Data Engineering. Eso ya existe en docs de vendors y blogs, y no aporta nada — mismo criterio de "competencia honesta" que el proyecto se aplica en el changelog y en la ruta. El ángulo defendible es el mismo de siempre: **términos verificados contra fuente primaria, con el lugar real donde se usaron en este proyecto**.

## No-objetivos

- No hay definiciones escritas de memoria. Ninguna.
- No hay LLM, ni para generar ni para buscar.
- No se reescribe lo que Rumbo ya define: los conceptos que son nodo se siembran desde el grafo, no se duplican a mano.
- No se marca la ausencia de un término. Un glosario no se compromete a ser exhaustivo (ver "Regla de ausencia" en el spec hermano: la ausencia solo se marca cuando habla del autor, no cuando habla del mundo).

---

## Arquitectura

### El glosario es la unión de dos fuentes, no una lista escrita a mano

```
catalog/roadmap.yaml ──> roadmap_node ─────┐
  (34 nodos: definición = su `resuelve`)   │
                                           ├──> mart_glosario ──> /glosario
catalog/glosario.yaml ──> glossary_term ───┘
  (jerga granular curada)
```

| Origen | Definición | Contenido nuevo a escribir |
|---|---|---|
| **Nodo de Rumbo** | su campo `resuelve`, ya escrito y ya anclado | **cero** |
| **Término del glosario** | campo `definicion` propio | la definición y sus fuentes |

Sembrar los 34 nodos no es un extra: sin eso, alguien que busca "idempotencia" en el glosario no la encuentra, porque casualmente es un nodo. El lector no conoce ni le importa nuestra distinción interna entre nodo y término.

Los términos con nodo detrás se muestran con un `Ver ruta completa →`; los granulares, con su definición y su cruce de categoría.

### La taxonomía es una sola, y hoy está triplicada en el frontend

Ambas secciones agrupan por el `nivel` de Rumbo (Base, Ingesta, Orquestación…). El problema: **los nombres de esos niveles hoy viven hardcodeados y duplicados byte por byte en tres componentes de React** (`RoadmapGraphView.tsx`, `RoadmapCardsView.tsx`, `RoadmapIdeView.tsx`), fuera de todo control de datos.

Eso ya causó un bug real en producción: la revisión final de la Fase 1 de Rumbo encontró que el mapa se salteaba el nivel 9, así que un nodo salía bajo un título ajeno y otro bajo el rótulo crudo "Nivel 9". El mapa venía de un brief escrito antes de que el YAML estuviera terminado, y nada obligaba a que coincidieran.

Glosario sería la **cuarta copia**. En vez de eso, este diseño mueve los nombres de nivel al dato:

```yaml
# catalog/roadmap.yaml
niveles:
  0: Base
  1: Modelo mental
  2: Ingesta
  # ...
```

Con una regla de validación que cierra el agujero de raíz: **todo `nivel` usado —por un nodo o por un término del glosario— tiene que existir en `niveles`, y todo nivel declarado tiene que ser usado por al menos uno de los dos.** Es la regla que habría hecho fallar la carga en vez de publicar el rótulo roto.

No es scope creep: Glosario necesita esos nombres sí o sí, y la alternativa es duplicarlos por cuarta vez en un mapa que ya demostró que se desincroniza.

---

## Modelo de datos

**`roadmap_level`** — grano: un nivel de la taxonomía.

```sql
CREATE TABLE IF NOT EXISTS roadmap_level (
    nivel  INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL
);
```

**`glossary_term`** — grano: un término curado (los nodos no viven acá; se unen en el mart).

```sql
CREATE TABLE IF NOT EXISTS glossary_term (
    slug             TEXT PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    termino          TEXT NOT NULL,
    definicion       TEXT NOT NULL,
    nivel            INTEGER NOT NULL REFERENCES roadmap_level(nivel),
    nodo_relacionado TEXT REFERENCES roadmap_node(slug) ON DELETE SET NULL,
    uso_texto        TEXT,
    uso_link         TEXT,
    -- Un link sin texto que lo explique es una referencia muda.
    CHECK (uso_link IS NULL OR uso_texto IS NOT NULL)
);
```

El `CHECK` sobre `slug` no es decorativo: el slug es el ancla de la URL compartible (`/glosario#dag-factory`), así que una mayúscula o un espacio tienen que fallar al cargar y no convertirse en un ancla muerta. Mismo criterio que ya aplica `roadmap_wizard_option`.

`uso_texto` / `uso_link` son el "dónde se usó", con la misma forma que `roadmap_experience` (el texto es la sustancia, el link es la evidencia opcional). Para las entradas sembradas desde nodos, este bloque sale gratis del `roadmap_experience` que el nodo ya tiene.

**`glossary_source`** — grano: una fuente por término.

```sql
CREATE TABLE IF NOT EXISTS glossary_source (
    term_slug TEXT NOT NULL REFERENCES glossary_term(slug) ON DELETE CASCADE,
    url       TEXT NOT NULL,
    por_que   TEXT NOT NULL,
    UNIQUE (term_slug, url)
);
```

**`mart_glosario`** — `UNION ALL` de las dos fuentes, con las fuentes agregadas en JSONB y una columna `origen` (`nodo` | `termino`) para que la página sepa si mostrar el `Ver ruta completa →`. Una sola query para toda la página.

**Idempotencia:** `sync_roadmap()` extiende su patrón actual de borrar-y-reinsertar. Correrlo diez veces deja el mismo estado que correrlo una vez.

---

## Anatomía de un término (YAML)

`catalog/glosario.yaml`, nuevo:

```yaml
terminos:
  - slug: xcom
    termino: XCom
    nivel: 6                     # Orquestación
    nodo_relacionado: orquestacion
    definicion: >
      El mecanismo de Airflow para pasar valores chicos entre tareas de un
      mismo DAG. No es para mover datos: lo que viaja se serializa y se guarda
      en la base de metadatos del orquestador.
    fuentes:
      - url: https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/xcoms.html
        por_que: la documentación oficial es explícita sobre el límite de tamaño y por qué existe
    uso_texto: >
      No se usó en este proyecto: la orquestación es GitHub Actions y el paso
      de estado entre tareas es la base, no el orquestador.
```

*(El contenido del ejemplo es ilustrativo del formato. Cada término real se verifica en la Task 0 antes de escribirse — ver "Regla de curación".)*

---

## Regla de curación: dos filtros

Es lo que separa este glosario de uno genérico, y fue el pedido explícito del usuario ("no poner conceptos por poner"). Un término entra solo si pasa **los dos**:

1. **Evidencia de uso real** — aparece en documentación oficial de una herramienta del catálogo, o en artículos/releases que el pipeline ya ingirió. No entra porque suene bien ni para "completar" una categoría. *Este filtro es juicio humano y se ejecuta en la Task 0.*
2. **Verificado contra fuente primaria** — con su URL y su por qué. *Este filtro es estructural: un término sin al menos una fuente no carga* (regla de validación 5). La regla de curación deja de depender de la disciplina de quien edita el YAML.

Es la misma lección de la decisión 20 de DE Radar aplicada al contenido: la garantía vive en un constraint, no en el cuidado del que escribe.

## Validación (esto no es opcional)

Se suma al validador existente. Todo falla la carga entera antes de escribir a la base:

1. **Slug único entre las dos fuentes** — un término del YAML no puede colisionar con el slug de un nodo, o el ancla de la URL sería ambigua y el mart tendría dos filas para la misma clave.
2. **Slug con forma de ancla URL** (espejo en Python del `CHECK` de la tabla, para fallar con mensaje legible).
3. **`nivel` existe en `niveles`** — para nodos y para términos. Y al revés: todo nivel declarado es usado por al menos un nodo o un término, para que no se renderice una categoría vacía. Es la regla que habría atrapado el bug del nivel 9.
4. **`nodo_relacionado`, si está, existe en el grafo.**
5. **Al menos una fuente por término**, con `url` y `por_que` no vacíos.
6. **`definicion`, `termino` y `por_que` no vacíos tras `strip()`** — un `>` de YAML mal indentado produce string vacío sin error de parseo.
7. **`uso_link` sin `uso_texto` es error** (espejo del `CHECK`).

---

## Frontend

### Página

**`/glosario`** — una sola página, estática:

- Términos agrupados por categoría, con los nombres de nivel leídos del dato.
- **Ancla por término** (`/glosario#dag-factory`). Es lo que lo hace compartible: alguien pregunta qué es un DAG Factory y se le manda el link directo.
- **Filtro y búsqueda inline** — un input que filtra la lista visible por texto, más los chips de categoría.
- Cada entrada: definición, fuentes atribuidas, "dónde se usó" si lo tiene, y `Ver ruta completa →` si tiene nodo detrás.

**Cambio respecto al brainstorm, con su razón:** la nota del vault asumía reusar el Command Palette (⌘K) como buscador. Al mirarlo, el palette hoy se monta solo en `/` y en `not-found`, y recibe sus datos por props. Un palette que solo conoce el glosario *estando ya en el glosario* no agrega nada; lo que lo haría valioso es que funcione desde cualquier página, y eso es un refactor del montaje global que no pertenece a esta fase. Un filtro inline resuelve el 100% del caso real con cero componentes compartidos tocados. El ⌘K global queda como fase posterior.

### Frontend existente que hay que tocar

Los tres componentes de `/ruta` dejan de declarar su propio `NIVELES` y pasan a recibir los nombres del dato. **Es el único cambio de este diseño sobre una página ya desplegada y funcionando**, y por eso va con verificación visual de las tres vistas (IDE, Grafo, Fichas), no solo con build limpio.

### Navbar

Entra al grupo **"Aprender"** junto a Rumbo y Práctica — misma decisión y misma justificación que el spec hermano (decisión 13 de Rumbo dejó escrito que agrupar *rutas reales* sí tiene sentido). Si Práctica se implementa primero, el grupo ya existe y acá solo se suma un ítem.

---

## Fases

### Fase 1 — Glosario navegable

- **Task 0, antes de una línea de código:** curar y verificar el primer lote de términos contra su fuente primaria. Sin este paso no se escribe nada — es el filtro 1 de la regla de curación, y es juicio humano que ninguna validación puede hacer por vos. Candidatos de arranque, **todos sin verificar todavía**: `DAG Factory`, `XCom`, `Sensor` vs `Operator`, `broadcast join`, `predicate pushdown`, `manifest file`, `time travel`, `consumer group`, `schema registry`, `backpressure`, `surrogate key`, `grano`, `watermark`, `canonical URL`, `trigramas`, `hash de contenido`, `offset de consumidor`, `shuffle`, `snapshot` de dbt, `entailment`, `span citado`, `clausura de prerequisitos`, `orden topológico`, `degradación de fuente`, `dead-man switch`, `CU-hrs`.
- `niveles` en `catalog/roadmap.yaml` + tabla `roadmap_level` + la regla de validación cruzada.
- `catalog/glosario.yaml`, modelos Pydantic, las siete reglas de validación.
- Migración `009`, `sync_roadmap()` extendido, `mart_glosario`.
- Página `/glosario` con anclas, filtro y cruce con Rumbo; navbar; revalidación.
- Los tres componentes de `/ruta` leyendo los nombres de nivel del dato en vez de su copia local.

*Listo cuando:* todo término publicado tiene fuente verificada, ningún nivel se renderiza con rótulo crudo en ninguna de las tres vistas de `/ruta`, y el ancla de cada término resuelve al término correcto.

### Fase 2 — Minería de términos candidatos

Los artículos que el pipeline ya ingiere se minan buscando jerga que el glosario todavía no define; al cruzar el umbral, **se abre un issue proponiendo el término — el YAML nunca se modifica solo**. Mismo mecanismo, mismo umbral y misma filosofía que el descubrimiento de herramientas de la Fase 4 de DE Radar (decisión 20: propone, no inserta), incluida su lección de idempotencia: el grano de conteo es una tabla con constraint único por `(término, artículo)`, nunca un contador que se incrementa.

Es lo que convierte al glosario en algo que se alimenta del pipeline en vez de una lista que envejece.

### Fase 3 — Command Palette global *(opcional)*

Montar el palette en todas las páginas y darle el glosario, Rumbo y el catálogo como fuentes. Es un refactor de un componente compartido y su valor real es cross-page; no bloquea nada de lo anterior.

---

## Estrategia de pruebas

- **Validación:** un caso por regla, incluidos los dos que importan — un término cuyo slug colisiona con un nodo, y un nodo con un `nivel` que no está declarado en `niveles` (el bug del nivel 9, convertido en test). Un validador que nunca rechaza no está validando (decisión 17 de DE Radar).
- **Sync:** idempotencia contra Postgres real; sacar un término del YAML lo borra de la base.
- **dbt:** `not_null` y unicidad de `slug` sobre `mart_glosario` — es la garantía de que la unión de las dos fuentes no produce anclas duplicadas —, y `relationships` de `nodo_relacionado` contra `roadmap_node`.
- **Frontend:** build estático de `/glosario`; verificación visual de las **tres** vistas de `/ruta` tras quitar los `NIVELES` locales, porque es el único cambio sobre algo ya desplegado; y prueba real en navegador de que un ancla compartida abre en el término correcto.

## Riesgos

- **La regresión de `NIVELES`.** Es el riesgo principal de la Fase 1 y el único que toca una página en producción. Tres componentes, tres vistas, un solo cambio: hay que verlas las tres, no compilar y confiar.
- **Glosario percibido como duplicado de Rumbo.** Se mitiga con la distinción visual: el término granular es la mayoría del valor nuevo, y el nodo sembrado siempre ofrece el salto a la ruta completa. Si al terminar la Task 0 sobreviven muy pocos términos granulares, la sección es mayormente un espejo de `/ruta` y vale replantear la fase.
- **Definiciones que envejecen.** Un término definido contra la doc de hoy puede quedar desactualizado. No se construye detección automática (YAGNI); la fuente queda linkeada para que el lector pueda ir al original, que es la mitigación honesta.
- **Tentación de completar categorías.** La categoría vacía va a dar ganas de llenarla con un término inventado o traído de memoria. La regla de curación existe justamente para eso, y el constraint de fuente obligatoria la hace cumplir.

## Listo para planear

Este diseño está aprobado. El siguiente paso es `superpowers:writing-plans` sobre la Fase 1.
