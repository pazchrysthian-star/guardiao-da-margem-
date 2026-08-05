import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import type { CalcResult } from "@/lib/calc"
import { R$, pctS } from "@/lib/format"
import { cn } from "@/lib/utils"

function GBox({ title, value, detail, tone }: { title: string; value: string; detail: string; tone: "md" | "nm" | "pos" | "neg" | "total" }) {
  return (
    <div className={cn(
      "rounded-xl border p-4 text-center",
      tone === "total" && "border-teal-600 bg-teal-50/50 sm:col-span-2 lg:col-span-4"
    )}>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className={cn(
        "text-2xl font-semibold",
        (tone === "md") && "text-foreground",
        (tone === "nm") && "text-teal-800",
        tone === "pos" && "text-teal-700",
        tone === "neg" && "text-red-600",
        tone === "total" && "text-teal-800"
      )}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </div>
  )
}

export function MargNomGrid({ c }: { c: CalcResult }) {
  const totalB = c.MD_B.m + c.NM_B.m
  const totalProj = c.MD_Proj.m + c.NM_Proj.m
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Margem nominal em R$ — Medicamentos vs Não-medicamentos</CardTitle>
        <CardDescription>Quanto cada grupo contribui em R$ para a margem total (não em %). Compara mês base vs projeção de fechamento do mês atual.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <GBox tone="md" title={`${c.mBase} — Medicamentos`} value={R$(c.MD_B.m)} detail={`${pctS(c.MD_B.m / totalB)} da margem total`} />
          <GBox tone="nm" title={`${c.mBase} — Não-medicamentos`} value={R$(c.NM_B.m)} detail={`${pctS(c.NM_B.m / totalB)} da margem total`} />
          <GBox tone={c.MD_Proj.m > c.MD_B.m ? "pos" : "neg"} title="Medicamentos — Variação (projeção vs base)"
            value={(c.MD_Proj.m > c.MD_B.m ? "+" : "") + R$(c.MD_Proj.m - c.MD_B.m)}
            detail={`${pctS((c.MD_Proj.m - c.MD_B.m) / c.MD_B.m)} vs mês base`} />
          <GBox tone={c.NM_Proj.m > c.NM_B.m ? "pos" : "neg"} title="Não-medicamentos — Variação (projeção vs base)"
            value={(c.NM_Proj.m > c.NM_B.m ? "+" : "") + R$(c.NM_Proj.m - c.NM_B.m)}
            detail={`${pctS((c.NM_Proj.m - c.NM_B.m) / c.NM_B.m)} vs mês base`} />
          <GBox tone="md" title="Medicamentos — Projeção mês cheio" value={R$(c.MD_Proj.m)} detail={`MB% ${pctS(c.MD_Proj.r)}`} />
          <GBox tone="nm" title="Não-medicamentos — Projeção mês cheio" value={R$(c.NM_Proj.m)} detail={`MB% ${pctS(c.NM_Proj.r)}`} />
          <GBox tone="total" title="Margem total projetada para mês cheio" value={R$(totalProj)}
            detail={`MB% ${pctS(c.rAProj)} · Medicamentos ${R$(c.MD_Proj.m)} (${pctS(c.MD_Proj.m / totalProj)}) + Não-medic ${R$(c.NM_Proj.m)} (${pctS(c.NM_Proj.m / totalProj)})`} />
        </div>
      </CardContent>
    </Card>
  )
}
