import { useState } from "react"
import { computeShareTable, type Periodo, type Fonte } from "@/lib/mercado"
import { pctS } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ShareMercadoSelector({ fonte }: { fonte: Fonte }) {
  const [periodo, setPeriodo] = useState<Periodo>("MAT")

  const dados = computeShareTable(periodo, fonte)

  const nMeses = periodo === "MAT" ? 12 : periodo === "YTD" ? 6 : 3
  const impactoPorLinha = dados.map((d) => ({
    ...d,
    impactoMensal: (d.crescUnipreco - d.crescMercado) * d.vendaUnipreco / nMeses,
  }))
  const impactoTotal = impactoPorLinha.reduce((s, d) => s + d.impactoMensal, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Share Unipreço vs Mercado</CardTitle>
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
              YoY
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-soft">
                <th className="px-3 py-3 text-left font-semibold text-text-main">Linha</th>
                <th className="px-3 py-3 text-right font-semibold text-text-main">Venda Uni</th>
                <th className="px-3 py-3 text-right font-semibold text-text-main">Mercado</th>
                <th className="px-3 py-3 text-right font-semibold text-text-main">Share</th>
                <th className="px-3 py-3 text-right font-semibold text-text-main">Δ Share</th>
                <th className="px-3 py-3 text-right font-semibold text-text-main">Cresc. Uni</th>
                <th className="px-3 py-3 text-right font-semibold text-text-main">Cresc. Merc.</th>
                <th className="px-3 py-3 text-right font-semibold text-text-main">Gap Mensal</th>
              </tr>
            </thead>
            <tbody>
              {impactoPorLinha.map((linha) => (
                <tr key={linha.linha} className="border-b border-border-soft hover:bg-gray-50/50">
                  <td className="px-3 py-2.5 font-medium text-text-main">{linha.linha}</td>
                  <td className="px-3 py-2.5 text-right text-text-main">R$ {(linha.vendaUnipreco / 1e6).toFixed(1)}M</td>
                  <td className="px-3 py-2.5 text-right text-text-main">R$ {(linha.mercadoBricks / 1e6).toFixed(1)}M</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-brand">{pctS(linha.share)}</td>
                  <td className={`px-3 py-2.5 text-right font-semibold ${linha.deltaShare > 0 ? "text-brand" : linha.deltaShare < 0 ? "text-danger-c" : "text-text-muted-c"}`}>
                    {(linha.deltaShare * 100).toFixed(2)}pp
                  </td>
                  <td className={`px-3 py-2.5 text-right font-semibold ${linha.crescUnipreco > 0 ? "text-brand" : "text-danger-c"}`}>
                    {pctS(linha.crescUnipreco)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-semibold ${linha.crescMercado > 0 ? "text-text-main" : "text-text-muted-c"}`}>
                    {pctS(linha.crescMercado)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-semibold ${linha.impactoMensal > 0 ? "text-brand" : "text-danger-c"}`}>
                    R$ {(linha.impactoMensal / 1e6).toFixed(2)}M
                  </td>
                </tr>
              ))}
              {dados.length > 0 && (
                <tr className="border-t-2 border-border-soft bg-brand-soft/30">
                  <td className="px-3 py-3 font-bold text-text-main">TOTAL</td>
                  <td className="px-3 py-3 text-right font-bold text-text-main">R$ {(dados.reduce((s, l) => s + l.vendaUnipreco, 0) / 1e6).toFixed(1)}M</td>
                  <td className="px-3 py-3 text-right font-bold text-text-main">R$ {(dados.reduce((s, l) => s + l.mercadoBricks, 0) / 1e6).toFixed(1)}M</td>
                  <td className="px-3 py-3 text-right font-bold text-brand">
                    {pctS(dados.reduce((s, l) => s + l.vendaUnipreco, 0) / dados.reduce((s, l) => s + l.mercadoBricks, 0))}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-text-muted-c">—</td>
                  <td className={`px-3 py-3 text-right font-bold ${
                    dados.reduce((s, l) => s + l.crescUnipreco, 0) / dados.length > 0 ? "text-brand" : "text-danger-c"
                  }`}>
                    {pctS(dados.reduce((s, l) => s + l.crescUnipreco, 0) / dados.length)}
                  </td>
                  <td className={`px-3 py-3 text-right font-bold ${
                    dados.reduce((s, l) => s + l.crescMercado, 0) / dados.length > 0 ? "text-text-main" : "text-text-muted-c"
                  }`}>
                    {pctS(dados.reduce((s, l) => s + l.crescMercado, 0) / dados.length)}
                  </td>
                  <td className={`px-3 py-3 text-right font-bold ${impactoTotal > 0 ? "text-brand" : "text-danger-c"}`}>
                    R$ {(impactoTotal / 1e6).toFixed(2)}M
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
