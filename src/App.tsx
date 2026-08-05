import { useState } from "react"
import { useMargem } from "@/hooks/useMargem"
import { useSimulador } from "@/hooks/useSimulador"
import { UploadZone } from "@/components/margem/UploadZone"
import { ExclusoesCard } from "@/components/margem/ExclusoesCard"
import { KpiRow } from "@/components/margem/KpiRow"
import { MargNomGrid } from "@/components/margem/MargNomGrid"
import { BridgeRCard } from "@/components/margem/BridgeRCard"
import { ParticipacaoCard } from "@/components/margem/ParticipacaoCard"
import { BridgePctCard } from "@/components/margem/BridgePctCard"
import { LinhasTable } from "@/components/margem/LinhasTable"
import { OfensoresTable, AtaqueTable } from "@/components/margem/OfensoresAtaque"
import { SimuladorTable } from "@/components/margem/SimuladorResult"
import { FiltersCard } from "@/components/margem/FiltersCard"
import { SimuladorKpis } from "@/components/margem/SimuladorKpisNovo"
import { BridgeChart } from "@/components/margem/BridgeChart"
import { MetasLinhaCard } from "@/components/margem/MetasLinhaCard"
import { ResumoExecutivo } from "@/components/margem/ResumoExecutivo"
import { ImpactoMetaPanel } from "@/components/margem/ImpactoMetaPanel"
import { DecomposicaoGapPanel } from "@/components/margem/DecomposicaoGapPanel"
import { TendenciaMB7DiasCard } from "@/components/margem/TendenciaMB7DiasCard"
import { RecuperacaoNecessariaCard } from "@/components/margem/RecuperacaoNecessariaCard"
import { SimuladorDescontoCard } from "@/components/margem/SimuladorDescontoCard"
import { GapParticipacaoCard } from "@/components/margem/GapParticipacaoCard"
import { GapDermocosmeticosSection } from "@/components/margem/GapDermocosmeticosSection"
import { ShareUnificadoTable } from "@/components/margem/ShareUnificadoTable"
import { EvolucaoAcumuladaSelector } from "@/components/margem/EvolucaoAcumuladaSelector"
import { RegrasShareMercado } from "@/components/margem/RegrasShareMercado"
import { EstoqueCard } from "@/components/margem/EstoqueCard"
import { MesSelector, TendenciaCard } from "@/components/margem/TendenciaCard"
import { HeatmapLinhaMesCard } from "@/components/margem/HeatmapLinhaMesCard"
import { EvolucaoComparativaChart } from "@/components/margem/EvolucaoComparativaChart"
import { CrescimentoTable } from "@/components/margem/CrescimentoTable"
import { ShareMensalTable } from "@/components/margem/ShareMensalTable"
import { MixVendasChart } from "@/components/margem/MixVendasChart"
import { MercadoAnalise } from "@/pages/MercadoAnalise"
import { MercadoAnalisePerBrick } from "@/pages/MercadoAnalisePerBrick"
import type { Fonte as MercadoFonte } from "@/lib/mercado"
import { useTendencia } from "@/hooks/useTendencia"
import { cn } from "@/lib/utils"
import {
  Home, BarChart3, Target, LogOut, Globe,
  CalendarClock, Download, ChevronDown, Upload, TrendingUp,
} from "lucide-react"

type Aba = "bridge" | "simulador" | "tendencia" | "mercado" | "mercado-analise" | "mercado-brick" | "desconto" | "estoque"

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-11 place-items-center rounded-[12px] transition-colors",
        active ? "bg-brand text-white" : "text-text-muted-c hover:bg-brand-soft hover:text-brand"
      )}
    >
      {icon}
    </button>
  )
}

function MobileNavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex min-w-[64px] flex-col items-center gap-0.5 rounded-[10px] px-2 py-1.5 text-[10.5px] font-semibold transition-colors",
        active ? "text-brand" : "text-text-muted-c"
      )}
    >
      {icon}
      {label}
    </button>
  )
}

export default function App() {
  const d = useMargem()
  const sim = useSimulador(d.rows, d.mAt, d.diasDec, d.diasTot)
  const tend = useTendencia(d.rows, d.meses)
  const [aba, setAba] = useState<Aba>("simulador")
  const [mostrarUpload, setMostrarUpload] = useState(false)
  const [fonteMercado, setFonteMercado] = useState<MercadoFonte>("COM_GLP1")
  const [linhaSelecionada, setLinhaSelecionada] = useState<string | null>(null)

  const agora = new Date()
  const atualizadoEm = agora.toLocaleDateString("pt-BR") + " " +
    agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="flex min-h-screen bg-[--bg-page]">
      {/* ===== Sidebar (desktop) ===== */}
      <aside className="sidebar-premium print:hidden sticky top-0 hidden h-screen w-[92px] shrink-0 flex-col items-center py-5 sm:flex">
        <div className="mb-8 grid size-12 place-items-center rounded-[15px] bg-white text-xl font-black text-brand shadow-lg shadow-black/10" aria-label="Unipreço">U</div>
        <nav aria-label="Navegação principal" className="flex flex-col gap-2.5">
          <SidebarItem icon={<Home className="size-5" />} label="Início — Simulador de Meta" active={aba === "simulador"} onClick={() => setAba("simulador")} />
          <SidebarItem icon={<BarChart3 className="size-5" />} label="Bridge de Margem" active={aba === "bridge"} onClick={() => setAba("bridge")} />
          <SidebarItem icon={<Target className="size-5" />} label="Simulador de Meta" onClick={() => setAba("simulador")} />
          <SidebarItem icon={<TrendingUp className="size-5" />} label="Tendência Mensal" active={aba === "tendencia"} onClick={() => setAba("tendencia")} />
          <SidebarItem icon={<Globe className="size-5" />} label="Participação de Mercado (IQVIA)" active={aba === "mercado"} onClick={() => setAba("mercado")} />
          {/* <SidebarItem icon={<Globe className="size-5" />} label="Mercado - Análise" active={aba === "mercado-analise"} onClick={() => setAba("mercado-analise")} /> */}
          {/* <SidebarItem icon={<Globe className="size-5" />} label="Mercado - Por Brick" active={aba === "mercado-brick"} onClick={() => setAba("mercado-brick")} /> */}
          {/* <SidebarItem icon={<Percent className="size-5" />} label="Simulador de Desconto" active={aba === "desconto"} onClick={() => setAba("desconto")} /> */}
          <SidebarItem icon={<Upload className="size-5" />} label="Cobertura de Estoque" active={aba === "estoque"} onClick={() => setAba("estoque")} />
          <SidebarItem icon={<Upload className="size-5" />} label="Importar dados" onClick={() => setMostrarUpload((v) => !v)} />
          {/* <SidebarItem icon={<Bell className="size-5" />} label="Notificações" /> */}
          {/* <SidebarItem icon={<Settings className="size-5" />} label="Configurações" /> */}
        </nav>
        <div className="mt-auto">
          <SidebarItem icon={<LogOut className="size-5" />} label="Sair" />
        </div>
      </aside>

      {/* ===== Conteúdo principal ===== */}
      <div className="min-w-0 flex-1 bg-[radial-gradient(circle_at_top_right,rgba(0,135,90,0.06),transparent_28%)]">
        {/* Cabeçalho */}
        <header className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-3 border-b border-white/60 bg-[rgba(245,247,250,0.88)] px-4 pb-4 pt-5 backdrop-blur-xl sm:items-center sm:gap-4 sm:px-6 sm:pt-6 lg:px-9">
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold leading-tight text-text-main sm:text-[28px] lg:text-[32px]">
              {aba === "simulador" ? "Simulador de Meta" : aba === "tendencia" ? "Tendência Mensal" : aba === "mercado" ? "Participação de Mercado" : aba === "mercado-analise" ? "Mercado - Análise" : aba === "mercado-brick" ? "Mercado - Por Brick" : aba === "desconto" ? "Simulador de Desconto" : aba === "estoque" ? "Cobertura de Estoque" : "Bridge de Margem"}
            </h1>
            <p className="mt-0.5 text-[13px] text-text-muted-c sm:text-[15px]">
              {aba === "simulador"
                ? "Acompanhamento da projeção de margem e impacto das metas da rede"
                : aba === "tendencia"
                ? "Compare o realizado parcial com a projeção de mês cheio em vários meses ao mesmo tempo"
                : aba === "mercado"
                ? "Venda da Unipreço vs mercado (IQVIA), por linha"
                : aba === "mercado-analise"
                ? "Análise detalhada por linha e classe terapêutica com comparativo Unipreço vs Bricks"
                : aba === "mercado-brick"
                ? "Análise de vendas por brick individual com visualização dinâmica do volume"
                : aba === "desconto"
                ? "Simule cortes de desconto por produto e veja o impacto na margem da linha"
                : aba === "estoque"
                ? "Cobertura de estoque ideal vs atual por curva ABC com análise de oportunidades"
                : "Análise nominal, efeito volume e projeção para mês cheio"}
            </p>
          </div>
          <div className="print:hidden flex flex-wrap items-center gap-2.5 sm:gap-4">
            {aba === "simulador" && sim.result && (
              <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-dark lg:flex">
                <span className="grid size-4 place-items-center rounded-full bg-brand text-[10px] text-white">✓</span> Fechamento Validado
              </div>
            )}
            <div className="hidden items-center gap-2.5 text-right sm:flex">
              <CalendarClock className="size-5 text-text-muted-c" aria-hidden />
              <div className="text-left leading-tight">
                <div className="text-[11.5px] text-text-muted-c">Atualizado em</div>
                <div className="text-[13px] font-semibold text-text-main">{atualizadoEm}</div>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-[12px] border border-brand bg-white px-3 py-2 text-xs font-semibold text-brand hover:bg-brand-soft sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <Download className="size-4" aria-hidden /> <span className="hidden sm:inline">Exportar relatório</span><span className="sm:hidden">Exportar</span> <ChevronDown className="size-3.5 opacity-70" aria-hidden />
            </button>
          </div>
        </header>

        <main className="px-4 pb-24 pt-4 sm:px-6 sm:pb-12 lg:px-9">
          {/* Zona de upload — recolhida por padrão, aberta pelo item da sidebar */}
          {mostrarUpload && (
            <div className="mb-6">
              <UploadZone fileLabel={d.fileLabel} error={d.error} onFile={d.loadFile} />
              <ExclusoesCard
                exclusoes={d.exclusoes} rowsRaw={d.rowsRaw} meses={d.meses}
                onAdd={d.addExclusao} onRemove={d.removeExclusao}
              />
            </div>
          )}
          {!mostrarUpload && (
            <button
              onClick={() => setMostrarUpload(true)}
              className="print:hidden mb-4 flex items-center gap-1.5 text-xs font-semibold text-text-muted-c hover:text-brand"
            >
              <Upload className="size-3.5" aria-hidden /> Arquivo: {d.fileLabel} — clique para trocar
            </button>
          )}

          {!d.result ? (
            <div className="card-shadow rounded-[18px] border border-border-soft bg-white py-16 text-center text-sm text-text-muted-c">
              Nenhum dado carregado ainda. Importe um arquivo .xlsx para começar.
            </div>
          ) : aba === "simulador" ? (
            <>
              <FiltersCard
                meses={d.meses} mBase={d.mBase} mAt={d.mAt} diasDec={d.diasDec} diasTot={d.diasTot} meta={d.meta}
                onMBase={d.setMBase} onMAt={d.setMAt} onDiasDec={d.setDiasDec} onDiasTot={d.setDiasTot} onMeta={d.setMeta}
                metaVendaTotal={sim.metaVendaTotal} onMetaVendaTotal={sim.setMetaVendaTotal}
                onCalcularMetaAutomatica={() => sim.calcularMetaAutomatica(d.meta / 100)}
              />

              <SimuladorKpis s={sim.result} />

              <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr_0.95fr]">
                <DecomposicaoGapPanel s={sim.result} />
                <TendenciaMB7DiasCard metaMB={sim.result.totalMetaMB} />
                <RecuperacaoNecessariaCard s={sim.result} diasDec={d.diasDec} diasTot={d.diasTot} />
              </div>

              <ImpactoMetaPanel s={sim.result} />

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <BridgeChart s={sim.result} />
                <MetasLinhaCard s={sim.result} metas={sim.metas} onChange={sim.updateMeta} onRestaurar={sim.restaurarPadrao} onZerarSellout={sim.zerarSellout} onExportar={sim.exportarParaPublicar} dataPublicacao={sim.dataPublicacao} />
              </div>

              <ResumoExecutivo s={sim.result} />

              <div className="mt-6">
                <SimuladorTable s={sim.result} />
              </div>
            </>
          ) : aba === "tendencia" ? (
            <>
              <HeatmapLinhaMesCard rows={d.rows} />
              <MesSelector
                mesesDisponiveis={tend.mesesDisponiveis} selecionados={tend.selecionados}
                onToggle={tend.toggleMes} onSelecionarTodos={tend.selecionarTodos} onLimpar={tend.limparSelecao}
                diasPorMes={tend.diasPorMes}
              />
              <TendenciaCard dados={tend.resultado} onEditarDias={tend.setDiasMes} onFecharMes={tend.marcarFechado} />
            </>
          ) : aba === "desconto" ? (
            <SimuladorDescontoCard />
          ) : aba === "estoque" ? (
            <EstoqueCard />
          ) : aba === "mercado-analise" ? (
            <MercadoAnalise />
          ) : aba === "mercado-brick" ? (
            <MercadoAnalisePerBrick />
          ) : aba === "mercado" ? (
            <>
              <div className="sticky top-2 z-30 mb-4 space-y-2 rounded-[14px] border border-border-soft bg-white/95 px-3 py-2.5 shadow-[0_8px_24px_rgba(16,24,40,0.10)] backdrop-blur-md sm:px-4">
                <p className="text-[12.5px] text-text-muted-c">
                  Colunas/valores da <span className="rounded bg-brand-soft px-1.5 py-0.5 font-semibold text-brand-dark">Unipreço</span> aparecem destacados.
                  {linhaSelecionada && <span className="ml-2 font-semibold text-brand">Filtrado por: {linhaSelecionada}</span>}
                </p>
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex gap-1.5 rounded-[10px] border border-border-soft bg-[--bg-page] p-1" role="group" aria-label="Filtro de canetas GLP1">
                    <button onClick={() => setFonteMercado("COM_GLP1")} aria-pressed={fonteMercado === "COM_GLP1"} className={cn("rounded-[8px] px-3 py-1.5 text-xs font-semibold whitespace-nowrap", fonteMercado === "COM_GLP1" ? "bg-brand text-white shadow-sm" : "text-text-muted-c hover:bg-white")}>Com canetas GLP1</button>
                    <button onClick={() => setFonteMercado("SEM_GLP1")} aria-pressed={fonteMercado === "SEM_GLP1"} className={cn("rounded-[8px] px-3 py-1.5 text-xs font-semibold whitespace-nowrap", fonteMercado === "SEM_GLP1" ? "bg-brand text-white shadow-sm" : "text-text-muted-c hover:bg-white")}>Sem canetas GLP1</button>
                  </div>
                  {linhaSelecionada && (
                    <button onClick={() => setLinhaSelecionada(null)} className="rounded-[8px] border border-danger-c bg-danger-soft px-3 py-1.5 text-xs font-semibold text-danger-c hover:bg-danger-soft/80 whitespace-nowrap">
                      ✕ Limpar filtro
                    </button>
                  )}
                </div>
              </div>
              <section className="section-shell"><div className="section-heading"><div><span>01</span><h2>Composição e evolução do mercado</h2></div><p>Leitura rápida do mix da Unipreço comparado ao mercado e sua evolução nos últimos períodos.</p></div><MixVendasChart fonte={fonteMercado} /><EvolucaoComparativaChart fonte={fonteMercado} /></section>
              <section className="section-shell"><div className="section-heading"><div><span>02</span><h2>Detalhamento analítico</h2></div><p>Tabelas completas para conferência e aprofundamento por período.</p></div><CrescimentoTable fonte={fonteMercado} /><ShareMensalTable fonte={fonteMercado} /></section>
              <section className="section-shell"><div className="section-heading"><div><span>03</span><h2>Gap de participação por linha</h2></div><p>Quanto a rede deixa de faturar por ter participação diferente da observada no mercado, e da meta interna definida.</p></div><GapParticipacaoCard /></section>
              <section className="section-shell"><div className="section-heading"><div><span>04</span><h2>Share e evolução vs mercado</h2></div><p>Participação de mercado com opções de período (MAT, YTD, Tri Móvel) — venda, share, crescimento e ganho/perda mensal.</p></div><ShareUnificadoTable fonte={fonteMercado} /><EvolucaoAcumuladaSelector fonte={fonteMercado} /><RegrasShareMercado fonte={fonteMercado} /></section>
              <section className="section-shell"><GapDermocosmeticosSection /></section>
            </>
          ) : (
            <>
              <FiltersCard
                meses={d.meses} mBase={d.mBase} mAt={d.mAt} diasDec={d.diasDec} diasTot={d.diasTot} meta={d.meta}
                onMBase={d.setMBase} onMAt={d.setMAt} onDiasDec={d.setDiasDec} onDiasTot={d.setDiasTot} onMeta={d.setMeta}
                metaVendaTotal={sim.metaVendaTotal} onMetaVendaTotal={sim.setMetaVendaTotal}
                onCalcularMetaAutomatica={() => sim.calcularMetaAutomatica(d.meta / 100)}
              />
              <KpiRow c={d.result} />
              <MargNomGrid c={d.result} />
              <BridgeRCard c={d.result} />
              <ParticipacaoCard c={d.result} mode="venda" />
              <ParticipacaoCard c={d.result} mode="margem" />
              <BridgePctCard c={d.result} />
              <LinhasTable c={d.result} />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <OfensoresTable c={d.result} />
                <AtaqueTable c={d.result} />
              </div>
            </>
          )}

          <p className="mt-6 text-center text-[11px] text-text-muted-c">
            Ferramenta local — nenhum dado sai do seu navegador. Margem R$ = venda × MB%. Projeção linear com base nos dias informados.
          </p>
        </main>
      </div>

      {/* ===== Navegação inferior (mobile) ===== */}
      <nav
        aria-label="Navegação principal"
        className="print:hidden fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-border-soft bg-white py-1.5 sm:hidden"
        style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
      >
        <MobileNavItem icon={<Home className="size-5" />} label="Início" active={aba === "simulador"} onClick={() => setAba("simulador")} />
        <MobileNavItem icon={<BarChart3 className="size-5" />} label="Bridge" active={aba === "bridge"} onClick={() => setAba("bridge")} />
        <MobileNavItem icon={<TrendingUp className="size-5" />} label="Tendência" active={aba === "tendencia"} onClick={() => setAba("tendencia")} />
        <MobileNavItem icon={<Globe className="size-5" />} label="Mercado" active={aba === "mercado" || aba === "mercado-analise" || aba === "mercado-brick"} onClick={() => setAba("mercado")} />
        {/* <MobileNavItem icon={<Percent className="size-5" />} label="Desconto" active={aba === "desconto"} onClick={() => setAba("desconto")} /> */}
        <MobileNavItem icon={<Upload className="size-5" />} label="Estoque" active={aba === "estoque"} onClick={() => setAba("estoque")} />
        <MobileNavItem icon={<Upload className="size-5" />} label="Dados" onClick={() => setMostrarUpload((v) => !v)} />
      </nav>
    </div>
  )
}
