import { useMemo } from "react"
import type { Fonte } from "@/lib/mercado"
import { crescimentoComparativoPorCategoria } from "@/lib/mercado"

export function TriMovelTable({ fonte }: { fonte: Fonte }) {
  const dados = useMemo(() => {
    return crescimentoComparativoPorCategoria("T3M", fonte)
  }, [fonte])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">TRI Móvel (T3M)</h3>
        <p className="text-xs text-slate-600">
          Crescimento trimestral móvel: últimos 3 meses vs. 3 meses anteriores
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Categoria</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Linha</th>
              <th className="px-3 py-2 text-center font-semibold text-slate-700">Cresc. Unipreço</th>
              <th className="px-3 py-2 text-center font-semibold text-slate-700">Cresc. Mercado (Bricks)</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((row) => (
              <tr key={row.linha} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-700">{row.categoriaIqvia}</td>
                <td className="px-3 py-2 font-medium text-slate-900">{row.linha}</td>
                <td className={`px-3 py-2 text-center font-semibold ${row.unipreco !== null && row.unipreco >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {row.unipreco !== null ? `${row.unipreco >= 0 ? "+" : ""}${(row.unipreco * 100).toFixed(2)}%` : "—"}
                </td>
                <td className={`px-3 py-2 text-center font-semibold ${row.mercado !== null && row.mercado >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {row.mercado !== null ? `${row.mercado >= 0 ? "+" : ""}${(row.mercado * 100).toFixed(2)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-500 space-y-1">
        <p>• <strong>Cresc. Unipreço:</strong> crescimento da Unipreço no trimestre móvel</p>
        <p>• <strong>Cresc. Mercado:</strong> crescimento do mercado (Bricks) no trimestre móvel</p>
        <p>• Valores positivos indicam crescimento; negativos indicam regressão</p>
      </div>
    </div>
  )
}
