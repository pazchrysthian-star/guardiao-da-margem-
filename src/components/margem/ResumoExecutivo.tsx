import type { SimResult } from "@/lib/simulador"
import { pctS, pp } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Target, ArrowUp, ArrowDown } from "lucide-react"

function compactMi(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return (v < 0 ? "-" : "") + "R$ " + (abs / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " Mi"
  if (abs >= 1_000) return (v < 0 ? "-" : "") + "R$ " + (abs / 1_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " mil"
  return (v < 0 ? "-" : "") + "R$ " + Math.round(abs).toLocaleString("pt-BR")
}

function Ring({ pct }: { pct: number }) {
  const r = 26, c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(pct, 1.2))
  const filled = Math.min(clamped, 1) * c
  return (
    <svg width={68} height={68} viewBox="0 0 68 68" role="img" aria-label={`Progresso da meta de MB%: ${Math.round(pct * 100)}%`}>
      <circle cx={34} cy={34} r={r} fill="none" stroke="var(--brand-soft)" strokeWidth={7} />
      <circle
        cx={34} cy={34} r={r} fill="none"
        stroke={pct >= 1 ? "var(--brand)" : pct >= 0.85 ? "var(--brand)" : "var(--warning-c)"}
        strokeWidth={7} strokeLinecap="round"
        strokeDasharray={`${filled} ${c - filled}`}
        transform="rotate(-90 34 34)"
      />
      <text x={34} y={38} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--text-main)">{Math.round(pct * 100)}%</text>
    </svg>
  )
}

function Ind({ label, value, valueClass, sub, badge, badgeTone }: {
  label: string; value: string; valueClass?: string; sub?: string
  badge?: React.ReactNode; badgeTone?: "green" | "red"
}) {
  return (
    <div className="flex min-w-[130px] flex-col items-center gap-1 px-4 text-center">
      <span className="text-[12px] font-semibold text-text-muted-c">{label}</span>
      <span className={cn("text-[20px] font-bold leading-tight tabular-nums", valueClass)}>{value}</span>
      <span className="flex items-center gap-1.5 text-[11.5px] text-text-muted-c">
        {sub}
        {badge && (
          <span className={cn(
            "flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
            badgeTone === "green" ? "bg-brand-soft text-brand-dark" : "bg-danger-soft text-danger-c"
          )}>{badge}</span>
        )}
      </span>
    </div>
  )
}

export function ResumoExecutivo({ s }: { s: SimResult }) {
  const vendaPct = s.totalMetaVenda > 0 ? s.totalVendaProjetada / s.totalMetaVenda - 1 : 0
  const vendaAcima = vendaPct >= 0
  const gapNeg = s.totalGapMB < 0
  const progresso = s.totalMetaMB > 0 ? s.totalMbPercReal / s.totalMetaMB : 0

  return (
    <section aria-label="Resumo executivo" className="card-shadow mt-6 flex flex-wrap items-center gap-y-5 rounded-[18px] border border-border-soft bg-white px-4 py-5 sm:px-6">
      <div className="flex min-w-[260px] flex-1 items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-brand text-white" aria-hidden>
          <Target className="size-6" />
        </span>
        <div>
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-text-main">Resumo executivo</h3>
          <p className="mt-0.5 max-w-[240px] text-[12.5px] leading-snug text-text-muted-c">
            Cenário projetado para o mês com base nos dados até o momento.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-center gap-y-4 sm:justify-end sm:divide-x sm:divide-border-soft">
        <Ind
          label="Venda Projetada"
          value={compactMi(s.totalVendaProjetada)}
          valueClass={vendaAcima ? "text-brand" : "text-danger-c"}
          sub={`Meta: ${compactMi(s.totalMetaVenda)}`}
          badge={<>{vendaAcima ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />} {pctS(Math.abs(vendaPct))}</>}
          badgeTone={vendaAcima ? "green" : "red"}
        />
        <Ind
          label="MB% Projetada"
          value={pctS(s.totalMbPercReal)}
          valueClass="text-blue-brand"
          sub={`Meta: ${pctS(s.totalMetaMB)}`}
          badge={<>{gapNeg ? <ArrowDown className="size-3" aria-hidden /> : <ArrowUp className="size-3" aria-hidden />} {pp(s.totalGapMB)}</>}
          badgeTone={gapNeg ? "red" : "green"}
        />
        <Ind
          label="Gap de Margem"
          value={pp(s.totalGapMB)}
          valueClass={gapNeg ? "text-danger-c" : "text-brand"}
          sub="vs meta"
        />
        <Ind
          label={s.totalPerdaGanhoTotal < 0 ? "Perda de Margem Total" : "Ganho de Margem Total"}
          value={compactMi(s.totalPerdaGanhoTotal)}
          valueClass={s.totalPerdaGanhoTotal < 0 ? "text-danger-c" : "text-brand"}
          sub="Impacto financeiro"
        />
        <div className="flex min-w-[130px] flex-col items-center gap-1 px-4 text-center">
          <span className="text-[12px] font-semibold text-text-muted-c">Progresso da Meta</span>
          <Ring pct={progresso} />
          <span className="text-[11.5px] text-text-muted-c">da meta de MB%</span>
        </div>
      </div>
    </section>
  )
}
