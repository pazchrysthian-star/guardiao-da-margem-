import type { MargemRow } from "@/lib/calc"

export type LinhaMeta = {
  linha: string
  metaParticipacao: number // % (0-1) do peso de venda que a linha deveria ter
  metaMB: number // % (0-1) de MB alvo da linha
  sellout: number // R$ de verba/sellout do mês que soma direto na margem (não passa pela projeção por dia)
}

// Linhas que não entram no simulador de meta (ex: uso e consumo interno, não é venda real)
export const LINHAS_EXCLUIDAS = new Set(["USO_CONSUMO"])

function semExcluidas(rows: MargemRow[]): MargemRow[] {
  return rows.filter((r) => !LINHAS_EXCLUIDAS.has(r.linha))
}

// Metas de participação extraídas da planilha original (CONTROLE_DE_MARGEM_POR_LINHA.xlsx),
// usadas como ponto de partida. MB% meta começa em 0 — ajuste conforme sua meta real.
export const METAS_PADRAO: Record<string, number> = {
  MIP_GENÉRICO: 0.021,
  MIP_MARCA: 0.068,
  MIP_TRADE: 0.023,
  NÃO_MEDIC_BAZAR: 0.01,
  NÃO_MEDIC_MERC: 0.007,
  NÃO_MEDIC_NTR: 0.115,
  NÃO_MEDIC_OTC: 0.062,
  NÃO_MEDIC_PAC: 0.086,
  NÃO_MEDIC_PEC: 0.26,
  NÃO_MEDIC_SERVIÇO: 0.012,
  RX_GENÉRICO: 0.118,
  RX_PROMOVIDO: 0.193,
  RX_TRADE: 0.02,
}

// Calcula, para cada linha, um MB% meta = MB% real da linha + um deslocamento uniforme,
// de forma que a média ponderada pelos pesos (metaParticipacao) bata no alvo informado (ex: 30,5%).
// Preserva a diferença relativa entre linhas (quem tem MB% real maior continua com meta maior).
export function calcularMetaMBAutomatica(rows: MargemRow[], mAt: string, metas: LinhaMeta[], alvo: number): LinhaMeta[] {
  const realizado: Record<string, { vd: number; mbr: number }> = {}
  semExcluidas(rows).filter((r) => r.mes === mAt).forEach((r) => {
    if (!realizado[r.linha]) realizado[r.linha] = { vd: 0, mbr: 0 }
    realizado[r.linha].vd += r.vd
    realizado[r.linha].mbr += r.mbr
  })

  let somaPeso = 0
  let somaPesoMb = 0
  metas.forEach((m) => {
    if (LINHAS_EXCLUIDAS.has(m.linha)) return
    const r = realizado[m.linha]
    const mb = r && r.vd > 0 ? r.mbr / r.vd : 0
    somaPeso += m.metaParticipacao
    somaPesoMb += m.metaParticipacao * mb
  })
  const mediaAtual = somaPeso > 0 ? somaPesoMb / somaPeso : 0
  const delta = alvo - mediaAtual

  return metas.map((m) => {
    if (LINHAS_EXCLUIDAS.has(m.linha)) return m
    const r = realizado[m.linha]
    const mb = r && r.vd > 0 ? r.mbr / r.vd : 0
    return { ...m, metaMB: Math.max(0, mb + delta) }
  })
}

export type SimLinha = {
  linha: string
  realizadoVd: number
  realizadoMbr: number
  mbPercReal: number
  sellout: number
  mbrRecomp: number
  mbPercRecomp: number
  vendaProjetada: number
  metaParticipacao: number
  metaMB: number
  metaVenda: number
  participacaoReal: number
  difVenda: number
  gapPeso: number
  gapMB: number
  custoMeta: number
  custoRealizado: number
  perdaGanhoMB: number
  perdaGanhoVenda: number
  perdaGanhoTotal: number
  percPartPerdaGanho: number
  impactoPesoPP: number // legado: efeito clássico do desvio de participação
  impactoMargemPP: number // peso real × (MB recomposta − meta MB da linha)
  impactoMixPP: number // efeito da diferença entre participação real e participação meta normalizada
  impactoTotalPP: number // impactoMargemPP + impactoMixPP; soma fecha com o gap geral
  responsabilidadeGap: number // participação da linha entre os impactos que explicam o lado do gap geral
  mbrMeta: number
  mbrReal: number
  difMbR: number
}

export type SimResult = {
  linhas: SimLinha[]
  totalMetaVenda: number
  totalVendaProjetada: number
  totalDifVenda: number
  totalMetaMB: number
  totalMbPercReal: number
  totalSellout: number
  totalMbPercRealBruto: number
  totalGapMB: number
  totalGapPeso: number
  totalImpactoPesoPP: number
  totalImpactoMargemPP: number
  totalImpactoMixLinhasPP: number
  totalImpactoTotalPP: number
  totalEfeitoPrecoPP: number
  totalEfeitoMixPP: number
  totalPerdaGanhoMB: number
  totalPerdaGanhoVenda: number
  totalPerdaGanhoTotal: number
  totalMbrMeta: number
  totalMbrReal: number
  totalDifMbR: number
  somaMetaParticipacao: number
}

export function simulate(
  rows: MargemRow[],
  mAt: string,
  diasDec: number,
  diasTot: number,
  metaVendaTotal: number,
  metas: LinhaMeta[]
): SimResult {
  const metaMap: Record<string, LinhaMeta> = {}
  metas.forEach((m) => { if (!LINHAS_EXCLUIDAS.has(m.linha)) metaMap[m.linha] = m })

  const realizado: Record<string, { vd: number; mbr: number }> = {}
  semExcluidas(rows).filter((r) => r.mes === mAt).forEach((r) => {
    if (!realizado[r.linha]) realizado[r.linha] = { vd: 0, mbr: 0 }
    realizado[r.linha].vd += r.vd
    realizado[r.linha].mbr += r.mbr
  })

  const todasLinhas = Array.from(new Set([...Object.keys(realizado), ...metas.map((m) => m.linha)])).filter((l) => !LINHAS_EXCLUIDAS.has(l))

  const base = todasLinhas.map((linha) => {
    const r = realizado[linha] || { vd: 0, mbr: 0 }
    const meta = metaMap[linha] || { linha, metaParticipacao: 0, metaMB: 0, sellout: 0 }
    const mbPercReal = r.vd > 0 ? r.mbr / r.vd : 0
    // Projeção linear com limite de segurança: se menos de 3 dias decorridos, usar crescimento conservador
    const vendaProjetada = diasDec > 0
      ? diasDec < 3
        ? r.vd * (diasTot / 3) // Se muito no início, usar no mínimo 3 dias como base
        : (r.vd / diasDec) * diasTot
      : 0
    const metaVenda = metaVendaTotal * meta.metaParticipacao
    // Margem recomposta: margem projetada pela venda + sellout do mês (valor cheio, não escalado por dia)
    const sellout = meta.sellout || 0
    const mbrProjecaoBase = mbPercReal * vendaProjetada
    const mbrRecomp = mbrProjecaoBase + sellout
    const mbPercRecomp = vendaProjetada > 0 ? mbrRecomp / vendaProjetada : 0
    return {
      linha, realizadoVd: r.vd, realizadoMbr: r.mbr, mbPercReal, sellout, mbrRecomp, mbPercRecomp,
      vendaProjetada, metaParticipacao: meta.metaParticipacao, metaMB: meta.metaMB, metaVenda,
    }
  })

  const totalVendaProjetada = base.reduce((s, o) => s + o.vendaProjetada, 0)
  const totalMetaVenda = base.reduce((s, o) => s + o.metaVenda, 0)

  const linhasCalc: SimLinha[] = base.map((o) => {
    const participacaoReal = totalVendaProjetada > 0 ? o.vendaProjetada / totalVendaProjetada : 0
    const difVenda = o.vendaProjetada - o.metaVenda
    const gapPeso = participacaoReal - o.metaParticipacao
    // Gap e perda/ganho usam a margem RECOMPOSTA (real + sellout), não a margem crua
    const gapMB = o.mbPercRecomp - o.metaMB
    const custoMeta = o.metaVenda * (1 - o.metaMB)
    const custoRealizado = (1 - o.mbPercRecomp) * o.vendaProjetada
    const perdaGanhoMB = gapMB * o.vendaProjetada
    const perdaGanhoVenda = difVenda * o.mbPercRecomp
    const perdaGanhoTotal = perdaGanhoMB + perdaGanhoVenda
    const mbrMeta = o.metaVenda * o.metaMB
    const mbrReal = o.vendaProjetada * o.mbPercRecomp
    const difMbR = mbrReal - mbrMeta
    return {
      linha: o.linha, realizadoVd: o.realizadoVd, realizadoMbr: o.realizadoMbr, mbPercReal: o.mbPercReal,
      sellout: o.sellout, mbrRecomp: o.mbrRecomp, mbPercRecomp: o.mbPercRecomp,
      vendaProjetada: o.vendaProjetada, metaParticipacao: o.metaParticipacao, metaMB: o.metaMB, metaVenda: o.metaVenda,
      participacaoReal, difVenda, gapPeso, gapMB, custoMeta, custoRealizado,
      perdaGanhoMB, perdaGanhoVenda, perdaGanhoTotal, percPartPerdaGanho: 0, impactoPesoPP: 0,
      impactoMargemPP: 0, impactoMixPP: 0, impactoTotalPP: 0, responsabilidadeGap: 0, mbrMeta, mbrReal, difMbR,
    }
  })

  const totalDifVenda = linhasCalc.reduce((s, o) => s + o.difVenda, 0)
  const totalCustoMeta = linhasCalc.reduce((s, o) => s + o.custoMeta, 0)
  const totalCustoRealizado = linhasCalc.reduce((s, o) => s + o.custoRealizado, 0)
  const totalMetaMB = totalMetaVenda > 0 ? 1 - totalCustoMeta / totalMetaVenda : 0
  const totalMbPercReal = totalVendaProjetada > 0 ? (totalVendaProjetada - totalCustoRealizado) / totalVendaProjetada : 0
  const totalSellout = linhasCalc.reduce((s, o) => s + o.sellout, 0)
  const totalMbrBruto = linhasCalc.reduce((s, o) => s + o.mbPercReal * o.vendaProjetada, 0)
  const totalMbPercRealBruto = totalVendaProjetada > 0 ? totalMbrBruto / totalVendaProjetada : 0
  const totalGapMB = totalMbPercReal - totalMetaMB
  // Bridge em pp: efeito preço/taxa = Σ pesoReal × (MB recomposta − MB meta da linha); mix = residual (fecha exato)
  const totalEfeitoPrecoPP = linhasCalc.reduce((s, o) => s + o.participacaoReal * (o.mbPercRecomp - o.metaMB), 0)
  const totalEfeitoMixPP = totalGapMB - totalEfeitoPrecoPP
  const totalGapPeso = linhasCalc.reduce((s, o) => s + Math.abs(o.gapPeso), 0) / 2 // soma dos desvios absolutos / 2
  const totalPerdaGanhoMB = totalGapMB * totalVendaProjetada
  const totalPerdaGanhoVenda = totalDifVenda * totalMbPercReal
  const totalPerdaGanhoTotal = totalPerdaGanhoMB + totalPerdaGanhoVenda
  const totalMbrMeta = totalMetaVenda * totalMetaMB
  const totalMbrReal = totalVendaProjetada * totalMbPercReal
  const totalDifMbR = totalMbrReal - totalMbrMeta
  const somaMetaParticipacao = base.reduce((s, o) => s + o.metaParticipacao, 0)

  // Decomposição por linha em pontos percentuais. A meta de participação é normalizada
  // para somar 100%, garantindo que Impacto Margem + Impacto Mix feche exatamente com
  // Margem Real da rede − Meta de Margem da rede.
  const somaMetaPartSegura = somaMetaParticipacao > 0 ? somaMetaParticipacao : 1
  linhasCalc.forEach((o) => {
    o.percPartPerdaGanho = totalPerdaGanhoTotal !== 0 ? o.perdaGanhoTotal / totalPerdaGanhoTotal : 0
    o.impactoPesoPP = o.gapPeso * (o.metaMB - totalMetaMB)
    const metaPartNormalizada = o.metaParticipacao / somaMetaPartSegura
    o.impactoMargemPP = o.participacaoReal * (o.mbPercRecomp - o.metaMB)
    o.impactoMixPP = (o.participacaoReal - metaPartNormalizada) * (o.metaMB - totalMetaMB)
    o.impactoTotalPP = o.impactoMargemPP + o.impactoMixPP
  })
  const totalImpactoPesoPP = linhasCalc.reduce((s, o) => s + o.impactoPesoPP, 0)
  const totalImpactoMargemPP = linhasCalc.reduce((s, o) => s + o.impactoMargemPP, 0)
  const totalImpactoMixLinhasPP = linhasCalc.reduce((s, o) => s + o.impactoMixPP, 0)
  const totalImpactoTotalPP = linhasCalc.reduce((s, o) => s + o.impactoTotalPP, 0)
  const ladoGap = totalGapMB < 0 ? -1 : totalGapMB > 0 ? 1 : 0
  const baseResponsabilidade = linhasCalc.reduce((s, o) => s + (Math.sign(o.impactoTotalPP) === ladoGap ? Math.abs(o.impactoTotalPP) : 0), 0)
  linhasCalc.forEach((o) => {
    o.responsabilidadeGap = baseResponsabilidade > 0 && Math.sign(o.impactoTotalPP) === ladoGap
      ? Math.abs(o.impactoTotalPP) / baseResponsabilidade
      : 0
  })

  return {
    linhas: linhasCalc, totalMetaVenda, totalVendaProjetada, totalDifVenda, totalMetaMB, totalMbPercReal,
    totalSellout, totalMbPercRealBruto,
    totalGapMB, totalGapPeso, totalImpactoPesoPP, totalImpactoMargemPP, totalImpactoMixLinhasPP, totalImpactoTotalPP,
    totalEfeitoPrecoPP, totalEfeitoMixPP, totalPerdaGanhoMB, totalPerdaGanhoVenda, totalPerdaGanhoTotal,
    totalMbrMeta, totalMbrReal, totalDifMbR, somaMetaParticipacao,
  }
}
