# Avícola · Frontend

SPA de la **Granja Avícola Inteligente**: panel de control, instalaciones, inventario de aves, producción y alimentación, y gastos. Está construida con **Vue 3 (Composition API)**, **Vite**, **Pinia**, **Vue Router** y **Tailwind CSS 3**, y consume la API REST del repositorio `avicola-backend-api`.

> Este documento describe el estado actual del código para guiar futuros desarrollos. La hoja de ruta por etapas del proyecto completo vive en el `README.md` de la carpeta raíz (`Proyects-IA/`); aquí se documenta únicamente el frontend. Las reglas visuales completas están en [`DESIGN.md`](DESIGN.md).

## Contenido

1. [Puesta en marcha](#1-puesta-en-marcha)
2. [Estructura y arquitectura](#2-estructura-y-arquitectura)
3. [Autenticación, rutas y capa HTTP](#3-autenticación-rutas-y-capa-http)
4. [Catálogo de componentes reutilizables](#4-catálogo-de-componentes-reutilizables)
5. [Módulos](#5-módulos)
6. [Sistema de diseño y reglas de interfaz](#6-sistema-de-diseño-y-reglas-de-interfaz)
7. [Principios SOLID aplicados](#7-principios-solid-aplicados)
8. [Estándares de desarrollo y commits](#8-estándares-de-desarrollo-y-commits)
9. [Skills y documentos de referencia](#9-skills-y-documentos-de-referencia)
10. [Cómo agregar un módulo o componente](#10-cómo-agregar-un-módulo-o-componente)
11. [Deuda técnica conocida](#11-deuda-técnica-conocida)

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
- El proyecto **no tiene pruebas automatizadas de frontend**; la verificación se hace con `npm run build` y en el navegador.

---

## 2. Estructura y arquitectura

```
src/
├── components/
│   ├── common/        # Componentes globales reutilizables (catálogo en la sección 4)
│   ├── dashboard/     # Tarjetas del dashboard
│   ├── aves/          # AvesStats
│   └── instalaciones/ # InstalacionesStats
├── views/             # Una vista por ruta: orquestan componentes y stores
├── stores/            # Pinia: estado, filtros y mutaciones por módulo
├── services/          # Clientes HTTP (Axios), uno por módulo
├── router/            # Rutas y guardas de navegación
├── utils/format.js    # formatMoney, formatMoneyOrDash, formatDate
└── style.css          # Tokens, botones corporativos y clases de modal
```

Flujo de datos: **vista → store (Pinia) → servicio (Axios) → API.** Las vistas nunca llaman a la API directamente ni manipulan el DOM de bajo nivel.

| Capa | Responsabilidad |
|---|---|
| **Vista** | Orquesta componentes y conecta con el store |
| **Store** | Estado, filtros, paginación y acciones (`fetchX`, `addX`, `updateX`, `removeX`, `setPage`, `resetFilters`) |
| **Servicio** | Rutas y peticiones HTTP; devuelve `response.data` o `response.data.data` |
| **Componente común** | Renderiza un control y emite eventos; sin lógica de negocio |

---

## 3. Autenticación, rutas y capa HTTP

**Rutas** (`router/index.js`): `/login` (solo invitados), `/` (dashboard), `/instalaciones`, `/aves`, `/produccion` y `/gastos`. Todas menos `/login` exigen sesión; cualquier otra ruta redirige a `/`. La guarda `beforeEach` redirige a `login` si no hay token y al dashboard si un usuario autenticado entra a `/login`.

**Sesión** (`stores/auth.js`): el token Bearer y el usuario se guardan en `localStorage` (`avicola_token`, `avicola_user`). `logout` borra la sesión local aunque el backend falle.

**Cliente HTTP** (`services/api.js`): una instancia de Axios con dos interceptores. El de petición añade `Authorization: Bearer <token>`; el de respuesta, ante un **401**, limpia la sesión y redirige a `/login`.

**Formato de respuesta esperado** (lo define el backend): `{ success, message, data, meta, stats }`. `meta` alimenta el paginador y `stats` los indicadores de cada vista.

---

## 4. Catálogo de componentes reutilizables

Todos viven en `src/components/common/`. **Antes de escribir marcado nuevo, busca aquí si ya existe un componente; si un bloque se repite en dos vistas, conviértelo en un componente global y migra las copias.**

### Estructura y retroalimentación

| Componente | Para qué sirve | Props principales | Eventos |
|---|---|---|---|
| `AppHeader` | Barra superior con navegación y cierre de sesión | `subtitle` | — |
| `SectionCard` | Tarjeta con título, subtítulo y *slot* `#actions` | `title`, `subtitle` | — |
| `CollapsibleCard` | Tarjeta con cabecera desplegable accesible (`aria-expanded`/`aria-controls`) y efecto de resaltado igual al de las tarjetas de módulos | `title`, `subtitle`, `icon`, `defaultOpen` | `open`, `close` |
| `StatCard` | Tarjeta KPI | `title`, `value`, `valueColorClass` | — |
| `LoadingState` | Loader corporativo **en línea** (anillo `bosque`/`salvia` con la gallina) | `message`, `submessage` | — |
| `ActionLoader` | Overlay a pantalla completa durante mutaciones | `show`, `message`, `submessage` | — |
| `EmptyState` | Estado vacío con icono, título, texto y botón opcional | `title`, `description`, `actionLabel`, `icon` | `action` |
| `BaseAlert` | Banner `warning`, `error`, `success` o `info` | `type`, `message`, `dismissible` | `close` |
| `AlertToast` | Toast global (esquina superior derecha), montado una vez en `App.vue` | — | — |
| `ProgressBar` | Barra de progreso accesible (`role="progressbar"`) | `value`, `max`, `colorClass`, `label` | — |
| `LineChart` | Gráfico de líneas SVG multi-serie (una sola escala, tooltip, teclado, tabla accesible) | `labels`, `series`, `ariaLabel`, `height`, `labelEvery`, `loading` | — |
| `GallinaIcon` | Imagotipo corporativo | — | — |

### Modales

| Componente | Para qué sirve | Notas |
|---|---|---|
| `BaseModal` | Contenedor modal con *teleport*, centrado y *slots* `#header`, `#default`, `#footer` | Props `isOpen`, `title`, `maxWidth`, `closable`, `showHeader`; emite `close` |
| `BaseConfirmModal` | Confirmación de acciones críticas (eliminar, cancelar) | Props `isOpen`, `title`, `question`/`message`, `description`, `confirmText`, `isDestructive`, `loading`; emite `confirm`, `close`, `cancel` |
| `ConfirmStatusModal` | Confirmación de cambio de estado (habilitar o deshabilitar) con redacción contextual | Mismas props que el anterior; emite `confirm`, `close` |

### Formularios y filtros

| Componente | Para qué sirve | Notas |
|---|---|---|
| `FormField` | **Único** campo para formularios (login y modales de crear o editar) | Tipos `text`, `email`, `password`, `number`, `textarea`, `select`; muestra el error bajo el campo y lo limpia al escribir |
| `FilterBar` | Barra de filtros **dirigida por configuración** | Ver abajo |
| `FloatingInput` / `FloatingSelect` | Controles con etiqueta flotante (*notch*) para filtros; los usa `FilterBar` internamente | No validan ni muestran errores |
| `PaginationBar` | Paginador con selector de registros por página | Props `currentPage`, `lastPage`, `perPage`, `total`, `perPageOptions`, `itemLabel`; emite `update:page`, `update:perPage` |

#### `FilterBar`: cómo se usa

La vista declara los campos y la barra se dibuja sola; no se copia marcado.

```vue
<FilterBar
  v-model="store.filters"
  :fields="filterFields"
  :loading="store.loading"
  action-label="Nueva casita"
  @search="handleSearch" @clear="handleClear" @action="openCreateCasita"
/>
```

```js
const filterFields = computed(() => [
  { key: 'buscar', type: 'search', label: 'Buscar' },
  { key: 'tipo', type: 'select', label: 'Tipo de instalación', options: tipoOptions.value },
  { key: 'desde', type: 'date', label: 'Desde' },
])
```

- Tipos de campo: `search` (con lupa), `text`, `date` y `select` (requiere `options`). `show: false` oculta un campo sin quitarlo de la lista.
- Cada campo lee y escribe `modelValue[key]`; Enter en un campo de texto o fecha dispara `search`.
- La rejilla se ajusta según los campos visibles. Existen *slots* `default` y `action` para casos que no encajen.

### Utilidades (`utils/format.js`)

`formatMoney(valor)` → `$12.50`; `formatMoneyOrDash(valor)` → `—` si no hay dato; `formatDate(valor)` → `dd/mm/aaaa` en español (acepta ISO y el formato `dd-mm-aaaa` del backend). **No redefinas estas funciones en las vistas.**

---

## 5. Módulos

### 5.1 Dashboard (`DashboardView`)

Una sola petición a `GET /dashboard/resumen` (`stores/dashboard.js`), con selector de rango de 7 o 30 días. Mientras carga muestra `LoadingState` ("Consultando estadísticas…") y, si falla, un `BaseAlert` con botón *Reintentar*.

Secciones, cada una un componente de `components/dashboard/`:

| Componente | Muestra |
|---|---|
| `DashboardKpiGrid` | Población de aves, huevos sanos de hoy, alimento del mes y gastos del mes |
| `AlertasActividadCard` | Alertas operativas siempre visibles y, plegado en un `CollapsibleCard`, el historial de actividad |
| `ProduccionHuevosCard` | `LineChart` de recolectados, aprovechables y rotos, con interruptor 7 o 30 días |
| `AvesDistribucionCard` | Aves por especie y por sexo |
| `OcupacionCasitasCard` | Aves por casita y división |
| `GastosCategoriaCard` | Gasto del mes por categoría |

**Actividad reciente:** se pide a `GET /dashboard/actividad` **solo la primera vez que se abre el desplegable** y se pagina en el servidor con `PaginationBar` (5, 10 o 20 por página; el backend limita el historial a 50 eventos). Al cambiar de página se conserva el listado anterior atenuado, sin saltos de diseño.

**Colores del gráfico.** Las series usan `#2E8B57` (aprovechables), `#C98A1B` (recolectados) y `#B91C1C` (rotos), validados con el validador de la skill `dataviz` sobre fondo blanco. Los tokens `bosque`, `salvia` y `huevo` **no** superan el chequeo de luminosidad o contraste para series de datos. Van en hexadecimal porque se pintan dentro de un SVG. El validador avisa de un contraste de 2,94:1 en la línea ámbar; se compensa con leyenda, tooltip y tabla accesible.

### 5.2 Instalaciones (`InstalacionesView`)

Casitas y sus divisiones (corrales): listado con filtros, estadísticas (`InstalacionesStats`), alta y edición, habilitar o deshabilitar con `ConfirmStatusModal`, ficha de detalle con corrales y eliminación con confirmación. El backend impide eliminar una casita con divisiones o una división con aves.

### 5.3 Inventario de aves (`AvesView`)

Listado con filtros (búsqueda, especie, sexo, estado), estadísticas (`AvesStats`) y alta o edición de aves. Acciones por ave: **traslado** (con advertencia preventiva de incompatibilidad biológica antes de enviar), **historial de movimientos**, **baja** y **reactivación**. La ficha detallada tiene tres pestañas: *Ficha General*, *Control de Peso* (pesajes) y *Bitácora Sanitaria*.

### 5.4 Producción y alimentación (`ProduccionView`)

Dos pestañas: *Recolección de Huevos* y *Raciones de Alimento*. Cada una tiene su `FilterBar`, tabla, paginación, indicadores y modales de alta, edición y eliminación.

### 5.5 Gastos (`GastosView`)

Listado con filtros (búsqueda, categoría, corral y fechas), indicadores (total del filtro, total del mes y comprobantes), y alta, edición y eliminación.

### 5.6 Inicio de sesión (`LoginView`)

Formulario con `FormField`, errores por campo mapeados desde el 422 del backend y limitación de intentos (5 por minuto) en el servidor.

---

## 6. Sistema de diseño y reglas de interfaz

La fuente de verdad es [`DESIGN.md`](DESIGN.md) (modo **Operate**: interfaces para escanear datos con rapidez y poca fatiga visual).

### Paleta (tokens de Tailwind)

| Token | Hex | Uso |
|---|---|---|
| `bosque` | `#244B36` | Botones principales, navegación activa, loader |
| `salvia` | `#6F9678` | Iconos secundarios, bordes de foco, etiquetas flotantes |
| `crema` | `#F5F3EA` | Fondo general |
| `huevo` / `huevo-suave` | `#D9A441` / `#FFF1CC` | Alertas preventivas y detalles de producción |
| `tierra` | `#8B6548` | Instalaciones, gastos por categoría |
| `verdoso` / `verdoso-muted` | `#26332B` / `#526359` | Texto principal y secundario |
| `borde` | `#E4E7DF` | Bordes de tarjetas y campos |
| `destructivo` / `destructivo-bg` | `#B91C1C` / `#FEF2F2` | Bajas, eliminaciones y errores |
| Estado activo / inactivo | `#DDF3E3` / `#FEE2E2` | Badges (texto `#244B36` / `#991B1B`) |

### Reglas obligatorias

**Estructura y estilo**
- Tarjetas `rounded-2xl` con borde `borde` de 1 px. **No anidar tarjetas** dentro de tarjetas ("card inception").
- Botones principales en píldora (`.btn-principal`), secundarios `.btn-secundario`. Los botones de modales van **siempre centrados**.
- Iconos: solo **Lucide**, con trazo de 1,5 a 2 px. **Prohibido usar emojis** en menús, controles o iconos de interfaz.
- Tipografía: pila de fuentes del sistema (definida en `DESIGN.md`); títulos de página `text-2xl`/`3xl` en `font-extrabold`.
- Sin degradados morados o azules genéricos; usar los tokens de la paleta.
- Contenedor `max-w-[1600px]` con `px-4 sm:px-6 lg:px-8` y espaciado vertical `space-y-6` entre bloques.

**Formularios**
- Los formularios (login y modales) usan **siempre `FormField`**, con la etiqueta sobre el campo y **sin** etiqueta flotante.
- Error de campo: borde rojo `border-2 border-red-500`, etiqueta roja y mensaje `text-xs text-red-500` debajo; se borra al escribir. Los 422 del backend se mapean al campo correspondiente.
- Las **barras de filtros** usan `FloatingInput`/`FloatingSelect` (vía `FilterBar`), sin validación de requerido.
- Los desplegables **no** muestran una fila vacía en el menú.

**Acciones y retroalimentación**
- Toda mutación (crear, editar, eliminar, cambiar estado) muestra feedback inmediato: `ActionLoader` o `Loader2` en el botón.
- **Nunca** `confirm()` ni `alert()` del navegador: usar `BaseConfirmModal` o `ConfirmStatusModal`, y notificaciones.
- Notificaciones con `useNotificationStore`: **422** → `notify.warning`, **500 o red** → `notify.error`, **éxito** → `notify.success`.
- Cambiar el estado de un registro exige confirmación con la redacción del nuevo estado.

**Modales**
- El *backdrop* se anima **solo con opacidad**; jamás con `scale`. La escala sutil (0,96 → 1) se aplica solo a la tarjeta interior (`.modal-content-animated`).

**Gráficos** (skill `dataviz`)
- Una sola escala (nunca doble eje); marcas finas; leyenda siempre que haya dos o más series; tooltip que enriquece pero nunca es la única vía (hay tabla accesible); el texto usa tintas, no el color de la serie; validar la paleta con el validador antes de usarla.

**Accesibilidad**
- Controles interactivos alcanzables por teclado y con `aria-*` coherentes; gráficos con `role="img"` y tabla alternativa; desplegables con `aria-expanded`.

> **Consultar antes de modificar** componentes ya establecidos (por ejemplo el loader o la estructura de una tarjeta): `DESIGN.md` pide proponer el cambio y validarlo antes de aplicarlo.

---

## 7. Principios SOLID aplicados

| Principio | Cómo se aplica aquí |
|---|---|
| **S** | Vistas orquestan; stores guardan estado; servicios hacen HTTP; componentes comunes solo renderizan y emiten |
| **O** | `BaseModal`, `SectionCard` y `FilterBar` se extienden con *slots* y props sin editar su código |
| **L** | `ConfirmStatusModal` y `BaseConfirmModal` comparten contrato y son intercambiables |
| **I** | Cada componente declara solo las props y eventos que necesita, con valores por defecto seguros |
| **D** | Las vistas dependen de stores y servicios, no de detalles de Axios ni del DOM |

**DRY / reutilización.** Un bloque que aparece dos veces es candidato a componente global. Ejemplos ya resueltos: `LoadingState` (5 copias), `EmptyState` (5 copias con tres diseños), `FilterBar` por configuración (5 barras) y `utils/format` (10 copias de formato).

**Trampa conocida con props de componentes.** Un valor por defecto que sea un componente (por ejemplo un icono de Lucide) debe declararse con una función fábrica: `default: () => SearchX`. Si no, Vue lo invoca como función y el render falla.

---

## 8. Estándares de desarrollo y commits

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) en español y sin tildes, con alcance: `feat(dashboard): …`, `refactor(ui): …`, `fix(aves): …`, `style(tables): …`. El cuerpo explica el porqué y los cambios visibles.
- **Verificación:** `npm run build` debe pasar y la vista afectada debe revisarse en el navegador, incluidos los estados de carga, vacío y error, y el ancho de móvil (375 px).
- **Linters y formateadores:** ejecútalos **solo sobre los archivos que modificaste**, nunca sobre todo el proyecto.
- **Imports:** al migrar a un componente, elimina los imports que queden sin uso.
- **Antes de hacer `push`** revisa `git status` para no incluir `.env`.

---

## 9. Skills y documentos de referencia

| Recurso | Ubicación | Contenido |
|---|---|---|
| [`DESIGN.md`](DESIGN.md) | este repo | Tokens, tipografía, capas, formas, componentes y "Do's and Don'ts" |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | este repo | Resumen de paleta, componentes globales y notificaciones |
| Skill `avicola-frontend` | `Proyects-IA/.agents/skills/avicola-frontend/SKILL.md` | Estructura, SOLID, paleta y reglas estrictas de UX y formularios |
| Skill `avicola-design-system` | `Proyects-IA/.agents/skills/avicola-design-system/` | Catálogo de componentes globales y reglas de UX |
| Skill `impeccable` | `Proyects-IA/.agents/skills/impeccable/` | Guía de calidad de diseño de interfaz |
| Skill `avicola-backend` | `Proyects-IA/.agents/skills/avicola-backend/` | Contrato de la API que consume este cliente |
| Skill `dataviz` | del entorno de asistente | Método para elegir y validar gráficos y paletas |

> **Copias de la skill.** Este repo versiona `.agents/skills/avicola-frontend/SKILL.md`, pero esa copia está **desactualizada**: le falta la regla 7 (validación visual con `FormField`). La versión completa está en `Proyects-IA/.agents/skills/avicola-frontend/SKILL.md`. Conviene sincronizarlas.

---

## 10. Cómo agregar un módulo o componente

**Módulo nuevo**
1. **Servicio** en `src/services/<modulo>.js` con las rutas del backend.
2. **Store** en `src/stores/<modulo>.js` con estado, `filters`, `meta`, `stats` y acciones (sigue el patrón de `stores/gastos.js`).
3. **Vista** en `src/views/` y su ruta en `router/index.js` con `meta: { requiresAuth: true }`; añade la entrada a `AppHeader`.
4. **Reutiliza**: `FilterBar` para filtros, `LoadingState`, `EmptyState`, `PaginationBar`, `StatCard`, `BaseModal` + `FormField` para formularios y `BaseConfirmModal` para eliminar.
5. **Notificaciones** con `useNotificationStore` y errores 422 mapeados a los campos.
6. Componentes propios del módulo en `src/components/<modulo>/`.

**Componente común nuevo**
1. Confirma con una búsqueda que no existe ya (ni como componente ni como bloque copiado).
2. Créalo en `src/components/common/` con props tipadas, valores por defecto seguros, *slots* para extenderlo y eventos para comunicarse.
3. Aplica los tokens de la paleta y las reglas de la sección 6.
4. Migra **todas** las copias existentes en la misma tarea.

---

## 11. Deuda técnica conocida

Estas observaciones están **sin resolver**; conviene tratarlas antes de seguir ampliando el proyecto.

- **Componentes por extraer** (patrones aún repetidos en las vistas): badges de estado (`StatusBadge`), botones de acción por fila (`RowActionButton`), encabezado de página (`PageHeader`), mapeo de errores 422 a campos (composable `useFormErrors`), esqueleto de tabla (`DataTable`) y los modales de formulario, que hoy viven dentro de las vistas.
- **Vistas muy grandes:** `AvesView` (~1.700 líneas), `ProduccionView` (~1.100) e `InstalacionesView` (~850). La skill propone separar por carpetas de módulo (`components/aves/`, `components/gastos/`…).
- **`FloatingInput` dentro de modales:** Aves y Gastos todavía lo usan en formularios, y la regla indica `FormField`.
- **`AppHeader` a 768 px:** la barra de navegación desborda horizontalmente en ese ancho.
- **`PaginationBar` pinta todas las páginas** como botones; con listados largos no recorta. En la actividad del dashboard se contiene envolviéndolo en un contenedor con scroll horizontal.
- **Sombra `shadow-xs`:** no es una utilidad estándar de Tailwind 3; en las tarjetas medidas no produce sombra visible.
- **Código muerto en Producción:** los interruptores `showSearchFilterHuevos` y `showSearchFilterAlimentacion` nunca se activan, por lo que el buscador libre de ambas secciones permanece oculto.
- **Estado vacío momentáneo:** al cambiar a la pestaña *Raciones de Alimento* se ve un instante el estado vacío antes de que empiece a cargar.
- **Copia desactualizada del skill** `avicola-frontend` dentro de este repo (ver sección 9).
- **Sin pruebas de frontend.**
