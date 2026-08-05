import mercadoDataComGlp1 from "@/data/mercadoIqvia.json"
import mercadoDataSemGlp1 from "@/data/mercadoIqviaSemGlp1.json"

export type Escopo = "BRASIL" | "PARANA" | "BRICKS" | "UNIPRECO"
export type Fonte = "COM_GLP1" | "SEM_GLP1"

// Mapa: categoria do IQVIA -> linha equivalente na nossa base (CMV). Linhas nossas sem
// equivalente no IQVIA (bazar, mercearia, serviço, uso e consumo) ficam de fora — o IQVIA
// não faz tracking de mercado pra essas categorias, não é possível calcular share nelas.
export const MAPA_CATEGORIA_LINHA: Record<string, string> = {
  MIP_GENERICO: "MIP_GENÉRICO",
  MIP_MARCA: "MIP_MARCA",
  MIP_TRADE: "MIP_TRADE",
  NAO_MEDICAMENTO_NTR: "NÃO_MEDIC_NTR",
  NAO_MEDICAMENTO_OTC: "NÃO_MEDIC_OTC",
  NAO_MEDICAMENTO_PAC: "NÃO_MEDIC_PAC",
  NAO_MEDICAMENTO_PEC: "NÃO_MEDIC_PEC",
  RX_GENERICO: "RX_GENÉRICO",
  RX_PROMOVIDO: "RX_PROMOVIDO",
  RX_TRADE: "RX_TRADE",
}

export const CATEGORIAS_IQVIA = Object.keys(MAPA_CATEGORIA_LINHA)

// Linhas da nossa base que o IQVIA não rastreia (não entram na análise de share)
export const LINHAS_SEM_IQVIA = ["NÃO_MEDIC_BAZAR", "NÃO_MEDIC_MERC", "NÃO_MEDIC_SERVIÇO", "USO_CONSUMO"]

// A "SEM_GLP1" é a mesma base de mercado, excluindo canetas GLP1 (Mounjaro, Ozempic etc).
// Só altera RX_PROMOVIDO e TOTAL em todos os escopos — as demais categorias são idênticas.
function dadosDe(fonte: Fonte) {
  return fonte === "SEM_GLP1" ? mercadoDataSemGlp1 : mercadoDataComGlp1
}

export function colunasMercado(fonte: Fonte = "COM_GLP1"): string[] {
  return dadosDe(fonte).colunas as string[]
}
export const COLUNAS_MERCADO: string[] = mercadoDataComGlp1.colunas as string[]

function valorDe(escopo: Escopo, categoria: string, coluna: string, fonte: Fonte = "COM_GLP1"): number {
  const bloco = (dadosDe(fonte).blocos as Record<string, Record<string, Record<string, number>>>)[escopo]
  return bloco?.[categoria]?.[coluna] ?? 0
}

// Soma dos últimos n meses calendário (não MAT/YTD), terminando no mês informado (padrão: último mês fechado)
export function somaUltimosNMeses(escopo: Escopo, categoria: string, n: number, fonte: Fonte, mesFinal?: string): number {
  const meses = mesesCalendario(fonte)
  const fim = mesFinal ?? meses[meses.length - 1]
  const idxFim = meses.indexOf(fim)
  if (idxFim < 0) return 0
  const idxIni = Math.max(0, idxFim - n + 1)
  let soma = 0
  for (let i = idxIni; i <= idxFim; i++) soma += valorDe(escopo, categoria, meses[i], fonte)
  return soma
}

export type Periodo = "MAT" | "YTD" | "T3M" | "YoY" | "MoM"

// Resolve o valor "atual" e "do período anterior" pra um período (MAT, YTD, T3M, YoY, MoM),
// pra qualquer escopo/categoria. T3M = soma dos últimos 3 meses vs os 3 meses anteriores a eles.
// YoY = último mês vs mesmo mês ano anterior. MoM = último mês vs mês anterior.
function valorPeriodo(escopo: Escopo, categoria: string, periodo: Periodo, fonte: Fonte): { atual: number; anterior: number } {
  const meses = mesesCalendario(fonte)
  const ultimo = meses[meses.length - 1]

  if (periodo === "MAT") return { atual: valorDe(escopo, categoria, "MAT26", fonte), anterior: valorDe(escopo, categoria, "MAT25", fonte) }
  if (periodo === "YTD") return { atual: valorDe(escopo, categoria, "YDT26", fonte), anterior: valorDe(escopo, categoria, "YDT25", fonte) }
  if (periodo === "YoY") return { atual: valorDe(escopo, categoria, ultimo, fonte), anterior: valorDe(escopo, categoria, mesmoMesAnoAnterior(ultimo), fonte) }
  if (periodo === "MoM") {
    const mesAnt = mesAnterior(ultimo)
    return { atual: valorDe(escopo, categoria, ultimo, fonte), anterior: valorDe(escopo, categoria, mesAnt, fonte) }
  }

  // T3M: últimos 3 meses vs os 3 meses imediatamente anteriores a eles
  const atual = somaUltimosNMeses(escopo, categoria, 3, fonte, ultimo)
  const idxUltimo = meses.indexOf(ultimo)
  const idxAnterior = Math.max(0, idxUltimo - 3)
  const mesAnt3 = meses[idxAnterior]
  const anterior = somaUltimosNMeses(escopo, categoria, 3, fonte, mesAnt3)
  return { atual, anterior }
}

export type LinhaShare = {
  categoriaIqvia: string
  linha: string
  vendaUnipreco: number // MAT26
  mercadoBricks: number // MAT26
  share: number // vendaUnipreco / mercadoBricks
  shareAnoAnterior: number // MAT25
  deltaShare: number // pp
  crescUnipreco: number // MAT26 vs MAT25
  crescMercado: number // MAT26 vs MAT25 (bricks)
  gapCrescimento: number // crescUnipreco - crescMercado
  mercadoParana: number
  shareParana: number
  mercadoBrasil: number
  shareBrasil: number
}

export function computeShareTable(periodo: Periodo = "MAT", fonte: Fonte = "COM_GLP1"): LinhaShare[] {
  return CATEGORIAS_IQVIA.map((cat) => {
    const { atual: vendaUnipreco, anterior: vendaUniprecoAA } = valorPeriodo("UNIPRECO", cat, periodo, fonte)
    const { atual: mercadoBricks, anterior: mercadoBricksAA } = valorPeriodo("BRICKS", cat, periodo, fonte)
    const { atual: mercadoParana } = valorPeriodo("PARANA", cat, periodo, fonte)
    const { atual: mercadoBrasil } = valorPeriodo("BRASIL", cat, periodo, fonte)

    const share = mercadoBricks > 0 ? vendaUnipreco / mercadoBricks : 0
    const shareAnoAnterior = mercadoBricksAA > 0 ? vendaUniprecoAA / mercadoBricksAA : 0
    const crescUnipreco = vendaUniprecoAA > 0 ? vendaUnipreco / vendaUniprecoAA - 1 : 0
    const crescMercado = mercadoBricksAA > 0 ? mercadoBricks / mercadoBricksAA - 1 : 0

    return {
      categoriaIqvia: cat,
      linha: MAPA_CATEGORIA_LINHA[cat],
      vendaUnipreco, mercadoBricks, share, shareAnoAnterior, deltaShare: share - shareAnoAnterior,
      crescUnipreco, crescMercado, gapCrescimento: crescUnipreco - crescMercado,
      mercadoParana, shareParana: mercadoParana > 0 ? vendaUnipreco / mercadoParana : 0,
      mercadoBrasil, shareBrasil: mercadoBrasil > 0 ? vendaUnipreco / mercadoBrasil : 0,
    }
  })
}

export type SerieShareMensal = { mes: string; unipreco: number; mercado: number; share: number }

// Série mensal de share para uma categoria (usa os 24 meses calendário, não MAT/YDT)
export function serieShareMensal(categoriaIqvia: string, fonte: Fonte = "COM_GLP1"): SerieShareMensal[] {
  const meses = mesesCalendario(fonte)
  return meses.map((mes) => {
    const unipreco = valorDe("UNIPRECO", categoriaIqvia, mes, fonte)
    const mercado = valorDe("BRICKS", categoriaIqvia, mes, fonte)
    return { mes, unipreco, mercado, share: mercado > 0 ? unipreco / mercado : 0 }
  })
}

// ---------- Meses calendário (Jul/2024..Jun/2026) e navegação de mês ----------

export function mesesCalendario(fonte: Fonte = "COM_GLP1"): string[] {
  return colunasMercado(fonte).filter((c) => !["MAT25", "MAT26", "YDT25", "YDT26"].includes(c))
}

export function ultimoMesFechado(fonte: Fonte = "COM_GLP1"): string {
  const meses = mesesCalendario(fonte)
  return meses[meses.length - 1]
}

const ABREV_MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function parseMesLabel(mes: string): { m: number; y: number } {
  const [abrev, anoStr] = mes.split("/")
  return { m: ABREV_MES.indexOf(abrev), y: parseInt(anoStr, 10) }
}
function formatMesLabel(m: number, y: number): string {
  return `${ABREV_MES[m]}/${y}`
}
export function mesAnterior(mes: string): string {
  const { m, y } = parseMesLabel(mes)
  return m === 0 ? formatMesLabel(11, y - 1) : formatMesLabel(m - 1, y)
}
export function mesmoMesAnoAnterior(mes: string): string {
  const { m, y } = parseMesLabel(mes)
  return formatMesLabel(m, y - 1)
}

// ---------- Crescimento: MAT / YTD / YoY / MoM, para qualquer escopo ----------

export type Metrica = "MAT" | "YTD" | "T3M" | "YoY" | "MoM"
export const ESCOPOS: { key: Escopo; label: string }[] = [
  { key: "BRASIL", label: "BRA" },
  { key: "PARANA", label: "PR" },
  { key: "BRICKS", label: "BRICK" },
  { key: "UNIPRECO", label: "UNI" },
]

export function crescimento(escopo: Escopo, categoria: string, metrica: Metrica, fonte: Fonte = "COM_GLP1"): number | null {
  if (metrica === "MAT") {
    const a = valorDe(escopo, categoria, "MAT26", fonte), b = valorDe(escopo, categoria, "MAT25", fonte)
    return b > 0 ? a / b - 1 : null
  }
  if (metrica === "YTD") {
    const a = valorDe(escopo, categoria, "YDT26", fonte), b = valorDe(escopo, categoria, "YDT25", fonte)
    return b > 0 ? a / b - 1 : null
  }
  if (metrica === "T3M") {
    const { atual, anterior } = valorPeriodo(escopo, categoria, "T3M", fonte)
    return anterior > 0 ? atual / anterior - 1 : null
  }
  const ultimo = ultimoMesFechado(fonte)
  if (metrica === "YoY") {
    const a = valorDe(escopo, categoria, ultimo, fonte), b = valorDe(escopo, categoria, mesmoMesAnoAnterior(ultimo), fonte)
    return b > 0 ? a / b - 1 : null
  }
  // MoM
  const a = valorDe(escopo, categoria, ultimo, fonte), b = valorDe(escopo, categoria, mesAnterior(ultimo), fonte)
  return b > 0 ? a / b - 1 : null
}

export type LinhaCrescimento = { categoriaIqvia: string; linha: string; valores: Record<string, number | null> }

// Tabela "Crescimento %": uma linha por categoria (+ TOTAL), colunas = metrica x escopo
export function computeCrescimentoTable(fonte: Fonte = "COM_GLP1"): LinhaCrescimento[] {
  const linhas = [...CATEGORIAS_IQVIA, "TOTAL"].map((cat) => {
    const valores: Record<string, number | null> = {}
    const metricas: Metrica[] = ["MAT", "YTD", "T3M", "YoY", "MoM"]
    metricas.forEach((met) => {
      ESCOPOS.forEach(({ key }) => {
        valores[`${met}_${key}`] = crescimento(key, cat, met, fonte)
      })
    })
    return {
      categoriaIqvia: cat,
      linha: cat === "TOTAL" ? "TOTAL" : MAPA_CATEGORIA_LINHA[cat],
      valores,
    }
  })
  return linhas
}

// ---------- Share mensal por linha, últimos N meses + variação vs mês anterior ----------

export type LinhaShareMensal = { categoriaIqvia: string; linha: string; porMes: Record<string, number>; difMesAnterior: number }

export function computeShareMensalTable(nMeses = 12, fonte: Fonte = "COM_GLP1"): { meses: string[]; linhas: LinhaShareMensal[]; totalPorMes: Record<string, number>; totalDif: number } {
  const todosMeses = mesesCalendario(fonte)
  const meses = todosMeses.slice(-nMeses)
  const mesAnt = mesAnterior(meses[meses.length - 1])

  const linhas: LinhaShareMensal[] = CATEGORIAS_IQVIA.map((cat) => {
    const porMes: Record<string, number> = {}
    meses.forEach((mes) => {
      const uni = valorDe("UNIPRECO", cat, mes, fonte)
      const bricks = valorDe("BRICKS", cat, mes, fonte)
      porMes[mes] = bricks > 0 ? uni / bricks : 0
    })
    const shareUltimo = porMes[meses[meses.length - 1]]
    const uniAnt = valorDe("UNIPRECO", cat, mesAnt, fonte)
    const bricksAnt = valorDe("BRICKS", cat, mesAnt, fonte)
    const shareAnt = bricksAnt > 0 ? uniAnt / bricksAnt : 0
    return { categoriaIqvia: cat, linha: MAPA_CATEGORIA_LINHA[cat], porMes, difMesAnterior: shareUltimo - shareAnt }
  })

  const totalPorMes: Record<string, number> = {}
  meses.forEach((mes) => {
    const uni = valorDe("UNIPRECO", "TOTAL", mes, fonte)
    const bricks = valorDe("BRICKS", "TOTAL", mes, fonte)
    totalPorMes[mes] = bricks > 0 ? uni / bricks : 0
  })
  const uniAntTot = valorDe("UNIPRECO", "TOTAL", mesAnt, fonte)
  const bricksAntTot = valorDe("BRICKS", "TOTAL", mesAnt, fonte)
  const totalShareAnt = bricksAntTot > 0 ? uniAntTot / bricksAntTot : 0
  const totalDif = totalPorMes[meses[meses.length - 1]] - totalShareAnt

  return { meses, linhas, totalPorMes, totalDif }
}

// ---------- Mix de vendas: 4 grupos macro, composição interna da Unipreço ----------
// Mapeamento confirmado pela própria Unipreço:
//   Perfumaria = NÃO_MEDIC_NTR + NÃO_MEDIC_PAC + NÃO_MEDIC_PEC
//   OTC        = NÃO_MEDIC_OTC + MIP_GENÉRICO + MIP_MARCA + MIP_TRADE
//   Genérico   = RX_GENÉRICO
//   Marca      = RX_PROMOVIDO + RX_TRADE
export type MixMes = { mes: string; perfumaria: number; otc: number; generico: number; marca: number }

export function computeMixVendas(nMeses = 12, fonte: Fonte = "COM_GLP1", escopo: Escopo = "UNIPRECO"): MixMes[] {
  const meses = mesesCalendario(fonte).slice(-nMeses)
  const v = (cat: string, mes: string) => valorDe(escopo, cat, mes, fonte)
  return meses.map((mes) => {
    const perfumaria = v("NAO_MEDICAMENTO_NTR", mes) + v("NAO_MEDICAMENTO_PAC", mes) + v("NAO_MEDICAMENTO_PEC", mes)
    const otc = v("NAO_MEDICAMENTO_OTC", mes) + v("MIP_GENERICO", mes) + v("MIP_MARCA", mes) + v("MIP_TRADE", mes)
    const generico = v("RX_GENERICO", mes)
    const marca = v("RX_PROMOVIDO", mes) + v("RX_TRADE", mes)
    const total = perfumaria + otc + generico + marca
    return {
      mes,
      perfumaria: total > 0 ? perfumaria / total : 0,
      otc: total > 0 ? otc / total : 0,
      generico: total > 0 ? generico / total : 0,
      marca: total > 0 ? marca / total : 0,
    }
  })
}

export type MixComparativo = { mercado: MixMes; unipreco: MixMes; mes: string }

// Compara a composição do mix num único mês: Unipreço vs mercado (Bricks Unipreço),
// pra ver se a rede vende proporcionalmente mais/menos de cada grupo do que a área onde atua.
export function computeMixComparativo(fonte: Fonte = "COM_GLP1"): MixComparativo {
  const mes = ultimoMesFechado(fonte)
  const [mercado] = computeMixVendas(1, fonte, "BRICKS")
  const [unipreco] = computeMixVendas(1, fonte, "UNIPRECO")
  return { mercado, unipreco, mes }
}

// ---------- Evolução comparativa Unipreço vs Mercado (Bricks), N pontos trimestrais ----------
// Cada ponto é um MAT (12 meses móveis) terminando naquele mês — dá pra calcular pra qualquer
// mês que tenha 12 meses de histórico antes dele, diferente das colunas MAT25/MAT26 prontas
// (que só cobrem 2 pontos fixos). Usado pro gráfico de evolução com setas de crescimento.
export type PontoEvolucao = { label: string; mesFim: string; unipreco: number; mercado: number; share: number }

export function evolucaoComparativa(categoria: string | "TOTAL", nPontos = 5, fonte: Fonte = "COM_GLP1"): PontoEvolucao[] {
  const meses = mesesCalendario(fonte)
  // primeiro mês com 12 meses de histórico disponível antes dele
  const primeiroValido = 11
  const ultimoIdx = meses.length - 1
  if (ultimoIdx < primeiroValido) return []
  const passo = 3 // pontos trimestrais
  const idxs: number[] = []
  let idx = ultimoIdx
  while (idx >= primeiroValido && idxs.length < nPontos) {
    idxs.push(idx)
    idx -= passo
  }
  idxs.reverse()

  return idxs.map((i) => {
    const mesFim = meses[i]
    const unipreco = somaUltimosNMeses("UNIPRECO", categoria, 12, fonte, mesFim)
    const mercado = somaUltimosNMeses("BRICKS", categoria, 12, fonte, mesFim)
    return { label: `MAT ${mesFim}`, mesFim, unipreco, mercado, share: mercado > 0 ? unipreco / mercado : 0 }
  })
}

// ---------- Evolução do mix da Unipreço (composição empilhada) em N pontos trimestrais ----------
// Cada ponto usa a composição do mix (mesmo agrupamento de computeMixVendas) calculada sobre
// o MAT (12 meses móveis) terminando naquele trimestre — dá o "retrato" da composição típica
// da rede naquele período, suavizando efeitos de sazonalidade de um único mês.
export type PontoMixEvolucao = { label: string; mesFim: string; total: number; perfumaria: number; otc: number; generico: number; marca: number }

export function evolucaoMixPorEscopo(escopo: Escopo, nPontos = 5, fonte: Fonte = "COM_GLP1"): PontoMixEvolucao[] {
  const meses = mesesCalendario(fonte)
  const primeiroValido = 11
  const ultimoIdx = meses.length - 1
  if (ultimoIdx < primeiroValido) return []
  const passo = 3
  const idxs: number[] = []
  let idx = ultimoIdx
  while (idx >= primeiroValido && idxs.length < nPontos) {
    idxs.push(idx)
    idx -= passo
  }
  idxs.reverse()

  const v = (cat: string, mesFim: string) => somaUltimosNMeses(escopo, cat, 12, fonte, mesFim)
  return idxs.map((i) => {
    const mesFim = meses[i]
    const perfumaria = v("NAO_MEDICAMENTO_NTR", mesFim) + v("NAO_MEDICAMENTO_PAC", mesFim) + v("NAO_MEDICAMENTO_PEC", mesFim)
    const otc = v("NAO_MEDICAMENTO_OTC", mesFim) + v("MIP_GENERICO", mesFim) + v("MIP_MARCA", mesFim) + v("MIP_TRADE", mesFim)
    const generico = v("RX_GENERICO", mesFim)
    const marca = v("RX_PROMOVIDO", mesFim) + v("RX_TRADE", mesFim)
    const total = perfumaria + otc + generico + marca
    return {
      label: `MAT ${mesFim}`, mesFim, total,
      perfumaria: total > 0 ? perfumaria / total : 0,
      otc: total > 0 ? otc / total : 0,
      generico: total > 0 ? generico / total : 0,
      marca: total > 0 ? marca / total : 0,
    }
  })
}

export function evolucaoMixUnipreco(nPontos = 5, fonte: Fonte = "COM_GLP1"): PontoMixEvolucao[] {
  return evolucaoMixPorEscopo("UNIPRECO", nPontos, fonte)
}

// ---------- Painel comparativo de crescimento por categoria, Unipreço vs Mercado ----------
export type CategoriaComparativa = { categoriaIqvia: string; linha: string; unipreco: number | null; mercado: number | null }

export function crescimentoComparativoPorCategoria(periodo: Metrica | "T3M", fonte: Fonte = "COM_GLP1"): CategoriaComparativa[] {
  const calc = (escopo: Escopo, cat: string): number | null => {
    if (periodo === "T3M") {
      const { atual, anterior } = valorPeriodo(escopo, cat, "T3M", fonte)
      return anterior > 0 ? atual / anterior - 1 : null
    }
    return crescimento(escopo, cat, periodo, fonte)
  }
  return CATEGORIAS_IQVIA.map((cat) => ({
    categoriaIqvia: cat,
    linha: MAPA_CATEGORIA_LINHA[cat],
    unipreco: calc("UNIPRECO", cat),
    mercado: calc("BRICKS", cat),
  }))
}

// ---------- Ganho/Perda de Share em Valor R$ para qualquer período ----------
export type LinhaShareGainLoss = {
  categoriaIqvia: string
  linha: string
  vendaUniAtual: number
  vendaUniAnterior: number
  mercadoAtual: number
  mercadoAnterior: number
  shareAtual: number
  shareAnterior: number
  deltaSharePercent: number // pp
  deltaShareValor: number // R$: quanto a Uni ganhou/perdeu por mudança de share
  impactoMensal: number // R$: spread mensal (crescimento diferencial Uni vs Merc)
}

export function computeShareGainLossTable(periodo: Periodo = "MAT", fonte: Fonte = "COM_GLP1"): LinhaShareGainLoss[] {
  // Determina quantos meses para calcular "impacto mensal"
  const nMeses = periodo === "MAT" ? 12 : periodo === "YTD" ? 6 : 3

  return CATEGORIAS_IQVIA.map((cat) => {
    const { atual: vendaUniAtual, anterior: vendaUniAnterior } = valorPeriodo("UNIPRECO", cat, periodo, fonte)
    const { atual: mercadoAtual, anterior: mercadoAnterior } = valorPeriodo("BRICKS", cat, periodo, fonte)

    const shareAtual = mercadoAtual > 0 ? vendaUniAtual / mercadoAtual : 0
    const shareAnterior = mercadoAnterior > 0 ? vendaUniAnterior / mercadoAnterior : 0
    const deltaSharePercent = shareAtual - shareAnterior
    const deltaShareValor = deltaSharePercent * mercadoAtual // ganho/perda em R$ pela mudança de share

    const crescUni = vendaUniAnterior > 0 ? vendaUniAtual / vendaUniAnterior - 1 : 0
    const crescMerc = mercadoAnterior > 0 ? mercadoAtual / mercadoAnterior - 1 : 0
    const impactoMensal = (crescUni - crescMerc) * vendaUniAtual / nMeses

    return {
      categoriaIqvia: cat,
      linha: MAPA_CATEGORIA_LINHA[cat],
      vendaUniAtual,
      vendaUniAnterior,
      mercadoAtual,
      mercadoAnterior,
      shareAtual,
      shareAnterior,
      deltaSharePercent,
      deltaShareValor,
      impactoMensal,
    }
  })
}

// ---------- Tabela Unificada: Share + Crescimento + Ganho/Perda Mensal ----------
export type LinhaShareUnificada = {
  categoriaIqvia: string
  linha: string
  vendaUnipreco: number
  vendaMercado: number
  share: number // %
  variacaoShare: number // pp
  crescimentoMercado: number // %
  crescimentoUni: number // %
  gapCrescimento: number // pp
  ganhoPerdaValor: number // R$ total
  ganhoPerdaMensal: number // R$ / mês
}

export function computeShareUnificada(periodo: Periodo = "MAT", fonte: Fonte = "COM_GLP1"): LinhaShareUnificada[] {
  const nMeses = periodo === "MAT" ? 12 : periodo === "YTD" ? 6 : 3

  return CATEGORIAS_IQVIA.map((cat) => {
    const { atual: vendaUni, anterior: vendaUniAnt } = valorPeriodo("UNIPRECO", cat, periodo, fonte)
    const { atual: vendaMerc, anterior: vendaMercAnt } = valorPeriodo("BRICKS", cat, periodo, fonte)

    const share = vendaMerc > 0 ? vendaUni / vendaMerc : 0
    const shareAnt = vendaMercAnt > 0 ? vendaUniAnt / vendaMercAnt : 0
    const variacaoShare = share - shareAnt

    const crescUni = vendaUniAnt > 0 ? vendaUni / vendaUniAnt - 1 : 0
    const crescMerc = vendaMercAnt > 0 ? vendaMerc / vendaMercAnt - 1 : 0
    const gapCrescimento = crescUni - crescMerc

    const ganhoPerdaValor = variacaoShare * vendaMerc
    const ganhoPerdaMensal = ganhoPerdaValor / nMeses

    return {
      categoriaIqvia: cat,
      linha: MAPA_CATEGORIA_LINHA[cat],
      vendaUnipreco: vendaUni,
      vendaMercado: vendaMerc,
      share,
      variacaoShare,
      crescimentoMercado: crescMerc,
      crescimentoUni: crescUni,
      gapCrescimento,
      ganhoPerdaValor,
      ganhoPerdaMensal,
    }
  })
}
