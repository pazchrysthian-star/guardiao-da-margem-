import { useMemo } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { R$, pctS, pp } from "@/lib/format"
import { heatBg, maxAbsOf } from "@/lib/heat"
import { cn } from "@/lib/utils"
import type { TendenciaMes, DiasMes } from "@/lib/tendencia"
import { CalendarCheck, CalendarClock, RotateCcw } from "lucide-react"

function compactMi(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return (v < 0 ? "-" : "") + (abs / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " Mi"
  if (abs >= 1_000) return (v < 0 ? "-" : "") + (abs / 1_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " mil"
  return (v < 0 ? "-" : "") + Math.round(abs).toLocaleString("pt-BR")
}

// ---------- Seletor de meses (chips) ----------
function MesChip({ mes, ativo, fechado, onClick }: { mes: string; ativo: boolean; fechado: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
        ativo ? "border-brand bg-brand text-white" : "border-border-soft bg-white text-text-muted-c hover:border-brand hover:text-brand"
      )}
    >
      {fechado ? <CalendarCheck className="size-3.5" aria-hidden /> : <CalendarClock className="size-3.5" aria-hidden />}
      {mes}
    </button>
  )
}

export function MesSelector({
  mesesDisponiveis, selecionados, onToggle, onSelecionarTodos, onLimpar, diasPorMes,
}: {
  mesesDisponiveis: string[]
  selecionados: string[]
  onToggle: (mes: string) => void
  onSelecionarTodos: () => void
  onLimpar: () => void
  diasPorMes: Record<string, DiasMes>
}) {
  return (
    <section aria-label="Seleção de meses" className="card-shadow mb-6 rounded-[18px] border border-border-soft bg-white px-6 py-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-text-main">Meses na tendência</h2>
        <div className="flex gap-4 text-[12px] font-semibold">
          <button onClick={onSelecionarTodos} className="text-brand hover:underline">Selecionar todos</button>
          <button onClick={onLimpar} className="text-text-muted-c hover:underline">Limpar</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {mesesDisponiveis.map((m) => (
          <MesChip
            key={m} mes={m} ativo={selecionados.includes(m)}
            fechado={(diasPorMes[m]?.diasDec ?? 0) >= (diasPorMes[m]?.diasTot ?? 1)}
            onClick={() => onToggle(m)}
          />
        ))}
      </div>
      <p className="mt-3 flex items-center gap-4 text-[11px] text-text-muted-c">
        <span className="flex items-center gap-1"><CalendarCheck className="size-3.5" aria-hidden /> mês fechado (projeção = realizado)</span>
        <span className="flex items-center gap-1"><CalendarClock className="size-3.5" aria-hidden /> mês em corte parcial</span>
      </p>
    </section>
  )
}

// ---------- Gráfico SVG: barras (projetado + realizado sobreposto) + linha de MB% ----------
function TendenciaChart({ dados }: { dados: TendenciaMes[] }) {
  const W = 760, H = 320, padL = 56, padR = 46, padT = 28, padB = 40
  const plotW = W - padL - padR, plotH = H - padT - padB
  const n = Math.max(dados.length, 1)
  const slot = plotW / n
  const barW = Math.min(58, slot * 0.5)

  const maxVd = Math.max(1, ...dados.map((d) => d.vdProjetado)) * 1.12
  const yVd = (v: number) => padT + plotH - (v / maxVd) * plotH

  const mbVals = dados.map((d) => d.mbPercProjetado)
  const minMb = Math.min(...mbVals, 0)
  const maxMb = Math.max(...mbVals, 0.01) * 1.15
  const yMb = (v: number) => padT + plotH - ((v - minMb) / (maxMb - minMb || 1)) * plotH

  const ticks = 4
  const gridVals = Array.from({ length: ticks + 1 }, (_, i) => (maxVd / ticks) * i)

  const linePts = dados.map((d, i) => {
    const x = padL + i * slot + slot / 2
    return `${x},${yMb(d.mbPercProjetado)}`
  }).join(" ")

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfico de tendência: faturamento projetado x realizado e MB% por mês" className="w-full">
      {gridVals.map((v, i) => (
        <g key={i}>
          <line x1={padL} y1={yVd(v)} x2={W - padR} y2={yVd(v)} stroke="var(--border-soft)" strokeWidth={1} />
          <text x={padL - 8} y={yVd(v) + 4} textAnchor="end" fontSize={10.5} fill="var(--text-muted-c)">{compactMi(v)}</text>
        </g>
      ))}

      {dados.map((d, i) => {
        const x = padL + i * slot + (slot - barW) / 2
        const topProj = yVd(d.vdProjetado)
        const topReal = yVd(d.vdRealizado)
        return (
          <g key={d.mes}>
            <rect x={x} y={topProj} width={barW} height={Math.max(2, plotH + padT - topProj)} rx={5} fill="var(--brand-soft)" stroke="var(--brand)" strokeWidth={1} strokeDasharray={d.fechado ? undefined : "3 3"} />
            <rect x={x} y={topReal} width={barW} height={Math.max(2, plotH + padT - topReal)} rx={5} fill="var(--brand)" opacity={0.92} />
            {!d.fechado && (
              <text x={x + barW / 2} y={topProj - 8} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--brand-dark)">{compactMi(d.vdProjetado)}</text>
            )}
            <text x={x + barW / 2} y={H - 18} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="var(--text-muted-c)">{d.mes}</text>
          </g>
        )
      })}

      <polyline points={linePts} fill="none" stroke="var(--warning-c)" strokeWidth={2.5} strokeLinejoin="round" />
      {dados.map((d, i) => {
        const x = padL + i * slot + slot / 2
        const y = yMb(d.mbPercProjetado)
        return (
          <g key={"mb-" + d.mes}>
            <circle cx={x} cy={y} r={4} fill="#fff" stroke="var(--warning-c)" strokeWidth={2.5} />
            <text x={x} y={y - 10} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--warning-c)">{pctS(d.mbPercProjetado)}</text>
          </g>
        )
      })}

      <text x={W - padR} y={padT - 10} textAnchor="end" fontSize={11} fontWeight={600} fill="var(--warning-c)">MB% projetado</text>
    </svg>
  )
}

export function TendenciaCard({
  dados, onEditarDias, onFecharMes,
}: {
  dados: TendenciaMes[]
  onEditarDias: (mes: string, campo: "diasDec" | "diasTot", valor: number) => void
  onFecharMes: (mes: string) => void
}) {
  const maxDVd = useMemo(() => maxAbsOf(dados.filter((d) => d.dVdProjPct !== null), (d) => d.dVdProjPct || 0), [dados])
  const maxDMb = useMemo(() => maxAbsOf(dados.filter((d) => d.dMbPP !== null), (d) => d.dMbPP || 0), [dados])

  if (!dados.length) {
    return (
      <Card className="mb-6">
        <CardContent className="py-14 text-center text-sm text-text-muted-c">
          Selecione ao menos um mês acima para ver a tendência.
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tendência mensal — realizado x projeção de mês cheio</CardTitle>
          <CardDescription>
            Barra clara = venda projetada para o mês fechado · barra escura = venda já realizada no corte · linha = MB% projetado. Ajuste os dias decorridos de cada mês na tabela abaixo para simular cortes diferentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TendenciaChart dados={dados} />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Detalhe por mês</CardTitle>
          <CardDescription>Dias decorridos/total editáveis — controla o fator de projeção de cada mês independentemente.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Mês</TableHead>
                <TableHead>Dias (decorridos / total)</TableHead>
                <TableHead>Realizado R$</TableHead>
                <TableHead>MB% realizado</TableHead>
                <TableHead>Projetado (mês cheio)</TableHead>
                <TableHead>MB% projetado</TableHead>
                <TableHead>Δ Fat. proj. vs mês ant.</TableHead>
                <TableHead>Δ MB% vs mês ant.</TableHead>
                <TableHead>Corte</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.map((d) => (
                <TableRow key={d.mes}>
                  <TableCell className="pl-5 font-semibold text-text-main">{d.mes}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number" min={1} max={d.diasTot} value={d.diasDec}
                        aria-label={`Dias decorridos em ${d.mes}`}
                        onChange={(e) => onEditarDias(d.mes, "diasDec", Number(e.target.value) || 1)}
                        className="w-14 rounded-md border border-border-soft px-1.5 py-1 text-right text-xs font-semibold outline-none focus:border-brand"
                      />
                      <span className="text-text-muted-c">/</span>
                      <input
                        type="number" min={1} max={31} value={d.diasTot}
                        aria-label={`Dias totais do mês ${d.mes}`}
                        onChange={(e) => onEditarDias(d.mes, "diasTot", Number(e.target.value) || 1)}
                        className="w-14 rounded-md border border-border-soft px-1.5 py-1 text-right text-xs font-semibold outline-none focus:border-brand"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">{R$(d.vdRealizado)}</TableCell>
                  <TableCell className="font-mono tabular-nums">{pctS(d.mbPercRealizado)}</TableCell>
                  <TableCell className="font-mono font-semibold tabular-nums text-brand-dark">{R$(d.vdProjetado)}</TableCell>
                  <TableCell className="font-mono tabular-nums">{pctS(d.mbPercProjetado)}</TableCell>
                  <TableCell className="font-mono tabular-nums" style={d.dVdProjPct !== null ? heatBg(d.dVdProjPct, maxDVd) : undefined}>
                    {d.dVdProjPct !== null ? pctS(d.dVdProjPct) : "—"}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums" style={d.dMbPP !== null ? heatBg(d.dMbPP, maxDMb) : undefined}>
                    {d.dMbPP !== null ? pp(d.dMbPP) : "—"}
                  </TableCell>
                  <TableCell>
                    {d.fechado ? (
                      <span className="text-[11px] font-semibold text-text-muted-c">Fechado</span>
                    ) : (
                      <button
                        onClick={() => onFecharMes(d.mes)}
                        title="Marcar este mês como fechado (dias decorridos = dias totais)"
                        className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                      >
                        <RotateCcw className="size-3" aria-hidden /> marcar fechado
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
