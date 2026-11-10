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

// Enteros con separador de miles (es-ES)
export const formatNumber = (n) => Number(n || 0).toLocaleString('es-ES')
