# Sistema de Diseño y Modularidad SOLID (avicola-frontend)

Guía rápida de componentes globales y tokens corporativos implementados en el proyecto.

## Paleta Corporativa
- **Verde Bosque (`#244B36`):** Botones principales (`.btn-principal`), navegación activa, loader principal.
- **Verde Salvia (`#6F9678`):** Iconografía secundaria, notch labels, indicadores complementarios.
- **Crema Natural (`#F5F3EA`):** Fondo general de la aplicación.
- **Amarillo Huevo (`#D9A441` / `#FFF1CC`):** Alertas y acentos.
- **Marrón Tierra (`#8B6548`):** Elementos complementarios.
- **Gris Verdoso Oscuro (`#26332B`):** Títulos principales y tipografía general.
- **Superficie Blanca (`#FFFFFF`):** Tarjetas, barra superior, diálogos modales.
- **Borde Neutro (`#E4E7DF`):** Bordes e inputs.
- **Estado Activo (`#DDF3E3`):** Pills de estado activo (`text-[#244B36]`).
- **Estado Inactivo (`#FEE2E2`):** Pills de estado inactivo (`text-[#991B1B]`).

## Componentes Globales Reutilizables (`src/components/common/`)

1. **`BaseModal.vue`**: Contenedor modal con teleport a body, centrado absoluto en viewport y slots `#header`, `#default` y `#footer`.
2. **`BaseConfirmModal.vue`**: Modal de confirmación universal (eliminación, cancelación, advertencias) con botones en píldora centrados.
3. **`ConfirmStatusModal.vue`**: Modal de confirmación dinámico con redacción contextual para Habilitar / Deshabilitar.
4. **`BaseAlert.vue`**: Banner estilizado para alertas tipo warning (`#FFF1CC`), error (`#FEE2E2`), success (`#DDF3E3`) e info.
5. **`AlertToast.vue`**: Toast flotante global montado en `App.vue` y conectado a `useNotificationStore()`.
6. **`ActionLoader.vue`**: Overlay corporativo con spinner bicolor animado (`#244B36` y `#6F9678`) mostrado durante peticiones asíncronas.
7. **`PaginationBar.vue`**: Paginación modular con selector de elementos por página y páginas activas corporativas.
8. **`StatCard.vue`**: Tarjetas métricas superiores KPI.
9. **`FloatingInput.vue` / `FloatingSelect.vue`**: Entradas con etiqueta flotante sobre el borde (notch) con fondo blanco sólido que enmascara la línea.

## Estándar de Notificaciones
- **422 (Excepciones de Negocio / Validación):** `notify.warning(msg)` (Amarillo suave `#FFF1CC`).
- **500 / Error de Red:** `notify.error(msg)` (Rojo suave `#FEE2E2`).
- **Operaciones Exitosas:** `notify.success(msg)` (Verde suave `#DDF3E3`).
