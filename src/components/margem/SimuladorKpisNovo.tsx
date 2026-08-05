import type { SimResult } from "@/lib/simulador"
import { R$, pctS, pp } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ShoppingCart, TrendingUp, DollarSign, PieChart, TriangleAlert, ArrowDown, ArrowUp, Info } from "lucide-react"

type Tone = "green" | "blue" | "red" | "purple" | "orange"

const iconBg: Record<Tone, string> = {
  green: "bg-brand text-white",
  blue: "bg-blue-brand text-white",
  red: "bg-danger-c text-white",
  purple: "bg-purple-c text-white",
  orange: "bg-warning-c text-white",
}
const pillCls: Record<"pos" | "neg" | "neutral-purple", string> = {
  pos: "bg-brand-soft text-brand-dark",
  neg: "bg-danger-soft text-danger-c",
  "neutral-purple": "bg-purple-soft text-purple-c",
}

function Kpi({ icon, tone, title, value, valueClass, detail, pill, pillTone }: {
  icon: React.ReactNode
  tone: Tone
  title: string
  value: string
  valueClass?: string
  detail: React.ReactNode
  pill: React.ReactNode
  pillTone: "pos" | "neg" | "neutral-purple"
}) {
  return (
    <article className="card-shadow flex min-h-[190px] flex-col rounded-[18px] border border-border-soft bg-white p-4.5 transition-all duration-200 hover:-translate-y-0.5">
      <div className="mb-3 flex items-start gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", iconBg[tone])} aria-hidden>{icon}</span>
        <div className="min-w-0">
          <h3 className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-text-muted-c">
            {title}
            <Info className="size-3 shrink-0 opacity-60" aria-hidden />
          </h3>
          <div className={cn("mt-0.5 text-[26px] font-extrabold leading-tight tabular-nums", valueClass || "text-text-main")}>{value}</div>
        </div>
      </div>
      <div className="mb-3 text-[12.5px] text-text-muted-c">{detail}</div>
      <div className={cn("mt-auto flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-[12px] font-bold", pillCls[pillTone])}>
        {pill}
      </div>
    </article>
  )
}

export function SimuladorKpis({ s }: { s: SimResult }) {
  const vendaGapPct = s.totalMetaVenda > 0 ? s.totalVendaProjetada / s.totalMetaVenda - 1 : 0
  const vendaAcima = vendaGapPct >= 0
  const gapNegativo = s.totalGapMB < 0

  return (
    <section className="mb-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi
          icon={<ShoppingCart className="size-5" />} tone="green"
          title="Venda projetada (total)"
          value={R$(s.totalVendaProjetada)}
          valueClass={vendaAcima ? "text-text-main" : "text-text-main"}
          detail={`Meta: ${R$(s.totalMetaVenda)}`}
          pill={<>{vendaAcima ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />} {pctS(Math.abs(vendaGapPct))} {vendaAcima ? "acima" : "abaixo"} da meta</>}
          pillTone={vendaAcima ? "pos" : "neg"}
        />
        <Kpi
          icon={<TrendingUp className="size-5" />} tone="blue"
          title="MB% real (projeção)"
          value={pctS(s.totalMbPercReal)}
          detail={`Meta: ${pctS(s.totalMetaMB)}`}
          pill={<>{gapNegativo ? <ArrowDown className="size-3.5" /> : <ArrowUp className="size-3.5" />} {pp(s.totalGapMB)} {gapNegativo ? "abaixo" : "acima"} da meta</>}
          pillTone={gapNegativo ? "neg" : "pos"}
        />
        <Kpi
          icon={<DollarSign className="size-5" />} tone="red"
          title="Perda de margem total"
          value={R$(s.totalPerdaGanhoTotal)}
          valueClass={s.totalPerdaGanhoTotal < 0 ? "text-danger-c" : "text-brand-dark"}
          detail={<>Efeito MB%: {R$(s.totalPerdaGanhoMB)}<br />Efeito mix: {R$(s.totalPerdaGanhoVenda)}</>}
          pill="Impacto financeiro do cenário"
          pillTone="neg"
        />
        <Kpi
          icon={<PieChart className="size-5" />} tone="purple"
          title="Gap de peso (mix)"
          value={pctS(s.totalGapPeso)}
          valueClass="text-purple-c"
          detail="Soma dos desvios de participação"
          pill="Impacto negativo no mix"
          pillTone="neutral-purple"
        />
        <Kpi
          icon={<TriangleAlert className="size-5" />} tone="orange"
          title="Gap de MB%"
          value={pp(s.totalGapMB)}
          valueClass={gapNegativo ? "text-danger-c" : "text-brand-dark"}
          detail="Real vs meta, ponderado"
          pill="Impacto negativo na margem"
          pillTone={gapNegativo ? "neg" : "pos"}
        />
      </div>
    </section>
  )
}
