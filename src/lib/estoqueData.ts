export type EstoqueCategoria = "geral" | "nao_med" | "med"

export type CurvaABC = "AA" | "A" | "B" | "C" | "D"

export interface LinhaEstoque {
  curva: CurvaABC
  mediaF: number
  estoqueIdeal: number
  estoqueAtual: number
  participacaoAtual: number
  coberturaIdeal: number
  coberturaAtual: number
  diferencaRS: number
  diferencaParticipacao: number
  diferencaCobertura: number
}

export interface EstoqueData {
  label: string
  rows: LinhaEstoque[]
  bloqueado: {
    valor: number
    participacao: number
  }
  total: {
    mediaF: number
    estoqueIdeal: number
    estoqueAtual: number
    participacao: number
    coberturaIdeal: number
    coberturaAtual: number
    diferencaRS: number
    diferencaParticipacao: number
    diferencaCobertura: number
  }
}

export const ESTOQUE_DATA: Record<EstoqueCategoria, EstoqueData> = {
  geral: {
    label: "Estoque Geral",
    rows: [
      { curva: "AA", mediaF: 8246640.09, estoqueIdeal: 7980619.44, estoqueAtual: 6391325.08, participacaoAtual: 0.1099, coberturaIdeal: 30, coberturaAtual: 24.03, diferencaRS: -1589294.36, diferencaParticipacao: -0.0265, diferencaCobertura: -5.97 },
      { curva: "A", mediaF: 8322846.40, estoqueIdeal: 8761223.59, estoqueAtual: 7829505.37, participacaoAtual: 0.1346, coberturaIdeal: 33, coberturaAtual: 29.16, diferencaRS: -931718.22, diferencaParticipacao: -0.0151, diferencaCobertura: -3.47 },
      { curva: "B", mediaF: 7263616.34, estoqueIdeal: 8435167.36, estoqueAtual: 10109839.20, participacaoAtual: 0.1738, coberturaIdeal: 36, coberturaAtual: 43.15, diferencaRS: 1674671.84, diferencaParticipacao: 0.0297, diferencaCobertura: 7.15 },
      { curva: "C", mediaF: 11498087.14, estoqueIdeal: 18545301.84, estoqueAtual: 12407998.93, participacaoAtual: 0.2133, coberturaIdeal: 50, coberturaAtual: 33.45, diferencaRS: -6137302.91, diferencaParticipacao: -0.1036, diferencaCobertura: -16.55 },
      { curva: "D", mediaF: 3058819.46, estoqueIdeal: 14800739.32, estoqueAtual: 19541814.88, participacaoAtual: 0.336, coberturaIdeal: 150, coberturaAtual: 198.05, diferencaRS: 4741075.56, diferencaParticipacao: 0.0831, diferencaCobertura: 48.05 },
    ],
    bloqueado: { valor: 1884956.94, participacao: 0.0324 },
    total: { mediaF: 38390009.43, estoqueIdeal: 58523051.55, estoqueAtual: 58165440.40, participacao: 1, coberturaIdeal: 47.26, coberturaAtual: 46.97, diferencaRS: -2242568.09, diferencaParticipacao: -0.0324, diferencaCobertura: -0.29 },
  },
  nao_med: {
    label: "Não Medicamento",
    rows: [
      { curva: "AA", mediaF: 5943998.21, estoqueIdeal: 5752256.33, estoqueAtual: 3943412.95, participacaoAtual: 0.1265, coberturaIdeal: 30, coberturaAtual: 20.57, diferencaRS: -1808843.38, diferencaParticipacao: -0.0577, diferencaCobertura: -9.43 },
      { curva: "A", mediaF: 5333592.01, estoqueIdeal: 5677694.72, estoqueAtual: 5060205.02, participacaoAtual: 0.1623, coberturaIdeal: 33, coberturaAtual: 29.41, diferencaRS: -617489.70, diferencaParticipacao: -0.0195, diferencaCobertura: -3.59 },
      { curva: "B", mediaF: 3335575.19, estoqueIdeal: 3873571.19, estoqueAtual: 4938606.47, participacaoAtual: 0.1584, coberturaIdeal: 36, coberturaAtual: 45.90, diferencaRS: 1065035.28, diferencaParticipacao: 0.0344, diferencaCobertura: 9.90 },
      { curva: "C", mediaF: 5758628.34, estoqueIdeal: 9288110.23, estoqueAtual: 6234857.80, participacaoAtual: 0.2, coberturaIdeal: 50, coberturaAtual: 33.56, diferencaRS: -3053252.43, diferencaParticipacao: -0.0974, diferencaCobertura: -16.44 },
      { curva: "D", mediaF: 1373359.87, estoqueIdeal: 6645289.69, estoqueAtual: 9207936.48, participacaoAtual: 0.2953, coberturaIdeal: 150, coberturaAtual: 207.85, diferencaRS: 2562646.79, diferencaParticipacao: 0.0826, diferencaCobertura: 57.85 },
    ],
    bloqueado: { valor: 1792024.14, participacao: 0.0575 },
    total: { mediaF: 21745153.62, estoqueIdeal: 31236922.16, estoqueAtual: 31177042.86, participacao: 1, coberturaIdeal: 44.53, coberturaAtual: 44.45, diferencaRS: -1851903.44, diferencaParticipacao: -0.0575, diferencaCobertura: -0.09 },
  },
  med: {
    label: "Medicamento",
    rows: [
      { curva: "AA", mediaF: 2302641.88, estoqueIdeal: 2228363.11, estoqueAtual: 2447912.13, participacaoAtual: 0.0907, coberturaIdeal: 30, coberturaAtual: 32.96, diferencaRS: 219549.02, diferencaParticipacao: 0.0044, diferencaCobertura: 2.96 },
      { curva: "A", mediaF: 2989254.39, estoqueIdeal: 3085681.95, estoqueAtual: 2769300.35, participacaoAtual: 0.1026, coberturaIdeal: 32, coberturaAtual: 28.72, diferencaRS: -316381.60, diferencaParticipacao: -0.0169, diferencaCobertura: -3.28 },
      { curva: "B", mediaF: 3928041.15, estoqueIdeal: 4561596.17, estoqueAtual: 5171232.73, participacaoAtual: 0.1916, coberturaIdeal: 36, coberturaAtual: 40.81, diferencaRS: 609636.56, diferencaParticipacao: 0.0149, diferencaCobertura: 4.81 },
      { curva: "C", mediaF: 5739458.80, estoqueIdeal: 8331472.45, estoqueAtual: 6173141.13, participacaoAtual: 0.2287, coberturaIdeal: 45, coberturaAtual: 33.34, diferencaRS: -2158331.32, diferencaParticipacao: -0.094, diferencaCobertura: -11.66 },
      { curva: "D", mediaF: 1685459.59, estoqueIdeal: 7611752.99, estoqueAtual: 10333878.40, participacaoAtual: 0.3829, coberturaIdeal: 140, coberturaAtual: 190.07, diferencaRS: 2722125.41, diferencaParticipacao: 0.0881, diferencaCobertura: 50.07 },
    ],
    bloqueado: { valor: 92932.80, participacao: 0.0034 },
    total: { mediaF: 16644855.81, estoqueIdeal: 25818866.67, estoqueAtual: 26988397.54, participacao: 1, coberturaIdeal: 48.09, coberturaAtual: 50.26, diferencaRS: 1076598.07, diferencaParticipacao: -0.0034, diferencaCobertura: 2.18 },
  },
}
