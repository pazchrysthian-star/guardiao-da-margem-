import { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { CalcResult } from "@/lib/calc"
import { R$, pctS, pp } from "@/lib/format"
import { cn } from "@/lib/utils"
import { heatBg, maxAbsOf } from "@/lib/heat"

type ColKey = "linha" | "pesoB" | "pesoA" | "pesoProj" | "dPeso" | "mbrB" | "mbrA" | "mbrProj" | "mbpB" | "mbpA" | "mbpProj"

const COLS: { key: ColKey; label: string }[] = [
  { key: "linha", label: "Linha" },
  { key: "pesoB", label: "Peso base" },
  { key: "pesoA", label: "Peso atual" },
  { key: "pesoProj", label: "Peso proj." },
  { key: "dPeso", label: "Δ Peso (proj. vs base)" },
  { key: "mbrB", label: "Margem R$ base" },
  { key: "mbrA", label: "Margem R$ atual" },
  { key: "mbrProj", label: "Margem R$ proj." },
  { key: "mbpB", label: "MB% base" },
  { key: "mbpA", label: "MB% atual" },
  { key: "mbpProj", label: "MB% proj." },
]

export function LinhasTable({ c }: { c: CalcResult }) {
  const [sort, setSort] = useState<{ col: ColKey; dir: 1 | -1 }>({ col: "pesoA", dir: -1 })

  const data = useMemo(() => {
    return c.linhas.slice().sort((a, b) => {
      if (sort.col === "linha") return a.linha.localeCompare(b.linha) * -sort.dir
      return (a[sort.col] - b[sort.col]) * -sort.dir
    })
  }, [c.linhas, sort])

  const toggleSort = (col: ColKey) => {
    setSort((prev) => (prev.col === col ? { col, dir: prev.dir === 1 ? -1 : 1 } : { col, dir: -1 }))
  }

  const arrow = (v: number) => (v > 0.00005 ? "▲" : v < -0.00005 ? "▼" : "")
  const maxDPeso = maxAbsOf(c.linhas, (o) => o.dPeso)

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Análise por linha — Margem nominal e peso de venda</CardTitle>
        <CardDescription>Cada linha: peso na venda, margem em R$, MB%, e como muda do mês base para a projeção de fechamento do mês atual. Clique nos cabeçalhos para ordenar.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0">
        <Table>
          <TableHeader>
            <TableRow>
              {COLS.map((cn2, i) => (
                <TableHead key={cn2.key} className={cn("cursor-pointer select-none hover:bg-white/10", i === 0 && "pl-5")} onClick={() => toggleSort(cn2.key)}>
                  {cn2.label}{sort.col === cn2.key ? (sort.dir === -1 ? " ▼" : " ▲") : ""}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((o) => (
              <TableRow key={o.linha}>
                <TableCell className="pl-5">
                  <Badge variant={o.g === "NM" ? "neutral" : o.g === "MD" ? "secondary" : "outline"} className="mr-1.5">
                    {o.g === "NM" ? "NÃO-MEDIC" : o.g === "MD" ? "MEDIC" : "OUTROS"}
                  </Badge>
                  {o.linha}
                </TableCell>
                <TableCell>{pctS(o.pesoB)}</TableCell>
                <TableCell>{pctS(o.pesoA)}</TableCell>
                <TableCell>{pctS(o.pesoProj)}</TableCell>
                <TableCell style={heatBg(o.dPeso, maxDPeso)} className={cn(o.dPeso < -0.00005 && "text-red-700 font-semibold", o.dPeso > 0.00005 && "text-teal-800 font-semibold")}>{arrow(o.dPeso)}{pp(o.dPeso)}</TableCell>
                <TableCell>{R$(o.mbrB)}</TableCell>
                <TableCell>{R$(o.mbrA)}</TableCell>
                <TableCell>{R$(o.mbrProj)}</TableCell>
                <TableCell>{pctS(o.mbpB)}</TableCell>
                <TableCell>{pctS(o.mbpA)}</TableCell>
                <TableCell>{pctS(o.mbpProj)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
