import { useMemo, useState } from "react"
import {
  CENARIOS, serieGap, tendencia, resumoPorCenario, efeitoGlp1,
  direcaoRecomendada, LABEL_DIRECAO, participacaoIdeal,
  type CenarioGap,
} from "@/lib/gapParticipacao"
import { R$, pctS, pp } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Info, TrendingUp, TrendingDown, Target, Lightbulb, ArrowUp, ArrowDown, Minus } from "lucide-react"

const COR_MERCADO = "#e07b39"
const COR_UNIPRECO = "#0d9b63"
const COR_GAP = "#dc3a3a"
const COR_IDEAL = "#2862c9"

function labelMesCurto(mes: string): string {
  const [m, y] = mes.split("/")
  return `${m.toLowerCase()}/${y.slice(2)}`
}

function KpiCard({ titulo, valor, valorCor, detalhe, variacao, sufixoVariacao, destaque }: {
  titulo: string; valor: string; valorCor: string; detalhe?: string
  variacao?: number | null; sufixoVariacao?: string; destaque?: boolean
}) {
  return (
    <div className={cn("card-shadow rounded-[16px] border bg-white p-4", destaque ? "border-red-200 bg-danger-soft/40" : "border-border-soft")}>
      <p className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[.07em] text-text-muted-c">
        {titulo}<Info className="size-3 opacity-50" aria-hidden />
      </p>
      <p className="mt-1 text-[28px] font-extrabold leading-none tabular-nums" style={{ color: valorCor }}>{valor}</p>
      {variacao !== undefined && variacao !== null && (
        <p className={cn("mt-2 flex items-center gap-1 text-[11.5px] font-semibold", variacao >= 0 ? "text-brand-dark" : "text-danger-c")}>
          {variacao >= 0 ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />}
          {sufixoVariacao ?? pp(variacao)} vs. mês anterior
        </p>
      )}
      {detalhe && <p className="mt-2 text-[11.5px] text-text-muted-c">{detalhe}</p>}
    </div>
  )
}

export function GapParticipacaoCard() {
  const [cenario, setCenario] = useState<CenarioGap>("RX_PROMOVIDO_SEM_GLP1")
  const [nMeses, setNMeses] = useState(12)

  const serie = useMemo(() => serieGap(cenario, nMeses), [cenario, nMeses])
  const tend = useMemo(() => tendencia(serie), [serie])
  const comparativo = useMemo(() => resumoPorCenario(nMeses), [nMeses])
  const glp1 = useMemo(() => efeitoGlp1(nMeses), [nMeses])

  const ultimo = serie[serie.length - 1]
  const anterior = serie.length > 1 ? serie[serie.length - 2] : null
  const ideal = participacaoIdeal(cenario)
  const def = CENARIOS.find((c) => c.key === cenario)

  if (!ultimo) {
    return (
      <div className="card-shadow rounded-[16px] border border-border-soft bg-white p-8 text-center text-sm text-text-muted-c">
        Não há dados suficientes para calcular o gap de participação neste cenário.
      </div>
    )
  }

  const direcao = direcaoRecomendada(ultimo.partUnipreco, ideal)
  const ehRxPromovido = cenario !== "RX_GENERICO"

  // --- gráfico ---
  const W = 700, H = 300, padL = 46, padR = 54, padT = 22, padB = 40
  const plotW = W - padL - padR, plotH = H - padT - padB
  const maxPct = Math.max(...serie.map((p) => Math.max(p.partMercado, p.partUnipreco, p.partIdeal ?? 0))) * 1.18
  const maxFin = Math.max(...serie.map((p) => Math.abs(p.gapFinanceiro))) * 1.1 || 1
  const x = (i: number) => padL + (serie.length === 1 ? plotW / 2 : (i / (serie.length - 1)) * plotW)
  const y = (v: number) => padT + plotH - (v / maxPct) * plotH
  const yFin = (v: number) => padT + plotH - (Math.abs(v) / maxFin) * plotH
  const linha = (get: (p: typeof ultimo) => number) =>
    serie.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(get(p)).toFixed(1)}`).join(" ")
  const barW = Math.min(26, (plotW / serie.length) * 0.5)

  return (
    <section aria-label="Gap de participação por linha" className="mt-8">
      {/* Separador + cabeçalho da nova análise */}
      <div className="mb-4 border-t border-border-soft pt-6">
        <p className="text-[10.5px] font-extrabold uppercase tracking-[.12em] text-brand">Nova análise</p>
        <h2 className="mt-1 text-[20px] font-extrabold text-text-main">Gap de Participação por Linha</h2>
        <p className="text-[13px] text-text-muted-c">
          Compare a participação da Unipreço com o mercado (Bricks Unipreço) e com a meta estratégica definida para cada linha.
        </p>
      </div>

      {/* Filtros */}
      <div className="card-shadow mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[16px] border border-border-soft bg-white px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10.5px] font-bold uppercase tracking-[.07em] text-text-muted-c">Cenário</span>
          <div className="flex gap-1 rounded-[10px] border border-border-soft p-1" role="group" aria-label="Selecionar cenário de análise">
            {CENARIOS.map((c) => (
              <button
                key={c.key} onClick={() => setCenario(c.key)} aria-pressed={cenario === c.key}
                className={cn("rounded-[7px] px-3 py-1.5 text-[12px] font-bold transition-colors",
                  cenario === c.key ? "bg-brand text-white" : "text-text-muted-c hover:text-brand")}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="gap-periodo" className="text-[10.5px] font-bold uppercase tracking-[.07em] text-text-muted-c">Período</label>
          <select
            id="gap-periodo" value={nMeses} onChange={(e) => setNMeses(Number(e.target.value))}
            className="h-9 rounded-[9px] border border-border-soft px-2.5 text-[12.5px] font-semibold text-text-main"
          >
            <option value={6}>Últimos 6 meses</option>
            <option value={12}>Últimos 12 meses</option>
            <option value={24}>Últimos 24 meses</option>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2 rounded-[10px] border border-blue-100 bg-blue-soft px-3 py-2">
          <Target className="size-4" style={{ color: COR_IDEAL }} aria-hidden />
          <span className="text-[11.5px] font-semibold text-text-muted-c">Meta de participação ideal</span>
          <span className="text-[15px] font-extrabold" style={{ color: COR_IDEAL }}>{ideal !== null ? pctS(ideal, 2) : "—"}</span>
        </div>
      </div>

      {/* Cards */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard titulo="Participação mercado" valor={pctS(ultimo.partMercado, 2)} valorCor={COR_MERCADO}
          variacao={anterior ? ultimo.partMercado - anterior.partMercado : null} />
        <KpiCard titulo="Participação Unipreço" valor={pctS(ultimo.partUnipreco, 2)} valorCor={COR_UNIPRECO}
          variacao={anterior ? ultimo.partUnipreco - anterior.partUnipreco : null} />
        <KpiCard titulo="Gap atual" valor={pp(ultimo.gapPP, 2).replace("+", "")} valorCor={COR_GAP}
          variacao={tend.variacaoMesAnterior} />
        <KpiCard titulo="Gap financeiro" valor={R$(ultimo.gapFinanceiro)} valorCor={COR_GAP} destaque
          variacao={anterior ? ultimo.gapFinanceiro - anterior.gapFinanceiro : null}
          sufixoVariacao={anterior ? R$(ultimo.gapFinanceiro - anterior.gapFinanceiro) : undefined} />
        <KpiCard titulo="Participação ideal" valor={ideal !== null ? pctS(ideal, 2) : "—"} valorCor={COR_IDEAL}
          detalhe={ideal !== null ? `meta interna · gap ajustado ${pp(ultimo.gapIdealPP ?? 0, 2)}` : "meta não configurada"} />
      </div>

      {/* Insight executivo */}
      <div className="card-shadow mb-4 flex items-start gap-2.5 rounded-[14px] border border-emerald-100 bg-brand-soft px-4 py-3">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-brand-dark" aria-hidden />
        <p className="text-[12.5px] leading-relaxed text-text-main">
          <b>Cenário atual:</b> a participação da Unipreço está <b>{pp(Math.abs(ultimo.gapPP), 2).replace("+", "")}</b>{" "}
          {ultimo.gapPP >= 0 ? "abaixo" : "acima"} do mercado em {def?.label}.
          {ideal !== null && (
            <> Considerando a participação ideal de <b>{pctS(ideal, 2)}</b>, o gap ajustado é de <b>{pp(Math.abs(ultimo.gapIdealPP ?? 0), 2).replace("+", "")}</b>{" "}
            e a direção recomendada é <b>{LABEL_DIRECAO[direcao].toLowerCase()}</b>.</>
          )}
          {tend.melhorou !== null && (
            <> Em relação ao mês anterior, a distância até a meta {tend.melhorou ? "diminuiu" : "aumentou"}.</>
          )}
        </p>
      </div>

      {/* Gráfico + painéis laterais */}
      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="card-shadow rounded-[16px] border border-border-soft bg-white p-4">
          <h3 className="mb-1 text-[14px] font-extrabold text-text-main">Evolução do gap mensal — {def?.label}</h3>
          <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-muted-c">
            <span className="flex items-center gap-1"><span className="h-0.5 w-4 rounded" style={{ background: COR_MERCADO }} aria-hidden /> Part. mercado</span>
            <span className="flex items-center gap-1"><span className="h-0.5 w-4 rounded" style={{ background: COR_UNIPRECO }} aria-hidden /> Part. Unipreço</span>
            <span className="flex items-center gap-1"><span className="h-0.5 w-4 rounded" style={{ background: COR_GAP }} aria-hidden /> Gap (pp)</span>
            {ideal !== null && <span className="flex items-center gap-1"><span className="h-0.5 w-4 rounded border-t border-dashed" style={{ borderColor: COR_IDEAL }} aria-hidden /> Part. ideal</span>}
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-[2px]" style={{ background: "rgba(220,58,58,.22)" }} aria-hidden /> Gap R$</span>
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Evolução mensal do gap de participação em ${def?.label}`} className="w-full">
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <g key={f}>
                <line x1={padL} y1={padT + plotH * (1 - f)} x2={W - padR} y2={padT + plotH * (1 - f)} stroke="#eef1f4" strokeWidth={1} />
                <text x={padL - 6} y={padT + plotH * (1 - f) + 3.5} textAnchor="end" fontSize={9} fill="var(--text-muted-c)">{pctS(maxPct * f, 0)}</text>
              </g>
            ))}
            <text x={W - padR + 8} y={padT - 8} fontSize={9} fontWeight={700} fill="var(--text-muted-c)">R$</text>

            {serie.map((p, i) => (
              <rect key={`b${p.mes}`} x={x(i) - barW / 2} y={yFin(p.gapFinanceiro)} width={barW}
                height={Math.max(0, padT + plotH - yFin(p.gapFinanceiro))} fill="rgba(220,58,58,.16)" rx={2}>
                <title>{`${labelMesCurto(p.mes)} — Gap R$ ${R$(p.gapFinanceiro)}`}</title>
              </rect>
            ))}

            {ideal !== null && (
              <line x1={padL} y1={y(ideal)} x2={W - padR} y2={y(ideal)} stroke={COR_IDEAL} strokeWidth={1.6} strokeDasharray="5 4" />
            )}
            <path d={linha((p) => p.partMercado)} fill="none" stroke={COR_MERCADO} strokeWidth={2.4} strokeLinecap="round" />
            <path d={linha((p) => p.partUnipreco)} fill="none" stroke={COR_UNIPRECO} strokeWidth={2.4} strokeLinecap="round" />
            <path d={linha((p) => p.gapPP)} fill="none" stroke={COR_GAP} strokeWidth={2.2} strokeLinecap="round" />

            {serie.map((p, i) => {
              const ultimoPonto = i === serie.length - 1
              return (
                <g key={p.mes}>
                  <circle cx={x(i)} cy={y(p.partMercado)} r={3} fill="#fff" stroke={COR_MERCADO} strokeWidth={2}>
                    <title>{`${labelMesCurto(p.mes)} — Mercado ${pctS(p.partMercado, 2)}`}</title>
                  </circle>
                  <circle cx={x(i)} cy={y(p.partUnipreco)} r={3} fill="#fff" stroke={COR_UNIPRECO} strokeWidth={2}>
                    <title>{`${labelMesCurto(p.mes)} — Unipreço ${pctS(p.partUnipreco, 2)}`}</title>
                  </circle>
                  <circle cx={x(i)} cy={y(p.gapPP)} r={3} fill="#fff" stroke={COR_GAP} strokeWidth={2}>
                    <title>{`${labelMesCurto(p.mes)} — Gap ${pp(p.gapPP, 2)} · ${R$(p.gapFinanceiro)}`}</title>
                  </circle>
                  {ultimoPonto && (
                    <>
                      <text x={x(i)} y={y(p.partMercado) - 8} textAnchor="end" fontSize={10} fontWeight={800} fill={COR_MERCADO}>{pctS(p.partMercado, 2)}</text>
                      <text x={x(i)} y={y(p.partUnipreco) - 8} textAnchor="end" fontSize={10} fontWeight={800} fill={COR_UNIPRECO}>{pctS(p.partUnipreco, 2)}</text>
                      <text x={x(i)} y={y(p.gapPP) - 8} textAnchor="end" fontSize={10} fontWeight={800} fill={COR_GAP}>{pp(p.gapPP, 2).replace("+", "")}</text>
                    </>
                  )}
                  {(i === 0 || i === serie.length - 1 || i % 2 === 0) && (
                    <text x={x(i)} y={H - 14} textAnchor="middle" fontSize={9} fill="var(--text-muted-c)">{labelMesCurto(p.mes)}</text>
                  )}
                </g>
              )
            })}
          </svg>
          <p className="mt-1 text-[10.5px] text-text-muted-c">* Gap (pp) = Participação mercado − Participação Unipreço. Barras = gap financeiro do mês.</p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Participação por referência */}
          <div className="card-shadow rounded-[16px] border border-border-soft bg-white p-4">
            <h3 className="mb-3 text-[13px] font-extrabold text-text-main">Participação por referência</h3>
            {[
              { label: "Mercado", valor: ultimo.partMercado, cor: COR_MERCADO },
              ...(ideal !== null ? [{ label: "Ideal interno", valor: ideal, cor: COR_IDEAL }] : []),
              { label: "Unipreço atual", valor: ultimo.partUnipreco, cor: COR_UNIPRECO },
            ].map((b) => (
              <div key={b.label} className="mb-2.5">
                <div className="mb-1 flex items-baseline justify-between text-[11.5px]">
                  <span className="text-text-muted-c">{b.label}</span>
                  <span className="font-extrabold text-text-main">{pctS(b.valor, 2)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#eef1f4]">
                  <div className="h-full rounded-full" style={{ width: `${(b.valor / maxPct) * 100}%`, background: b.cor }} />
                </div>
              </div>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border-soft pt-3">
              <div className="text-center">
                <p className="text-[10.5px] font-semibold uppercase text-text-muted-c">Gap vs mercado</p>
                <p className="text-[17px] font-extrabold" style={{ color: COR_GAP }}>{pp(ultimo.gapPP, 2).replace("+", "")}</p>
              </div>
              <div className="text-center">
                <p className="text-[10.5px] font-semibold uppercase text-text-muted-c">Gap vs ideal</p>
                <p className="text-[17px] font-extrabold" style={{ color: COR_IDEAL }}>{ultimo.gapIdealPP !== null ? pp(ultimo.gapIdealPP, 2).replace("+", "") : "—"}</p>
              </div>
            </div>
          </div>

          {/* Resumo executivo */}
          <div className="card-shadow rounded-[16px] border border-border-soft bg-white p-4">
            <h3 className="mb-2 text-[13px] font-extrabold text-text-main">Resumo executivo</h3>
            <ul className="space-y-1.5 text-[12px] text-text-main">
              {glp1 && ehRxPromovido && (
                <li className="flex gap-1.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  {glp1.diferencaPP > 0
                    ? <>Incluir GLP-1 <b>aumenta</b> o gap em {pp(glp1.diferencaPP, 2).replace("+", "")} ({R$(glp1.diferencaFinanceira)}).</>
                    : <>Excluir GLP-1 <b>aumenta</b> o gap em {pp(Math.abs(glp1.diferencaPP), 2)} — o produto puxa a participação da rede para cima.</>}
                </li>
              )}
              {tend.variacao3m !== null && (
                <li className="flex gap-1.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  Nos últimos 3 meses o gap {tend.variacao3m < 0 ? "recuou" : "avançou"} {pp(Math.abs(tend.variacao3m), 2)}.
                </li>
              )}
              {tend.piorMes && (
                <li className="flex gap-1.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  Maior distância da meta em <b>{labelMesCurto(tend.piorMes.mes)}</b>; menor em <b>{tend.melhorMes ? labelMesCurto(tend.melhorMes.mes) : "—"}</b>.
                </li>
              )}
              <li className="flex gap-1.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                Direção recomendada: <b>{LABEL_DIRECAO[direcao].toLowerCase()}</b>.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Comparativo por visão */}
      <div className="card-shadow mb-4 overflow-hidden rounded-[16px] border border-border-soft bg-white">
        <div className="px-5 pt-4">
          <h3 className="text-[14px] font-extrabold text-text-main">Comparativo por visão</h3>
          <p className="text-[12px] text-text-muted-c">Último mês da série, para os três cenários analisados.</p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-gradient-to-r from-[#084a3b] to-[#0d6b57] text-white">
                <th scope="col" className="px-3 py-2.5 pl-5 text-left text-[10.5px] font-bold uppercase tracking-wide">Visão</th>
                <th scope="col" className="px-3 py-2.5 text-right text-[10.5px] font-bold uppercase tracking-wide">Part. mercado</th>
                <th scope="col" className="px-3 py-2.5 text-right text-[10.5px] font-bold uppercase tracking-wide">Part. Unipreço</th>
                <th scope="col" className="px-3 py-2.5 text-right text-[10.5px] font-bold uppercase tracking-wide">Part. ideal</th>
                <th scope="col" className="px-3 py-2.5 text-right text-[10.5px] font-bold uppercase tracking-wide">Gap vs mercado</th>
                <th scope="col" className="px-3 py-2.5 text-right text-[10.5px] font-bold uppercase tracking-wide">Gap vs ideal</th>
                <th scope="col" className="px-3 py-2.5 text-right text-[10.5px] font-bold uppercase tracking-wide">Gap financeiro</th>
                <th scope="col" className="px-3 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide">Direção</th>
              </tr>
            </thead>
            <tbody>
              {comparativo.map((r, i) => (
                <tr key={r.cenario}
                  className={cn("border-t border-border-soft transition-colors hover:bg-brand-soft/60", i % 2 === 1 && "bg-muted/30", r.cenario === cenario && "bg-brand-soft/50 font-semibold")}>
                  <td className="whitespace-nowrap px-3 py-2 pl-5 font-semibold text-text-main">{r.label}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums" style={{ color: COR_MERCADO }}>{pctS(r.partMercado, 2)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums" style={{ color: COR_UNIPRECO }}>{pctS(r.partUnipreco, 2)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums" style={{ color: COR_IDEAL }}>{r.partIdeal !== null ? pctS(r.partIdeal, 2) : "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-bold tabular-nums" style={{ color: COR_GAP }}>{pp(r.gapPP, 2).replace("+", "")}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-bold tabular-nums" style={{ color: COR_IDEAL }}>{r.gapIdealPP !== null ? pp(r.gapIdealPP, 2).replace("+", "") : "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-bold tabular-nums text-text-main">{R$(r.gapFinanceiro)}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
                      r.direcao === "AUMENTAR" && "bg-danger-soft text-danger-c",
                      r.direcao === "REDUZIR" && "bg-blue-soft text-[#2862c9]",
                      r.direcao === "MANTER" && "bg-brand-soft text-brand-dark",
                      r.direcao === "SEM_META" && "bg-muted text-text-muted-c")}>
                      {r.direcao === "AUMENTAR" && <TrendingUp className="size-3" aria-hidden />}
                      {r.direcao === "REDUZIR" && <TrendingDown className="size-3" aria-hidden />}
                      {r.direcao === "MANTER" && <Minus className="size-3" aria-hidden />}
                      {LABEL_DIRECAO[r.direcao]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota metodológica */}
      <div className="flex items-start gap-1.5 rounded-[12px] border border-border-soft bg-muted/20 px-4 py-3 text-[11px] leading-relaxed text-text-muted-c">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <p>
          O gap de participação é a diferença entre a participação da linha no mercado (Bricks Unipreço) e a participação da mesma linha dentro da Unipreço,
          ambas calculadas sobre o total do respectivo escopo. O gap financeiro estima quanto a rede faturaria a mais na linha se atingisse a participação do
          mercado, aplicando o gap sobre a venda total da Unipreço rastreada pelo IQVIA. A participação ideal é uma <b>meta interna estratégica</b>, configurável
          em <code className="rounded bg-white px-1">src/data/metasParticipacaoIdeal.json</code>, e não precisa ser igual à participação de mercado.
          Percentuais validados contra a planilha da área nos 12 meses; o gap financeiro fica ~5% menor porque a planilha usa a venda total de faturamento da rede,
          maior que a base rastreada pelo IQVIA.
        </p>
      </div>
    </section>
  )
}
