import type { MargemRow } from "@/lib/calc"

// Uma exclusão manual representa a contribuição de UM produto (ou um pequeno grupo)
// dentro de um combo Linha+Segmento+Mês, que deve ser retirada da avaliação.
// Necessário porque o xlsx importado já vem agregado por Linha+Segmento (o BI não
// exporta por produto), então não dá pra "filtrar um SKU" depois de importado —
// a subtração precisa ser cadastrada aqui com o valor exato daquele produto no mês.
export type ExclusaoProduto = {
  id: string
  produto: string // rótulo livre, só pra identificação na tela (ex: "Figurinha Panini Copa 2026")
  linha: string
  seg: string
  mes: string // "Jul/2026" — precisa bater exatamente com o valor de Ano/Mes do xlsx
  vd: number // venda do produto naquele mês, a subtrair
  mbr: number // margem R$ do produto naquele mês, a subtrair
  motivo?: string
}

// Subtrai cada exclusão da linha (linha+seg+mes) correspondente. Se a linha não existir
// mais na base (ex: mês removido), a exclusão é ignorada silenciosamente para aquele mês.
// Recalcula mbp a partir do vd/mbr resultantes. Nunca deixa vd negativo (clampa em 0).
//
// Proteção importante: se a venda cadastrada na exclusão for MAIOR que a venda atual
// do combo Linha+Segmento+Mês na base, a exclusão é IGNORADA (não aplicada) em vez de
// zerar a venda e sobrar margem. Isso acontece quando a base do BI é reprocessada/revisada
// depois que a exclusão foi cadastrada (valores antigos de venda/margem do produto não
// batem mais com o novo extrato) — aplicar mesmo assim gera venda zerada com margem
// sobrando, inflando a MB% para valores absurdos (ex: >200%). Use `exclusoesSemEfeito`
// para descobrir quais exclusões estão nessa situação e precisam ser recadastradas.
export function aplicarExclusoes(rows: MargemRow[], exclusoes: ExclusaoProduto[]): MargemRow[] {
  if (!exclusoes.length) return rows

  const porChave = new Map<string, { vd: number; mbr: number }>()
  for (const ex of exclusoes) {
    const k = ex.linha + "||" + ex.seg + "||" + ex.mes
    const acc = porChave.get(k) || { vd: 0, mbr: 0 }
    acc.vd += ex.vd
    acc.mbr += ex.mbr
    porChave.set(k, acc)
  }

  return rows.map((r) => {
    const k = r.linha + "||" + r.seg + "||" + r.mes
    const sub = porChave.get(k)
    if (!sub) return r
    if (sub.vd > r.vd + 0.01) return r // exclusão obsoleta: base foi revisada, não aplicar
    const vd = Math.max(0, r.vd - sub.vd)
    const mbr = r.mbr - sub.mbr
    const mbp = vd > 0 ? mbr / vd : 0
    return { ...r, vd, mbr, mbp }
  })
}

export type MotivoSemEfeito = "combo-nao-encontrado" | "venda-maior-que-base-atual"

// Quais exclusões cadastradas não tiveram efeito real, e por quê — para avisar o usuário:
// "combo-nao-encontrado": não existe mais essa Linha+Segmento+Mês na base (ex: mês removido)
// "venda-maior-que-base-atual": a base foi revisada e a venda do combo hoje é menor que o
// valor cadastrado na exclusão — precisa recadastrar com os números atuais, ou remover.
export function exclusoesSemEfeito(rows: MargemRow[], exclusoes: ExclusaoProduto[]): (ExclusaoProduto & { motivoSemEfeito: MotivoSemEfeito })[] {
  const vdPorChave = new Map<string, number>()
  rows.forEach((r) => { vdPorChave.set(r.linha + "||" + r.seg + "||" + r.mes, r.vd) })

  const resultado: (ExclusaoProduto & { motivoSemEfeito: MotivoSemEfeito })[] = []
  exclusoes.forEach((ex) => {
    const k = ex.linha + "||" + ex.seg + "||" + ex.mes
    if (!vdPorChave.has(k)) {
      resultado.push({ ...ex, motivoSemEfeito: "combo-nao-encontrado" })
    } else if (ex.vd > (vdPorChave.get(k) || 0) + 0.01) {
      resultado.push({ ...ex, motivoSemEfeito: "venda-maior-que-base-atual" })
    }
  })
  return resultado
}
