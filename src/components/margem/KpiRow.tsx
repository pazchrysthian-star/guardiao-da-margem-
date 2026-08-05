import { Card } from "@/components/ui/card"
import type { CalcResult } from "@/lib/calc"
import { R$, pctS, pp } from "@/lib/format"
import { cn } from "@/lib/utils"

function Kpi({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: "pos" | "neg" }) {
  return (
    <Card className="px-4.5 py-4">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn(
        "font-mono text-[26px] font-semibold tabular-nums",
        tone === "pos" && "text-teal-700",
        tone === "neg" && "text-red-600"
      )}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </Card>
  )
}

export function KpiRow({ c }: { c: CalcResult }) {
  const dR = c.rA - c.rB
  return (
    <div className="mb-4 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
      <Kpi label={`MB% ${c.mBase}`} value={pctS(c.rB)} detail={R$(c.mbB)} />
      <Kpi label={`MB% ${c.mAt}`} value={pctS(c.rA)} detail={R$(c.mbA)} tone={c.rA < c.rB ? "neg" : "pos"} />
      <Kpi label="Variação MB%" value={pp(dR)} detail="vs mês base" tone={dR < 0 ? "neg" : "pos"} />
      <Kpi label="MB% projetado (mês cheio)" value={pctS(c.rAProj)} detail={R$(c.mbAProj)} />
    </div>
  )
}
