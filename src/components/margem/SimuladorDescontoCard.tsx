import { useEffect, useMemo, useState } from "react"
import {
  carregarProdutos, linhasComProdutos, simularLinha, simularRede, resumoSelecao,
  distribuicaoDescontos, potencialPorSegmento, concentracaoGanho, cenariosDeCorte,
  melhorOportunidade, tabelaProdutos,
  type RegraSimulacao,
} from "@/lib/produtos"
import { R$, pctS, pp } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  Package, Info, TrendingUp, Search, Sparkles, Check, Layers, BarChart3, Boxes,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/* Helpers visuais                                                     */
/* ------------------------------------------------------------------ */

// Escala de cor por faixa (heatmap): valor alto = alerta
function corMargem(mbp: number): string {
  if (mbp >= 0.45) return "bg-[#e7f6ee] text-[#04663f]"
  if (mbp >= 0.30) return "bg-[#f2f9ec] text-[#3f6b1f]"
  if (mbp >= 0.15) return "bg-[#fdf6e3] text-[#8a6d1a]"
  return "bg-[#fdeaea] text-[#a5342f]"
}
function corDesconto(desc: number): string {
  if (desc < 0.2) return "bg-[#e7f6ee] text-[#04663f]"
  if (desc < 0.4) return "bg-[#fdf6e3] text-[#8a6d1a]"
  if (desc < 0.6) return "bg-[#fdefe0] text-[#a35d16]"
  return "bg-[#fdeaea] text-[#a5342f]"
}
function corCusto(v: number, max: number): React.CSSProperties {
  if (max <= 0) return {}
  const t = Math.min(1, v / max)
  return { backgroundColor: `rgba(229, 107, 111, ${(0.10 + t * 0.55).toFixed(3)})` }
}

/* ------------------------------------------------------------------ */

export function SimuladorDescontoCard() {
  const [dados, setDados] = useState<Awaited<ReturnType<typeof carregarProdutos>> | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [linhaSel, setLinhaSel] = useState<string>("TODAS")
  const [descontoMinimo, setDescontoMinimo] = useState(15)
  const [reducaoPP, setReducaoPP] = useState(2)
  const [busca, setBusca] = useState("")
  const [limiteLinhas, setLimiteLinhas] = useState(25)

  useEffect(() => {
    let ativo = true
    carregarProdutos()
      .then((d) => { if (ativo) setDados(d) })
      .catch(() => { if (ativo) setErro("Não foi possível carregar os dados do simulador. Verifique se o arquivo de produtos está disponível.") })
    return () => { ativo = false }
  }, [])

  const regra: RegraSimulacao = {
    descontoMinimo: descontoMinimo / 100,
    reducaoPP: reducaoPP / 100,
    descontoPisoFinal: 0,
  }

  const linhas = useMemo(() => (dados ? linhasComProdutos(dados) : []), [dados])
  const resumo = useMemo(() => (dados ? resumoSelecao(dados, linhaSel) : null), [dados, linhaSel])
  const rede = useMemo(() => (dados ? simularRede(dados, regra) : null), [dados, descontoMinimo, reducaoPP])
  const linhaRes = useMemo(
    () => (dados && linhaSel !== "TODAS" ? simularLinha(dados, linhaSel, regra) : null),
    [dados, linhaSel, descontoMinimo, reducaoPP]
  )
  const distribuicao = useMemo(() => (dados ? distribuicaoDescontos(dados, linhaSel) : []), [dados, linhaSel])
  const potencial = useMemo(() => (dados ? potencialPorSegmento(dados, linhaSel, regra, 5) : []), [dados, linhaSel, descontoMinimo, reducaoPP])
  const pareto = useMemo(() => (dados ? concentracaoGanho(dados, linhaSel, regra) : null), [dados, linhaSel, descontoMinimo, reducaoPP])
  const cenarios = useMemo(
    () => (dados ? cenariosDeCorte(dados, linhaSel, descontoMinimo / 100, [0, 0.005, 0.01, 0.015, 0.02]) : []),
    [dados, linhaSel, descontoMinimo]
  )
  const melhor = useMemo(() => (dados ? melhorOportunidade(dados, linhaSel, regra) : null), [dados, linhaSel, descontoMinimo, reducaoPP])
  const tabela = useMemo(() => (dados ? tabelaProdutos(dados, linhaSel, regra) : []), [dados, linhaSel, descontoMinimo, reducaoPP])

  const tabelaFiltrada = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return tabela
    return tabela.filter((p) => p.produto.toLowerCase().includes(q) || p.linha.toLowerCase().includes(q) || p.seg.toLowerCase().includes(q))
  }, [tabela, busca])

  if (erro) {
    return <div className="card-shadow rounded-[18px] border border-red-200 bg-danger-soft p-6 text-sm font-semibold text-danger-c">{erro}</div>
  }
  if (!dados || !rede || !resumo) {
    return (
      <div className="card-shadow flex items-center justify-center gap-3 rounded-[18px] border border-border-soft bg-white p-12 text-sm text-text-muted-c">
        <span className="size-4 animate-spin rounded-full border-2 border-border-soft border-t-brand" aria-hidden />
        Carregando base de produtos...
      </div>
    )
  }

  const meta = dados.meta
  const alvo = linhaRes ?? rede
  const totalSelecao = linhaSel === "TODAS" ? meta.produtosIncluidos : (linhaRes?.produtos.length ?? 0)
  const maxCusto = Math.max(...tabelaFiltrada.slice(0, 200).map((p) => p.custoDesconto), 1)
  const maxGanho = Math.max(...tabelaFiltrada.slice(0, 200).map((p) => p.ganhoMbr), 1)
  const maxPotencial = Math.max(...potencial.map((p) => p.ganho), 1)
  const maxDistrib = Math.max(...distribuicao.map((f) => f.pct), 0.01)
  const coresFaixa = ["#1f9d63", "#e8c33f", "#ef8f45", "#e8817f"]

  return (
    <section className="pb-2">
      {/* ---------- Resumo da linha selecionada ---------- */}
      <div className="card-shadow mb-4 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-[16px] border border-border-soft bg-white px-5 py-4">
        <div>
          <label htmlFor="linha-sel" className="mb-1 block text-[10.5px] font-bold uppercase tracking-[.08em] text-text-muted-c">Linha</label>
          <select
            id="linha-sel" value={linhaSel} onChange={(e) => { setLinhaSel(e.target.value); setLimiteLinhas(25) }}
            className="h-10 min-w-[220px] rounded-[10px] border border-brand/40 bg-white px-3 text-[13.5px] font-bold text-text-main focus:border-brand"
          >
            <option value="TODAS">Rede inteira</option>
            {linhas.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="h-10 w-px bg-border-soft" aria-hidden />

        <div className="flex items-center gap-2.5">
          <Boxes className="size-5 text-text-muted-c" aria-hidden />
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[.08em] text-text-muted-c">Produtos</p>
            <p className="text-[19px] font-extrabold text-text-main">{resumo.produtos.toLocaleString("pt-BR")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <TrendingUp className="size-5 text-text-muted-c" aria-hidden />
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[.08em] text-text-muted-c">Venda (mês)</p>
            <p className="text-[19px] font-extrabold text-text-main">{R$(resumo.vd)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <BarChart3 className="size-5 text-text-muted-c" aria-hidden />
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[.08em] text-text-muted-c">MB atual</p>
            <p className="text-[19px] font-extrabold text-text-main">{pctS(resumo.mbp)}</p>
          </div>
        </div>
      </div>

      {/* ---------- Simulação + KPIs ---------- */}
      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.05fr_repeat(4,minmax(0,0.72fr))]">
        {/* Painel de simulação */}
        <div className="card-shadow rounded-[16px] border border-border-soft bg-white p-4">
          <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-[.1em] text-brand">Simulação</h3>

          <label htmlFor="slider-min" className="mb-1 flex items-baseline justify-between text-[12px] text-text-muted-c">
            <span>Aplicar em produtos com desconto ≥</span>
            <span className="text-[15px] font-extrabold text-text-main">{descontoMinimo}%</span>
          </label>
          <input
            id="slider-min" type="range" min={0} max={50} step={1} value={descontoMinimo}
            onChange={(e) => setDescontoMinimo(Number(e.target.value))}
            className="mb-4 w-full accent-[#00875A]"
          />

          <label htmlFor="slider-red" className="mb-1 flex items-baseline justify-between text-[12px] text-text-muted-c">
            <span>Reduzir desconto em</span>
            <span className="text-[15px] font-extrabold text-text-main">{reducaoPP} pp</span>
          </label>
          <input
            id="slider-red" type="range" min={0} max={15} step={0.5} value={reducaoPP}
            onChange={(e) => setReducaoPP(Number(e.target.value))}
            className="w-full accent-[#00875A]"
          />
        </div>

        {/* Card de destaque: ganho estimado */}
        <div className="card-shadow overflow-hidden rounded-[16px] bg-gradient-to-br from-[#00794f] to-[#00563a] text-white">
          <div className="p-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[.1em] text-white/80">Ganho estimado (no mês)</p>
            <p className="mt-1 text-[38px] font-extrabold leading-none tabular-nums">{R$(alvo.ganhoMbr)}</p>
            <p className="mt-2 text-[13.5px] font-semibold text-white/85">{pp(alvo.ganhoPP)} de margem</p>
          </div>
          <div className="flex items-center gap-2 bg-black/15 px-5 py-2.5 text-[12.5px] font-semibold">
            <TrendingUp className="size-4" aria-hidden />
            {alvo.produtosAfetados.toLocaleString("pt-BR")} produtos afetados
          </div>
        </div>

        {/* MB atual */}
        <div className="card-shadow rounded-[16px] border border-border-soft bg-white p-4">
          <p className="text-[10.5px] font-bold uppercase tracking-[.08em] text-text-muted-c">MB atual</p>
          <p className="mt-1 text-[26px] font-extrabold tabular-nums text-text-main">{pctS(alvo.mbpAtual)}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eef1f4]">
            <div className="h-full rounded-full bg-[#5c6b70]" style={{ width: `${Math.min(100, alvo.mbpAtual * 200)}%` }} />
          </div>
        </div>

        {/* MB simulada */}
        <div className="card-shadow rounded-[16px] border border-border-soft bg-white p-4">
          <p className="text-[10.5px] font-bold uppercase tracking-[.08em] text-text-muted-c">MB simulada</p>
          <p className="mt-1 text-[26px] font-extrabold tabular-nums text-text-main">{pctS(alvo.mbpNovo)}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eef1f4]">
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, alvo.mbpNovo * 200)}%` }} />
          </div>
          <p className="mt-2 text-[12.5px] font-extrabold text-brand-dark">{pp(alvo.ganhoPP)} ↑</p>
        </div>

        {/* Impacto na rede */}
        <div className="card-shadow rounded-[16px] border border-border-soft bg-white p-4">
          <p className="text-[10.5px] font-bold uppercase tracking-[.08em] text-text-muted-c">Impacto na rede</p>
          <p className="mt-1 text-[26px] font-extrabold tabular-nums text-text-main">{pp(rede.ganhoPP)}</p>
          <p className="mt-2 text-[17px] font-extrabold text-brand-dark">{R$(rede.ganhoMbr)}</p>
          <p className="text-[11.5px] text-text-muted-c">por mês</p>
        </div>

        {/* Produtos afetados */}
        <div className="card-shadow rounded-[16px] border border-border-soft bg-white p-4">
          <p className="text-[10.5px] font-bold uppercase tracking-[.08em] text-text-muted-c">Produtos afetados</p>
          <p className="mt-1 text-[26px] font-extrabold tabular-nums text-text-main">{alvo.produtosAfetados.toLocaleString("pt-BR")}</p>
          <p className="mt-2 text-[12px] text-text-muted-c">de {totalSelecao.toLocaleString("pt-BR")} na seleção</p>
        </div>
      </div>

      {/* ---------- Faixa de impacto na rede ---------- */}
      <div className="card-shadow mb-4 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-[16px] border border-emerald-100 bg-brand-soft px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-white" aria-hidden><Layers className="size-5" /></span>
          <div>
            <p className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-text-muted-c">Impacto estimado aplicando o mesmo corte em toda a rede</p>
            <p className="text-[20px] font-extrabold text-brand-dark">{pp(rede.ganhoPP)} <span className="text-[13px] font-semibold text-text-muted-c">de margem</span></p>
          </div>
        </div>

        <p className="text-[13px] text-text-muted-c">
          equivalente a <b className="text-[17px] text-brand-dark">{R$(rede.ganhoMbr)}</b> por mês
        </p>

        <div className="hidden h-10 w-px bg-brand/20 lg:block" aria-hidden />

        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[.06em] text-text-muted-c">Venda impactada</p>
            <p className="text-[14px] font-extrabold text-text-main">{R$(rede.vd)}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[.06em] text-text-muted-c">Desconto médio atual</p>
            <p className="text-[14px] font-extrabold text-text-main">{pctS(resumoSelecao(dados, "TODAS").descMedio)}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[.06em] text-text-muted-c">Margem média atual</p>
            <p className="text-[14px] font-extrabold text-text-main">{pctS(rede.mbpAtual)}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[.06em] text-text-muted-c">Margem média simulada</p>
            <p className="text-[14px] font-extrabold text-brand-dark">{pctS(rede.mbpNovo)}</p>
          </div>
        </div>
      </div>

      {/* ---------- Área analítica ---------- */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {/* Insights */}
        <div className="card-shadow rounded-[16px] border border-border-soft bg-white p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.1em] text-text-main">
            <Sparkles className="size-3.5 text-brand" aria-hidden /> Insights
          </h3>
          <ul className="space-y-2 text-[12.5px] text-text-main">
            <li className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
              Reduzir {reducaoPP} pp gera <b>{R$(alvo.ganhoMbr)}</b> de ganho.
            </li>
            {pareto && pareto.produtos > 0 && (
              <li className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
                Apenas <b>{pareto.produtos}</b> produtos geram 80% do ganho.
              </li>
            )}
            {potencial[0] && (
              <li className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
                Maior potencial no segmento <b>{potencial[0].grupo}</b>.
              </li>
            )}
            <li className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
              {alvo.produtosAfetados.toLocaleString("pt-BR")} de {totalSelecao.toLocaleString("pt-BR")} produtos seriam afetados.
            </li>
          </ul>

          {melhor && (
            <div className="mt-3 rounded-[12px] border border-emerald-100 bg-brand-soft p-3">
              <p className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-brand-dark">Melhor oportunidade</p>
              <p className="mt-1 truncate text-[12.5px] font-bold text-text-main" title={melhor.produto}>{melhor.produto}</p>
              <p className="text-[12px] text-text-muted-c">Potencial: <b className="text-brand-dark">{R$(melhor.ganhoMbr)}</b></p>
            </div>
          )}
        </div>

        {/* Distribuição dos descontos */}
        <div className="card-shadow rounded-[16px] border border-border-soft bg-white p-4">
          <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-[.1em] text-text-main">Distribuição dos descontos atuais</h3>
          <div className="flex h-[150px] items-end justify-around gap-2">
            {distribuicao.map((f, i) => (
              <div key={f.label} className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[12px] font-extrabold text-text-main">{pctS(f.pct, 0)}</span>
                <div
                  className="w-full rounded-t-[5px] transition-all"
                  style={{ height: `${Math.max(6, (f.pct / maxDistrib) * 110)}px`, backgroundColor: coresFaixa[i] }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-around gap-2 text-center">
            {distribuicao.map((f) => (
              <div key={f.label} className="flex-1">
                <p className="text-[10.5px] font-semibold text-text-muted-c">{f.label}</p>
                <p className="text-[11px] font-bold text-text-main">{f.produtos} produtos</p>
              </div>
            ))}
          </div>
        </div>

        {/* Potencial por segmento */}
        <div className="card-shadow rounded-[16px] border border-border-soft bg-white p-4">
          <h3 className="mb-1 text-[11px] font-extrabold uppercase tracking-[.1em] text-text-main">Potencial de ganho por segmento</h3>
          <p className="mb-3 text-[10.5px] text-text-muted-c">O export do BI não traz fabricante; agrupado por segmento.</p>
          {potencial.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-text-muted-c">Nenhum ganho com a regra atual.</p>
          ) : (
            <div className="space-y-2.5">
              {potencial.map((p) => (
                <div key={p.grupo}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="truncate text-[11.5px] font-semibold text-text-main" title={p.grupo}>{p.grupo}</span>
                    <span className="shrink-0 text-[11.5px] font-extrabold text-text-main">{R$(p.ganho)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#eef1f4]">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(p.ganho / maxPotencial) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cenários de corte */}
        <div className="card-shadow rounded-[16px] border border-border-soft bg-white p-4">
          <h3 className="mb-1 text-[11px] font-extrabold uppercase tracking-[.1em] text-text-main">Margem por cenário de corte</h3>
          <p className="mb-2 text-[10.5px] text-text-muted-c">Sem histórico por período: comparação entre cortes possíveis.</p>
          {(() => {
            const vals = cenarios.map((c) => c.mbpNovo)
            const min = Math.min(...vals, alvo.mbpAtual), max = Math.max(...vals, alvo.mbpAtual)
            const span = (max - min) || 0.01
            const W = 240, H = 110, padB = 22, padT = 10
            const plotH = H - padT - padB
            const x = (i: number) => 14 + (i / Math.max(1, cenarios.length - 1)) * (W - 28)
            const y = (v: number) => padT + plotH - ((v - min) / span) * plotH
            const pathSim = cenarios.map((c, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(c.mbpNovo)}`).join(" ")
            return (
              <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Margem simulada por cenário de corte" className="w-full">
                <line x1={14} y1={y(alvo.mbpAtual)} x2={W - 14} y2={y(alvo.mbpAtual)} stroke="#c4ccd3" strokeWidth={1.6} strokeDasharray="4 4" />
                <path d={pathSim} fill="none" stroke="var(--brand)" strokeWidth={2.4} strokeLinecap="round" />
                {cenarios.map((c, i) => {
                  const ativo = Math.abs(c.reducaoPP * 100 - reducaoPP) < 0.01
                  return (
                    <g key={c.reducaoPP}>
                      <circle cx={x(i)} cy={y(c.mbpNovo)} r={ativo ? 5 : 3} fill={ativo ? "var(--brand-dark)" : "#fff"} stroke="var(--brand)" strokeWidth={2}>
                        <title>{`Corte de ${(c.reducaoPP * 100).toLocaleString("pt-BR")} pp — MB ${pctS(c.mbpNovo)} · ${R$(c.ganhoMbr)}`}</title>
                      </circle>
                      <text x={x(i)} y={H - 6} textAnchor="middle" fontSize={8.5} fontWeight={ativo ? 800 : 500} fill="var(--text-muted-c)">
                        {(c.reducaoPP * 100).toLocaleString("pt-BR")}pp
                      </text>
                    </g>
                  )
                })}
              </svg>
            )
          })()}
          <div className="mt-1 flex items-center justify-center gap-4 text-[10.5px] text-text-muted-c">
            <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-[#c4ccd3]" aria-hidden /> MB atual</span>
            <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-brand" aria-hidden /> MB simulada</span>
          </div>
        </div>
      </div>

      {/* ---------- Tabela ---------- */}
      <div className="card-shadow overflow-hidden rounded-[16px] border border-border-soft bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
          <div>
            <h3 className="flex items-center gap-1.5 text-[14px] font-extrabold text-text-main">
              <Package className="size-4 text-brand" aria-hidden /> Onde o desconto mais custa margem
            </h3>
            <p className="text-[12px] text-text-muted-c">Ordenado por venda × desconto — quanto de margem está sendo entregue via desconto em cada produto.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-muted-c" aria-hidden />
              <input
                type="search" value={busca} onChange={(e) => { setBusca(e.target.value); setLimiteLinhas(25) }}
                placeholder="Buscar produto, linha ou segmento..." aria-label="Buscar produto"
                className="h-9 w-[240px] rounded-[9px] border border-border-soft pl-8 pr-3 text-[12.5px] focus:border-brand"
              />
            </div>
            <span className="rounded-[8px] bg-muted px-2.5 py-1.5 text-[11.5px] font-semibold text-text-muted-c">
              {tabelaFiltrada.length.toLocaleString("pt-BR")} registros
            </span>
          </div>
        </div>

        <div className="mt-3 max-h-[560px] overflow-auto">
          <table className="w-full text-[12.5px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-[#084a3b] to-[#0d6b57] text-white">
                <th scope="col" className="px-3 py-2.5 pl-5 text-left text-[10.5px] font-bold uppercase tracking-wide">Produto</th>
                <th scope="col" className="px-3 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide">Linha</th>
                <th scope="col" className="px-3 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide">Segmento</th>
                <th scope="col" className="px-3 py-2.5 text-right text-[10.5px] font-bold uppercase tracking-wide">Venda (mês)</th>
                <th scope="col" className="px-3 py-2.5 text-center text-[10.5px] font-bold uppercase tracking-wide">MB% atual</th>
                <th scope="col" className="px-3 py-2.5 text-center text-[10.5px] font-bold uppercase tracking-wide">% desconto</th>
                <th scope="col" className="px-3 py-2.5 text-right text-[10.5px] font-bold uppercase tracking-wide">Custo do desconto</th>
                <th scope="col" className="px-3 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide">Ganho potencial</th>
              </tr>
            </thead>
            <tbody>
              {tabelaFiltrada.slice(0, limiteLinhas).map((p, i) => (
                <tr key={p.produto + i} className={cn("border-t border-border-soft transition-colors hover:bg-brand-soft/60", i % 2 === 1 && "bg-muted/30")}>
                  <td className="max-w-[300px] truncate px-3 py-2 pl-5 font-semibold text-text-main" title={p.produto}>{p.produto}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-[11.5px] text-text-muted-c">{p.linha}</td>
                  <td className="max-w-[160px] truncate px-3 py-2 text-[11.5px] text-text-muted-c" title={p.seg}>{p.seg}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{R$(p.vd)}</td>
                  <td className={cn("whitespace-nowrap px-3 py-2 text-center font-bold tabular-nums", corMargem(p.mbp))}>{pctS(p.mbp)}</td>
                  <td className={cn("whitespace-nowrap px-3 py-2 text-center font-bold tabular-nums", corDesconto(p.desc))}>{pctS(p.desc)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-bold tabular-nums" style={corCusto(p.custoDesconto, maxCusto)}>{R$(p.custoDesconto)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-[70px] shrink-0 overflow-hidden rounded-full bg-[#eef1f4]">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (p.ganhoMbr / maxGanho) * 100)}%` }} />
                      </div>
                      <span className={cn("tabular-nums", p.ganhoMbr > 0 ? "font-bold text-brand-dark" : "text-text-muted-c")}>{p.ganhoMbr > 0 ? R$(p.ganhoMbr) : "—"}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {tabelaFiltrada.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-[13px] text-text-muted-c">Nenhum produto encontrado para "{busca}".</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {limiteLinhas < tabelaFiltrada.length && (
          <div className="border-t border-border-soft px-5 py-3 text-center">
            <button
              onClick={() => setLimiteLinhas((n) => n + 50)}
              className="rounded-[9px] border border-brand px-4 py-2 text-[12.5px] font-bold text-brand hover:bg-brand-soft"
            >
              Mostrar mais 50 ({(tabelaFiltrada.length - limiteLinhas).toLocaleString("pt-BR")} restantes)
            </button>
          </div>
        )}

        <div className="flex items-start gap-1.5 border-t border-border-soft bg-muted/20 px-4 py-3 text-[11px] text-text-muted-c">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <p>
            Cenário de volume constante: a venda em R$ é mantida, então cada ponto percentual a menos de desconto vira aproximadamente um ponto a mais de margem.
            "Custo do desconto" = venda × % desconto. Base de {meta.mes}, {meta.produtosIncluidos.toLocaleString("pt-BR")} produtos ({pctS(meta.coberturaVenda)} da venda);
            itens com venda abaixo de {R$(meta.corteMinimoVenda)} no mês ficam fora.
            {!!meta.registrosDescartados && <> {meta.registrosDescartados} registro(s) do arquivo foram descartados por percentuais inconsistentes (divisão por zero no BI).</>}
          </p>
        </div>
      </div>
    </section>
  )
}
