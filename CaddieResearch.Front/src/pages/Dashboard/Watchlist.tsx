import { useState, useEffect } from 'react'
import api from '../../services/api'
import './Watchlist.css'

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

type Aba = 'todos' | 'acoes' | 'rendafixa' | 'internacional'

export default function Watchlist() {
  const [favoritos, setFavoritos] = useState<Favorito[]>([])
  const [cotacoes, setCotacoes] = useState<Record<string, Cotacao>>({})
  const [carregando, setCarregando] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState<Aba>('todos')

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

  // Junta categoria, carteira e rentabilidade para classificar pelo texto disponível
  function textoClassificacao(f: Favorito): string {
    return `${f.categoria || ''} ${f.nomeCarteira || ''} ${f.rentabilidade || ''}`.toLowerCase()
  }

  // Ticker padrão B3: 4 letras + 1 ou 2 dígitos (WEGE3, EGIE3, BBDC4, BPAC11)
  function ehAcaoB3(ticker: string): boolean {
    return /^[A-Za-z]{4}\d{1,2}$/.test(ticker || '')
  }

  function filtroInternacional(f: Favorito): boolean {
    const txt = textoClassificacao(f)
    if (txt.includes('internacional') || txt.includes('etf') || txt.includes('usd')) return true
    if (f.ticker?.includes('.')) return true
    return false
  }

  function filtroRendaFixa(f: Favorito): boolean {
    const txt = textoClassificacao(f)
    if (
      txt.includes('renda fixa') || txt.includes('cri') || txt.includes('cra') ||
      txt.includes('debenture') || txt.includes('debênture') || txt.includes('tesouro') ||
      txt.includes('lci') || txt.includes('lca') || txt.includes('cdb') ||
      txt.includes('atrelado') || txt.includes('inflação') || txt.includes('inflacao') ||
      txt.includes('prefixado') || txt.includes('selic') || txt.includes('fundo')
    ) return true
    // Tem rentabilidade alvo mas não é ação com ticker padrão da B3
    if (f.rentabilidade && !ehAcaoB3(f.ticker)) return true
    return false
  }

  function filtroAcoes(f: Favorito): boolean {
    // Se já é renda fixa ou internacional, não é ação
    if (filtroRendaFixa(f) || filtroInternacional(f)) return false
    // Ticker no formato da B3 = ação
    return ehAcaoB3(f.ticker)
  }

  function getFavoritosFiltrados(): Favorito[] {
    if (abaAtiva === 'todos') return favoritos
    if (abaAtiva === 'acoes') return favoritos.filter(filtroAcoes)
    if (abaAtiva === 'rendafixa') return favoritos.filter(filtroRendaFixa)
    if (abaAtiva === 'internacional') return favoritos.filter(filtroInternacional)
    return favoritos
  }

  function contarPorCategoria(cat: Aba): number {
    if (cat === 'todos') return favoritos.length
    if (cat === 'acoes') return favoritos.filter(filtroAcoes).length
    if (cat === 'rendafixa') return favoritos.filter(filtroRendaFixa).length
    if (cat === 'internacional') return favoritos.filter(filtroInternacional).length
    return 0
  }

  const favoritosFiltrados = getFavoritosFiltrados()

  return (
    <div className="wl-page">

      <div className="wl-header">
        <div>
          <h1 className="wl-titulo">⭐ Minha Watchlist</h1>
          <p className="wl-subtitulo">Acompanhe seus ativos favoritos em um só lugar</p>
        </div>
        <div className="wl-header-stats">
          <div className="wl-stat">
            <span className="wl-stat-num">{favoritos.length}</span>
            <span className="wl-stat-label">ativos salvos</span>
          </div>
        </div>
      </div>

      <div className="wl-abas">
        {([
          { key: 'todos', label: 'Todos' },
          { key: 'acoes', label: 'Ações B3' },
          { key: 'rendafixa', label: 'Renda Fixa' },
          { key: 'internacional', label: 'Internacional' },
        ] as { key: Aba; label: string }[]).map(aba => (
          <button
            key={aba.key}
            className={`wl-aba ${abaAtiva === aba.key ? 'ativa' : ''}`}
            onClick={() => setAbaAtiva(aba.key)}
          >
            {aba.label}
            <span className="wl-aba-count">{contarPorCategoria(aba.key)}</span>
          </button>
        ))}
      </div>

      {carregando ? (
        <div className="wl-loading">
          <div className="wl-loading-spinner" />
          <p>Carregando seus favoritos...</p>
        </div>
      ) : favoritosFiltrados.length === 0 ? (
        <div className="wl-vazio">
          <span className="wl-vazio-icon">⭐</span>
          <p className="wl-vazio-titulo">
            {abaAtiva === 'todos'
              ? 'Nenhum ativo favoritado ainda'
              : `Nenhum ativo de ${abaAtiva === 'acoes' ? 'Ações B3' : abaAtiva === 'rendafixa' ? 'Renda Fixa' : 'Internacional'} favoritado`}
          </p>
          <span className="wl-vazio-sub">
            Acesse as carteiras e clique em ⭐ para adicionar ativos aqui.
          </span>
          <a href="/carteiras" className="wl-vazio-btn">Ver Carteiras</a>
        </div>
      ) : (
        <div className="wl-grid">
          {favoritosFiltrados.map((f) => {
            const cotacao = cotacoes[f.ticker]
            const isPositivo = cotacao ? cotacao.regularMarketChangePercent >= 0 : null
            return (
              <div key={f.id} className="wl-card">
                <div className="wl-card-top">
                  <div className="wl-card-ticker-wrap">
                    <span className="wl-card-ticker">{f.ticker}</span>
                    {f.nomeEmpresa && (
                      <span className="wl-card-nome">{f.nomeEmpresa}</span>
                    )}
                  </div>
                  <button
                    className="wl-card-remove"
                    onClick={() => removerFavorito(f.ticker)}
                    title="Remover da watchlist"
                  >
                    ✕
                  </button>
                </div>

                <div className="wl-card-tags">
                  {f.categoria && (
                    <span className="wl-tag wl-tag-cat">{f.categoria}</span>
                  )}
                  {f.nomeCarteira && (
                    <span className="wl-tag wl-tag-carteira">{f.nomeCarteira}</span>
                  )}
                </div>

                <div className="wl-card-bottom">
                  {cotacao ? (
                    <>
                      <span className="wl-card-preco">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cotacao.regularMarketPrice)}
                      </span>
                      <span className={`wl-card-var ${isPositivo ? 'positivo' : 'negativo'}`}>
                        {isPositivo ? '▲' : '▼'} {Math.abs(cotacao.regularMarketChangePercent).toFixed(2)}%
                      </span>
                    </>
                  ) : f.rentabilidade ? (
                    <span className="wl-card-rentabilidade">{f.rentabilidade}</span>
                  ) : (
                    <span className="wl-card-indisponivel">Cotação indisponível</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}