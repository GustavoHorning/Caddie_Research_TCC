import { useState, useEffect, useMemo } from 'react'
import './DashboardHome.css'
import api from '../../services/api'

interface Favorito {
  id: number
  ticker: string
  nomeEmpresa?: string
  categoria?: string
  rentabilidade?: string
  nomeCarteira?: string
}

interface Cotacao {
  regularMarketPrice: number
  regularMarketChangePercent: number
  shortName: string
}

interface Relatorio {
  id: number
  titulo: string
  resumo?: string
  categoria?: string
  tipo?: string
  dataPublicacao?: string
  criadoEm?: string
}

interface MorningCall {
  id: number
  titulo: string
  resumo?: string
  conteudo?: string
  dataPublicacao?: string
  criadoEm?: string
  audioUrl?: string
}

interface Carteira {
  id: number
  nome: string
  descricao?: string
  perfil?: string
  rentabilidade?: string
  ativos?: any[]
}

export default function DashboardHome() {
  const [favoritos, setFavoritos] = useState<Favorito[]>([])
  const [cotacoes, setCotacoes] = useState<Record<string, Cotacao>>({})
  const [eventos, setEventos] = useState<any[]>([])
  const [totalEventos, setTotalEventos] = useState(0)
  const [relatorios, setRelatorios] = useState<Relatorio[]>([])
  const [morningCall, setMorningCall] = useState<MorningCall | null>(null)
  const [carteiras, setCarteiras] = useState<Carteira[]>([])
  const [carregando, setCarregando] = useState(true)
  const [buscaTicker, setBuscaTicker] = useState('')

  const nomeUsuario = useMemo(() => {
    try {
      const userStr = localStorage.getItem('caddie_user') || localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        return user.nome || user.name || 'Investidor'
      }
    } catch {
    }
    return 'Investidor'
  }, [])

  const saudacao = useMemo(() => {
    const hora = new Date().getHours()
    if (hora < 12) return 'Bom dia'
    if (hora < 18) return 'Boa tarde'
    return 'Boa noite'
  }, [])

  const statusPregao = useMemo(() => {
    const agora = new Date()
    const dia = agora.getDay()
    const hora = agora.getHours()
    const aberto = dia >= 1 && dia <= 5 && hora >= 10 && hora < 18
    return {
      aberto,
      texto: aberto ? 'Pregão B3 Aberto' : 'Mercado Fechado',
      dataFormatada: agora.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }
  }, [])

  useEffect(() => {
    carregarEcossistema()
  }, [])

  async function carregarEcossistema() {
    setCarregando(true)
    const token = localStorage.getItem('caddie_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    await Promise.allSettled([
      carregarFavoritos(headers),
      carregarEventos(),
      carregarRelatorios(headers),
      carregarMorningCall(headers),
      carregarCarteiras(headers)
    ])
    setCarregando(false)
  }

  async function carregarEventos() {
    try {
      const response = await api.get('/api/calendario')
      const data = response.data

      if (Array.isArray(data)) {
        setTotalEventos(data.length)
        const balancos = data.filter(
            (e: any) => e.tipo?.toLowerCase() === 'balanço' || e.tipo?.toLowerCase() === 'balanco'
        )
        const outrosEventos = data.filter(
            (e: any) => e.tipo?.toLowerCase() !== 'balanço' && e.tipo?.toLowerCase() !== 'balanco'
        )

        const vitrine = []
        if (balancos.length > 0) {
          vitrine.push(balancos[0])
        }

        const espacoRestante = 4 - vitrine.length
        vitrine.push(...outrosEventos.slice(0, espacoRestante))

        vitrine.sort((a, b) => {
          const timeA = (a.dataStr || '') + 'T' + (a.hora || '')
          const timeB = (b.dataStr || '') + 'T' + (b.hora || '')
          return timeA.localeCompare(timeB)
        })

        setEventos(vitrine)
      }
    } catch (error) {
      console.error('Erro ao carregar eventos do calendário:', error)
    }
  }

  async function carregarFavoritos(headers: any) {
    try {
      const response = await api.get('/api/favoritos', { headers })
      const favs = Array.isArray(response.data) ? response.data : []
      setFavoritos(favs)
      if (favs.length > 0) {
        await carregarCotacoes(favs, headers)
      }
    } catch (e) {
      console.error('Erro ao carregar favoritos', e)
    }
  }

  async function carregarCotacoes(favs: Favorito[], headers: any) {
    const novasCotacoes: Record<string, Cotacao> = {}
    await Promise.allSettled(
        favs.map(async (f) => {
          try {
            const res = await api.get(`/api/acoes/cotacao/${f.ticker}`, { headers })
            if (res.data) novasCotacoes[f.ticker] = res.data
          } catch (e) {
            console.error(`Erro ao buscar cotação de ${f.ticker}`, e)
          }
        })
    )
    setCotacoes(novasCotacoes)
  }

  async function carregarRelatorios(headers: any) {
    try {
      const res = await api.get('/api/relatorios', { headers })
      if (Array.isArray(res.data)) {
        setRelatorios(res.data.slice(0, 4))
      }
    } catch {
      // Silencioso caso a rota tenha outro nome
    }
  }

  async function carregarMorningCall(headers: any) {
    try {
      const res = await api.get('/api/morningcalls', { headers })
      if (Array.isArray(res.data) && res.data.length > 0) {
        setMorningCall(res.data[0])
      } else if (res.data && !Array.isArray(res.data)) {
        setMorningCall(res.data)
      }
    } catch {
    }
  }

  async function carregarCarteiras(headers: any) {
    try {
      const res = await api.get('/api/carteiras', { headers })
      if (Array.isArray(res.data)) {
        setCarteiras(res.data)
      }
    } catch {
    }
  }

  async function removerFavorito(ticker: string) {
    try {
      const token = localStorage.getItem('caddie_token')
      await api.delete(`/api/favoritos/${ticker}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFavoritos((prev) => prev.filter((f) => f.ticker !== ticker))
      setCotacoes((prev) => {
        const novo = { ...prev }
        delete novo[ticker]
        return novo
      })
    } catch (e) {
      console.error('Erro ao remover favorito', e)
    }
  }

  // Cálculo dinâmico de performance da Watchlist para o KPI
  const resumoWatchlist = useMemo(() => {
    const valores = Object.values(cotacoes)
    if (valores.length === 0) return { media: 0, altas: 0, baixas: 0 }
    const soma = valores.reduce((acc, c) => acc + (c.regularMarketChangePercent || 0), 0)
    const altas = valores.filter((c) => c.regularMarketChangePercent > 0).length
    const baixas = valores.filter((c) => c.regularMarketChangePercent < 0).length
    return {
      media: soma / valores.length,
      altas,
      baixas
    }
  }, [cotacoes])

  const favoritosFiltrados = useMemo(() => {
    if (!buscaTicker.trim()) return favoritos
    const termo = buscaTicker.toLowerCase()
    return favoritos.filter(
        (f) =>
            f.ticker.toLowerCase().includes(termo) ||
            f.categoria?.toLowerCase().includes(termo) ||
            f.nomeCarteira?.toLowerCase().includes(termo)
    )
  }, [favoritos, buscaTicker])

  function formatarDataCurta(dataIso?: string) {
    if (!dataIso) return 'Recente'
    const d = new Date(dataIso)
    if (isNaN(d.getTime())) return dataIso
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return (
      <div className="dash-wrapper">
        <header className="dash-header-bar">
          <div className="dash-welcome">
            <div className="dash-status-row">
            <span className={`dash-market-badge ${statusPregao.aberto ? 'open' : 'closed'}`}>
              <span className="dash-pulse-dot"></span>
              {statusPregao.texto}
            </span>
              <span className="dash-date-label">{statusPregao.dataFormatada}</span>
            </div>
            <h1 className="dash-main-title">
              {saudacao}, <span>{nomeUsuario}</span>
            </h1>
            <p className="dash-main-subtitle">
              Acompanhe sua carteira recomendada, cotações em tempo real e relatórios da equipe de análise.
            </p>
          </div>

          <div className="dash-quick-actions">
            <a href="/carteiras" className="dash-btn dash-btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              Explorar Carteiras
            </a>
            <a href="/relatorios" className="dash-btn dash-btn-outline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Relatórios Research
            </a>
          </div>
        </header>

        <section className="dash-kpi-strip">
          <div className="dash-kpi-card">
            <div className="dash-kpi-top">
              <span className="dash-kpi-label">Ativos Monitorados</span>
              <div className="dash-kpi-icon accent">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>
            <div className="dash-kpi-value">{favoritos.length}</div>
            <div className="dash-kpi-foot">
              <span className="dash-kpi-tag positive">{resumoWatchlist.altas} em alta</span>
              <span className="dash-kpi-tag negative">{resumoWatchlist.baixas} em baixa</span>
            </div>
          </div>

          <div className="dash-kpi-card">
            <div className="dash-kpi-top">
              <span className="dash-kpi-label">Variação Média (Watchlist)</span>
              <div className={`dash-kpi-icon ${resumoWatchlist.media >= 0 ? 'positive' : 'negative'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
            </div>
            <div className={`dash-kpi-value ${resumoWatchlist.media >= 0 ? 'text-pos' : 'text-neg'}`}>
              {resumoWatchlist.media >= 0 ? '+' : ''}
              {resumoWatchlist.media.toFixed(2)}%
            </div>
            <div className="dash-kpi-foot">
              <span className="dash-kpi-muted">Cotação intradiária B3</span>
            </div>
          </div>

          <div className="dash-kpi-card">
            <div className="dash-kpi-top">
              <span className="dash-kpi-label">Carteiras Ativas</span>
              <div className="dash-kpi-icon gold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
            </div>
            <div className="dash-kpi-value">{carteiras.length}</div>
            <div className="dash-kpi-foot">
              <a href="/carteiras" className="dash-kpi-link">Ver alocações recomendadas →</a>
            </div>
          </div>

          <div className="dash-kpi-card">
            <div className="dash-kpi-top">
              <span className="dash-kpi-label">Eventos na Agenda</span>
              <div className="dash-kpi-icon purple">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
            </div>
            <div className="dash-kpi-value">{totalEventos}</div>
            <div className="dash-kpi-foot">
              <a href="/calendario" className="dash-kpi-link">Radares macro e balanços →</a>
            </div>
          </div>
        </section>

        <div className="dash-bento-grid">
          <div className="dash-col-main">
            <section className="dash-panel">
              <div className="dash-panel-header">
                <div>
                  <div className="dash-panel-title-row">
                    <h2 className="dash-panel-title">Minha Watchlist</h2>
                    <span className="dash-badge-count">{favoritos.length} ativos</span>
                  </div>
                  <p className="dash-panel-subtitle">Monitoramento em tempo real dos seus ativos selecionados</p>
                </div>

                <div className="dash-search-box">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                      type="text"
                      placeholder="Filtrar ticker ou carteira..."
                      value={buscaTicker}
                      onChange={(e) => setBuscaTicker(e.target.value)}
                  />
                </div>
              </div>

              {carregando ? (
                  <div className="dash-skeleton-list">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="dash-skeleton-row"></div>
                    ))}
                  </div>
              ) : favoritosFiltrados.length === 0 ? (
                  <div className="dash-empty-state">
                    <div className="dash-empty-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                    <h4>{buscaTicker ? 'Nenhum ativo encontrado para este filtro' : 'Sua Watchlist está vazia'}</h4>
                    <p>
                      Navegue pelas Carteiras Recomendadas e clique no ícone de estrela para monitorar ações, FIIs e BDRs aqui.
                    </p>
                    <a href="/carteiras" className="dash-btn dash-btn-outline dash-btn-sm">
                      Adicionar Ativos
                    </a>
                  </div>
              ) : (
                  <div className="dash-table-wrapper">
                    <table className="dash-asset-table">
                      <thead>
                      <tr>
                        <th>Ativo</th>
                        <th>Alocação / Origem</th>
                        <th className="align-right">Último Preço</th>
                        <th className="align-right">Variação (Dia)</th>
                        <th className="align-center">Ação</th>
                      </tr>
                      </thead>
                      <tbody>
                      {favoritosFiltrados.map((f) => {
                        const cotacao = cotacoes[f.ticker]
                        const variacao = cotacao?.regularMarketChangePercent
                        const isPositivo = variacao !== undefined ? variacao >= 0 : null

                        return (
                            <tr key={f.id}>
                              <td>
                                <div className="dash-asset-identity">
                                  <div className="dash-asset-avatar">{f.ticker.slice(0, 4)}</div>
                                  <div>
                                    <strong className="dash-asset-ticker">{f.ticker}</strong>
                                    <span className="dash-asset-name">
                                  {cotacao?.shortName || f.nomeEmpresa || 'Ativo B3'}
                                </span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="dash-asset-badges">
                                  {f.categoria && <span className="dash-pill dash-pill-accent">{f.categoria}</span>}
                                  {f.nomeCarteira && f.nomeCarteira !== f.categoria && (
                                      <span className="dash-pill dash-pill-neutral">{f.nomeCarteira}</span>
                                  )}
                                  {!f.categoria && !f.nomeCarteira && (
                                      <span className="dash-pill dash-pill-neutral">Acompanhamento</span>
                                  )}
                                </div>
                              </td>
                              <td className="align-right tabular-nums">
                                {cotacao ? (
                                    <strong className="dash-asset-price">
                                      {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                      }).format(cotacao.regularMarketPrice)}
                                    </strong>
                                ) : f.rentabilidade ? (
                                    <span className="dash-pill dash-pill-accent">{f.rentabilidade}</span>
                                ) : (
                                    <span className="dash-muted">—</span>
                                )}
                              </td>
                              <td className="align-right tabular-nums">
                                {cotacao && isPositivo !== null ? (
                                    <span className={`dash-var-badge ${isPositivo ? 'pos' : 'neg'}`}>
                                {isPositivo ? '▲' : '▼'} {Math.abs(variacao!).toFixed(2)}%
                              </span>
                                ) : (
                                    <span className="dash-muted">—</span>
                                )}
                              </td>
                              <td className="align-center">
                                <button
                                    className="dash-btn-icon-remove"
                                    onClick={() => removerFavorito(f.ticker)}
                                    title={`Remover ${f.ticker} da Watchlist`}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                        )
                      })}
                      </tbody>
                    </table>
                  </div>
              )}
            </section>

            <section className="dash-panel">
              <div className="dash-panel-header">
                <div>
                  <h2 className="dash-panel-title">Últimas Análises & Relatórios</h2>
                  <p className="dash-panel-subtitle">Teses de investimento e relatórios gerenciais publicados pelos analistas</p>
                </div>
                <a href="/relatorios" className="dash-link-arrow">
                  Biblioteca completa →
                </a>
              </div>

              {relatorios.length > 0 ? (
                  <div className="dash-reports-list">
                    {relatorios.map((rel, idx) => (
                        <a href="/relatorios" key={rel.id || idx} className="dash-report-row">
                          <div className="dash-report-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                          <div className="dash-report-info">
                            <strong>{rel.titulo}</strong>
                            <span>{rel.resumo || 'Análise fundamentalista e revisão de cenário macroeconômico.'}</span>
                          </div>
                          <div className="dash-report-meta">
                            <span className="dash-pill dash-pill-neutral">{rel.categoria || rel.tipo || 'Research'}</span>
                            <span className="dash-report-date">
                        {formatarDataCurta(rel.dataPublicacao || rel.criadoEm)}
                      </span>
                          </div>
                        </a>
                    ))}
                  </div>
              ) : (
                  <div className="dash-allocations-showcase">
                    {carteiras.length > 0 ? (
                        carteiras.slice(0, 3).map((c, idx) => (
                            <a href="/carteiras" key={c.id || idx} className="dash-allocation-card">
                              <div className="dash-allocation-top">
                                <span className="dash-pill dash-pill-accent">{c.perfil || 'Recomendada'}</span>
                                <span className="dash-allocation-arrow">↗</span>
                              </div>
                              <h4>{c.nome}</h4>
                              <p>{c.descricao || 'Portfólio estruturado com foco em geração de valor e controle de risco.'}</p>
                            </a>
                        ))
                    ) : (
                        <div className="dash-institutional-callout">
                          <div className="dash-callout-content">
                            <span className="dash-pill dash-pill-accent">Caddie Research</span>
                            <h4>Acesse nossa biblioteca completa de teses e carteiras</h4>
                            <p>
                              Consulte os relatórios em PDF, ouça os áudios de acompanhamento de mercado e verifique os pesos ideais de cada ativo nas carteiras recomendadas.
                            </p>
                          </div>
                          <a href="/relatorios" className="dash-btn dash-btn-primary">
                            Abrir Relatórios
                          </a>
                        </div>
                    )}
                  </div>
              )}
            </section>
          </div>

          <div className="dash-col-side">
            <section className="dash-panel dash-panel-highlight">
              <div className="dash-panel-header">
                <div className="dash-panel-title-row">
                <span className="dash-mc-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                </span>
                  <h2 className="dash-panel-title">Morning Call</h2>
                </div>
                <span className="dash-pill dash-pill-gold">
                {morningCall
                    ? formatarDataCurta(morningCall.dataPublicacao || morningCall.criadoEm)
                    : 'Briefing Diário'}
              </span>
              </div>

              <div className="dash-mc-body">
                <h3 className="dash-mc-headline">
                  {morningCall?.titulo || 'Panorama de Abertura & Direcionadores de Mercado'}
                </h3>
                <p className="dash-mc-excerpt">
                  {morningCall?.resumo ||
                      morningCall?.conteudo?.slice(0, 150) ||
                      'Acompanhe a leitura diária dos nossos analistas sobre juros futuros, bolsas globais, commodities e impactos na sua carteira.'}
                </p>

                <div className="dash-mc-footer">
                  <a href="/morning-call" className="dash-btn dash-btn-primary dash-btn-full">
                    Acessar Morning Call Completo →
                  </a>
                </div>
              </div>
            </section>

            <section className="dash-panel">
              <div className="dash-panel-header">
                <div>
                  <h2 className="dash-panel-title">Agenda do Mercado</h2>
                  <p className="dash-panel-subtitle">Indicadores macro e temporada de resultados</p>
                </div>
                <a href="/calendario" className="dash-link-arrow">
                  Agenda →
                </a>
              </div>

              <div className="dash-timeline">
                {eventos.length === 0 ? (
                    <div className="dash-empty-Build">
                      <p className="dash-muted">Sincronizando eventos do calendário econômico...</p>
                    </div>
                ) : (
                    eventos.map((evento, index) => (
                        <div key={evento.id || index} className="dash-timeline-item">
                          <div className="dash-timeline-track">
                            <span className={`dash-timeline-dot tipo-${evento.tipo?.toLowerCase() || 'macro'}`}></span>
                            <div className="dash-timeline-line"></div>
                          </div>

                          <div className="dash-timeline-card">
                            <div className="dash-timeline-meta">
                              <span className="dash-timeline-time">{evento.hora || evento.dataStr || 'No dia'}</span>
                              <span className="dash-timeline-type">{evento.tipo || 'Macro'}</span>
                            </div>

                            <strong className="dash-timeline-title">{evento.titulo}</strong>

                            <div className="dash-timeline-foot">
                              <div className="dash-impact-meter" title={`Relevância: ${evento.impacto || 2}/3`}>
                                <span className="dash-impact-label">Impacto</span>
                                <div className="dash-impact-bars">
                                  <span className={`impact-bar ${(evento.impacto || 1) >= 1 ? 'on' : ''}`}></span>
                                  <span className={`impact-bar ${(evento.impacto || 1) >= 2 ? 'on' : ''}`}></span>
                                  <span className={`impact-bar ${(evento.impacto || 1) >= 3 ? 'on' : ''}`}></span>
                                </div>
                              </div>

                              {evento.projecao && evento.projecao !== '---' && (
                                  <span className="dash-proj-pill">Consenso: {evento.projecao}</span>
                              )}

                              {evento.link && (
                                  <a
                                      href={evento.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="dash-source-link"
                                  >
                                    Fonte ↗
                                  </a>
                              )}
                            </div>
                          </div>
                        </div>
                    ))
                )}
              </div>
            </section>

            <section className="dash-panel dash-panel-concierge">
              <div className="dash-concierge-row">
                <div className="dash-concierge-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className="dash-concierge-text">
                  <h4>Fórum & Canal de Análise</h4>
                  <p>Interaja com outros investidores e tire dúvidas diretamente com a equipe Caddie.</p>
                </div>
              </div>
              <a href="/forum" className="dash-btn dash-btn-outline dash-btn-full">
                Acessar Comunidade Caddie
              </a>
            </section>
          </div>
        </div>
      </div>
  )
}