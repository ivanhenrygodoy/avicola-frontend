# Avícola · Frontend

SPA de la **Granja Avícola Inteligente**: panel de control, instalaciones, inventario de aves, producción y alimentación, control de gastos operativos, el asistente virtual AviaCore y el módulo Benchmark AviaCore (auditoría del asistente). Está construida con **Vue 3 (Composition API)**, **Vite**, **Pinia**, **Vue Router** y **Tailwind CSS 3**, y consume la API REST del repositorio `avicola-backend-api`.

> Este documento describe el estado actual del código para guiar futuros desarrollos. La hoja de ruta por etapas del proyecto completo vive en el `README.md` de la carpeta raíz (`Proyects-IA/`); aquí se documenta únicamente el frontend. Las reglas visuales completas están en [`DESIGN.md`](DESIGN.md).

## Contenido

1. [Puesta en marcha](#1-puesta-en-marcha)
2. [Estructura y arquitectura](#2-estructura-y-arquitectura)
3. [Autenticación, rutas y capa HTTP](#3-autenticación-rutas-y-capa-http)
4. [Catálogo de componentes reutilizables](#4-catálogo-de-componentes-reutilizables)
5. [Composables reutilizables](#5-composables-reutilizables)
6. [Módulos](#6-módulos)
7. [Sistema de diseño y reglas de interfaz](#7-sistema-de-diseño-y-reglas-de-interfaz)
8. [Principios SOLID aplicados](#8-principios-solid-aplicados)
9. [Estándares de desarrollo y commits](#9-estándares-de-desarrollo-y-commits)
10. [Skills y documentos de referencia](#10-skills-y-documentos-de-referencia)
11. [Cómo agregar un módulo o componente](#11-cómo-agregar-un-módulo-o-componente)
12. [Estado de deuda técnica](#12-estado-de-deuda-técnica)

---

## 1. Puesta en marcha

Requisitos: Node.js 20 o superior y el backend corriendo (por defecto en `http://localhost:8005`).

```bash
cp .env.example .env     # define VITE_API_URL
npm install
npm run dev              # http://localhost:5173
```

| Script | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite (puerto 5173) |
| `npm run build` | Compilación de producción en `dist/` |
| `npm run preview` | Sirve el build localmente |

- **`VITE_API_URL`** debe apuntar a la API, por ejemplo `http://localhost:8005/api/v1`. Si no se define, `services/api.js` usa `http://localhost:8000/api/v1`, que **no** es el puerto del backend en Docker.
- **CORS:** el backend solo permite los orígenes `http://localhost:5173` y `http://127.0.0.1:5173`. Si ejecutas Vite en otro puerto (`--port`), las peticiones serán rechazadas hasta que se añada ese origen en `avicola-backend-api/config/cors.php`.
- Usuario de desarrollo (tras sembrar el backend): `admin@granja.local` / `password123`.
- Verificación de calidad: se ejecuta mediante `npm run build` (cero errores de compilación) y validación en navegador.

---

## 2. Estructura y arquitectura

```text
src/
├── components/
│   ├── common/        # Componentes globales reutilizables (DataTable, PageHeader, StatusBadge...)
│   ├── dashboard/     # Tarjetas analíticas del panel de control
│   ├── aves/          # AvesStats y modales del inventario avícola
│   ├── instalaciones/ # InstalacionesStats y modales de casitas/corrales
│   ├── produccion/    # Modales de registro de huevos y raciones
│   ├── gastos/        # Modales de registro de gastos operativos
│   ├── asistente/     # Widget conversacional AviaCore
│   └── benchmark/     # Tarjetas de estadísticas y modal de detalle del Benchmark
├── composables/       # Lógica desacoplada reutilizable (useActionLoader, useConfirmAction, useFormErrors)
├── views/             # Vistas por ruta: orquestan componentes y stores (ligeras, ~150-400 líneas)
├── stores/            # Pinia: estado, filtros y mutaciones por módulo
├── services/          # Clientes HTTP (Axios), uno por módulo
├── router/            # Rutas y guardas de navegación
├── utils/format.js    # formatMoney, formatMoneyOrDash, formatDate, toInputDate
├── utils/benchmark.js # Etiquetas y variantes de badge del Benchmark (resultado, acción, fase)
└── style.css          # Tokens, botones corporativos y clases de animación
```

Flujo de datos: **vista → store (Pinia) → servicio (Axios) → API.** Las vistas actúan únicamente como orquestadoras limpias y nunca manipulan el DOM directamente ni contienen lógica duplicada de tablas o modales.

| Capa | Responsabilidad |
|---|---|
| **Vista** | Orquesta componentes visuales, expone loaders y conecta eventos con el store |
| **Modales de módulo** | Encapsulan su propio formulario, errores reactivos, validación y envío |
| **Store** | Estado reactivo, filtros, paginación y mutaciones (`fetchX`, `addX`, `updateX`, `removeX`) |
| **Servicio** | Endpoints y peticiones HTTP con Axios; devuelve `response.data` o `response.data.data` |
| **Componentes comunes** | Renderizan controles y emiten eventos de forma pura sin acoplamiento a negocio |
| **Composables** | Encapsulan patrones repetitivos de UI (errores 422, overlays de carga, confirmaciones) |

---

## 3. Autenticación, rutas y capa HTTP

**Rutas** (`router/index.js`): `/login` (solo invitados), `/` (dashboard), `/instalaciones`, `/aves`, `/produccion`, `/gastos` y `/benchmark`. Todas menos `/login` exigen sesión; cualquier otra ruta redirige a `/`. La guarda `beforeEach` redirige a `login` si no hay token y al dashboard si un usuario autenticado entra a `/login`.

**Sesión** (`stores/auth.js`): el token Bearer y el usuario se guardan en `localStorage` (`avicola_token`, `avicola_user`). `logout` borra la sesión local aunque el backend falle.

**Cliente HTTP** (`services/api.js`): una instancia de Axios con dos interceptores:
1. **Petición:** Añade encabezado `Authorization: Bearer <token>`.
2. **Respuesta:** Ante un código **401**, limpia la sesión y redirige a `/login`.

**Formato estándar de respuestas:** `{ success, message, data, meta, stats }`. `meta` alimenta `PaginationBar` o `DataTable`, y `stats` las tarjetas de indicadores.

---

## 4. Catálogo de componentes reutilizables

Todos viven en `src/components/common/`. **Antes de escribir marcado nuevo, consulta este catálogo.**

### Estructura y Navegación

| Componente | Para qué sirve | Props principales | Eventos |
|---|---|---|---|
| `AppHeader` | Barra superior con navegación activa y badge de usuario responsivo | `subtitle` | — |
| `PageHeader` | Encabezado corporativo de vista (título Display, subtítulo y slot `#actions`) | `title`, `subtitle`, `align`, `bordered` | — |
| `SectionCard` | Tarjeta con título, subtítulo y slot `#actions` | `title`, `subtitle` | — |
| `CollapsibleCard` | Tarjeta con cabecera desplegable accesible (`aria-expanded`/`aria-controls`) | `title`, `subtitle`, `icon`, `defaultOpen` | `open`, `close` |
| `StatCard` | Tarjeta KPI para indicadores clave | `title`, `value`, `valueColorClass` | — |
| `PillTabs` | Interruptor de pestañas tipo píldora (el de "Recolección de Huevos / Raciones de Alimento"), con `role="tablist"` | `modelValue` (`v-model`), `tabs` (`[{ value, label, icon }]`), `ariaLabel` | `update:modelValue` |
| `RangeToggle` | Selector compacto de rango (7 / 30 días) con píldoras pequeñas | `modelValue` (`v-model`), `options`, `unitLabel`, `loading`, `ariaLabel` | `update:modelValue` |

> `PillTabs` y `RangeToggle` nacieron con el módulo Benchmark a partir de marcado que hoy sigue copiado en `ProduccionView` (interruptor de pestañas) y `ProduccionHuevosCard` (píldoras 7/30). Su migración está pendiente, ver [deuda técnica](#12-estado-de-deuda-técnica).

### Tablas y Listados

| Componente | Para qué sirve | Props principales | Eventos |
|---|---|---|---|
| `DataTable` | Tabla completa dirigida por columnas con cabecera, slots `#cell-<key>`, `LoadingState`, `EmptyState` y `PaginationBar` | `columns`, `rows`, `rowKey`, `loading`, `meta`, `itemLabel`, `emptyTitle` | `update:page`, `update:perPage`, `empty-action` |
| `RowActionButton` | Botón táctil (34px) para filas de tabla o listados, con tooltip accesible y tonos visuales | `icon`, `title`, `tone` (`neutral`, `edit`, `danger`, `success`), `size` (`md`, `sm`) | Eventos nativos `@click` |
| `StatusBadge` | Píldora de estado o categoría con paleta estandarizada | `variant` (`success`, `danger`, `warning`, `info`, `alert`, `neutral`, `outline`), `size`, `as` (`span`, `button`) | Eventos nativos `@click` |
| `PaginationBar` | Paginador responsivo con selector de registros y ventana deslizante con `…` | `currentPage`, `lastPage`, `perPage`, `total`, `itemLabel` | `update:page`, `update:perPage` |

### Formularios y Filtros

| Componente | Para qué sirve | Notas |
|---|---|---|
| `FormField` | **Único campo para formularios** (login y modales de crear o editar) | Tipos `text`, `email`, `password`, `number`, `date`, `textarea`, `select`. Etiqueta sobre el campo (sin notch). Muestra error en rojo bajo el campo y lo limpia reactivamente al escribir |
| `FilterBar` | Barra de filtros **dirigida por configuración** | Recibe `fields` (`search`, `select`, `date`), dibuja los inputs flotantes automáticamente y reserva la botonera con `shrink-0` |
| `FloatingInput` / `FloatingSelect` | Controles con etiqueta flotante (*notch*) para filtros | Utilizados internamente por `FilterBar`; sin validación de requerido |

### Retroalimentación y Diálogos

| Componente | Para qué sirve | Notas |
|---|---|---|
| `LoadingState` | Spinner corporativo bicromático en línea con imagotipo `GallinaIcon` | Para tablas, tarjetas y cargas parciales |
| `ActionLoader` | Overlay a pantalla completa durante mutaciones asíncronas | Se activa de forma global mediante `provideActionLoader()` |
| `EmptyState` | Estado visual para listas vacías con icono, título, descripción y acción opcional | Integrado en `DataTable` |
| `BaseModal` | Contenedor modal con teleport, anchos adaptativos (`xs` a `7xl`) y centrado vertical | Props `isOpen`, `title`, `maxWidth`, `closable`, `showHeader`; emite `close` |
| `BaseConfirmModal` | Confirmación modal de acciones destructivas o críticas | Props `isOpen`, `title`, `question`, `description`, `confirmText`, `loading`; emite `confirm`, `close` |
| `ConfirmStatusModal` | Confirmación contextual de cambio de estado (activar / desactivar) | Mismo contrato que `BaseConfirmModal` |
| `BaseAlert` | Banner informativo, de advertencia o error en página | Props `type`, `message`, `dismissible`; emite `close` |
| `AlertToast` | Contenedor de notificaciones toast flotantes | Conectado a `useNotificationStore` |

---

## 5. Composables reutilizables

Ubicados en `src/composables/`, encapsulan patrones transversales para mantener las vistas limpias y modulares:

### `useActionLoader`
Patrón *provide/inject* para el overlay de mutación a pantalla completa:
* La vista ejecuta `const { isSubmitting, message, run } = provideActionLoader()` y coloca un único `<ActionLoader :is-open="isSubmitting" :message="message" />`.
* Cualquier modal hijo invoca `const { run } = useActionLoader()` y envuelve sus peticiones:
  ```js
  await run('Guardando ave...', () => avesStore.addAve(payload))
  ```

### `useFormErrors`
Manejo reactivo de errores en formularios (`FormField`):
```js
const errors = useFormErrors(['codigo', 'id_especie', 'id_sexo'])
errors.clear()                      // Reinicia errores
errors.set('codigo', 'Obligatorio') // Asigna error local
errors.applyServerErrors(err)       // Mapea automáticamente el objeto `errors` de un 422 del backend
```

### `useConfirmAction`
Flujo declarativo para confirmaciones críticas:
```js
const eliminar = useConfirmAction({
  mensajeCarga: (ave) => `Eliminando ave ${ave.codigo}...`,
  accion: (ave) => avesStore.removeAve(ave.id),
  mensajeExito: 'Ave eliminada correctamente.',
  mensajeError: 'No se pudo eliminar el ave.',
})
```

---

## 6. Módulos

### 6.1 Dashboard (`DashboardView.vue`)
* Consume `GET /dashboard/resumen` con selector temporal de 7 o 30 días.
* Compuesto por componentes especializados en `components/dashboard/`:
  * `DashboardKpiGrid`: KPIs consolidados.
  * `AlertasActividadCard`: Alertas activas y feed plegable de actividad reciente (`GET /dashboard/actividad`).
  * `ProduccionHuevosCard`: Gráfica multi-serie `LineChart` (aprovechables, recolectados, rotos).
  * `AvesDistribucionCard`: Gráficos de barras de población por especie y sexo.
  * `OcupacionCasitasCard`: Nivel de aforo de aves por casita y división.
  * `GastosCategoriaCard`: Desglose del presupuesto mensual por rubro financiero.

### 6.2 Instalaciones (`InstalacionesView.vue`)
* Vista orquestadora de casitas y divisiones con `PageHeader`, `DataTable` y filtros.
* Modales modulares en `components/instalaciones/`:
  * `CasitaFormModal.vue`: Alta y edición de casita con selector de granja.
  * `DivisionFormModal.vue`: Alta y edición de corrales/divisiones.
  * `CasitaDetalleModal.vue`: Ficha técnica de casita con listado de divisiones y accesos rápidos.

### 6.3 Inventario de Aves (`AvesView.vue`)
* Vista orquestadora del censo avícola con `DataTable` y `RowActionButton` para acciones directas.
* Modales modulares en `components/aves/`:
  * `AveFormModal.vue`: Registro y edición con catálogos `ctl_especie`, `ctl_sexo` y `ctl_proposito`.
  * `AveTrasladoModal.vue`: Traslado entre corrales con validación preventiva de segregación biológica.
  * `AveMovimientosModal.vue`: Historial cronológico de traslados con motivo y casitas de origen/destino.
  * `AveDetalleModal.vue`: Ficha técnica con pestañas (*Ficha General*, *Control de Peso*, *Bitácora Sanitaria*).
  * `AveBajaModal.vue`: Salida o baja de ave con captura de motivo y observaciones.
  * `AveReactivarModal.vue`: Reactivación de ave con asignación opcional de corral de reingreso.

### 6.4 Producción y Alimentación (`ProduccionView.vue`)
* Pestañas para *Recolección de Huevos* y *Raciones de Alimento*.
* Modales modulares en `components/produccion/`:
  * `HuevoFormModal.vue`: Registro de recolección diaria con cálculo de aprovechables.
  * `AlimentacionFormModal.vue`: Suministro de ración por corral y tipo de alimento (`ctl_tipos_alimento`).

### 6.5 Finanzas y Gastos (`GastosView.vue`)
* Control de egresos con KPIs de presupuesto y tabla con `DataTable`.
* Modal modular en `components/gastos/`:
  * `GastoFormModal.vue`: Registro y edición de comprobantes por categoría (`ctl_categorias_gastos`).

### 6.6 Inicio de Sesión (`LoginView.vue`)
* Formulario protegido con `FormField` y gestión de errores contra el endpoint `POST /auth/login`.

### 6.7 Asistente Virtual AviaCore (`AsistenteChatWidget.vue`)
* Widget conversacional flotante global montado en `App.vue` para usuarios autenticados.
* Identidad corporativa **AviaCore** con imagotipo oficial [`GallinaIcon.vue`](src/components/common/GallinaIcon.vue) en el botón flotante, cabecera modal, estado inicial y avatar de respuestas.
* Consume `POST /asistente/chat` con historial reactivo administrado por el store `useAsistenteStore` (`stores/asistente.js`).
* Componentes especializados en `components/asistente/`:
  * `AsistenteChatWidget.vue`: Botón circular con pulso activo, ventana emergente accesible, atajos de teclado (Enter para enviar) y sugerencias rápidas operativas y zootécnicas.
  * `AsistenteMensaje.vue`: Renderizado de markdown ligero (negritas, viñetas, saltos), avatar institucional y badges transparentes de auditoría de herramientas (`consultar_inventario_aves`, `consultar_produccion_huevos`, `consultar_gastos_periodo`, `consultar_ubicacion_ave`, `consultar_raciones_alimento` y **`Manuales técnicos zootécnicos`** para consultas RAG sobre patos, pavos y gallinas).
  * `AsistenteIndicador.vue`: Indicador animado de estado de pensamiento y ejecución de herramientas en color salvia corporativo.
* El store genera un `uuidConversacion` anónimo (`crypto.randomUUID`, no deriva del usuario) al crearse y al limpiar la conversación, y lo envía en cada mensaje como `uuid_conversacion` para que el Benchmark agrupe los turnos de una misma conversación. Si el navegador no lo soporta (contextos no seguros), simplemente no se envía y el chat sigue funcionando.
* Documentación técnica y de diseño: [`DESIGN.md`](DESIGN.md) y arquitectura detallada en `docs/aviacore-arquitectura-harness.md` y `docs/aviacore-rag-embeddings.md`.

### 6.8 Benchmark AviaCore (`BenchmarkView.vue`)
Auditoría de las interacciones entre los operarios y el asistente, organizada como Producción: un `PageHeader` con `PillTabs` que alterna entre dos secciones. Consume `GET /asistente/benchmark/*` (solo lectura) mediante `services/benchmark.js` y el store `useBenchmarkStore`. El acceso es para cualquier usuario autenticado y **no muestra quién escribió cada mensaje** (la bitácora no lo guarda).

* **Estadísticas:** selector de 7 o 30 días (`RangeToggle`) que gobierna toda la sección.
  * 4 `StatCard`: interacciones, tasa de éxito, tokens consumidos (con promedio por turno) y latencia promedio.
  * 2 gráficos por día con `SerieDiariaCard` (`SectionCard` + `LineChart`): interacciones (exitosas, bloqueadas por guard, con error) y tokens (prompt y respuesta).
  * 3 rankings con `RankingCard` (`ProgressBar`): resultado de las interacciones (con %), guards más activados y herramientas más usadas. Los dos últimos son clicables: abren la pestaña de logs ya filtrada por ese guard o herramienta.
* **Logs del agente:** 4 `StatCard` del filtro vigente, `FilterBar` (texto, resultado, guard, herramienta, desde y hasta) y `DataTable` con `PaginationBar` integrada (fecha, mensaje, resultado como `StatusBadge`, tokens, duración, guards y acción *Ver detalle*).
* Componentes en `components/benchmark/`:
  * `SerieDiariaCard.vue`: tarjeta con gráfico de líneas por día (se usa dos veces).
  * `RankingCard.vue`: tarjeta con lista de barras, opcionalmente clicable y con porcentaje (se usa tres veces).
  * `LogDetalleModal.vue`: auditoría de un turno sobre `BaseModal`: mensaje del operario, prompt del sistema (`CollapsibleCard`, avisa si el prompt cambió desde esa interacción), respuesta del agente (y la original del modelo si un guard la reemplazó), herramientas con las tablas consultadas, guardrails aplicados, tokens y error. **Todo el texto se muestra con interpolación `{{ }}`, nunca como HTML**, porque proviene del operario o del modelo.
* `LimpiezaHistoricoModal.vue`: depuración manual del histórico antiguo del asistente sobre `BaseModal` con `RangeToggle` en píldoras (tamaño `md` con 3, 6 y 12 meses): banner con tokens `destructivo`/`destructivo-bg`, vista previa de registros a eliminar antes de confirmar (`aria-live="polite"`), botón bloqueado si hay 0 registros o carga en curso, y confirmación destructiva con `useActionLoader` y `notify`.
* `utils/benchmark.js` es la fuente única de etiquetas y variantes de `StatusBadge` para resultado, acción y fase de los guards, y opciones de meses para la depuración (`MESES_DEPURACION = [3, 6, 12]`).
* **Store (`stores/benchmark.js`):** solo la última petición de cada recurso (estadísticas, logs, detalle) puede escribir en el estado, así una respuesta lenta no pisa a una posterior al cambiar de rango, filtrar rápido o abrir otro log. Los errores de carga se muestran con `BaseAlert`. Al volver a una pestaña se recargan sus datos, porque las interacciones llegan mientras la vista está abierta.

---

## 7. Sistema de diseño y reglas de interfaz

La fuente de verdad estética es [`DESIGN.md`](DESIGN.md) (modo **Operate**: interfaces profesionales optimizadas para ergonomía operativa y baja fatiga visual).

### Paleta Normativa (Tokens de Tailwind)

| Token | Hex | Propósito |
|---|---|---|
| `bosque` | `#244B36` | Botones principales, navegación activa, spinner institucional |
| `salvia` | `#6F9678` | Iconos de acción, bordes activos, etiquetas de filtros |
| `crema` | `#F5F3EA` | Fondo ambiental cálido del viewport |
| `huevo` / `huevo-suave` | `#D9A441` / `#FFF1CC` | Producción de postura y alertas preventivas |
| `tierra` | `#8B6548` | Mantenimiento físico, acento de edición |
| `verdoso` / `verdoso-muted` | `#26332B` / `#526359` | Textos principales y secundarios (contraste AAA) |
| `borde` | `#E4E7DF` | Delimitación sutil de tarjetas y tablas |
| `destructivo` / `destructivo-bg` | `#B91C1C` / `#FEF2F2` | Bajas, eliminaciones y estados de error |

### Reglas Obligatorias de Interfaz

1. **Estructura:**
   * Contenedor global `max-w-[1600px]` con `px-4 sm:px-6 lg:px-8` y ritmo vertical `space-y-6`.
   * Tarjetas con `rounded-2xl`, borde `borde` de 1px y sombra suave (`shadow-xs` / `shadow-2xs`).
   * Botones de modales **siempre centrados horizontalmente**.
2. **Formularios:**
   * **Todo modal o formulario de entrada de datos debe usar exclusivamente `FormField`** con etiqueta superior.
   * Prohibido usar etiquetas flotantes o notch en formularios de alta/edición.
   * Errores de validación se muestran con borde rojo (`border-2 border-red-500`) y mensaje inferior en texto rojo, limpiándose inmediatamente al escribir (`@input`).
   * `FloatingInput` y `FloatingSelect` están reservados exclusivamente para las barras de filtrado (`FilterBar`).
3. **Tablas:**
   * Cero negrita en celdas `<td>`. El texto se muestra en peso regular (`font-normal`).
   * Categorías y tipos se presentan en texto plano sin etiquetas saturadas.
   * Botones de fila usan `RowActionButton` para garantizar tamaño táctil de 34px y estados de foco accesibles.

---

## 8. Principios SOLID aplicados

* **S (Responsabilidad Única):** Las vistas orquestan; los modales manejan su formulario; los componentes comunes solo renderizan; los composables gestionan la lógica repetitiva; los stores conservan el estado.
* **O (Abierto/Cerrado):** `DataTable`, `FilterBar`, `PageHeader` y `BaseModal` se extienden mediante props y slots sin alterar su implementación base.
* **L (Sustitución de Liskov):** `ConfirmStatusModal` y `BaseConfirmModal` comparten el mismo contrato de props y eventos.
* **I (Segregación de Interfaces):** Los componentes reciben únicamente las props estrictamente necesarias con valores por defecto seguros.
* **D (Inversión de Dependencias):** Los componentes y vistas interactúan a través de composables, stores y eventos, sin atarse a instancias directas del DOM ni clientes HTTP de bajo nivel.

---

## 9. Estándares de desarrollo y commits

* **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) en español y sin tildes: `refactor(ui): …`, `feat(modulo): …`, `fix(vista): …`, `style(tablas): …`.
* **Verificación:** Todo cambio debe superar `npm run build` limpiamente antes de comitearse.
* **Limpieza:** Al migrar o extraer componentes, eliminar imports huérfanos y variables en desuso.

---

## 10. Skills y documentos de referencia

| Recurso | Ubicación | Contenido |
|---|---|---|
| [`DESIGN.md`](DESIGN.md) | Raíz del frontend | Tokens, jerarquías tipográficas, reglas cromáticas y Do's & Don'ts |
| Skill `avicola-frontend` | `.agents/skills/avicola-frontend/SKILL.md` | Reglas de arquitectura, componentes globales y validación visual con `FormField` |
| Skill `impeccable` | Configuración global | Guía de excelencia y pulido de interfaces en modo *Operate* |
| Skill `dataviz` | Entorno de desarrollo | Guía de contraste y selección de gráficos para el dashboard |
| Diseño y plan del Benchmark | `Proyects-IA/docs/superpowers/specs/` y `plans/` | Diseño, plan de implementación del Benchmark y plan de depuración de logs |

---

## 11. Cómo agregar un módulo o componente

### Para un Módulo Nuevo:
1. Crear cliente HTTP en `src/services/<modulo>.js`.
2. Crear store Pinia en `src/stores/<modulo>.js` con `state`, `filters`, `meta`, `stats` y acciones.
3. Crear componentes modulares y modales en `src/components/<modulo>/`.
4. Crear la vista orquestadora en `src/views/<Modulo>View.vue` utilizando `PageHeader`, `FilterBar`, `DataTable`, `RowActionButton` y `provideActionLoader`.
5. Registrar la ruta protegida en `src/router/index.js` y el enlace en `src/components/common/AppHeader.vue`.

### Para un Componente Común:
1. Verificar que no exista en `src/components/common/`.
2. Declarar props tipadas, valores por defecto seguros y slots extensibles.
3. Aplicar tokens normativos de `DESIGN.md`.

---

## 12. Estado de deuda técnica

### Aspectos Resueltos en la Refactorización Reciente ✅
* **Extracción Modular:** Se extrajeron los modales de todas las vistas (`AvesView`, `InstalacionesView`, `ProduccionView`, `GastosView`) hacia carpetas modulares especializadas.
* **Reducción de Vistas:** Las vistas se redujeron entre un 38% y un 80% (todas bajo las 415 líneas).
* **Estandarización de Formularios:** Se erradicó el uso de `FloatingInput` dentro de modales; ahora todos usan `FormField` con validación y borde rojo reactivo.
* **Componentes de Tabla:** Se unificaron las tablas mediante `DataTable.vue`, `RowActionButton.vue` y `StatusBadge.vue`.
* **Desborde en Encabezado:** Se ajustó el breakpoint responsivo de `AppHeader.vue` a `lg`, eliminando el desborde a 768px.
* **Paginación Inteligente:** `PaginationBar.vue` ahora implementa recorte con ventana deslizante (`…`).
* **Soporte de Sombras:** Se integraron `shadow-xs` y `shadow-2xs` en `tailwind.config.js`.
* **Módulo Benchmark AviaCore:** Se agregó la vista `/benchmark` reutilizando `DataTable`, `FilterBar`, `StatCard`, `SectionCard`, `LineChart`, `ProgressBar`, `BaseModal`, `CollapsibleCard` y `BaseAlert`, más los componentes globales `PillTabs` y `RangeToggle`.

### Puntos Pendientes para Futuras Iteraciones ⏳
* **Pruebas Automatizadas de Frontend:** Incorporar suite de pruebas de componentes (Vitest / Vue Test Utils). El módulo Benchmark se verificó con `npm run build` y en navegador, pero no tiene pruebas automáticas (por ejemplo, de las condiciones de carrera del store).
* **Migrar Producción a `PillTabs` y `RangeToggle`:** `ProduccionView.vue` (interruptor de pestañas) y `ProduccionHuevosCard.vue` (píldoras 7/30) todavía llevan ese marcado copiado. Los componentes globales ya existen y reproducen las mismas clases; falta reemplazarlo, con visto bueno porque son pantallas establecidas (DESIGN.md pide consultar antes de alterarlas).
* **Accesibilidad de `PillTabs`:** usa `role="tablist"`/`role="tab"` pero sin `role="tabpanel"`, `aria-controls` ni navegación con flechas.
* **Colores del modal de Benchmark:** `LogDetalleModal.vue` usa clases `amber-*` y `red-*` de Tailwind donde DESIGN.md define los tokens `huevo`/`huevo-suave` y `destructivo`/`destructivo-bg`.
* **Parpadeo de Estado Vacío en Raciones:** Al alternar a la pestaña *Raciones de Alimento* en Producción, optimizar la inicialización del estado para evitar el flash del mensaje vacío previo a la carga.
