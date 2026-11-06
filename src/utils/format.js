/**
 * Utilidades de formato compartidas por vistas y componentes.
 * Fuente única para dinero y fechas: no redefinir estas funciones en cada vista.
 */

const SIN_DATO = '—'

/**
 * Dinero en dólares con 2 decimales: 12.5 → "$12.50". Vacío/null cuentan como 0.
 */
export const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`

/**
 * Igual que formatMoney pero devuelve "—" cuando no hay dato (null, undefined, 0 o ''),
 * para columnas donde un 0 significa "sin registrar" (p. ej. costo opcional).
 */
export const formatMoneyOrDash = (value) => (value ? formatMoney(value) : SIN_DATO)

/**
 * Convierte una fecha a "aaaa-mm-dd" para un <input type="date">. Acepta el formato
 * dd-mm-aaaa que serializa el backend, ISO (con o sin hora) y devuelve `fallback`
 * (vacío por defecto) cuando no hay dato.
 */
export const toInputDate = (value, fallback = '') => {
  if (!value) return fallback
  const parts = String(value).substring(0, 10).split('-')
  if (parts.length === 3) {
    return parts[0].length === 4 ? parts.join('-') : `${parts[2]}-${parts[1]}-${parts[0]}`
  }
  return String(value)
}

/**
 * Fecha dd/mm/aaaa en es-ES. Acepta ISO, timestamps y el formato dd-mm-aaaa que
 * serializa el backend (se devuelve tal cual). Sin dato devuelve "—".
 */
export const formatDate = (value) => {
  if (!value) return SIN_DATO
  if (typeof value === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(value)) return value
  const date = new Date(value)
  if (isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
