// Estoque Adaptado - Meta de R$ 52 milhões
// Cálculos baseados no dashboard: totalAdaptado = 52M, bloqueado fixo = 1.664.699,83
// disponivelParaCurvas = 52M - 1.664.699,83 = 50.335.300,17
const disponivelParaCurvas = 50335300.17

export const ESTOQUE_ADAPTADO = {
  totalAdaptado: 52000000.00,
  bloqueado: {
    atual: 1664699.83,
    adaptado: 1664699.83,
  },
  disponivelParaCurvas: disponivelParaCurvas,
  rows: [
    {
      curva: "AA",
      pctIdeal: 0.1479,
      adaptado: disponivelParaCurvas * 0.1479, // 7.440.838,99
      atual: 6096423.30,
      covAlvo: 30,
      covAtual: 24.16,
    },
    {
      curva: "A",
      pctIdeal: 0.1617,
      adaptado: disponivelParaCurvas * 0.1617, // 8.139.218,38
      atual: 7528006.30,
      covAlvo: 33,
      covAtual: 29.68,
    },
    {
      curva: "B",
      pctIdeal: 0.2433,
      adaptado: disponivelParaCurvas * 0.2433, // 12.246.611,77
      atual: 11753495.93,
      covAlvo: 36,
      covAtual: 33.98,
    },
    {
      curva: "C",
      pctIdeal: 0.1808,
      adaptado: disponivelParaCurvas * 0.1808, // 9.100.618,60
      atual: 8065619.33,
      covAlvo: 50,
      covAtual: 43.58,
    },
    {
      curva: "D",
      pctIdeal: 0.2663,
      adaptado: disponivelParaCurvas * 0.2663, // 13.408.011.40
      atual: 19435237.19,
      covAlvo: 150,
      covAtual: 213.84,
    },
  ],
}
