import { useState, useMemo } from "react"
import type { SimResult, SimLinha } from "@/lib/simulador"
import { pctS, pp } from "@/lib/format"
import { heatBg, maxAbsOf } from "@/lib/heat"
import { cn } from "@/lib/utils"
import { Info } from "lucide-react"

type ColKey = "linha" | "mbPercRecomp" | "metaMB" | "gapMB" | "metaParticipacao" | "participacaoReal" | "gapPeso" | "impactoPesoPP"

const COLS: { key: ColKey; label: string }[] = [
  { key: "linha", label: "Linha" },
  { key: "mbPercRecomp", label: "Margem Realizada" },
  { key: "metaMB", label: "Margem Meta" },
  { key: "gapMB", label: "Dif." },
  { key: "metaParticipacao", label: "Peso Meta" },
  { key: "participacaoReal", label: "Peso Atual" },
  { key: "gapPeso", label: "Dif." },
  { key: "impactoPesoPP", label: "Impacto do peso na margem geral" },
]

export function AvaliacaoResumoTable({ s }: { s: SimResult }) {
  const [sort, setSort] = useState<{ col: ColKey; dir: 1 | -1 }>({ col: "impactoPesoPP", dir: 1 })

  const linhas = useMemo(() => {
    return s.linhas.slice().sort((a, b) => {
      if (sort.col === "linha") return a.linha.localeCompare(b.linha) * sort.dir
      return ((a[sort.col] as number) - (b[sort.col] as number)) * sort.dir
    })
  }, [s.linhas, sort])

  const toggleSort = (col: ColKey) => setSort((p) => (p.col === col ? { col, dir: p.dir === 1 ? -1 : 1 } : { col, dir: col === "linha" ? 1 : -1 }))

  const maxImpacto = maxAbsOf(s.linhas, (l: SimLinha) => l.impactoPesoPP)

  return (
    <div className="card-shadow mb-6 overflow-hidden rounded-[18px] border border-border-soft bg-white">
      <div className="px-5 pt-4">
        <h2 className="text-[15px] font-bold text-text-main">Avaliação por linha — margem e peso vs meta</h2>
        <p className="flex items-start gap-1.5 text-[12.5px] text-text-muted-c">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          "Impacto do peso na margem geral" = quantos pp o desvio de participação dessa linha (peso atual vs peso meta) está tirando ou somando na margem geral da rede — considerando se essa linha tem meta de MB% acima ou abaixo da média. Negativo = está puxando a margem geral pra baixo.
        </p>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-[12.5px]">
          <thead>
            <tr className="bg-gradient-to-r from-[#084a3b] to-[#0d6b57] text-white">
              {COLS.map((c, i) => (
                <th key={c.key} className={cn("cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide hover:bg-white/10", i === 0 && "pl-5")} onClick={() => toggleSort(c.key)}>
                  {c.label}{sort.col === c.key ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={l.linha} className={cn("group border-t border-border-soft transition-colors hover:bg-brand-soft/70", i % 2 === 1 && "bg-muted/40")}>
                <td className="whitespace-nowrap px-3 py-2 pl-5 font-semibold text-text-main">{l.linha}</td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">{pctS(l.mbPercRecomp)}</td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-text-muted-c">{pctS(l.metaMB)}</td>
                <td className={cn("whitespace-nowrap px-3 py-2 font-semibold tabular-nums", l.gapMB < 0 && "text-danger-c", l.gapMB > 0 && "text-brand-dark")}>{pp(l.gapMB)}</td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-text-muted-c">{pctS(l.metaParticipacao)}</td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">{pctS(l.participacaoReal)}</td>
                <td className={cn("whitespace-nowrap px-3 py-2 font-semibold tabular-nums", l.gapPeso < 0 && "text-danger-c", l.gapPeso > 0 && "text-brand-dark")}>{pp(l.gapPeso)}</td>
                <td className="whitespace-nowrap px-3 py-2 font-bold tabular-nums" style={heatBg(l.impactoPesoPP, maxImpacto)}>
                  {pp(l.impactoPesoPP)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border-soft bg-[#d9d9d9] font-bold">
              <td className="whitespace-nowrap px-3 py-2 pl-5">TOTAL GERAL</td>
              <td className="whitespace-nowrap px-3 py-2 tabular-nums">{pctS(s.totalMbPercReal)}</td>
              <td className="whitespace-nowrap px-3 py-2 tabular-nums">{pctS(s.totalMetaMB)}</td>
              <td className={cn("whitespace-nowrap px-3 py-2 tabular-nums", s.totalGapMB < 0 && "text-danger-c", s.totalGapMB > 0 && "text-brand-dark")}>{pp(s.totalGapMB)}</td>
              <td className="whitespace-nowrap px-3 py-2 tabular-nums">{pctS(s.somaMetaParticipacao)}</td>
              <td className="whitespace-nowrap px-3 py-2 tabular-nums">{pctS(1)}</td>
              <td className="whitespace-nowrap px-3 py-2 tabular-nums">{pp(s.totalGapPeso)}</td>
              <td className={cn("whitespace-nowrap px-3 py-2 tabular-nums", s.totalImpactoPesoPP < 0 && "text-danger-c", s.totalImpactoPesoPP > 0 && "text-brand-dark")}>{pp(s.totalImpactoPesoPP)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
