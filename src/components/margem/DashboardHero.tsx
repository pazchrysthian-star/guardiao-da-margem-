import type { SimResult } from "@/lib/simulador"
import { pctS, pp } from "@/lib/format"
import { ArrowDownRight, ArrowUpRight, CircleDollarSign, Gauge, Sparkles, Target } from "lucide-react"

function money(v: number) {
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${v < 0 ? "-" : ""}R$ ${(abs / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} Mi`
  if (abs >= 1_000) return `${v < 0 ? "-" : ""}R$ ${(abs / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`
  return `R$ ${Math.round(v).toLocaleString("pt-BR")}`
}

export function DashboardHero({ s }: { s: SimResult }) {
  const vendaGap = s.totalMetaVenda > 0 ? s.totalVendaProjetada / s.totalMetaVenda - 1 : 0
  const margemOk = s.totalGapMB >= 0
  const vendaOk = vendaGap >= 0
  const impactoOk = s.totalPerdaGanhoTotal >= 0

  return (
    <section className="executive-hero mb-6 overflow-hidden rounded-[24px] p-5 text-white sm:p-7">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
        <div className="flex flex-col justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/85">
              <Sparkles className="size-3.5" /> Visão executiva
            </div>
            <h2 className="max-w-[520px] text-2xl font-extrabold leading-tight sm:text-3xl">O mês está projetado para {margemOk ? "superar" : "ficar abaixo de"} a meta de margem.</h2>
            <p className="mt-3 max-w-[560px] text-sm leading-relaxed text-white/72">
              Acompanhe venda, margem e impacto financeiro em uma única leitura. Os detalhes operacionais permanecem disponíveis nas seções abaixo.
            </p>
          </div>
          <div className={`inline-flex w-fit items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${impactoOk ? "bg-emerald-300/15 text-emerald-100" : "bg-red-300/15 text-red-100"}`}>
            {impactoOk ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
            Impacto projetado: {money(s.totalPerdaGanhoTotal)}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<CircleDollarSign className="size-5" />} label="Venda projetada" value={money(s.totalVendaProjetada)} detail={`${vendaOk ? "+" : ""}${pctS(vendaGap)} vs meta`} positive={vendaOk} />
          <Metric icon={<Gauge className="size-5" />} label="MB% projetada" value={pctS(s.totalMbPercReal)} detail={`${pp(s.totalGapMB)} vs meta`} positive={margemOk} />
          <Metric icon={<Target className="size-5" />} label="Meta de margem" value={pctS(s.totalMetaMB)} detail="Alvo ponderado da rede" neutral />
          <Metric icon={<Sparkles className="size-5" />} label="Efeito mix" value={money(s.totalPerdaGanhoVenda)} detail="Participação das linhas" positive={s.totalPerdaGanhoVenda >= 0} />
        </div>
      </div>
    </section>
  )
}

function Metric({ icon, label, value, detail, positive, neutral }: { icon: React.ReactNode; label: string; value: string; detail: string; positive?: boolean; neutral?: boolean }) {
  return (
    <article className="rounded-[18px] border border-white/12 bg-white/[0.08] p-4 backdrop-blur-sm">
      <div className="mb-5 flex items-center justify-between">
        <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-white/90">{icon}</span>
        {!neutral && <span className={`size-2 rounded-full ${positive ? "bg-emerald-300" : "bg-red-300"}`} />}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/55">{label}</p>
      <p className="mt-1 text-xl font-extrabold tabular-nums">{value}</p>
      <p className={`mt-2 text-xs ${neutral ? "text-white/55" : positive ? "text-emerald-200" : "text-red-200"}`}>{detail}</p>
    </article>
  )
}
