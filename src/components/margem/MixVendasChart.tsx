import { useMemo } from "react"
import { computeMixVendas, computeMixComparativo, type Fonte } from "@/lib/mercado"
import { pctS, pp } from "@/lib/format"
import { cn } from "@/lib/utils"

const GRUPOS: { key: "perfumaria" | "otc" | "generico" | "marca"; label: string; cor: string }[] = [
  { key: "perfumaria", label: "perfumaria", cor: "#F0AE87" },
  { key: "otc", label: "otc", cor: "#9AA0A6" },
  { key: "generico", label: "generico", cor: "#4C9A6B" },
  { key: "marca", label: "marca", cor: "#0d3b25" },
]

function ComparativoMercado({ fonte }: { fonte: Fonte }) {
  const { mercado, unipreco, mes } = useMemo(() => computeMixComparativo(fonte), [fonte])

  const W = 180, H = 320, padT = 16, padB = 34, padTopoLabel = 14
  const plotH = H - padT - padB - padTopoLabel
  const barW = 56
  const xMercado = 24
  const xUnipreco = 100

  function barras(dados: typeof mercado, x: number) {
    let yCursor = padT + padTopoLabel + plotH
    return GRUPOS.map((g) => {
      const altura = dados[g.key] * plotH
      const y = yCursor - altura
      yCursor -= altura
      return { ...g, x, y, altura, valor: dados[g.key] }
    })
  }

  const blocosMercado = barras(mercado, xMercado)
  const blocosUnipreco = barras(unipreco, xUnipreco)

  return (
    <div className="w-[190px] shrink-0 border-r border-border-soft pr-4">
      <h3 className="text-[12.5px] font-bold text-text-main">Unipreço vs mercado</h3>
      <p className="mb-2 text-[11px] text-text-muted-c">{mes} · Bricks Unipreço</p>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Comparação do mix entre Unipreço e mercado em ${mes}`} className="w-full">
        {[...blocosMercado, ...blocosUnipreco].map((b) => (
          <g key={b.key + b.x}>
            <rect x={b.x} y={b.y} width={barW} height={Math.max(0, b.altura)} fill={b.cor} />
            {b.altura > 18 && (
              <text x={b.x + barW / 2} y={b.y + b.altura / 2 + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill={b.key === "marca" ? "#fff" : "#182033"}>
                {pctS(b.valor, 1)}
              </text>
            )}
          </g>
        ))}
        <text x={xMercado + barW / 2} y={padT + padTopoLabel - 4} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--text-muted-c)">Mercado</text>
        <text x={xUnipreco + barW / 2} y={padT + padTopoLabel - 4} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--brand-dark)">Unipreço</text>
        <text x={xMercado + barW / 2} y={H - 12} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--text-muted-c)">Bricks</text>
        <text x={xUnipreco + barW / 2} y={H - 12} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--brand-dark)">Unipreço</text>
      </svg>

      <div className="mt-2 space-y-1">
        {GRUPOS.map((g) => {
          const dif = unipreco[g.key] - mercado[g.key]
          return (
            <div key={g.key} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="flex items-center gap-1.5 text-text-muted-c">
                <span className="size-2.5 rounded-[2px]" style={{ backgroundColor: g.cor }} aria-hidden /> {g.label}
              </span>
              <span className={cn("font-semibold tabular-nums", dif >= 0 ? "text-brand-dark" : "text-danger-c")}>
                {dif >= 0 ? "+" : ""}{pp(dif, 1)}
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-[10.5px] leading-snug text-text-muted-c">Diferença = participação Unipreço − participação mercado, no grupo.</p>
    </div>
  )
}

export function MixVendasChart({ fonte }: { fonte: Fonte }) {
  const dados = useMemo(() => computeMixVendas(12, fonte), [fonte])

  const W = 900, H = 320, padL = 8, padR = 100, padT = 16, padB = 34
  const plotW = W - padL - padR, plotH = H - padT - padB
  const n = dados.length
  const slot = plotW / n
  const barW = Math.min(64, slot * 0.62)

  return (
    <div className="card-shadow mb-6 rounded-[18px] border border-border-soft bg-white p-5">
      <h2 className="text-[15px] font-bold text-text-main">Mix de vendas</h2>
      <p className="mb-3 text-[12.5px] text-text-muted-c">
        À esquerda: composição da Unipreço vs mercado (Bricks) no último mês fechado. À direita: evolução da composição da Unipreço nos últimos 12 meses.
      </p>

      <div className="flex flex-col gap-5 lg:flex-row">
        <ComparativoMercado fonte={fonte} />

        <div className="min-w-0 flex-1 overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Mix de vendas por mês, barras empilhadas" className="w-full min-w-[600px]">
            {dados.map((d, i) => {
              const x = padL + i * slot + (slot - barW) / 2
              let yCursor = padT + plotH
              const blocos = GRUPOS.map((g) => {
                const altura = d[g.key] * plotH
                const y = yCursor - altura
                yCursor -= altura
                return { ...g, y, altura, valor: d[g.key] }
              })
              return (
                <g key={d.mes}>
                  {blocos.map((b) => (
                    <g key={b.key}>
                      <rect x={x} y={b.y} width={barW} height={Math.max(0, b.altura)} fill={b.cor} />
                      {b.altura > 16 && (
                        <text x={x + barW / 2} y={b.y + b.altura / 2 + 4} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={b.key === "marca" ? "#fff" : "#182033"}>
                          {pctS(b.valor, 2)}
                        </text>
                      )}
                    </g>
                  ))}
                  <text x={x + barW / 2} y={H - 12} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--text-muted-c)">
                    {d.mes.replace("/20", "/")}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-5 text-[12px] text-text-muted-c">
        {GRUPOS.map((g) => (
          <span key={g.key} className="flex items-center gap-1.5">
            <span className="size-3 rounded-[3px]" style={{ backgroundColor: g.cor }} aria-hidden /> {g.label}
          </span>
        ))}
      </div>
    </div>
  )
}
