# Guía de Práctica — diseño

**Fecha:** 2026-09-05
**Estado:** aprobado para planear
**Nombre de la sección:** `/practica` — corto y es la palabra que se lee en un link compartido, mismo criterio que llevó a `/ruta` sobre nombres más largos (decisión 12 de Rumbo). `/guia-aprendizaje` fue el placeholder de la conversación y queda descartado.
**Contexto en el vault:** `04 - Proyectos Personales/Proyectos DE/DE Radar/Guía de Práctica DE.md`

---

## Antes de implementar

**Decisiones heredadas que este diseño no puede contradecir.** Leer `Contexto - Diseño y Decisiones.md` y `Ruta DE.md` antes de planear:

- **El LLM nunca decide** (decisión 15 de DE Radar, 9 de Rumbo). Este diseño no llama a ningún modelo, en ningún paso. Si en algún momento aparece la tentación de que un LLM evalúe una respuesta, el diseño está mal.
- **La web nunca escribe** (decisión 6 de DE Radar). Nadie sube nada, nadie manda credenciales, no hay backend que reciba resultados.
- **Sin cuentas, sin auth** (decisión 11 de Rumbo). El progreso, si existe, vive en `localStorage`.
- **El catálogo es dato, no código** (decisión 7 de DE Radar). Todo el contenido nuevo va en `catalog/roadmap.yaml`, versionado en git.
- **No mostrar dato falso, no tapar el vacío en silencio** (decisión 5 de Rumbo). Es la decisión que gobierna el alcance de contenido de este diseño — ver "Regla de ausencia".

**Next.js.** `web/AGENTS.md` advierte que esta versión tiene cambios de API respecto al conocimiento de entrenamiento: leer las guías en `node_modules/next/dist/docs/` antes de escribir código de páginas o rutas.

**Skills de `de-*`.** Este diseño toca modelado y carga, no ingesta nueva. Aplicar al menos `de-modelado-dimensional` (grano de las tablas nuevas) y `de-principios-de-diseno` (configuración como dato, idempotencia del sync) como checklist antes de codear.

---

## Problema

DE Radar y Rumbo cubren *qué está pasando* en el ecosistema y *qué ruta seguir* para aprender. Falta el paso siguiente: dónde practicar. Hoy alguien termina de leer un nodo de Rumbo, entiende el concepto, y no tiene a dónde ir a ejercitarlo.

El espacio de plataformas de ejercicios está saturado y es bueno (DataLemur, PgExercises y compañía). Construir una peor no aporta nada — mismo criterio de "competencia honesta" que el proyecto ya se aplica a sí mismo en el changelog y en la ruta. Pero hay un hueco real que esas plataformas no cubren: **retos de punta a punta que combinan varias etapas del ciclo de vida del dato**, del tipo "ingerí de una fuente real, transformá, dejá el resultado en algún lado, y comprobá que correrlo dos veces no duplica nada". Eso no lo enseña un ejercicio de SQL aislado.

De ahí los dos mecanismos de este diseño, según el tipo de habilidad.

## No-objetivos

- **No es una plataforma de ejercicios.** No se autoría contenido que compita con DataLemur o PgExercises: para habilidades atómicas se cura y se apunta.
- **No se corrige nada.** No hay calificación, ni automática ni humana. El sitio no puede ver la infraestructura de nadie y no va a pedir credenciales.
- **No hay LLM en ningún paso.**
- **No hay retos sobre lo que no se practicó.** Ver "Regla de ausencia".
- **No se toca `catalog/tools.yaml`** ni el pipeline de ingesta.

---

## Arquitectura

### Dos mecanismos, según el tipo de habilidad

| | Habilidad atómica (SQL, Git, Docker, terminal) | Habilidad compuesta (un objetivo entero) |
|---|---|---|
| Mecanismo | **Directorio curado** de recursos externos | **Reto de punta a punta** autoriado |
| Contenido nuevo | Solo la curación (nombre, URL, por qué) | Un escenario de 3-4 líneas por reto |
| Existe afuera | Sí, y bueno | No, no conectado a datos reales |

La razón de fondo es económica, la misma que ordena todo el proyecto: **lo que ya existe y es bueno se cita; lo que solo este proyecto puede dar se escribe.**

### Flujo de datos

```
catalog/roadmap.yaml  ──sync_roadmap()──>  Postgres
  ├── practica_externa por nodo               ├── roadmap_practice_resource
  └── reto por objetivo                       ├── roadmap_challenge
                                              └── roadmap_challenge_check
                                                       │
                                                       ▼
                                    dbt: mart_roadmap (+columna), mart_reto
                                                       ▼
                                       Next.js /practica (solo lectura, SSG)
```

Cero ingesta nueva, cero llamadas de red en el pipeline, cero tablas fuera del dominio de Rumbo. El paso `Sincronizar la ruta` del cron diario ya existe y absorbe esto sin cambios de orquestación.

### Economía del contenido: qué se escribe y qué se deriva

Es el punto central del diseño. Un reto tiene tres bloques visibles y **solo uno se escribe**:

| Bloque | Origen |
|---|---|
| Escenario | **Escrito** — 3-4 líneas por reto |
| Checklist "sabés que lo lograste si…" | **Derivado** de `roadmap_node.dominado_cuando` de los nodos del checklist |
| "Esto es lo que se rompe" | **Derivado** de `roadmap_experience` (`lo_vi_romperse`) de esos mismos nodos |

Ninguna frase se duplica. Si mañana se corrige el `dominado_cuando` de `idempotencia`, el reto se corrige solo. Es el mismo principio que ya hace que un nodo de Rumbo no repita lo que dice el catálogo.

---

## Modelo de datos

**`roadmap_practice_resource`** — grano: un recurso de práctica por nodo.

```sql
CREATE TABLE IF NOT EXISTS roadmap_practice_resource (
    node_slug TEXT NOT NULL REFERENCES roadmap_node(slug) ON DELETE CASCADE,
    nombre    TEXT NOT NULL,
    url       TEXT NOT NULL,
    por_que   TEXT NOT NULL,
    UNIQUE (node_slug, url)
);
```

Calcada de `roadmap_source` (mismo grano, misma forma) más `nombre`, porque acá el nombre de la plataforma se muestra y en una fuente no.

**Descartado a propósito: un campo `costo` / `gratis`.** Es justo el dato que se pudre en silencio — un tier gratuito que cambia deja al sitio publicando algo falso, y el proyecto ya tiene una decisión explícita sobre no publicar lo que no puede sostener. El link habla por sí solo.

**`roadmap_challenge`** — grano: **un objetivo del wizard**, tenga reto o no.

```sql
CREATE TABLE IF NOT EXISTS roadmap_challenge (
    objetivo_slug   TEXT PRIMARY KEY,
    kind            TEXT NOT NULL DEFAULT 'objetivo' CHECK (kind = 'objetivo'),
    escenario       TEXT,
    motivo_ausencia TEXT,
    -- Exactamente uno de los dos. Un objetivo sin reto y sin motivo sería un
    -- hueco mudo en la página; con los dos, una contradicción.
    CHECK ((escenario IS NULL) <> (motivo_ausencia IS NULL)),
    FOREIGN KEY (kind, objetivo_slug)
        REFERENCES roadmap_wizard_option(kind, slug) ON DELETE CASCADE
);
```

El `CHECK` es deliberado y viene de una lección ya pagada: la decisión 20 de DE Radar aprendió que *"la garantía tiene que vivir en un constraint, no en la disciplina del código que llama"*. Acá el estado inválido (un objetivo que no dice ni el reto ni por qué no lo hay) es imposible por construcción, no por cuidado del programador.

La columna `kind` constante existe solo para poder tener la FK compuesta contra la PK `(kind, slug)` de `roadmap_wizard_option`.

**`roadmap_challenge_check`** — grano: un ítem del checklist de un reto.

```sql
CREATE TABLE IF NOT EXISTS roadmap_challenge_check (
    objetivo_slug TEXT NOT NULL REFERENCES roadmap_challenge(objetivo_slug) ON DELETE CASCADE,
    node_slug     TEXT NOT NULL REFERENCES roadmap_node(slug) ON DELETE CASCADE,
    orden         INTEGER NOT NULL,
    PRIMARY KEY (objetivo_slug, node_slug)
);
```

**Idempotencia:** `sync_roadmap()` extiende su patrón actual — borrar los hijos del padre y reinsertarlos. Correrlo diez veces deja el mismo estado que correrlo una vez.

### Marts

- **`mart_roadmap`** gana una columna `practica_externa` (JSONB agregado por nodo), igual que ya hace con `fuentes` e `implementaciones`. **No se crea un mart nuevo para la Parte A**: el grano es el nodo, y el mart del nodo ya existe.
- **`mart_reto`** (nuevo) — una fila por objetivo, con `escenario`, `motivo_ausencia`, y `checklist` en JSONB con `{slug, nombre, dominado_cuando, experiencia_texto, experiencia_link}` por ítem, ordenado por `orden`. Es lo que permite que la página haga una sola query.

---

## Anatomía en el YAML

Sobre un nodo (Parte A):

```yaml
- slug: sql
  # ... campos existentes
  practica_externa:
    - nombre: PgExercises
      url: https://pgexercises.com/
      por_que: ejercicios sobre un esquema realista, con la solución explicada
```

Sobre un objetivo (Parte B), con reto:

```yaml
objetivos:
  - slug: pipelines-batch
    # ... campos existentes
    reto:
      escenario: >
        Elegí una fuente pública que cambie con el tiempo y armá la ingesta:
        guardá la respuesta cruda antes de parsearla, escribí el resultado a
        donde quieras (una tabla, archivos, lo que tengas), y corré el proceso
        dos veces seguidas sin borrar nada en el medio.
      checklist:
        - salud-de-fuentes
        - idempotencia
        - carga-incremental
        - backfill-y-reprocesamiento
        - calidad-y-tests-de-datos
```

Y sin reto:

```yaml
  - slug: streaming
    # ... campos existentes
    reto_ausente: >
      Todavía no construí un pipeline de streaming en producción. Escribir un
      reto sobre algo que no practiqué sería inventarlo, así que este objetivo
      todavía no tiene uno.
```

**Modelos Pydantic nuevos:** `RecursoPractica(nombre, url, por_que)` y `Reto(escenario, checklist: list[str])`. `Objetivo` gana `reto: Reto | None` y `reto_ausente: str | None`.

**El checklist es curado, no derivado de las metas.** Si se derivara, el reto de `pipelines-batch` incluiría la meta `git` ("podés separar en dos commits un trabajo que quedó mezclado"), que no pinta nada en un reto de ingesta. Las metas definen hasta dónde llega la *ruta*; el checklist define cuándo está hecho el *reto*. Son preguntas distintas.

### Los dos checklists, ya verificados contra el grafo real (2026-09-05)

| Reto | Checklist | Dentro de la clausura | Con `lo_vi_romperse` |
|---|---|---|---|
| `pipelines-batch` | `salud-de-fuentes`, `idempotencia`, `carga-incremental`, `backfill-y-reprocesamiento`, `calidad-y-tests-de-datos` | 5/5 | **5/5** |
| `modelado-analitico` | `modelado-dimensional`, `historizacion-scd`, `elt-y-capas-de-transformacion`, `calidad-y-tests-de-datos` | 4/4 | **4/4** |

Los dos pasan la regla 4 de validación contra las clausuras reales (17 y 16 nodos respectivamente), verificado ejecutando `clausura_prerequisitos()` sobre el grafo actual.

**Hallazgo al verificarlo:** curar el checklist en vez de derivarlo de las metas no solo evita el ruido de `git` — *arregla* la debilidad de evidencia de `modelado-analitico`. Como objetivo tiene 3/5 metas con experiencia propia, pero su checklist curado tiene **4/4**, porque las dos metas flojas (`lake-vs-warehouse-vs-lakehouse`, `warehouse-gestionado`) no forman parte de lo que el reto pide, y en su lugar entran nodos fuertes de la clausura que no eran metas. Los dos retos de la Fase 1 quedan entonces con cada ítem de su checklist respaldado por una falla real.

---

## Validación (esto no es opcional)

Se suma al validador existente, que ya rechaza ciclos, prerequisitos inexistentes y `tool_slug` fuera del catálogo. Todo esto falla la carga entera **antes** de escribir a la base:

1. **Exactamente uno de `reto` o `reto_ausente` por objetivo.** Ni los dos, ni ninguno. Espejo en Python del `CHECK` de la tabla — falla temprano y con mensaje legible, en vez de como error de constraint.
2. **Checklist no vacío y sin duplicados.**
3. **Cada `node_slug` del checklist existe en el grafo.**
4. **Cada `node_slug` del checklist pertenece a la clausura de prerequisitos del objetivo** (reusa `clausura_prerequisitos()`, que ya existe). Sin esto, un reto podría pedir algo que su propia ruta nunca enseña.
5. **`url` de cada recurso de práctica bien formada, y sin duplicados por nodo.**
6. **`escenario`, `motivo_ausencia` y `por_que` no vacíos** tras `strip()` — un `>` de YAML mal indentado produce string vacío sin error de parseo.

---

## Regla de ausencia: por qué el reto que falta se muestra y el recurso que falta no

Es la decisión más sutil del diseño y la que más fácil se lee como incoherencia, así que queda escrita.

**Un objetivo sin reto se muestra, con su motivo.** Los 5 objetivos ya son públicos en el wizard de `/ruta`. Si `/practica` muestra dos y calla tres, el lector que ya vio el wizard no puede distinguir "no existe" de "está roto" u "olvidado". Además es la aplicación directa de la decisión 5 de Rumbo: el vacío se muestra redactado como progreso, y eso *suma* credibilidad en un proyecto cuyo diferenciador entero es no inventar nada.

**Un nodo sin recurso de práctica no se muestra.** Porque las dos ausencias no dicen lo mismo:

- *"No practiqué streaming"* es un hecho sobre el autor, verificable y honesto.
- *"No hay buena plataforma para practicar particionamiento"* es una afirmación sobre el mundo que el autor no puede respaldar — no sabe si no existe o si no la encontró. Publicarla sería exactamente el tipo de aserción no verificable que el proyecto evita en todos lados.

El marcador es honesto cuando la ausencia habla de vos; es una afirmación sin respaldo cuando habla del mundo.

**Consecuencia sobre `ruta-completa`:** su `motivo_ausencia` no es falta de experiencia, es que no aplica — el objetivo "Todo el rumbo" es la unión de los otros, y el reto vive en cada uno. El campo de texto libre permite decir la verdad específica de cada caso sin inventar un booleano de tres estados.

---

## Frontend

### Páginas

- **`/practica`** — índice. Arriba, las tarjetas de reto (una por objetivo; las que no tienen, en estado apagado con su motivo). Abajo, el directorio curado agrupado por nivel/categoría, omitiendo los nodos sin recurso.
- **`/practica/<objetivo>`** — un reto: escenario, checklist derivado, bloque "esto es lo que se rompe" con los `lo_vi_romperse` de sus nodos, y el bloque de expectativas (abajo). SSG con `generateStaticParams` sobre los objetivos que tienen reto, mismo patrón que las 15 rutas de `/ruta/<objetivo>/<partida>`. Un objetivo sin reto da 404, no una página vacía.

Ambas se agregan a `/api/revalidate`.

### El bloque de "no hay solución que comparar"

Va en cada página de reto, redactado como propiedad de la disciplina y no como disculpa:

> **No hay una solución que comparar.** Tu fuente, tu storage y tu forma de resolverlo van a ser distintos a los de cualquier otra persona — eso es real, no un hueco del sitio. Un pipeline se valida corriendo, no contra una plantilla. Usá el checklist como tu propio code review: si podés marcar cada punto de verdad, lo lograste.
>
> Acá no hay nadie revisando tu resultado. Si querés que otra persona lo mire, este no es el lugar.

La segunda línea es deliberada: declarar la ausencia de revisión humana en vez de insinuar un mecanismo que no existe.

### Navbar

Con Práctica el navbar llegaría a 6 ítems, y con Glosario después a 7. La decisión 13 de Rumbo bajó a 5 a propósito, pero dejó escrito que agrupar *anclas* era el problema y que **"si esas tres pasaran a ser rutas reales, agruparlas sí tendría sentido"**. Rumbo, Práctica y Glosario son rutas reales, así que se agrupan bajo **"Aprender"** — es consistente con el razonamiento de esa decisión, no una excepción a ella.

Cuidado conocido, ya documentado como *parked* en `Ruta DE.md`: la fragilidad de orden entre los dos `useEffect` del navbar. Tocarlo exige revisar que el scroll-spy siga sin romper en las páginas que no son la home.

---

## Fases

### Fase 1 — Directorio curado + los dos retos con evidencia propia

Todo lo de este diseño salvo el progreso local. Incluye:

- **Task 0, antes de una línea de código:** verificar a mano cada recurso candidato contra su URL real — que existe, que sigue vivo y que enseña lo que se dice que enseña. Mismo precedente que la Task 0 de la Fase 2 de DE Radar con los feeds RSS, que descubrió que uno estaba caído a las horas de confirmarlo.
- Campos nuevos en el YAML, modelos Pydantic y las seis reglas de validación.
- Migración `008`, `sync_roadmap()` extendido, columna en `mart_roadmap`, `mart_reto` nuevo.
- Páginas `/practica` y `/practica/<objetivo>`, navbar agrupado, revalidación.
- Retos de **`pipelines-batch`** y **`modelado-analitico`**; `motivo_ausencia` escrito para `streaming`, `plataforma-cloud` y `ruta-completa`.

*Listo cuando:* el directorio muestra solo recursos verificados; los dos retos se ven completos con su checklist y sus fallas reales; los tres objetivos sin reto muestran su motivo; y ninguna frase del checklist o de las fallas está escrita dos veces en el repo.

**Por qué los dos retos van juntos y no en fases separadas:** una vez que existe la maquinaria, el segundo reto es una entrada de YAML y cuatro líneas de prosa, no código. Separarlos pagaría dos veces el ciclo de plan, revisión y deploy por contenido puro. Y el directorio solo —realistamente 6 a 9 nodos de 34 con un recurso bueno— es una página demasiado flaca para justificar un deploy propio.

### Fase 2 — Progreso del checklist en `localStorage`

Marcar ítems del checklist y que sobrevivan a recargar. Reusa el patrón exacto de la Fase 4 de Rumbo (`useSyncExternalStore`, sin auth, sin pisar links compartidos), incluida su lección: marcar algo nuevo no puede borrar lo guardado antes.

Es genuinamente opcional — el producto está completo y desplegable sin ella.

### Fuera de alcance, con la razón escrita

Retos de `streaming` y `plataforma-cloud`. La evidencia propia por objetivo, medida contra el grafo real:

| Objetivo | Metas con `lo_vi_romperse` | Decisión |
|---|---|---|
| `pipelines-batch` | 6/6 | reto en Fase 1 (checklist curado: 5/5 con evidencia) |
| `modelado-analitico` | 3/5 | reto en Fase 1 (checklist curado: 4/4 con evidencia) |
| `streaming` | 2/4 — las dos centrales (`garantias-de-entrega`, `procesamiento-distribuido`) vacías | sin reto |
| `plataforma-cloud` | 2/9 — y las dos son periféricas (`costo`, `git`) | sin reto |
| `ruta-completa` | 8/15 | no aplica: es la unión de los otros |

Entran el día que haya experiencia real en sus nodos centrales. Escribir un reto sobre lo no practicado es exactamente el fallo que la auditoría de veracidad de Rumbo encontró tres veces (incidente real, desenlace inventado) y que costó una ronda entera de correcciones.

---

## Estrategia de pruebas

- **Validación:** un caso por cada una de las seis reglas, incluido el que importa — un objetivo con `reto` *y* `reto_ausente`, y uno sin ninguno de los dos. Un validador que nunca rechaza no está validando (decisión 17 de DE Radar).
- **Sync:** idempotencia contra Postgres real — sincronizar dos veces deja el mismo estado; sacar un recurso del YAML lo borra de la base.
- **dbt:** `not_null` sobre las claves de `mart_reto`, `relationships` de `roadmap_challenge_check.node_slug` contra `roadmap_node`, y un test singular de que ningún objetivo tenga escenario y motivo a la vez (el `CHECK` ya lo impide en escritura; el test lo verifica en el mart, que es lo que ve la web).
- **Frontend:** que `/practica` y `/practica/<objetivo>` sigan siendo estáticas tras el build (`npm run build`), igual que se verificó en las Fases 2 y 3 de Rumbo; que un objetivo sin reto dé 404; y prueba visual real en navegador, no solo compilación — precedente de la Fase 2 de Rumbo, donde el build limpio convivía con dos `<h1>` en la misma página.

## Riesgos

- **Linkrot en el directorio.** Los recursos externos se caen o cambian de tier. No se construye chequeo automático de links en v1 (YAGNI); se acepta revisión manual ocasional. Si duele, la salida natural es reusar la maquinaria de salud de fuentes que ya existe.
- **Página flaca.** Si al verificar los candidatos sobreviven muy pocos, la Parte A queda mínima. Mitigado porque los retos cargan el peso de la página, pero si quedan menos de ~5 recursos verificados vale replantear si la Parte A entra en esta fase.
- **El navbar.** Es el único cambio que toca un componente compartido por todas las páginas; una regresión ahí se ve en todo el sitio, no solo en la sección nueva.
- **Tentación futura de calificar.** El día que alguien pida "que me diga si lo hice bien", la respuesta ya está escrita acá: no. Ese es el límite que mantiene al proyecto siendo lo que es.

## Listo para planear

Este diseño está aprobado. El siguiente paso es `superpowers:writing-plans` sobre la Fase 1.
