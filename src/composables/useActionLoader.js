import { computed, inject, provide, ref } from 'vue'

/**
 * Estado del overlay de carga de una vista (el `ActionLoader` a pantalla completa).
 *
 * La vista crea UNA instancia con `provideActionLoader()` y dibuja un único
 * `<ActionLoader :is-open="isSubmitting" :message="message" />`. Sus modales hijos la
 * reciben con `useActionLoader()` (provide/inject) y envuelven cada mutación en `run`,
 * así nadie duplica el overlay ni pasa banderas por props.
 *
 *   const { isSubmitting, message, run } = provideActionLoader()          // en la vista
 *   const { isSubmitting, run } = useActionLoader()                       // en un modal hijo
 *   await run('Guardando gasto...', () => store.addGasto(payload))        // muestra y oculta el overlay
 *
 * `run` devuelve lo que devuelva la función, relanza su error (el llamador decide cómo
 * notificarlo) y oculta el overlay siempre, incluso si falla. Admite llamadas
 * simultáneas: el overlay se oculta cuando termina la última.
 */
const LOADER_KEY = Symbol('actionLoader')

function crearLoader() {
  const pendientes = ref(0)
  const message = ref('')
  const isSubmitting = computed(() => pendientes.value > 0)

  const run = async (texto, accion) => {
    pendientes.value++
    message.value = texto
    try {
      return await accion()
    } finally {
      pendientes.value--
    }
  }

  return { isSubmitting, message, run }
}

/** Para la vista: crea el loader y lo ofrece a sus descendientes. */
export function provideActionLoader() {
  const loader = crearLoader()
  provide(LOADER_KEY, loader)
  return loader
}

/**
 * Para un modal hijo: usa el loader de la vista. Si no hay ninguno provisto, avisa en
 * consola (el overlay no se vería) y devuelve uno local para no romper el guardado.
 */
export function useActionLoader() {
  const loader = inject(LOADER_KEY, null)
  if (!loader) {
    console.warn('[useActionLoader] No hay un loader provisto por la vista (falta provideActionLoader()); el overlay no se mostrará.')
    return crearLoader()
  }
  return loader
}
