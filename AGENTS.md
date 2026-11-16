# AGENTS.md — Avícola Frontend (`avicola-frontend`)

> **Propósito:** Dar contexto inmediato y reglas obligatorias a cualquier agente (en sesión nueva o continua) para mantener coherencia visual, reutilización de componentes, mantenibilidad y verificación real en navegador.

---

## 1. Lectura Obligatoria al Iniciar

Antes de proponer o editar código en este repositorio:
1. **Leer `README.md` (memoria viva del proyecto):** arquitectura, rutas, stores, servicios, catálogo de componentes comunes (`§4`), composables (`§5`) y módulos (`§6`).
2. **Leer `DESIGN.md` (fuente de verdad estética):** filosofía *Operate*, paleta orgánica, tipografía, elevación única, formas, **Modo Nocturno Orgánico** y prohibiciones (*Do's & Don'ts*).
3. **Leer `.agents/skills/avicola-frontend/SKILL.md`:** reglas estrictas de UX/UI, formularios (`FormField`), filtros (`FilterBar`), notificaciones, modales y modo nocturno.
4. **Revisar herramientas y MCPs disponibles:** especialmente el subagente `browser` (Chrome DevTools / Playwright MCP) para verificación E2E en navegador.

---

## 2. Principios de Trabajo (SDD, Memoria y Reutilización)

- **Spec-Driven Development (SDD):** Antes de implementar una vista nueva o un cambio visual/funcional relevante, definir el plan en `docs/plans/YYYY-MM-DD-<tema>.md` para aprobación y actualizarlo al concluir.
- **`README.md` y `DESIGN.md` son nuestra memoria:**
  - Todo módulo, vista, store, ruta, composable o componente común nuevo o modificado **debe quedar reflejado en `README.md`**.
  - Si cambian tokens visuales, reglas de contraste o el modo nocturno, actualizar también `DESIGN.md` y `.agents/skills/avicola-frontend/SKILL.md`.
- **Reutilizable, mantenible y escalable:**
  - **Reutilizar primero:** antes de crear un componente, modal, tabla o composable, revisar `src/components/common/` y `src/composables/`.
  - Si es necesario crear un componente nuevo, hacerlo modular, configurable por props/slots/eventos, sin lógica HTTP directa en vistas (delegar a `src/services/` y `src/stores/`) y siguiendo `DESIGN.md` + `SKILL.md`.
- **Navegación dirigida por módulo:** No leas otros módulos si trabajas en uno específico; consulta el mapa de módulos de abajo.

---

## 3. Inventario Rápido de Piezas Reutilizables

*(Consultar props, slots y contratos completos en `README.md` §4 y §5)*

| Categoría | Componentes / Composables disponibles | Regla de uso |
|---|---|---|
| **Layout y navegación** | `AppLayout`, `AppHeader`, `AppSidebar`, `PageHeader`, `SectionCard`, `StatCard`, `CollapsibleCard`, `PillTabs`, `RangeToggle` | Usar `PageHeader` en toda vista principal y `StatCard` para KPIs |
| **Tablas y estado** | `DataTable`, `PaginationBar`, `RowActionButton`, `StatusBadge` | No construir tablas HTML manuales ni badges ad-hoc |
| **Formularios y filtros** | `FormField` *(único para formularios)*, `FilterBar`, `FloatingInput`, `FloatingSelect` | `FormField` en login/modales; `FilterBar`/`Floating*` solo en filtros |
| **Modales y feedback** | `BaseModal`, `BaseConfirmModal`, `ConfirmStatusModal`, `ActionLoader`, `LoadingState`, `EmptyState`, `BaseAlert`, `AlertToast` | Prohibido `alert()`/`confirm()`; botones en modales siempre centrados |
| **Composables** | `provideActionLoader` / `useActionLoader`, `useFormErrors`, `useConfirmAction` | Envolver mutaciones en `run(...)` y mapear 422 con `applyServerErrors` |

---

## 4. Mapa de Módulos (Lectura Directa sin Ruido)

| Módulo | Vista (`src/views/`) | Componentes (`src/components/`) | Store & Service (`src/stores/`, `src/services/`) |
|---|---|---|---|
| **Auth / Login** | `LoginView.vue` | `PrimerIngresoModal`, `CambiarPasswordModal` (`common/`) | `stores/auth.js`, `services/api.js` |
| **Dashboard** | `DashboardView.vue` | `components/dashboard/` | `stores/dashboard.js`, `services/dashboard.js` |
| **Instalaciones** | `InstalacionesView.vue` | `components/instalaciones/` | `stores/instalaciones.js`, `services/instalaciones.js` |
| **Inventario de Aves** | `AvesView.vue` | `components/aves/` | `stores/aves.js`, `services/aves.js` |
| **Producción y Alimento** | `ProduccionView.vue` | `components/produccion/` | `stores/produccion.js`, `services/produccion.js` |
| **Finanzas y Gastos** | `GastosView.vue` | `components/gastos/` | `stores/gastos.js`, `services/gastos.js` |
| **Usuarios y Permisos** | `UsuariosView.vue`, `PermisosView.vue` | `components/usuarios/` | `stores/usuarios.js`, `services/usuarios.js`, `services/permisos.js` |
| **Asistente AviaCore** | *(Widget global en `App.vue`)* | `components/asistente/` | `stores/asistente.js`, `services/asistente.js` |
| **Benchmark AviaCore** | `BenchmarkView.vue` | `components/benchmark/` | `stores/benchmark.js`, `services/benchmark.js` |

---

## 5. Verificación Obligatoria (Build + Browser QA)

1. **Compilación:** Ejecutar `npm run build` y confirmar 0 errores.
2. **Pruebas en navegador (Browser QA / Playwright / Chrome DevTools MCP):**
   - Toda modificación de interfaz, flujo de usuario o regla visual debe verificarse en el navegador levantando `npm run dev` y delegando la comprobación E2E al subagente `browser` (o herramienta Playwright/DevTools disponible).
   - Validar: renderizado sin errores en consola ni peticiones 4xx/5xx inesperadas, interactividad de formularios/modales/filtros y legibilidad en modo claro/nocturno.
   - Si el puerto de depuración remota de Chrome no está disponible en el entorno, reportar el bloqueo explícitamente sin simular resultados.

---

## 6. Git y Commits

- **No commitear ni hacer `push` por iniciativa propia:** el agente solo crea commits o ramas cuando el usuario lo solicita explícitamente.
- **Conventional Commits obligatorio:** cuando el usuario pida commitear, usar siempre el estándar Conventional Commits (`feat(scope): ...`, `fix(scope): ...`, `docs(scope): ...`, `refactor(scope): ...`, `style(scope): ...`, `chore(scope): ...`).
