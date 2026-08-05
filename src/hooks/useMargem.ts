import { useMemo, useState, useCallback } from "react"
import * as XLSX from "xlsx"
import seed from "@/data/seed.json"
import exclusoesSeed from "@/data/exclusoes.json"
import { calc, type MargemRow } from "@/lib/calc"
import { mesKey } from "@/lib/format"
import { aplicarExclusoes, type ExclusaoProduto } from "@/lib/exclusoes"

const LS_EXCLUSOES = "exclusoes-produto-v1"

function cargaInicialExclusoes(): ExclusaoProduto[] {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_EXCLUSOES) || "null") as ExclusaoProduto[] | null
    if (saved) return saved
  } catch { /* cai para a semente */ }
  return exclusoesSeed as ExclusaoProduto[]
}

export function useMargem() {
  const [rowsRaw, setRowsRaw] = useState<MargemRow[]>(seed as MargemRow[])
  const [fileLabel, setFileLabel] = useState("dados-semente (embutido)")
  const [error, setError] = useState<string | null>(null)
  const [exclusoes, setExclusoes] = useState<ExclusaoProduto[]>(cargaInicialExclusoes)

  const rows = useMemo(() => aplicarExclusoes(rowsRaw, exclusoes), [rowsRaw, exclusoes])

  const addExclusao = useCallback((ex: ExclusaoProduto) => {
    setExclusoes((prev) => {
      const next = [...prev.filter((e) => e.id !== ex.id), ex]
      localStorage.setItem(LS_EXCLUSOES, JSON.stringify(next))
      return next
    })
  }, [])

  const removeExclusao = useCallback((id: string) => {
    setExclusoes((prev) => {
      const next = prev.filter((e) => e.id !== id)
      localStorage.setItem(LS_EXCLUSOES, JSON.stringify(next))
      return next
    })
  }, [])

  const meses = useMemo(
    () => Array.from(new Set(rows.map((r) => r.mes))).sort((a, b) => mesKey(a) - mesKey(b)),
    [rows]
  )

  const MES_BASE_PADRAO = "Mai/2026"
  const [mBase, setMBase] = useState(() => (meses.includes(MES_BASE_PADRAO) ? MES_BASE_PADRAO : meses[0] || ""))
  const [mAt, setMAt] = useState(() => meses[meses.length - 1] || "")
  // Padrão: dados sempre refletem até ontem — dia decorrido = dia de ontem,
  // total = quantidade de dias do mês de ontem. Recalculado a cada carregamento da página.
  const ontem = new Date()
  ontem.setDate(ontem.getDate() - 1)
  const [diasDec, setDiasDec] = useState(() => ontem.getDate())
  const [diasTot, setDiasTot] = useState(() => new Date(ontem.getFullYear(), ontem.getMonth() + 1, 0).getDate())
  const [meta, setMeta] = useState(30.5)

  const effMBase = meses.includes(mBase) ? mBase : meses.includes(MES_BASE_PADRAO) ? MES_BASE_PADRAO : meses[0] || ""
  const effMAt = meses.includes(mAt) ? mAt : meses[meses.length - 1] || ""

  const result = useMemo(() => {
    if (!rows.length || !effMBase || !effMAt) return null
    return calc(rows, effMBase, effMAt, diasDec, diasTot)
  }, [rows, effMBase, effMAt, diasDec, diasTot])

  const loadFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const wb = XLSX.read(data, { type: "array" })
        const ws = wb.Sheets["Tela"] || wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null })
        const parsed: MargemRow[] = raw
          .filter((r) => r["Ano/Mes"] && r["Linha"] && r["Linha"] !== "Total" && r["Segmento"])
          .map((r) => ({
            linha: String(r["Linha"]).trim(),
            seg: String(r["Segmento"]).trim(),
            mes: String(r["Ano/Mes"]).trim(),
            vd: Number(r["VD Líquida"]) || 0,
            mbp: Number(r["MB %"]) || 0,
            mbr: Number(r["MB R$"]) || 0,
            desc: Number(r["% Desc"]) || 0,
          }))
        if (!parsed.length) {
          setError("Não encontrei linhas válidas nesse arquivo.")
          return
        }
        setRowsRaw(parsed)
        setFileLabel(file.name)
        setError(null)
        const newMeses = Array.from(new Set(parsed.map((r) => r.mes))).sort((a, b) => mesKey(a) - mesKey(b))
        setMBase(newMeses[0] || "")
        setMAt(newMeses[newMeses.length - 1] || "")
      } catch (err) {
        setError("Erro ao ler o arquivo: " + (err instanceof Error ? err.message : String(err)))
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  return {
    rows, rowsRaw, fileLabel, error, meses,
    mBase: effMBase, mAt: effMAt, diasDec, diasTot, meta,
    setMBase, setMAt, setDiasDec, setDiasTot, setMeta,
    result, loadFile,
    exclusoes, addExclusao, removeExclusao,
  }
}
