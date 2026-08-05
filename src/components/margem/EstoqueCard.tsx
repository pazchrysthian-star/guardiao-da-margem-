import { useState } from "react"
import { ESTOQUE_ADAPTADO } from "@/lib/estoqueAdaptadoData"
import { R$ } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EstoqueGraficoDivergente } from "./EstoqueGraficoDivergente"
import { Lock, TrendingDown } from "lucide-react"

export function EstoqueCard() {
  const [categoriaSelecionada] = useState("geral")
  const [curvaSelecionada, setCurvaSelecionada] = useState<string | null>(null)

  const rowsDisplay = ESTOQUE_ADAPTADO.rows.map(r => ({
    curva: r.curva,
    pctIdeal: r.pctIdeal,
    estoqueIdeal: r.adaptado,
    estoqueAtual: r.atual,
    diferencaRS: r.atual - r.adaptado,
    coberturaAlvo: r.covAlvo,
    coberturaAtual: r.covAtual,
  }))

  const totalEstoque = rowsDisplay.reduce((s, r) => s + r.estoqueAtual, 0) + ESTOQUE_ADAPTADO.bloqueado.atual
  const totalIdeal = rowsDisplay.reduce((s, r) => s + r.estoqueIdeal, 0) + ESTOQUE_ADAPTADO.bloqueado.adaptado
  const totalDifRS = totalEstoque - totalIdeal
  const avgCobAtual = rowsDisplay.reduce((s, r) => s + r.coberturaAtual, 0) / rowsDisplay.length
  const bloqueadoPercent = (ESTOQUE_ADAPTADO.bloqueado.atual / totalEstoque) * 100

  const pilorEstoque = rowsDisplay.reduce((a, r) => r.diferencaRS < a.diferencaRS ? r : a, rowsDisplay[0])
  const pilorCobertura = rowsDisplay.reduce((a, r) => r.coberturaAtual > a.coberturaAtual ? r : a, rowsDisplay[0])
  const segundaMaiorDeficit = rowsDisplay
    .filter(r => r.curva !== pilorEstoque.curva)
    .reduce((a, r) => r.diferencaRS < a.diferencaRS ? r : a, rowsDisplay[1])

  const getStatusClass = (curva: string, difRS: number) => {
    if (curva === "C" && difRS < -6000000) return "bg-red-50 border-red-100"
    if (curva === "D" && difRS > 4000000) return "bg-green-50 border-green-100"
    return ""
  }

  const getStatusBadge = (difRS: number, cobAtual: number, cobAlvo: number) => {
    if (difRS < -6000000) return { text: "Crítico", color: "bg-red-100 text-red-700" }
    if (difRS < 0) return { text: "Abaixo", color: "bg-orange-100 text-orange-700" }
    if (cobAtual > cobAlvo + 50) return { text: "Excesso", color: "bg-green-100 text-green-700" }
    return { text: "Acima", color: "bg-blue-100 text-blue-700" }
  }

  const dadosGrafico = rowsDisplay.map(r => ({
    curva: r.curva,
    valor: r.diferencaRS / 1e6,
  }))

  return (
    <div className="space-y-0 bg-slate-50">
      {/* Barra de Filtros */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Abas de Categoria */}
          <div className="flex gap-2">
            {[
              { id: "geral", label: "Visão Geral" },
              { id: "nao_med", label: "Não Medicamentos" },
              { id: "med", label: "Medicamentos" },
            ].map(tab => (
              <button
                key={tab.id}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  categoriaSelecionada === tab.id
                    ? "bg-green-600 text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Selects de Filtro */}
          <div className="flex gap-3">
            <select className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:border-slate-400">
              <option>Todas as curvas</option>
            </select>
            <select className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:border-slate-400">
              <option>Todas as filiais</option>
            </select>
            <select className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:border-slate-400">
              <option>Todos os GDs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="space-y-6 p-6">
        {/* Cards KPI - 4 Colunas */}
        <div className="grid grid-cols-4 gap-4">
          {/* Card: Estoque Atual */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs font-semibold text-slate-500">Estoque Atual</div>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100">
                <span className="text-lg">📦</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{(totalEstoque / 1e6).toFixed(2)} mi</div>
            <div className="mt-3 text-xs">
              <span className="inline-block rounded bg-red-50 px-2 py-1 font-semibold text-red-700">
                −{(Math.abs(totalDifRS) / 1e6).toFixed(2)} mi
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500">vs. ideal</div>
          </div>

          {/* Card: Cobertura Atual */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs font-semibold text-slate-500">Cobertura Atual</div>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
                <span className="text-lg">📅</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{avgCobAtual.toFixed(1)} dias</div>
            <div className="mt-3 text-xs">
              <span className="inline-block rounded bg-red-50 px-2 py-1 font-semibold text-red-700">
                −0,29 dia
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500">meta 47,3 dias</div>
          </div>

          {/* Card: Capital Bloqueado */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs font-semibold text-slate-500">Capital Bloqueado</div>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
                <Lock className="size-5 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{(ESTOQUE_ADAPTADO.bloqueado.atual / 1e6).toFixed(2)} mi</div>
            <div className="mt-3 text-xs">
              <span className="inline-block rounded bg-red-100 px-2 py-1 font-semibold text-red-700">
                {bloqueadoPercent.toFixed(2)}% do estoque
              </span>
            </div>
          </div>

          {/* Card: Maior Oportunidade */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs font-semibold text-slate-500">Maior Oportunidade</div>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100">
                <TrendingDown className="size-5 text-orange-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">Curva {pilorEstoque.curva}</div>
            <div className="mt-3 text-xs">
              <span className="inline-block rounded bg-red-50 px-2 py-1 font-semibold text-red-700">
                −{(Math.abs(pilorEstoque.diferencaRS) / 1e6).toFixed(2)} mi abaixo
              </span>
            </div>
          </div>
        </div>

        {/* Área Analítica: Gráfico + Prioridades lado a lado */}
        <div className="grid grid-cols-[1.35fr_0.95fr] gap-4">
          {/* Gráfico de Gap */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Gap de estoque por curva</CardTitle>
            </CardHeader>
            <CardContent>
              <EstoqueGraficoDivergente dados={dadosGrafico} />
            </CardContent>
          </Card>

          {/* Prioridades de Ação */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Prioridades de ação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {/* Prioridade 1 */}
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">Repor Curva {pilorEstoque.curva}</h4>
                    <p className="mt-1 text-xs text-slate-600">
                      Déficit de {R$(Math.abs(pilorEstoque.diferencaRS))} · cobertura {pilorEstoque.coberturaAtual.toFixed(2)}/{pilorEstoque.coberturaAlvo} dias
                    </p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                    CRÍTICO
                  </span>
                </div>
              </div>

              {/* Prioridade 2 */}
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">Reduzir Curva {pilorCobertura.curva}</h4>
                    <p className="mt-1 text-xs text-slate-600">
                      Excesso de {R$(pilorCobertura.diferencaRS)} · cobertura {pilorCobertura.coberturaAtual.toFixed(2)}/{pilorCobertura.coberturaAlvo} dias
                    </p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                    ALTO
                  </span>
                </div>
              </div>

              {/* Prioridade 3 */}
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">Monitorar Curva {segundaMaiorDeficit.curva}</h4>
                    <p className="mt-1 text-xs text-slate-600">
                      Déficit de {R$(Math.abs(segundaMaiorDeficit.diferencaRS))} · cobertura {segundaMaiorDeficit.coberturaAtual.toFixed(2)}/{segundaMaiorDeficit.coberturaAlvo} dias
                    </p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                    ATENÇÃO
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela Detalhada */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Detalhamento por Curva ABC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-white">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Curva</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Estoque Ideal</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Estoque Atual</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Participação</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Cob. Ideal</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Cob. Atual</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Gap R$</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rowsDisplay.map((linha) => {
                    const participacao = (linha.estoqueAtual / totalEstoque) * 100
                    const status = getStatusBadge(linha.diferencaRS, linha.coberturaAtual, linha.coberturaAlvo)
                    const rowClass = getStatusClass(linha.curva, linha.diferencaRS)

                    return (
                      <tr
                        key={linha.curva}
                        className={`border-b border-slate-200 transition-colors hover:bg-slate-50 ${rowClass} ${
                          curvaSelecionada === linha.curva ? "bg-slate-100" : ""
                        }`}
                        onClick={() => setCurvaSelecionada(curvaSelecionada === linha.curva ? null : linha.curva)}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">{linha.curva}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{R$(linha.estoqueIdeal)}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{R$(linha.estoqueAtual)}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{participacao.toFixed(2)}%</td>
                        <td className="px-4 py-3 text-right text-slate-700">{linha.coberturaAlvo.toFixed(1)}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{linha.coberturaAtual.toFixed(2)}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${linha.diferencaRS < 0 ? "text-red-600" : "text-green-600"}`}>
                          {R$(linha.diferencaRS)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}>
                            {status.text}
                          </span>
                        </td>
                      </tr>
                    )
                  })}

                  {/* Linha Bloqueado */}
                  <tr className="border-b border-slate-200 italic text-slate-500">
                    <td className="px-4 py-3 font-semibold">Bloqueado</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">{R$(ESTOQUE_ADAPTADO.bloqueado.atual)}</td>
                    <td className="px-4 py-3 text-right">{bloqueadoPercent.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">R$ 0,00</td>
                    <td className="px-4 py-3">—</td>
                  </tr>

                  {/* Linha TOTAL */}
                  <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                    <td className="px-4 py-3 text-slate-900">TOTAL</td>
                    <td className="px-4 py-3 text-right text-slate-900">{R$(totalIdeal)}</td>
                    <td className="px-4 py-3 text-right text-slate-900">{R$(totalEstoque)}</td>
                    <td className="px-4 py-3 text-right text-slate-900">100,00%</td>
                    <td className="px-4 py-3 text-right text-slate-900">45.38</td>
                    <td className="px-4 py-3 text-right text-slate-900">48.36</td>
                    <td className={`px-4 py-3 text-right ${totalDifRS < 0 ? "text-red-600" : "text-green-600"}`}>
                      {R$(totalDifRS)}
                    </td>
                    <td className="px-4 py-3">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Rodapé */}
        <div className="text-center text-xs text-slate-500">
          Fonte: dados importados · Projeção linear conforme dias informados
        </div>
      </div>
    </div>
  )
}
