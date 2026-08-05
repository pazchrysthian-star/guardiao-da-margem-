import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import type { CalcResult } from "@/lib/calc"
import { pctS, pp } from "@/lib/format"
import { cn } from "@/lib/utils"

function Pill({ nome, b, a, pA, pB, rB, accent }: { nome: string; b: { r: number }; a: { r: number }; pA: number; pB: number; rB: number; accent: string }) {
  const taxa = pA * (a.r - b.r)
  const mix = (pA - pB) * (b.r - rB)
  const total = taxa + mix
  return (
    <div className="flex-1 min-w-[220px] rounded-xl border p-4" style={{ borderLeft: `4px solid ${accent}` }}>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{nome}</div>
      <div className={cn("text-xl font-semibold", total >= 0 ? "text-teal-700" : "text-red-600")}>{pp(total)}</div>
      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
        taxa {pp(taxa)} · mix {pp(mix)}<br />
        MB% {pctS(b.r)} → {pctS(a.r)} · peso {pctS(pA)}
      </div>
    </div>
  )
}

export function BridgePctCard({ c }: { c: CalcResult }) {
  const pAmd = c.vdA ? c.MD_A.v / c.vdA : 0
  const pBmd = c.vdB ? c.MD_B.v / c.vdB : 0
  const pAnm = c.vdA ? c.NM_A.v / c.vdA : 0
  const pBnm = c.vdB ? c.NM_B.v / c.vdB : 0

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Decomposição da variação da margem % — Medicamentos vs Não-medicamentos</CardTitle>
        <CardDescription>Efeito taxa (MB% do grupo mudou) + efeito mix (peso do grupo na venda mudou), em pontos percentuais da margem total.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3.5">
        <Pill nome="Não-medicamentos" b={c.NM_B} a={c.NM_A} pA={pAnm} pB={pBnm} rB={c.rB} accent="#c0392b" />
        <Pill nome="Medicamentos" b={c.MD_B} a={c.MD_A} pA={pAmd} pB={pBmd} rB={c.rB} accent="#9aa5a8" />
      </CardContent>
    </Card>
  )
}
