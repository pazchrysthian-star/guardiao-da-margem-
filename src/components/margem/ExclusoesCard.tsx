import { useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { R$ } from "@/lib/format"
import { cn } from "@/lib/utils"
import { exclusoesSemEfeito, type ExclusaoProduto } from "@/lib/exclusoes"
import type { MargemRow } from "@/lib/calc"
import { Trash2, PlusCircle, AlertTriangle, PackageMinus } from "lucide-react"

const inputSm = "h-9 w-full rounded-[8px] border border-border-soft bg-white px-2.5 text-xs font-semibold text-text-main outline-none focus:border-brand"

export function ExclusoesCard({
  exclusoes, rowsRaw, meses, onAdd, onRemove,
}: {
  exclusoes: ExclusaoProduto[]
  rowsRaw: MargemRow[]
  meses: string[]
  onAdd: (ex: ExclusaoProduto) => void
  onRemove: (id: string) => void
}) {
  const [aberto, setAberto] = useState(false)
  const linhas = useMemo(() => Array.from(new Set(rowsRaw.map((r) => r.linha))).sort(), [rowsRaw])
  const segs = useMemo(() => Array.from(new Set(rowsRaw.map((r) => r.seg))).sort(), [rowsRaw])

  const [form, setForm] = useState({ produto: "", linha: linhas[0] || "", seg: segs[0] || "", mes: meses[meses.length - 1] || "", vd: "", mbr: "", motivo: "" })

  const semEfeito = useMemo(() => exclusoesSemEfeito(rowsRaw, exclusoes), [rowsRaw, exclusoes])

  const submeter = () => {
    if (!form.produto.trim() || !form.linha || !form.seg || !form.mes || !form.vd) return
    onAdd({
      id: `${form.linha}-${form.seg}-${form.mes}-${Date.now()}`,
      produto: form.produto.trim(), linha: form.linha, seg: form.seg, mes: form.mes,
      vd: Number(form.vd) || 0, mbr: Number(form.mbr) || 0,
      motivo: form.motivo.trim() || undefined,
    })
    setForm((f) => ({ ...f, produto: "", vd: "", mbr: "", motivo: "" }))
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><PackageMinus className="size-4 text-brand" aria-hidden /> Produtos excluídos da avaliação</CardTitle>
            <CardDescription>
              O xlsx é agregado por Linha+Segmento — não dá pra filtrar um produto individual depois de importado.
              Cadastre aqui a venda e margem daquele produto no mês para subtrair do combo Linha+Segmento correspondente.
            </CardDescription>
          </div>
          <button onClick={() => setAberto((v) => !v)} className="flex shrink-0 items-center gap-1.5 rounded-[10px] border border-brand px-3 py-2 text-xs font-semibold text-brand hover:bg-brand-soft">
            <PlusCircle className="size-3.5" aria-hidden /> {aberto ? "Fechar" : "Adicionar exclusão"}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {aberto && (
          <div className="mb-4 grid grid-cols-2 gap-2.5 rounded-[10px] border border-border-soft bg-[--bg-page] p-3.5 md:grid-cols-4">
            <div className="col-span-2 md:col-span-4">
              <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-text-muted-c">Produto (rótulo livre)</label>
              <input value={form.produto} onChange={(e) => setForm((f) => ({ ...f, produto: e.target.value }))} placeholder="Ex: Figurinha Panini Copa 2026" className={inputSm} />
            </div>
            <div>
              <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-text-muted-c">Linha</label>
              <select value={form.linha} onChange={(e) => setForm((f) => ({ ...f, linha: e.target.value }))} className={inputSm}>
                {linhas.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-text-muted-c">Segmento</label>
              <select value={form.seg} onChange={(e) => setForm((f) => ({ ...f, seg: e.target.value }))} className={inputSm}>
                {segs.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-text-muted-c">Mês</label>
              <select value={form.mes} onChange={(e) => setForm((f) => ({ ...f, mes: e.target.value }))} className={inputSm}>
                {meses.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-text-muted-c">Venda R$ a subtrair</label>
              <input type="number" value={form.vd} onChange={(e) => setForm((f) => ({ ...f, vd: e.target.value }))} placeholder="0,00" className={inputSm} />
            </div>
            <div>
              <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-text-muted-c">Margem R$ a subtrair</label>
              <input type="number" value={form.mbr} onChange={(e) => setForm((f) => ({ ...f, mbr: e.target.value }))} placeholder="0,00" className={inputSm} />
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-text-muted-c">Motivo (opcional)</label>
              <input value={form.motivo} onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))} placeholder="Ex: item sazonal, margem volátil" className={inputSm} />
            </div>
            <div className="col-span-2 flex items-end md:col-span-4">
              <button onClick={submeter} className="h-9 rounded-[8px] bg-brand px-4 text-xs font-semibold text-white hover:bg-brand-dark">Salvar exclusão</button>
            </div>
          </div>
        )}

        {exclusoes.length === 0 ? (
          <p className="py-3 text-center text-xs text-text-muted-c">Nenhuma exclusão cadastrada.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {exclusoes.map((ex) => {
              const semEfeitoInfo = semEfeito.find((s) => s.id === ex.id)
              const semEfeitoAqui = !!semEfeitoInfo
              const msgSemEfeito =
                semEfeitoInfo?.motivoSemEfeito === "venda-maior-que-base-atual"
                  ? " — sem efeito: a base foi revisada e a venda desse combo hoje é menor que a da exclusão. Recadastre com os valores atuais do produto."
                  : " — sem efeito: não achei esse combo Linha+Segmento+Mês na base atual"
              return (
                <div key={ex.id} className={cn("flex items-center justify-between gap-3 rounded-[10px] border px-3.5 py-2.5", semEfeitoAqui ? "border-warning-c/40 bg-warning-soft" : "border-border-soft bg-white")}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-text-main">
                      {semEfeitoAqui && <AlertTriangle className="size-3.5 shrink-0 text-warning-c" aria-hidden />}
                      {ex.produto}
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10.5px] font-semibold text-brand-dark">{ex.mes}</span>
                    </div>
                    <div className="mt-0.5 truncate text-[11.5px] text-text-muted-c">
                      {ex.linha} · {ex.seg} · −{R$(ex.vd)} venda, −{R$(ex.mbr)} margem
                      {semEfeitoAqui && msgSemEfeito}
                    </div>
                    {ex.motivo && <div className="mt-0.5 text-[11px] italic text-text-muted-c">{ex.motivo}</div>}
                  </div>
                  <button onClick={() => onRemove(ex.id)} aria-label={`Remover exclusão de ${ex.produto}`} className="shrink-0 rounded-md p-1.5 text-text-muted-c hover:bg-danger-soft hover:text-danger-c">
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
