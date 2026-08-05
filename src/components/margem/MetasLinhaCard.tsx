import { useState, useMemo } from "react"
import type { SimResult, LinhaMeta } from "@/lib/simulador"
import { R$, pctS, pp } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Info, Pencil, ChevronUp, Download } from "lucide-react"

function MiniBar({ value, max, tone }: { value: number; max: number; tone: "blue" | "green" }) {
  const w = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const fg = tone === "blue" ? "bg-blue-brand" : "bg-brand"
  const bg = tone === "blue" ? "bg-blue-soft" : "bg-brand-soft"
  return (
    <span className={cn("relative inline-block h-2 w-20 overflow-hidden rounded-full align-middle", bg)} aria-hidden>
      <span className={cn("absolute inset-y-0 left-0 rounded-full", fg)} style={{ width: `${w}%` }} />
    </span>
  )
}

export function MetasLinhaCard({
  s, metas, onChange, onRestaurar, onZerarSellout, onExportar, dataPublicacao,
}: {
  s: SimResult
  metas: LinhaMeta[]
  onChange: (linha: string, field: "metaParticipacao" | "metaMB" | "sellout", value: number) => void
  onRestaurar: () => void
  onZerarSellout: () => void
  onExportar: () => void
  dataPublicacao: string | null
}) {
  const [editando, setEditando] = useState(false)
  const linhas = useMemo(() => s.linhas.slice().sort((a, b) => b.participacaoReal - a.participacaoReal), [s.linhas])
  const maxPart = Math.max(...linhas.map((l) => l.metaParticipacao), 0.0001)
  const maxSellout = Math.max(...linhas.map((l) => l.sellout), 1)
  const metasOrd = metas.slice().sort((a, b) => a.linha.localeCompare(b.linha))

  return (
    <section aria-label="Metas por linha" className="card-shadow flex flex-col rounded-[18px] border border-border-soft bg-white p-5">
      <div className="mb-1 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-text-main">
            Metas por linha
            <Info className="size-3.5 text-text-muted-c" aria-hidden />
          </h3>
          <p className="mt-0.5 text-[12.5px] text-text-muted-c">Participação %, MB% alvo e sellout do mês</p>
        </div>
        <button
          onClick={() => setEditando((v) => !v)}
          className="flex items-center gap-1.5 rounded-[10px] border border-brand px-3.5 py-2 text-xs font-semibold text-brand hover:bg-brand-soft"
        >
          {editando ? <><ChevronUp className="size-3.5" aria-hidden /> Concluir edição</> : <><Pencil className="size-3.5" aria-hidden /> Ver / editar metas</>}
        </button>
      </div>

      {!editando ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-text-muted-c">
                <th className="py-2 pr-3">Linha</th>
                <th className="py-2 pr-3">Participação %</th>
                <th className="py-2 pr-3">MB% Alvo</th>
                <th className="py-2 pr-3">MB% Proj. (pp)</th>
                <th className="py-2">Sellout</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => {
                const gap = l.mbPercRecomp - l.metaMB
                const gapCls = gap > 0.0005 ? "text-brand" : gap < -0.0005 ? "text-danger-c" : "text-text-muted-c"
                return (
                  <tr key={l.linha} className="border-t border-border-soft">
                    <td className="py-2.5 pr-3 font-semibold text-text-main">{l.linha}</td>
                    <td className="py-2.5 pr-3">
                      <span className="mr-2 tabular-nums">{pctS(l.metaParticipacao)}</span>
                      <MiniBar value={l.metaParticipacao} max={maxPart} tone="blue" />
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums">{pctS(l.metaMB)}</td>
                    <td className={cn("py-2.5 pr-3 font-bold tabular-nums", gapCls)}>{pp(gap)}</td>
                    <td className="py-2.5">
                      <span className="mr-2 tabular-nums">{l.sellout > 0 ? R$(l.sellout) : "—"}</span>
                      {l.sellout > 0 && <MiniBar value={l.sellout} max={maxSellout} tone="green" />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-[12px] text-text-muted-c">
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-[4px] bg-brand" aria-hidden /> Acima da meta</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-[4px] bg-danger-c" aria-hidden /> Abaixo da meta</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-[4px] bg-[#C9CFDA]" aria-hidden /> Neutro</span>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-text-muted-c">
                  <th className="py-2 pr-3">Linha</th>
                  <th className="py-2 pr-3">Participação %</th>
                  <th className="py-2 pr-3">MB% Alvo</th>
                  <th className="py-2">Sellout do mês (R$)</th>
                </tr>
              </thead>
              <tbody>
                {metasOrd.map((m) => (
                  <tr key={m.linha} className="border-t border-border-soft">
                    <td className="py-2 pr-3 font-semibold text-text-main">{m.linha}</td>
                    <td className="py-2 pr-3">
                      <input
                        type="number" step={0.1} min={0} max={100}
                        value={+(m.metaParticipacao * 100).toFixed(2)}
                        onChange={(e) => onChange(m.linha, "metaParticipacao", (Number(e.target.value) || 0) / 100)}
                        aria-label={`Meta de participação de ${m.linha}`}
                        className="h-9 w-20 rounded-[10px] border border-border-soft px-2 text-sm focus:border-brand"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number" step={0.1} min={0} max={100}
                        value={+(m.metaMB * 100).toFixed(2)}
                        onChange={(e) => onChange(m.linha, "metaMB", (Number(e.target.value) || 0) / 100)}
                        aria-label={`Meta de MB% de ${m.linha}`}
                        className="h-9 w-20 rounded-[10px] border border-border-soft px-2 text-sm focus:border-brand"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number" step={100} min={0}
                        value={m.sellout || ""}
                        placeholder="0"
                        onChange={(e) => onChange(m.linha, "sellout", Number(e.target.value) || 0)}
                        aria-label={`Sellout do mês de ${m.linha} em reais`}
                        className="h-9 w-28 rounded-[10px] border border-border-soft px-2 text-sm focus:border-brand"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button onClick={onRestaurar} className="rounded-[10px] border border-border-soft px-3.5 py-2 text-xs font-semibold text-text-muted-c hover:border-brand hover:text-brand">
              Restaurar valores publicados
            </button>
            <button onClick={onZerarSellout} className="rounded-[10px] border border-orange-500 px-3.5 py-2 text-xs font-semibold text-orange-600 hover:border-orange-700 hover:text-orange-700">
              Zerar Sellout (novo mês)
            </button>
            <button onClick={onExportar} className="flex items-center gap-1.5 rounded-[10px] border border-brand bg-brand-soft px-3.5 py-2 text-xs font-semibold text-brand-dark hover:bg-brand/15">
              <Download className="size-3.5" aria-hidden /> Exportar para publicar
            </button>
            <p className="text-[11px] text-text-muted-c">
              Sellout: valor cheio do mês que soma direto na margem da linha (margem recomposta).
              <br />
              "Exportar para publicar": gera um arquivo pra colocar em <code className="rounded bg-muted px-1">dados/</code> — ao rodar o atualizar, essas metas passam a ser o padrão pra qualquer computador que abrir o link.
              {dataPublicacao && <> Última publicação: {new Date(dataPublicacao).toLocaleString("pt-BR")}.</>}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
