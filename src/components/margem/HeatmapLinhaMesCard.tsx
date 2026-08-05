import { useMemo, useState } from "react"
import type { MargemRow } from "@/lib/calc"
import { computeHeatmap } from "@/lib/heatmapLinha"
import { R$, pctS, pp } from "@/lib/format"
import { heatBg } from "@/lib/heat"
import { cn } from "@/lib/utils"
import { Info } from "lucide-react"

export function HeatmapLinhaMesCard({ rows }: { rows: MargemRow[] }) {
  const heatmap = useMemo(() => computeHeatmap(rows), [rows])
  const [hover, setHover] = useState<{ linha: string; mes: string } | null>(null)

  if (!heatmap.linhas.length) return null

  return (
    <section aria-label="Mapa de calor de margem por linha e mês" className="card-shadow mb-6 rounded-[18px] border border-border-soft bg-white p-5">
      <div className="mb-1 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-text-main">
            Mapa de calor — MB% por linha e mês
            <Info className="size-3.5 text-text-muted-c" aria-hidden />
          </h3>
          <p className="mt-0.5 text-[12.5px] text-text-muted-c">
            Cor por desvio em relação à própria média histórica da linha (não é comparação entre linhas diferentes). Verde = acima do normal da linha; vermelho = abaixo.
          </p>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-[12px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white py-2 pr-3 text-left text-[11px] font-semibold uppercase tracking-wide text-text-muted-c">Linha</th>
              {heatmap.meses.map((m) => (
                <th key={m} className="px-1.5 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-text-muted-c whitespace-nowrap">{m}</th>
              ))}
              <th className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-text-muted-c whitespace-nowrap">Média</th>
            </tr>
          </thead>
          <tbody>
            {heatmap.linhas.map((linha) => {
              const media = heatmap.mediaLinha(linha)
              const maxDesvio = heatmap.maxDesvioLinha(linha)
              return (
                <tr key={linha}>
                  <td className="sticky left-0 z-10 whitespace-nowrap border-t border-border-soft bg-white py-2 pr-3 text-[12.5px] font-semibold text-text-main">{linha}</td>
                  {heatmap.meses.map((mes) => {
                    const c = heatmap.celula(linha, mes)
                    const isHover = hover?.linha === linha && hover?.mes === mes
                    if (!c) {
                      return <td key={mes} className="border-t border-border-soft px-1.5 py-2 text-center text-text-muted-c/50">—</td>
                    }
                    const desvio = c.mbp - media
                    return (
                      <td
                        key={mes}
                        className={cn("relative cursor-default border-t border-border-soft px-1.5 py-2 text-center font-semibold tabular-nums text-text-main", isHover && "outline outline-2 outline-brand")}
                        style={heatBg(desvio, maxDesvio || 0.0001)}
                        onMouseEnter={() => setHover({ linha, mes })}
                        onMouseLeave={() => setHover(null)}
                        title={`${linha} · ${mes}\nVenda: ${R$(c.vd)}\nMargem: ${R$(c.mbr)}\nMB%: ${pctS(c.mbp)} (${pp(desvio)} vs média da linha)`}
                      >
                        {pctS(c.mbp, 0)}
                      </td>
                    )
                  })}
                  <td className="border-t border-l border-border-soft bg-muted/40 px-2 py-2 text-center font-bold tabular-nums text-text-main">{pctS(media, 1)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-[12px] text-text-muted-c">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-[4px] bg-brand" aria-hidden /> Acima da média da própria linha</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-[4px] bg-danger-c" aria-hidden /> Abaixo da média da própria linha</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-[4px] bg-white border border-border-soft" aria-hidden /> Próximo da média</span>
      </div>
    </section>
  )
}
