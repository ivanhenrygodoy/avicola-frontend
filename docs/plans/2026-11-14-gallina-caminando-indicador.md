# Indicador de Chatbot con Gallina Caminando — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animar el indicador de carga del asistente virtual (`AsistenteIndicador.vue`) para mostrar la gallinita oficial de la granja en una secuencia continua (entra caminando, se detiene, recoge/come granos de comida y se va caminando) de forma modular dentro de su badge circular, conservando exactamente la misma ilustración vectorial de `GallinaIcon.vue`, la burbuja tipo píldora, el texto de estado y los tres puntos animados (`animate-pensando`), sin alterar `GallinaIcon.vue` ni sus demás consumidores.

**Architecture:** Se preserva intacto el vector del isotipo corporativo de la granja (`viewBox="0 0 326 438"` y `GALLINA_PATH` de `GallinaIcon.vue`) dentro de un nuevo componente independiente (`src/components/asistente/GallinaCaminando.vue`). Mediante `<clipPath>` (con sufijos únicos por instancia) se articula en 3 capas independientes (**cuerpo**, **pata izquierda** y **pata derecha**) para lograr una caminata real sin saltos, combinada con una coreografía CSS de `4.2s` que incluye desplazamiento, parada, dos picotazos a granos de comida (`#D9A441`) que desaparecen al ser recogidos, y salida caminando. Se integra de manera aislada en `AsistenteIndicador.vue`.

**Tech Stack:** Vue 3 (Composition API), Vite, Tailwind CSS 3, SVG inline (`<clipPath>`), CSS Keyframes.

---

### Task 1: Crear el componente modular `GallinaCaminando.vue` con el isotipo oficial articulado

**Files:**
- Create: `avicola-frontend/src/components/asistente/GallinaCaminando.vue`

- [x] **Step 1: Preservar el vector idéntico de `GallinaIcon.vue` y dividirlo con `<clipPath>`**
  - Mantener exactamente el mismo `viewBox="0 0 326 438"` y el mismo `GALLINA_PATH` corporativo.
  - Definir 3 `<clipPath>` con ID único por instancia (`gallina-cuerpo-*`, `gallina-pata-izq-*`, `gallina-pata-der-*`) para articular el cuerpo y ambas patas sin modificar la silueta original.
  - Añadir dos granos de comida en el suelo (`#D9A441`, Amarillo Huevo corporativo de `DESIGN.md`).

- [x] **Step 2: Implementar la coreografía CSS de caminata, parada, alimentación y salida (`4.2s` en bucle)**
  - **0% – 30% (Entrada caminando):** `gallina-recorrido` desplaza la gallina desde la derecha hasta la comida mientras `gallina-paso-izq` y `gallina-paso-der` alternan zancadas en fase opuesta (`-18deg` ↔ `+16deg`) sin saltos verticales.
  - **30% – 68% (Parada y alimentación):** las patas quedan firmes en `0deg`, `gallina-picoteo` inclina cuerpo/cabeza hacia el suelo en dos picotazos (`rotate(-44deg)`) y `gallina-grano-uno` / `gallina-grano-dos` desaparecen al ser recogidos.
  - **68% – 100% (Salida caminando):** retoma las zancadas alternadas y sale caminando por la izquierda.
  - **Accesibilidad:** bajo `@media (prefers-reduced-motion: reduce)` detiene todas las animaciones, oculta la comida y muestra el isotipo estático centrado.

---

### Task 2: Integrar `GallinaCaminando` en `AsistenteIndicador.vue`

**Files:**
- Modify: `avicola-frontend/src/components/asistente/AsistenteIndicador.vue`

- [x] **Step 1: Integrar en el badge circular conservando la burbuja y los puntos**
  - Mantener la burbuja exterior píldora (`bg-bosque-50 border border-salvia/40 shadow-2xs`).
  - Configurar el badge circular blanco con `overflow-hidden relative` para encuadrar la escena.
  - Renderizar `<GallinaCaminando class="w-5 h-5 text-bosque" />`.
  - Preservar el texto (`{{ texto }}`) y los tres puntos animados (`animate-pensando` + fallback para movimiento reducido).

---

### Task 3: Verificación y Validación

- [x] **Step 1: Compilación de producción con Vite**
  - Ejecutar `npm --prefix avicola-frontend run build` verificando cero errores (`✓ built in 3.85s`).
- [x] **Step 2: Comprobación de aislamiento modular**
  - Confirmar que `GallinaIcon.vue` permanece intacto para `AppHeader`, `AppSidebar`, `ActionLoader`, `LoadingState`, `DashboardView` y `LoginView`.
