import type { CSSProperties } from "react"

// Retorna um estilo de fundo em "mapa de calor": quanto maior o valor absoluto
// em relação ao maior valor da coluna (maxAbs), mais forte a cor.
// Positivo = verde-teal (oportunidade/ganho). Negativo = vermelho (risco/perda).
export function heatBg(value: number, maxAbs: number): CSSProperties {
  if (!isFinite(value) || maxAbs <= 0) return {}
  const intensidade = Math.min(Math.abs(value) / maxAbs, 1)
  if (intensidade < 0.03) return {}
  const alpha = 0.08 + intensidade * 0.42
  const cor = value >= 0 ? `rgba(13, 148, 136, ${alpha})` : `rgba(220, 38, 38, ${alpha})`
  return { backgroundColor: cor }
}

export function maxAbsOf<T>(items: T[], get: (item: T) => number): number {
  return items.reduce((m, item) => Math.max(m, Math.abs(get(item))), 0)
}
