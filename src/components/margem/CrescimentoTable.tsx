import { useMemo } from "react"
import { computeCrescimentoTable, ESCOPOS, type Metrica, type Fonte } from "@/lib/mercado"
import { pp } from "@/lib/format"
import { cn } from "@/lib/utils"

const METRICAS: Metrica[] = ["MAT", "YTD", "T3M", "YoY", "MoM"]

export function CrescimentoTable({ fonte }: { fonte: Fonte }) {
  const linhas = useMemo(() => computeCrescimentoTable(fonte), [fonte])

  return (
    <div className="card-shadow mb-6 overflow-hidden rounded-[18px] border border-border-soft bg-white">
      <div className="px-5 pt-4">
        <h2 className="text-[15px] font-bold text-text-main">Crescimento %</h2>
        <p className="text-[12.5px] text-text-muted-c">
          MAT = últimos 12 meses vs. mesmo período do ano anterior. YTD = ano corrente até o último mês fechado. YoY = último mês fechado vs. mesmo mês do ano anterior. MoM = último mês fechado vs. mês anterior.
          A coluna <span className="font-semibold text-brand-dark">UNI</span> (destacada) é a Unipreço — o número pequeno entre parênteses ao lado é o quanto a Unipreço está acima (+) ou abaixo (−) do crescimento do mercado (Bricks) na mesma métrica.
        </p>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-[12px]">
          <thead>
            <tr>
              <th rowSpan={2} className="sticky left-0 z-10 border-b border-border-soft bg-white px-3 py-2 text-left align-bottom text-[11px] font-semibold uppercase tracking-wide text-text-muted-c">Setor nec Aberto</th>
              {METRICAS.map((met) => (
                <th key={met} colSpan={4} className="border border-white bg-[#084a3b] px-2 py-2 text-center text-[13px] font-bold text-white">{met}</th>
              ))}
            </tr>
            <tr>
              {METRICAS.map((met) => ESCOPOS.map((e) => (
                <th key={met + e.key} className={cn("border border-white px-2 py-1.5 text-center text-[10.5px] font-bold text-text-main", e.key === "UNIPRECO" ? "bg-brand text-white" : "bg-[#d9d9d9]")}>{e.label}</th>
              )))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const isTotal = l.categoriaIqvia === "TOTAL"
              return (
                <tr key={l.categoriaIqvia} className={cn(isTotal && "font-bold")}>
                  <td className={cn(
                    "sticky left-0 z-10 whitespace-nowrap border border-[#cfe0da] px-3 py-2 text-[12px] font-semibold",
                    isTotal ? "bg-[#084a3b] text-white" : "bg-white text-text-main"
                  )}>
                    {l.linha}
                  </td>
                  {METRICAS.map((met) => ESCOPOS.map((e) => {
                    const v = l.valores[`${met}_${e.key}`]
                    const isUni = e.key === "UNIPRECO"
                    const vsBricks = isUni ? l.valores[`${met}_BRICKS`] : null
                    const gap = isUni && v !== null && vsBricks !== null ? v - vsBricks : null
                    return (
                      <td
                        key={met + e.key}
                        className={cn(
                          "whitespace-nowrap border border-[#cfe0da] px-2 py-2 text-center tabular-nums",
                          isUni ? "bg-brand-soft font-semibold" : isTotal ? "bg-[#e5efe9]" : "bg-white",
                          v === null ? "text-text-muted-c" : v >= 0 ? "text-brand-dark" : "text-danger-c"
                        )}
                      >
                        {v === null ? "-" : pp(v, 2)}
                        {gap !== null && (
                          <span
                            className={cn("ml-1 text-[9.5px] font-bold", gap >= 0 ? "text-brand-dark" : "text-danger-c")}
                            title={`${gap >= 0 ? "Acima" : "Abaixo"} do mercado (Bricks) em ${pp(Math.abs(gap), 2)}`}
                          >
                            ({gap >= 0 ? "+" : "−"}{pp(Math.abs(gap), 1).replace(" pp", "")})
                          </span>
                        )}
                      </td>
                    )
                  }))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
