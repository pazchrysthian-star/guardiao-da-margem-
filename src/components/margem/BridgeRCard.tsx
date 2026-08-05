import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import type { CalcResult } from "@/lib/calc"
import { R$, pctS } from "@/lib/format"
import { cn } from "@/lib/utils"

function Pill({ title, delta, efVol, efTax, extra, accent }: { title: string; delta: number; efVol: number; efTax: number; extra: string; accent?: string }) {
  return (
    <div className="flex-1 min-w-[220px] rounded-xl border p-4" style={accent ? { borderLeft: `4px solid ${accent}` } : undefined}>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className={cn("text-xl font-semibold", delta > 0 ? "text-teal-700" : delta < 0 ? "text-red-600" : "text-foreground")}>
        {delta > 0 ? "+" : ""}{R$(delta)}
      </div>
      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Efeito volume: {R$(efVol)}<br />Efeito taxa: {R$(efTax)}<br />
        <span className="text-[11px]">{extra}</span>
      </div>
    </div>
  )
}

export function BridgeRCard({ c }: { c: CalcResult }) {
  const dM = c.MD_Proj.m - c.MD_B.m
  const dN = c.NM_Proj.m - c.NM_B.m
  const efVolMD = (c.MD_Proj.v - c.MD_B.v) * c.MD_B.r
  const efVolNM = (c.NM_Proj.v - c.NM_B.v) * c.NM_B.r
  const efTaxMD = c.MD_Proj.v * (c.MD_Proj.r - c.MD_B.r)
  const efTaxNM = c.NM_Proj.v * (c.NM_Proj.r - c.NM_B.r)
  const totalProj = c.MD_Proj.m + c.NM_Proj.m

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Bridge de margem em R$ por grupo — Efeito volume vs efeito taxa</CardTitle>
        <CardDescription>Separação clara: ganho/perda de margem projetada (mês cheio) que veio de vender mais (volume) vs vender com MB% diferente (taxa/preço), comparado ao mês base.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3.5">
        <Pill title="Medicamentos" delta={dM} efVol={efVolMD} efTax={efTaxMD}
          extra={`VD: ${R$(c.MD_B.v)} → ${R$(c.MD_Proj.v)} (proj.) | MB%: ${pctS(c.MD_B.r)} → ${pctS(c.MD_Proj.r)}`} />
        <Pill title="Não-medicamentos" delta={dN} efVol={efVolNM} efTax={efTaxNM}
          extra={`VD: ${R$(c.NM_B.v)} → ${R$(c.NM_Proj.v)} (proj.) | MB%: ${pctS(c.NM_B.r)} → ${pctS(c.NM_Proj.r)}`} />
        <Pill title="Total margem R$ (projeção)" delta={totalProj - c.mbB} efVol={efVolMD + efVolNM} efTax={efTaxMD + efTaxNM}
          extra="" accent="var(--color-primary)" />
      </CardContent>
    </Card>
  )
}
