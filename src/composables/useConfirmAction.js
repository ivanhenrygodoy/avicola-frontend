import { ref } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { useActionLoader } from '@/composables/useActionLoader'

/**
 * Flujo de una acción que pide confirmación (eliminar, habilitar/deshabilitar…): guarda
 * el objetivo, abre el modal de confirmación, ejecuta la mutación con el overlay de la
 * vista y notifica el resultado.
 *
 *   const eliminar = useConfirmAction({
 *     mensajeCarga: (t) => `Eliminando ${t.nombre}...`,
 *     accion: (t) => store.removeX(t.id),
 *     mensajeExito: 'Registro eliminado correctamente.',
 *     mensajeError: 'No se pudo eliminar el registro.',
 *   })
 *   // <BaseConfirmModal :is-open="eliminar.isOpen.value" :loading="eliminar.loading.value"
 *   //                   @confirm="eliminar.confirm" @close="eliminar.cancel" />
 *   // eliminar.request(item)           // al pulsar el botón de la fila
 *
 * Opciones:
 *   accion(objetivo)        mutación a ejecutar (devuelve una promesa).
 *   mensajeCarga(objetivo)  texto del overlay.
 *   mensajeExito            texto o función (objetivo, resultado) → texto del aviso de éxito.
 *   mensajeError            texto de respaldo si el servidor no envía `message`.
 *   loader                  el loader de la vista, cuando se usa EN la misma vista que lo provee:
 *                           un componente no puede inyectar lo que él mismo provee (solo sus
 *                           descendientes), así que la vista debe pasárselo explícitamente.
 *                           En un componente hijo se omite y se toma por inject.
 *
 * Los errores 422 (regla de negocio) se notifican como advertencia con el mensaje del
 * servidor; cualquier otro, como error. El modal se cierra solo si la acción termina bien.
 */
export function useConfirmAction({ accion, mensajeCarga, mensajeExito, mensajeError, loader = null }) {
  const notify = useNotificationStore()
  const { run } = loader ?? useActionLoader()

  const isOpen = ref(false)
  const loading = ref(false)
  const target = ref(null)

  const request = (objetivo) => {
    target.value = objetivo
    isOpen.value = true
  }

  const cancel = () => {
    isOpen.value = false
  }

  const confirm = async () => {
    if (!target.value) return
    const objetivo = target.value
    loading.value = true
    try {
      const resultado = await run(mensajeCarga(objetivo), () => accion(objetivo))
      notify.success(typeof mensajeExito === 'function' ? mensajeExito(objetivo, resultado) : mensajeExito)
      isOpen.value = false
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.message || mensajeError
      if (err.response?.status === 422) notify.warning(msg)
      else notify.error(msg)
    } finally {
      loading.value = false
    }
  }

  return { isOpen, loading, target, request, cancel, confirm }
}
