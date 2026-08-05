import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { LinhaMeta } from "@/lib/simulador"
import { R$, pctS } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Pencil, Check, ChevronDown, ChevronUp } from "lucide-react"

export function MetasBar({
  metaVendaTotal, onMetaVendaTotal, somaParticipacao, onCalcularMetaAutomatica,
}: {
  metaVendaTotal: number
  onMetaVendaTotal: (v: number) => void
  somaParticipacao: number
  onCalcularMetaAutomatica: () => void
}) {
  const somaOk = Math.abs(somaParticipacao - 1) < 0.01
  const [editando, setEditando] = useState(false)

  return (
    <Card className="mb-4 flex-row flex-wrap items-end gap-4 px-5 py-4">
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Meta geral de venda do mês</label>
        {editando ? (
          <div className="flex items-center gap-2">
            <input
              type="number" min={0} autoFocus value={metaVendaTotal || ""}
              onChange={(e) => onMetaVendaTotal(Number(e.target.value) || 0)}
              onKeyDown={(e) => { if (e.key === "Enter") setEditando(false) }}
              placeholder="Ex: 40000000"
              className="h-9 w-[200px] rounded-md border px-2.5 text-sm"
            />
            <Button size="icon" variant="outline" className="size-9" onClick={() => setEditando(false)}>
              <Check className="size-4" />
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setEditando(true)} className="h-9">
            <Pencil className="size-3.5" /> {R$(metaVendaTotal)}
          </Button>
        )}
      </div>
      <div className={cn("text-xs", somaOk ? "text-muted-foreground" : "font-semibold text-red-600")}>
        Soma das metas de participação: {pctS(somaParticipacao)} {somaOk ? "" : "— deveria somar ~100%"}
      </div>
      <Button size="sm" variant="outline" onClick={onCalcularMetaAutomatica} className="ml-auto">
        Calcular meta MB% 30,5% automaticamente
      </Button>
    </Card>
  )
}

export function MetasTable({
  metas, onChange, onRestaurar,
}: {
  metas: LinhaMeta[]
  onChange: (linha: string, field: "metaParticipacao" | "metaMB" | "sellout", value: number) => void
  onRestaurar: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const ordered = metas.slice().sort((a, b) => a.linha.localeCompare(b.linha))
  return (
    <Card className="mb-4">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Metas por linha</CardTitle>
          <CardDescription>Participação %, MB% alvo e sellout do mês (verba que soma direto na margem). Fica salvo no navegador.</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={() => setAberto((v) => !v)}>
          {aberto ? <><ChevronUp className="size-3.5" /> Ocultar</> : <><ChevronDown className="size-3.5" /> Ver / editar metas</>}
        </Button>
      </CardHeader>
      {aberto && (
        <>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Linha</TableHead>
                  <TableHead>Meta Participação %</TableHead>
                  <TableHead>Meta MB %</TableHead>
                  <TableHead>Sellout do mês (R$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordered.map((m) => (
                  <TableRow key={m.linha}>
                    <TableCell className="pl-5 font-medium">{m.linha}</TableCell>
                    <TableCell>
                      <input
                        type="number" step={0.1} min={0} max={100}
                        value={+(m.metaParticipacao * 100).toFixed(2)}
                        onChange={(e) => onChange(m.linha, "metaParticipacao", (Number(e.target.value) || 0) / 100)}
                        className="h-8 w-24 rounded-md border px-2 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number" step={0.1} min={0} max={100}
                        value={+(m.metaMB * 100).toFixed(2)}
                        onChange={(e) => onChange(m.linha, "metaMB", (Number(e.target.value) || 0) / 100)}
                        className="h-8 w-24 rounded-md border px-2 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number" step={100} min={0}
                        value={m.sellout || ""}
                        placeholder="0"
                        onChange={(e) => onChange(m.linha, "sellout", Number(e.target.value) || 0)}
                        className="h-8 w-32 rounded-md border px-2 text-sm"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex-col items-start gap-1.5">
            <Button size="sm" variant="outline" onClick={onRestaurar}>Restaurar valores padrão</Button>
            <p className="text-[11px] text-muted-foreground">
              Sellout: valor cheio do mês (verba/rebate de fornecedor) que soma direto na margem em R$ da linha — não é escalado pelos dias decorridos, já entra valendo o mês inteiro. Gera a "margem recomposta" usada em todos os cálculos de gap e perda/ganho.
            </p>
          </CardFooter>
        </>
      )}
    </Card>
  )
}
