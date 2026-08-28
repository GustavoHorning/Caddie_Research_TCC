import { useState, useEffect } from 'react'
import './DashboardHome.css'
import api from '../../services/api'

const ultimasAtualizacoes = [
  { icon: 'RE', titulo: 'Radar Econômico', subtitulo: 'Edição #48', tag: 'Relatório', tempo: 'há 2 dias' },
  { icon: 'RF', titulo: 'Caddie Renda Fixa', subtitulo: 'Edição #237', tag: 'Relatório', tempo: 'há 2 dias' },
  { icon: 'ET', titulo: 'ETFs Internacionais', subtitulo: 'Edição #281', tag: 'Relatório', tempo: 'há 2 dias' },
  { icon: 'CC', titulo: 'Caddie Call #2026', subtitulo: 'A replicação e os investimentos.', tag: '', tempo: '' },
]

const morningCallResumo = {
  titulo: 'Resumo do mercado — 25 de agosto',
  data: 'Hoje, 25/08/2026',
  topicos: [
    'Petrobras anuncia novo plano de dividendos',
    'Copom mantém taxa Selic — reflexo na renda fixa',
    'Ibovespa fecha em alta puxado por commodities',
  ],
}
const proximosEventos = [
  {
    id: 1,
    data: 'Hoje, 09:30',
    titulo: 'EUA: Relatório de Emprego (Payroll)',
    tipo: 'Macro',
    impacto: 3, // 3 = Alta volatilidade
    projecao: '180k',
    atual: '---'
  },
  {
    id: 2,
    data: 'Hoje, 18:00',
    titulo: 'Balanço: WEGE3 (2T26)',
    tipo: 'Balanço',
    impacto: 2
  },
  {
    id: 3,
    data: 'Amanhã, 19:00',
    titulo: 'Live: Rebalanceamento da Carteira',
    tipo: 'Caddie',
    impacto: 1,
    link: true
  }
]

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

export default function DashboardHome() {
  const [favoritos, setFavoritos] = useState<Favorito[]>([])
  const [cotacoes, setCotacoes] = useState<Record<string, Cotacao>>({})
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    carregarFavoritos()
  }, [])

  async function carregarFavoritos() {
    try {
      const token = localStorage.getItem('caddie_token')
      const response = await api.get('/api/favoritos', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFavoritos(response.data)
      carregarCotacoes(response.data)
    } catch (e) {
      console.error('Erro ao carregar favoritos', e)
    } finally {
      setCarregando(false)
    }
  }

  async function carregarCotacoes(favs: Favorito[]) {
    const novasCotacoes: Record<string, Cotacao> = {}
    await Promise.all(
      favs.map(async (f) => {
        try {
          const token = localStorage.getItem('caddie_token')
          const res = await api.get(`/api/acoes/cotacao/${f.ticker}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          novasCotacoes[f.ticker] = res.data
        } catch (e) {
          console.error(`Erro ao buscar cotação de ${f.ticker}`, e)
        }
      })
    )
    setCotacoes(novasCotacoes)
  }

  async function removerFavorito(ticker: string) {
    try {
      const token = localStorage.getItem('caddie_token')
      await api.delete(`/api/favoritos/${ticker}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFavoritos(prev => prev.filter(f => f.ticker !== ticker))
      setCotacoes(prev => {
        const novo = { ...prev }
        delete novo[ticker]
        return novo
      })
    } catch (e) {
      console.error('Erro ao remover favorito', e)
    }
  }

  return (
    <div className="dash-content">
      <div className="dash-topo-row">
        <section className="dash-banner">
          <div className="dash-banner-content">
            <div className="dash-banner-badge">Bem-vindo a Caddie Research</div>
            <h2 className="dash-banner-title">Sua jornada de investimentos começa aqui</h2>
            <p className="dash-banner-text">
              Explore relatórios, carteiras recomendadas e análises exclusivas para tomar decisões mais inteligentes.
            </p>
            <a href="/relatorios" className="dash-banner-btn">VER RELATÓRIOS</a>
          </div>
          <div className="dash-banner-visual">
            <div className="dash-banner-graphic">
              <span className="dash-banner-chart">C</span>
            </div>
          </div>
        </section>

        <div className="dash-promo-card dash-promo-whatsapp">
          <span className="dash-promo-beta">BETA</span>
          <h3>Converse com a Caddie no WhatsApp</h3>
          <p>Tire suas dúvidas sobre as carteiras e ativos recomendados com o nosso suporte</p>
          <a href="#" className="dash-promo-btn">COMECE A USAR</a>
        </div>
      </div>

      <section className="dash-grid">
        <div className="dash-card dash-card-atualizacoes">
          <div className="dash-card-header">
            <h3>Últimas Atualizações</h3>
            <button className="dash-card-toggle">v</button>
          </div>
          <ul className="dash-lista">
            {ultimasAtualizacoes.map((item, i) => (
              <li key={i} className="dash-lista-item">
                <span className="dash-lista-icon">{item.icon}</span>
                <div className="dash-lista-info">
                  <strong>{item.titulo}</strong>
                  <span className="dash-lista-sub">{item.subtitulo}</span>
                </div>
                {item.tag && <span className="dash-lista-tag">{item.tag}</span>}
                {item.tempo && <span className="dash-lista-tempo">{item.tempo}</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="dash-card dash-card-eventos">
          <div className="dash-card-header">
            <h3>Próximos Eventos</h3>
            <a href="/calendario" className="dash-card-link-header">Ver calendário ➔</a>
          </div>

          <div className="dash-eventos-timeline">
            {proximosEventos.map((evento) => (
                <div key={evento.id} className="dash-evento-item">
                  <div className="dash-evento-left">
                    <span className={`dash-evento-dot tipo-${evento.tipo.toLowerCase()}`}></span>
                    <div className="dash-evento-line"></div>
                  </div>

                  <div className="dash-evento-content">
                    <span className="dash-evento-data">{evento.data}</span>

                    <div className="dash-evento-titulo-row">
                      <strong className="dash-evento-titulo">{evento.titulo}</strong>
                    </div>

                    <div className="dash-evento-detalhes">
                      <div className="dash-evento-impacto-barras" title={`Impacto: ${evento.impacto}/3`}>
                        <div className={`barra-impacto ${evento.impacto >= 1 ? 'ativa' : ''}`}></div>
                        <div className={`barra-impacto ${evento.impacto >= 2 ? 'ativa' : ''}`}></div>
                        <div className={`barra-impacto ${evento.impacto >= 3 ? 'ativa' : ''}`}></div>
                      </div>

                      {evento.projecao && (
                          <span className="dash-evento-projecao">Proj: {evento.projecao}</span>
                      )}

                      {evento.link && (
                          <button className="dash-evento-btn-add">+ Adicionar à Agenda</button>
                      )}
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </div>

        <div className="dash-card dash-card-minuto">
          <div className="dash-card-header">
            <h3>Caddie Minuto</h3>
            <span className="dash-card-sub-header">Confira as principais atualizações do mercado.</span>
          </div>
          <div className="dash-minuto-item">
            <div className="dash-minuto-author">
              <div className="dash-minuto-avatar">A</div>
              <div>
                <strong>Analista Caddie</strong>
                <span className="dash-minuto-time"> 7 dias</span>
              </div>
            </div>
            <p className="dash-minuto-text">
              O foco da semana foi a inclusão de novos ativos na carteira de Dividendos, refletindo a estratégia de capturar valor no longo prazo.
            </p>
          </div>
        </div>

        <div className="dash-card dash-card-morningcall">
          <div className="dash-card-header">
            <h3>☕ Morning Call</h3>
            <span className="dash-card-sub-header">{morningCallResumo.data}</span>
          </div>
          <div className="dash-mc-resumo">
            <p className="dash-mc-titulo">{morningCallResumo.titulo}</p>
            <p className="dash-mc-destaque">📰 {morningCallResumo.topicos[0]}</p>
            <span className="dash-mc-mais">
              + {morningCallResumo.topicos.length - 1} notícias para ler
            </span>
            <a href="/morning-call" className="dash-mc-btn">Ler Morning Call →</a>
          </div>
        </div>

        <div className="dash-card dash-card-watchlist">
          <div className="dash-card-header">
            <h3>⭐ Minha Watchlist</h3>
            <span className="dash-card-sub-header">Seus ativos favoritos</span>
          </div>
          {carregando ? (
            <p className="dash-watchlist-empty">Carregando...</p>
          ) : favoritos.length === 0 ? (
            <div className="dash-watchlist-vazio">
              <p>Nenhum ativo favoritado ainda.</p>
              <span>Acesse as carteiras e clique em ⭐ para adicionar ativos aqui.</span>
            </div>
          ) : (
            <ul className="dash-watchlist-lista">
              {favoritos.map((f) => {
                const cotacao = cotacoes[f.ticker]
                const isPositivo = cotacao ? cotacao.regularMarketChangePercent >= 0 : null
                return (
                  <li key={f.id} className="dash-watchlist-item">
                    <div className="dash-watchlist-ticker-box">
                      <span className="dash-watchlist-ticker">{f.ticker}</span>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {f.categoria && <span className="dash-watchlist-cat">{f.categoria}</span>}
                        {f.nomeCarteira && (
                          <span className="dash-watchlist-cat" style={{ background: 'rgba(255,255,255,0.06)', color: '#7a90a8' }}>
                            {f.nomeCarteira}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="dash-watchlist-dados">
                      {cotacao ? (
                        <>
                          <span className="dash-watchlist-preco">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cotacao.regularMarketPrice)}
                          </span>
                          <span className={`dash-watchlist-var ${isPositivo ? 'positivo' : 'negativo'}`}>
                            {isPositivo ? '▲' : '▼'} {Math.abs(cotacao.regularMarketChangePercent).toFixed(2)}%
                          </span>
                        </>
                      ) : f.rentabilidade ? (
                        <span className="dash-watchlist-preco" style={{ color: '#93c5fd', fontSize: '0.8rem' }}>
                          {f.rentabilidade}
                        </span>
                      ) : (
                        <span className="dash-watchlist-indisponivel">—</span>
                      )}
                    </div>
                    <button
                      className="dash-watchlist-remove"
                      onClick={() => removerFavorito(f.ticker)}
                      title="Remover da watchlist"
                    >
                      ✕
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}