# Plan SDD: Fuentes de Conocimiento RAG — Frontend (`avicola-frontend`)

**Fecha:** 2026-11-16  
**Vista Principal:** `src/views/FuentesConocimientoView.vue` (`/asistente/fuentes`)  
**Estado:** Finalizado con éxito

---

## 1. Lineamientos de Diseño y Arquitectura

El módulo debe cumplir estrictamente con `DESIGN.md`, `.agents/skills/avicola-frontend/SKILL.md` y las vistas de referencia (`AvesView.vue`, `AveDetalleModal.vue`):

1. **Contenedor y Dimensiones**:
   - Envolver la vista en `<div class="flex-1 flex flex-col">` y `<main class="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">` para mantener márgenes respirables respecto al sidebar y al viewport.
   - Usar `provideActionLoader()` + `<ActionLoader>` para retroalimentación de operaciones asíncronas.
2. **Cabecera y Filtros (`PageHeader` + `FilterBar`)**:
   - `PageHeader` únicamente con `title` y `subtitle`.
   - `FilterBar` configurado por `:fields` (`v-model="store.filtros"`):
     - `busqueda` (`type: 'search'`, etiqueta `"Buscar por título o autor"`).
     - `especie` (`type: 'select'`, etiqueta `"Especie"`).
     - `estado` (`type: 'select'`, etiqueta `"Estado"`).
   - Botón principal `"Registrar fuente"` integrado en `FilterBar` vía `action-label="Registrar fuente"` y `@action`.
3. **Listado en `DataTable`**:
   - **Sin colores decorativos en columnas informativas**: `Fuente / Documento`, `Especie`, `Origen` y `Fragmentos` se muestran en texto limpio sobre la superficie de tabla (`text-verdoso` / `text-verdoso-muted`).
   - **Únicos elementos con color semántico**:
     - Columna `Estado` mediante `StatusBadge` (`publicada` → `success`, `archivada` → `warning`, `borrador` → `neutral`).
     - Acciones de cambio de estado (`RowActionButton` con `tone="danger"` para archivar y `tone="success"` para publicar/reactivar).
   - **Sin columna `Disponibilidad IA` ni switch**:
     - En la columna `Acciones` a la par del icono de detalle (`Eye`):
       - Si está en `borrador`: icono de editar (`Pencil`, `tone="edit"`) para editar sus campos; el procesamiento se realiza dentro del modal de detalle.
       - Si está `publicada`: icono de archivar (`Archive`, `tone="danger"`) que abre `ConfirmStatusModal`.
       - Si está `archivada`: icono de reactivar/publicar (`ArchiveRestore`, `tone="success"`) que abre `ConfirmStatusModal`.
       - Si posee `ruta_archivo`: icono de descarga (`Download`, `tone="neutral"`).
4. **Modales (`RegistrarFuenteModal.vue` y `DetalleFuenteModal.vue`)**:
   - **Tokens orgánicos puros**: Prohibido usar clases `dark:bg-black/*` o `bg-white/40` que se oscurecen a gris cuando el sistema operativo usa modo oscuro; emplear `bg-white`, `bg-crema-surface`, `bg-crema`, `border-borde`, `text-verdoso`, `text-verdoso-muted`.
   - **Botones sin iconos y centrados**: Todos los botones propios (en footer de modales y controles internos) usan `.btn-principal` / `.btn-secundario` sin iconos y alineados al centro (`justify-center`) en el `#footer`.
   - **Creación y Edición de Borradores**:
     - `RegistrarFuenteModal.vue` soporta modo creación y modo edición (precargando datos existentes de un borrador).
     - Validación estricta antes de enviar: todos los campos (`tipo_fuente`, `titulo`, `especie`, `autor`, `version`, `descripcion` y `archivo`/`texto_contenido`) deben ser no vacíos.
   - **Detalle de Fuente (`DetalleFuenteModal.vue`)**:
     - Tarjetas superiores con estado, disponibilidad en IA, especie y autor/versión en superficie limpia (`bg-crema-surface` / `bg-white`).
     - Pestañas `PillTabs` entre `Fragmentos indexados (Chunks)` y `Texto original`.
     - Si está en `borrador`, muestra el botón `Procesar e Indexar` (sin icono) en el footer junto a `Cerrar`; si está `publicada` o `archivada`, muestra únicamente `Cerrar`.

---

## 2. Verificación

- Compilación limpia con `npm run build` (0 errores).
- Verificación E2E en navegador real (`npm run dev` + Playwright) validando dimensiones, `FilterBar` poblado, modales sin fondos grises, edición de borrador con validación, procesamiento desde detalle, iconos de archivar/publicar y legibilidad en Modo Día / Modo Nocturno.

