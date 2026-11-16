# Plan de Validación y Cumplimiento de Reglas UI (`AGENTS.md`, `DESIGN.md`, `SKILL.md`)

**Fecha:** 2026-11-16  
**Estado:** Finalizado con éxito  
**Alcance:** Auditoría integral de vistas (`src/views/*.vue`) y modales (`src/components/**/*Modal*.vue`) en `avicola-frontend`.

---

## 1. Diagnóstico de la Situación Actual

Tras auditar los archivos contra `AGENTS.md`, `DESIGN.md` y `.agents/skills/avicola-frontend/SKILL.md`:

### A. Alineación de Botones en Modales (`SKILL.md §4.1`: siempre centrados en `#footer`)

| Estado | Modales / Componentes | Hallazgo |
|---|---|---|
| **Cumple** | `AveFormModal`, `AveBajaModal`, `AveDetalleModal`, `AveMovimientosModal`, `AveReactivarModal`, `AveTrasladoModal`, `CasitaFormModal`, `CasitaDetalleModal`, `DivisionFormModal`, `AlimentacionFormModal`, `HuevoFormModal`, `HistorialConversacionesModal`, `RenombrarConversacionModal`, `RegistrarFuenteModal`, `DetalleFuenteModal`, `LimpiezaHistoricoModal`, `LogDetalleModal`, `BaseModal`, `BaseConfirmModal`, `ConfirmStatusModal`, `PrimerIngresoModal` | Utilizan `<template #footer>` de `BaseModal` (centrado automático con `justify-center`) o contenedor explícito `justify-center`. |
| **Incumple** | `src/components/gastos/GastoFormModal.vue` (L214) | Coloca los botones dentro del `<form>` con `justify-end` (alineados a la derecha) en lugar de usar `<template #footer>` centrado. |
| **Incumple** | `src/components/usuarios/UsuarioFormModal.vue` (L125) | Coloca los botones dentro del `<form>` con `justify-end` (alineados a la derecha) en lugar de usar `<template #footer>` centrado. |
| **Incumple** | `src/components/common/CambiarPasswordModal.vue` (L115) | Coloca los botones dentro del `<form>` con `justify-end` (alineados a la derecha) en lugar de usar `<template #footer>` centrado. |

---

### B. Etiquetas Directas en Botones de Confirmación (sin prefijo `Sí, `)

| Estado | Vista / Componente | Hallazgo |
|---|---|---|
| **Cumple** | `AparienciaView.vue`, `FuentesConocimientoView.vue`, `HistorialConversacionesModal.vue` | Usan verbos directos (`Restaurar`, `Restaurar todo`, `Archivar`, `Publicar`, `Eliminar`). |
| **Incumple** | `src/views/GastosView.vue` (L242) | `confirm-text="Sí, eliminar"` → debe estandarizarse a `"Eliminar"`. |
| **Incumple** | `src/views/UsuariosView.vue` (L238) | `:confirm-text="... ? 'Sí, desactivar' : 'Sí, activar'"` → debe estandarizarse a `'Desactivar'` / `'Activar'`. |

---

### C. Reglas Verificadas sin Desviaciones
- **Contenedor y dimensiones (`max-w-[1600px]`, `px-4 sm:px-6 lg:px-8 py-8 space-y-6` + `PageHeader`)**: 10/10 vistas autenticadas cumplen.
- **Modo Nocturno Orgánico y Diálogos Nativos**: `0` ocurrencias de `dark:bg-black/*` y `0` llamadas a `alert()` / `confirm()` nativos en `src/`.

---

## 2. Plan de Corrección Propuesto

1. **Migrar los 3 modales con `justify-end` al estándar `#footer` centrado de `BaseModal`**:
   - En `GastoFormModal.vue`, `UsuarioFormModal.vue` y `CambiarPasswordModal.vue`:
     - Asignar `id` al `<form>` (o conectar el botón submit mediante `form="..."` / `@click="handleSubmit"`), mover los botones de acción a `<template #footer>` para heredar `justify-center` de `BaseModal.vue`, conservando botones `.btn-principal` / `.btn-secundario`.
2. **Estandarizar textos de confirmación**:
   - Actualizar `GastosView.vue` (`Eliminar`) y `UsuariosView.vue` (`Desactivar` / `Activar`).
3. **Verificación obligatoria (`AGENTS.md §5`)**:
   - Ejecutar `npm run build` (0 errores).
   - Verificación en navegador (Playwright / `npm run dev`) abriendo `GastoFormModal`, `UsuarioFormModal` y `CambiarPasswordModal` para confirmar botones centrados en Modo Día y Modo Nocturno.

