import { resumoDermocosmeticos } from "@/lib/dermocosmeticosData"
import { R$, pctFormat } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ShoppingCart, Target, TrendingUp, BarChart3 } from "lucide-react"

export function DermocosmeticosKpis() {
  const { vendaMediaMensal, vendaIdeal, oportunidadeMensal, crescimentoNecessario } = resumoDermocosmeticos

  const kpis = [
    {
      label: "Venda média mensal",
      value: R$(vendaMediaMensal),
      icon: ShoppingCart,
      bgColor: "bg-purple-soft",
      iconColor: "text-purple-c",
    },
    {
      label: "Venda ideal",
      value: R$(vendaIdeal),
      icon: Target,
      bgColor: "bg-purple-soft",
      iconColor: "text-purple-c",
    },
    {
      label: "Oportunidade mensal",
      value: R$(oportunidadeMensal),
      icon: TrendingUp,
      bgColor: "bg-brand-soft",
      iconColor: "text-brand",
    },
    {
      label: "Crescimento necessário",
      value: pctFormat(crescimentoNecessario),
      icon: BarChart3,
      bgColor: "bg-purple-soft",
      iconColor: "text-purple-c",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon
        return (
          <div key={i} className="rounded-[18px] border border-border-soft bg-white px-4 py-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-text-muted-c">{kpi.label}</p>
                <p className="mt-3 text-2xl font-bold text-text-main">{kpi.value}</p>
              </div>
              <div className={cn("grid size-12 shrink-0 place-items-center rounded-full", kpi.bgColor)}>
                <Icon className={cn("size-6", kpi.iconColor)} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
