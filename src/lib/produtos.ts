export type ProdutoRow = {
  linha: string
  seg: string
  produto: string
  vd: number // venda líquida no mês
  mbp: number // margem bruta % (fração)
  desc: number // desconto médio % (fração)
  un: number // unidades vendidas
}

export type ProdutosMeta = {
  mes: string
  corteMinimoVenda: number
  produtosIncluidos: number
  produtosTotaisNaBase: number
  vendaIncluida: number
  vendaTotalBase: number
  coberturaVenda: number
  registrosDescartados?: number
}

type ArquivoProdutos = { meta: ProdutosMeta; produtos: ProdutoRow[] }

// NOTA SOBRE QUALIDADE DO DADO
// O export do BI contém, em algumas linhas, registros com VD UN = 0 (devoluções/estornos)
// onde o cálculo de % desconto estoura numa divisão por zero, gerando valores absurdos
// (ex.: 185.219.330.768.633.900%). Esses registros são descartados na importação
// (limite: |valor| > 1000%), pois contaminam a média ponderada da linha inteira.
// Descontos legítimos altos (80%, 98% em queima de estoque) são preservados.
// O total de registros descartados fica em meta.registrosDescartados.

// A base de produtos tem ~10 mil linhas e só é usada na aba de simulação de desconto.
// Por isso é carregada sob demanda (dynamic import), mantendo o bundle inicial leve
// para quem abre o dashboard nas outras abas.
let cache: ArquivoProdutos | null = null

export async function carregarProdutos(): Promise<ArquivoProdutos> {
  if (cache) return cache
  const mod = await import("@/data/produtos.json")
  cache = (mod.default ?? mod) as unknown as ArquivoProdutos
  return cache
}

export function produtosMeta(dados: ArquivoProdutos): ProdutosMeta {
  return dados.meta
}

export function todosProdutos(dados: ArquivoProdutos): ProdutoRow[] {
  return dados.produtos
}

export function linhasComProdutos(dados: ArquivoProdutos): string[] {
  return Array.from(new Set(dados.produtos.map((p) => p.linha))).sort()
}

export function produtosDaLinha(dados: ArquivoProdutos, linha: string): ProdutoRow[] {
  return dados.produtos.filter((p) => p.linha === linha)
}

// ---------------------------------------------------------------------------
// Simulação de desconto — cenário de volume constante
//
// Premissa (definida com o usuário): ao mexer no desconto, a venda em R$ do
// produto permanece a mesma. Nesse cenário, cada ponto percentual a menos de
// desconto vira aproximadamente um ponto percentual a mais de margem naquele
// produto, e o efeito na linha é ponderado pelo peso de venda do produto.
//
// NÃO modela elasticidade (queda de volume por preço maior). Se no futuro o
// usuário quiser esse cenário, é preciso um fator de elasticidade por linha.
// ---------------------------------------------------------------------------

export type RegraSimulacao = {
  // aplica o corte apenas em produtos cujo desconto atual seja >= este piso
  descontoMinimo: number
  // quantos pontos percentuais reduzir do desconto
  reducaoPP: number
  // não deixa o desconto final ficar abaixo deste valor
  descontoPisoFinal: number
}

export type ProdutoSimulado = ProdutoRow & {
  descNovo: number
  mbpNovo: number
  ganhoMbr: number // ganho de margem em R$ no mês
  afetado: boolean
}

export function simularProduto(p: ProdutoRow, regra: RegraSimulacao): ProdutoSimulado {
  const afetado = p.desc >= regra.descontoMinimo && p.desc > 0
  if (!afetado) {
    return { ...p, descNovo: p.desc, mbpNovo: p.mbp, ganhoMbr: 0, afetado: false }
  }
  const descNovo = Math.max(regra.descontoPisoFinal, p.desc - regra.reducaoPP)
  const reducaoEfetiva = p.desc - descNovo
  const mbpNovo = p.mbp + reducaoEfetiva
  const ganhoMbr = p.vd * reducaoEfetiva
  return { ...p, descNovo, mbpNovo, ganhoMbr, afetado: reducaoEfetiva > 0 }
}

export type ResultadoLinha = {
  linha: string
  produtos: ProdutoSimulado[]
  vd: number
  mbpAtual: number
  mbpNovo: number
  ganhoPP: number
  ganhoMbr: number
  produtosAfetados: number
  descMedioAtual: number
  descMedioNovo: number
}

export function simularLinha(dados: ArquivoProdutos, linha: string, regra: RegraSimulacao): ResultadoLinha {
  const produtos = produtosDaLinha(dados, linha).map((p) => simularProduto(p, regra))
  const vd = produtos.reduce((s, p) => s + p.vd, 0)
  const mbrAtual = produtos.reduce((s, p) => s + p.vd * p.mbp, 0)
  const mbrNovo = produtos.reduce((s, p) => s + p.vd * p.mbpNovo, 0)
  const descAtual = produtos.reduce((s, p) => s + p.vd * p.desc, 0)
  const descNovo = produtos.reduce((s, p) => s + p.vd * p.descNovo, 0)
  const mbpAtual = vd > 0 ? mbrAtual / vd : 0
  const mbpNovo = vd > 0 ? mbrNovo / vd : 0
  return {
    linha, produtos, vd, mbpAtual, mbpNovo,
    ganhoPP: mbpNovo - mbpAtual,
    ganhoMbr: mbrNovo - mbrAtual,
    produtosAfetados: produtos.filter((p) => p.afetado).length,
    descMedioAtual: vd > 0 ? descAtual / vd : 0,
    descMedioNovo: vd > 0 ? descNovo / vd : 0,
  }
}

export type ResultadoRede = {
  vd: number
  mbpAtual: number
  mbpNovo: number
  ganhoPP: number
  ganhoMbr: number
  produtosAfetados: number
}

// Impacto do mesmo cenário aplicado a todas as linhas (visão de rede)
export function simularRede(dados: ArquivoProdutos, regra: RegraSimulacao): ResultadoRede {
  const produtos = todosProdutos(dados).map((p) => simularProduto(p, regra))
  const vd = produtos.reduce((s, p) => s + p.vd, 0)
  const mbrAtual = produtos.reduce((s, p) => s + p.vd * p.mbp, 0)
  const mbrNovo = produtos.reduce((s, p) => s + p.vd * p.mbpNovo, 0)
  const mbpAtual = vd > 0 ? mbrAtual / vd : 0
  const mbpNovo = vd > 0 ? mbrNovo / vd : 0
  return {
    vd, mbpAtual, mbpNovo,
    ganhoPP: mbpNovo - mbpAtual,
    ganhoMbr: mbrNovo - mbrAtual,
    produtosAfetados: produtos.filter((p) => p.afetado).length,
  }
}

// Ranking de "alavancas": produtos onde o desconto mais custa margem em R$.
// custoDesconto = venda x desconto -> quanto de margem está sendo entregue via desconto.
export function topAlavancas(dados: ArquivoProdutos, linha: string | "TODAS", limite = 20): (ProdutoRow & { custoDesconto: number })[] {
  const base = linha === "TODAS" ? todosProdutos(dados) : produtosDaLinha(dados, linha)
  return base
    .map((p) => ({ ...p, custoDesconto: p.vd * p.desc }))
    .sort((a, b) => b.custoDesconto - a.custoDesconto)
    .slice(0, limite)
}

// ---------------------------------------------------------------------------
// Análises auxiliares para o painel (todas derivadas dos dados já carregados)
// ---------------------------------------------------------------------------

export type ResumoSelecao = {
  produtos: number
  vd: number
  mbp: number
  descMedio: number
}

export function resumoSelecao(dados: ArquivoProdutos, linha: string | "TODAS"): ResumoSelecao {
  const base = linha === "TODAS" ? todosProdutos(dados) : produtosDaLinha(dados, linha)
  const vd = base.reduce((s, p) => s + p.vd, 0)
  const mbr = base.reduce((s, p) => s + p.vd * p.mbp, 0)
  const desc = base.reduce((s, p) => s + p.vd * p.desc, 0)
  return {
    produtos: base.length,
    vd,
    mbp: vd > 0 ? mbr / vd : 0,
    descMedio: vd > 0 ? desc / vd : 0,
  }
}

// Distribuição dos produtos por faixa de desconto atual
export type FaixaDesconto = { label: string; min: number; max: number; produtos: number; pct: number }

export function distribuicaoDescontos(dados: ArquivoProdutos, linha: string | "TODAS"): FaixaDesconto[] {
  const base = linha === "TODAS" ? todosProdutos(dados) : produtosDaLinha(dados, linha)
  const faixas: FaixaDesconto[] = [
    { label: "0% – 20%", min: 0, max: 0.2, produtos: 0, pct: 0 },
    { label: "20% – 40%", min: 0.2, max: 0.4, produtos: 0, pct: 0 },
    { label: "40% – 60%", min: 0.4, max: 0.6, produtos: 0, pct: 0 },
    { label: "60% +", min: 0.6, max: Infinity, produtos: 0, pct: 0 },
  ]
  base.forEach((p) => {
    const f = faixas.find((x) => p.desc >= x.min && p.desc < x.max)
    if (f) f.produtos++
  })
  const total = base.length || 1
  faixas.forEach((f) => { f.pct = f.produtos / total })
  return faixas
}

// Potencial de ganho agrupado por segmento (o export do BI não traz fabricante)
export type PotencialGrupo = { grupo: string; ganho: number; produtos: number }

export function potencialPorSegmento(dados: ArquivoProdutos, linha: string | "TODAS", regra: RegraSimulacao, limite = 5): PotencialGrupo[] {
  const base = linha === "TODAS" ? todosProdutos(dados) : produtosDaLinha(dados, linha)
  const mapa = new Map<string, { ganho: number; produtos: number }>()
  base.forEach((p) => {
    const s = simularProduto(p, regra)
    if (s.ganhoMbr <= 0) return
    const seg = p.seg || "(sem segmento)"
    const acc = mapa.get(seg) || { ganho: 0, produtos: 0 }
    acc.ganho += s.ganhoMbr
    acc.produtos++
    mapa.set(seg, acc)
  })
  return Array.from(mapa.entries())
    .map(([grupo, v]) => ({ grupo, ...v }))
    .sort((a, b) => b.ganho - a.ganho)
    .slice(0, limite)
}

// Quantos produtos concentram X% do ganho total (curva de Pareto)
export function concentracaoGanho(dados: ArquivoProdutos, linha: string | "TODAS", regra: RegraSimulacao, alvo = 0.8): { produtos: number; totalComGanho: number } {
  const base = linha === "TODAS" ? todosProdutos(dados) : produtosDaLinha(dados, linha)
  const ganhos = base
    .map((p) => simularProduto(p, regra).ganhoMbr)
    .filter((g) => g > 0)
    .sort((a, b) => b - a)
  const total = ganhos.reduce((s, g) => s + g, 0)
  if (total <= 0) return { produtos: 0, totalComGanho: 0 }
  let acumulado = 0
  let n = 0
  for (const g of ganhos) {
    acumulado += g
    n++
    if (acumulado / total >= alvo) break
  }
  return { produtos: n, totalComGanho: ganhos.length }
}

// Cenários de corte para o gráfico comparativo (não altera o estado da tela)
export type Cenario = { reducaoPP: number; mbpNovo: number; ganhoMbr: number }

export function cenariosDeCorte(dados: ArquivoProdutos, linha: string | "TODAS", descontoMinimo: number, cortes: number[]): Cenario[] {
  return cortes.map((reducaoPP) => {
    const regra: RegraSimulacao = { descontoMinimo, reducaoPP, descontoPisoFinal: 0 }
    const res = linha === "TODAS" ? simularRede(dados, regra) : simularLinha(dados, linha, regra)
    return { reducaoPP, mbpNovo: res.mbpNovo, ganhoMbr: res.ganhoMbr }
  })
}

// Melhor oportunidade individual: produto com maior ganho na regra atual
export function melhorOportunidade(dados: ArquivoProdutos, linha: string | "TODAS", regra: RegraSimulacao): ProdutoSimulado | null {
  const base = linha === "TODAS" ? todosProdutos(dados) : produtosDaLinha(dados, linha)
  let melhor: ProdutoSimulado | null = null
  base.forEach((p) => {
    const s = simularProduto(p, regra)
    if (melhor === null || s.ganhoMbr > melhor.ganhoMbr) melhor = s
  })
  const resultado = melhor as ProdutoSimulado | null
  return resultado && resultado.ganhoMbr > 0 ? resultado : null
}

// Lista completa simulada, para a tabela (com ganho potencial por produto)
export function tabelaProdutos(dados: ArquivoProdutos, linha: string | "TODAS", regra: RegraSimulacao): (ProdutoSimulado & { custoDesconto: number })[] {
  const base = linha === "TODAS" ? todosProdutos(dados) : produtosDaLinha(dados, linha)
  return base
    .map((p) => ({ ...simularProduto(p, regra), custoDesconto: p.vd * p.desc }))
    .sort((a, b) => b.custoDesconto - a.custoDesconto)
}
