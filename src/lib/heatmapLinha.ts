import type { MargemRow } from "@/lib/calc"
import { LINHAS_EXCLUIDAS } from "@/lib/simulador"
import { mesKey } from "@/lib/format"

export type CelulaHeatmap = { vd: number; mbr: number; mbp: number } | null

export type HeatmapLinhaMes = {
  linhas: string[]
  meses: string[] // ordenados cronologicamente
  celula: (linha: string, mes: string) => CelulaHeatmap
  mediaLinha: (linha: string) => number // MB% média ponderada da linha nos meses exibidos
  maxDesvioLinha: (linha: string) => number // maior |desvio| da linha, para normalizar a cor da linha
}

export function computeHeatmap(rows: MargemRow[]): HeatmapLinhaMes {
  const porChave = new Map<string, { vd: number; mbr: number }>()
  const linhasSet = new Set<string>()
  const mesesSet = new Set<string>()

  rows.forEach((r) => {
    if (LINHAS_EXCLUIDAS.has(r.linha)) return
    linhasSet.add(r.linha)
    mesesSet.add(r.mes)
    const k = r.linha + "||" + r.mes
    const acc = porChave.get(k) || { vd: 0, mbr: 0 }
    acc.vd += r.vd
    acc.mbr += r.mbr
    porChave.set(k, acc)
  })

  const linhas = Array.from(linhasSet).sort((a, b) => a.localeCompare(b))
  const meses = Array.from(mesesSet).sort((a, b) => mesKey(a) - mesKey(b))

  const celula = (linha: string, mes: string): CelulaHeatmap => {
    const o = porChave.get(linha + "||" + mes)
    if (!o || o.vd <= 0) return null
    return { vd: o.vd, mbr: o.mbr, mbp: o.mbr / o.vd }
  }

  const mediaLinha = (linha: string): number => {
    let vd = 0, mbr = 0
    meses.forEach((m) => {
      const c = celula(linha, m)
      if (c) { vd += c.vd; mbr += c.mbr }
    })
    return vd > 0 ? mbr / vd : 0
  }

  const maxDesvioLinha = (linha: string): number => {
    const media = mediaLinha(linha)
    let max = 0
    meses.forEach((m) => {
      const c = celula(linha, m)
      if (c) max = Math.max(max, Math.abs(c.mbp - media))
    })
    return max
  }

  return { linhas, meses, celula, mediaLinha, maxDesvioLinha }
}
