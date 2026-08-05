import { useState, useMemo } from "react"
import mercadoLinhaData from "@/data/iqvia/mercado_linha.json"
import mercadoClasseData from "@/data/iqvia/mercado_classe.json"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DadoMercado {
  escopo: string
  mes: string
  canal: string
  linha?: string
  classe?: string
  venda: number
  unidades: number
}

type MercadoData = DadoMercado[]

export function MercadoAnalise() {
  const [mesSelecionado, setMesSelecionado] = useState<string>("")
  const [canalSelecionado, setCanalSelecionado] = useState<string>("TOTAL")
  const [filtrarBricksInativos, setFiltrarBricksInativos] = useState<boolean>(true)
  const [abaAtiva, setAbaAtiva] = useState<"linha" | "classe">("linha")

  // Dados tipados
  const dadosLinha = mercadoLinhaData as MercadoData
  const dadosClasse = mercadoClasseData as MercadoData

  // Meses únicos
  const meses = useMemo(() => {
    const uniqs = Array.from(new Set(dadosLinha.map((d) => d.mes))).sort()
    return uniqs
  }, [])

  // Inicia com o último mês
  const mesInicial = useMemo(() => {
    if (meses.length > 0 && !mesSelecionado) {
      return meses[meses.length - 1]
    }
    return mesSelecionado || ""
  }, [meses, mesSelecionado])

  const mesAtivo = mesSelecionado || mesInicial

  // Filtrar dados por mês, canal e bricks selecionados
  const linhasFiltradas = useMemo(() => {
    return dadosLinha.filter((d) => {
      if (d.mes !== mesAtivo || d.canal !== canalSelecionado) return false
      // Se o escopo é BRICKS e filtramos bricks inativos, pular
      if (filtrarBricksInativos && d.escopo === "BRICKS") return false
      return true
    })
  }, [dadosLinha, mesAtivo, canalSelecionado, filtrarBricksInativos])

  const classesFiltradas = useMemo(() => {
    return dadosClasse.filter((d) => {
      if (d.mes !== mesAtivo || d.canal !== canalSelecionado) return false
      // Se o escopo é BRICKS e filtramos bricks inativos, pular
      if (filtrarBricksInativos && d.escopo === "BRICKS") return false
      return true
    })
  }, [dadosClasse, mesAtivo, canalSelecionado, filtrarBricksInativos])

  // Calcular KPIs
  const kpis = useMemo(() => {
    const unipreco = linhasFiltradas
      .filter((d) => d.escopo === "UNIPRECO")
      .reduce((acc, d) => acc + d.venda, 0)

    const bricks = linhasFiltradas
      .filter((d) => d.escopo === "BRICKS")
      .reduce((acc, d) => acc + d.venda, 0)

    const share = bricks > 0 ? (unipreco / bricks) * 100 : 0

    return {
      vendaUnipreco: unipreco,
      vendaMercado: bricks,
      share: share.toFixed(2),
    }
  }, [linhasFiltradas])

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium">Mês</label>
          <Select value={mesAtivo} onValueChange={setMesSelecionado}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meses.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium">Canal</label>
          <Select value={canalSelecionado} onValueChange={setCanalSelecionado}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SI">Sell In</SelectItem>
              <SelectItem value="SO">Sell Out</SelectItem>
              <SelectItem value="TOTAL">Total (SI+SO)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="filtrar-bricks"
            checked={filtrarBricksInativos}
            onChange={(e) => setFiltrarBricksInativos(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <label htmlFor="filtrar-bricks" className="text-sm font-medium cursor-pointer">
            Excluir bricks inativos
          </label>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Venda Unipreço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(kpis.vendaUnipreco / 1e6).toFixed(1)}M
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mercado (Bricks)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(kpis.vendaMercado / 1e9).toFixed(1)}B
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Share Unipreço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.share}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Abas de análise */}
      <div className="space-y-4">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setAbaAtiva("linha")}
            className={cn(
              "px-4 py-2 font-medium text-sm transition-colors border-b-2",
              abaAtiva === "linha"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            )}
          >
            Análise por Linha
          </button>
          <button
            onClick={() => setAbaAtiva("classe")}
            className={cn(
              "px-4 py-2 font-medium text-sm transition-colors border-b-2",
              abaAtiva === "classe"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            )}
          >
            Análise por Classe Terapêutica
          </button>
        </div>

        {abaAtiva === "linha" && <AnaliseLinha dados={linhasFiltradas} />}
        {abaAtiva === "classe" && <AnaliseClasse dados={classesFiltradas} />}
      </div>
    </div>
  )
}

function AnaliseLinha({ dados }: { dados: MercadoData }) {
  // Agrupar por linha e calcular agregados
  const linhas = useMemo(() => {
    const mapa: Record<
      string,
      { linha: string; unipreco: number; mercado: number }
    > = {}

    dados.forEach((d) => {
      const linha = d.linha || "Sem categoria"
      if (!mapa[linha]) {
        mapa[linha] = { linha, unipreco: 0, mercado: 0 }
      }

      if (d.escopo === "UNIPRECO") {
        mapa[linha].unipreco += d.venda
      } else if (d.escopo === "BRICKS") {
        mapa[linha].mercado += d.venda
      }
    })

    return Object.values(mapa)
      .map((item) => ({
        ...item,
        share: item.mercado > 0 ? ((item.unipreco / item.mercado) * 100).toFixed(2) : "0.00",
      }))
      .sort((a, b) => parseFloat(b.share) - parseFloat(a.share))
  }, [dados])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativo por Linha</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Linha</th>
                <th className="text-right py-2 px-2">Unipreço</th>
                <th className="text-right py-2 px-2">Mercado</th>
                <th className="text-right py-2 px-2">Share %</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => (
                <tr key={linha.linha} className="border-b hover:bg-slate-50">
                  <td className="py-2 px-2">{linha.linha}</td>
                  <td className="text-right py-2 px-2">
                    R$ {(linha.unipreco / 1e6).toFixed(1)}M
                  </td>
                  <td className="text-right py-2 px-2">
                    R$ {(linha.mercado / 1e9).toFixed(1)}B
                  </td>
                  <td className="text-right py-2 px-2 font-semibold">
                    {linha.share}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function AnaliseClasse({ dados }: { dados: MercadoData }) {
  // Agrupar por classe e calcular agregados
  const classes = useMemo(() => {
    const mapa: Record<
      string,
      { classe: string; unipreco: number; mercado: number }
    > = {}

    dados.forEach((d) => {
      const classe = d.classe || "Sem categoria"
      if (classe === "-") return // Pula agregado geral

      if (!mapa[classe]) {
        mapa[classe] = { classe, unipreco: 0, mercado: 0 }
      }

      if (d.escopo === "UNIPRECO") {
        mapa[classe].unipreco += d.venda
      } else if (d.escopo === "BRICKS") {
        mapa[classe].mercado += d.venda
      }
    })

    return Object.values(mapa)
      .map((item) => ({
        ...item,
        share: item.mercado > 0 ? ((item.unipreco / item.mercado) * 100).toFixed(2) : "0.00",
      }))
      .sort((a, b) => parseFloat(b.share) - parseFloat(a.share))
      .slice(0, 30) // Top 30
  }, [dados])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativo por Classe Terapêutica (Top 30)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Classe</th>
                <th className="text-right py-2 px-2">Unipreço</th>
                <th className="text-right py-2 px-2">Mercado</th>
                <th className="text-right py-2 px-2">Share %</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((classe) => (
                <tr key={classe.classe} className="border-b hover:bg-slate-50">
                  <td className="py-2 px-2 text-xs">{classe.classe}</td>
                  <td className="text-right py-2 px-2">
                    R$ {(classe.unipreco / 1e6).toFixed(1)}M
                  </td>
                  <td className="text-right py-2 px-2">
                    R$ {(classe.mercado / 1e9).toFixed(1)}B
                  </td>
                  <td className="text-right py-2 px-2 font-semibold">
                    {classe.share}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
