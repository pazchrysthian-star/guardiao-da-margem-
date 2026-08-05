import { fabricantesDermocosmeticos } from "@/lib/dermocosmeticosData"
import { R$ } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function DermocosmeticosRanking() {
  // Calcular gap e ordenar (excluir OUTROS)
  const ranking = fabricantesDermocosmeticos
    .filter((f) => f.fabricante !== "OUTROS")
    .map((f) => ({
      ...f,
      gap: f.vendaIdeal - f.mediaMensal,
    }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 6)

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Maiores oportunidades mensais</CardTitle>
        <Badge className="bg-brand text-white hover:bg-brand">Priorizar</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ranking.map((fab, idx) => (
            <div key={fab.fabricante} className="flex items-center gap-3">
              {/* Numeração */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {idx + 1}
              </div>

              {/* Nome e barra */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-text-main">{fab.fabricante}</p>
                  <p className="text-sm font-bold text-brand">{R$(fab.gap)}</p>
                </div>

                {/* Barra horizontal verde */}
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${Math.min((fab.gap / ranking[0].gap) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
