import { useMemo, useState } from "react"
import { computeShareUnificada, type Periodo, type Fonte } from "@/lib/mercado"
import { pctS, R$ } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ShareUnificadoTable({ fonte }: { fonte: Fonte }) {
  const [periodo, setPeriodo] = useState<Periodo>("MAT")

  const dados = useMemo(() => computeShareUnificada(periodo, fonte), [periodo, fonte])

  const nMeses = periodo === "MAT" ? 12 : periodo === "YTD" ? 6 : 3

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Share Unipreço vs Mercado — Análise Completa</CardTitle>
            <p className="mt-1 text-xs text-text-muted-c">Venda, participação, crescimento e ganho/perda de share em {nMeses} meses</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriodo("MAT")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                periodo === "MAT"
                  ? "bg-brand text-white border-brand"
                  : "border-border-soft text-text-muted-c hover:border-brand hover:text-brand"
              }`}
            >
              MAT
            </button>
            <button
              onClick={() => setPeriodo("YTD")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                periodo === "YTD"
                  ? "bg-brand text-white border-brand"
                  : "border-border-soft text-text-muted-c hover:border-brand hover:text-brand"
              }`}
            >
              YTD
            </button>
            <button
              onClick={() => setPeriodo("T3M")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                periodo === "T3M"
                  ? "bg-brand text-white border-brand"
                  : "border-border-soft text-text-muted-c hover:border-brand hover:text-brand"
              }`}
            >
              TRI
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-border-soft bg-gray-50">
                <th className="px-2 py-2 text-left font-bold text-text-main">Linha</th>
                <th className="px-2 py-2 text-right font-bold text-text-main">Venda Uni</th>
                <th className="px-2 py-2 text-right font-bold text-text-main">Venda Merc</th>
                <th className="px-2 py-2 text-right font-bold text-text-main">Share %</th>
                <th className="px-2 py-2 text-right font-bold text-text-main">Δ Share pp</th>
                <th className="px-2 py-2 text-right font-bold text-text-main">Cresc. Merc %</th>
                <th className="px-2 py-2 text-right font-bold text-text-main">Cresc. Uni %</th>
                <th className="px-2 py-2 text-right font-bold text-text-main">Gap %</th>
                <th className="px-2 py-2 text-right font-bold text-text-main">Ganho/Perda Total</th>
                <th className="px-2 py-2 text-right font-bold text-brand">Ganho/Perda Mensal</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((linha) => (
                <tr key={linha.linha} className="border-b border-border-soft hover:bg-gray-50/50">
                  <td className="px-2 py-2 font-medium text-text-main">{linha.linha}</td>
                  <td className="px-2 py-2 text-right text-text-main">{R$(linha.vendaUnipreco)}</td>
                  <td className="px-2 py-2 text-right text-text-muted-c">{R$(linha.vendaMercado)}</td>
                  <td className="px-2 py-2 text-right font-semibold text-brand">{pctS(linha.share)}</td>
                  <td
                    className={`px-2 py-2 text-right font-semibold ${
                      linha.variacaoShare > 0 ? "text-brand" : linha.variacaoShare < 0 ? "text-danger-c" : "text-text-muted-c"
                    }`}
                  >
                    {(linha.variacaoShare * 100).toFixed(2)}pp
                  </td>
                  <td className={`px-2 py-2 text-right ${linha.crescimentoMercado > 0 ? "text-text-main" : "text-text-muted-c"}`}>
                    {pctS(linha.crescimentoMercado)}
                  </td>
                  <td
                    className={`px-2 py-2 text-right font-semibold ${
                      linha.crescimentoUni > 0 ? "text-brand" : "text-danger-c"
                    }`}
                  >
                    {pctS(linha.crescimentoUni)}
                  </td>
                  <td
                    className={`px-2 py-2 text-right font-semibold ${
                      linha.gapCrescimento > 0 ? "text-brand" : "text-danger-c"
                    }`}
                  >
                    {(linha.gapCrescimento * 100).toFixed(1)}pp
                  </td>
                  <td
                    className={`px-2 py-2 text-right font-semibold ${
                      linha.ganhoPerdaValor > 0 ? "text-brand" : "text-danger-c"
                    }`}
                  >
                    {R$(linha.ganhoPerdaValor)}
                  </td>
                  <td
                    className={`px-2 py-2 text-right font-bold ${
                      linha.ganhoPerdaMensal > 0 ? "bg-brand-soft text-brand" : "bg-danger-soft text-danger-c"
                    }`}
                  >
                    {R$(linha.ganhoPerdaMensal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
