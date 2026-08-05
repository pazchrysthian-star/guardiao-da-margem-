import { Target } from "lucide-react"

export function DermocosmeticosFoco() {
  return (
    <div className="rounded-[16px] border-l-4 border-purple-c bg-purple-soft/40 px-4 py-4">
      <div className="flex gap-4">
        <div className="shrink-0">
          <Target className="size-6 text-purple-c" />
        </div>
        <div>
          <p className="text-sm font-semibold text-purple-c">
            <span className="font-bold">Foco:</span> elevar o share para 16%, priorizando marcas com maior gap financeiro e participação abaixo da meta.
          </p>
        </div>
      </div>
    </div>
  )
}
