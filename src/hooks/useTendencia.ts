import { useMemo, useState, useEffect, useCallback } from "react"
import type { MargemRow } from "@/lib/calc"
import { calcTendencia, diasFechadoPadrao, type DiasMes } from "@/lib/tendencia"
import { mesKey } from "@/lib/format"

const LS_MESES = "tendencia-meses-v1"
const LS_DIAS = "tendencia-dias-v1"
const MAX_MESES_PADRAO = 6

function ordenarMeses(meses: string[]): string[] {
  return [...meses].sort((a, b) => mesKey(a) - mesKey(b))
}

export function useTendencia(rows: MargemRow[], meses: string[]) {
  const mesesOrdenados = useMemo(() => ordenarMeses(meses), [meses])
  const ultimoMes = mesesOrdenados[mesesOrdenados.length - 1] || ""

  const [selecionados, setSelecionados] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_MESES) || "null") as string[] | null
      if (saved && saved.length) return saved
    } catch { /* cai para o padrão */ }
    return mesesOrdenados.slice(-MAX_MESES_PADRAO)
  })

  const [diasPorMes, setDiasPorMes] = useState<Record<string, DiasMes>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_DIAS) || "null") as Record<string, DiasMes> | null
      if (saved) return saved
    } catch { /* cai para o padrão */ }
    return {}
  })

  // Garante que meses novos (upload de xlsx) fiquem selecionáveis; se a seleção salva
  // ficar vazia após um novo upload, cai para os últimos N meses disponíveis.
  useEffect(() => {
    setSelecionados((prev) => {
      const validos = prev.filter((m) => mesesOrdenados.includes(m))
      if (validos.length) return validos
      return mesesOrdenados.slice(-MAX_MESES_PADRAO)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesesOrdenados.join("|")])

  // Default sensato por mês: o mês mais recente da base entra com o corte "ontem"
  // (mesmo default do resto do app); os demais entram como mês fechado (projeção = realizado).
  useEffect(() => {
    setDiasPorMes((prev) => {
      const next = { ...prev }
      let mudou = false
      mesesOrdenados.forEach((mes) => {
        if (next[mes]) return
        mudou = true
        if (mes === ultimoMes) {
          const ontem = new Date()
          ontem.setDate(ontem.getDate() - 1)
          const diasTot = new Date(ontem.getFullYear(), ontem.getMonth() + 1, 0).getDate()
          next[mes] = { diasDec: Math.min(ontem.getDate(), diasTot), diasTot }
        } else {
          next[mes] = diasFechadoPadrao(mes)
        }
      })
      return mudou ? next : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesesOrdenados.join("|"), ultimoMes])

  useEffect(() => { localStorage.setItem(LS_MESES, JSON.stringify(selecionados)) }, [selecionados])
  useEffect(() => { localStorage.setItem(LS_DIAS, JSON.stringify(diasPorMes)) }, [diasPorMes])

  const toggleMes = useCallback((mes: string) => {
    setSelecionados((prev) => (prev.includes(mes) ? prev.filter((m) => m !== mes) : ordenarMeses([...prev, mes])))
  }, [])

  const selecionarTodos = useCallback(() => setSelecionados(mesesOrdenados), [mesesOrdenados])
  const limparSelecao = useCallback(() => setSelecionados(mesesOrdenados.slice(-1)), [mesesOrdenados])

  const setDiasMes = useCallback((mes: string, campo: "diasDec" | "diasTot", valor: number) => {
    setDiasPorMes((prev) => ({ ...prev, [mes]: { ...(prev[mes] || diasFechadoPadrao(mes)), [campo]: Math.max(1, valor) } }))
  }, [])

  const marcarFechado = useCallback((mes: string) => {
    setDiasPorMes((prev) => ({ ...prev, [mes]: diasFechadoPadrao(mes) }))
  }, [])

  const resultado = useMemo(
    () => calcTendencia(rows, selecionados, diasPorMes),
    [rows, selecionados, diasPorMes]
  )

  return {
    mesesDisponiveis: mesesOrdenados, selecionados, toggleMes, selecionarTodos, limparSelecao,
    diasPorMes, setDiasMes, marcarFechado, resultado,
  }
}
