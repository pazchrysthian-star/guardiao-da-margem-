// Projeção de crescimento até dezembro para dermocosméticos
// Objetivo: ir de R$ 872.914,57 para R$ 1.541.313,96 (gap de R$ 668.399,39)
// Período: julho a dezembro (6 meses)

export const cenarioProjecao = {
  mesAtual: "Julho/2026",
  vendaAtual: 872914.57,
  vendaIdeal: 1541313.96,
  gapTotal: 668399.39,
  meses: ["Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
  numeroMeses: 6,
} as const

// 3 cenários de crescimento: conservador (linear -10%), realista (linear), agressivo (linear +10%)
export const cenarios = {
  conservador: {
    nome: "Conservador",
    descricao: "Crescimento de 10% ao mês (~R$ 87.000/mês)",
    cor: "text-orange-600",
    bgCor: "bg-orange-soft",
    incrementoMensal: (cenarioProjecao.gapTotal / cenarioProjecao.numeroMeses) * 0.9,
  },
  realista: {
    nome: "Realista",
    descricao: "Crescimento linear de R$ 111.400 ao mês",
    cor: "text-brand",
    bgCor: "bg-brand-soft",
    incrementoMensal: cenarioProjecao.gapTotal / cenarioProjecao.numeroMeses,
  },
  agressivo: {
    nome: "Agressivo",
    descricao: "Crescimento de 15% ao mês (~R$ 131.000/mês)",
    cor: "text-brand-dark",
    bgCor: "bg-brand-soft",
    incrementoMensal: (cenarioProjecao.gapTotal / cenarioProjecao.numeroMeses) * 1.2,
  },
} as const

// Calcula projeção mês a mês para um cenário
export function calcularProjecao(
  vendaInicial: number,
  incrementoMensal: number,
  numeroMeses: number
) {
  const meses = []
  let vendaAtual = vendaInicial

  for (let i = 0; i < numeroMeses; i++) {
    meses.push({
      mes: cenarioProjecao.meses[i],
      venda: vendaAtual,
      incremento: incrementoMensal,
      crescimentoAcumulado: ((vendaAtual - vendaInicial) / vendaInicial) * 100,
    })
    vendaAtual += incrementoMensal
  }

  return meses
}

// Verifica se atingiu a meta até dezembro
export function atingiuMeta(vendaFinal: number): boolean {
  return vendaFinal >= cenarioProjecao.vendaIdeal
}

// Calcula quanto falta para atingir a meta
export function gapParaMeta(vendaFinal: number): number {
  return Math.max(0, cenarioProjecao.vendaIdeal - vendaFinal)
}
