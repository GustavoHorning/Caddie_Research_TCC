import { useState, useEffect } from 'react'
import './Watchlist.css'

interface Favorito {
  id: number
  ticker: string
  nomeEmpresa?: string
  categoria?: string
  rentabilidade?: string
  nomeCarteira?: string
  anotacao?: string
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
      const response = await fetch('http://localhost:5194/api/favoritos', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setFavoritos(data)
        carregarCotacoes(data)
      }
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
          const res = await fetch(`http://localhost:5194/api/acoes/cotacao/${f.ticker}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            novasCotacoes[f.ticker] = data
          }
        } catch (e) {
          console.error(`Erro ao buscar cotação de ${f.ticker}`, e)
        }
      })
    )
    setCotacoes(novasCotacoes)
  }

  async function salvarAnotacao(ticker: string, anotacao: string) {
    try {
      const token = localStorage.getItem('caddie_token')
      await fetch(`http://localhost:5194/api/favoritos/${ticker}/anotacao`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ anotacao })
      })
      setFavoritos(prev => prev.map(f => f.ticker === ticker ? { ...f, anotacao } : f))
    } catch (e) {
      console.error('Erro ao salvar anotação', e)
    }
  }

  async function removerFavorito(ticker: string) {
    try {
      const token = localStorage.getItem('caddie_token')
      await fetch(`http://localhost:5194/api/favoritos/${ticker}`, {
        method: 'DELETE',
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

  function filtroRendaFixa(f: Favorito): boolean {
    const cat = f.categoria?.toLowerCase() || ''
    return (
      cat.includes('renda fixa') ||
      cat.includes('cri') ||
      cat.includes('cra') ||
      cat.includes('debenture') ||
      cat.includes('debênture') ||
      cat.includes('tesouro') ||
      cat.includes('lci') ||
      cat.includes('lca') ||
      cat.includes('cdb') ||
      cat.includes('atrelado') ||
      cat.includes('inflação') ||
      cat.includes('inflacao') ||
      cat.includes('prefixado') ||
      cat.includes('selic')
    )
  }

  function filtroAcoes(f: Favorito): boolean {
    const cat = f.categoria?.toLowerCase() || ''
    return (
      cat.includes('ação') ||
      cat.includes('acao') ||
      cat.includes('ações') ||
      cat.includes('acoes') ||
      cat.includes('b3')
    )
  }

  function filtroInternacional(f: Favorito): boolean {
    const cat = f.categoria?.toLowerCase() || ''
    return (
      cat.includes('internacional') ||
      cat.includes('etf') ||
      cat.includes('usd') ||
      f.ticker?.includes('.')
    )
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

                <textarea
                  className="wl-card-anotacao"
                  placeholder="Adicione uma anotação..."
                  defaultValue={f.anotacao || ''}
                  onBlur={e => salvarAnotacao(f.ticker, e.target.value)}
                  rows={2}
                />

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