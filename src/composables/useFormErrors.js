import { reactive } from 'vue'

/**
 * Estado de errores de un formulario, ligado a sus campos.
 *
 *   const errors = useFormErrors(['codigo', 'id_especie'])
 *   errors.clear()                      // reinicia todos los campos a ''
 *   errors.set('codigo', 'Obligatorio') // un error de validación local
 *   errors.has()                        // ¿hay algún error?
 *   errors.applyServerErrors(err)       // mapea un 422 del backend a los campos
 *   errors.fields                       // objeto reactivo { campo: 'mensaje' }
 *
 * `fields` es un objeto reactivo (no un ref) a propósito: en una plantilla Vue solo
 * desenvuelve los refs de primer nivel, así que `:error="errors.fields.codigo"` solo
 * funciona si `fields` es reactivo.
 *
 * `applyServerErrors` solo copia los campos declarados (un error de un campo que el
 * formulario no tiene se ignora, no se inventa) y toma el primer mensaje de cada uno.
 * Devuelve true si el error era un 422 con `errors`, para que el llamador decida si
 * además muestra una notificación.
 *
 * @param {string[]} fieldNames campos del formulario
 */
export function useFormErrors(fieldNames) {
  const fields = reactive(Object.fromEntries(fieldNames.map((name) => [name, ''])))

  const clear = () => {
    for (const name of fieldNames) fields[name] = ''
  }

  const set = (name, message) => {
    fields[name] = message
  }

  const has = () => Object.values(fields).some(Boolean)

  const applyServerErrors = (err) => {
    const serverErrors = err?.response?.data?.errors
    if (err?.response?.status !== 422 || !serverErrors) return false

    for (const name of fieldNames) {
      const messages = serverErrors[name]
      if (messages?.length) fields[name] = messages[0]
    }
    return true
  }

  return { fields, clear, set, has, applyServerErrors }
}
