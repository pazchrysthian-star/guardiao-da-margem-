import { useRef, useState } from "react"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"

export function UploadZone({
  fileLabel, error, onFile,
}: {
  fileLabel: string
  error: string | null
  onFile: (f: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  return (
    <div className="mb-4">
      <div
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          drag ? "border-teal-600 bg-teal-50" : "border-border bg-card"
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault(); setDrag(false)
          if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0])
        }}
      >
        <div className="flex items-center justify-center gap-2 font-semibold text-teal-700">
          <Upload className="size-4" /> Clique ou arraste um novo .xlsx para atualizar
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Formato esperado: colunas Linha, Segmento, Ano/Mes, VD Líquida, VD UN, MB %, MB R$, % Desc (aba "Tela" ou primeira aba)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]) }}
        />
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Arquivo: <span className="font-semibold text-teal-700">{fileLabel}</span>
      </div>
      {error && <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
    </div>
  )
}
