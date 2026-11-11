/**
 * Etiquetas y variantes de StatusBadge del módulo Benchmark AviaCore.
 * Fuente única para la tabla de logs, el modal de detalle y las estadísticas.
 */

// Resultado de un turno → texto legible y variante de StatusBadge
const RESULTADOS = {
  exitoso: { label: 'Exitoso', variant: 'success' },
  fast_path: { label: 'Respuesta rápida', variant: 'success' },
  bloqueado_guard: { label: 'Bloqueado por guard', variant: 'warning' },
  error: { label: 'Error', variant: 'danger' },
}

// Acción de un guardrail
const ACCIONES = {
  bloqueo: { label: 'Bloqueó', variant: 'warning' },
  modificacion: { label: 'Modificó la respuesta', variant: 'info' },
  aviso: { label: 'Aviso', variant: 'neutral' },
}

const FASES = {
  entrada: 'Entrada',
  tool: 'Herramienta',
  bucle: 'Bucle',
  salida: 'Salida',
}

export const resultadoInfo = (resultado) =>
  RESULTADOS[resultado] || { label: resultado || '—', variant: 'neutral' }

export const accionInfo = (accion) =>
  ACCIONES[accion] || { label: accion || '—', variant: 'neutral' }

export const faseLabel = (fase) => FASES[fase] || fase || '—'

// Opciones del filtro "Resultado" de la barra de filtros
export const RESULTADO_OPTIONS = Object.entries(RESULTADOS).map(([value, { label }]) => ({ value, label }))

// 'Y-m-d' → 'd/m' sin pasar por Date (evita desfases de zona horaria)
export const etiquetaDia = (fecha) => {
  const [, m, d] = String(fecha).split('-')
  return `${d}/${m}`
}

// Enteros con separador de miles (es-ES). `useGrouping: 'always'` porque es-ES no agrupa los
// números de cuatro cifras ("1755") y sí los de cinco ("22.810"), lo que se veía incoherente.
export const formatNumber = (n) =>
  Number(n || 0).toLocaleString('es-ES', { useGrouping: 'always', maximumFractionDigits: 0 })

// Cantidades grandes abreviadas: 950 → "950", 4148 → "4,1 mil", 66370 → "66,4 mil", 1.250.000 → "1,3 M".
// Debajo de 1.000 se muestra el número exacto; la cifra completa va en el tooltip de la tarjeta.
export const formatCompacto = (n) => {
  const v = Number(n || 0)
  const abs = Math.abs(v)
  const uno = (x) => x.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  // 999.950 o más redondea a "1.000,0 mil": ya es un millón, se muestra en la escala de millones.
  if (abs >= 999_950) return `${uno(v / 1_000_000)} M`
  if (abs >= 1_000) return `${uno(v / 1_000)} mil`
  return formatNumber(v)
}

// Igual que formatCompacto pero sin decimal fijo, para los ejes de los gráficos: 15000 → "15 mil",
// 7500 → "7,5 mil", 1.500.000 → "1,5 M". Los valores del eje son redondos y ",0" sobra.
export const formatEjeCompacto = (n) => {
  const v = Number(n || 0)
  const abs = Math.abs(v)
  const corto = (x) => x.toLocaleString('es-ES', { maximumFractionDigits: 1 })
  if (abs >= 999_950) return `${corto(v / 1_000_000)} M`
  if (abs >= 1_000) return `${corto(v / 1_000)} mil`
  return formatNumber(v)
}

// Milisegundos → texto corto: 640 → "640 ms", 9681 → "9,7 s", 107689 → "1 min 48 s"
export const formatDuracion = (ms) => {
  const v = Math.max(0, Number(ms || 0))
  if (v < 1000) return `${Math.round(v)} ms`
  const uno = (x) => x.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  // 59.950 ms o más redondearía a "60,0 s": se muestra como 1 min.
  if (v < 59_950) return `${uno(v / 1000)} s`
  const total = Math.round(v / 1000)
  const min = Math.floor(total / 60)
  const seg = total % 60
  return seg === 0 ? `${min} min` : `${min} min ${seg} s`
}

// Porcentaje con un decimal si lo necesita: 72.7 → "72,7 %", 60 → "60 %"
export const formatPorcentaje = (p) =>
  `${Number(p || 0).toLocaleString('es-ES', { maximumFractionDigits: 1 })} %`

// Opciones del selector de depuración manual del histórico
export const MESES_DEPURACION = [3, 6, 12]
export const MESES_DEPURACION_DEFECTO = 12

