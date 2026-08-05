import { useState } from "react"
import { computeShareGainLossTable, type Periodo, type Fonte } from "@/lib/mercado"
import { pctS, R$ } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

export function T3MShareGainLossSelector({ fonte }: { fonte: Fonte }) {
  const [periodo, setPeriodo] = useState<Periodo>("T3M")

  const dados = computeShareGainLossTable(periodo, fonte)

  const ganhandoShare = dados.filter((d) => d.deltaShareValor > 0).sort((a, b) => b.deltaShareValor - a.deltaShareValor)
  const perdendoShare = dados.filter((d) => d.deltaShareValor < 0).sort((a, b) => a.deltaShareValor - b.deltaShareValor)

  const totalGanho = ganhandoShare.reduce((s, d) => s + d.deltaShareValor, 0)
  const totalPerdido = Math.abs(perdendoShare.reduce((s, d) => s + d.deltaShareValor, 0))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Ganho/Perda de Share em R$</CardTitle>
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
        <div className="space-y-6">
          {/* Resumo de Ganho vs Perda */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50/50 rounded-lg p-4 border border-green-200/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-green-900">Ganho de Share</p>
                <TrendingUp className="size-4 text-brand" />
              </div>
              <p className="text-lg font-bold text-brand">{R$(totalGanho)}</p>
              <p className="text-xs text-text-muted-c mt-1">{ganhandoShare.length} linhas positivas</p>
            </div>
            <div className="bg-red-50/50 rounded-lg p-4 border border-red-200/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-red-900">Perda de Share</p>
                <TrendingDown className="size-4 text-danger-c" />
              </div>
              <p className="text-lg font-bold text-danger-c">{R$(-totalPerdido)}</p>
              <p className="text-xs text-text-muted-c mt-1">{perdendoShare.length} linhas negativas</p>
            </div>
          </div>

          {/* Tabela com Ganhos */}
          {ganhandoShare.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-main mb-3 text-green-900">Linhas Ganhando Share</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-soft">
                      <th className="px-3 py-2 text-left font-semibold text-text-main">Linha</th>
                      <th className="px-3 py-2 text-right font-semibold text-text-main">Share Anterior</th>
                      <th className="px-3 py-2 text-right font-semibold text-text-main">Share Atual</th>
                      <th className="px-3 py-2 text-right font-semibold text-text-main">Δ Share (pp)</th>
                      <th className="px-3 py-2 text-right font-semibold text-text-main">Ganho em R$</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ganhandoShare.map((linha) => (
                      <tr key={linha.linha} className="border-b border-border-soft hover:bg-gray-50/50">
                        <td className="px-3 py-2 font-medium text-text-main">{linha.linha}</td>
                        <td className="px-3 py-2 text-right text-text-muted-c">{pctS(linha.shareAnterior)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-text-main">{pctS(linha.shareAtual)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-brand">
                          +{(linha.deltaSharePercent * 100).toFixed(2)}pp
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-brand">{R$(linha.deltaShareValor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabela com Perdas */}
          {perdendoShare.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-main mb-3 text-red-900">Linhas Perdendo Share</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-soft">
                      <th className="px-3 py-2 text-left font-semibold text-text-main">Linha</th>
                      <th className="px-3 py-2 text-right font-semibold text-text-main">Share Anterior</th>
                      <th className="px-3 py-2 text-right font-semibold text-text-main">Share Atual</th>
                      <th className="px-3 py-2 text-right font-semibold text-text-main">Δ Share (pp)</th>
                      <th className="px-3 py-2 text-right font-semibold text-text-main">Perda em R$</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perdendoShare.map((linha) => (
                      <tr key={linha.linha} className="border-b border-border-soft hover:bg-gray-50/50">
                        <td className="px-3 py-2 font-medium text-text-main">{linha.linha}</td>
                        <td className="px-3 py-2 text-right text-text-muted-c">{pctS(linha.shareAnterior)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-text-main">{pctS(linha.shareAtual)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-danger-c">
                          {(linha.deltaSharePercent * 100).toFixed(2)}pp
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-danger-c">{R$(linha.deltaShareValor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {ganhandoShare.length === 0 && perdendoShare.length === 0 && (
            <p className="text-sm text-text-muted-c text-center py-4">Sem dados de mudança de share</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
