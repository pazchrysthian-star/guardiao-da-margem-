import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { CalcResult } from "@/lib/calc"
import { R$, pctS, pp } from "@/lib/format"
import { heatBg, maxAbsOf } from "@/lib/heat"

export function OfensoresTable({ c }: { c: CalcResult }) {
  const of = c.segs.filter((s) => s.imp < 0).slice().sort((a, b) => a.imp - b.imp).slice(0, 10)
  const maxImp = maxAbsOf(of, (s) => s.imp)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top ofensores — impacto na margem total</CardTitle>
        <CardDescription>Impacto = peso na venda do mês atual × queda de MB% + efeito mix. Vermelho mais forte = maior urgência.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Segmento</TableHead>
              <TableHead>MB% base</TableHead>
              <TableHead>MB% atual</TableHead>
              <TableHead>Δ MB</TableHead>
              <TableHead>Peso</TableHead>
              <TableHead>Impacto pp</TableHead>
              <TableHead>Prioridade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {of.map((s, i) => (
              <TableRow key={s.linha + s.seg}>
                <TableCell className="pl-5 font-medium">{s.seg}</TableCell>
                <TableCell>{pctS(s.mbpB)}</TableCell>
                <TableCell>{pctS(s.mbpA)}</TableCell>
                <TableCell className="text-red-700">{pp(s.dmb, 1)}</TableCell>
                <TableCell>{pctS(s.pesoA)}</TableCell>
                <TableCell style={heatBg(s.imp, maxImp)} className="font-bold text-red-700">{pp(s.imp)}</TableCell>
                <TableCell>{i < 3 ? <Badge variant="danger">🔴 Alta</Badge> : i < 6 ? <Badge variant="secondary">Média</Badge> : <Badge variant="neutral">Baixa</Badge>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function AtaqueTable({ c }: { c: CalcResult }) {
  const atq = c.segs.filter((s) => s.g === "NM" && s.ganho > 0).slice().sort((a, b) => b.ganho - a.ganho).slice(0, 10)
  const total = atq.reduce((x, o) => x + o.ganho, 0)
  const maxGanho = maxAbsOf(atq, (s) => s.ganho)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Onde atacar preço</CardTitle>
        <CardDescription>Não-medicamentos abaixo do mês base. Verde mais forte = maior oportunidade de ganho.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Segmento</TableHead>
              <TableHead>Venda atual</TableHead>
              <TableHead>MB% base</TableHead>
              <TableHead>MB% atual</TableHead>
              <TableHead>Ganho R$</TableHead>
              <TableHead>Oportunidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {atq.map((s, i) => (
              <TableRow key={s.linha + s.seg}>
                <TableCell className="pl-5 font-medium">{s.seg}</TableCell>
                <TableCell>{R$(s.vdA)}</TableCell>
                <TableCell>{pctS(s.mbpB)}</TableCell>
                <TableCell>{pctS(s.mbpA)}</TableCell>
                <TableCell style={heatBg(s.ganho, maxGanho)} className="font-bold text-teal-800">{R$(s.ganho)}</TableCell>
                <TableCell>{i < 3 ? <Badge variant="success">🟢 Alta</Badge> : i < 6 ? <Badge variant="secondary">Média</Badge> : <Badge variant="neutral">Baixa</Badge>}</TableCell>
              </TableRow>
            ))}
            {atq.length > 0 && (
              <TableRow className="bg-teal-50/80 hover:bg-teal-50/80">
                <TableCell colSpan={4} className="text-right font-semibold">Total</TableCell>
                <TableCell className="font-bold text-teal-800">{R$(total)}</TableCell>
                <TableCell>—</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
