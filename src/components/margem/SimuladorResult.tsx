import { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { SimResult, SimLinha } from "@/lib/simulador"
import { R$, pctS, pp } from "@/lib/format"
import { cn } from "@/lib/utils"
import { heatBg, maxAbsOf } from "@/lib/heat"

function Kpi({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: "pos" | "neg" }) {
  return (
    <Card className="px-4.5 py-4">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("font-mono text-2xl font-semibold tabular-nums", tone === "pos" && "text-teal-700", tone === "neg" && "text-red-600")}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </Card>
  )
}

export function SimuladorKpis({ s }: { s: SimResult }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
      <Kpi label="Venda projetada (total)" value={R$(s.totalVendaProjetada)} detail={`Meta: ${R$(s.totalMetaVenda)}`}
        tone={s.totalVendaProjetada >= s.totalMetaVenda ? "pos" : "neg"} />
      <Kpi label="MB% real (projeção)" value={pctS(s.totalMbPercReal)} detail={`Meta: ${pctS(s.totalMetaMB)}`}
        tone={s.totalGapMB >= 0 ? "pos" : "neg"} />
      <Kpi label="Gap de MB%" value={pp(s.totalGapMB)} detail="real vs meta, ponderado" tone={s.totalGapMB >= 0 ? "pos" : "neg"} />
      <Kpi label="Gap de peso (mix)" value={pctS(s.totalGapPeso)} detail="soma dos desvios de participação" tone={s.totalGapPeso < 0.03 ? "pos" : "neg"} />
      <Kpi label="Perda/Ganho margem total" value={R$(s.totalPerdaGanhoTotal)}
        detail={`Efeito MB%: ${R$(s.totalPerdaGanhoMB)} · Efeito mix: ${R$(s.totalPerdaGanhoVenda)}`}
        tone={s.totalPerdaGanhoTotal >= 0 ? "pos" : "neg"} />
    </div>
  )
}

type ColKey = keyof Pick<SimLinha,
  "linha" | "metaVenda" | "vendaProjetada" | "difVenda" | "participacaoReal" | "metaParticipacao" |
  "gapPeso" | "metaMB" | "mbPercReal" | "sellout" | "mbPercRecomp" | "gapMB" | "perdaGanhoMB" | "perdaGanhoVenda" | "perdaGanhoTotal" | "percPartPerdaGanho">

const COLS: { key: ColKey; label: string }[] = [
  { key: "linha", label: "Linha" },
  { key: "metaVenda", label: "Venda Meta" },
  { key: "vendaProjetada", label: "Venda Projetada" },
  { key: "difVenda", label: "Dif. Venda" },
  { key: "participacaoReal", label: "Peso Real" },
  { key: "metaParticipacao", label: "Peso Meta" },
  { key: "gapPeso", label: "Gap Peso" },
  { key: "metaMB", label: "MB% Meta" },
  { key: "mbPercReal", label: "MB% Real (sem sellout)" },
  { key: "sellout", label: "Sellout R$" },
  { key: "mbPercRecomp", label: "MB% Recomposta" },
  { key: "gapMB", label: "Gap MB%" },
  { key: "perdaGanhoMB", label: "Perda/Ganho MB%" },
  { key: "perdaGanhoVenda", label: "Perda/Ganho Venda" },
  { key: "perdaGanhoTotal", label: "Perda/Ganho Total" },
  { key: "percPartPerdaGanho", label: "% do Total" },
]

function StatusBadge({ v, forte, fraco }: { v: number; forte: number; fraco: number }) {
  if (v >= forte) return <Badge variant="success">🟢 Oportunidade</Badge>
  if (v <= -forte) return <Badge variant="danger">🔴 Atenção</Badge>
  if (Math.abs(v) <= fraco) return <Badge variant="neutral">Neutro</Badge>
  return v > 0 ? <Badge variant="secondary">Levemente positivo</Badge> : <Badge variant="secondary">Levemente negativo</Badge>
}

export function SimuladorTable({ s }: { s: SimResult }) {
  const [sort, setSort] = useState<{ col: ColKey; dir: 1 | -1 }>({ col: "perdaGanhoTotal", dir: 1 })

  const rows = useMemo(() => {
    return s.linhas.slice().sort((a, b) => {
      if (sort.col === "linha") return a.linha.localeCompare(b.linha) * sort.dir
      return (a[sort.col] - b[sort.col]) * sort.dir
    })
  }, [s.linhas, sort])

  const toggleSort = (col: ColKey) => {
    setSort((prev) => (prev.col === col ? { col, dir: prev.dir === 1 ? -1 : 1 } : { col, dir: col === "linha" ? 1 : -1 }))
  }

  const maxGapPeso = maxAbsOf(s.linhas, (l) => l.gapPeso)
  const maxGapMB = maxAbsOf(s.linhas, (l) => l.gapMB)
  const maxPGMB = maxAbsOf(s.linhas, (l) => l.perdaGanhoMB)
  const maxPGVenda = maxAbsOf(s.linhas, (l) => l.perdaGanhoVenda)
  const maxPGTotal = maxAbsOf(s.linhas, (l) => l.perdaGanhoTotal)

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Resultado do simulador por linha</CardTitle>
        <CardDescription>
          Clique nos cabeçalhos para ordenar. Cor de fundo mais forte = maior oportunidade (verde) ou maior risco (vermelho).
          Venda projetada = extrapolação linear pelos dias informados nos controles do Bridge.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0">
        <Table>
          <TableHeader>
            <TableRow>
              {COLS.map((c, i) => (
                <TableHead key={c.key} className={cn("cursor-pointer select-none hover:bg-white/10", i === 0 && "pl-5")} onClick={() => toggleSort(c.key)}>
                  {c.label}{sort.col === c.key ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
                </TableHead>
              ))}
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((l) => (
              <TableRow key={l.linha}>
                <TableCell className="pl-5 font-semibold">{l.linha}</TableCell>
                <TableCell>{R$(l.metaVenda)}</TableCell>
                <TableCell>{R$(l.vendaProjetada)}</TableCell>
                <TableCell className={cn(l.difVenda < 0 && "text-red-700", l.difVenda > 0 && "text-teal-800")}>{R$(l.difVenda)}</TableCell>
                <TableCell>{pctS(l.participacaoReal)}</TableCell>
                <TableCell>{pctS(l.metaParticipacao)}</TableCell>
                <TableCell style={heatBg(l.gapPeso, maxGapPeso)} className={cn("font-medium", l.gapPeso < 0 && "text-red-700", l.gapPeso > 0 && "text-teal-800")}>{pp(l.gapPeso)}</TableCell>
                <TableCell>{pctS(l.metaMB)}</TableCell>
                <TableCell className="text-muted-foreground">{pctS(l.mbPercReal)}</TableCell>
                <TableCell className={cn(l.sellout > 0 && "font-semibold text-teal-800")}>{l.sellout > 0 ? R$(l.sellout) : "—"}</TableCell>
                <TableCell className="font-semibold">{pctS(l.mbPercRecomp)}</TableCell>
                <TableCell style={heatBg(l.gapMB, maxGapMB)} className={cn("font-medium", l.gapMB < 0 && "text-red-700", l.gapMB > 0 && "text-teal-800")}>{pp(l.gapMB)}</TableCell>
                <TableCell style={heatBg(l.perdaGanhoMB, maxPGMB)} className={cn(l.perdaGanhoMB < 0 && "text-red-700", l.perdaGanhoMB > 0 && "text-teal-800")}>{R$(l.perdaGanhoMB)}</TableCell>
                <TableCell style={heatBg(l.perdaGanhoVenda, maxPGVenda)} className={cn(l.perdaGanhoVenda < 0 && "text-red-700", l.perdaGanhoVenda > 0 && "text-teal-800")}>{R$(l.perdaGanhoVenda)}</TableCell>
                <TableCell style={heatBg(l.perdaGanhoTotal, maxPGTotal)} className={cn("font-bold", l.perdaGanhoTotal < 0 && "text-red-700", l.perdaGanhoTotal > 0 && "text-teal-800")}>{R$(l.perdaGanhoTotal)}</TableCell>
                <TableCell>{pctS(l.percPartPerdaGanho)}</TableCell>
                <TableCell><StatusBadge v={l.perdaGanhoTotal} forte={maxPGTotal * 0.25} fraco={maxPGTotal * 0.05} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
          <tfoot>
            <TableRow className="border-t-2 bg-teal-50/80 font-semibold hover:bg-teal-50/80">
              <TableCell className="pl-5">TOTAL GERAL</TableCell>
              <TableCell>{R$(s.totalMetaVenda)}</TableCell>
              <TableCell>{R$(s.totalVendaProjetada)}</TableCell>
              <TableCell className={cn(s.totalDifVenda < 0 && "text-red-700", s.totalDifVenda > 0 && "text-teal-800")}>{R$(s.totalDifVenda)}</TableCell>
              <TableCell>{pctS(1)}</TableCell>
              <TableCell>{pctS(s.somaMetaParticipacao)}</TableCell>
              <TableCell>{pp(s.totalGapPeso)}</TableCell>
              <TableCell>{pctS(s.totalMetaMB)}</TableCell>
              <TableCell className="text-muted-foreground">{pctS(s.totalMbPercRealBruto)}</TableCell>
              <TableCell className={cn(s.totalSellout > 0 && "font-semibold text-teal-800")}>{s.totalSellout > 0 ? R$(s.totalSellout) : "—"}</TableCell>
              <TableCell className="font-semibold">{pctS(s.totalMbPercReal)}</TableCell>
              <TableCell className={cn(s.totalGapMB < 0 && "text-red-700", s.totalGapMB > 0 && "text-teal-800")}>{pp(s.totalGapMB)}</TableCell>
              <TableCell className={cn(s.totalPerdaGanhoMB < 0 && "text-red-700", s.totalPerdaGanhoMB > 0 && "text-teal-800")}>{R$(s.totalPerdaGanhoMB)}</TableCell>
              <TableCell className={cn(s.totalPerdaGanhoVenda < 0 && "text-red-700", s.totalPerdaGanhoVenda > 0 && "text-teal-800")}>{R$(s.totalPerdaGanhoVenda)}</TableCell>
              <TableCell className={cn(s.totalPerdaGanhoTotal < 0 && "text-red-700", s.totalPerdaGanhoTotal > 0 && "text-teal-800")}>{R$(s.totalPerdaGanhoTotal)}</TableCell>
              <TableCell>{pctS(1)}</TableCell>
              <TableCell>—</TableCell>
            </TableRow>
          </tfoot>
        </Table>
      </CardContent>
    </Card>
  )
}
