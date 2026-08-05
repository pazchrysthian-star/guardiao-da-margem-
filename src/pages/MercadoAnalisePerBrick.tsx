import { useState, useMemo } from "react"
import bricksLinhaData from "@/data/saida_dashboard_brick/bricks_linha.json"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DadoBrick {
  id_brick: string
  brick: string
  mes: string
  canal: string
  linha: string
  venda: number
  unidades: number
}

type BricksData = DadoBrick[]

// Função para determinar tamanho de fonte baseado no valor
function getTamanhoDados(venda: number, maxVenda: number): string {
  const pct = venda / maxVenda
  if (pct >= 0.8) return "text-2xl font-bold"
  if (pct >= 0.5) return "text-xl font-semibold"
  if (pct >= 0.2) return "text-base font-medium"
  return "text-sm font-normal"
}

export function MercadoAnalisePerBrick() {
  const [mesSelecionado, setMesSelecionado] = useState<string>("")
  const [canalSelecionado, setCanalSelecionado] = useState<string>("SI")
  const [brickSelecionado, setBrickSelecionado] = useState<string>("")

  const dados = bricksLinhaData as BricksData

  // Meses únicos
  const meses = useMemo(() => {
    return Array.from(new Set(dados.map((d) => d.mes))).sort()
  }, [])

  const mesAtivo = mesSelecionado || (meses.length > 0 ? meses[meses.length - 1] : "")

  // Bricks únicos
  const bricks = useMemo(() => {
    return Array.from(new Set(dados.map((d) => d.brick))).sort()
  }, [])

  const brickAtivo = brickSelecionado || (bricks.length > 0 ? bricks[0] : "")

  // Filtrar dados
  const dadosFiltrados = useMemo(() => {
    return dados.filter(
      (d) => d.mes === mesAtivo && d.canal === canalSelecionado && d.brick === brickAtivo
    )
  }, [dados, mesAtivo, canalSelecionado, brickAtivo])

  // Calcular máximo para escala dinâmica
  const maxVenda = useMemo(() => {
    if (dadosFiltrados.length === 0) return 1
    return Math.max(...dadosFiltrados.map((d) => d.venda))
  }, [dadosFiltrados])

  // Total por linha
  const totaisPorLinha = useMemo(() => {
    const mapa: Record<string, { venda: number; unidades: number }> = {}

    dadosFiltrados.forEach((d) => {
      if (!mapa[d.linha]) {
        mapa[d.linha] = { venda: 0, unidades: 0 }
      }
      mapa[d.linha].venda += d.venda
      mapa[d.linha].unidades += d.unidades
    })

    return Object.entries(mapa)
      .map(([linha, vals]) => ({
        linha,
        venda: vals.venda,
        unidades: vals.unidades,
      }))
      .sort((a, b) => b.venda - a.venda)
  }, [dadosFiltrados])

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium">Brick</label>
          <Select value={brickAtivo} onValueChange={setBrickSelecionado}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {bricks.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI do Brick */}
      <Card>
        <CardHeader>
          <CardTitle>Venda Total - {brickAtivo}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            R$ {(totaisPorLinha.reduce((a, l) => a + l.venda, 0) / 1e6).toFixed(2)}M
          </div>
        </CardContent>
      </Card>

      {/* Tabela com tamanho dinâmico */}
      <Card>
        <CardHeader>
          <CardTitle>Venda por Linha (tamanho dinâmico)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {totaisPorLinha.map((item) => (
              <div
                key={item.linha}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <span className="font-medium text-sm">{item.linha}</span>
                <div className="text-right">
                  <div className={cn("tabular-nums", getTamanhoDados(item.venda, maxVenda))}>
                    R$ {(item.venda / 1e6).toFixed(2)}M
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.unidades.toLocaleString("pt-BR")} un
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabela tradicional */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Linha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Linha</th>
                  <th className="text-right py-2 px-2">Venda</th>
                  <th className="text-right py-2 px-2">Unidades</th>
                  <th className="text-right py-2 px-2">Ticket Médio</th>
                </tr>
              </thead>
              <tbody>
                {totaisPorLinha.map((item) => (
                  <tr key={item.linha} className="border-b hover:bg-slate-50">
                    <td className="py-2 px-2">{item.linha}</td>
                    <td className="text-right py-2 px-2">
                      R$ {(item.venda / 1e6).toFixed(2)}M
                    </td>
                    <td className="text-right py-2 px-2">
                      {item.unidades.toLocaleString("pt-BR")}
                    </td>
                    <td className="text-right py-2 px-2">
                      R$ {(item.venda / item.unidades).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 font-bold bg-gray-100">
                  <td className="py-2 px-2">TOTAL</td>
                  <td className="text-right py-2 px-2">
                    R$ {(totaisPorLinha.reduce((a, l) => a + l.venda, 0) / 1e6).toFixed(2)}M
                  </td>
                  <td className="text-right py-2 px-2">
                    {totaisPorLinha.reduce((a, l) => a + l.unidades, 0).toLocaleString("pt-BR")}
                  </td>
                  <td className="text-right py-2 px-2">
                    R${" "}
                    {(
                      totaisPorLinha.reduce((a, l) => a + l.venda, 0) /
                      totaisPorLinha.reduce((a, l) => a + l.unidades, 0)
                    ).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
