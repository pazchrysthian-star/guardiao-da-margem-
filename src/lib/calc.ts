export type MargemRow = {
  linha: string
  seg: string
  mes: string
  vd: number
  mbp: number
  mbr: number
  desc: number
}

export type Grupo = "MD" | "NM" | "OU"

export function grupo(linha: string): Grupo {
  if (linha.startsWith("NÃO_MEDIC")) return "NM"
  if (/^(RX|MIP)/.test(linha)) return "MD"
  return "OU"
}

type GAgg = { v: number; m: number; r: number }

type LinhaAgg = {
  linha: string
  g: Grupo
  vdB: number; vdA: number; vdProj: number
  mbrB: number; mbrA: number; mbrProj: number
  mbpB: number; mbpA: number; mbpProj: number
  pesoB: number; pesoA: number; pesoProj: number
  dPeso: number; dMbr: number
}

export type SegRow = {
  linha: string; seg: string; g: Grupo
  vdB: number; vdA: number; mbpB: number; mbpA: number; mbrA: number; mbrB: number
  pesoA: number; dmb: number; taxa: number; mix: number; imp: number; ganho: number
}

export type CalcResult = {
  mBase: string; mAt: string; diasDec: number; diasTot: number
  segs: SegRow[]; linhas: LinhaAgg[]
  vdB: number; mbB: number; vdA: number; mbA: number; vdAProj: number; mbAProj: number
  rB: number; rA: number; rAProj: number
  MD_B: GAgg; NM_B: GAgg; MD_A: GAgg; NM_A: GAgg; MD_Proj: GAgg; NM_Proj: GAgg
}

type AggMap = Record<string, { linha: string; seg: string; vd: number; mbr: number; mbp: number }>

function aggBySegKey(rows: MargemRow[], mes: string, proj: boolean, fator: number): AggMap {
  const map: AggMap = {}
  rows.filter((r) => r.mes === mes).forEach((r) => {
    const k = r.linha + "||" + r.seg
    if (!map[k]) map[k] = { linha: r.linha, seg: r.seg, vd: 0, mbr: 0, mbp: 0 }
    map[k].vd += r.vd
    map[k].mbr += r.mbr
  })
  if (proj) Object.values(map).forEach((o) => { o.vd *= fator; o.mbr *= fator })
  Object.values(map).forEach((o) => { o.mbp = o.vd ? o.mbr / o.vd : 0 })
  return map
}

export function calc(rows: MargemRow[], mBase: string, mAt: string, diasDec: number, diasTot: number): CalcResult {
  const fator = diasDec > 0 ? diasTot / diasDec : 1

  const B = aggBySegKey(rows, mBase, false, fator)
  const A = aggBySegKey(rows, mAt, false, fator)
  const AProj = aggBySegKey(rows, mAt, true, fator)

  const keys = Array.from(new Set([...Object.keys(B), ...Object.keys(A)]))
  const vdB = Object.values(B).reduce((s, o) => s + o.vd, 0)
  const mbB = Object.values(B).reduce((s, o) => s + o.mbr, 0)
  const vdA = Object.values(A).reduce((s, o) => s + o.vd, 0)
  const mbA = Object.values(A).reduce((s, o) => s + o.mbr, 0)
  const vdAProj = Object.values(AProj).reduce((s, o) => s + o.vd, 0)
  const mbAProj = Object.values(AProj).reduce((s, o) => s + o.mbr, 0)

  const rB = vdB ? mbB / vdB : 0
  const rA = vdA ? mbA / vdA : 0
  const rAProj = vdAProj ? mbAProj / vdAProj : 0

  const segs: SegRow[] = keys.map((k) => {
    const b = B[k] || { linha: "", seg: "", vd: 0, mbr: 0, mbp: 0 }
    const a = A[k] || { linha: "", seg: "", vd: 0, mbr: 0, mbp: 0 }
    const [linha, seg] = k.split("||")
    const pA = vdA ? a.vd / vdA : 0
    const pB = vdB ? b.vd / vdB : 0
    const taxa = pA * (a.mbp - b.mbp)
    const mix = (pA - pB) * (b.mbp - rB)
    return {
      linha, seg, g: grupo(linha),
      vdB: b.vd, vdA: a.vd, mbpB: b.mbp, mbpA: a.mbp, mbrA: a.mbr, mbrB: b.mbr,
      pesoA: pA, dmb: a.mbp - b.mbp, taxa, mix, imp: taxa + mix,
      ganho: a.vd > 0 && a.mbp < b.mbp ? a.vd * (b.mbp - a.mbp) : 0,
    }
  })

  const gAgg = (g: Grupo, usA: boolean): GAgg => {
    const d = usA ? A : B
    const bs = Object.values(d).filter((o) => grupo(o.linha) === g)
    const v = bs.reduce((s, o) => s + o.vd, 0)
    const m = bs.reduce((s, o) => s + o.mbr, 0)
    return { v, m, r: v ? m / v : 0 }
  }
  const gAggProj = (g: Grupo): GAgg => {
    const bs = Object.values(AProj).filter((o) => grupo(o.linha) === g)
    const v = bs.reduce((s, o) => s + o.vd, 0)
    const m = bs.reduce((s, o) => s + o.mbr, 0)
    return { v, m, r: v ? m / v : 0 }
  }

  const aggByLinha = (usar: "base" | "atual" | "proj") => {
    const d = usar === "base" ? B : usar === "atual" ? A : AProj
    const linMap: Record<string, { linha: string; vd: number; mbr: number }> = {}
    Object.values(d).forEach((o) => {
      if (!linMap[o.linha]) linMap[o.linha] = { linha: o.linha, vd: 0, mbr: 0 }
      linMap[o.linha].vd += o.vd
      linMap[o.linha].mbr += o.mbr
    })
    return Object.values(linMap).map((o) => ({ ...o, mbp: o.vd ? o.mbr / o.vd : 0 }))
  }

  const linB = aggByLinha("base"), linA = aggByLinha("atual"), linProj = aggByLinha("proj")
  const linhas: LinhaAgg[] = linB.map((b) => {
    const a = linA.find((x) => x.linha === b.linha) || { vd: 0, mbr: 0, mbp: 0 }
    const p = linProj.find((x) => x.linha === b.linha) || { vd: 0, mbr: 0, mbp: 0 }
    const pesoB = vdB ? b.vd / vdB : 0
    const pesoA = vdA ? a.vd / vdA : 0
    const pesoProj = vdAProj ? p.vd / vdAProj : 0
    return {
      linha: b.linha, g: grupo(b.linha),
      vdB: b.vd, vdA: a.vd, vdProj: p.vd,
      mbrB: b.mbr, mbrA: a.mbr, mbrProj: p.mbr,
      mbpB: b.mbp, mbpA: a.mbp, mbpProj: p.mbp,
      pesoB, pesoA, pesoProj, dPeso: pesoProj - pesoB, dMbr: -b.mbr - (p.vd * b.mbp),
    }
  }).concat(
    linA.filter((a) => !linB.find((b) => b.linha === a.linha)).map((a) => {
      const p = linProj.find((x) => x.linha === a.linha) || { vd: 0, mbr: 0, mbp: 0 }
      const pesoA = vdA ? a.vd / vdA : 0
      const pesoProj = vdAProj ? p.vd / vdAProj : 0
      return {
        linha: a.linha, g: grupo(a.linha),
        vdB: 0, vdA: a.vd, vdProj: p.vd,
        mbrB: 0, mbrA: a.mbr, mbrProj: p.mbr,
        mbpB: 0, mbpA: a.mbp, mbpProj: p.mbp,
        pesoB: 0, pesoA, pesoProj, dPeso: pesoProj, dMbr: p.mbr,
      }
    })
  )

  return {
    mBase, mAt, diasDec, diasTot,
    segs, linhas, vdB, mbB, vdA, mbA, vdAProj, mbAProj, rB, rA, rAProj,
    MD_B: gAgg("MD", false), NM_B: gAgg("NM", false),
    MD_A: gAgg("MD", true), NM_A: gAgg("NM", true),
    MD_Proj: gAggProj("MD"), NM_Proj: gAggProj("NM"),
  }
}
