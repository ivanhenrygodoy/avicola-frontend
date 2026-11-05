---
name: "Granja Avícola Inteligente - Sistema de Diseño"
description: "Sistema de diseño corporativo y catálogo de tokens para la gestión integral avícola (Instalaciones, Inventario y Bioseguridad)."
colors:
  bosque: "#244B36"
  bosque-hover: "#1b3829"
  bosque-50: "#f2f7f4"
  bosque-100: "#e2ede7"
  salvia: "#6F9678"
  salvia-hover: "#587a60"
  salvia-50: "#f4f7f5"
  salvia-100: "#e5ece7"
  crema: "#F5F3EA"
  crema-surface: "#FAF8F5"
  huevo: "#D9A441"
  huevo-suave: "#FFF1CC"
  tierra: "#8B6548"
  tierra-50: "#fbf8f5"
  verdoso: "#26332B"
  verdoso-muted: "#526359"
  borde: "#E4E7DF"
  blanco: "#FFFFFF"
  destructivo: "#B91C1C"
  destructivo-bg: "#FEF2F2"
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  heading:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  subheading:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.025em"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  caption:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.bosque}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.full}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.bosque-hover}"
  button-secondary:
    backgroundColor: "{colors.blanco}"
    textColor: "{colors.bosque}"
    rounded: "{rounded.full}"
    padding: "10px 20px"
  stat-card:
    backgroundColor: "{colors.blanco}"
    rounded: "{rounded.lg}"
    padding: "20px"
  filter-bar:
    backgroundColor: "{colors.blanco}"
    rounded: "{rounded.lg}"
    padding: "16px"
  modal-card:
    backgroundColor: "{colors.blanco}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

## Overview

El sistema de diseño de **Granja Avícola Inteligente** está concebido bajo el modo **Operate** (Operación): interfaces optimizadas para operarios y administradores de granja que necesitan escanear datos con rapidez, gestionar lotes, registrar traslados y supervisar la salud de las aves con mínima fatiga visual y máxima precisión táctil y ergonómica.

La atmósfera visual evoca profesionalismo agropecuario, bioseguridad, naturaleza y orden orgánico, evitando clichés visuales de software genérico ("AI Slop" con morados fluorescentes o tarjetas saturadas).

---

## Colors

La paleta cromática es normativa y proviene directamente de la identidad rural y biológica de la granja:

* **Bosque (`#244B36`):** Color primario. Representa vegetación densa, bioseguridad y solidez institucional. Usado en botones primarios, títulos de jerarquía superior y estados activos clave.
* **Salvia (`#6F9678`):** Color secundario y acento de soporte. Utilizado en bordes de foco suaves, iconos de navegación, chips secundarios y estados de transición.
* **Crema (`#F5F3EA`) / Crema Surface (`#FAF8F5`):** Fondo ambiental cálido del viewport y tablas. Descansa la vista del operario al evitar el blanco puro `#FFFFFF` estridente.
* **Verdoso (`#26332B`):** Tinta tipográfica principal. Garantiza un contraste superior a 10:1 sobre fondos crema y blanco, superando con holgura el umbral WCAG AAA.
* **Verdoso Muted (`#526359`):** Tipografía secundaria, placeholders y etiquetas auxiliares. Mantiene legibilidad nítida (contraste > 4.8:1) sin competir con los datos críticos.
* **Borde (`#E4E7DF`):** Delimitación perimetral neutra y sutil para tarjetas y campos de formulario.
* **Huevo (`#D9A441`) & Suave (`#FFF1CC`):** Indicadores de alertas preventivas, cuarentena y avisos no críticos.
* **Tierra (`#8B6548`):** Acento para operaciones de suelo, mantenimiento físico y botones de edición.
* **Destructivo (`#B91C1C`) & Fondo (`#FEF2F2`):** Para confirmaciones de baja, eliminación de registros y errores de validación.

---

## Typography

* **Pila tipográfica:** `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`. Privilegia la velocidad de render nativa del dispositivo, la nitidez en monitores de campo y la compatibilidad multiplataforma sin descargas lentas de fuentes externas.
* **Jerarquía:**
  - **Títulos de página (Display):** 1.875rem (30px), peso 800, tracking `-0.025em`, color `text-verdoso`.
  - **Encabezados de sección (Heading):** 1.25rem (20px), peso 700, tracking `-0.015em`.
  - **Etiquetas de formularios y filtros:** 0.75rem (12px) a 0.875rem (14px), peso 600, mayúsculas sutiles o títulos directos sin estridencias.
  - **Cuerpo y celdas de tabla:** 0.875rem (14px), peso 400 a 600 para datos clave (código, nombre).

---

## Layout

* **Contenedor:** Máximo ancho `max-w-7xl` (1280px), centrado horizontalmente con márgenes responsivos (`px-4 sm:px-6 lg:px-8`).
* **Ritmo vertical:** Espaciado consistente `space-y-6` (24px) entre bloques estructurales (estadísticas $\rightarrow$ barra de filtros $\rightarrow$ contenedor de datos/tabla $\rightarrow$ paginación).
* **Grillas:**
  - Estadísticas de Instalaciones: 3 columnas (`grid-cols-1 sm:grid-cols-3 gap-4`).
  - Estadísticas de Aves: 4 columnas (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`).
  - Filtros: Rejilla adaptativa de 1 a 4 columnas según ancho de dispositivo.

---

## Elevation & Depth

* **Regla de oro de elevación única:** Se prohíbe acumular bordes gruesos con sombras oscuras tipo bloque. La elevación se expresa mediante:
  - Borde perimetral fino de 1px en `{colors.borde}` (`#E4E7DF`).
  - Sombra sutil ultra-suave (`shadow-xs` / `shadow-sm`) que simula elevación física sobre la superficie `{colors.crema}`.
* **Backdrop modales:** Oscurecimiento cinematográfico `rgba(38, 51, 43, 0.4)` con desenfoque de fondo sutil (`backdrop-blur-xs`), manteniendo el foco absoluto en la tarea sin desorientar al usuario.

---

## Shapes

* **Tarjetas maestras (`Card` / `StatCard` / `TableContainer`):** Radio `rounded-2xl` (16px) a `rounded-3xl` (24px) para contenedores principales, transmitiendo ergonomía y cercanía.
* **Botones de acción:** `rounded-full` (pills de 9999px) para acciones directas (`btn-principal`, `btn-secundario`).
* **Controles de entrada (`FloatingInput`, `FloatingSelect`):** Radio `rounded-xl` (12px) con etiquetas flotantes que descansan suavemente sobre el borde superior.

---

## Components

1. **`StatCard`:** Tarjeta de indicador sin elementos decorativos falsos. Etiqueta superior en mayúsculas pequeñas (`text-xs font-semibold text-verdoso-muted`) y métrica destacada (`text-3xl font-extrabold text-verdoso`).
2. **`FilterBar`:** Barra unificada que aloja campos de búsqueda y filtros reactivos con acciones de búsqueda y limpieza alineadas.
3. **`FloatingInput` / `FloatingSelect`:** Campos con label integrado en el borde superior, minimizando el consumo de espacio vertical. El buscador debe iniciar limpio sin descripciones fijas intrusivas y configurable por prop.
4. **`ActionLoader`:** Overlay centrado de operación asíncrona. Contiene spinner bicromático con la paleta de la granja (`#244B36` y `#6F9678`) y mensaje de estado.
5. **`BaseModal` & `BaseConfirmModal`:** Ventana emergente con pie de acciones centrado, evitando esquinas desbalanceadas.
6. **`PaginationBar`:** Paginador ergonómico con botones táctiles y resumen de registros visibles.

---

## Do's and Don'ts

### Do's (Prácticas Obligatorias)
* **Mantener la paleta terrenal y orgánica:** Todo componente nuevo debe utilizar los tokens declarados (`bosque`, `salvia`, `crema`, `verdoso`, `tierra`).
* **Consultar antes de alterar o remover:** Cuando se identifique una mejora en un componente establecido (por ejemplo, el loader o la estructura de una tarjeta), estructurarlo siempre en un plan detallado para validación previa.
* **Iconografía SVG coherente:** Usar exclusivamente iconos vectoriales del sistema (Lucide) con el mismo trazo de línea (stroke width 1.5–2px).
* **Feedback de acción inmediato:** Proporcionar estados de carga (`ActionLoader` o `Loader2`) para cualquier mutación (creación, edición, traslado, baja).
* **Validación en vivo:** Manejar errores de validación directamente sobre el campo de formulario afectado con mensaje descriptivo y rescate de valor anterior en edición.

### Don'ts (Prohibiciones de "AI Slop")
* **No usar emojis en lugar de iconos de interfaz:** Prohibido insertar emojis (`🐔`, `🦆`, `🦃`) dentro de menús de selección o controles interactivos nativos.
* **No usar degradados morados/azules genéricos:** Rechazar gradientes cliché (`bg-gradient-to-r from-purple-500 to-indigo-600`) ajenos a la identidad avícola.
* **No anidar tarjetas infinitas:** Prohibido colocar tarjetas dentro de tarjetas con múltiples sombras acumuladas ("card inception").
* **No dejar opciones en blanco en menús desplegables:** Los selects deben iniciar limpios sin renderizar filas vacías flotantes en el menú despegado.
* **No utilizar fuentes de fantasía no corporativas:** Preservar la fuente de sistema limpia y optimizada para el rendimiento.

