import type { SimResult } from "@/lib/simulador"
import { R$, pctS, pp } from "@/lib/format"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

function MiniCard({ label, value, tone }: { label: string; value: string; tone?: "red" | "green" }) {
  return (
    <div className={cn("rounded-[15px] border border-border-soft bg-[#fafbfc] px-3 py-3 text-center", tone === "red" && "border-red-100 bg-danger-soft", tone === "green" && "border-emerald-100 bg-brand-soft")}>
      <p className="text-[10px] font-bold uppercase tracking-[.06em] text-text-muted-c">{label}</p>
      <p className={cn("mt-1 text-[19px] font-extrabold tabular-nums text-text-main", tone === "red" && "text-danger-c", tone === "green" && "text-brand-dark")}>{value}</p>
    </div>
  )
}

function ImpactBar({ label, value, financial, share, tone, description }: { label: string; value: number; financial: number; share: number; tone: "red" | "purple"; description: string }) {
  const Icon = tone === "red" ? TrendingDown : TrendingUp
  return (
    <div className="rounded-[16px] border border-border-soft bg-white p-4">
      <div className="flex items-start gap-3">
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", tone === "red" ? "bg-danger-soft text-danger-c" : "bg-purple-soft text-purple-c")}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-text-main">{label}</h3>
              <p className="mt-0.5 text-[11.5px] text-text-muted-c">{description}</p>
            </div>
            <div className="text-right">
              <div className={cn("text-lg font-extrabold tabular-nums", tone === "red" ? "text-danger-c" : "text-purple-c")}>{pp(value)}</div>
              <div className="text-[11.5px] font-semibold text-text-muted-c">{R$(financial)}</div>
            </div>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#edf0f3]">
            <div className={cn("h-full rounded-full", tone === "red" ? "bg-danger-c" : "bg-purple-c")} style={{ width: `${Math.max(4, Math.min(100, share * 100))}%` }} />
          </div>
          <p className="mt-1.5 text-[11.5px] font-semibold text-text-muted-c">{Math.round(share * 100)}% do GAP total</p>
        </div>
      </div>
    </div>
  )
}

export function DecomposicaoGapPanel({ s }: { s: SimResult }) {
  const marginAbs = Math.abs(s.totalImpactoMargemPP)
  const mixAbs = Math.abs(s.totalImpactoMixLinhasPP)
  const base = marginAbs + mixAbs || 1

  return (
    <div className="card-shadow flex h-full flex-col rounded-[20px] border border-border-soft bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-extrabold text-text-main">Decomposição do Gap Geral</h2>
        <span className="rounded-full bg-danger-soft px-3 py-1 text-[11.5px] font-bold text-danger-c">GAP TOTAL: {pp(s.totalGapMB)}</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1.5">
        <MiniCard label="Meta da rede" value={pctS(s.totalMetaMB)} />
        <span className="grid size-6 place-items-center text-text-muted-c">−</span>
        <MiniCard label="Margem projetada" value={pctS(s.totalMbPercReal)} />
        <span className="grid size-6 place-items-center text-text-muted-c">=</span>
        <MiniCard label="Diferença" value={pp(s.totalGapMB)} tone={s.totalGapMB < 0 ? "red" : "green"} />
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-3.5">
        <ImpactBar
          label="Efeito margem das linhas" value={s.totalImpactoMargemPP} financial={s.totalImpactoMargemPP * s.totalVendaProjetada}
          share={marginAbs / base} tone="red" description="Quanto abaixo da meta contribuem as margens das linhas"
        />
        <ImpactBar
          label="Efeito participação no mix" value={s.totalImpactoMixLinhasPP} financial={s.totalImpactoMixLinhasPP * s.totalVendaProjetada}
          share={mixAbs / base} tone="purple" description="Desvios de participação vs meta"
        />
      </div>
    </div>
  )
}
