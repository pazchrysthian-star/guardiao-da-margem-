import { fabricantesDermocosmeticos, resumoDermocosmeticos } from "@/lib/dermocosmeticosData"
import { pctFormat, R$ } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const ESCALA_MAX = 20

export function DermocosmeticosShareChart() {
  const { metaShare } = resumoDermocosmeticos

  // Fabricantes para exibir no gráfico (excluir UNIFABRA, UNI COSMETICA pois têm share muito alto)
  const fabricantesGrafico = fabricantesDermocosmeticos.filter(
    (f) => !["UNIFABRA", "UNI COSMETICA"].includes(f.fabricante)
  )

  const acimaMeta = fabricantesDermocosmeticos.filter((f) => f.shareAtual >= metaShare)
  const proximaMeta = fabricantesDermocosmeticos.find((f) => f.shareAtual >= metaShare - 1 && f.shareAtual < metaShare)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Share atual x meta de 16%</CardTitle>
        <CardDescription>Análise comparativa de participação de mercado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Escala */}
          <div className="flex justify-between px-1 text-xs font-medium text-text-muted-c">
            <span>0%</span>
            <span>4%</span>
            <span>8%</span>
            <span>12%</span>
            <span>16%</span>
            <span>20%</span>
          </div>

          {/* Gráfico de barras */}
          <div className="space-y-3">
            {fabricantesGrafico.map((fab) => {
              const isAboveMeta = fab.shareAtual >= metaShare
              const barWidth = (fab.shareAtual / ESCALA_MAX) * 100
              const metaWidth = (metaShare / ESCALA_MAX) * 100

              return (
                <div key={fab.fabricante}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-text-main">{fab.fabricante}</span>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted-c">{R$(fab.vendaIdeal)}</span>
                        <span className={cn("text-sm font-bold", isAboveMeta ? "text-brand" : "text-danger-c")}>
                          {pctFormat(fab.shareAtual)}
                        </span>
                        {!isAboveMeta && (
                          <span className="rounded border border-danger-c bg-danger-soft px-1.5 py-0.5 text-[10px] font-semibold text-danger-c">
                            Abaixo da meta
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative h-7 overflow-hidden rounded bg-gray-100">
                    {/* Barra roxa (share atual) */}
                    <div
                      className="absolute inset-y-0 left-0 bg-purple-c/80"
                      style={{ width: `${barWidth}%` }}
                    />

                    {/* Linha verde (meta) */}
                    <div
                      className="absolute inset-y-0 border-l-2 border-dashed border-orange-500"
                      style={{ left: `${metaWidth}%` }}
                    />

                    {/* Extensão laranja até a meta */}
                    {!isAboveMeta && barWidth < metaWidth && (
                      <div
                        className="absolute inset-y-0 left-0 bg-orange-200/50"
                        style={{ width: `${metaWidth}%`, left: `${barWidth}%` }}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Status acima da meta */}
          {acimaMeta.length > 0 && (
            <div className="mt-6 flex items-start gap-2 rounded-[10px] bg-brand-soft px-3 py-2.5">
              <span className="shrink-0 text-sm font-bold text-brand">✓</span>
              <span className="text-sm font-semibold text-brand-dark">
                Acima da meta: {acimaMeta.map((f) => `${f.fabricante} ${pctFormat(f.shareAtual)}`).join(" | ")}
              </span>
            </div>
          )}

          {/* Status próximo da meta */}
          {proximaMeta && (
            <div className="flex items-start gap-2 rounded-[10px] bg-orange-100 px-3 py-2.5">
              <span className="shrink-0 text-sm">⭐</span>
              <span className="text-sm font-semibold text-orange-900">
                {proximaMeta.fabricante} {pctFormat(proximaMeta.shareAtual)} — próximo da meta
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
