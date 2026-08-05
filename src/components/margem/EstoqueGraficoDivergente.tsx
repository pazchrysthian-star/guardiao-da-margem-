interface DadosGap {
  curva: string
  valor: number
}

export function EstoqueGraficoDivergente({ dados }: { dados: DadosGap[] }) {
  const maxValor = Math.max(...dados.map(d => Math.abs(d.valor)))
  const escala = maxValor > 0 ? 100 / maxValor : 1

  return (
    <div className="space-y-4">
      <svg viewBox="0 0 800 280" className="w-full" style={{ minHeight: '280px' }}>
        {/* Eixo horizontal com escala */}
        <defs>
          <pattern id="gridVertical" x="50" y="0" width="50" height="280" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="280" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2,2" />
          </pattern>
        </defs>

        {/* Grid background */}
        <rect width="800" height="280" fill="url(#gridVertical)" />

        {/* Linha central zero */}
        <line x1="400" y1="20" x2="400" y2="240" stroke="#0F172A" strokeWidth="2" />

        {/* Rótulos do eixo */}
        <text x="60" y="265" fontSize="12" fill="#64748B" textAnchor="middle">
          −R$ 8 mi
        </text>
        <text x="160" y="265" fontSize="12" fill="#64748B" textAnchor="middle">
          −R$ 4 mi
        </text>
        <text x="400" y="265" fontSize="12" fill="#0F172A" textAnchor="middle" fontWeight="bold">
          0
        </text>
        <text x="640" y="265" fontSize="12" fill="#64748B" textAnchor="middle">
          R$ 4 mi
        </text>
        <text x="740" y="265" fontSize="12" fill="#64748B" textAnchor="middle">
          R$ 8 mi
        </text>

        {/* Barras divergentes */}
        {dados.map((d, idx) => {
          const y = 40 + idx * 40
          const isNegativo = d.valor < 0
          const comprimento = (Math.abs(d.valor) * escala) / 10
          const cor = isNegativo ? (Math.abs(d.valor) > 6 ? '#E11D2E' : '#FF6B6B') : '#00875A'

          return (
            <g key={d.curva}>
              {/* Rótulo da curva */}
              <text x="15" y={y + 6} fontSize="13" fill="#0F172A" fontWeight="600">
                {d.curva}
              </text>

              {/* Barra negativa (esquerda) */}
              {isNegativo && (
                <rect
                  x={400 - comprimento}
                  y={y - 8}
                  width={comprimento}
                  height="16"
                  fill={cor}
                  rx="3"
                />
              )}

              {/* Barra positiva (direita) */}
              {!isNegativo && (
                <rect
                  x="400"
                  y={y - 8}
                  width={comprimento}
                  height="16"
                  fill={cor}
                  rx="3"
                />
              )}

              {/* Valor */}
              <text
                x={isNegativo ? 400 - comprimento - 8 : 400 + comprimento + 8}
                y={y + 5}
                fontSize="12"
                fill={cor}
                fontWeight="600"
                textAnchor={isNegativo ? 'end' : 'start'}
              >
                {isNegativo ? '−' : '+'}R$ {Math.abs(d.valor).toFixed(2)} mi
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
