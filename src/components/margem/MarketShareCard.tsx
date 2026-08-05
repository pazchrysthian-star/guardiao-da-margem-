import { useMemo, useState } from "react"
import { computeShareTable, serieShareMensal, LINHAS_SEM_IQVIA, type LinhaShare, type Fonte, type Periodo } from "@/lib/mercado"
import { R$, pctS, pp } from "@/lib/format"
import { heatBg, maxAbsOf } from "@/lib/heat"
import { cn } from "@/lib/utils"
import { Info, TrendingUp, TrendingDown } from "lucide-react"

function fmtCompacto(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000_000) return (v < 0 ? "-" : "") + "R$ " + (abs / 1_000_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " Bi"
  if (abs >= 1_000_000) return (v < 0 ? "-" : "") + "R$ " + (abs / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " Mi"
  return R$(v)
}

function Kpi({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: "pos" | "neg" }) {
  return (
    <div className="card-shadow rounded-[18px] border border-border-soft bg-white p-4">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted-c">{label}</div>
      <div className={cn("text-2xl font-bold tabular-nums", tone === "pos" && "text-brand", tone === "neg" && "text-danger-c")}>{value}</div>
      <div className="mt-1 text-xs text-text-muted-c">{detail}</div>
    </div>
  )
}

function Sparkline({ categoriaIqvia, fonte }: { categoriaIqvia: string; fonte: Fonte }) {
  const serie = useMemo(() => serieShareMensal(categoriaIqvia, fonte), [categoriaIqvia, fonte])
  const vals = serie.map((s) => s.share)
  const min = Math.min(...vals), max = Math.max(...vals)
  const W = 110, H = 28
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W
    const y = max > min ? H - ((v - min) / (max - min)) * H : H / 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(" ")
  const subindo = vals[vals.length - 1] >= vals[0]
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Tendência de share, últimos ${vals.length} meses`}>
      <polyline points={pts} fill="none" stroke={subindo ? "var(--brand)" : "var(--danger-c)"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MarketShareCard({ fonte }: { fonte: Fonte }) {
  const [periodo, setPeriodo] = useState<Periodo>("MAT")
  const dados = useMemo(() => computeShareTable(periodo, fonte), [periodo, fonte])

  const [sort, setSort] = useState<{ col: keyof LinhaShare; dir: 1 | -1 }>({ col: "share", dir: -1 })
  const linhas = useMemo(
    () => dados.slice().sort((a, b) => ((a[sort.col] as number) - (b[sort.col] as number)) * -sort.dir),
    [dados, sort]
  )
  const toggleSort = (col: keyof LinhaShare) => setSort((p) => (p.col === col ? { col, dir: p.dir === 1 ? -1 : 1 } : { col, dir: -1 }))

  const totalUnipreco = dados.reduce((s, o) => s + o.vendaUnipreco, 0)
  const totalBricks = dados.reduce((s, o) => s + o.mercadoBricks, 0)
  const shareGeral = totalBricks > 0 ? totalUnipreco / totalBricks : 0
  const maxGap = maxAbsOf(dados, (o) => o.gapCrescimento)

  const melhorCategoria = dados.slice().sort((a, b) => b.share - a.share)[0]
  const piorGap = dados.slice().sort((a, b) => a.gapCrescimento - b.gapCrescimento)[0]

  return (
    <section aria-label="Participação de mercado (IQVIA)" className="mb-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-text-main">Participação de mercado — IQVIA</h2>
          <p className="text-[12.5px] text-text-muted-c">
            Venda da Unipreço vs tamanho do mercado nos Bricks onde a rede atua (a mesma área geográfica que o IQVIA rastreia pra vocês).
          </p>
        </div>
        <div className="flex gap-1.5 rounded-[10px] border border-border-soft bg-white p-1">
          <button onClick={() => setPeriodo("MAT")} className={cn("rounded-[8px] px-3 py-1.5 text-xs font-semibold", periodo === "MAT" ? "bg-brand text-white" : "text-text-muted-c")}>MAT (últimos 12 meses)</button>
          <button onClick={() => setPeriodo("T3M")} className={cn("rounded-[8px] px-3 py-1.5 text-xs font-semibold", periodo === "T3M" ? "bg-brand text-white" : "text-text-muted-c")}>Trimestre móvel</button>
          <button onClick={() => setPeriodo("YTD")} className={cn("rounded-[8px] px-3 py-1.5 text-xs font-semibold", periodo === "YTD" ? "bg-brand text-white" : "text-text-muted-c")}>YTD (ano corrente)</button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Share geral nos Bricks" value={pctS(shareGeral)} detail={`${fmtCompacto(totalUnipreco)} de ${fmtCompacto(totalBricks)} do mercado`} />
        <Kpi
          label="Categoria com maior share"
          value={melhorCategoria ? pctS(melhorCategoria.share) : "-"}
          detail={melhorCategoria?.linha || "-"}
          tone="pos"
        />
        <Kpi
          label="Maior gap de crescimento"
          value={piorGap ? pp(piorGap.gapCrescimento) : "-"}
          detail={piorGap ? `${piorGap.linha} — nós vs mercado` : "-"}
          tone={piorGap && piorGap.gapCrescimento < 0 ? "neg" : "pos"}
        />
        <Kpi
          label="Categorias fora do IQVIA"
          value={String(LINHAS_SEM_IQVIA.length)}
          detail={LINHAS_SEM_IQVIA.join(", ")}
        />
      </div>

      <div className="card-shadow overflow-hidden rounded-[18px] border border-border-soft bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-gradient-to-r from-[#084a3b] to-[#0d6b57] text-white">
                {([
                  ["linha", "Linha"],
                  ["vendaUnipreco", "Venda Unipreço"],
                  ["mercadoBricks", "Mercado (Bricks)"],
                  ["share", "Share"],
                  ["deltaShare", "Δ Share vs ano ant."],
                  ["crescUnipreco", "Cresc. Unipreço"],
                  ["crescMercado", "Cresc. Mercado"],
                  ["gapCrescimento", "Gap vs mercado"],
                  ["shareParana", "Share Paraná"],
                  ["shareBrasil", "Share Brasil"],
                ] as [keyof LinhaShare, string][]).map(([key, label], i) => (
                  <th key={key} className={cn(
                    "cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide hover:bg-white/10",
                    i === 0 && "pl-5",
                    (key === "vendaUnipreco" || key === "crescUnipreco") && "bg-brand-dark"
                  )} onClick={() => toggleSort(key)}>
                    {label}{sort.col === key ? (sort.dir === -1 ? " ▼" : " ▲") : ""}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">Tendência (24m)</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, i) => (
                <tr key={l.categoriaIqvia} className={cn("border-t border-border-soft", i % 2 === 1 && "bg-muted/40")}>
                  <td className="whitespace-nowrap px-3 py-2.5 pl-5 font-semibold text-text-main">{l.linha}</td>
                  <td className="whitespace-nowrap bg-brand-soft px-3 py-2.5 font-semibold">{fmtCompacto(l.vendaUnipreco)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{fmtCompacto(l.mercadoBricks)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-bold text-brand">{pctS(l.share)}</td>
                  <td className={cn("whitespace-nowrap px-3 py-2.5 font-semibold", l.deltaShare >= 0 ? "text-brand" : "text-danger-c")}>
                    {l.deltaShare >= 0 ? <TrendingUp className="mr-1 inline size-3" /> : <TrendingDown className="mr-1 inline size-3" />}{pp(l.deltaShare)}
                  </td>
                  <td className={cn("whitespace-nowrap bg-brand-soft px-3 py-2.5 font-semibold", l.crescUnipreco >= 0 ? "text-brand" : "text-danger-c")}>{pctS(l.crescUnipreco)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-text-muted-c">{pctS(l.crescMercado)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-semibold" style={heatBg(l.gapCrescimento, maxGap)}>{pp(l.gapCrescimento)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-text-muted-c">{pctS(l.shareParana)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-text-muted-c">{pctS(l.shareBrasil)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5"><Sparkline categoriaIqvia={l.categoriaIqvia} fonte={fonte} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-start gap-1.5 border-t border-border-soft bg-muted/20 px-4 py-3 text-[11px] text-text-muted-c">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <p>
            Share = venda da Unipreço (rastreada pelo IQVIA) ÷ tamanho do mercado nos Bricks onde a rede atua, na mesma categoria.
            "Gap vs mercado" é o quanto a Unipreço cresceu a mais (ou a menos) que o mercado local — positivo significa ganho de share, negativo significa perda de share mesmo crescendo em venda.
            Linhas sem equivalente no IQVIA ({LINHAS_SEM_IQVIA.join(", ")}) não têm dado de mercado disponível e ficam fora desta tabela.
          </p>
        </div>
      </div>
    </section>
  )
}
