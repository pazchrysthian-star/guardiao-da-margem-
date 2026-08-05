const fmtBR = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 })

export function R$(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return "-"
  return (v < 0 ? "-" : "") + "R$ " + fmtBR.format(Math.abs(v))
}

export function pctS(v: number | null | undefined, d = 2): string {
  if (v === null || v === undefined || isNaN(v)) return "-"
  return (v * 100).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }) + "%"
}

export function pp(v: number | null | undefined, d = 2): string {
  if (v === null || v === undefined || isNaN(v)) return "-"
  return (v > 0 ? "+" : "") + (v * 100).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }) + " pp"
}

// Formata um número que já é percentual (ex: 76.57 → "76,57%"), sem multiplicar por 100
export function pctFormat(v: number | null | undefined, d = 2): string {
  if (v === null || v === undefined || isNaN(v)) return "-"
  return v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }) + "%"
}

const MESES: Record<string, number> = {
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
  jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
}

// Extrai {ano, mesNum} de um label "Mai/2026" / "mai/2026". Retorna null se não reconhecer o formato.
export function parseMes(s: string): { ano: number; mesNum: number } | null {
  const m = String(s).toLowerCase().match(/([a-zç]{3})\/?(\d{4})/)
  if (!m) return null
  const mesNum = MESES[m[1]]
  if (!mesNum) return null
  return { ano: parseInt(m[2], 10), mesNum }
}

export function mesKey(s: string): number {
  const p = parseMes(s)
  return p ? p.ano * 100 + p.mesNum : 0
}

// Quantidade de dias do mês representado pelo label (ex: "Mai/2026" -> 31).
export function diasNoMes(s: string): number {
  const p = parseMes(s)
  if (!p) return 30
  return new Date(p.ano, p.mesNum, 0).getDate()
}
