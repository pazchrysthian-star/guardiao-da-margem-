import { useMemo, useState } from "react"
import { computeShareUnificada, type Periodo, type Fonte, valorPeriodo } from "@/lib/mercado"
import { pctS, R$ } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpDown } from "lucide-react"

type SortColumn = "linha" | "vendaUnipreco" | "vendaMercado" | "share" | "variacaoShare" | "crescimentoMercado" | "crescimentoUni" | "gapCrescimento" | "ganhoPerdaValor" | "ganhoPerdaMensal" | null
type SortDirection = "asc" | "desc"

export function ShareUnificadoTable({ fonte }: { fonte: Fonte }) {
  const [periodo, setPeriodo] = useState<Periodo>("MAT")
  const [sortColumn, setSortColumn] = useState<SortColumn>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const dados = useMemo(() => computeShareUnificada(periodo, fonte), [periodo, fonte])

  const sorted = useMemo(() => {
    if (!sortColumn) return dados

    const copy = [...dados]
    copy.sort((a, b) => {
      let aVal = a[sortColumn as keyof typeof a]
      let bVal = b[sortColumn as keyof typeof b]

      if (typeof aVal === "string") aVal = aVal.localeCompare(String(bVal))
      else aVal = (aVal as number) - (bVal as number)

      return sortDirection === "asc" ? (aVal as number) : -(aVal as number)
    })
    return copy
  }, [dados, sortColumn, sortDirection])

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(col)
      setSortDirection("desc")
    }
  }

  const nMeses = periodo === "MAT" ? 12 : periodo === "YTD" ? 6 : periodo === "T3M" ? 3 : 1

  const uniPeriodo = valorPeriodo("UNIPRECO", "TOTAL", periodo, fonte)
  const mercPeriodo = valorPeriodo("BRICKS", "TOTAL", periodo, fonte)

  const totalVendaUni = uniPeriodo.atual
  const totalVendaUniAnt = uniPeriodo.anterior
  const totalVendaMerc = mercPeriodo.atual
  const totalVendaMercAnt = mercPeriodo.anterior

  const totalShare = totalVendaMerc > 0 ? totalVendaUni / totalVendaMerc : 0
  const totalShareAnt = totalVendaMercAnt > 0 ? totalVendaUniAnt / totalVendaMercAnt : 0

  const totals = {
    vendaUnipreco: totalVendaUni,
    vendaMercado: totalVendaMerc,
    share: totalShare,
    variacaoShare: totalShare - totalShareAnt,
    crescimentoMercado: totalVendaMercAnt > 0 ? totalVendaMerc / totalVendaMercAnt - 1 : 0,
    crescimentoUni: totalVendaUniAnt > 0 ? totalVendaUni / totalVendaUniAnt - 1 : 0,
    gapCrescimento: 0,
    ganhoPerdaValor: sorted.reduce((s, d) => s + d.ganhoPerdaValor, 0),
    ganhoPerdaMensal: sorted.reduce((s, d) => s + d.ganhoPerdaMensal, 0),
  }

  totals.gapCrescimento = totals.crescimentoUni - totals.crescimentoMercado

  const SortIcon = ({ col }: { col: SortColumn }) => (
    <div className="inline-flex items-center gap-1">
      <ArrowUpDown className={`size-3 ${sortColumn === col ? "text-brand" : "text-text-muted-c"}`} />
    </div>
  )

  const HeaderCell = ({ col, children }: { col: SortColumn; children: React.ReactNode }) => (
    <th
      onClick={() => handleSort(col)}
      className="px-2 py-2 text-right font-bold text-text-main cursor-pointer hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center justify-end gap-1">
        {children}
        <SortIcon col={col} />
      </div>
    </th>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Share Unipreço vs Mercado — Análise Completa</CardTitle>
            <p className="mt-1 text-xs text-text-muted-c">Venda, participação, crescimento e ganho/perda de share em {nMeses} meses — clique nos cabeçalhos para ordenar</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriodo("MAT")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                periodo === "MAT"
                  ? "bg-brand text-white border-brand"
                  : "border-border-soft text-text-muted-c hover:border-brand hover:text-brand"
              }`}
            >
              MAT
            </button>
            <button
              onClick={() => setPeriodo("YTD")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                periodo === "YTD"
                  ? "bg-brand text-white border-brand"
                  : "border-border-soft text-text-muted-c hover:border-brand hover:text-brand"
              }`}
            >
              YTD
            </button>
            <button
              onClick={() => setPeriodo("T3M")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                periodo === "T3M"
                  ? "bg-brand text-white border-brand"
                  : "border-border-soft text-text-muted-c hover:border-brand hover:text-brand"
              }`}
            >
              TRI
            </button>
            <button
              onClick={() => setPeriodo("YoY")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                periodo === "YoY"
                  ? "bg-brand text-white border-brand"
                  : "border-border-soft text-text-muted-c hover:border-brand hover:text-brand"
              }`}
            >
              YoY
            </button>
            <button
              onClick={() => setPeriodo("MoM")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                periodo === "MoM"
                  ? "bg-brand text-white border-brand"
                  : "border-border-soft text-text-muted-c hover:border-brand hover:text-brand"
              }`}
            >
              MoM
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-border-soft bg-gray-50">
                <th
                  onClick={() => handleSort("linha")}
                  className="px-2 py-2 text-left font-bold text-text-main cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Linha
                    <SortIcon col="linha" />
                  </div>
                </th>
                <HeaderCell col="vendaUnipreco">Venda Uni</HeaderCell>
                <HeaderCell col="vendaMercado">Venda Merc</HeaderCell>
                <HeaderCell col="share">Share %</HeaderCell>
                <HeaderCell col="variacaoShare">Δ Share pp</HeaderCell>
                <HeaderCell col="crescimentoMercado">Cresc. Merc %</HeaderCell>
                <HeaderCell col="crescimentoUni">Cresc. Uni %</HeaderCell>
                <HeaderCell col="gapCrescimento">Gap %</HeaderCell>
                <HeaderCell col="ganhoPerdaValor">Ganho/Perda Total</HeaderCell>
                <th className="px-2 py-2 text-right font-bold text-brand cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort("ganhoPerdaMensal")}>
                  <div className="flex items-center justify-end gap-1">
                    Ganho/Perda Mensal
                    <SortIcon col="ganhoPerdaMensal" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((linha) => (
                <tr key={linha.linha} className="border-b border-border-soft hover:bg-gray-50/50">
                  <td className="px-2 py-2 font-medium text-text-main">{linha.linha}</td>
                  <td className="px-2 py-2 text-right text-text-main">{R$(linha.vendaUnipreco)}</td>
                  <td className="px-2 py-2 text-right text-text-muted-c">{R$(linha.vendaMercado)}</td>
                  <td className="px-2 py-2 text-right font-semibold text-brand">{pctS(linha.share)}</td>
                  <td
                    className={`px-2 py-2 text-right font-semibold ${
                      linha.variacaoShare > 0 ? "text-brand" : linha.variacaoShare < 0 ? "text-danger-c" : "text-text-muted-c"
                    }`}
                  >
                    {(linha.variacaoShare * 100).toFixed(2)}pp
                  </td>
                  <td className={`px-2 py-2 text-right ${linha.crescimentoMercado > 0 ? "text-text-main" : "text-text-muted-c"}`}>
                    {pctS(linha.crescimentoMercado)}
                  </td>
                  <td
                    className={`px-2 py-2 text-right font-semibold ${
                      linha.crescimentoUni > 0 ? "text-brand" : "text-danger-c"
                    }`}
                  >
                    {pctS(linha.crescimentoUni)}
                  </td>
                  <td
                    className={`px-2 py-2 text-right font-semibold ${
                      linha.gapCrescimento > 0 ? "text-brand" : "text-danger-c"
                    }`}
                  >
                    {(linha.gapCrescimento * 100).toFixed(1)}pp
                  </td>
                  <td
                    className={`px-2 py-2 text-right font-semibold ${
                      linha.ganhoPerdaValor > 0 ? "text-brand" : "text-danger-c"
                    }`}
                  >
                    {R$(linha.ganhoPerdaValor)}
                  </td>
                  <td
                    className={`px-2 py-2 text-right font-bold ${
                      linha.ganhoPerdaMensal > 0 ? "bg-brand-soft text-brand" : "bg-danger-soft text-danger-c"
                    }`}
                  >
                    {R$(linha.ganhoPerdaMensal)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-border-soft bg-brand-soft/30 font-bold">
                <td className="px-2 py-3 text-text-main">TOTAL</td>
                <td className="px-2 py-3 text-right text-text-main">{R$(totals.vendaUnipreco)}</td>
                <td className="px-2 py-3 text-right text-text-main">{R$(totals.vendaMercado)}</td>
                <td className="px-2 py-3 text-right text-brand">{pctS(totals.share)}</td>
                <td className={`px-2 py-3 text-right ${totals.variacaoShare > 0 ? "text-brand" : totals.variacaoShare < 0 ? "text-danger-c" : "text-text-muted-c"}`}>
                  {(totals.variacaoShare * 100).toFixed(2)}pp
                </td>
                <td className={`px-2 py-3 text-right ${totals.crescimentoMercado > 0 ? "text-text-main" : "text-text-muted-c"}`}>
                  {pctS(totals.crescimentoMercado)}
                </td>
                <td className={`px-2 py-3 text-right font-semibold ${totals.crescimentoUni > 0 ? "text-brand" : "text-danger-c"}`}>
                  {pctS(totals.crescimentoUni)}
                </td>
                <td className={`px-2 py-3 text-right font-semibold ${totals.gapCrescimento > 0 ? "text-brand" : "text-danger-c"}`}>
                  {(totals.gapCrescimento * 100).toFixed(1)}pp
                </td>
                <td className={`px-2 py-3 text-right ${totals.ganhoPerdaValor > 0 ? "text-brand" : "text-danger-c"}`}>
                  {R$(totals.ganhoPerdaValor)}
                </td>
                <td className={`px-2 py-3 text-right ${totals.ganhoPerdaMensal > 0 ? "text-brand" : "text-danger-c"}`}>
                  {R$(totals.ganhoPerdaMensal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
