import type { MargemRow } from "@/lib/calc"
import { LINHAS_EXCLUIDAS } from "@/lib/simulador"
import { mesKey, diasNoMes } from "@/lib/format"

// Corte de dias por mês: quantos dias já decorreram (diasDec) dos dias totais do mês
// (diasTot). Um mês fechado tem diasDec === diasTot (projeção = realizado, fator 1).
export type DiasMes = { diasDec: number; diasTot: number }

export type TendenciaMes = {
  mes: string
  diasDec: number
  diasTot: number
  fechado: boolean // diasDec >= diasTot
  vdRealizado: number
  mbrRealizado: number
  mbPercRealizado: number
  vdProjetado: number
  mbrProjetado: number
  mbPercProjetado: number // = mbPercRealizado (projeção linear preserva a MB%, só escala volume)
  dVdProjPct: number | null // variação % do faturamento projetado vs mês selecionado anterior
  dMbPP: number | null // variação em pp da MB% vs mês selecionado anterior
}

// Agrega venda e margem de um mês (opcionalmente excluindo linhas de uso/consumo interno,
// mesma exclusão usada no Simulador de Meta, para manter os dois números comparáveis).
function agregaMes(rows: MargemRow[], mes: string, excluirUsoConsumo: boolean) {
  let vd = 0, mbr = 0
  for (const r of rows) {
    if (r.mes !== mes) continue
    if (excluirUsoConsumo && LINHAS_EXCLUIDAS.has(r.linha)) continue
    vd += r.vd
    mbr += r.mbr
  }
  return { vd, mbr }
}

export function diasFechadoPadrao(mes: string): DiasMes {
  const tot = diasNoMes(mes)
  return { diasDec: tot, diasTot: tot }
}

export function calcTendencia(
  rows: MargemRow[],
  mesesSelecionados: string[],
  diasPorMes: Record<string, DiasMes>,
  excluirUsoConsumo = true
): TendenciaMes[] {
  const ordenados = [...mesesSelecionados].sort((a, b) => mesKey(a) - mesKey(b))

  const linhas: TendenciaMes[] = ordenados.map((mes) => {
    const { vd, mbr } = agregaMes(rows, mes, excluirUsoConsumo)
    const cfg = diasPorMes[mes] || diasFechadoPadrao(mes)
    const diasDec = Math.min(Math.max(cfg.diasDec, 1), cfg.diasTot)
    const diasTot = Math.max(cfg.diasTot, 1)
    const fator = diasDec > 0 ? diasTot / diasDec : 1
    const mbPercRealizado = vd > 0 ? mbr / vd : 0
    const vdProjetado = vd * fator
    const mbrProjetado = mbr * fator
    const mbPercProjetado = vdProjetado > 0 ? mbrProjetado / vdProjetado : mbPercRealizado
    return {
      mes, diasDec, diasTot, fechado: diasDec >= diasTot,
      vdRealizado: vd, mbrRealizado: mbr, mbPercRealizado,
      vdProjetado, mbrProjetado, mbPercProjetado,
      dVdProjPct: null, dMbPP: null,
    }
  })

  for (let i = 1; i < linhas.length; i++) {
    const atual = linhas[i], anterior = linhas[i - 1]
    atual.dVdProjPct = anterior.vdProjetado > 0 ? atual.vdProjetado / anterior.vdProjetado - 1 : null
    atual.dMbPP = atual.mbPercProjetado - anterior.mbPercProjetado
  }

  return linhas
}
