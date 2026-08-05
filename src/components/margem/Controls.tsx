import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

export function Controls({
  meses, mBase, mAt, diasDec, diasTot, meta,
  onMBase, onMAt, onDiasDec, onDiasTot, onMeta,
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
}) {
  return (
    <Card className="mb-4 flex-row flex-wrap items-end gap-4 px-5 py-4">
      <Field label="Mês base">
        <Select value={mBase} onValueChange={onMBase}>
          <SelectTrigger className="min-w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>{meses.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Mês atual (parcial)">
        <Select value={mAt} onValueChange={onMAt}>
          <SelectTrigger className="min-w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>{meses.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Dias decorridos até hoje">
        <input type="number" min={1} max={31} value={diasDec} onChange={(e) => onDiasDec(Number(e.target.value) || 1)}
          className="h-9 w-[110px] rounded-md border px-2.5 text-sm" />
      </Field>
      <Field label="Total de dias do mês">
        <input type="number" min={1} max={31} value={diasTot} onChange={(e) => onDiasTot(Number(e.target.value) || 1)}
          className="h-9 w-[110px] rounded-md border px-2.5 text-sm" />
      </Field>
      <Field label="Meta MB% total">
        <input type="number" step={0.1} min={0} max={100} value={meta} onChange={(e) => onMeta(Number(e.target.value) || 0)}
          className="h-9 w-[110px] rounded-md border px-2.5 text-sm" />
      </Field>
    </Card>
  )
}
