import { useMemo } from "react"
import { Info, TrendingUp } from "lucide-react"
import { evolucaoMixPorEscopo, type Fonte, type PontoMixEvolucao } from "@/lib/mercado"
import { pctS } from "@/lib/format"

const GRUPOS: { key: "marca" | "generico" | "otc" | "perfumaria"; label: string; descricao: string; cor: string }[] = [
  { key: "marca", label: "Marca", descricao: "Referência e similares de marca", cor: "#a31545" },
  { key: "generico", label: "Genérico", descricao: "Medicamentos genéricos", cor: "#4C9A6B" },
  { key: "otc", label: "OTC", descricao: "Medicamentos isentos de prescrição", cor: "#7FA6C9" },
  { key: "perfumaria", label: "Perfumaria", descricao: "Higiene, beleza e cuidados pessoais", cor: "#0d3b25" },
]

function fmtBi(v: number): string {
  return (v / 1_000_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " Bi"
}
function fmtMi(v: number): string {
  return (v / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " Mi"
}
function fmtValor(v: number): string {
  return v >= 1_000_000_000 ? fmtBi(v) : fmtMi(v)
}

type MiniChartProps = {
  titulo: string
  subtitulo: string
  pontos: PontoMixEvolucao[]
  mostrarValores: boolean
}

function MiniMixChart({ titulo, subtitulo, pontos, mostrarValores }: MiniChartProps) {
  const W = 620, H = 300, padL = 24, padR = 24, padT = 66, padB = 36
  const plotW = W - padL - padR, plotH = H - padT - padB
  const n = pontos.length
  const slot = plotW / n
  const barW = Math.min(52, slot * 0.5)
  const maxTotal = Math.max(...pontos.map((p) => p.total)) * 1.03
  const alturaBarra = (total: number) => (total / maxTotal) * plotH
  const baseY = padT + plotH

  return (
    <div className="min-w-0 rounded-[14px] border border-border-soft bg-[--bg-page] p-3">
      <div className="mb-1 px-1">
        <h3 className="text-[12.5px] font-extrabold text-text-main">{titulo}</h3>
        <p className="text-[10.5px] text-text-muted-c">{subtitulo}</p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Evolução do mix de ${titulo}`} className="w-full max-h-[295px]">
        {pontos.map((p, i) => {
          const cx = padL + i * slot + slot / 2
          const x = cx - barW / 2
          const alturaTotal = alturaBarra(p.total)
          const topoBarra = baseY - alturaTotal
          let yCursor = baseY
          const blocos = GRUPOS.map((g) => {
            const altura = p[g.key] * alturaTotal
            const y = yCursor - altura
            yCursor -= altura
            return { ...g, y, altura, valor: p[g.key] }
          })
          const anterior = i > 0 ? pontos[i - 1] : null
          const cresc = anterior && anterior.total > 0 ? p.total / anterior.total - 1 : null
          return (
            <g key={p.mesFim}>
              {cresc !== null && (
                <g>
                  <rect x={cx - 23} y={topoBarra - 28} width={46} height={18} rx={9} fill="white" stroke="var(--border-soft)" />
                  <text x={cx} y={topoBarra - 15.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="var(--text-main)">
                    {cresc >= 0 ? "+" : ""}{pctS(cresc, 1)}
                  </text>
                </g>
              )}
              {mostrarValores && <text x={cx} y={topoBarra - 6} textAnchor="middle" fontSize={10.2} fontWeight={800} fill="var(--text-main)">{fmtValor(p.total)}</text>}
              {blocos.map((b) => (
                <g key={b.key}>
                  <rect x={x} y={b.y} width={barW} height={Math.max(0, b.altura)} fill={b.cor} />
                  {b.altura > 15 && (
                    <text x={cx} y={b.y + b.altura / 2 + 3.5} textAnchor="middle" fontSize={8.4} fontWeight={700} fill="#fff">
                      {pctS(b.valor, 1)}
                    </text>
                  )}
                </g>
              ))}
              <text x={cx} y={H - 10} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--text-main)">{p.mesFim}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function EvolucaoComparativaChart({ fonte }: { fonte: Fonte }) {
  const unipreco = useMemo(() => evolucaoMixPorEscopo("UNIPRECO", 5, fonte), [fonte])
  const mercado = useMemo(() => evolucaoMixPorEscopo("BRICKS", 5, fonte), [fonte])
  if (unipreco.length < 2 || mercado.length < 2) return null

  const ultimoUni = unipreco[unipreco.length - 1]
  const penultimoUni = unipreco[unipreco.length - 2]
  const ultimoMerc = mercado[mercado.length - 1]
  const crescimentoUni = penultimoUni.total > 0 ? ultimoUni.total / penultimoUni.total - 1 : 0
  const gaps = GRUPOS.map((g) => ({ ...g, gap: ultimoUni[g.key] - ultimoMerc[g.key] }))

  return (
    <div className="card-shadow mb-6 rounded-[18px] border border-border-soft bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-brand-dark">Evolução R$ Consumidor — Unipreço vs Mercado</h2>
          <p className="mt-0.5 max-w-4xl text-[12px] leading-relaxed text-text-muted-c">
            Comparação trimestral do MAT. A altura mostra o faturamento acumulado em 12 meses e as cores representam a composição do mix.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-[12px] bg-brand-soft px-3 py-2">
          <div className="grid size-8 place-items-center rounded-[9px] bg-white text-brand shadow-sm"><TrendingUp className="size-4" aria-hidden /></div>
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wide text-text-muted-c">Último MAT Unipreço</div>
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-extrabold text-text-main">{fmtValor(ultimoUni.total)}</span>
              <span className={crescimentoUni >= 0 ? "text-[11px] font-bold text-brand" : "text-[11px] font-bold text-danger-c"}>{crescimentoUni >= 0 ? "+" : ""}{pctS(crescimentoUni, 1)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <MiniMixChart titulo="Unipreço" subtitulo="Faturamento e composição do mix" pontos={unipreco} mostrarValores />
        <MiniMixChart titulo="Mercado IQVIA (Bricks)" subtitulo="Mesmos períodos e mesma leitura de composição" pontos={mercado} mostrarValores={false} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[12px] border border-border-soft bg-[--bg-page] px-3 py-2.5">
          <div className="flex items-center gap-2 text-[11px] font-bold text-text-main"><Info className="size-4 text-brand" aria-hidden /> Legenda</div>
          {GRUPOS.map((g) => <div key={g.key} className="flex items-center gap-1.5 text-[11px] text-text-muted-c"><span className="size-2.5 rounded-[3px]" style={{ backgroundColor: g.cor }} /><strong className="text-text-main">{g.label}</strong><span className="hidden 2xl:inline">— {g.descricao}</span></div>)}
          <div className="ml-auto text-[10.5px] text-text-muted-c"><strong className="text-text-main">MAT:</strong> soma dos últimos 12 meses.</div>
        </div>

        <div className="rounded-[12px] border border-border-soft bg-white px-3 py-2.5">
          <div className="mb-2 text-[11px] font-extrabold text-text-main">Diferença de mix — {ultimoUni.mesFim}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {gaps.map((g) => (
              <div key={g.key} className="flex items-center justify-between gap-2 text-[10.8px]">
                <span className="flex items-center gap-1.5 text-text-muted-c"><span className="size-2.5 rounded-[3px]" style={{ backgroundColor: g.cor }} />{g.label}</span>
                <strong className={g.gap >= 0 ? "text-brand" : "text-danger-c"}>{g.gap >= 0 ? "+" : ""}{(g.gap * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pp</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
