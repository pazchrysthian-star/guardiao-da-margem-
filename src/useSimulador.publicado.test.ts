// Garante que as metas/sellout publicados no build sao o que qualquer navegador enxerga,
// e que uma publicacao nova invalida o rascunho local antigo.
import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import metasPadrao from "@/data/metasPadrao.json"
import seed from "@/data/seed.json"
import { useSimulador } from "@/hooks/useSimulador"
import type { MargemRow } from "@/lib/calc"

const rows = seed as unknown as MargemRow[]
const mAt = rows[rows.length - 1].mes
const LS_KEY = "metas-linha-v1"
const LS_VENDA = "meta-venda-total-v1"
const LS_VERSAO = "metas-publicadas-versao-v1"

const montar = () => renderHook(() => useSimulador(rows, mAt, 22, 31))

describe("metas publicadas no projeto", () => {
  beforeEach(() => localStorage.clear())

  it("navegador zerado enxerga exatamente o publicado", () => {
    const { result } = montar()
    expect(result.current.metaVendaTotal).toBe(metasPadrao.metaVendaTotal)
    expect(result.current.rascunhoLocal).toBe(false)
    for (const pub of metasPadrao.metas) {
      const m = result.current.metas.find((x) => x.linha === pub.linha)
      if (!m) continue
      expect(m.metaMB).toBe(pub.metaMB)
      expect(m.metaParticipacao).toBe(pub.metaParticipacao)
      expect(m.sellout).toBe(pub.sellout)
    }
  })

  it("rascunho de uma publicacao ANTERIOR e descartado", () => {
    localStorage.setItem(LS_VERSAO, "2020-01-01T00:00:00.000Z")
    localStorage.setItem(LS_KEY, JSON.stringify([{ linha: "RX_GENÉRICO", metaParticipacao: 0.9, metaMB: 0.01, sellout: 999999 }]))
    localStorage.setItem(LS_VENDA, "1")
    const { result } = montar()
    const rx = result.current.metas.find((m) => m.linha === "RX_GENÉRICO")!
    expect(rx.metaMB).toBe(0.499)
    expect(rx.sellout).toBe(20)
    expect(result.current.metaVendaTotal).toBe(metasPadrao.metaVendaTotal)
    expect(result.current.rascunhoLocal).toBe(false)
  })

  it("rascunho da versao ATUAL e mantido e sinalizado", () => {
    localStorage.setItem(LS_VERSAO, String(metasPadrao.publicadoEm))
    localStorage.setItem(LS_KEY, JSON.stringify(metasPadrao.metas.map((m) => (m.linha === "RX_TRADE" ? { ...m, sellout: 5555 } : m))))
    const { result } = montar()
    expect(result.current.metas.find((m) => m.linha === "RX_TRADE")!.sellout).toBe(5555)
    expect(result.current.rascunhoLocal).toBe(true)
  })

  it("editar marca rascunho e restaurar volta ao publicado e limpa o storage", () => {
    const { result } = montar()
    act(() => result.current.updateMeta("MIP_MARCA", "sellout", 12345))
    expect(result.current.rascunhoLocal).toBe(true)
    expect(localStorage.getItem(LS_KEY)).not.toBeNull()

    act(() => result.current.restaurarPadrao())
    expect(result.current.rascunhoLocal).toBe(false)
    expect(result.current.metas.find((m) => m.linha === "MIP_MARCA")!.sellout).toBe(32058.71)
    expect(localStorage.getItem(LS_KEY)).toBeNull()
  })

  it("sellout publicado entra na margem recomposta (nao fica so decorativo)", () => {
    const { result } = montar()
    const somaSellout = result.current.result.linhas.reduce((a, l) => a + (l.sellout || 0), 0)
    expect(somaSellout).toBeGreaterThan(200000)
    const l = result.current.result.linhas.find((x) => x.linha === "NÃO_MEDIC_PAC")!
    expect(l.sellout).toBe(121940.52)
    expect(l.mbPercRecomp).toBeGreaterThan(l.mbPercReal)
  })
})
