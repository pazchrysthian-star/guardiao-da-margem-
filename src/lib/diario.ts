import diarioSeed from "@/data/diario.json"

export type RegistroDiario = {
  linha: string
  data: string // yyyy-mm-dd
  vd: number
  part: number
  mbp: number
}

export const LINHA_TOTAL = "Total"

export function registrosDiarios(): RegistroDiario[] {
  return diarioSeed as RegistroDiario[]
}

export type PontoDiario = { data: string; label: string; vd: number; mbp: number }

function formatDiaLabel(data: string): string {
  const [, m, d] = data.split("-")
  return `${d}/${m}`
}

// Série diária da rede inteira. Usa a linha "Total" quando ela existe no arquivo;
// se não existir, recompõe somando as linhas (MB% ponderada pela venda de cada linha).
export function serieDiariaRede(nDias?: number): PontoDiario[] {
  const registros = registrosDiarios()
  const datas = Array.from(new Set(registros.map((r) => r.data))).sort()

  const pontos: PontoDiario[] = datas.map((data) => {
    const doDia = registros.filter((r) => r.data === data)
    const total = doDia.find((r) => r.linha === LINHA_TOTAL)
    if (total) return { data, label: formatDiaLabel(data), vd: total.vd, mbp: total.mbp }

    const linhas = doDia.filter((r) => r.linha !== LINHA_TOTAL)
    const vd = linhas.reduce((s, r) => s + r.vd, 0)
    const mbr = linhas.reduce((s, r) => s + r.vd * r.mbp, 0)
    return { data, label: formatDiaLabel(data), vd, mbp: vd > 0 ? mbr / vd : 0 }
  })

  return nDias && nDias > 0 ? pontos.slice(-nDias) : pontos
}

// Série diária de uma linha específica
export function serieDiariaLinha(linha: string, nDias?: number): PontoDiario[] {
  const registros = registrosDiarios().filter((r) => r.linha === linha)
  const pontos = registros
    .slice()
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((r) => ({ data: r.data, label: formatDiaLabel(r.data), vd: r.vd, mbp: r.mbp }))
  return nDias && nDias > 0 ? pontos.slice(-nDias) : pontos
}

export function linhasDisponiveisDiario(): string[] {
  return Array.from(new Set(registrosDiarios().map((r) => r.linha)))
    .filter((l) => l !== LINHA_TOTAL)
    .sort()
}

// Variação em pontos percentuais entre o primeiro e o último dia da série
export function variacaoPeriodo(pontos: PontoDiario[]): number | null {
  if (pontos.length < 2) return null
  return pontos[pontos.length - 1].mbp - pontos[0].mbp
}
