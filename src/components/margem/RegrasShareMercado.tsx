import { computeShareTable, type Fonte } from "@/lib/mercado"
import { pctS } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, TrendingUp, Target } from "lucide-react"

export function RegrasShareMercado({ fonte }: { fonte: Fonte }) {
  const shares = computeShareTable("MAT", fonte)

  // Regras de análise
  const ganhandoShare = shares.filter((s) => s.deltaShare > 0.01).sort((a, b) => b.deltaShare - a.deltaShare)
  const perdendoShare = shares.filter((s) => s.deltaShare < -0.01).sort((a, b) => a.deltaShare - b.deltaShare)
  const crescendoMaisQueOmercado = shares.filter((s) => s.gapCrescimento > 0.05).sort((a, b) => b.gapCrescimento - a.gapCrescimento)
  const crescendoMenosQueOmercado = shares.filter((s) => s.gapCrescimento < -0.05).sort((a, b) => a.gapCrescimento - b.gapCrescimento)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-brand" />
            Ganhando Share
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ganhandoShare.length > 0 ? (
            <div className="space-y-3">
              {ganhandoShare.slice(0, 5).map((linha) => (
                <div key={linha.linha} className="border-l-4 border-brand pl-3">
                  <p className="font-semibold text-text-main">{linha.linha}</p>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-text-muted-c">Share atual: {pctS(linha.share)}</span>
                    <span className="font-bold text-brand">+{(linha.deltaShare * 100).toFixed(2)}pp</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted-c">Nenhuma linha ganhando share significativamente</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="size-5 text-danger-c" />
            Perdendo Share
          </CardTitle>
        </CardHeader>
        <CardContent>
          {perdendoShare.length > 0 ? (
            <div className="space-y-3">
              {perdendoShare.slice(0, 5).map((linha) => (
                <div key={linha.linha} className="border-l-4 border-danger-c pl-3">
                  <p className="font-semibold text-text-main">{linha.linha}</p>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-text-muted-c">Share atual: {pctS(linha.share)}</span>
                    <span className="font-bold text-danger-c">{(linha.deltaShare * 100).toFixed(2)}pp</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted-c">Nenhuma linha perdendo share significativamente</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-5 text-brand" />
            Crescendo Acima do Mercado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {crescendoMaisQueOmercado.length > 0 ? (
            <div className="space-y-3">
              {crescendoMaisQueOmercado.slice(0, 5).map((linha) => (
                <div key={linha.linha} className="border-l-4 border-brand pl-3">
                  <p className="font-semibold text-text-main">{linha.linha}</p>
                  <div className="text-sm mt-1 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-text-muted-c">Uni:</span>
                      <span className="font-bold text-brand">{pctS(linha.crescUnipreco)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted-c">Merc:</span>
                      <span className="font-bold text-text-main">{pctS(linha.crescMercado)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border-soft pt-1">
                      <span className="text-text-muted-c">Gap:</span>
                      <span className="font-bold text-brand">+{(linha.gapCrescimento * 100).toFixed(1)}pp</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted-c">Nenhuma linha crescendo acima do mercado</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="size-5 text-danger-c" />
            Crescendo Abaixo do Mercado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {crescendoMenosQueOmercado.length > 0 ? (
            <div className="space-y-3">
              {crescendoMenosQueOmercado.slice(0, 5).map((linha) => (
                <div key={linha.linha} className="border-l-4 border-danger-c pl-3">
                  <p className="font-semibold text-text-main">{linha.linha}</p>
                  <div className="text-sm mt-1 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-text-muted-c">Uni:</span>
                      <span className="font-bold text-text-main">{pctS(linha.crescUnipreco)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted-c">Merc:</span>
                      <span className="font-bold text-brand">{pctS(linha.crescMercado)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border-soft pt-1">
                      <span className="text-text-muted-c">Gap:</span>
                      <span className="font-bold text-danger-c">{(linha.gapCrescimento * 100).toFixed(1)}pp</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted-c">Todas linhas crescendo acima ou em linha com mercado</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
