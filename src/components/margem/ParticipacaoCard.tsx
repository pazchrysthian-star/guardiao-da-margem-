import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import type { CalcResult } from "@/lib/calc"
import { R$, pctS, pp } from "@/lib/format"
import { cn } from "@/lib/utils"

function Bar({ titulo, md, nm }: { titulo: string; md: number; nm: number }) {
  return (
    <div className="mb-3.5">
      <div className="mb-1.5 text-xs text-muted-foreground">{titulo}</div>
      <div className="flex h-8 overflow-hidden rounded-lg border">
        <div className="flex items-center justify-center overflow-hidden bg-[#5c6b70] text-xs font-semibold whitespace-nowrap text-white" style={{ width: `${(md * 100).toFixed(1)}%` }}>
          Medicamentos {pctS(md)}
        </div>
        <div className="flex items-center justify-center overflow-hidden bg-teal-700 text-xs font-semibold whitespace-nowrap text-white" style={{ width: `${(nm * 100).toFixed(1)}%` }}>
          Não-medic {pctS(nm)}
        </div>
      </div>
    </div>
  )
}

function DeltaCard({ label, from, to, delta, fromVal, toVal, valLabel }: { label: string; from: number; to: number; delta: number; fromVal: string; toVal: string; valLabel: string }) {
  const arrow = delta > 0.00005 ? "▲" : delta < -0.00005 ? "▼" : ""
  return (
    <div className="rounded-lg border bg-muted/30 p-2.5 text-[13px]">
      <span className={cn(delta > 0.00005 && "text-teal-700", delta < -0.00005 && "text-red-600", "font-bold")}>{arrow}</span>{" "}
      <b>{label}</b><br />
      {pctS(from)} → {pctS(to)} ({pp(delta)})<br />
      <span className="text-xs text-muted-foreground">{valLabel} {fromVal} → {toVal}</span>
    </div>
  )
}

export function ParticipacaoCard({ c, mode }: { c: CalcResult; mode: "venda" | "margem" }) {
  const isVenda = mode === "venda"
  const totalB = isVenda ? c.vdB : c.MD_B.m + c.NM_B.m
  const totalA = isVenda ? c.vdA : c.MD_A.m + c.NM_A.m
  const totalProj = isVenda ? c.vdAProj : c.MD_Proj.m + c.NM_Proj.m

  const mdB = isVenda ? c.MD_B.v / c.vdB : c.MD_B.m / totalB
  const nmB = isVenda ? c.NM_B.v / c.vdB : c.NM_B.m / totalB
  const mdA = isVenda ? c.MD_A.v / c.vdA : c.MD_A.m / totalA
  const nmA = isVenda ? c.NM_A.v / c.vdA : c.NM_A.m / totalA
  const mdProj = isVenda ? c.MD_Proj.v / c.vdAProj : c.MD_Proj.m / totalProj
  const nmProj = isVenda ? c.NM_Proj.v / c.vdAProj : c.NM_Proj.m / totalProj

  const dMD = mdA - mdB
  const dNM = nmA - nmB

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{isVenda ? "Participação % na venda — Medicamentos vs Não-medicamentos" : "Participação % na margem nominal (R$)"}</CardTitle>
        <CardDescription>
          {isVenda
            ? "Peso de cada grupo na venda líquida total, mês base vs mês atual."
            : "Quanto da margem total em R$ vem de cada grupo. Mostra se medicamento, apesar de ter MB% menor, ainda gera mais margem em valor absoluto."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Bar titulo={c.mBase} md={mdB} nm={nmB} />
        <Bar titulo={c.mAt} md={mdA} nm={nmA} />
        <Bar titulo="Projeção (mês cheio)" md={mdProj} nm={nmProj} />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DeltaCard label="Medicamentos" from={mdB} to={mdA} delta={dMD}
            fromVal={isVenda ? R$(c.MD_B.v) : R$(c.MD_B.m)} toVal={isVenda ? R$(c.MD_A.v) : R$(c.MD_A.m)}
            valLabel={isVenda ? "Venda" : "Margem"} />
          <DeltaCard label="Não-medicamentos" from={nmB} to={nmA} delta={dNM}
            fromVal={isVenda ? R$(c.NM_B.v) : R$(c.NM_B.m)} toVal={isVenda ? R$(c.NM_A.v) : R$(c.NM_A.m)}
            valLabel={isVenda ? "Venda" : "Margem"} />
        </div>
      </CardContent>
    </Card>
  )
}
