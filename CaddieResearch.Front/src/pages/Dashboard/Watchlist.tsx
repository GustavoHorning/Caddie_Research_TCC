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
  anotacao?: string
}

interface Cotacao {
  regularMarketPrice: number
  regularMarketChangePercent: number
  shortName: string
}

interface AbaPersonalizada {
  id: number
  nome: string
  tickers: string[]
}

type AbaFixa = 'todos' | 'acoes' | 'rendafixa' | 'internacional'
type AbaAtiva = AbaFixa | `custom-${number}`

export default function Watchlist() {
  const [favoritos, setFavoritos] = useState<Favorito[]>([])
  const [cotacoes, setCotacoes] = useState<Record<string, Cotacao>>({})
  const [carregando, setCarregando] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('todos')
  const [abasPersonalizadas, setAbasPersonalizadas] = useState<AbaPersonalizada[]>([])
  const [modalNovaAba, setModalNovaAba] = useState(false)
  const [nomeNovaAba, setNomeNovaAba] = useState('')
  const [criandoAba, setCriandoAba] = useState(false)
  const [erroAba, setErroAba] = useState('')
  const [menuAdicionarAba, setMenuAdicionarAba] = useState<string | null>(null)


  useEffect(() => {
    carregarFavoritos()
    carregarAbasPersonalizadas()
  }, [])

  async function carregarFavoritos() {
    try {
      const response = await api.get('/api/favoritos')
      setFavoritos(response.data)
      carregarCotacoes(response.data)
    } catch (e) {
      console.error('Erro ao carregar favoritos', e)
    } finally {
      setCarregando(false)
    }
  }

  async function carregarAbasPersonalizadas() {
    try {
      const response = await api.get('/api/watchlist-abas')
      setAbasPersonalizadas(response.data.map((a: any) => ({ id: a.id, nome: a.nome, tickers: a.tickers })))
    } catch (e) {
      console.error('Erro ao carregar abas personalizadas', e)
    }
  }

  async function carregarCotacoes(favs: Favorito[]) {
    const novasCotacoes: Record<string, Cotacao> = {}
    await Promise.all(
        favs.map(async (f) => {
          try {
            const res = await api.get(`/api/acoes/cotacao/${f.ticker}`)
            novasCotacoes[f.ticker] = res.data
          } catch (e) {
            console.error(`Erro ao buscar cotação de ${f.ticker}`, e)
          }
        })
    )
    setCotacoes(novasCotacoes)
  }

  async function salvarAnotacao(ticker: string, anotacao: string) {
    try {
      await api.patch(`/api/favoritos/${ticker}/anotacao`, { anotacao })
      setFavoritos(prev => prev.map(f => f.ticker === ticker ? { ...f, anotacao } : f))
    } catch (e) {
      console.error('Erro ao salvar anotação', e)
    }
  }

  async function removerFavorito(ticker: string) {
    try {
      await api.delete(`/api/favoritos/${ticker}`)
      setFavoritos(prev => prev.filter(f => f.ticker !== ticker))
      setCotacoes(prev => {
        const novo = { ...prev }
        delete novo[ticker]
        return novo
      })
      setAbasPersonalizadas(prev => prev.map(a => ({ ...a, tickers: a.tickers.filter(t => t !== ticker) })))
    } catch (e) {
      console.error('Erro ao remover favorito', e)
    }
  }


  async function criarAba() {
    const nome = nomeNovaAba.trim()
    if (!nome) {
      setErroAba('Digite um nome para a aba.')
      return
    }
    setCriandoAba(true)
    setErroAba('')
    try {
      const res = await api.post('/api/watchlist-abas', { nome })
      const data = res.data

      setAbasPersonalizadas(prev => [...prev, { id: data.id, nome: data.nome, tickers: [] }])
      setModalNovaAba(false)
      setNomeNovaAba('')
      setAbaAtiva(`custom-${data.id}`)

    } catch (e: any) {
      console.error('Erro ao criar aba', e)
      setErroAba(e.response?.data?.mensagem || 'Não foi possível criar a aba.')
    } finally {
      setCriandoAba(false)
    }
  }

  async function excluirAba(id: number) {
    try {
      await api.delete(`/api/watchlist-abas/${id}`)
      setAbasPersonalizadas(prev => prev.filter(a => a.id !== id))
      if (abaAtiva === `custom-${id}`) setAbaAtiva('todos')
    } catch (e) {
      console.error('Erro ao excluir aba', e)
    }
  }

  async function adicionarNaAba(abaId: number, ticker: string) {
    try {
      await api.post(`/api/watchlist-abas/${abaId}/favoritos/${ticker}`)
      setAbasPersonalizadas(prev => prev.map(a =>
          a.id === abaId && !a.tickers.includes(ticker) ? { ...a, tickers: [...a.tickers, ticker] } : a
      ))
    } catch (e) {
      console.error('Erro ao adicionar na aba', e)
    } finally {
      setMenuAdicionarAba(null)
    }
  }

  async function removerDaAba(abaId: number, ticker: string) {
    try {
      await api.delete(`/api/watchlist-abas/${abaId}/favoritos/${ticker}`)
      setAbasPersonalizadas(prev => prev.map(a =>
          a.id === abaId ? { ...a, tickers: a.tickers.filter(t => t !== ticker) } : a
      ))
    } catch (e) {
      console.error('Erro ao remover da aba', e)
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

  function getAbaPersonalizadaAtiva(): AbaPersonalizada | null {
    if (!abaAtiva.startsWith('custom-')) return null
    const id = parseInt(abaAtiva.replace('custom-', ''))
    return abasPersonalizadas.find(a => a.id === id) || null
  }

  function getFavoritosFiltrados(): Favorito[] {
    const abaCustom = getAbaPersonalizadaAtiva()
    if (abaCustom) return favoritos.filter(f => abaCustom.tickers.includes(f.ticker))
    if (abaAtiva === 'todos') return favoritos
    if (abaAtiva === 'acoes') return favoritos.filter(filtroAcoes)
    if (abaAtiva === 'rendafixa') return favoritos.filter(filtroRendaFixa)
    if (abaAtiva === 'internacional') return favoritos.filter(filtroInternacional)
    return favoritos
  }

  function contarPorCategoria(cat: AbaFixa): number {
    if (cat === 'todos') return favoritos.length
    if (cat === 'acoes') return favoritos.filter(filtroAcoes).length
    if (cat === 'rendafixa') return favoritos.filter(filtroRendaFixa).length
    if (cat === 'internacional') return favoritos.filter(filtroInternacional).length
    return 0
  }

  const favoritosFiltrados = getFavoritosFiltrados()
  const abaCustomAtiva = getAbaPersonalizadaAtiva()

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
          ] as { key: AbaFixa; label: string }[]).map(aba => (
              <button
                  key={aba.key}
                  className={`wl-aba ${abaAtiva === aba.key ? 'ativa' : ''}`}
                  onClick={() => setAbaAtiva(aba.key)}
              >
                {aba.label}
                <span className="wl-aba-count">{contarPorCategoria(aba.key)}</span>
              </button>
          ))}

          {abasPersonalizadas.map(aba => (
              <div key={aba.id} className={`wl-aba-custom-wrap ${abaAtiva === `custom-${aba.id}` ? 'ativa' : ''}`}>
                <button
                    className={`wl-aba wl-aba-custom ${abaAtiva === `custom-${aba.id}` ? 'ativa' : ''}`}
                    onClick={() => setAbaAtiva(`custom-${aba.id}`)}
                >
                  🗂️ {aba.nome}
                  <span className="wl-aba-count">{aba.tickers.length}</span>
                </button>
                <button
                    className="wl-aba-custom-excluir"
                    title="Excluir aba"
                    onClick={() => excluirAba(aba.id)}
                >
                  ✕
                </button>
              </div>
          ))}

          <button className="wl-aba-nova" onClick={() => setModalNovaAba(true)}>
            + Nova aba
          </button>
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
                {abaCustomAtiva
                    ? `Nenhum ativo em "${abaCustomAtiva.nome}" ainda`
                    : abaAtiva === 'todos'
                        ? 'Nenhum ativo favoritado ainda'
                        : `Nenhum ativo de ${abaAtiva === 'acoes' ? 'Ações B3' : abaAtiva === 'rendafixa' ? 'Renda Fixa' : 'Internacional'} favoritado`}
              </p>
              <span className="wl-vazio-sub">
            {abaCustomAtiva
                ? 'Use o botão "🗂️ Adicionar a uma aba" em um ativo da aba "Todos" para colocá-lo aqui.'
                : 'Acesse as carteiras e clique em ⭐ para adicionar ativos aqui.'}
          </span>
              {!abaCustomAtiva && <a href="/carteiras" className="wl-vazio-btn">Ver Carteiras</a>}
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

                      {abaCustomAtiva && (
                          <button
                              className="wl-card-remover-da-aba"
                              onClick={() => removerDaAba(abaCustomAtiva.id, f.ticker)}
                          >
                            🗂️ Remover de "{abaCustomAtiva.nome}"
                          </button>
                      )}

                      {!abaCustomAtiva && abasPersonalizadas.length > 0 && (
                          <div className="wl-card-adicionar-aba-wrap">
                            <button
                                className="wl-card-adicionar-aba"
                                onClick={() => setMenuAdicionarAba(menuAdicionarAba === f.ticker ? null : f.ticker)}
                            >
                              🗂️ Adicionar a uma aba
                            </button>
                            {menuAdicionarAba === f.ticker && (
                                <div className="wl-menu-abas">
                                  {abasPersonalizadas.map(aba => {
                                    const jaEsta = aba.tickers.includes(f.ticker)
                                    return (
                                        <button
                                            key={aba.id}
                                            className={`wl-menu-abas-item ${jaEsta ? 'ja-adicionado' : ''}`}
                                            disabled={jaEsta}
                                            onClick={() => adicionarNaAba(aba.id, f.ticker)}
                                        >
                                          {jaEsta ? '✓' : '+'} {aba.nome}
                                        </button>
                                    )
                                  })}
                                </div>
                            )}
                          </div>
                      )}
                    </div>
                )
              })}
            </div>
        )}

        {modalNovaAba && (
            <div className="wl-modal-overlay" onClick={() => setModalNovaAba(false)}>
              <div className="wl-modal" onClick={e => e.stopPropagation()}>
                <h3>Nova aba personalizada</h3>
                <p className="wl-modal-sub">Dê um nome para organizar seus ativos, ex: "Fica de Olho"</p>
                <input
                    type="text"
                    className="wl-modal-input"
                    placeholder="Nome da aba"
                    value={nomeNovaAba}
                    maxLength={50}
                    autoFocus
                    onChange={e => { setNomeNovaAba(e.target.value); setErroAba('') }}
                    onKeyDown={e => e.key === 'Enter' && criarAba()}
                />
                {erroAba && <p className="wl-modal-erro">{erroAba}</p>}
                <div className="wl-modal-acoes">
                  <button
                      className="wl-modal-cancelar"
                      onClick={() => { setModalNovaAba(false); setNomeNovaAba(''); setErroAba('') }}
                  >
                    Cancelar
                  </button>
                  <button className="wl-modal-confirmar" onClick={criarAba} disabled={criandoAba}>
                    {criandoAba ? 'Criando...' : 'Criar aba'}
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}