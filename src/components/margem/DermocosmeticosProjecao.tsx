import { cenarioProjecao, cenarios, calcularProjecao, atingiuMeta, gapParaMeta } from "@/lib/dermoProjecaoData"
import { R$, pctFormat } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, CheckCircle, AlertCircle } from "lucide-react"

export function DermocosmeticosProjecao() {
  return (
    <div className="space-y-6">
      {/* Título e Meta */}
      <div>
        <h3 className="text-xl font-bold text-text-main">Plano de Projeção até Dezembro</h3>
        <p className="mt-1 text-sm text-text-muted-c">
          De <span className="font-semibold">{R$(cenarioProjecao.vendaAtual)}</span> para{" "}
          <span className="font-semibold text-brand">{R$(cenarioProjecao.vendaIdeal)}</span> — Gap: R${" "}
          <span className="font-semibold">{(cenarioProjecao.gapTotal / 1000).toFixed(1)}k</span>
        </p>
      </div>

      {/* 3 Cenários */}
      <div className="grid gap-4 lg:grid-cols-3">
        {Object.entries(cenarios).map(([key, cenario]) => {
          const projecao = calcularProjecao(cenarioProjecao.vendaAtual, cenario.incrementoMensal, cenarioProjecao.numeroMeses)
          const vendaFinal = projecao[projecao.length - 1].venda
          const atingiu = atingiuMeta(vendaFinal)
          const gap = gapParaMeta(vendaFinal)
          const crescimentoTotal = ((vendaFinal - cenarioProjecao.vendaAtual) / cenarioProjecao.vendaAtual) * 100

          return (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{cenario.nome}</CardTitle>
                    <p className="mt-1 text-xs text-text-muted-c">{cenario.descricao}</p>
                  </div>
                  {atingiu ? <CheckCircle className="size-5 text-brand" /> : <AlertCircle className="size-5 text-orange-500" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* KPI: Venda em Dezembro */}
                <div className="rounded-[12px] bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-text-muted-c">Venda em Dezembro</p>
                  <p className="mt-2 text-lg font-bold text-text-main">{R$(vendaFinal)}</p>
                  <p className="mt-1 text-xs text-text-muted-c">Meta: {R$(cenarioProjecao.vendaIdeal)}</p>
                </div>

                {/* KPI: Crescimento Total */}
                <div className="rounded-[12px] bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-text-muted-c">Crescimento Total</p>
                  <p className={cn("mt-2 text-lg font-bold", atingiu ? "text-brand" : "text-orange-600")}>
                    {pctFormat(crescimentoTotal / 100)}
                  </p>
                  <p className="mt-1 text-xs text-text-muted-c">
                    {R$(cenario.incrementoMensal)}/mês
                  </p>
                </div>

                {/* Status */}
                {atingiu ? (
                  <div className="rounded-[10px] bg-brand-soft px-3 py-2.5">
                    <p className="text-xs font-bold text-brand">✓ Meta atingida em dezembro</p>
                  </div>
                ) : (
                  <div className="rounded-[10px] bg-orange-100 px-3 py-2.5">
                    <p className="text-xs font-bold text-orange-700">⚠ Meta não atingida</p>
                    <p className="mt-1 text-xs text-orange-600">Faltam: {R$(gap)}</p>
                  </div>
                )}

                {/* Evolução mês a mês */}
                <div className="space-y-2 border-t border-gray-200 pt-3">
                  <p className="text-xs font-semibold text-text-muted-c">Evolução Mensal</p>
                  <div className="space-y-1.5">
                    {projecao.map((mes, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-text-muted-c font-medium">{mes.mes}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-right w-24 font-medium text-text-main">{R$(mes.venda)}</span>
                          {idx > 0 && <span className="text-green-600 text-[10px]">+{R$(mes.incremento)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recomendação */}
      <Card className="border-brand-soft bg-brand-soft/30">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <TrendingUp className="size-5 shrink-0 text-brand" />
            <div>
              <p className="font-semibold text-brand">Recomendação</p>
              <p className="mt-1 text-sm text-text-main">
                Para atingir o objetivo de <span className="font-bold">{R$(cenarioProjecao.vendaIdeal)}</span> em dezembro, é necessário um crescimento linear de{" "}
                <span className="font-bold">{R$(cenarioProjecao.gapTotal / cenarioProjecao.numeroMeses)}/mês</span> (cenário realista).
                O cenário agressivo fornece margem de 20% para contingências e variações de demanda.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
