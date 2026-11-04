---
name: avicola-frontend
description: >-
  Estándares de arquitectura, principios SOLID, modularidad por secciones,
  catálogo de componentes reutilizables, UX/UI accesible y paleta cromática
  corporativa para el proyecto avicola-frontend (Vue 3 + Vite + Tailwind CSS + Pinia).
---

# Estándares de Arquitectura Frontend (avicola-frontend)

Guía oficial para el desarrollo modular, escalable y mantenible del frontend de la Granja Avícola Inteligente basado en Vue 3 (Composition API).

---

## 1. Modularidad y Estructura por Secciones

Para mantener alta cohesión y bajo acoplamiento, la estructura se organiza en componentes globales transversales y componentes por sección de negocio:

```
src/
├── components/
│   ├── common/              # Componentes globales 100% reutilizables (SOLID)
│   │   ├── BaseModal.vue           # Contenedor modal con teleport y centrado
│   │   ├── BaseConfirmModal.vue    # Confirmaciones (eliminar, cancelar, alertar)
│   │   ├── ConfirmStatusModal.vue  # Cambio de estado dinámico (Habilitar/Deshabilitar)
│   │   ├── BaseAlert.vue           # Banner de alerta estilizado (warning, error, success, info)
│   │   ├── AlertToast.vue          # Toast global flotante conectado al store de notificaciones
│   │   ├── ActionLoader.vue        # Overlay corporativo durante peticiones async
│   │   ├── PaginationBar.vue       # Paginador dinámico con selector de registros
│   │   ├── StatCard.vue            # Tarjeta superior de métricas KPI
│   │   ├── FloatingInput.vue       # Input con notch label sobre el borde
│   │   └── FloatingSelect.vue      # Select con notch label y chevron estilizado
│   │
│   ├── instalaciones/       # Componentes específicos del módulo de Instalaciones
│   ├── aves/                # Componentes específicos del módulo de Inventario de Aves
│   ├── alimentacion/        # Componentes específicos del módulo de Alimentación
│   ├── huevos/              # Componentes específicos del módulo de Registro de Huevos
│   └── gastos/              # Componentes específicos del módulo de Gastos
│
├── views/                   # Vistas orquestadoras de página
├── stores/                  # Gestión de estado global con Pinia
├── services/                # Clientes HTTP desacoplados (Axios)
└── style.css                # Tokens corporativos y clases de utilidad
```

---

## 2. Principios SOLID Aplicados al Frontend

1. **S - Single Responsibility Principle (SRP):**
   - Las **Vistas** únicamente orquestan componentes y conectan con el Store.
   - Los **Componentes Comunes** se limitan a renderizar su control y emitir eventos (`@confirm`, `@close`, `@update:page`).
   - Los **Servicios** encapsulan las rutas API y peticiones HTTP.
   - Los **Stores** centralizan el estado, filtros y mutaciones.

2. **O - Open/Closed Principle (OCP):**
   - `BaseModal` y `BaseConfirmModal` son abiertos a extensión mediante slots (`#header`, `#default`, `#footer`) y props sin alterar su código fuente.

3. **L - Liskov Substitution Principle (LSP):**
   - `ConfirmStatusModal` envuelve y sustituye a `BaseConfirmModal` respetando su contrato de propiedades y eventos sin romper la interfaz.

4. **I - Interface Segregation Principle (ISP):**
   - Cada componente declara únicamente las props y emits necesarios, con valores por defecto seguros.

5. **D - Dependency Inversion Principle (DIP):**
   - Las vistas dependen de abstracciones (Stores y Servicios) y nunca realizan llamadas directas de bajo nivel o manipulación directa del DOM.

---

## 3. Paleta Cromática Corporativa Oficial

| Color | Hex | Función / Rol |
| :--- | :--- | :--- |
| **Verde Bosque** | `#244B36` | Botones principales (`.btn-principal`), navegación activa, loaders. |
| **Verde Salvia** | `#6F9678` | Iconos secundarios, etiquetas flotantes (notches), bordes activos. |
| **Crema Natural** | `#F5F3EA` | Fondo general de páginas y áreas contenedoras. |
| **Amarillo Huevo** | `#D9A441` / `#FFF1CC` | Alertas informativas, huevos y detalles de producción. |
| **Marrón Tierra** | `#8B6548` | Instalaciones, detalles de infraestructura y madera. |
| **Gris Verdoso Oscuro** | `#26332B` | Encabezados, títulos y textos de alta legibilidad. |
| **Superficie Blanca** | `#FFFFFF` | Tarjetas contenedoras, modales y barra de navegación. |
| **Borde Neutro** | `#E4E7DF` | Separadores de tabla, divisores y contornos de campos. |
| **Estado Activo** | `#DDF3E3` | Badges verdes de estado activo (`text-[#244B36]`). |
| **Estado Inactivo** | `#FEE2E2` | Badges rojos de estado inactivo (`text-[#991B1B]`). |

---

## 4. Reglas Estrictas de UX/UI y Formularios

1. **Alineación de Botones en Modales:**
   - **Siempre centrados** en el footer (`flex items-center justify-center gap-3 w-full`).
   - Botón Primario: `.btn-principal` (Verde Bosque `#244B36`, píldora `rounded-full`).
   - Botón Secundario: `.btn-secundario` (Fondo `#FFFFFF`, borde verde `#244B36`, píldora).
   - Botón Destructivo: `.btn-destructivo` (Fondo oscuro `#244B36`, píldora).

2. **Acciones Asíncronas y Feedback Visual:**
   - Toda llamada asíncrona de mutación (crear, editar, eliminar, cambiar estado) debe mostrar feedback inmediato:
     - Spinner giratorio en el botón (`Loader2`).
     - Overlay `ActionLoader` corporativo con mensaje claro y spinner dual animado.
   - Ninguna acción debe dejar al usuario en la duda de si la petición se envió.

3. **Etiquetas Flotantes (Notches):**
   - Deben contar con fondo blanco sólido (`bg-white`), z-index superior y alineación sobre la línea horizontal plana del borde para evitar líneas tachando el texto.

4. **Confirmación Obligatoria para Acciones Críticas:**
   - Nunca usar `confirm()` nativo del navegador.
   - Usar `BaseConfirmModal` para eliminar registros (con advertencia de irreversibilidad).
   - Usar `ConfirmStatusModal` para cambio de estado con redacción contextual dinámica.

5. **Manejo de Excepciones y Notificaciones (`useNotificationStore` + `AlertToast`):**
   - Prohibido el uso de `alert()` nativo del navegador.
   - Posicionamiento global: Las alertas se muestran en la esquina superior derecha (`top-5 right-5`) con animación lateral de deslizamiento suave (`translate-x`).
   - **Excepciones de Negocio y Validación (HTTP 422):** Utilizar `notify.warning(mensaje)` que despliega un banner amarillo suave (`#FFF1CC`), icono de advertencia (`AlertTriangle` en `#D97706`), texto ámbar oscuro (`#B45309`) y botón de cierre `X` (ejemplo: *"No se puede eliminar la casita porque tiene divisiones asociadas"*).
   - **Errores de Servidor y Red (HTTP 500 / Fallo de Conexión):** Utilizar `notify.error(mensaje)` que despliega un banner rojo suave (`#FEE2E2`), icono de error (`AlertCircle` en `#DC2626`) y texto rojo oscuro (`#991B1B`).
   - **Operaciones Exitosas (Crear, Editar, Habilitar, Eliminar):** Utilizar `notify.success(mensaje)` con banner verde suave (`#DDF3E3`) e icono de verificación (`CheckCircle2`).

6. **Transiciones Suaves de Modales y Backdrops:**
   - El **Backdrop oscuro** (`fixed inset-0 bg-black/45 backdrop-blur-xs`) **NUNCA** debe tener transformaciones de escala (`scale-95`), pues provoca que todo el fondo aparezca como un recuadro encogido en la pantalla.
   - El Backdrop se anima exclusivamente con desvanecimiento suave de opacidad (`transition-opacity` de `opacity-0` a `opacity-100`).
   - La animación sutil de escala (`scale(0.96)` a `scale(1)`) se aplica de manera aislada y exclusiva a la tarjeta interior del diálogo (`.modal-content-animated`).

