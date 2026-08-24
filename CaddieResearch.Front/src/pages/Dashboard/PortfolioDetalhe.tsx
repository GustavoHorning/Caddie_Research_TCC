import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import './PortfolioDetalhe.css'

type Aba = 'dashboard' | 'posicoes' | 'aportes' | 'transacoes' | 'recomendacoes'

interface Posicao {
  id: number; ticker: string; nomeAtivo: string; classeAtivo: string
  quantidade: number; precoMedio: number; dataEntrada: string; valorTotal: number
}
interface Aporte {
  id: number; valor: number; descricao: string; dataAporte: string
}
interface Recomendacao {
  id: number; ticker: string; nomeAtivo: string; classeAtivo: string
  quantidade: number; precoSugerido: number; descricao: string | null
  origem: string; status: string; dataCriacao: string; nomeGestor: string
}
interface PortfolioData {
  id: number; nome: string; dataInicio: string; nomeCliente: string; posicoes: Posicao[]
}

const CATEGORIAS_ATIVO = [
  'Ações / Units', 'Ativos Personalizados', 'BDR', 'Caixa', 'CDB', 'CDCA', 'COE',
  'Commodities', 'CRI / CRA', 'Criptomoedas', 'Debêntures', 'Direitos de Subscrição',
  'DPGE', 'ETFs', 'FIIs', 'Fundos', 'Futuros', 'LC', 'LCA / LCI / LCD',
  'LF / LFS / LFSN', 'LIG', 'Moedas', 'Offshore - Ações / ETFs / REITs',
  'Offshore - Bonds', 'Opções de Ações', 'Operação Compromissada', 'Poupança',
  'RDB / RDC', 'Recibos de Subscrição', 'Termo de Ações', 'Tesouro Direto',
]

const CORES_CLASSE: Record<string, string> = {
  'Renda Variável': '#00B4D8', 'Renda Fixa': '#7B61FF',
  'Internacional': '#F59E0B', 'Outros': '#6b7280',
}

const MENU_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'posicoes', label: 'Posições', icon: '📋' },
  { key: 'aportes', label: 'Aportes', icon: '💰' },
  { key: 'transacoes', label: 'Transações', icon: '↕️' },
  { key: 'recomendacoes', label: 'Recomendações', icon: '👍' },
]

const BRAPI_TOKEN = import.meta.env.VITE_BRAPI_TOKEN

export default function PortfolioDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [abaAtiva, setAbaAtiva] = useState<Aba>('dashboard')
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [aportes, setAportes] = useState<Aporte[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalAporte, setModalAporte] = useState(false)
  const [novoAporte, setNovoAporte] = useState({ valor: '', descricao: '', dataAporte: '' })
  const [salvando, setSalvando] = useState(false)
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[]>([])
  const [respondendo, setRespondendo] = useState<number | null>(null)
  const [modalTransacao, setModalTransacao] = useState(false)
  const [passoTransacao, setPassoTransacao] = useState<1 | 2>(1)
  const [txTicker, setTxTicker] = useState('')
  const [txData, setTxData] = useState('')
  const [txTipo, setTxTipo] = useState('Compra')
  const [txAtivo, setTxAtivo] = useState<{ nome: string; classe: string; preco: number } | null>(null)
  const [txClasse, setTxClasse] = useState('Renda Variável')
  const [txBuscando, setTxBuscando] = useState(false)
  const [txQuantidade, setTxQuantidade] = useState('')
  const [txPreco, setTxPreco] = useState('')
  const [salvandoTransacao, setSalvandoTransacao] = useState(false)
  const [menuAberto, setMenuAberto] = useState<number | null>(null)
  const [dadosRentabilidade, setDadosRentabilidade] = useState<{ mes: string; portfolio: number; ibovespa: number }[]>([])
  const [carregandoGrafico, setCarregandoGrafico] = useState(false)
  const [toast, setToast] = useState('')

  function mostrarToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const token = localStorage.getItem('caddie_token')
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => { carregarPortfolio(); carregarAportes(); carregarRecomendacoes() }, [id])
  useEffect(() => {
    if (abaAtiva === 'aportes' || abaAtiva === 'transacoes') carregarAportes()
    if (abaAtiva === 'recomendacoes') carregarRecomendacoes()
  }, [abaAtiva])

  async function carregarPortfolio() {
    try {
      const res = await fetch(`http://localhost:5194/api/portfolio/${id}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setPortfolio(data)
        if (data.posicoes?.length > 0) carregarGrafico(data.posicoes)
      }
    } catch (e) { console.error(e) }
    finally { setCarregando(false) }
  }

  async function carregarAportes() {
    try {
      const res = await fetch(`http://localhost:5194/api/portfolio/${id}/aportes`, { headers })
      if (res.ok) setAportes(await res.json())
    } catch (e) { console.error(e) }
  }

  async function salvarAporte() {
    if (!novoAporte.valor) return
    setSalvando(true)
    try {
      const res = await fetch(`http://localhost:5194/api/portfolio/${id}/aportes`, {
        method: 'POST', headers,
        body: JSON.stringify({ valor: parseFloat(novoAporte.valor), descricao: novoAporte.descricao, dataAporte: novoAporte.dataAporte || null })
      })
      if (res.ok) {
        setModalAporte(false)
        setNovoAporte({ valor: '', descricao: '', dataAporte: '' })
        setAbaAtiva('aportes')
        carregarAportes()
      }
    } catch (e) { console.error(e) }
    finally { setSalvando(false) }
  }

  async function carregarGrafico(posicoes: Posicao[]) {
    if (!posicoes || posicoes.length === 0) return
    setCarregandoGrafico(true)
    try {
      const ticker = posicoes[0].ticker
      const tickerYahoo = `${ticker}.SA`
      const base = 'http://localhost:5194/api/mercado/historico'

      const [resAtivo, resIbov] = await Promise.all([
        fetch(`${base}?ticker=${tickerYahoo}&range=1y&interval=1d`, { headers }),
        fetch(`${base}?ticker=%5EBVSP&range=1y&interval=1d`, { headers })
      ])

      const [jsonAtivo, jsonIbov] = await Promise.all([resAtivo.json(), resIbov.json()])

      const resultAtivo = jsonAtivo?.chart?.result?.[0]
      const resultIbov = jsonIbov?.chart?.result?.[0]

      if (!resultAtivo || !resultIbov) {
        console.warn('Histórico vazio - Yahoo Finance não retornou dados')
        return
      }

      const timestamps: number[] = resultAtivo.timestamp || []
      const fechamentosAtivo: number[] = resultAtivo.indicators?.quote?.[0]?.close || []
      const fechamentosIbov: number[] = resultIbov.indicators?.quote?.[0]?.close || []

      if (timestamps.length === 0 || fechamentosAtivo.length === 0) return

      // Filtra apenas pontos com valores válidos
      const pontos = timestamps
        .map((ts, i) => ({
          ts,
          closeAtivo: fechamentosAtivo[i],
          closeIbov: fechamentosIbov[i]
        }))
        .filter(p => p.closeAtivo != null && p.closeIbov != null)

      if (pontos.length === 0) return

      const baseAtivo = pontos[0].closeAtivo
      const baseIbov = pontos[0].closeIbov
      const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

      // Agrupa por mês — pega último fechamento de cada mês
      const porMes: Record<string, { portfolio: number; ibovespa: number }> = {}
      for (const p of pontos) {
        const data = new Date(p.ts * 1000)
        const chave = `${data.getFullYear()}-${data.getMonth()}`
        porMes[chave] = {
          portfolio: parseFloat((((p.closeAtivo - baseAtivo) / baseAtivo) * 100).toFixed(2)),
          ibovespa: parseFloat((((p.closeIbov - baseIbov) / baseIbov) * 100).toFixed(2))
        }
      }

      const dados = Object.entries(porMes).map(([chave, vals]) => {
        const [ano, mes] = chave.split('-').map(Number)
        return { mes: `${meses[mes]}/${String(ano).slice(2)}`, ...vals }
      })

      setDadosRentabilidade(dados)
    } catch (e) { console.error('Erro ao carregar gráfico:', e) }
    finally { setCarregandoGrafico(false) }
  }

  async function carregarRecomendacoes() {
    try {
      const res = await fetch('http://localhost:5194/api/recomendacoes/minhas', { headers })
      if (res.ok) setRecomendacoes(await res.json())
    } catch (e) { console.error(e) }
  }

  async function aderir(recId: number) {
    setRespondendo(recId)
    try {
      const res = await fetch(`http://localhost:5194/api/recomendacoes/${recId}/aderir`, { method: 'POST', headers })
      if (res.ok) { carregarRecomendacoes(); carregarPortfolio() }
    } catch (e) { console.error(e) }
    finally { setRespondendo(null) }
  }

  async function recusar(recId: number) {
    setRespondendo(recId)
    try {
      const res = await fetch(`http://localhost:5194/api/recomendacoes/${recId}/recusar`, { method: 'POST', headers })
      if (res.ok) carregarRecomendacoes()
    } catch (e) { console.error(e) }
    finally { setRespondendo(null) }
  }

  function abrirModalTransacao() {
    setPassoTransacao(1)
    setTxTicker(''); setTxData(''); setTxTipo('Compra'); setTxClasse('Renda Variável')
    setTxAtivo(null); setTxQuantidade(''); setTxPreco('')
    setModalTransacao(true)
  }

  async function buscarAtivo(_ticker: string) {
    // Integração com Brapi pendente — preenchimento manual por enquanto
  }

  async function salvarTransacao() {
    if (!txTicker || !txQuantidade || !txPreco) return
    setSalvandoTransacao(true)
    try {
      const res = await fetch(`http://localhost:5194/api/portfolio/${id}/posicoes`, {
        method: 'POST', headers,
        body: JSON.stringify({
          ticker: txTicker.toUpperCase(),
          nomeAtivo: txAtivo?.nome || txTicker,
          classeAtivo: txAtivo?.classe || txClasse,
          quantidade: parseFloat(txQuantidade),
          precoMedio: parseFloat(txPreco),
          dataEntrada: txData || null
        })
      })
      if (res.ok) {
        setModalTransacao(false)
        carregarPortfolio()
        mostrarToast('✅ Transação cadastrada com sucesso!')
      } else {
        mostrarToast('❌ Erro ao cadastrar transação.')
      }
    } catch (e) { console.error(e); mostrarToast('❌ Erro ao cadastrar transação.') }
    finally { setSalvandoTransacao(false) }
  }

  async function removerAporte(aporteId: number) {
    await fetch(`http://localhost:5194/api/portfolio/${id}/aportes/${aporteId}`, { method: 'DELETE', headers })
    setAportes(prev => prev.filter(a => a.id !== aporteId))
  }

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const patrimonio = portfolio?.posicoes?.reduce((a, p) => a + p.valorTotal, 0) ?? 0
  const totalAportes = aportes.reduce((a, ap) => a + ap.valor, 0)

  const alocacaoPorClasse = portfolio?.posicoes?.reduce((acc, p) => {
    acc[p.classeAtivo] = (acc[p.classeAtivo] || 0) + p.valorTotal
    return acc
  }, {} as Record<string, number>) ?? {}
  const totalAlocacao = Object.values(alocacaoPorClasse).reduce((a, b) => a + b, 0)

  const donutSegments = () => {
    const classes = Object.entries(alocacaoPorClasse)
    const radius = 70, cx = 90, cy = 90, circ = 2 * Math.PI * radius
    let offset = 0
    return classes.map(([classe, valor]) => {
      const dash = (valor / totalAlocacao) * circ
      const seg = (
        <circle key={classe} cx={cx} cy={cy} r={radius} fill="none"
          stroke={CORES_CLASSE[classe] || '#6b7280'} strokeWidth="28"
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
        />
      )
      offset += dash
      return seg
    })
  }

  if (carregando) return <div className="pd-loading">Carregando portfólio...</div>
  if (!portfolio) return <div className="pd-loading">Portfólio não encontrado.</div>

  return (
    <div className="pd-page">
      {/* Header */}
      <div className="pd-header">
        <button className="pd-voltar" onClick={() => navigate('/portfolio')}>← Portfólios</button>
        <div className="pd-header-info">
          <div className="pd-header-cliente">
            <h2 className="pd-nome-cliente">{portfolio.nomeCliente}</h2>
            <span className="pd-data-inicio">📅 Início do portfólio: {new Date(portfolio.dataInicio).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="pd-header-stats">
            <div className="pd-stat">
              <span className="pd-stat-label">Patrimônio em {new Date().toLocaleDateString('pt-BR')}</span>
              <span className="pd-stat-val">{formatBRL(totalAportes)}</span>
            </div>
            <div className="pd-stat">
              <span className="pd-stat-label">Resultado (Ano atual)</span>
              {patrimonio > 0
                ? <span className="pd-stat-resultado">{formatBRL(patrimonio)} <span className="pd-badge-positivo">+0,00% ↑</span></span>
                : <span className="pd-badge-neutro">— aguardando posições</span>
              }
            </div>
            <div className="pd-stat">
              <span className="pd-stat-label">Portfólio</span>
              <span className="pd-stat-nome">{portfolio.nome}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pd-layout">
        {/* Menu lateral */}
        <nav className="pd-nav">
          <div className="pd-nav-section">
            {MENU_ITEMS.map(item => (
              <button key={item.key}
                className={`pd-nav-item ${abaAtiva === item.key ? 'ativo' : ''}`}
                onClick={() => setAbaAtiva(item.key as Aba)}>
                <span>{item.icon}</span><span>{item.label}</span>
              </button>
            ))}
          </div>
          <div className="pd-nav-divider" />
          <div className="pd-nav-section">
            <button className="pd-nav-item pd-nav-acao" onClick={() => setModalAporte(true)}>
              <span>➕</span><span>Cadastrar aporte</span>
            </button>
            <button className="pd-nav-item pd-nav-acao" onClick={abrirModalTransacao}>
              <span>↕️</span><span>Cadastrar transação</span>
            </button>
            <button className="pd-nav-item pd-nav-acao">
              <span>📄</span><span>Gerar relatório</span>
            </button>
          </div>
        </nav>

        {/* Conteúdo */}
        <div className="pd-conteudo">

          {/* DASHBOARD */}
          {abaAtiva === 'dashboard' && (
            <div className="pd-dashboard-grid">
              {/* Gráfico rentabilidade */}
              <div className="pd-card pd-card-chart">
                <h3>Rentabilidade vs IBOVESPA</h3>
                {carregandoGrafico && <p style={{ color: '#8b949e', fontSize: '0.82rem' }}>Carregando dados de mercado...</p>}
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={dadosRentabilidade} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="mes" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => `${v}%`} tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                      labelStyle={{ color: '#e6edf3' }}
                      formatter={(v: number) => [`${v.toFixed(2)}%`]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#8b949e' }} />
                    <Line type="monotone" dataKey="portfolio" name="Portfólio" stroke="#00B4D8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ibovespa" name="IBOVESPA" stroke="#7B61FF" strokeWidth={2} dot={false} strokeDasharray="5 3" />
                  </LineChart>
                </ResponsiveContainer>
                {dadosRentabilidade.length === 0 && !carregandoGrafico && (
                  <p className="pd-chart-aviso">* Cadastre posições para visualizar a rentabilidade real.</p>
                )}
              </div>

              {/* Alocação patrimonial */}
              <div className="pd-card pd-card-alocacao">
                <h3>Alocação Patrimonial</h3>
                {totalAlocacao === 0 ? (
                  <div className="pd-vazio"><span>🥧</span><p>Sem posições registradas.</p></div>
                ) : (
                  <>
                    <svg viewBox="0 0 180 180" className="pd-donut">
                      {donutSegments()}
                      <circle cx="90" cy="90" r="56" fill="#0d1117" />
                      <text x="90" y="87" textAnchor="middle" fill="#e6edf3" fontSize="11" fontWeight="700">Patrimônio</text>
                      <text x="90" y="103" textAnchor="middle" fill="#8b949e" fontSize="9">{formatBRL(totalAlocacao)}</text>
                    </svg>
                    <div className="pd-legenda">
                      {Object.entries(alocacaoPorClasse).map(([classe, valor]) => (
                        <div key={classe} className="pd-legenda-item">
                          <span className="pd-legenda-cor" style={{ background: CORES_CLASSE[classe] || '#6b7280' }} />
                          <span className="pd-legenda-label">{classe}</span>
                          <span className="pd-legenda-pct">{((valor / totalAlocacao) * 100).toFixed(1)}%</span>
                          <span className="pd-legenda-val">{formatBRL(valor)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Resumo stats */}
              <div className="pd-card pd-card-resumo">
                <h3>Resumo</h3>
                <div className="pd-resumo-stats">
                  <div className="pd-resumo-stat">
                    <span className="pd-resumo-label">Total em aportes</span>
                    <span className="pd-resumo-valor">{formatBRL(totalAportes)}</span>
                  </div>
                  <div className="pd-resumo-stat">
                    <span className="pd-resumo-label">Posições ativas</span>
                    <span className="pd-resumo-valor">{portfolio.posicoes?.length ?? 0}</span>
                  </div>
                  <div className="pd-resumo-stat">
                    <span className="pd-resumo-label">Patrimônio alocado</span>
                    <span className="pd-resumo-valor">{formatBRL(patrimonio)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* POSIÇÕES */}
          {abaAtiva === 'posicoes' && (
            <div className="pd-card full">
              <h3>Posições</h3>
              {!portfolio.posicoes || portfolio.posicoes.length === 0 ? (
                <div className="pd-vazio">
                  <span>📊</span><p>Nenhuma posição registrada ainda.</p>
                  <span className="pd-vazio-sub">As posições serão adicionadas após o alinhamento com o gestor.</span>
                </div>
              ) : (
                <table className="pd-table">
                  <thead><tr><th>Ativo</th><th>Classe</th><th>Qtd</th><th>Preço Médio</th><th>Valor Total</th><th>Entrada</th></tr></thead>
                  <tbody>
                    {portfolio.posicoes.map(p => (
                      <tr key={p.id}>
                        <td><span className="pd-ticker">{p.ticker}</span><span className="pd-ativo-nome">{p.nomeAtivo}</span></td>
                        <td><span className="pd-classe-tag" style={{ borderColor: CORES_CLASSE[p.classeAtivo] || '#6b7280', color: CORES_CLASSE[p.classeAtivo] || '#6b7280' }}>{p.classeAtivo}</span></td>
                        <td>{p.quantidade}</td>
                        <td>{formatBRL(p.precoMedio)}</td>
                        <td className="pd-valor-total">{formatBRL(p.valorTotal)}</td>
                        <td>{new Date(p.dataEntrada).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* APORTES */}
          {abaAtiva === 'aportes' && (
            <div className="pd-card full">
              <div className="pd-section-header">
                <h3>Aportes</h3>
                <button className="pd-btn-primary" onClick={() => setModalAporte(true)}>+ Novo Aporte</button>
              </div>
              {aportes.length === 0 ? (
                <div className="pd-vazio"><span>💰</span><p>Nenhum aporte registrado ainda.</p></div>
              ) : (
                <table className="pd-table">
                  <thead><tr><th>Data</th><th>Valor</th><th>Descrição</th><th></th></tr></thead>
                  <tbody>
                    {aportes.map(a => (
                      <tr key={a.id}>
                        <td>{new Date(a.dataAporte).toLocaleDateString('pt-BR')}</td>
                        <td className="pd-valor-total">{formatBRL(a.valor)}</td>
                        <td>{a.descricao || '—'}</td>
                        <td><button className="pd-btn-remover" onClick={() => removerAporte(a.id)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr>
                    <td><strong>Total</strong></td>
                    <td className="pd-valor-total"><strong>{formatBRL(totalAportes)}</strong></td>
                    <td colSpan={2}></td>
                  </tr></tfoot>
                </table>
              )}
            </div>
          )}

          {/* TRANSAÇÕES */}
          {abaAtiva === 'transacoes' && (
            <div className="pd-card full" onClick={() => setMenuAberto(null)}>
              <h3>Transações</h3>
              {!portfolio.posicoes || portfolio.posicoes.length === 0 ? (
                <div className="pd-vazio"><span>↕️</span><p>Nenhuma transação registrada.</p><span className="pd-vazio-sub">Clique em "Cadastrar transação" para adicionar.</span></div>
              ) : (
                <table className="pd-table">
                  <thead>
                    <tr>
                      <th>Ativo</th>
                      <th>Tipo</th>
                      <th>Data da transação</th>
                      <th>Quantidade</th>
                      <th>Preço</th>
                      <th>Custos</th>
                      <th>Valor total</th>
                      <th>Origem</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.posicoes.map(p => (
                      <tr key={p.id}>
                        <td><span className="pd-ticker">{p.ticker}</span><span className="pd-ativo-nome">{p.nomeAtivo}</span></td>
                        <td><span className="pd-classe-tag" style={{ borderColor: '#22c55e', color: '#22c55e' }}>Compra</span></td>
                        <td>{new Date(p.dataEntrada).toLocaleDateString('pt-BR')}</td>
                        <td>{p.quantidade}</td>
                        <td>{formatBRL(p.precoMedio)}</td>
                        <td style={{ color: '#8b949e' }}>—</td>
                        <td className="pd-valor-total">{formatBRL(p.valorTotal)}</td>
                        <td style={{ color: '#8b949e', fontSize: '0.82rem' }}>Manual</td>
                        <td style={{ position: 'relative' }}>
                          <button className="pd-btn-3pontos" onClick={e => { e.stopPropagation(); setMenuAberto(menuAberto === p.id ? null : p.id) }}>⋮</button>
                          {menuAberto === p.id && (
                            <div className="pd-dropdown-menu" onClick={e => e.stopPropagation()}>
                              <button className="pd-dropdown-item">✏️ Editar</button>
                              <button className="pd-dropdown-item pd-dropdown-excluir" onClick={async () => {
                                await fetch(`http://localhost:5194/api/portfolio/${id}/posicoes/${p.id}`, { method: 'DELETE', headers })
                                setMenuAberto(null)
                                carregarPortfolio()
                              }}>🗑️ Excluir</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* RECOMENDAÇÕES */}
          {abaAtiva === 'recomendacoes' && (
            <div className="pd-card full">
              <h3>👍 Recomendações do Gestor</h3>
              {recomendacoes.length === 0 ? (
                <div className="pd-vazio"><span>👍</span><p>Nenhuma recomendação recebida ainda.</p><span className="pd-vazio-sub">Quando o gestor enviar uma recomendação, ela aparecerá aqui.</span></div>
              ) : (
                <table className="pd-table">
                  <thead><tr><th>Ativo</th><th>Classe</th><th>Qtd</th><th>Preço Sugerido</th><th>Valor Total</th><th>Gestor</th><th>Status</th><th>Ações</th></tr></thead>
                  <tbody>
                    {recomendacoes.map(r => (
                      <tr key={r.id}>
                        <td><span className="pd-ticker">{r.ticker}</span><span className="pd-ativo-nome">{r.nomeAtivo}</span></td>
                        <td><span className="pd-classe-tag" style={{ borderColor: CORES_CLASSE[r.classeAtivo] || '#6b7280', color: CORES_CLASSE[r.classeAtivo] || '#6b7280' }}>{r.classeAtivo}</span></td>
                        <td>{r.quantidade}</td>
                        <td>{formatBRL(r.precoSugerido)}</td>
                        <td className="pd-valor-total">{formatBRL(r.quantidade * r.precoSugerido)}</td>
                        <td>{r.nomeGestor}</td>
                        <td>
                          <span className={`pd-classe-tag ${r.status === 'Aceita' ? 'pd-status-aceita' : r.status === 'Recusada' ? 'pd-status-recusada' : 'pd-status-pendente'}`}
                            style={r.status === 'Pendente' ? { borderColor: '#F59E0B', color: '#F59E0B' } : r.status === 'Aceita' ? { borderColor: '#22c55e', color: '#22c55e' } : { borderColor: '#ef4444', color: '#ef4444' }}>
                            {r.status}
                          </span>
                        </td>
                        <td>
                          {r.status === 'Pendente' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="pd-btn-aderir" onClick={() => aderir(r.id)} disabled={respondendo === r.id}>
                                {respondendo === r.id ? '...' : '✅ Aderir'}
                              </button>
                              <button className="pd-btn-recusar" onClick={() => recusar(r.id)} disabled={respondendo === r.id}>
                                ✕
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Aporte */}
      {modalAporte && (
        <div className="pd-modal-overlay" onClick={() => setModalAporte(false)}>
          <div className="pd-modal" onClick={e => e.stopPropagation()}>
            <h3>Cadastrar Aporte</h3>
            <div className="pd-form-group">
              <label>Valor (R$)</label>
              <input type="number" placeholder="Ex: 5000.00" value={novoAporte.valor}
                onChange={e => setNovoAporte(p => ({ ...p, valor: e.target.value }))} />
            </div>
            <div className="pd-form-group">
              <label>Data do aporte</label>
              <input type="date" value={novoAporte.dataAporte}
                onChange={e => setNovoAporte(p => ({ ...p, dataAporte: e.target.value }))} />
            </div>
            <div className="pd-form-group">
              <label>Descrição (opcional)</label>
              <input type="text" placeholder="Ex: Aporte mensal" value={novoAporte.descricao}
                onChange={e => setNovoAporte(p => ({ ...p, descricao: e.target.value }))} />
            </div>
            <div className="pd-modal-acoes">
              <button className="pd-btn-primary" onClick={salvarAporte} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Confirmar'}
              </button>
              <button className="pd-btn-cancelar" onClick={() => setModalAporte(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {/* Toast */}
      {toast && <div className="pd-toast">{toast}</div>}

      {/* Modal Transação */}
      {modalTransacao && (
        <div className="pd-modal-overlay" onClick={() => setModalTransacao(false)}>
          <div className="pd-modal-transacao" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="pd-modal-tx-header">
              <h3>Cadastrar transação</h3>
              <div className="pd-modal-tx-passo">
                <span>Passo {passoTransacao} de 2</span>
                <div className="pd-passo-bar">
                  <div className="pd-passo-fill" style={{ width: passoTransacao === 1 ? '50%' : '100%' }} />
                </div>
                <button className="pd-modal-tx-fechar" onClick={() => setModalTransacao(false)}>✕</button>
              </div>
            </div>

            {/* PASSO 1 */}
            {passoTransacao === 1 && (
              <div className="pd-modal-tx-body">
                <label className="pd-tx-label">Ativo</label>
                <div className="pd-tx-busca">
                  <span className="pd-tx-busca-icon">🔍</span>
                  <input autoFocus type="text" placeholder="Busque por nome, ticker, empresa ou tipo"
                    value={txTicker}
                    onChange={e => { setTxTicker(e.target.value.toUpperCase()); setTxAtivo(null) }}
                    onBlur={() => buscarAtivo(txTicker)}
                    onKeyDown={e => e.key === 'Enter' && buscarAtivo(txTicker)}
                  />
                  {txBuscando && <span style={{ color: '#8b949e', fontSize: '0.8rem' }}>buscando...</span>}
                  {txAtivo && <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>✓ {txAtivo.nome}</span>}
                  {txTicker && <button style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }} onClick={() => { setTxTicker(''); setTxAtivo(null) }}>✕</button>}
                </div>

                <div className="pd-tx-form-grid" style={{ marginTop: 8 }}>
                  <div className="pd-form-group">
                    <label>Data da transação</label>
                    <input type="date" value={txData} onChange={e => setTxData(e.target.value)} />
                  </div>
                  <div className="pd-form-group">
                    <label>Tipo</label>
                    <select style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#e6edf3', fontSize: '0.9rem', outline: 'none' }}
                      value={txTipo} onChange={e => setTxTipo(e.target.value)}>
                      <option>Compra</option>
                      <option>Venda</option>
                    </select>
                  </div>
                  <div className="pd-form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Classe do ativo</label>
                    <select style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#e6edf3', fontSize: '0.9rem', outline: 'none' }}
                      value={txClasse} onChange={e => setTxClasse(e.target.value)}>
                      <option>Renda Variável</option>
                      <option>Renda Fixa</option>
                      <option>Internacional</option>
                      <option>Outros</option>
                    </select>
                  </div>
                </div>

                <div className="pd-modal-acoes" style={{ marginTop: 8 }}>
                  <button className="pd-btn-primary"
                    disabled={!txTicker}
                    onClick={() => setPassoTransacao(2)}>
                    Próximo
                  </button>
                </div>
              </div>
            )}

            {/* PASSO 2 */}
            {passoTransacao === 2 && (
              <div className="pd-modal-tx-p2">
                {/* Painel esquerdo — resumo */}
                <div className="pd-tx-resumo-card">
                  <div className="pd-tx-resumo-item"><span>Ativo</span><strong>{txTicker}</strong></div>
                  <div className="pd-tx-resumo-item"><span>Classe</span><strong>{txAtivo?.classe || 'Renda Variável'}</strong></div>
                  <div className="pd-tx-resumo-item"><span>Tipo</span><strong>{txTipo}</strong></div>
                  {txData && <div className="pd-tx-resumo-item"><span>Data</span><strong>{new Date(txData + 'T12:00:00').toLocaleDateString('pt-BR')}</strong></div>}
                </div>

                {/* Painel direito — quantidade e preço */}
                <div className="pd-tx-detalhes">
                  <div className="pd-form-group">
                    <label>Quantidade</label>
                    <input type="number" placeholder="Ex.: 100" value={txQuantidade}
                      onChange={e => setTxQuantidade(e.target.value)} />
                  </div>
                  <div className="pd-form-group">
                    <label>Preço</label>
                    <input type="number" value={txPreco}
                      onChange={e => setTxPreco(e.target.value)} />
                    {txAtivo?.preco > 0 && (
                      <span style={{ fontSize: '0.76rem', color: '#8b949e', marginTop: 4 }}>
                        Preço de ref. R$ {txAtivo.preco.toFixed(2)} em {new Date().toLocaleDateString('pt-BR')}.
                      </span>
                    )}
                  </div>

                  <div className="pd-tx-total">
                    <span>Total</span>
                    <strong>
                      {txQuantidade && txPreco
                        ? formatBRL(parseFloat(txQuantidade) * parseFloat(txPreco))
                        : 'R$ 0,00'}
                    </strong>
                  </div>

                  <div className="pd-modal-acoes">
                    <button className="pd-btn-primary" onClick={salvarTransacao} disabled={salvandoTransacao}>
                      {salvandoTransacao ? 'Salvando...' : 'Cadastrar'}
                    </button>
                    <button className="pd-btn-cancelar" onClick={() => setPassoTransacao(1)}>Voltar</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
