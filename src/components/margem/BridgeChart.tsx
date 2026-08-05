import { useMemo } from "react"
import type { SimResult } from "@/lib/simulador"
import { pctS, pp } from "@/lib/format"
import { Info } from "lucide-react"

type Bar = { label: string; kind: "level" | "delta" | "result"; value: number; start: number; end: number }

export function BridgeChart({ s }: { s: SimResult }) {
  const bars = useMemo<Bar[]>(() => {
    const meta = s.totalMetaMB
    const preco = s.totalEfeitoPrecoPP
    const mix = s.totalEfeitoMixPP
    const resultado = s.totalGapMB
    const proj = s.totalMbPercReal
    let cursor = meta
    const list: Bar[] = [{ label: "Meta MB%", kind: "level", value: meta, start: 0, end: meta }]
    list.push({ label: "Preço", kind: "delta", value: preco, start: cursor, end: cursor + preco }); cursor += preco
    list.push({ label: "Mix", kind: "delta", value: mix, start: cursor, end: cursor + mix }); cursor += mix
    list.push({ label: "Resultado", kind: "delta", value: resultado, start: meta, end: meta + resultado })
    list.push({ label: "MB% Projetada", kind: "result", value: proj, start: 0, end: proj })
    return list
  }, [s])

  // Escala vertical: do 0 (ou um piso próximo) até um teto acima da meta
  const values = bars.flatMap((b) => [b.start, b.end])
  const maxV = Math.max(...values) * 1.06
  const minV = Math.min(0, ...values)
  const W = 640, H = 300, padL = 14, padR = 14, padT = 34, padB = 44
  const plotW = W - padL - padR, plotH = H - padT - padB
  const y = (v: number) => padT + plotH - ((v - minV) / (maxV - minV)) * plotH
  const n = bars.length
  const slot = plotW / n
  const barW = Math.min(64, slot * 0.55)

  return (
    <section aria-label="Bridge de margem em pontos percentuais" className="card-shadow flex flex-col rounded-[18px] border border-border-soft bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-text-main">
          Bridge de margem (pp)
          <Info className="size-3.5 text-text-muted-c" aria-hidden />
        </h3>
        <span className="rounded-[10px] border border-border-soft px-3 py-1.5 text-xs font-semibold text-text-muted-c">Exibir em pp</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfico waterfall do gap de margem" className="w-full">
        {bars.map((b, i) => {
          const x = padL + i * slot + (slot - barW) / 2
          const isDelta = b.kind === "delta"
          const top = y(Math.max(b.start, b.end))
          const h = Math.max(3, Math.abs(y(b.start) - y(b.end)))
          const fill = b.kind === "level" ? "var(--brand-dark)" : b.kind === "result" ? "var(--blue)" : b.value >= 0 ? "var(--brand)" : "var(--danger-c)"
          const labelVal = isDelta ? pp(b.value) : pctS(b.value)
          const labelY = top - 8
          // conector tracejado até a próxima barra
          const next = bars[i + 1]
          const connY = y(b.end)
          return (
            <g key={b.label}>
              {next && (
                <line
                  x1={x + barW} y1={connY}
                  x2={padL + (i + 1) * slot + (slot - barW) / 2} y2={connY}
                  stroke="var(--text-muted-c)" strokeDasharray="4 4" strokeWidth={1}
                />
              )}
              <rect x={x} y={top} width={barW} height={h} rx={5} fill={fill} />
              <text x={x + barW / 2} y={labelY} textAnchor="middle" fontSize={12.5} fontWeight={700} fill="var(--text-main)">{labelVal}</text>
              <text x={x + barW / 2} y={H - 22} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="var(--text-muted-c)">{b.label}</text>
            </g>
          )
        })}
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-5 text-[12px] text-text-muted-c">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-[4px] bg-brand" aria-hidden /> Impacto positivo</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-[4px] bg-danger-c" aria-hidden /> Impacto negativo</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-[4px] bg-[#C9CFDA]" aria-hidden /> Neutro</span>
      </div>
    </section>
  )
}
