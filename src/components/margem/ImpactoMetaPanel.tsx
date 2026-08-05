import { useMemo, useState } from "react"
import type { SimLinha, SimResult } from "@/lib/simulador"
import { R$, pctS, pp } from "@/lib/format"
import { heatBg, maxAbsOf } from "@/lib/heat"
import { cn } from "@/lib/utils"
import { ArrowDownRight, ArrowUpRight, CircleGauge, Info, Target, ToggleLeft, ToggleRight } from "lucide-react"

type SortKey = "linha" | "metaMB" | "mbPercRecomp" | "metaParticipacao" | "participacaoReal" | "impactoMargemPP" | "impactoMixPP" | "impactoTotalPP" | "responsabilidadeGap"
type ViewMode = "pp" | "rs"

const cols: { key: SortKey; label: string }[] = [
  { key: "linha", label: "Linha" }, { key: "metaMB", label: "Meta MB" }, { key: "mbPercRecomp", label: "MB real" },
  { key: "metaParticipacao", label: "Meta part." }, { key: "participacaoReal", label: "Part. real" },
  { key: "impactoMargemPP", label: "Impacto margem" }, { key: "impactoMixPP", label: "Impacto mix" },
  { key: "impactoTotalPP", label: "Impacto total" }, { key: "responsabilidadeGap", label: "Responsabilidade" },
]

function status(l: SimLinha, max: number) {
  const critico = Math.max(max * .3, .0005), atencao = Math.max(max * .1, .0002)
  if (l.impactoTotalPP <= -critico) return { label: "Crítico", cls: "bg-danger-soft text-danger-c" }
  if (l.impactoTotalPP < -atencao) return { label: "Atenção", cls: "bg-warning-soft text-[#9a5700]" }
  if (l.impactoTotalPP >= atencao) return { label: "Contribui", cls: "bg-brand-soft text-brand-dark" }
  return { label: "Neutro", cls: "bg-[#eef1f5] text-text-muted-c" }
}

function MainRanking({ rows, totalVenda, mode }: { rows: SimLinha[]; totalVenda: number; mode: ViewMode }) {
  const max = Math.max(...rows.map(r => Math.abs(r.impactoTotalPP)), .0001)
  return <div className="space-y-3">{rows.map((r, i) => {
    const positive = r.impactoTotalPP >= 0
    const financial = r.impactoTotalPP * totalVenda
    return <div key={r.linha} className="rounded-[14px] border border-border-soft bg-[#fafbfc] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
      <div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-white text-[10px] font-extrabold text-text-muted-c shadow-sm">{i+1}</span><span className="truncate text-[12.5px] font-extrabold text-text-main">{r.linha}</span></div><div className="mt-1 pl-8 text-[11px] text-text-muted-c">{pctS(r.responsabilidadeGap,0)} da perda concentrada</div></div><div className="text-right"><div className={cn("text-sm font-extrabold tabular-nums", positive ? "text-brand-dark" : "text-danger-c")}>{mode === "pp" ? pp(r.impactoTotalPP) : R$(financial)}</div><div className="text-[10.5px] text-text-muted-c">{mode === "pp" ? R$(financial) : pp(r.impactoTotalPP)}</div></div></div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#e9edf1]"><div className={cn("h-full rounded-full", positive ? "bg-brand" : "bg-danger-c")} style={{ width: `${Math.max(5, Math.abs(r.impactoTotalPP)/max*100)}%` }}/></div>
    </div>
  })}</div>
}

export function ImpactoMetaPanel({ s }: { s: SimResult }) {
  const [sort, setSort] = useState<{key: SortKey; dir: 1|-1}>({key:"impactoTotalPP",dir:1})
  const [mode, setMode] = useState<ViewMode>("pp")
  const sorted = useMemo(() => s.linhas.slice().sort((a,b) => sort.key === "linha" ? a.linha.localeCompare(b.linha)*sort.dir : ((a[sort.key] as number)-(b[sort.key] as number))*sort.dir), [s.linhas,sort])
  const ofensores = useMemo(() => s.linhas.filter(l=>l.impactoTotalPP<0).sort((a,b)=>a.impactoTotalPP-b.impactoTotalPP),[s.linhas])
  const contribuicoes = useMemo(() => s.linhas.filter(l=>l.impactoTotalPP>0).sort((a,b)=>b.impactoTotalPP-a.impactoTotalPP),[s.linhas])
  const top5 = ofensores.slice(0,5)
  const maxImpact = maxAbsOf(s.linhas,l=>l.impactoTotalPP)
  const fechamento = Math.abs(s.totalImpactoTotalPP-s.totalGapMB)
  const negTotal = ofensores.reduce((a,b)=>a+Math.abs(b.impactoTotalPP),0)
  const top5Share = negTotal > 0 ? top5.reduce((a,b)=>a+Math.abs(b.impactoTotalPP),0)/negTotal : 0
  const belowMeta = s.linhas.filter(l=>l.gapMB<0 || l.gapPeso<0).length
  const focusCount = Math.min(5, ofensores.length)
  const potential = Math.abs(top5.reduce((a,b)=>a+b.impactoTotalPP,0)*s.totalVendaProjetada)
  const toggleSort = (key:SortKey)=>setSort(p=>p.key===key?{key,dir:p.dir===1?-1:1}:{key,dir:key==="linha"?1:-1})

  return <section className="mb-6 rounded-[22px] border border-border-soft bg-white p-5 shadow-[0_10px_34px_rgba(16,24,40,.06)]">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Target className="size-5 text-brand"/><h2 className="text-[18px] font-extrabold text-text-main">Principais Impactos na Meta</h2></div><p className="mt-1 text-[12.5px] text-text-muted-c">Priorize as linhas que mais explicam o desvio e alterne a leitura entre pontos percentuais e impacto financeiro.</p></div><div className="flex items-center gap-2"><span className="flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-dark"><CircleGauge className="size-3.5"/>Fechamento {fechamento < .000001 ? "validado" : pp(fechamento)}</span><button onClick={()=>setMode(m=>m==="pp"?"rs":"pp")} className="flex items-center gap-2 rounded-[11px] border border-border-soft bg-white px-3 py-2 text-xs font-bold text-text-main shadow-sm hover:bg-brand-soft">{mode==="pp"?<ToggleLeft className="size-4 text-brand"/>:<ToggleRight className="size-4 text-brand"/>}{mode==="pp"?"Exibir R$":"Exibir p.p."}</button></div></div>

    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_.55fr]">
      <div className="rounded-[18px] border border-border-soft bg-white p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-extrabold text-text-main">Ranking de impacto</h3><span className="text-[11px] font-semibold text-text-muted-c">Top ofensores</span></div><MainRanking rows={top5} totalVenda={s.totalVendaProjetada} mode={mode}/>{contribuicoes[0] && <div className="mt-4 rounded-[14px] border border-emerald-100 bg-brand-soft p-3"><div className="flex items-center gap-2"><ArrowUpRight className="size-4 text-brand"/><span className="text-xs font-extrabold text-text-main">Maior contribuição positiva</span></div><div className="mt-2 flex items-center justify-between gap-3 text-xs"><span className="font-semibold">{contribuicoes[0].linha}</span><strong className="text-brand-dark">{mode==="pp"?pp(contribuicoes[0].impactoTotalPP):R$(contribuicoes[0].impactoTotalPP*s.totalVendaProjetada)}</strong></div></div>}</div>
      <aside className="rounded-[18px] border border-purple-100 bg-gradient-to-b from-purple-soft/70 to-white p-4"><div className="flex items-center gap-2"><ArrowDownRight className="size-4 text-purple-c"/><h3 className="text-sm font-extrabold text-text-main">Oportunidade concentrada</h3></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-[14px] bg-white p-3 text-center shadow-sm"><div className="text-3xl font-extrabold text-text-main">{belowMeta}</div><div className="mt-1 text-[11px] text-text-muted-c">linhas abaixo da meta</div></div><div className="rounded-[14px] bg-white p-3 text-center shadow-sm"><div className="text-3xl font-extrabold text-purple-c">{Math.round(top5Share*100)}%</div><div className="mt-1 text-[11px] text-text-muted-c">da perda nas 5 principais</div></div></div><div className="mt-3 rounded-[14px] border border-purple-100 bg-white p-3"><div className="text-[11px] font-semibold text-text-muted-c">Foco imediato</div><div className="mt-1 text-2xl font-extrabold text-text-main">{focusCount} linhas</div><p className="mt-1 text-[11px] leading-5 text-text-muted-c">Concentram a maior oportunidade de correção do cenário atual.</p></div><div className="mt-3 rounded-[14px] bg-brand p-4 text-white"><p className="text-[11.5px] leading-5">Focando nessas linhas é possível recuperar até</p><div className="mt-1 text-xl font-extrabold">{R$(potential)}</div><p className="mt-1 text-[10.5px] text-white/75">Estimativa baseada no impacto atual das cinco maiores linhas.</p></div></aside>
    </div>

    <div className="mt-5 overflow-hidden rounded-[16px] border border-border-soft"><div className="flex items-start gap-2 border-b border-border-soft bg-[#fafbfc] px-4 py-3 text-[11.5px] text-text-muted-c"><Info className="mt-0.5 size-3.5 shrink-0"/><span><strong>Impacto total</strong> = impacto margem + impacto mix. A soma fecha com o gap geral da rede.</span></div><div className="overflow-x-auto"><table className="w-full border-separate border-spacing-0 text-[12px]"><thead><tr className="bg-gradient-to-r from-[#084a3b] to-[#0d6b57] text-white">{cols.map((c,i)=><th key={c.key} onClick={()=>toggleSort(c.key)} className={cn("cursor-pointer whitespace-nowrap px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wide hover:bg-white/10",i===0&&"pl-4")}>{c.label}{sort.key===c.key?(sort.dir===1?" ▲":" ▼"):""}</th>)}<th className="px-3 py-2.5 text-left text-[10.5px] uppercase">Status</th></tr></thead><tbody>{sorted.map((l,i)=>{const st=status(l,maxImpact);return <tr key={l.linha} className={cn("hover:bg-brand-soft/60",i%2===1&&"bg-[#fafbfc]")}><td className="whitespace-nowrap px-3 py-2 pl-4 font-semibold">{l.linha}</td><td className="px-3 py-2 tabular-nums">{pctS(l.metaMB)}</td><td className="px-3 py-2 tabular-nums">{pctS(l.mbPercRecomp)}</td><td className="px-3 py-2 tabular-nums">{pctS(l.metaParticipacao)}</td><td className="px-3 py-2 tabular-nums">{pctS(l.participacaoReal)}</td><td className={cn("px-3 py-2 font-semibold tabular-nums",l.impactoMargemPP<0?"text-danger-c":"text-brand-dark")}>{pp(l.impactoMargemPP)}</td><td className={cn("px-3 py-2 font-semibold tabular-nums",l.impactoMixPP<0?"text-danger-c":"text-brand-dark")}>{pp(l.impactoMixPP)}</td><td className="px-3 py-2 font-extrabold tabular-nums" style={heatBg(l.impactoTotalPP,maxImpact)}>{pp(l.impactoTotalPP)}</td><td className="px-3 py-2 font-semibold tabular-nums">{l.responsabilidadeGap>0?pctS(l.responsabilidadeGap,0):"—"}</td><td className="px-3 py-2"><span className={cn("inline-flex rounded-full px-2 py-1 text-[10.5px] font-bold",st.cls)}>{st.label}</span></td></tr>})}</tbody><tfoot><tr className="bg-[#d9d9d9] font-extrabold"><td className="px-3 py-2.5 pl-4">TOTAL GERAL</td><td className="px-3 py-2.5">{pctS(s.totalMetaMB)}</td><td className="px-3 py-2.5">{pctS(s.totalMbPercReal)}</td><td className="px-3 py-2.5">{pctS(s.somaMetaParticipacao)}</td><td className="px-3 py-2.5">{pctS(1)}</td><td className="px-3 py-2.5">{pp(s.totalImpactoMargemPP)}</td><td className="px-3 py-2.5">{pp(s.totalImpactoMixLinhasPP)}</td><td className={cn("px-3 py-2.5",s.totalImpactoTotalPP<0?"text-danger-c":"text-brand-dark")}>{pp(s.totalImpactoTotalPP)}</td><td className="px-3 py-2.5">100%</td><td className="px-3 py-2.5">—</td></tr></tfoot></table></div></div>
  </section>
}
