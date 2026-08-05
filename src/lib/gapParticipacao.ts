import mercadoComGlp1 from "@/data/mercadoIqvia.json"
import mercadoSemGlp1 from "@/data/mercadoIqviaSemGlp1.json"
import metasIdeais from "@/data/metasParticipacaoIdeal.json"

/**
 * GAP DE PARTICIPAÇÃO POR LINHA
 *
 * Compara a participação de uma linha dentro do mercado (Bricks Unipreço) com a
 * participação da mesma linha dentro da própria Unipreço, e traduz a diferença em
 * quanto a rede deixa de faturar naquela linha.
 *
 * Base de comparação (definida com o usuário): SEMPRE Bricks Unipreço vs Unipreço.
 * Denominador: TOTAL do escopo (soma de todas as categorias do arquivo IQVIA).
 *
 * OBS. DE CALIBRAGEM: a planilha Excel usada hoje pela área chega a percentuais um
 * pouco menores (ex.: 27,21% vs 31,20% em Jun/26 para RX Promovido no mercado), o que
 * indica que o TOTAL de lá considera uma base maior do que a exportada neste arquivo.
 * A fórmula aqui é a mesma; ao atualizar o export com a base completa, os números
 * convergem automaticamente. Nada é fixado em código.
 */

export type CenarioGap = "RX_PROMOVIDO_COM_GLP1" | "RX_PROMOVIDO_SEM_GLP1" | "RX_GENERICO"

export const CENARIOS: { key: CenarioGap; label: string; categoria: string; semGlp1: boolean }[] = [
  { key: "RX_PROMOVIDO_COM_GLP1", label: "RX Promovido c/ GLP1", categoria: "RX_PROMOVIDO", semGlp1: false },
  { key: "RX_PROMOVIDO_SEM_GLP1", label: "RX Promovido s/ GLP1", categoria: "RX_PROMOVIDO", semGlp1: true },
  { key: "RX_GENERICO", label: "RX Genérico", categoria: "RX_GENERICO", semGlp1: false },
]

type Fonte = typeof mercadoComGlp1

function fonteDe(semGlp1: boolean): Fonte {
  return (semGlp1 ? mercadoSemGlp1 : mercadoComGlp1) as Fonte
}

function valorDe(fonte: Fonte, escopo: string, categoria: string, mes: string): number {
  const blocos = fonte.blocos as unknown as Record<string, Record<string, Record<string, number>>>
  return blocos?.[escopo]?.[categoria]?.[mes] ?? 0
}

export function mesesDisponiveis(): string[] {
  return (mercadoComGlp1.colunas as string[]).filter((c) => !["MAT25", "MAT26", "YDT25", "YDT26"].includes(c))
}

/** Participação ideal configurada por cenário (arquivo separado, editável sem tocar na lógica) */
export function participacaoIdeal(cenario: CenarioGap): number | null {
  const cfg = (metasIdeais as unknown as Record<string, { participacaoIdeal?: number } | undefined>)[cenario]
  return cfg && typeof cfg.participacaoIdeal === "number" ? cfg.participacaoIdeal : null
}

export function toleranciaIdeal(): number {
  const cfg = metasIdeais as unknown as { _tolerancia?: number }
  return cfg._tolerancia ?? 0.005
}

export type PontoGap = {
  mes: string
  vendaLinhaMercado: number
  vendaTotalMercado: number
  vendaLinhaUnipreco: number
  vendaTotalUnipreco: number
  partMercado: number
  partUnipreco: number
  gapPP: number            // partMercado - partUnipreco
  vendaAlvoMercado: number // vendaTotalUnipreco * partMercado
  gapFinanceiro: number    // vendaAlvoMercado - vendaLinhaUnipreco
  partIdeal: number | null
  gapIdealPP: number | null
  vendaAlvoIdeal: number | null
  ajusteFinanceiroIdeal: number | null
}

/** Série mensal completa de um cenário */
export function serieGap(cenario: CenarioGap, nMeses = 12): PontoGap[] {
  const def = CENARIOS.find((c) => c.key === cenario)
  if (!def) return []
  const fonte = fonteDe(def.semGlp1)
  const ideal = participacaoIdeal(cenario)
  const meses = mesesDisponiveis().slice(-nMeses)

  return meses.map((mes) => {
    const vendaLinhaMercado = valorDe(fonte, "BRICKS", def.categoria, mes)
    const vendaTotalMercado = valorDe(fonte, "BRICKS", "TOTAL", mes)
    const vendaLinhaUnipreco = valorDe(fonte, "UNIPRECO", def.categoria, mes)
    const vendaTotalUnipreco = valorDe(fonte, "UNIPRECO", "TOTAL", mes)

    const partMercado = vendaTotalMercado > 0 ? vendaLinhaMercado / vendaTotalMercado : 0
    const partUnipreco = vendaTotalUnipreco > 0 ? vendaLinhaUnipreco / vendaTotalUnipreco : 0
    const gapPP = partMercado - partUnipreco
    const vendaAlvoMercado = vendaTotalUnipreco * partMercado
    const gapFinanceiro = vendaAlvoMercado - vendaLinhaUnipreco

    const vendaAlvoIdeal = ideal !== null ? vendaTotalUnipreco * ideal : null
    return {
      mes, vendaLinhaMercado, vendaTotalMercado, vendaLinhaUnipreco, vendaTotalUnipreco,
      partMercado, partUnipreco, gapPP, vendaAlvoMercado, gapFinanceiro,
      partIdeal: ideal,
      gapIdealPP: ideal !== null ? ideal - partUnipreco : null,
      vendaAlvoIdeal,
      ajusteFinanceiroIdeal: vendaAlvoIdeal !== null ? vendaAlvoIdeal - vendaLinhaUnipreco : null,
    }
  })
}

export type Direcao = "AUMENTAR" | "REDUZIR" | "MANTER" | "SEM_META"

/** Direção recomendada a partir da distância até a meta interna, com tolerância configurável */
export function direcaoRecomendada(partUnipreco: number, ideal: number | null, tolerancia = toleranciaIdeal()): Direcao {
  if (ideal === null) return "SEM_META"
  const dif = partUnipreco - ideal
  if (dif < -tolerancia) return "AUMENTAR"
  if (dif > tolerancia) return "REDUZIR"
  return "MANTER"
}

export const LABEL_DIRECAO: Record<Direcao, string> = {
  AUMENTAR: "Aumentar participação",
  REDUZIR: "Reduzir participação",
  MANTER: "Dentro da faixa ideal",
  SEM_META: "Sem meta configurada",
}

export type TendenciaGap = {
  variacaoMesAnterior: number | null   // em pp, do gap vs mercado
  variacao3m: number | null
  melhorMes: { mes: string; valor: number } | null // menor distância da meta
  piorMes: { mes: string; valor: number } | null
  melhorou: boolean | null // distância até a meta diminuiu?
}

/**
 * Tendência medida pela DISTÂNCIA ABSOLUTA até a participação ideal.
 * Assim, tanto "estar abaixo" quanto "estar acima" da meta contam como piora quando
 * a distância cresce — evita tratar aumento de participação como melhora automática.
 */
export function tendencia(serie: PontoGap[]): TendenciaGap {
  if (serie.length < 2) return { variacaoMesAnterior: null, variacao3m: null, melhorMes: null, piorMes: null, melhorou: null }
  const ultimo = serie[serie.length - 1]
  const anterior = serie[serie.length - 2]
  const tresAtras = serie.length >= 4 ? serie[serie.length - 4] : null

  const dist = (p: PontoGap) => (p.partIdeal !== null ? Math.abs(p.partUnipreco - p.partIdeal) : Math.abs(p.gapPP))
  const comDist = serie.map((p) => ({ mes: p.mes, valor: dist(p) }))
  const melhorMes = comDist.reduce((a, b) => (b.valor < a.valor ? b : a))
  const piorMes = comDist.reduce((a, b) => (b.valor > a.valor ? b : a))

  return {
    variacaoMesAnterior: ultimo.gapPP - anterior.gapPP,
    variacao3m: tresAtras ? ultimo.gapPP - tresAtras.gapPP : null,
    melhorMes, piorMes,
    melhorou: dist(ultimo) < dist(anterior),
  }
}

export type ResumoCenario = {
  cenario: CenarioGap
  label: string
  partMercado: number
  partUnipreco: number
  partIdeal: number | null
  gapPP: number
  gapIdealPP: number | null
  gapFinanceiro: number
  direcao: Direcao
}

/** Linha do comparativo por visão (último mês da série) */
export function resumoPorCenario(nMeses = 12): ResumoCenario[] {
  return CENARIOS.map((c) => {
    const serie = serieGap(c.key, nMeses)
    const ult = serie[serie.length - 1]
    if (!ult) {
      return { cenario: c.key, label: c.label, partMercado: 0, partUnipreco: 0, partIdeal: null, gapPP: 0, gapIdealPP: null, gapFinanceiro: 0, direcao: "SEM_META" as Direcao }
    }
    return {
      cenario: c.key, label: c.label,
      partMercado: ult.partMercado, partUnipreco: ult.partUnipreco, partIdeal: ult.partIdeal,
      gapPP: ult.gapPP, gapIdealPP: ult.gapIdealPP, gapFinanceiro: ult.gapFinanceiro,
      direcao: direcaoRecomendada(ult.partUnipreco, ult.partIdeal),
    }
  })
}

/** Efeito isolado dos produtos GLP-1 no gap de RX Promovido */
export function efeitoGlp1(nMeses = 12): { gapCom: number; gapSem: number; diferencaPP: number; diferencaFinanceira: number } | null {
  const com = serieGap("RX_PROMOVIDO_COM_GLP1", nMeses)
  const sem = serieGap("RX_PROMOVIDO_SEM_GLP1", nMeses)
  const uC = com[com.length - 1], uS = sem[sem.length - 1]
  if (!uC || !uS) return null
  return {
    gapCom: uC.gapPP,
    gapSem: uS.gapPP,
    diferencaPP: uC.gapPP - uS.gapPP,
    diferencaFinanceira: uC.gapFinanceiro - uS.gapFinanceiro,
  }
}
