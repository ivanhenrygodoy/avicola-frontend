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

**Rutas** (`router/index.js`): `/login` (solo invitados) y, bajo el layout `AppLayout` (sidebar + barra superior), `/` (dashboard), `/instalaciones`, `/aves`, `/produccion`, `/gastos`, `/benchmark`, `/usuarios` y `/permisos`. Cada ruta de módulo declara `meta.modulo` (la clave del permiso) y `meta.subtitle` (el subtítulo de la barra superior). Cualquier otra ruta redirige a `/`.

La guarda `beforeEach` aplica tres reglas: sin token → `login`; un autenticado en `/login` → su primer módulo permitido; y si la ruta pide un módulo que el usuario no tiene → lo manda al Dashboard (o al primer módulo que sí tenga) con el aviso «Ya no tienes acceso a ese módulo.». Un usuario sin ningún módulo vuelve al login en vez de entrar en bucle.

**Sesión** (`stores/auth.js`): el token Bearer y el usuario (con su `rol`, el árbol `modulos`, la lista `permisos` y `debe_cambiar_password`) se guardan en `localStorage` (`avicola_token`, `avicola_user`). Getters y acciones útiles: `puede(clave)`, `modulos`, `esSuperAdmin`, `cambiarPassword(...)` (cierra la sesión al terminar bien) y `mantenerPassword()`. `main.js` vuelve a pedir `me` **antes de montar el router**, para que el menú y la guarda partan de permisos frescos y no de los guardados. `logout` borra la sesión local aunque el backend falle.

**Cliente HTTP** (`services/api.js`): una instancia de Axios con dos interceptores:
1. **Petición:** Añade encabezado `Authorization: Bearer <token>`.
2. **Respuesta:** Ante un código **401**, limpia la sesión y redirige a `/login`. Ante un **403** con el mensaje de módulo denegado, vuelve a pedir `me`, actualiza el menú y, si la ruta actual ya no está permitida, lleva al usuario a un destino permitido con el aviso «Ya no tienes acceso a ese módulo.»; nunca muestra el error crudo.

**Navegación y permisos.** El sidebar (`AppSidebar`) se arma solo con el árbol `modulos` que devuelve el servidor; la ocultación es comodidad y la seguridad es el 403 del backend. «Asistente IA» es un grupo expandible con «Benchmark» dentro, que solo aparece si el usuario tiene ese módulo; si no tiene ningún hijo visible, el grupo no se muestra. El chat flotante solo existe con el permiso `asistente`.

| Rol | Acceso |
|---|---|
| `super_admin` | Todo, incluidas **Usuarios** y **Permisos** |
| `operario` | Dashboard, Instalaciones, Inventario de Aves, Producción, Gastos y el chat; **Benchmark solo si el superAdmin se lo otorga** |

**Gestión (solo superAdmin).** `Usuarios` lista cuentas con rol, estado y estado de las credenciales (`Enviando…`, `Enviadas`, `Falló el envío`); permite crear (el correo con la contraseña temporal sale por una cola del servidor), activar o desactivar y reenviar credenciales. Las acciones sobre uno mismo y sobre el único superAdmin activo quedan deshabilitadas con la razón en el `title`. `Permisos` muestra la matriz rol × módulo: los módulos base van bloqueados, el rol super en solo lectura y solo el Benchmark tiene interruptor.

**Primer ingreso.** Si el usuario entró con una contraseña temporal, `PrimerIngresoModal` ofrece **Cambiar contraseña** (formulario; al terminar se cierran todas las sesiones y vuelve al login) o **Mantener esta contraseña**. Es un aviso suave: se puede cerrar con Escape o fuera del modal sin elegir y reaparece en el siguiente inicio de sesión.

**Formato estándar de respuestas:** `{ success, message, data, meta, stats }`. `meta` alimenta `PaginationBar` o `DataTable`, y `stats` las tarjetas de indicadores.

---

## 4. Catálogo de componentes reutilizables

Todos viven en `src/components/common/`. **Antes de escribir marcado nuevo, consulta este catálogo.**

### Estructura y Navegación

| Componente | Para qué sirve | Props principales | Eventos |
|---|---|---|---|
| `AppLayout` | Layout de las rutas autenticadas: barra superior + sidebar + vista (`RouterView`); monta el aviso de primer ingreso | — | — |
| `AppSidebar` | Menú lateral colapsable armado con los módulos que el servidor concede; en móvil (< `lg`) es un panel superpuesto con fondo que se cierra al navegar. Estado abierto/cerrado en `stores/navegacion.js` (`localStorage`, con `try/catch`) | — | — |
| `AppHeader` | Barra superior fija de lado a lado: hamburguesa del sidebar, logo y título siempre anclados a la izquierda, nombre del usuario y «Cerrar sesión» a la derecha | `subtitle` | — |
| `PrimerIngresoModal` / `CambiarPasswordModal` | Aviso de contraseña temporal y formulario para cambiarla | `isOpen` | `close` |
| `PageHeader` | Encabezado corporativo de vista (título Display, subtítulo y slot `#actions`) | `title`, `subtitle`, `align`, `bordered` | — |
| `SectionCard` | Tarjeta con título, subtítulo y slot `#actions` | `title`, `subtitle` | — |
| `CollapsibleCard` | Tarjeta con cabecera desplegable accesible (`aria-expanded`/`aria-controls`) | `title`, `subtitle`, `icon`, `defaultOpen` | `open`, `close` |
| `StatCard` | Tarjeta KPI para indicadores clave | `title`, `value`, `valueColorClass`, `subtitle` (línea de contexto opcional bajo la cifra), `hint` (tooltip opcional, por ejemplo la cifra exacta cuando `value` va abreviado) | — |
| `PillTabs` | Interruptor de pestañas tipo píldora (el de "Recolección de Huevos / Raciones de Alimento"), con `role="tablist"` | `modelValue` (`v-model`), `tabs` (`[{ value, label, icon }]`), `ariaLabel` | `update:modelValue` |
| `RangeToggle` | Selector compacto de rango (7 / 30 días) con píldoras pequeñas | `modelValue` (`v-model`), `options`, `unitLabel`, `loading`, `ariaLabel`, `size` (`sm` por defecto, `md` para acciones que piden más superficie táctil, como la depuración del histórico) | `update:modelValue` |

> `PillTabs` y `RangeToggle` nacieron con el módulo Benchmark a partir de marcado que hoy sigue copiado en `ProduccionView` (interruptor de pestañas) y `ProduccionHuevosCard` (píldoras 7/30). Su migración está pendiente, ver [deuda técnica](#12-estado-de-deuda-técnica).

### Gráficos e Indicadores

| Componente | Para qué sirve | Props principales | Eventos |
|---|---|---|---|
| `LineChart` | Gráfico de líneas SVG multi-serie con una sola escala Y, crosshair y tooltip (también con teclado ← →), leyenda y tabla `sr-only` como equivalente accesible. Los márgenes laterales se ajustan al largo de las cifras del eje, así que los números grandes no se cortan | `labels`, `series` (`[{ name, color, values }]`), `ariaLabel`, `height`, `labelEvery`, `loading`, `formatValue` (abrevia el eje y la etiqueta final, p. ej. "60 mil"), `formatDetalle` (valor del tooltip, p. ej. la cifra exacta) | — |
| `ProgressBar` | Barra de progreso accesible (`role="progressbar"`) que tolera `max = 0` sin mostrar `NaN` | `value`, `max`, `colorClass`, `label` | — |

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
* Formulario protegido con `FormField` y gestión de errores contra el endpoint `POST /auth/login`. Un usuario desactivado ve «Tu cuenta está desactivada. Contacta al administrador.».

### 6.6b Usuarios y Permisos (`UsuariosView.vue`, `PermisosView.vue`)
* Solo superAdmin (ver [Navegación y permisos](#3-autenticación-rutas-y-capa-http)). Usan `PageHeader`, `DataTable`, `StatusBadge`, `RowActionButton`, `BaseConfirmModal`, `FormField` (vía `UsuarioFormModal`) y `provideActionLoader`. `UsuariosView` refresca la lista cada pocos segundos mientras haya credenciales `pendientes`, porque el correo sale por una cola.

### 6.7 Asistente Virtual AviaCore (`AsistenteChatWidget.vue`)
* Widget conversacional flotante global montado en `App.vue` para usuarios autenticados.
* Identidad corporativa **AviaCore** con imagotipo oficial [`GallinaIcon.vue`](src/components/common/GallinaIcon.vue) en el botón flotante, cabecera modal, estado inicial y avatar de respuestas.
* Consume `POST /asistente/chat` y los endpoints de `/asistente/conversaciones` mediante `services/asistente.js` y el store `useAsistenteStore` (`stores/asistente.js`). El navegador ya no envía el historial: el servidor lo arma desde la conversación guardada del usuario.
* Componentes especializados en `components/asistente/`:
  * `AsistenteChatWidget.vue`: Botón circular con pulso activo, ventana emergente accesible, atajos de teclado (Enter para enviar) y sugerencias rápidas operativas y zootécnicas.
  * `AsistenteMensaje.vue`: Renderizado de markdown ligero (negritas, viñetas, saltos), avatar institucional y badges transparentes de auditoría de herramientas (`consultar_inventario_aves`, `consultar_produccion_huevos`, `consultar_gastos_periodo`, `consultar_ubicacion_ave`, `consultar_raciones_alimento` y **`Manuales técnicos zootécnicos`** para consultas RAG sobre patos, pavos y gallinas).
  * `AsistenteIndicador.vue`: Indicador de «pensando» con el logo del proyecto (la gallina, con pulso suave), el texto «AviaCore está pensando…» y tres puntos que se encienden y suben 3 px en secuencia (keyframe `pensando` de `tailwind.config.js`; el `animate-bounce` de Tailwind se descartó porque en un punto de 4 px solo se movía 1 px), en la paleta salvia/bosque. Solo CSS. Respeta `prefers-reduced-motion`: con «reducir movimiento» nada se anima y se muestra un «…» fijo. Es un `role="status"` (se anuncia una vez; los puntos son decorativos). El texto es fijo; la prop `texto` (sin los puntos finales) permite cambiarlo.
  * `HistorialConversacionesModal.vue`: modal "Historial de conversaciones" (subtítulo "Consulta y retoma tus consultas anteriores") sobre `BaseModal`. Una fila por conversación con ícono, nombre, fecha, vista previa y dos `RowActionButton` (cambiar nombre y eliminar del historial); la conversación abierta se resalta con borde `salvia`. Al elegir una fila se carga en el chat. Eliminar usa `BaseConfirmModal` («Sí, eliminar»). `EmptyState` y `LoadingState` para los estados vacío, de error y de carga, **centrados** en el modal cuando no hay lista (con conversaciones no se centra).
  * `RenombrarConversacionModal.vue`: cambia el nombre con un `FormField` (1 a 60 caracteres, errores 422 bajo el campo).
* **Conversación persistente.** El navegador guarda en `localStorage` (clave `avicola_asistente_uuid`) el UUID de la conversación abierta; **lo genera el servidor** en el primer mensaje y se valida contra el usuario autenticado en cada acceso, así que no es un secreto. Al recargar, el widget lo usa para recuperar la conversación (`LoadingState` mientras carga). Si el UUID ya no sirve (eliminada, ajena, inexistente) se olvida y el chat queda vacío y usable. `localStorage` puede fallar (modo privado): el chat funciona igual, solo sin recuperarse al recargar.
* **Botones de la cabecera:** *Historial* (`History`, el mismo ícono del historial de traslados de Inventario de Aves), *Limpiar conversación* (se conserva el botón de siempre) y minimizar. Historial y Limpiar se deshabilitan mientras hay un mensaje en curso o se carga una conversación.
* **"Limpiar conversación" ya no borra nada:** vacía el chat y suelta el UUID, **sin llamar al servidor**; la conversación sigue en el historial y el UUID nuevo nace con el siguiente mensaje (lo genera el servidor). Si el chat está vacío, el botón no hace nada.
* **Nada se borra de verdad:** "eliminar del historial" solo cambia el estado de la conversación en el servidor. La interfaz dice "Eliminar", pero la confirmación no promete borrado permanente: avisa que la conversación "dejará de aparecer en tu historial".
* **Nombre automático:** tras el primer turno exitoso el servidor indica `requiere_titulo` y el store pide el nombre en una petición aparte, sin esperar y sin avisar si falla. Una conversación sin ningún turno exitoso (solo un saludo, un bloqueo o un error) se lista como **"Conversación"**.
* **Peticiones en vuelo:** un contador de "generación" descarta la respuesta tardía de un mensaje cuando el chat ya cambió de conversación (limpiar, abrir otra, cerrar sesión), para que no reponga el UUID anterior ni se mezcle en un chat vacío.
* **Cerrar sesión** reinicia el store del asistente y borra el UUID (otro usuario en el mismo navegador no ve mensajes ajenos). El interceptor 401 de `services/api.js` también borra la clave. Si aun así sobreviviera un UUID ajeno, el servidor responde 404.
* **Seguridad del texto:** `AsistenteMensaje.vue` escapa el HTML antes de aplicar su markdown ligero y solo admite enlaces `http(s)` y rutas internas (el texto se guarda y se vuelve a pintar al reabrir la conversación, así que un `<img onerror>` guardado se ejecutaría cada vez). El nombre y la vista previa del historial se muestran con interpolación `{{ }}`, nunca como HTML.
* Documentación técnica y de diseño: [`DESIGN.md`](DESIGN.md) y arquitectura detallada en `docs/aviacore-arquitectura-harness.md` y `docs/aviacore-rag-embeddings.md`.

### 6.8 Benchmark AviaCore (`BenchmarkView.vue`)
Auditoría de las interacciones entre los operarios y el asistente, organizada como Producción: un `PageHeader` con `PillTabs` que alterna entre dos secciones. Consume `GET /asistente/benchmark/*` (solo lectura) mediante `services/benchmark.js` y el store `useBenchmarkStore`. El acceso es para cualquier usuario autenticado y **no muestra quién escribió cada mensaje** (la bitácora no lo guarda).

* **Estadísticas:** selector de 7 o 30 días (`RangeToggle`) que gobierna toda la sección.
  * 8 `StatCard` en dos filas de cuatro. Un turno "con modelo" es el que no fue bloqueado por un guard ni resuelto por la vía rápida (los errores del proveedor cuentan: llegaron a Gemini). Cada tarjeta lleva una línea de contexto (`subtitle`):
    * **Uso y consumo:** *Interacciones* (con y sin modelo), *Tokens consumidos* (abreviado, "66,4 mil", con entrada y salida por separado y la cifra exacta en el tooltip), *Tokens por consulta al modelo* (solo sobre los turnos con modelo) y *Llamadas al modelo por consulta*.
    * **Calidad y rendimiento:** *Resueltas*, *Bloqueadas por guards* (no llegaron al modelo), *Errores del proveedor* (con la espera acumulada) y *Latencia típica* (mediana, con el percentil 90 como "el 10 % más lento").
    * No hay métrica de costo: los precios del proveedor cambian y el sistema no los guarda. La antigua *Tasa de éxito* y los promedios generales se quitaron porque mezclaban turnos con y sin modelo (un bloqueo de guard contaba como fallo).
  * 2 gráficos por día con `SerieDiariaCard` (`SectionCard` + `LineChart`): interacciones (exitosas, bloqueadas por guard, con error) y tokens, con **entrada y salida como dos líneas en un mismo gráfico**; el eje se abrevia ("20 mil") y el tooltip muestra la cifra exacta.
  * 3 rankings con `RankingCard` (`ProgressBar`): resultado de las interacciones (con %), guards más activados y herramientas más usadas. Los dos últimos son clicables: abren la pestaña de logs ya filtrada por ese guard o herramienta.
* **Logs del agente:** 4 `StatCard` del filtro vigente, `FilterBar` (texto, resultado, guard, herramienta, desde y hasta) y `DataTable` con `PaginationBar` integrada (fecha, mensaje, resultado como `StatusBadge`, tokens, duración, guards y acción *Ver detalle*).
* Componentes en `components/benchmark/`:
  * `SerieDiariaCard.vue`: tarjeta con gráfico de líneas por día (se usa dos veces).
  * `RankingCard.vue`: tarjeta con lista de barras, opcionalmente clicable y con porcentaje (se usa tres veces).
  * `LogDetalleModal.vue`: auditoría de un turno sobre `BaseModal`: mensaje del operario, prompt del sistema (`CollapsibleCard`, avisa si el prompt cambió desde esa interacción), respuesta del agente (y la original del modelo si un guard la reemplazó), herramientas con las tablas consultadas, guardrails aplicados, tokens y error. **Todo el texto se muestra con interpolación `{{ }}`, nunca como HTML**, porque proviene del operario o del modelo.
* `LimpiezaHistoricoModal.vue`: depuración manual del histórico antiguo del asistente sobre `BaseModal` con `RangeToggle` en píldoras (tamaño `md` con 3, 6 y 12 meses): banner con tokens `destructivo`/`destructivo-bg`, vista previa de registros a eliminar antes de confirmar (`aria-live="polite"`), botón bloqueado si hay 0 registros o carga en curso, y confirmación destructiva con `useActionLoader` y `notify`.
* `utils/benchmark.js` es la fuente única de etiquetas y variantes de `StatusBadge` para resultado, acción y fase de los guards, de las opciones de meses para la depuración (`MESES_DEPURACION = [3, 6, 12]`) y de los formateadores de números: `formatNumber` (separador de miles desde 1.000, porque `es-ES` no agrupa los de cuatro cifras), `formatCompacto` ("66,4 mil", "1,2 M"), `formatEjeCompacto` (ejes de gráficos, sin decimal fijo), `formatDuracion` ("9,7 s", "1 min 48 s") y `formatPorcentaje`.
* **Store (`stores/benchmark.js`):** solo la última petición de cada recurso (estadísticas, logs, detalle) puede escribir en el estado, así una respuesta lenta no pisa a una posterior al cambiar de rango, filtrar rápido o abrir otro log. Los errores de carga se muestran con `BaseAlert`. Al volver a una pestaña se recargan sus datos, porque las interacciones llegan mientras la vista está abierta.

### 6.9 Apariencia y Modo Nocturno (`AparienciaView.vue`, `ThemeToggle.vue`)
* **Switch global de nocturnidad (`ThemeToggle.vue`):** ubicado en `AppHeader.vue` (accesible mediante `role="switch"` y `aria-checked`), alterna entre **Modo Día** y **Modo Nocturno** usando tonos orgánicos bosque/salvia (`[data-theme='nocturno']`). Persiste en `localStorage` para evitar parpadeos y sincroniza con `PATCH /auth/preferencia-tema` cuando hay sesión activa.
* **Transición suave:** `useTemaStore.alternarModoNocturno()` (`stores/tema.js`) activa temporalmente `html.theme-transitioning` (`720ms` con *reflow* forzado) para fundir suavemente (`650ms`) superficies, bordes, textos, sombras e iconos, respetando `prefers-reduced-motion: reduce`.
* **Módulo administrable (`/apariencia`, solo `super_admin`):** layout maestro-detalle con búsqueda por componente, `PillTabs` para editar **Modo Claro** o **Modo Nocturno**, controles `AspectoEditorField.vue`, vista previa aislada en vivo (`AparienciaPreview.vue`), confirmación con `BaseConfirmModal` para restaurar componente o toda la paleta, y loader estándar `provideActionLoader()` + `<ActionLoader>`.
* **Motor CSS dinámico (`src/style.css` y `tailwind.config.js`):** todos los tokens de `DESIGN.md` operan como variables CSS en canales RGB (`--avicola-*`) para soportar opacidades de Tailwind (`bg-bosque/20`, `border-salvia/40`), formularios (`.avicola-form-field`), badges/alertas verdes (`.avicola-badge-success`, `.avicola-alert-success`) y silueta blanca del isotipo en modo nocturno (`.gallina-nocturna-blanca`).

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
