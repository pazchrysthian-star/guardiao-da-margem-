// scripts/atualizar.mjs
// Uso: coloque o .xlsx novo e/ou o "metas-para-publicar.json" (exportado pelo botão
// "Exportar para publicar" na tela de Metas) dentro da pasta "dados" e rode:
//   npm run atualizar
// O script converte o xlsx para o formato esperado (sobrescreve src/data/seed.json),
// publica as metas (sobrescreve src/data/metasPadrao.json) se houver o arquivo,
// e roda `vercel --prod`.

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs"
import { resolve, join, extname, basename } from "node:path"
import { spawnSync } from "node:child_process"
import * as XLSX from "xlsx"

const ROOT = resolve(import.meta.dirname, "..")
const PASTA_ENTRADA = join(ROOT, "dados")
const SEED_PATH = join(ROOT, "src", "data", "seed.json")
const DIARIO_PATH = join(ROOT, "src", "data", "diario.json")
const METAS_PATH = join(ROOT, "src", "data", "metasPadrao.json")
const METAS_ARQUIVO_ESPERADO = "metas-para-publicar.json"

function listarXlsx() {
  return readdirSync(PASTA_ENTRADA)
    .filter((f) => extname(f).toLowerCase() === ".xlsx" && !f.startsWith("~$"))
    .map((f) => {
      const full = join(PASTA_ENTRADA, f)
      return { file: full, mtime: statSync(full).mtimeMs }
    })
    .sort((a, b) => b.mtime - a.mtime)
    .map((o) => o.file)
}

// Identifica o layout do arquivo pelo cabeçalho:
// - "mensal": colunas Linha, Segmento, Ano/Mes, VD Líquida, MB %, MB R$ (uma linha por registro)
// - "diario": linha 1 com datas repetidas a cada 3 colunas, linha 2 com VD Líquida / % Part. Venda / MB %
function detectarTipo(path) {
  const buf = readFileSync(path)
  const wb = XLSX.read(buf, { type: "buffer" })
  const ws = wb.Sheets["Tela"] || wb.Sheets[wb.SheetNames[0]]
  const matriz = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false })
  const linha1 = (matriz[0] || []).map((v) => String(v ?? "").trim())
  const linha2 = (matriz[1] || []).map((v) => String(v ?? "").trim())

  if (linha1.includes("Ano/Mes") && linha1.includes("Segmento")) return { tipo: "mensal", wb, ws }
  const pareceDiario = linha2.some((v) => v === "% Part. Venda") && linha1.some((v) => /^\d{2}\/\d{2}\/\d{4}$/.test(v))
  if (pareceDiario) {
    // raw:true preserva os números como estão na planilha (0.2812), evitando que o SheetJS
    // devolva percentuais já formatados como texto ("28.12%") e inflacione o valor em 100x.
    const matrizCrua = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true })
    return { tipo: "diario", wb, ws, matriz: matrizCrua }
  }
  return { tipo: "desconhecido", wb, ws }
}

function acharXlsxMaisRecente() {
  const candidatos = listarXlsx()
  if (!candidatos.length) {
    console.error(`Nenhum .xlsx encontrado em "${PASTA_ENTRADA}".`)
    console.error("Coloque o arquivo novo nessa pasta e rode 'npm run atualizar' de novo.")
    process.exit(1)
  }
  return candidatos[0]
}

function numeroOuNulo(v) {
  if (v === null || v === undefined) return null
  if (typeof v === "number") return v
  const s = String(v).trim()
  if (s === "" || s === "-" || s === "—") return null
  // Só normaliza separadores quando o texto usa vírgula como decimal (padrão BR).
  // Se vier só com ponto (ex: "0.2803"), o ponto JÁ é o separador decimal — não pode ser removido.
  const semSimbolos = s.replace(/R\$/g, "").replace(/%/g, "").trim()
  const limpo = semSimbolos.includes(",")
    ? semSimbolos.replace(/\./g, "").replace(",", ".")
    : semSimbolos
  const n = Number(limpo)
  return Number.isFinite(n) ? n : null
}

// Converte o layout diário (datas no cabeçalho, 3 métricas por data) para registros planos
function converterXlsxDiario(matriz) {
  const linha1 = matriz[0] || []

  // O cabeçalho pode trazer a data como texto "01/07/2026", como Date, ou como serial do Excel
  function normalizarData(v) {
    if (v === null || v === undefined) return null
    if (v instanceof Date) {
      const d = String(v.getDate()).padStart(2, "0")
      const m = String(v.getMonth() + 1).padStart(2, "0")
      return `${v.getFullYear()}-${m}-${d}`
    }
    if (typeof v === "number") {
      const parsed = XLSX.SSF?.parse_date_code?.(v)
      if (parsed && parsed.y) {
        return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`
      }
      return null
    }
    const s = String(v).trim()
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    return m ? `${m[3]}-${m[2]}-${m[1]}` : null
  }

  const colunasData = []
  linha1.forEach((v, idx) => {
    const data = normalizarData(v)
    if (data) colunasData.push({ idx, data })
  })

  const registros = []
  for (let r = 2; r < matriz.length; r++) {
    const linha = String(matriz[r]?.[0] ?? "").trim()
    if (!linha) continue
    colunasData.forEach(({ idx, data }) => {
      const vd = numeroOuNulo(matriz[r]?.[idx])
      if (vd === null) return
      const part = numeroOuNulo(matriz[r]?.[idx + 1]) ?? 0
      const mbp = numeroOuNulo(matriz[r]?.[idx + 2]) ?? 0
      registros.push({ linha, data, vd, part, mbp })
    })
  }
  return registros
}

function converterXlsx(path) {
  const buf = readFileSync(path)
  const wb = XLSX.read(buf, { type: "buffer" })
  const ws = wb.Sheets["Tela"] || wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json(ws, { defval: null })

  const rows = raw
    .filter((r) => r["Ano/Mes"] && r["Linha"] && r["Linha"] !== "Total" && r["Segmento"])
    .map((r) => ({
      linha: String(r["Linha"]).trim(),
      seg: String(r["Segmento"]).trim(),
      mes: String(r["Ano/Mes"]).trim(),
      vd: Number(r["VD Líquida"]) || 0,
      mbp: Number(r["MB %"]) || 0,
      mbr: Number(r["MB R$"]) || 0,
      desc: Number(r["% Desc"]) || 0,
    }))

  if (!rows.length) {
    console.error("O arquivo foi lido, mas nenhuma linha válida foi encontrada.")
    console.error('Confira se tem as colunas: Linha, Segmento, Ano/Mes, VD Líquida, MB %, MB R$, % Desc.')
    process.exit(1)
  }
  return rows
}

function acharArquivoMetas() {
  const candidatos = readdirSync(PASTA_ENTRADA).filter(
    (f) => f.toLowerCase() === METAS_ARQUIVO_ESPERADO || f.toLowerCase().startsWith("metas-para-publicar")
  )
  if (!candidatos.length) return null
  // se tiver mais de um (ex: "metas-para-publicar (1).json"), pega o mais recente
  const full = candidatos
    .map((f) => ({ file: join(PASTA_ENTRADA, f), mtime: statSync(join(PASTA_ENTRADA, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)[0].file
  return full
}

function validarMetas(conteudo) {
  if (typeof conteudo.metaVendaTotal !== "number" || !Array.isArray(conteudo.metas)) return false
  return conteudo.metas.every(
    (m) => typeof m.linha === "string" && typeof m.metaParticipacao === "number" && typeof m.metaMB === "number"
  )
}

function rodar(cmd, args) {
  console.log(`\n> ${cmd} ${args.join(" ")}`)
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: true, cwd: ROOT })
  if (r.status !== 0) {
    console.error(`Comando falhou: ${cmd} ${args.join(" ")}`)
    process.exit(r.status || 1)
  }
}

// 1) Bases .xlsx — processa TODOS os arquivos da pasta, roteando pelo layout detectado.
//    Aceita a base mensal (Linha/Segmento/Ano-Mes) e a base diária (datas no cabeçalho).
const arquivos = listarXlsx()
if (!arquivos.length) {
  console.error(`Nenhum .xlsx encontrado em "${PASTA_ENTRADA}".`)
  console.error("Coloque o arquivo novo nessa pasta e rode 'npm run atualizar' de novo.")
  process.exit(1)
}

let atualizouMensal = false
let atualizouDiario = false

for (const arquivo of arquivos) {
  const info = detectarTipo(arquivo)
  if (info.tipo === "mensal" && !atualizouMensal) {
    console.log(`Lendo base mensal: ${basename(arquivo)}`)
    const rows = converterXlsx(arquivo)
    console.log(`${rows.length} linhas válidas encontradas.`)
    writeFileSync(SEED_PATH, JSON.stringify(rows))
    console.log(`Dados-semente atualizados em ${SEED_PATH}`)
    atualizouMensal = true
  } else if (info.tipo === "diario" && !atualizouDiario) {
    console.log(`\nLendo base diária: ${basename(arquivo)}`)
    const registros = converterXlsxDiario(info.matriz)
    if (!registros.length) {
      console.error("A base diária foi lida, mas nenhum registro válido foi encontrado — ignorando.")
    } else {
      const dias = new Set(registros.map((r) => r.data))
      writeFileSync(DIARIO_PATH, JSON.stringify(registros))
      console.log(`${registros.length} registros diários (${dias.size} dias) atualizados em ${DIARIO_PATH}`)
      atualizouDiario = true
    }
  } else if (info.tipo === "desconhecido") {
    console.log(`Ignorando ${basename(arquivo)}: layout não reconhecido (nem mensal, nem diário).`)
  }
}

if (!atualizouMensal) {
  console.log("\nNenhuma base mensal nova encontrada — mantendo os dados-semente anteriores.")
}
if (!atualizouDiario && existsSync(DIARIO_PATH)) {
  console.log("Nenhuma base diária nova encontrada — mantendo a série diária anterior.")
}

// 2) Metas por linha (.json exportado da tela) — opcional
const arquivoMetas = acharArquivoMetas()
if (arquivoMetas) {
  console.log(`\nLendo metas: ${basename(arquivoMetas)}`)
  const conteudo = JSON.parse(readFileSync(arquivoMetas, "utf-8"))
  if (!validarMetas(conteudo)) {
    console.error("O arquivo de metas não está no formato esperado — ignorando (a base de vendas já foi atualizada normalmente).")
  } else {
    if (!conteudo.publicadoEm) conteudo.publicadoEm = new Date().toISOString()
    writeFileSync(METAS_PATH, JSON.stringify(conteudo, null, 2))
    console.log(`Metas publicadas em ${METAS_PATH} (${conteudo.metas.length} linhas, meta de venda R$ ${conteudo.metaVendaTotal.toLocaleString("pt-BR")})`)
  }
} else if (existsSync(METAS_PATH)) {
  console.log("\nNenhum arquivo de metas novo encontrado em dados/ — mantendo as metas publicadas anteriormente.")
}

rodar("vercel", ["--prod"])

console.log("\nPronto! O link online já está atualizado.")
