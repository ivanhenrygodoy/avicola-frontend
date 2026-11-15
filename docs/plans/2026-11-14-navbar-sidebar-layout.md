# Navbar y Sidebar Layout Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir el posicionamiento y comportamiento responsivo de `AppHeader` y `AppSidebar` para eliminar el espacio vacío superior sobre el sidebar en escritorio, anclar el botón hamburguesa y el logo a la izquierda, sincronizar el cambio de breakpoint (`1024px`) y soportar cierre con `Escape` en móvil.

**Architecture:** Se adopta el patrón estándar de barra superior fija de lado a lado (`w-full`, `sticky top-0 z-30`) con el botón hamburguesa e identidad visual siempre anclados a la izquierda, y `AppSidebar` debajo (`top-16`), colapsando en escritorio (`lg:w-64` ↔ `lg:w-0`) y actuando como drawer superpuesto en móvil (`< lg`). El estado del sidebar en `stores/navegacion.js` se sincroniza al cruzar el breakpoint mediante `window.matchMedia('(min-width: 1024px)')` desde `AppLayout.vue`.

**Tech Stack:** Vue 3 (Composition API), Pinia, Vue Router, Tailwind CSS 3, Lucide Vue Next, Vite.

**Design & Spec Constraints:**
- Respetar paleta y tokens de `DESIGN.md` (`#FFFFFF` en barra/sidebar, `#F5F3EA` `bg-crema`, `#E4E7DF` `border-borde`, `#244B36` `bosque`, `#6F9678` `salvia`).
- Mantener jerarquía de `z-index`: Header (`z-30`), Backdrop móvil (`z-[34]`), Sidebar móvil (`z-[35]`), Chat AviaCore (`z-40`), Modales (`z-[9999]`).
- Preservar accesibilidad (`inert`, `aria-hidden`, `aria-expanded`, `motion-reduce:transition-none`).

---

### Task 1: Sincronización de breakpoint en el store de navegación

**Files:**
- Modify: `src/stores/navegacion.js`

- [x] **Step 1: Agregar la acción `sincronizarModo(esDesktop)` en `useNavegacionStore`**

En `src/stores/navegacion.js`, añadir `sincronizarModo(esDesktop)` dentro de `actions` para cerrar el drawer al pasar a móvil (`< 1024px`) sin sobrescribir la preferencia de `localStorage`, y restaurar `leer() ?? true` al volver a escritorio:

```js
    // Al cruzar el breakpoint `lg`, adapta el estado sin sobrescribir la preferencia de escritorio.
    sincronizarModo(esDesktop) {
      this.abierto = esDesktop ? (leer() ?? true) : false
    },
```

- [x] **Step 2: Conectar `matchMedia` en `AppLayout.vue`**

**Files:**
- Modify: `src/components/common/AppLayout.vue`

Suscribir `window.matchMedia('(min-width: 1024px)')` en `onMounted` y limpiarlo en `onUnmounted`:

```js
import { computed, onMounted, onUnmounted } from 'vue'
import { useNavegacionStore } from '@/stores/navegacion'

const navegacion = useNavegacionStore()
let mediaQuery = null
const alCambiarBreakpoint = (e) => navegacion.sincronizarModo(e.matches)

onMounted(() => {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    mediaQuery = window.matchMedia('(min-width: 1024px)')
    mediaQuery.addEventListener('change', alCambiarBreakpoint)
  }
})

onUnmounted(() => {
  mediaQuery?.removeEventListener('change', alCambiarBreakpoint)
})
```

---

### Task 2: Anclar `AppHeader` de lado a lado sin desplazamiento `lg:pl-64`

**Files:**
- Modify: `src/components/common/AppHeader.vue`

- [x] **Step 1: Eliminar `lg:pl-64`, `lg:pl-0` y la transición de padding en `<header>`**

Reemplazar el `<header>` dinámico por una barra fija de ancho completo (`w-full`) y cambiar el contenedor interno de `max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8` a `w-full px-4 sm:px-6` para mantener el botón hamburguesa y el logo alineados a la izquierda:

```html
  <header class="bg-white border-b border-borde sticky top-0 z-30 w-full shadow-xs">
    <div class="w-full px-4 sm:px-6 h-16 flex items-center justify-between">
```

---

### Task 3: Refinar transición y cierre con `Escape` en `AppSidebar`

**Files:**
- Modify: `src/components/common/AppSidebar.vue`

- [x] **Step 1: Agregar listener de tecla `Escape` para cerrar el drawer móvil**

Importar `onMounted` y `onUnmounted` en `src/components/common/AppSidebar.vue` y registrar el handler:

```js
const alPresionarEscape = (e) => {
  if (e.key === 'Escape' && navegacion.abierto) {
    navegacion.cerrarSiEsMovil()
  }
}

onMounted(() => window.addEventListener('keydown', alPresionarEscape))
onUnmounted(() => window.removeEventListener('keydown', alPresionarEscape))
```

- [x] **Step 2: Acotar la propiedad de transición en `<aside>`**

Cambiar `transition-all` por `transition-[width,transform]` para evitar animar propiedades innecesarias como el borde (`border-r-0`).

---

### Task 4: Actualizar documentación del catálogo de componentes

**Files:**
- Modify: `README.md`

- [x] **Step 1: Actualizar la fila de `AppHeader` en la tabla de Estructura y Navegación**

Reflejar que `AppHeader` es una barra superior fija de lado a lado con hamburguesa, logo y título siempre anclados a la izquierda.

---

### Task 5: Verificación de compilación y comportamiento

- [x] **Step 1: Ejecutar build de producción**

Run:
```bash
npm --prefix avicola-frontend run build
```
Expected: `✓ built in ...` con código de salida `0` y sin errores de Vite/Tailwind.

- [ ] **Step 2: Validación visual en navegador**

1. Abrir `npm run dev` en `avicola-frontend`.
2. Verificar en escritorio (`>= 1024px`) que no exista hueco vacío sobre el sidebar y que el botón hamburguesa no salte al alternar el menú.
3. Verificar en móvil (`< 1024px`) el drawer superpuesto, cierre con clic fuera, cierre al navegar y cierre con tecla `Escape`.
4. Redimensionar la ventana cruzando `1024px` y confirmar que el estado se sincroniza correctamente.

