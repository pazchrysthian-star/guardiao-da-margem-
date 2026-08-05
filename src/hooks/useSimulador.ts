import { useMemo, useState, useCallback, useEffect } from "react"
import type { MargemRow } from "@/lib/calc"
import { simulate, calcularMetaMBAutomatica, LINHAS_EXCLUIDAS, type LinhaMeta } from "@/lib/simulador"
import metasPadraoData from "@/data/metasPadrao.json"

const LS_KEY = "metas-linha-v1"
const LS_VENDA_TOTAL = "meta-venda-total-v1"
const META_MB_PADRAO = 0.305

// Metas "publicadas": vêm do build (mesmo padrão do seed.json de vendas), então toda
// máquina que abrir o link enxerga o mesmo ponto de partida — não dependem do localStorage.
const METAS_PUBLICADAS: LinhaMeta[] = metasPadraoData.metas
const VENDA_TOTAL_PUBLICADA: number = metasPadraoData.metaVendaTotal

function metaPublicadaDe(linha: string): LinhaMeta {
  return METAS_PUBLICADAS.find((m) => m.linha === linha) || { linha, metaParticipacao: 0, metaMB: 0, sellout: 0 }
}

function linhasFromRows(rows: MargemRow[]): string[] {
  return Array.from(new Set(rows.map((r) => r.linha))).filter((l) => !LINHAS_EXCLUIDAS.has(l)).sort()
}

function cargaInicial(rows: MargemRow[]): LinhaMeta[] {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null") as LinhaMeta[] | null
    if (saved && saved.length) {
      const map: Record<string, LinhaMeta> = {}
      saved.forEach((m) => { if (!LINHAS_EXCLUIDAS.has(m.linha)) map[m.linha] = { ...m, sellout: m.sellout ?? 0 } })
      // garante que linhas novas na base também apareçam, partindo do que já foi publicado
      linhasFromRows(rows).forEach((linha) => {
        if (!map[linha]) map[linha] = metaPublicadaDe(linha)
      })
      return Object.values(map)
    }
  } catch {
    // ignora e cai para o publicado
  }
  // navegador "zerado" (outra máquina, cache limpo, etc.) — usa o que foi publicado no build
  return linhasFromRows(rows).map((linha) => metaPublicadaDe(linha))
}

export function useSimulador(rows: MargemRow[], mAt: string, diasDec: number, diasTot: number) {
  const [metas, setMetas] = useState<LinhaMeta[]>(() => cargaInicial(rows))
  const [metaVendaTotal, setMetaVendaTotal] = useState<number>(() => {
    const v = Number(localStorage.getItem(LS_VENDA_TOTAL))
    return v > 0 ? v : VENDA_TOTAL_PUBLICADA
  })

  // garante metas para linhas que apareçam depois de importar um novo xlsx
  useEffect(() => {
    setMetas((prev) => {
      const existentes = new Set(prev.map((m) => m.linha))
      const faltando = linhasFromRows(rows).filter((l) => !existentes.has(l))
      if (!faltando.length) return prev
      return [...prev, ...faltando.map((linha) => metaPublicadaDe(linha))]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(metas)) }, [metas])
  useEffect(() => { localStorage.setItem(LS_VENDA_TOTAL, String(metaVendaTotal)) }, [metaVendaTotal])

  const updateMeta = useCallback((linha: string, field: "metaParticipacao" | "metaMB" | "sellout", value: number) => {
    setMetas((prev) => prev.map((m) => (m.linha === linha ? { ...m, [field]: value } : m)))
  }, [])

  const restaurarPadrao = useCallback(() => {
    setMetas(linhasFromRows(rows).map((linha) => metaPublicadaDe(linha)))
    setMetaVendaTotal(VENDA_TOTAL_PUBLICADA)
  }, [rows])

  const zerarSellout = useCallback(() => {
    setMetas((prev) => prev.map((m) => ({ ...m, sellout: 0 })))
  }, [])

  const calcularMetaAutomatica = useCallback((alvo?: number) => {
    const alvoFinal = alvo && alvo > 0 ? alvo : META_MB_PADRAO
    setMetas((prev) => calcularMetaMBAutomatica(rows, mAt, prev, alvoFinal))
  }, [rows, mAt])

  // Gera o arquivo que deve ser colocado em dados/ e processado pelo atualizar.bat/.mjs
  // para que os valores atuais (desta máquina) virem o novo padrão publicado para todos.
  const exportarParaPublicar = useCallback(() => {
    const conteudo = { metaVendaTotal, metas, publicadoEm: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(conteudo, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "metas-para-publicar.json"
    a.click()
    URL.revokeObjectURL(url)
  }, [metas, metaVendaTotal])

  const result = useMemo(
    () => simulate(rows, mAt, diasDec, diasTot, metaVendaTotal, metas),
    [rows, mAt, diasDec, diasTot, metaVendaTotal, metas]
  )

  const rascunhoLocal = useMemo(() => {
    if (metaVendaTotal !== VENDA_TOTAL_PUBLICADA) return true
    if (metas.length !== METAS_PUBLICADAS.length) return true
    return metas.some((m) => {
      const pub = METAS_PUBLICADAS.find((p) => p.linha === m.linha)
      return !pub || pub.metaMB !== m.metaMB || pub.metaParticipacao !== m.metaParticipacao || pub.sellout !== m.sellout
    })
  }, [metas, metaVendaTotal])

  return {
    metas, updateMeta, restaurarPadrao, zerarSellout, calcularMetaAutomatica, exportarParaPublicar,
    metaVendaTotal, setMetaVendaTotal, result,
    dataPublicacao: metasPadraoData.publicadoEm as string | null,
    rascunhoLocal,
  }
}
