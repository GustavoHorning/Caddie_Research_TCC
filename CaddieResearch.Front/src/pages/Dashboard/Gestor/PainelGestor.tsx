import { useState, useEffect, useMemo } from 'react'
import './PainelGestor.css'
import TopBar from '../../../components/TopBar'
import api from '../../../services/api'
import SidebarGestor from '../../../components/SidebarGestor'

interface BrapiQuote {
  regularMarketPrice: number
  regularMarketChangePercent: number
  shortName?: string
  longName?: string
  logourl?: string
}

export default function PainelGestor() {
  const [menuMobileAberto, setMenuMobileAberto] = useState(false)

  const [carteirasDisponiveis, setCarteirasDisponiveis] = useState<any[]>([])
  const [carteiraAtivosId, setCarteiraAtivosId] = useState('')
  const [ativosTabela, setAtivosTabela] = useState<any[]>([])
  const [carregandoAtivos, setCarregandoAtivos] = useState(false)
  const [termoBusca, setTermoBusca] = useState('')
  const [filtroVies, setFiltroVies] = useState<'Todos' | 'Comprar' | 'Aguardar' | 'Vender'>('Todos')

  // Estado de Cotações Brapi PRO na Mesa do Gestor
  const [cotacoesBrapi, setCotacoesBrapi] = useState<Record<string, BrapiQuote>>({})
  const [cotacaoPreviewModal, setCotacaoPreviewModal] = useState<BrapiQuote | null>(null)
  const [buscandoTickerModal, setBuscandoTickerModal] = useState(false)

  const [mostrarFormAtivo, setMostrarFormAtivo] = useState(false)
  const [ativoEditandoId, setAtivoEditandoId] = useState<number | null>(null)

  const [formTicker, setFormTicker] = useState('')
  const [formEmpresa, setFormEmpresa] = useState('')
  const [formPrecoTeto, setFormPrecoTeto] = useState('')
  const [formVies, setFormVies] = useState('Comprar')
  const [formRentabilidade, setFormRentabilidade] = useState('')
  const [formVencimento, setFormVencimento] = useState('')
  const [formLiquidez, setFormLiquidez] = useState('')

  const [formCnpj, setFormCnpj] = useState('')
  const [formTaxaAdm, setFormTaxaAdm] = useState('')

  const [formDataEntrada, setFormDataEntrada] = useState('')
  const [formCategoria, setFormCategoria] = useState('')

  const [toastMsg, setToastMsg] = useState('')
  const [toastTipo, setToastTipo] = useState<'sucesso' | 'erro'>('sucesso')

  const [ativoParaRemover, setAtivoParaRemover] = useState<{ id: number; ticker: string } | null>(null)

  const idCarteiraNum = parseInt(carteiraAtivosId || '0')
  const isFundos = idCarteiraNum === 6
  const isRendaFixa = idCarteiraNum === 7
  const isReserva = idCarteiraNum === 8
  const isRendaVariavel = ![6, 7, 8].includes(idCarteiraNum)

  const carteiraAtual = carteirasDisponiveis.find((c) => c.id === idCarteiraNum)
  const nomeCarteira = carteiraAtual?.nome?.toLowerCase() || ''

  const isInternacional =
      nomeCarteira.includes('internacional') ||
      nomeCarteira.includes('exterior') ||
      nomeCarteira.includes('global')
  const isFii =
      nomeCarteira.includes('fii') ||
      nomeCarteira.includes('imobiliário') ||
      nomeCarteira.includes('imobiliarios')

  const placeholderTicker = isInternacional ? 'Ex: AAPL' : isFii ? 'Ex: HGLG11' : 'Ex: PETR4'
  const placeholderEmpresa = isInternacional ? 'Ex: Apple Inc.' : isFii ? 'Ex: CSHG Logística' : 'Ex: Petrobras S.A.'
  const placeholderPreco = isInternacional ? 'Ex: 185.50' : 'Ex: 42.50'

  const [listaTickers, setListaTickers] = useState<string[]>([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [listaTickersInternacionais, setListaTickersInternacionais] = useState<string[]>([])

  const listaCorretaParaFiltro = isInternacional ? listaTickersInternacionais : listaTickers
  const sugestoesTickers =
      formTicker.length > 0
          ? listaCorretaParaFiltro
              .filter((t) => t.toLowerCase().includes(formTicker.toLowerCase()))
              .slice(0, 8)
          : []

  useEffect(() => {
    if (!ativoEditandoId) {
      if (isFundos) setFormCategoria('Ações')
      else if (isRendaFixa || isReserva) setFormCategoria('Pós-fixado')
      else setFormCategoria('')
    }
  }, [carteiraAtivosId, isFundos, isRendaFixa, isReserva, ativoEditandoId])

  useEffect(() => {
    api
        .get('/api/carteiras')
        .then((res) => {
          setCarteirasDisponiveis(res.data)
          if (res.data.length > 0) {
            setCarteiraAtivosId(res.data[0].id.toString())
          }
        })
        .catch((err) => console.error('Erro ao carregar carteiras:', err))
  }, [])

  useEffect(() => {
    if (!carteiraAtivosId) return

    setCarregandoAtivos(true)
    setMostrarFormAtivo(false)
    setTermoBusca('')
    setFiltroVies('Todos')

    api
        .get(`/api/carteiras/${carteiraAtivosId}`)
        .then((res) => {
          const lista = res.data.ativos || []
          setAtivosTabela(lista)
          const idNum = parseInt(carteiraAtivosId)
          if (![6, 7, 8].includes(idNum) && lista.length > 0) {
            carregarCotacoesTabela(lista)
          }
        })
        .catch((err) => console.error('Erro ao carregar ativos:', err))
        .finally(() => setCarregandoAtivos(false))
  }, [carteiraAtivosId])

  async function carregarCotacoesTabela(lista: any[]) {
    const token = localStorage.getItem('caddie_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const mapa: Record<string, BrapiQuote> = {}

    await Promise.allSettled(
        lista.map(async (at) => {
          try {
            const res = await api.get(`/api/acoes/cotacao/${at.ticker}`, { headers })
            if (res.data) mapa[at.ticker] = res.data
          } catch {
            // Silencioso se o ativo não tiver cotação
          }
        })
    )
    setCotacoesBrapi((prev) => ({ ...prev, ...mapa }))
  }

  // Busca automática na Brapi PRO ao digitar um Ticker no Modal de Cadastro
  useEffect(() => {
    if (!mostrarFormAtivo || !isRendaVariavel) {
      setCotacaoPreviewModal(null)
      return
    }
    const tickerLimpo = formTicker.trim().toUpperCase()
    if (tickerLimpo.length < 4) {
      setCotacaoPreviewModal(null)
      return
    }

    const timer = setTimeout(async () => {
      try {
        setBuscandoTickerModal(true)
        const token = localStorage.getItem('caddie_token')
        const res = await api.get(`/api/acoes/cotacao/${tickerLimpo}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (res.data) {
          setCotacaoPreviewModal(res.data)
          if (!formEmpresa && (res.data.longName || res.data.shortName)) {
            setFormEmpresa(res.data.longName || res.data.shortName)
          }
        }
      } catch {
        setCotacaoPreviewModal(null)
      } finally {
        setBuscandoTickerModal(false)
      }
    }, 450)

    return () => clearTimeout(timer)
  }, [formTicker, mostrarFormAtivo, isRendaVariavel])

  useEffect(() => {
    api
        .get('/api/acoes/disponiveis')
        .then((res) => setListaTickers(res.data))
        .catch((err) => console.error('Erro ao carregar tickers BR:', err))

    api
        .get('/api/acoes/disponiveis/internacionais')
        .then((res) => setListaTickersInternacionais(res.data))
        .catch((err) => console.error('Erro ao carregar tickers Internacionais:', err))
  }, [])

  const ativosFiltrados = useMemo(() => {
    return ativosTabela.filter((ativo) => {
      const matchBusca =
          ativo.ticker.toLowerCase().includes(termoBusca.toLowerCase()) ||
          (ativo.nomeEmpresa && ativo.nomeEmpresa.toLowerCase().includes(termoBusca.toLowerCase()))
      const matchVies = filtroVies === 'Todos' || ativo.vies === filtroVies
      return matchBusca && matchVies
    })
  }, [ativosTabela, termoBusca, filtroVies])

  const totalAtivos = ativosTabela.length
  const qtdComprar = ativosTabela.filter((a) => a.vies === 'Comprar').length
  const qtdAguardar = ativosTabela.filter((a) => a.vies === 'Aguardar').length
  const qtdVender = ativosTabela.filter((a) => a.vies === 'Vender').length
  const qtdVenderAguardar = totalAtivos - qtdComprar
  const pctComprar = totalAtivos > 0 ? Math.round((qtdComprar / totalAtivos) * 100) : 0
  const pctVenderAguardar = totalAtivos > 0 ? Math.round((qtdVenderAguardar / totalAtivos) * 100) : 0
  const pesoMedioPorAtivo = totalAtivos > 0 ? (100 / totalAtivos).toFixed(1) : '0.0'

  // Contagem de alertas de governança (ativos com viés "Comprar" mas que já ultrapassaram o Preço Teto)
  const alertasTetoRompido = useMemo(() => {
    if (!isRendaVariavel) return 0
    return ativosTabela.filter((at) => {
      const precoAtual = cotacoesBrapi[at.ticker]?.regularMarketPrice
      return at.vies === 'Comprar' && precoAtual && at.precoTeto && precoAtual > at.precoTeto
    }).length
  }, [ativosTabela, cotacoesBrapi, isRendaVariavel])

  const abrirModalNovoAtivo = () => {
    handleCancelarForm()
    const hojeIso = new Date().toISOString().substring(0, 10)
    setFormDataEntrada(hojeIso)
    if (isFundos) setFormCategoria('Ações')
    else if (isRendaFixa || isReserva) setFormCategoria('Pós-fixado')
    setMostrarFormAtivo(true)
  }

  const handleEditarClique = (ativo: any) => {
    setFormTicker(ativo.ticker)
    setFormVies(ativo.vies)
    setFormDataEntrada(ativo.dataEntrada ? ativo.dataEntrada.substring(0, 10) : '')
    setFormCategoria(ativo.categoria || '')

    if (isFundos) {
      setFormCnpj(ativo.nomeEmpresa || '')
      setFormTaxaAdm(ativo.rentabilidade || '')
      setFormLiquidez(ativo.liquidez || '')
    } else if (isRendaFixa || isReserva) {
      setFormRentabilidade(ativo.rentabilidade || '')
      setFormVencimento(ativo.vencimento || '')
      setFormLiquidez(ativo.liquidez || '')
    } else {
      setFormEmpresa(ativo.nomeEmpresa || '')
      setFormPrecoTeto(ativo.precoTeto ? ativo.precoTeto.toString() : '')
    }

    setAtivoEditandoId(ativo.id)
    setMostrarFormAtivo(true)
  }

  const aplicarUpsideRapido = (percentual: number) => {
    if (!cotacaoPreviewModal?.regularMarketPrice) return
    const calculado = cotacaoPreviewModal.regularMarketPrice * (1 + percentual / 100)
    setFormPrecoTeto(calculado.toFixed(2))
  }

  const handleSalvarAtivo = async () => {
    const tickerLimpo = formTicker.trim().toUpperCase()

    if (!tickerLimpo) return mostrarNotificacao('O Ticker/Nome do ativo é obrigatório!', 'erro')
    if (!formDataEntrada) return mostrarNotificacao('A Data de Recomendação é obrigatória!', 'erro')

    const dataEntradaObj = new Date(formDataEntrada + 'T00:00:00')
    const dataHoje = new Date()
    dataHoje.setHours(0, 0, 0, 0)

    if (dataEntradaObj > dataHoje) {
      return mostrarNotificacao('A Data de Recomendação não pode estar no futuro.', 'erro')
    }

    if (isRendaVariavel) {
      if (!formPrecoTeto || parseFloat(formPrecoTeto.replace(',', '.')) <= 0) {
        return mostrarNotificacao('Defina um Preço Teto válido maior que zero.', 'erro')
      }
    }

    if (isFundos) {
      if (!formCnpj) return mostrarNotificacao('O CNPJ do Fundo é obrigatório.', 'erro')
      if (!formTaxaAdm) return mostrarNotificacao('A Taxa de Administração é obrigatória.', 'erro')
      if (!formLiquidez) return mostrarNotificacao('O prazo de Liquidez (Resgate) é obrigatório.', 'erro')
    }

    if (isRendaFixa || isReserva) {
      if (!formRentabilidade) return mostrarNotificacao('A Taxa de Entrada é obrigatória.', 'erro')
      if (!formVencimento) return mostrarNotificacao('O Vencimento é obrigatório.', 'erro')

      const dataVencimentoObj = new Date(formVencimento + 'T00:00:00')

      if (dataVencimentoObj <= dataEntradaObj) {
        return mostrarNotificacao('O Vencimento deve ser posterior à Data de Entrada.', 'erro')
      }
      if (dataVencimentoObj < dataHoje) {
        return mostrarNotificacao('Não é possível cadastrar um título que já venceu.', 'erro')
      }
    }

    const ativoJaExiste = ativosTabela.some(
        (a) => a.ticker.toUpperCase() === tickerLimpo && a.id !== ativoEditandoId
    )

    if (ativoJaExiste) {
      return mostrarNotificacao(`O ativo ${tickerLimpo} já está recomendado nesta carteira!`, 'erro')
    }

    const payload = {
      ticker: tickerLimpo,
      nomeEmpresa: isFundos ? formCnpj.trim() : formEmpresa.trim(),
      precoTeto: isRendaVariavel ? parseFloat(formPrecoTeto.replace(',', '.')) : null,
      vies: formVies,
      carteiraId: idCarteiraNum,
      rentabilidade: isFundos
          ? formTaxaAdm.trim()
          : isRendaFixa || isReserva
              ? formRentabilidade.trim()
              : null,
      vencimento: isRendaFixa || isReserva ? formVencimento.trim() : null,
      liquidez: isReserva
          ? 'D+0 (Imediata)'
          : isRendaFixa || isFundos
              ? formLiquidez.trim()
              : null,
      dataEntrada: formDataEntrada,
      categoria: formCategoria || null
    }

    try {
      if (ativoEditandoId) {
        await api.put(`/api/ativos/${ativoEditandoId}`, payload)
        mostrarNotificacao('Recomendação atualizada com sucesso!', 'sucesso')
      } else {
        await api.post('/api/ativos', payload)
        mostrarNotificacao('Novo ativo cadastrado com sucesso!', 'sucesso')
      }

      setCarregandoAtivos(true)
      const res = await api.get(`/api/carteiras/${carteiraAtivosId}`)
      const novaLista = res.data.ativos || []
      setAtivosTabela(novaLista)
      if (isRendaVariavel && novaLista.length > 0) {
        carregarCotacoesTabela(novaLista)
      }
      setCarregandoAtivos(false)

      handleCancelarForm()
    } catch (error) {
      console.error(error)
      mostrarNotificacao('Erro ao salvar. Verifique a conexão.', 'erro')
    }
  }

  const handleCancelarForm = () => {
    setMostrarFormAtivo(false)
    setAtivoEditandoId(null)
    setFormTicker('')
    setFormEmpresa('')
    setFormPrecoTeto('')
    setFormVies('Comprar')
    setFormRentabilidade('')
    setFormVencimento('')
    setFormLiquidez('')
    setFormCnpj('')
    setFormTaxaAdm('')
    setFormDataEntrada('')
    setFormCategoria('')
    setCotacaoPreviewModal(null)
  }

  const handleAbrirModalRemover = (idAtivo: number, ticker: string) => {
    setAtivoParaRemover({ id: idAtivo, ticker: ticker })
  }

  const handleConfirmarRemocao = async () => {
    if (!ativoParaRemover) return
    try {
      await api.delete(`/api/ativos/${ativoParaRemover.id}`)
      mostrarNotificacao(`${ativoParaRemover.ticker} removido da carteira!`, 'sucesso')
      setCarregandoAtivos(true)
      const res = await api.get(`/api/carteiras/${carteiraAtivosId}`)
      setAtivosTabela(res.data.ativos || [])
      setCarregandoAtivos(false)
    } catch (error) {
      console.error(error)
      mostrarNotificacao('Erro ao remover o ativo.', 'erro')
    } finally {
      setAtivoParaRemover(null)
    }
  }

  const mostrarNotificacao = (msg: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setToastMsg(msg)
    setToastTipo(tipo)
    setTimeout(() => setToastMsg(''), 3500)
  }

  const formatarMoeda = (valor?: number) => {
    if (valor === undefined || valor === null || isNaN(valor)) return '---'
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: isInternacional ? 'USD' : 'BRL'
    })
  }

  const traduzirViesLabel = (vies: string) => {
    if (isFundos) {
      return vies === 'Comprar' ? 'Alocar' : vies === 'Vender' ? 'Resgatar' : 'Manter Posição'
    }
    if (isRendaFixa || isReserva) {
      return vies === 'Comprar' ? 'Alocar' : vies === 'Vender' ? 'Vender Antecipado' : 'Aguardar Taxas'
    }
    return vies
  }

  return (
      <div className="dashboard-layout">
        <SidebarGestor
            activePath="/gestor"
            isOpen={menuMobileAberto}
            onClose={() => setMenuMobileAberto(false)}
        />
        {menuMobileAberto && (
            <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>
        )}

        <TopBar userName="Gestor" onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />

        <main className="dashboard-main">
          <div className="gestor-page">
            {/* 1. CABEÇALHO EXECUTIVO DE BACKOFFICE */}
            <header className="gestor-hero">
              <div className="gestor-hero-left">
                <div className="gestor-kicker-row">
                  <span className="gestor-kicker-badge">Mesa de Gestão & Alocação</span>
                  {isRendaVariavel && (
                      <span className="gestor-brapi-status">
                    <span className="gestor-pulse-dot"></span>
                    Feed Brapi PRO Ativo
                  </span>
                  )}
                </div>
                <h1 className="gestor-title">
                  Comitê de Carteiras {carteiraAtual ? `— ${carteiraAtual.nome}` : ''}
                </h1>
                <p className="gestor-subtitle">
                  Gerencie preços-teto, viés estratégico de entrada/saída e acompanhe a aderência das recomendações em tempo real.
                </p>
              </div>

              <div className="gestor-hero-actions">
                <a href="/auditoria" className="gestor-btn gestor-btn-outline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  Trilha de Auditoria
                </a>
                <button type="button" className="gestor-btn gestor-btn-primary" onClick={abrirModalNovoAtivo}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Nova Recomendação
                </button>
              </div>
            </header>

            {/* 2. SELETOR DE CARTEIRAS (ESTILO TERMINAL DE GESTÃO) */}
            <nav className="gestor-portfolio-nav" aria-label="Seleção de Carteira">
              {carteirasDisponiveis.map((c) => {
                const ativo = carteiraAtivosId === c.id.toString()
                return (
                    <button
                        key={c.id}
                        type="button"
                        className={`gestor-portfolio-tab ${ativo ? 'active' : ''}`}
                        onClick={() => setCarteiraAtivosId(c.id.toString())}
                    >
                      <span className="tab-indicator"></span>
                      <span className="tab-name">{c.nome}</span>
                    </button>
                )
              })}
            </nav>

            {/* 3. STRIP DE KPIs DE GOVERNANÇA DA CARTEIRA */}
            <section className="gestor-kpi-grid">
              <div className="gestor-kpi-card">
                <div className="gestor-kpi-top">
                  <span className="gestor-kpi-label">Ativos Sob Cobertura</span>
                  <span className="gestor-kpi-pill pill-cyan">Peso Alvo: {pesoMedioPorAtivo}%</span>
                </div>
                <strong className="gestor-kpi-value">{totalAtivos}</strong>
                <div className="gestor-kpi-bar">
                  <div className="gestor-kpi-fill fill-cyan" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="gestor-kpi-card">
                <div className="gestor-kpi-top">
                  <span className="gestor-kpi-label">Índice de Convicção (Compra)</span>
                  <span className="gestor-kpi-pill pill-emerald">{pctComprar}% da carteira</span>
                </div>
                <strong className="gestor-kpi-value text-emerald">{qtdComprar}</strong>
                <div className="gestor-kpi-bar">
                  <div className="gestor-kpi-fill fill-emerald" style={{ width: `${pctComprar}%` }}></div>
                </div>
              </div>

              <div className="gestor-kpi-card">
                <div className="gestor-kpi-top">
                  <span className="gestor-kpi-label">Em Observação / Saída</span>
                  <span className="gestor-kpi-pill pill-amber">{pctVenderAguardar}% da carteira</span>
                </div>
                <strong className="gestor-kpi-value text-amber">
                  {qtdAguardar} <small>/ {qtdVender} venda</small>
                </strong>
                <div className="gestor-kpi-bar">
                  <div className="gestor-kpi-fill fill-amber" style={{ width: `${pctVenderAguardar}%` }}></div>
                </div>
              </div>

              <div className="gestor-kpi-card">
                <div className="gestor-kpi-top">
                <span className="gestor-kpi-label">
                  {isRendaVariavel ? 'Monitor de Preço-Teto' : 'Status de Liquidez'}
                </span>
                  <span
                      className={`gestor-kpi-pill ${
                          alertasTetoRompido > 0 ? 'pill-rose' : 'pill-emerald'
                      }`}
                  >
                  {isRendaVariavel
                      ? alertasTetoRompido > 0
                          ? 'Atenção Requerida'
                          : '100% Enquadrada'
                      : 'Ativa'}
                </span>
                </div>
                <strong
                    className={`gestor-kpi-value ${
                        alertasTetoRompido > 0 ? 'text-rose' : 'text-main'
                    }`}
                >
                  {isRendaVariavel
                      ? alertasTetoRompido > 0
                          ? `${alertasTetoRompido} acima do teto`
                          : 'Enquadrada'
                      : isReserva
                          ? 'D+0 Diária'
                          : 'Institucional'}
                </strong>
                <span className="gestor-kpi-foot">
                {isRendaVariavel
                    ? 'Cruzamento automático via Brapi PRO'
                    : 'Lâmina validada pela gestão'}
              </span>
              </div>
            </section>

            {/* 4. PAINEL PRINCIPAL E TABELA DE GESTÃO */}
            <section className="gestor-panel">
              <div className="gestor-toolbar">
                <div className="gestor-toolbar-left">
                  <div className="gestor-search-box">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Filtrar por ticker, empresa ou CNPJ..."
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                    />
                  </div>

                  <div className="gestor-vies-filter">
                    {(['Todos', 'Comprar', 'Aguardar', 'Vender'] as const).map((v) => (
                        <button
                            key={v}
                            type="button"
                            className={`vies-filter-btn ${filtroVies === v ? 'active' : ''}`}
                            onClick={() => setFiltroVies(v)}
                        >
                          {v === 'Todos' ? 'Todos' : traduzirViesLabel(v)}
                        </button>
                    ))}
                  </div>
                </div>

                <button type="button" className="gestor-btn gestor-btn-primary" onClick={abrirModalNovoAtivo}>
                  + Adicionar Ativo
                </button>
              </div>

              <div className="gestor-table-container">
                <table className="gestor-table">
                  <thead>
                  <tr>
                    <th>Ativo / Identificador</th>
                    <th>
                      {isFundos
                          ? 'CNPJ / Classificação'
                          : isRendaFixa || isReserva
                              ? 'Vencimento & Liquidez'
                              : 'Companhia / Fundo'}
                    </th>
                    {isRendaVariavel && <th className="align-right">Cotação Atual (Brapi)</th>}
                    <th className="align-right">
                      {isFundos
                          ? 'Taxa de Adm.'
                          : isRendaFixa || isReserva
                              ? 'Taxa Recomendada'
                              : `Preço Teto (${isInternacional ? 'USD' : 'BRL'})`}
                    </th>
                    {isRendaVariavel && <th className="align-right">Margem / Upside</th>}
                    <th className="align-center">Recomendação</th>
                    <th className="align-center">Ações</th>
                  </tr>
                  </thead>
                  <tbody>
                  {carregandoAtivos ? (
                      [1, 2, 3, 4].map((n) => (
                          <tr key={`sk-${n}`}>
                            <td colSpan={isRendaVariavel ? 7 : 5}>
                              <div className="gestor-skeleton-row"></div>
                            </td>
                          </tr>
                      ))
                  ) : ativosFiltrados.length > 0 ? (
                      ativosFiltrados.map((ativo, i) => {
                        const quote = cotacoesBrapi[ativo.ticker]
                        const precoMercado = quote?.regularMarketPrice
                        const varDia = quote?.regularMarketChangePercent
                        const upside =
                            isRendaVariavel && precoMercado && ativo.precoTeto
                                ? ((ativo.precoTeto - precoMercado) / precoMercado) * 100
                                : null

                        const tetoRompidoEmCompra =
                            upside !== null && upside < 0 && ativo.vies === 'Comprar'

                        return (
                            <tr key={ativo.id || i}>
                              <td data-label="Ativo">
                                <div className="gestor-asset-cell">
                                  <div className="gestor-asset-avatar">
                                    {quote?.logourl ? (
                                        <img
                                            src={quote.logourl}
                                            alt={ativo.ticker}
                                            onError={(e) => {
                                              ;(e.target as HTMLImageElement).style.display = 'none'
                                            }}
                                        />
                                    ) : (
                                        ativo.ticker?.slice(0, 4)
                                    )}
                                  </div>
                                  <div>
                                    <div className="gestor-ticker-line">
                                      <strong className="gestor-ticker-name">{ativo.ticker}</strong>
                                      {ativo.categoria && (
                                          <span className="gestor-cat-tag">{ativo.categoria}</span>
                                      )}
                                    </div>
                                    {ativo.dataEntrada && (
                                        <span className="gestor-entry-date">
                                    Entrada: {ativo.dataEntrada.substring(0, 10).split('-').reverse().join('/')}
                                  </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td
                                  data-label={
                                    isFundos
                                        ? 'CNPJ'
                                        : isRendaFixa || isReserva
                                            ? 'Vencimento'
                                            : 'Companhia'
                                  }
                              >
                                {isFundos ? (
                                    <div className="gestor-secondary-cell">
                                      <strong>{ativo.nomeEmpresa || '---'}</strong>
                                      <span>Resgate: {ativo.liquidez || '---'}</span>
                                    </div>
                                ) : isRendaFixa || isReserva ? (
                                    <div className="gestor-secondary-cell">
                                      <strong>
                                        {ativo.vencimento
                                            ? ativo.vencimento.split('-').reverse().join('/')
                                            : 'Liquidez Contínua'}
                                      </strong>
                                      <span>Liquidez: {ativo.liquidez || '---'}</span>
                                    </div>
                                ) : (
                                    <div className="gestor-secondary-cell">
                                      <strong>{quote?.shortName || ativo.nomeEmpresa || '---'}</strong>
                                      <span>Peso Alvo: {pesoMedioPorAtivo}%</span>
                                    </div>
                                )}
                              </td>

                              {isRendaVariavel && (
                                  <td data-label="Cotação Brapi" className="align-right tabular-nums">
                                    {precoMercado ? (
                                        <div className="gestor-quote-cell">
                                          <strong>{formatarMoeda(precoMercado)}</strong>
                                          {varDia !== undefined && (
                                              <span className={`gestor-var-tag ${varDia >= 0 ? 'pos' : 'neg'}`}>
                                      {varDia >= 0 ? '▲' : '▼'} {Math.abs(varDia).toFixed(2)}%
                                    </span>
                                          )}
                                        </div>
                                    ) : (
                                        <span className="gestor-muted">---</span>
                                    )}
                                  </td>
                              )}

                              <td data-label="Preço Teto / Taxa" className="align-right tabular-nums">
                                <strong className="gestor-target-price">
                                  {isRendaVariavel
                                      ? formatarMoeda(ativo.precoTeto)
                                      : ativo.rentabilidade || '---'}
                                </strong>
                              </td>

                              {isRendaVariavel && (
                                  <td data-label="Margem / Upside" className="align-right tabular-nums">
                                    {upside !== null ? (
                                        <div className="gestor-upside-cell">
                                  <span
                                      className={`gestor-upside-pill ${
                                          upside >= 0 ? 'pos' : 'neg'
                                      }`}
                                  >
                                    {upside >= 0 ? `+${upside.toFixed(1)}%` : `${upside.toFixed(1)}%`}
                                  </span>
                                          {tetoRompidoEmCompra && (
                                              <small className="gestor-alert-tag">⚠ Rever Viés/Teto</small>
                                          )}
                                        </div>
                                    ) : (
                                        <span className="gestor-muted">---</span>
                                    )}
                                  </td>
                              )}

                              <td data-label="Recomendação" className="align-center">
                            <span className={`gestor-vies-badge vies-${ativo.vies.toLowerCase()}`}>
                              <span className="vies-dot"></span>
                              {traduzirViesLabel(ativo.vies)}
                            </span>
                              </td>

                              <td data-label="Ações" className="align-center">
                                <div className="gestor-actions-cell">
                                  <button
                                      type="button"
                                      className="gestor-icon-btn edit"
                                      onClick={() => handleEditarClique(ativo)}
                                      title="Editar Recomendação"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                  </button>
                                  <button
                                      type="button"
                                      className="gestor-icon-btn delete"
                                      onClick={() => handleAbrirModalRemover(ativo.id, ativo.ticker)}
                                      title="Remover da Carteira"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="3 6 5 6 21 6"></polyline>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                        )
                      })
                  ) : (
                      <tr>
                        <td colSpan={isRendaVariavel ? 7 : 5} className="gestor-empty-row">
                          <div className="gestor-empty-box">
                            <strong>
                              {termoBusca || filtroVies !== 'Todos'
                                  ? 'Nenhum ativo corresponde aos filtros aplicados.'
                                  : 'Esta carteira ainda não possui ativos cadastrados.'}
                            </strong>
                            <span>
                            Clique em "+ Nova Recomendação" para adicionar o primeiro ativo com acompanhamento em tempo real.
                          </span>
                          </div>
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* 5. MODAL DE CADASTRO / EDIÇÃO COM BRAPI ASSIST E LIVE PREVIEW */}
          {mostrarFormAtivo && (
              <div className="gestor-modal-backdrop">
                <div className="gestor-modal-dialog">
                  <div className="gestor-modal-header">
                    <div>
                  <span className="gestor-modal-kicker">
                    {isFundos
                        ? 'Fundo de Investimento'
                        : isReserva
                            ? 'Reserva de Liquidez'
                            : isRendaFixa
                                ? 'Título de Renda Fixa'
                                : `Renda Variável — ${carteiraAtual?.nome || ''}`}
                  </span>
                      <h3>{ativoEditandoId ? `Editar ${formTicker}` : 'Nova Recomendação da Gestão'}</h3>
                    </div>
                    <button type="button" className="gestor-modal-close" onClick={handleCancelarForm}>
                      ✕
                    </button>
                  </div>

                  <div className="gestor-modal-body">
                    <div className="gestor-form-column">
                      {isRendaVariavel && (
                          <>
                            <div className="gestor-field-row">
                              <div className="gestor-field" style={{ position: 'relative' }}>
                                <label>Ticker do Ativo</label>
                                <input
                                    type="text"
                                    placeholder={placeholderTicker}
                                    value={formTicker}
                                    onChange={(e) => {
                                      setFormTicker(e.target.value.toUpperCase())
                                      setMostrarSugestoes(true)
                                    }}
                                    onFocus={() => setMostrarSugestoes(true)}
                                    onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
                                />

                                {mostrarSugestoes && sugestoesTickers.length > 0 && (
                                    <ul className="gestor-autocomplete-list">
                                      {sugestoesTickers.map((t) => (
                                          <li
                                              key={t}
                                              onMouseDown={() => {
                                                setFormTicker(t)
                                                setMostrarSugestoes(false)
                                              }}
                                          >
                                            <strong>{t}</strong>
                                            <span>Selecionar ticker</span>
                                          </li>
                                      ))}
                                    </ul>
                                )}
                              </div>

                              <div className="gestor-field" style={{ flex: 1.8 }}>
                                <label>
                                  Nome da Empresa / Fundo{' '}
                                  {buscandoTickerModal && <small>(Buscando na Brapi...)</small>}
                                </label>
                                <input
                                    type="text"
                                    placeholder={placeholderEmpresa}
                                    value={formEmpresa}
                                    onChange={(e) => setFormEmpresa(e.target.value)}
                                />
                              </div>
                            </div>

                            {/* ASSISTENTE DE PREÇO BRAPI PRO */}
                            {cotacaoPreviewModal && (
                                <div className="gestor-brapi-helper">
                                  <div className="brapi-helper-left">
                                    <span className="brapi-helper-label">Cotação Atual ({formTicker}):</span>
                                    <strong>{formatarMoeda(cotacaoPreviewModal.regularMarketPrice)}</strong>
                                  </div>
                                  <div className="brapi-helper-buttons">
                                    <span>Sugerir Teto:</span>
                                    <button type="button" onClick={() => aplicarUpsideRapido(10)}>
                                      +10%
                                    </button>
                                    <button type="button" onClick={() => aplicarUpsideRapido(15)}>
                                      +15%
                                    </button>
                                    <button type="button" onClick={() => aplicarUpsideRapido(25)}>
                                      +25%
                                    </button>
                                  </div>
                                </div>
                            )}

                            <div className="gestor-field-row">
                              <div className="gestor-field">
                                <label>Preço Teto Alvo {isInternacional ? '(USD)' : '(R$)'}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder={placeholderPreco}
                                    value={formPrecoTeto}
                                    onChange={(e) => setFormPrecoTeto(e.target.value)}
                                />
                              </div>

                              <div className="gestor-field">
                                <label>Viés Estratégico</label>
                                <select value={formVies} onChange={(e) => setFormVies(e.target.value)}>
                                  <option value="Comprar">Comprar</option>
                                  <option value="Aguardar">Aguardar</option>
                                  <option value="Vender">Vender</option>
                                </select>
                              </div>
                            </div>

                            <div className="gestor-field-row">
                              <div className="gestor-field">
                                <label>Setor / Categoria (Opcional)</label>
                                <input
                                    type="text"
                                    placeholder={isFii ? 'Ex: Logística / Papel' : 'Ex: Elétricas / Bancos'}
                                    value={formCategoria}
                                    onChange={(e) => setFormCategoria(e.target.value)}
                                />
                              </div>
                              <div className="gestor-field">
                                <label>Data da Recomendação</label>
                                <input
                                    type="date"
                                    value={formDataEntrada}
                                    onChange={(e) => setFormDataEntrada(e.target.value)}
                                />
                              </div>
                            </div>
                          </>
                      )}

                      {isFundos && (
                          <>
                            <div className="gestor-field-row">
                              <div className="gestor-field" style={{ flex: 1.8 }}>
                                <label>Nome do Fundo</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Alaska Black FIC FIA"
                                    value={formTicker}
                                    onChange={(e) => setFormTicker(e.target.value)}
                                />
                              </div>
                              <div className="gestor-field">
                                <label>CNPJ do Fundo</label>
                                <input
                                    type="text"
                                    placeholder="00.000.000/0001-00"
                                    value={formCnpj}
                                    onChange={(e) => setFormCnpj(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="gestor-field-row">
                              <div className="gestor-field">
                                <label>Taxa de Administração</label>
                                <input
                                    type="text"
                                    placeholder="Ex: 2,0% a.a."
                                    value={formTaxaAdm}
                                    onChange={(e) => setFormTaxaAdm(e.target.value)}
                                />
                              </div>
                              <div className="gestor-field">
                                <label>Classificação ANBIMA</label>
                                <select value={formCategoria} onChange={(e) => setFormCategoria(e.target.value)}>
                                  <option value="Ações">Fundo de Ações</option>
                                  <option value="Multimercado">Fundo Multimercado</option>
                                  <option value="Renda Fixa">Fundo de Renda Fixa</option>
                                  <option value="Cambial">Fundo Cambial</option>
                                </select>
                              </div>
                            </div>

                            <div className="gestor-field-row">
                              <div className="gestor-field">
                                <label>Liquidez (Prazo de Resgate)</label>
                                <input
                                    type="text"
                                    placeholder="Ex: D+30"
                                    value={formLiquidez}
                                    onChange={(e) => setFormLiquidez(e.target.value)}
                                />
                              </div>
                              <div className="gestor-field">
                                <label>Data de Recomendação</label>
                                <input
                                    type="date"
                                    value={formDataEntrada}
                                    onChange={(e) => setFormDataEntrada(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="gestor-field-row">
                              <div className="gestor-field">
                                <label>Recomendação</label>
                                <select value={formVies} onChange={(e) => setFormVies(e.target.value)}>
                                  <option value="Comprar">Alocar</option>
                                  <option value="Aguardar">Manter Posição</option>
                                  <option value="Vender">Resgatar</option>
                                </select>
                              </div>
                            </div>
                          </>
                      )}

                      {(isRendaFixa || isReserva) && (
                          <>
                            <div className="gestor-field-row">
                              <div className="gestor-field" style={{ flex: 1.8 }}>
                                <label>Nome do Título / Emissor</label>
                                <input
                                    type="text"
                                    placeholder={isReserva ? 'Ex: CDB Liquidez Diária Itaú' : 'Ex: Tesouro IPCA+ 2035'}
                                    value={formTicker}
                                    onChange={(e) => setFormTicker(e.target.value)}
                                />
                              </div>
                              <div className="gestor-field">
                                <label>Taxa / Indexador</label>
                                <input
                                    type="text"
                                    placeholder={isReserva ? 'Ex: 100% do CDI' : 'Ex: IPCA + 6,45%'}
                                    value={formRentabilidade}
                                    onChange={(e) => setFormRentabilidade(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="gestor-field-row">
                              <div className="gestor-field">
                                <label>Indexador</label>
                                <select value={formCategoria} onChange={(e) => setFormCategoria(e.target.value)}>
                                  <option value="Pós-fixado">Pós-fixado (CDI / Selic)</option>
                                  <option value="Pré-fixado">Pré-fixado</option>
                                  <option value="Atrelado à Inflação">Atrelado à Inflação (IPCA+)</option>
                                </select>
                              </div>
                              <div className="gestor-field">
                                <label>Liquidez</label>
                                {isReserva ? (
                                    <input type="text" value="D+0 (Imediata)" disabled />
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="Ex: No Vencimento ou D+1"
                                        value={formLiquidez}
                                        onChange={(e) => setFormLiquidez(e.target.value)}
                                    />
                                )}
                              </div>
                            </div>

                            <div className="gestor-field-row">
                              <div className="gestor-field">
                                <label>Data de Entrada</label>
                                <input
                                    type="date"
                                    value={formDataEntrada}
                                    onChange={(e) => setFormDataEntrada(e.target.value)}
                                />
                              </div>
                              <div className="gestor-field">
                                <label>Data de Vencimento</label>
                                <input
                                    type="date"
                                    value={formVencimento}
                                    onChange={(e) => setFormVencimento(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="gestor-field-row">
                              <div className="gestor-field">
                                <label>Recomendação</label>
                                <select value={formVies} onChange={(e) => setFormVies(e.target.value)}>
                                  <option value="Comprar">Alocar</option>
                                  <option value="Aguardar">Aguardar Taxas</option>
                                  <option value="Vender">Vender Antecipado</option>
                                </select>
                              </div>
                            </div>
                          </>
                      )}
                    </div>

                    {/* COLUNA DE LIVE PREVIEW INSTITUCIONAL */}
                    <aside className="gestor-preview-column">
                      <span className="gestor-preview-title">Pré-visualização do Cliente</span>

                      <div className="gestor-preview-card">
                        <div className="preview-card-top">
                          <div className="preview-identity">
                            <div className="preview-avatar">
                              {cotacaoPreviewModal?.logourl ? (
                                  <img src={cotacaoPreviewModal.logourl} alt={formTicker} />
                              ) : (
                                  (formTicker || 'ATIV').slice(0, 4).toUpperCase()
                              )}
                            </div>
                            <div>
                              <strong>{formTicker ? formTicker.toUpperCase() : 'TICKER'}</strong>
                              <span>{formEmpresa || formCategoria || 'Ativo Recomendado'}</span>
                            </div>
                          </div>

                          <span className={`gestor-vies-badge vies-${formVies.toLowerCase()}`}>
                        {traduzirViesLabel(formVies)}
                      </span>
                        </div>

                        <div className="preview-metrics-grid">
                          {isRendaVariavel ? (
                              <>
                                <div className="preview-metric-box">
                                  <span>Cotação Brapi</span>
                                  <strong>
                                    {cotacaoPreviewModal
                                        ? formatarMoeda(cotacaoPreviewModal.regularMarketPrice)
                                        : '---'}
                                  </strong>
                                </div>
                                <div className="preview-metric-box">
                                  <span>Preço Teto</span>
                                  <strong className="text-cyan">
                                    {formPrecoTeto
                                        ? formatarMoeda(parseFloat(formPrecoTeto.replace(',', '.')))
                                        : '---'}
                                  </strong>
                                </div>
                              </>
                          ) : isFundos ? (
                              <>
                                <div className="preview-metric-box">
                                  <span>Taxa de Adm.</span>
                                  <strong className="text-cyan">{formTaxaAdm || '---'}</strong>
                                </div>
                                <div className="preview-metric-box">
                                  <span>Liquidez</span>
                                  <strong>{formLiquidez || '---'}</strong>
                                </div>
                              </>
                          ) : (
                              <>
                                <div className="preview-metric-box">
                                  <span>Rentabilidade</span>
                                  <strong className="text-cyan">{formRentabilidade || '---'}</strong>
                                </div>
                                <div className="preview-metric-box">
                                  <span>Liquidez</span>
                                  <strong>{isReserva ? 'D+0' : formLiquidez || '---'}</strong>
                                </div>
                              </>
                          )}
                        </div>

                        <div className="preview-card-foot">
                          <span>Carteira: {carteiraAtual?.nome || '---'}</span>
                          <span>
                        {formDataEntrada
                            ? formDataEntrada.split('-').reverse().join('/')
                            : 'Hoje'}
                      </span>
                        </div>
                      </div>
                    </aside>
                  </div>

                  <div className="gestor-modal-footer">
                    <button type="button" className="gestor-btn gestor-btn-outline" onClick={handleCancelarForm}>
                      Cancelar
                    </button>
                    <button type="button" className="gestor-btn gestor-btn-primary" onClick={handleSalvarAtivo}>
                      {ativoEditandoId ? 'Salvar Alterações' : 'Publicar na Carteira'}
                    </button>
                  </div>
                </div>
              </div>
          )}

          {/* 6. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
          {ativoParaRemover && (
              <div className="gestor-modal-backdrop">
                <div className="gestor-confirm-box">
                  <div className="gestor-confirm-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                  <h3>Encerrar Recomendação</h3>
                  <p>
                    Confirma a remoção de <strong>{ativoParaRemover.ticker}</strong> da carteira{' '}
                    <strong>{carteiraAtual?.nome}</strong>? O registro será enviado para a auditoria.
                  </p>
                  <div className="gestor-confirm-actions">
                    <button
                        type="button"
                        className="gestor-btn gestor-btn-outline"
                        onClick={() => setAtivoParaRemover(null)}
                    >
                      Cancelar
                    </button>
                    <button
                        type="button"
                        className="gestor-btn gestor-btn-danger"
                        onClick={handleConfirmarRemocao}
                    >
                      Confirmar Exclusão
                    </button>
                  </div>
                </div>
              </div>
          )}
        </main>

        {toastMsg && <div className={`gestor-toast toast-${toastTipo}`}>{toastMsg}</div>}
      </div>
  )
}