import { useState } from "react"
import { evolucaoComparativa, type Fonte } from "@/lib/mercado"
import { pctS, R$ } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

export function EvolucaoAcumuladaSelector({ fonte }: { fonte: Fonte }) {
  const [periodo, setPeriodo] = useState<"MAT" | "YoY" | "TRI">("MAT")

  const nPontos = periodo === "TRI" ? 5 : 4
  const dados = evolucaoComparativa("TOTAL", nPontos, fonte)

  if (dados.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-text-muted-c">Sem dados históricos suficientes</p>
        </CardContent>
      </Card>
    )
  }

  const periodoLabel = periodo === "MAT" ? "Acumulado Móvel (12m)" : periodo === "YoY" ? "Mesmo período ano anterior" : "Último trimestre vs ano anterior"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Evolução Acumulada</CardTitle>
            <p className="mt-1 text-xs text-text-muted-c">{periodoLabel}</p>
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
              onClick={() => setPeriodo("YoY")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                periodo === "YoY"
                  ? "bg-brand text-white border-brand"
                  : "border-border-soft text-text-muted-c hover:border-brand hover:text-brand"
              }`}
            >
              YoY
            </button>
            <button
              onClick={() => setPeriodo("TRI")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                periodo === "TRI"
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
        <div className="space-y-4">
          {dados.map((ponto) => {
            const crescUni = ponto.unipreco > 0 && dados[0].unipreco > 0 ? (ponto.unipreco / dados[0].unipreco - 1) * 100 : 0
            const crescMerc = ponto.mercado > 0 && dados[0].mercado > 0 ? (ponto.mercado / dados[0].mercado - 1) * 100 : 0
            const gap = crescUni - crescMerc

            return (
              <div key={ponto.mesFim} className="border-b border-border-soft pb-4 last:border-0">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-text-main">{ponto.label}</p>
                    <p className="text-xs text-text-muted-c">Share: {pctS(ponto.share)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-text-muted-c">Venda Uni: {R$(ponto.unipreco)}</p>
                    <p className="text-sm text-text-muted-c">Mercado: {R$(ponto.mercado)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-200/50">
                    <p className="text-xs font-semibold text-blue-900 mb-1">Uni vs anterior</p>
                    <div className="flex items-center gap-1.5">
                      {crescUni > 0 ? (
                        <TrendingUp className="size-4 text-brand" />
                      ) : (
                        <TrendingDown className="size-4 text-danger-c" />
                      )}
                      <span className={`font-bold ${crescUni > 0 ? "text-brand" : "text-danger-c"}`}>
                        {crescUni > 0 ? "+" : ""}{crescUni.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200/50">
                    <p className="text-xs font-semibold text-text-main mb-1">Merc. vs anterior</p>
                    <div className="flex items-center gap-1.5">
                      {crescMerc > 0 ? (
                        <TrendingUp className="size-4 text-text-muted-c" />
                      ) : (
                        <TrendingDown className="size-4 text-text-muted-c" />
                      )}
                      <span className="font-bold text-text-main">
                        {crescMerc > 0 ? "+" : ""}{crescMerc.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className={`rounded-lg p-3 border ${gap > 0 ? "bg-green-50/50 border-green-200/50" : "bg-red-50/50 border-red-200/50"}`}>
                    <p className={`text-xs font-semibold mb-1 ${gap > 0 ? "text-green-900" : "text-red-900"}`}>Gap (Uni - Merc)</p>
                    <span className={`font-bold text-lg ${gap > 0 ? "text-brand" : "text-danger-c"}`}>
                      {gap > 0 ? "+" : ""}{gap.toFixed(1)}pp
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
