import { fabricantesDermocosmeticos } from "@/lib/dermocosmeticosData"
import { R$, pctFormat } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DermocosmeticosPlanoCapturaGap() {
  // Exibir todos os fabricantes (excluir apenas UNIFABRA e UNI COSMETICA que têm share muito alto)
  const tabelaFabs = fabricantesDermocosmeticos
    .filter((f) => !["UNIFABRA", "UNI COSMETICA"].includes(f.fabricante))
    .sort((a, b) => b.crescimento - a.crescimento)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plano de captura do gap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-soft">
                <th className="px-3 py-3 text-left font-semibold text-text-main">Fabricante</th>
                <th className="px-3 py-3 text-right font-semibold text-text-main">Share atual</th>
                <th className="px-3 py-3 text-right font-semibold text-text-main">Venda ideal</th>
                <th className="px-3 py-3 text-right font-semibold text-text-main">Gap</th>
                <th className="px-3 py-3 text-right font-semibold text-text-main">Crescimento</th>
              </tr>
            </thead>
            <tbody>
              {tabelaFabs.map((fab) => {
                const gap = fab.vendaIdeal - fab.mediaMensal
                return (
                  <tr key={fab.fabricante} className="border-b border-border-soft hover:bg-gray-50/50">
                    <td className="px-3 py-2.5 font-medium text-text-main">{fab.fabricante}</td>
                    <td className="px-3 py-2.5 text-right text-text-main">{pctFormat(fab.shareAtual)}</td>
                    <td className="px-3 py-2.5 text-right text-text-main">{R$(fab.vendaIdeal)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-brand">{R$(gap)}</td>
                    <td className={cn("px-3 py-2.5 text-right font-semibold", fab.crescimento > 0 ? "text-brand" : "text-text-main")}>
                      {pctFormat(fab.crescimento)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
