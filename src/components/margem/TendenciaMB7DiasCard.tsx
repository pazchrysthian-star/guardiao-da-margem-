import { useMemo, useState } from "react"
import { serieDiariaRede, variacaoPeriodo } from "@/lib/diario"
import { pctS, pp, R$ } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown, Info } from "lucide-react"

export function TendenciaMB7DiasCard({ metaMB }: { metaMB: number }) {
  const [nDias, setNDias] = useState(7)
  const pontos = useMemo(() => serieDiariaRede(nDias), [nDias])
  const [hover, setHover] = useState<number | null>(null)

  if (pontos.length < 2) return null

  const variacao = variacaoPeriodo(pontos)
  const positivo = (variacao ?? 0) >= 0

  const W = 380, H = 200, padL = 42, padR = 14, padT = 14, padB = 30
  const plotW = W - padL - padR, plotH = H - padT - padB

  const valores = [...pontos.map((p) => p.mbp), metaMB]
  const min = Math.min(...valores), max = Math.max(...valores)
  const span = max - min || 0.01
  const yMin = min - span * 0.25, yMax = max + span * 0.25
  const y = (v: number) => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH
  const x = (i: number) => padL + (pontos.length === 1 ? plotW / 2 : (i / (pontos.length - 1)) * plotW)

  const pathLinha = pontos.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.mbp).toFixed(1)}`).join(" ")
  const pathArea = `${pathLinha} L ${x(pontos.length - 1).toFixed(1)} ${padT + plotH} L ${x(0).toFixed(1)} ${padT + plotH} Z`

  const ticks = 4
  const gridVals = Array.from({ length: ticks + 1 }, (_, i) => yMin + ((yMax - yMin) / ticks) * i)
  const ultimo = pontos[pontos.length - 1]

  return (
    <div className="card-shadow flex h-full flex-col rounded-[20px] border border-border-soft bg-white p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-[15px] font-extrabold text-text-main">
          Tendência da MB% ({nDias} dias)
          <Info className="size-3.5 text-text-muted-c" aria-hidden />
        </h2>
        <div className="flex gap-1 rounded-[8px] border border-border-soft p-0.5">
          {[7, 15, 30].map((n) => (
            <button
              key={n}
              onClick={() => setNDias(n)}
              aria-pressed={nDias === n}
              className={cn("rounded-[6px] px-2 py-1 text-[11px] font-bold", nDias === n ? "bg-brand text-white" : "text-text-muted-c hover:text-brand")}
            >
              {n}d
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Evolução diária da MB% nos últimos ${nDias} dias`} className="w-full">
        {gridVals.map((v, i) => (
          <g key={i}>
            <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="#eef1f4" strokeWidth={1} />
            <text x={padL - 6} y={y(v) + 3.5} textAnchor="end" fontSize={9} fill="var(--text-muted-c)">{pctS(v, 1)}</text>
          </g>
        ))}

        <line x1={padL} y1={y(metaMB)} x2={W - padR} y2={y(metaMB)} stroke="var(--text-muted-c)" strokeWidth={1.2} strokeDasharray="5 4" />
        <text x={W - padR} y={y(metaMB) - 5} textAnchor="end" fontSize={9.5} fontWeight={700} fill="var(--text-muted-c)">Meta: {pctS(metaMB)}</text>

        <path d={pathArea} fill="var(--brand)" fillOpacity={0.07} />
        <path d={pathLinha} fill="none" stroke="var(--brand)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />

        {pontos.map((p, i) => (
          <g key={p.data}>
            <circle
              cx={x(i)} cy={y(p.mbp)} r={hover === i ? 5 : 3.4}
              fill="#fff" stroke="var(--brand)" strokeWidth={2}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            >
              <title>{`${p.label} — MB%: ${pctS(p.mbp)} · Venda: ${R$(p.vd)}`}</title>
            </circle>
            {(i === 0 || i === pontos.length - 1 || pontos.length <= 8 || i % 2 === 0) && (
              <text x={x(i)} y={H - 10} textAnchor="middle" fontSize={9} fill="var(--text-muted-c)">{p.label}</text>
            )}
          </g>
        ))}

        <text x={x(pontos.length - 1)} y={y(ultimo.mbp) - 10} textAnchor="end" fontSize={11} fontWeight={800} fill="var(--brand-dark)">
          {pctS(ultimo.mbp)}
        </text>
      </svg>

      {variacao !== null && (
        <div className={cn("mt-auto flex items-center justify-between gap-2 rounded-[12px] px-3.5 py-2.5", positivo ? "bg-brand-soft" : "bg-danger-soft")}>
          <span className="text-[12px] font-semibold text-text-muted-c">Variação no período</span>
          <span className={cn("flex items-center gap-1 text-[15px] font-extrabold", positivo ? "text-brand-dark" : "text-danger-c")}>
            {positivo ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />} {pp(variacao)}
          </span>
        </div>
      )}
    </div>
  )
}
