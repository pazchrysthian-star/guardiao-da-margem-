import type { SimResult } from "@/lib/simulador"
import { R$, pctS, pp } from "@/lib/format"
import { Target, CalendarClock, Lightbulb } from "lucide-react"

export function RecuperacaoNecessariaCard({ s, diasDec, diasTot }: { s: SimResult; diasDec: number; diasTot: number }) {
  const gapAbs = Math.abs(s.totalGapMB)
  const gapFinancial = Math.abs(s.totalGapMB * s.totalVendaProjetada)
  const diasRestantes = Math.max(0, diasTot - diasDec)
  const recovery60 = gapAbs * 0.6
  const marginScenario = s.totalGapMB < 0 ? s.totalMbPercReal + recovery60 : s.totalMbPercReal
  const gain60 = gapFinancial * 0.6

  return (
    <div className="card-shadow flex h-full flex-col gap-3.5 rounded-[20px] border border-border-soft bg-white p-5">
      <div className="flex items-center gap-2">
        <Target className="size-4 text-brand" aria-hidden />
        <h2 className="text-[15px] font-extrabold text-text-main">Recuperação Necessária</h2>
      </div>

      <div className="rounded-[16px] border border-red-100 bg-danger-soft p-4">
        <p className="text-[13px] font-bold text-text-main">Para atingir a meta de {pctS(s.totalMetaMB)}</p>
        <p className="mt-1 text-[11.5px] text-text-muted-c">Faltam recuperar:</p>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[22px] font-extrabold text-danger-c">{pp(gapAbs)}</span>
          <span className="text-[12px] font-semibold text-text-muted-c">ou</span>
          <span className="text-[22px] font-extrabold text-danger-c">{R$(gapFinancial)}</span>
        </div>
      </div>

      <div className="rounded-[16px] border border-emerald-100 bg-brand-soft p-4">
        <div className="mb-1 flex items-center gap-2">
          <CalendarClock className="size-4 text-brand-dark" aria-hidden />
          <p className="text-[13px] font-bold text-text-main">Necessário recuperar</p>
        </div>
        <p className="text-[22px] font-extrabold text-brand-dark">{diasRestantes > 0 ? `${R$(gapFinancial / diasRestantes)}/dia` : "Mês encerrado"}</p>
        <p className="mt-0.5 text-[11.5px] text-text-muted-c">{diasRestantes > 0 ? "para encerrar o mês na meta" : "não há dias restantes no período"}</p>
      </div>

      <div className="rounded-[16px] border border-amber-100 bg-warning-soft p-4">
        <div className="mb-2 flex items-center gap-2">
          <Lightbulb className="size-4 text-warning-c" aria-hidden />
          <p className="text-[12.5px] font-bold uppercase tracking-wide text-text-main">Cenário de recuperação (60% do GAP)</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10.5px] font-semibold uppercase text-text-muted-c">MB% projetada</p>
            <p className="text-[16px] font-extrabold text-text-main">{pctS(marginScenario)}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-semibold uppercase text-text-muted-c">Ganho estimado</p>
            <p className="text-[16px] font-extrabold text-text-main">{R$(gain60)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
