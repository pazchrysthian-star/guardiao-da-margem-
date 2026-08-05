import { useMemo } from "react"
import { crescimentoComparativoPorCategoria, type Fonte, type Metrica } from "@/lib/mercado"
import { pp } from "@/lib/format"
import { cn } from "@/lib/utils"

const PAINEIS: { met: Metrica | "T3M"; label: string }[] = [
  { met: "MAT", label: "Cresc. % MAT" },
  { met: "YTD", label: "Cresc. % YTD" },
  { met: "T3M", label: "Cresc. % Tri. móvel" },
  { met: "MoM", label: "Cresc. % Mês" },
]

function Painel({ met, label, fonte }: { met: Metrica | "T3M"; label: string; fonte: Fonte }) {
  const dados = useMemo(() => crescimentoComparativoPorCategoria(met, fonte), [met, fonte])
  const maxAbs = Math.max(
    0.001,
    ...dados.flatMap((d) => [d.unipreco !== null ? Math.abs(d.unipreco) : 0, d.mercado !== null ? Math.abs(d.mercado) : 0])
  )
  const barMax = 42

  return (
    <div className="min-w-[210px] flex-1">
      <h3 className="mb-2 text-center text-[12.5px] font-bold italic text-text-main">{label}</h3>
      <div className="space-y-2">
        {dados.map((d) => {
          const wUni = d.unipreco !== null ? (Math.abs(d.unipreco) / maxAbs) * barMax : 0
          const wMerc = d.mercado !== null ? (Math.abs(d.mercado) / maxAbs) * barMax : 0
          return (
            <div key={d.categoriaIqvia} className="text-[10.5px]">
              <div className="mb-0.5 truncate text-[10px] font-semibold text-text-muted-c" title={d.linha}>{d.linha}</div>
              <div className="flex items-center gap-1">
                <span className={cn("w-9 shrink-0 text-right font-bold tabular-nums", (d.unipreco ?? 0) >= 0 ? "text-brand-dark" : "text-danger-c")}>
                  {d.unipreco === null ? "-" : pp(d.unipreco, 1)}
                </span>
                <div className="relative h-3 flex-1 min-w-[90px]">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-border-soft" />
                  {d.unipreco !== null && (
                    <div
                      className={cn("absolute inset-y-0 rounded-[2px]", d.unipreco >= 0 ? "bg-brand" : "bg-danger-c")}
                      style={d.unipreco >= 0 ? { left: "50%", width: wUni } : { right: "50%", width: wUni }}
                    />
                  )}
                </div>
              </div>
              <div className="mt-0.5 flex items-center gap-1">
                <span className="w-9 shrink-0 text-right text-text-muted-c tabular-nums">{d.mercado === null ? "-" : pp(d.mercado, 1)}</span>
                <div className="relative h-2 flex-1 min-w-[90px]">
                  {d.mercado !== null && (
                    <div
                      className="absolute inset-y-0 rounded-[2px] bg-[#C7CCD1]"
                      style={d.mercado >= 0 ? { left: "50%", width: wMerc } : { right: "50%", width: wMerc }}
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CrescimentoPainelComparativo({ fonte }: { fonte: Fonte }) {
  return (
    <div className="card-shadow mb-6 rounded-[18px] border border-border-soft bg-white p-5">
      <h2 className="text-[15px] font-bold text-text-main">Evolução em percentual — Unipreço vs Mercado</h2>
      <p className="mb-4 text-[12.5px] text-text-muted-c">
        Por categoria, em cada painel: barra <span className="font-semibold text-brand-dark">verde</span> = Unipreço, barra <span className="font-semibold">cinza</span> = mercado (Bricks).
      </p>
      <div className="flex flex-wrap gap-x-6 gap-y-5 divide-x divide-border-soft">
        {PAINEIS.map((p, i) => (
          <div key={p.met} className={cn(i > 0 && "pl-6")}>
            <Painel met={p.met} label={p.label} fonte={fonte} />
          </div>
        ))}
      </div>
    </div>
  )
}
