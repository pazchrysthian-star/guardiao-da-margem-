import { DermocosmeticosKpis } from "./DermocosmeticosKpis"
import { DermocosmeticosShareChart } from "./DermocosmeticosShareChart"
import { DermocosmeticosRanking } from "./DermocosmeticosRanking"
import { DermocosmeticosPlanoCapturaGap } from "./DermocosmeticosPlanoCapturaGap"
import { DermocosmeticosFoco } from "./DermocosmeticosFoco"
import { DermocosmeticosProjecao } from "./DermocosmeticosProjecao"

export function GapDermocosmeticosSection() {
  return (
    <section className="space-y-8">
      {/* Título */}
      <div>
        <h2 className="text-3xl font-black text-brand-dark">GAP DERMOCOSMÉTICOS</h2>
        <p className="mt-1 text-sm text-text-muted-c">Venda média mensal, share atual e potencial | Meta de share: 16%</p>
      </div>

      {/* KPIs */}
      <DermocosmeticosKpis />

      {/* Share Chart + Ranking */}
      <div className="grid gap-4 lg:grid-cols-[1fr_0.6fr]">
        <DermocosmeticosShareChart />
        <DermocosmeticosRanking />
      </div>

      {/* Plano de Captura */}
      <DermocosmeticosPlanoCapturaGap />

      {/* Projeção até Dezembro */}
      <div className="rounded-[18px] border border-border-soft bg-white p-6 shadow-sm">
        <DermocosmeticosProjecao />
      </div>

      {/* Foco */}
      <DermocosmeticosFoco />
    </section>
  )
}
