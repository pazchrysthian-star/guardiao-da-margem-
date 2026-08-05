import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { R$ } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Calendar, CalendarDays, Target, Goal, Check, Pencil, Sparkles } from "lucide-react"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-text-muted-c">{label}</label>
      {children}
    </div>
  )
}

const inputBase =
  "flex h-[52px] w-full items-center gap-2 rounded-[10px] border border-border-soft bg-white px-3.5 text-sm font-semibold text-text-main focus-within:border-brand"

export function FiltersCard({
  meses, mBase, mAt, diasDec, diasTot, meta,
  onMBase, onMAt, onDiasDec, onDiasTot, onMeta,
  metaVendaTotal, onMetaVendaTotal, onCalcularMetaAutomatica,
}: {
  meses: string[]
  mBase: string
  mAt: string
  diasDec: number
  diasTot: number
  meta: number
  onMBase: (v: string) => void
  onMAt: (v: string) => void
  onDiasDec: (v: number) => void
  onDiasTot: (v: number) => void
  onMeta: (v: number) => void
  metaVendaTotal: number
  onMetaVendaTotal: (v: number) => void
  onCalcularMetaAutomatica: () => void
}) {
  const [editandoVenda, setEditandoVenda] = useState(false)

  return (
    <section aria-label="Filtros e metas" className="card-shadow mb-6 rounded-[18px] border border-border-soft bg-white px-4 py-5 sm:px-6">
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-[repeat(5,minmax(0,1fr))_1.6fr_auto] xl:items-end">
        <Field label="Mês base">
          <Select value={mBase} onValueChange={onMBase}>
            <SelectTrigger className={cn(inputBase, "justify-between")}>
              <span className="flex items-center gap-2"><Calendar className="size-4 text-text-muted-c" aria-hidden /><SelectValue /></span>
            </SelectTrigger>
            <SelectContent>{meses.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </Field>

        <Field label="Mês atual (parcial)">
          <Select value={mAt} onValueChange={onMAt}>
            <SelectTrigger className={cn(inputBase, "justify-between")}>
              <span className="flex items-center gap-2"><Calendar className="size-4 text-text-muted-c" aria-hidden /><SelectValue /></span>
            </SelectTrigger>
            <SelectContent>{meses.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </Field>

        <Field label="Dias decorridos até hoje">
          <div className={cn(inputBase, "border-brand")}>
            <CalendarDays className="size-4 shrink-0 text-brand" aria-hidden />
            <input
              type="number" min={1} max={31} value={diasDec}
              onChange={(e) => onDiasDec(Number(e.target.value) || 1)}
              aria-label="Dias decorridos até hoje"
              className="w-full bg-transparent font-semibold outline-none"
            />
            <span className="text-xs text-text-muted-c">dias</span>
          </div>
        </Field>

        <Field label="Total de dias do mês">
          <div className={inputBase}>
            <CalendarDays className="size-4 shrink-0 text-text-muted-c" aria-hidden />
            <input
              type="number" min={1} max={31} value={diasTot}
              onChange={(e) => onDiasTot(Number(e.target.value) || 1)}
              aria-label="Total de dias do mês"
              className="w-full bg-transparent font-semibold outline-none"
            />
            <span className="text-xs text-text-muted-c">dias</span>
          </div>
        </Field>

        <Field label="Meta MB% total">
          <div className={cn(inputBase, "border-brand text-brand")}>
            <Target className="size-4 shrink-0 text-brand" aria-hidden />
            <input
              type="number" step={0.1} min={0} max={100} value={meta}
              onChange={(e) => onMeta(Number(e.target.value) || 0)}
              aria-label="Meta MB% total"
              className="w-full bg-transparent font-bold text-brand outline-none"
            />
            <span className="text-xs font-semibold text-brand">%</span>
          </div>
        </Field>

        <Field label="Meta geral de venda do mês">
          {editandoVenda ? (
            <div className={cn(inputBase, "border-brand")}>
              <Goal className="size-4 shrink-0 text-brand" aria-hidden />
              <input
                type="number" min={0} autoFocus value={metaVendaTotal || ""}
                onChange={(e) => onMetaVendaTotal(Number(e.target.value) || 0)}
                onKeyDown={(e) => { if (e.key === "Enter") setEditandoVenda(false) }}
                aria-label="Meta geral de venda do mês em reais"
                className="w-full bg-transparent font-bold outline-none"
              />
              <button onClick={() => setEditandoVenda(false)} aria-label="Confirmar meta de venda" className="rounded-md p-1 text-brand hover:bg-brand-soft">
                <Check className="size-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditandoVenda(true)}
              className={cn(inputBase, "justify-start gap-2.5 text-left hover:border-brand")}
              aria-label={`Meta geral de venda do mês: ${R$(metaVendaTotal)}. Clique para editar`}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><Goal className="size-4" aria-hidden /></span>
              <span className="text-[19px] font-bold text-brand">{R$(metaVendaTotal)}</span>
              <Pencil className="ml-auto size-3.5 shrink-0 text-text-muted-c" aria-hidden />
            </button>
          )}
        </Field>

        <div className="col-span-2 md:col-span-1">
          <button
            onClick={onCalcularMetaAutomatica}
            className="flex h-[52px] w-full items-center gap-2.5 rounded-[10px] border border-border-soft bg-white px-4 text-left text-[13px] font-semibold leading-tight text-text-main hover:border-brand hover:bg-brand-soft/40 xl:w-auto"
          >
            <Sparkles className="size-4 shrink-0 text-blue-brand" aria-hidden />
            <span>Calcular meta MB%<br />{meta.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% automaticamente</span>
          </button>
        </div>
      </div>
    </section>
  )
}
