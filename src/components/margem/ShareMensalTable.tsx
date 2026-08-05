import { useMemo } from "react"
import { computeShareMensalTable, type Fonte } from "@/lib/mercado"
import { pctS, pp } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown } from "lucide-react"

export function ShareMensalTable({ fonte }: { fonte: Fonte }) {
  const { meses, linhas, totalPorMes, totalDif } = useMemo(() => computeShareMensalTable(12, fonte), [fonte])

  return (
    <div className="card-shadow mb-6 overflow-hidden rounded-[18px] border border-border-soft bg-white">
      <div className="px-5 pt-4">
        <h2 className="text-[15px] font-bold text-text-main">Share geral por seção</h2>
        <p className="text-[12.5px] text-text-muted-c">Participação da Unipreço no mercado dos seus Bricks, mês a mês (últimos 12 meses).</p>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-[12px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-[#084a3b] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-white">Setor nec Aberto</th>
              {meses.map((m) => (
                <th key={m} className="whitespace-nowrap bg-[#084a3b] px-3 py-2.5 text-center text-[11px] font-semibold text-white">{m}</th>
              ))}
              <th className="whitespace-nowrap bg-[#084a3b] px-3 py-2.5 text-center text-[11px] font-semibold text-white">dif mês ant.</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={l.categoriaIqvia} className={cn("border-b border-border-soft", i % 2 === 1 && "bg-muted/40")}>
                <td className="sticky left-0 z-10 whitespace-nowrap bg-inherit px-3 py-2 font-semibold text-text-main">{l.linha}</td>
                {meses.map((m) => (
                  <td key={m} className="whitespace-nowrap px-3 py-2 text-center tabular-nums">{pctS(l.porMes[m])}</td>
                ))}
                <td className={cn("whitespace-nowrap px-3 py-2 text-center font-semibold tabular-nums", l.difMesAnterior >= 0 ? "text-brand-dark" : "text-danger-c")}>
                  {l.difMesAnterior >= 0 ? <ArrowUp className="mr-0.5 inline size-3" /> : <ArrowDown className="mr-0.5 inline size-3" />}{pp(l.difMesAnterior)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-border-soft bg-[#d9d9d9] font-bold">
              <td className="sticky left-0 z-10 whitespace-nowrap bg-[#d9d9d9] px-3 py-2 text-text-main">Total</td>
              {meses.map((m) => (
                <td key={m} className="whitespace-nowrap px-3 py-2 text-center tabular-nums">{pctS(totalPorMes[m])}</td>
              ))}
              <td className={cn("whitespace-nowrap px-3 py-2 text-center tabular-nums", totalDif >= 0 ? "text-brand-dark" : "text-danger-c")}>
                {totalDif >= 0 ? <ArrowUp className="mr-0.5 inline size-3" /> : <ArrowDown className="mr-0.5 inline size-3" />}{pp(totalDif)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
