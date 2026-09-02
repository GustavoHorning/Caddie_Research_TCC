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
  'Internacional': '#F59E0B', 'Commodities': '#F97316', 'Futuros': '#EC4899', 'Caixa Livre': '#22c55e', 'Outros': '#6b7280',
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
  const [ftTipoOp, setFtTipoOp] = useState<'Intraday' | 'Swing'>('Swing')
  const [rfModalidade, setRfModalidade] = useState<'Pós-fixado' | 'Prefixado'>('Pós-fixado')
  const [rfIndexador, setRfIndexador] = useState('% do CDI')
  const [rfTaxa, setRfTaxa] = useState('100,00')
  const [rfValor, setRfValor] = useState('')
  const [rfVencimento, setRfVencimento] = useState('')
  const [rfBanco, setRfBanco] = useState('')
  const [rfPeriodicidade, setRfPeriodicidade] = useState('No vencimento')
  const [menuAberto, setMenuAberto] = useState<number | null>(null)
  const [modalPrecoManual, setModalPrecoManual] = useState<{ posicaoId: number; ticker: string } | null>(null)
  const [precoManualInput, setPrecoManualInput] = useState('')
  const [dadosRentabilidade, setDadosRentabilidade] = useState<{ mes: string; portfolio: number; ibovespa: number }[]>([])
  const [carregandoGrafico, setCarregandoGrafico] = useState(false)
  const [toast, setToast] = useState('')
  const anoAtual = new Date().getFullYear()
  const [periodoInicio, setPeriodoInicio] = useState(`${anoAtual}-01-01`)
  const [periodoFim, setPeriodoFim] = useState(new Date().toISOString().slice(0, 10))
  const [mostrarSeletorData, setMostrarSeletorData] = useState(false)
  const [precosAtuais, setPrecosAtuais] = useState<Record<string, number>>({})

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
  useEffect(() => {
    if (portfolio?.posicoes?.length) carregarGrafico(portfolio.posicoes, periodoInicio, periodoFim, totalAportes)
  }, [periodoInicio, periodoFim])

  // Meses de vencimento futuros B3: F=Jan G=Feb H=Mar J=Apr K=Mai M=Jun N=Jul Q=Ago U=Set V=Out X=Nov Z=Dez
  const MESES_FUTURO: Record<string, number> = { F:0,G:1,H:2,J:3,K:4,M:5,N:6,Q:7,U:8,V:9,X:10,Z:11 }
  const PREFIXO_CONTINUO: Record<string, string> = { WIN:'WIN=F', WDO:'WDO=F', IND:'IND=F', DOL:'DOL=F' }

  function tickerContinuo(ticker: string): string {
    const prefixo = ticker.slice(0, 3).toUpperCase()
    return PREFIXO_CONTINUO[prefixo] || ticker
  }

  function vencimentoFuturo(ticker: string): Date | null {
    const mes = MESES_FUTURO[ticker.slice(-3, -2).toUpperCase()]
    const ano = parseInt('20' + ticker.slice(-2))
    if (isNaN(mes) || isNaN(ano)) return null
    // WIN vence na 3ª quarta-feira do mês de vencimento
    const d = new Date(ano, mes, 1)
    let quartas = 0
    while (quartas < 3) { if (d.getDay() === 3) quartas++; if (quartas < 3) d.setDate(d.getDate() + 1) }
    return d
  }

  async function carregarPrecosAtuais(posicoes: Posicao[]) {
    const precos: Record<string, number> = {}
    await Promise.all(posicoes.map(async p => {
      const isFuturo = p.classeAtivo === 'Futuros'
      if (isFuturo) {
        const venc = vencimentoFuturo(p.ticker)
        const hoje = new Date()
        const vencido = venc && venc < hoje

        if (!vencido) {
          // Contrato ativo → B3 API (cotação em tempo real)
          try {
            const res = await fetch(`http://localhost:5194/api/mercado/futuro?ticker=${p.ticker}`, { headers })
            if (res.ok) {
              const json = await res.json()
              const preco = json?.Trad?.[0]?.scty?.SctyQtn?.curPrc
              if (preco != null) precos[p.ticker] = parseFloat(preco)
            }
          } catch { /* ignora */ }
        } else {
          // Contrato vencido → Yahoo Finance histórico até o vencimento
          const diasPassados = Math.ceil((hoje.getTime() - venc!.getTime()) / 86400000)
          const range = diasPassados <= 30 ? '1mo' : diasPassados <= 90 ? '3mo' : diasPassados <= 180 ? '6mo' : '1y'
          try {
            const res = await fetch(`http://localhost:5194/api/mercado/historico?ticker=${encodeURIComponent(tickerContinuo(p.ticker))}&range=${range}&interval=1d`, { headers })
            if (res.ok) {
              const json = await res.json()
              const timestamps: number[] = json?.chart?.result?.[0]?.timestamp || []
              const fechamentos: (number | null)[] = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
              const tsLimite = venc!.getTime() / 1000
              for (let i = timestamps.length - 1; i >= 0; i--) {
                if (timestamps[i] <= tsLimite && fechamentos[i] != null) { precos[p.ticker] = fechamentos[i]!; break }
              }
            }
          } catch { /* ignora */ }
        }
      } else {
        const tickerYahoo = `${p.ticker}.SA`
        try {
          const res = await fetch(`http://localhost:5194/api/mercado/historico?ticker=${encodeURIComponent(tickerYahoo)}&range=5d&interval=1d`, { headers })
          if (!res.ok) return
          const json = await res.json()
          const fechamentos: (number | null)[] = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
          const ultimo = [...fechamentos].reverse().find(v => v != null)
          if (ultimo != null) precos[p.ticker] = ultimo
        } catch { /* ignora */ }
      }
    }))
    setPrecosAtuais(precos)
  }

  async function carregarPortfolio() {
    try {
      const [resPortfolio, resAportes] = await Promise.all([
        fetch(`http://localhost:5194/api/portfolio/${id}`, { headers }),
        fetch(`http://localhost:5194/api/portfolio/${id}/aportes`, { headers })
      ])
      const data = resPortfolio.ok ? await resPortfolio.json() : null
      const aps = resAportes.ok ? await resAportes.json() : []
      if (data) {
        setPortfolio(data)
        setAportes(aps)
        const totalAps = aps.reduce((a: number, ap: { valor: number }) => a + ap.valor, 0)
        if (data.posicoes?.length > 0) {
          carregarGrafico(data.posicoes, periodoInicio, periodoFim, totalAps)
          carregarPrecosAtuais(data.posicoes)
        }
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

  function periodoParaRange(inicio: string, fim: string): string {
    const dias = Math.ceil((new Date(fim).getTime() - new Date(inicio).getTime()) / 86400000)
    if (dias <= 5) return '5d'
    if (dias <= 30) return '1mo'
    if (dias <= 90) return '3mo'
    if (dias <= 180) return '6mo'
    if (dias <= 365) return '1y'
    if (dias <= 730) return '2y'
    return '5y'
  }

  async function carregarGrafico(posicoes: Posicao[], inicio = periodoInicio, fim = periodoFim, aporteTotal = totalAportes) {
    if (!posicoes || posicoes.length === 0) return
    setCarregandoGrafico(true)
    try {
      const base = 'http://localhost:5194/api/mercado/historico'
      const range = periodoParaRange(inicio, fim)

      // Busca histórico de todas as posições + IBOVESPA em paralelo
      const [respostas, resIbov] = await Promise.all([
        Promise.all(posicoes.map(p => {
          const tickerYahoo = p.classeAtivo === 'Futuros' ? p.ticker : `${p.ticker}.SA`
          return fetch(`${base}?ticker=${tickerYahoo}&range=${range}&interval=1d`, { headers }).then(r => r.json())
        })),
        fetch(`${base}?ticker=%5EBVSP&range=${range}&interval=1d`, { headers }).then(r => r.json())
      ])

      const resultIbov = resIbov?.chart?.result?.[0]
      if (!resultIbov) return

      const tsInicio = new Date(inicio).getTime() / 1000
      const tsFim = new Date(fim).getTime() / 1000 + 86400
      const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

      // Monta lista ordenada de { data, preco } para cada posição
      const historicosPosicoes = posicoes.map((pos, idx) => {
        const result = respostas[idx]?.chart?.result?.[0]
        const ts: number[] = result?.timestamp || []
        const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close || []
        const serie: { data: string; preco: number }[] = []
        ts.forEach((t, i) => {
          if (closes[i] != null) {
            serie.push({ data: new Date(t * 1000).toISOString().slice(0, 10), preco: closes[i]! })
          }
        })
        serie.sort((a, b) => a.data.localeCompare(b.data))

        // Retorna o último preço disponível até uma data alvo
        function precoAte(dataAlvo: string): number {
          let ultimo = pos.precoMedio
          for (const p of serie) {
            if (p.data <= dataAlvo) ultimo = p.preco
            else break
          }
          return ultimo
        }
        return { pos, precoAte }
      })

      // Custo fixo total de todas as posições
      const custoTotal = posicoes.reduce((a, p) => a + p.precoMedio * p.quantidade, 0)
      const aporteBase = aporteTotal > 0 ? aporteTotal : custoTotal

      // Timestamps do IBOV como eixo de referência
      const tsIbov: number[] = resultIbov.timestamp || []
      const closesIbov: (number | null)[] = resultIbov.indicators?.quote?.[0]?.close || []

      const pontosFiltrados = tsIbov
        .map((ts, i) => ({ ts, closeIbov: closesIbov[i] }))
        .filter(p => p.closeIbov != null && p.ts >= tsInicio && p.ts <= tsFim)

      if (pontosFiltrados.length === 0) return

      const baseIbov = pontosFiltrados[0].closeIbov!

      // Agrupa por mês — último ponto de cada mês
      const porMes: Record<string, { portfolio: number; ibovespa: number }> = {}
      for (const { ts, closeIbov } of pontosFiltrados) {
        // Valor de mercado de todas as posições neste dia
        const diaStr = new Date(ts * 1000).toISOString().slice(0, 10)
        let valorMercado = 0
        for (const { pos, precoAte } of historicosPosicoes) {
          valorMercado += precoAte(diaStr) * pos.quantidade
        }
        const lucro = valorMercado - custoTotal
        const pctPortfolio = parseFloat(((lucro / aporteBase) * 100).toFixed(2))
        const pctIbov = parseFloat((((closeIbov! - baseIbov) / baseIbov) * 100).toFixed(2))

        const data = new Date(ts * 1000)
        const chave = `${data.getFullYear()}-${String(data.getMonth()).padStart(2,'0')}`
        porMes[chave] = { portfolio: pctPortfolio, ibovespa: pctIbov }
      }

      const dados = Object.entries(porMes).sort(([a], [b]) => a.localeCompare(b)).map(([chave, vals]) => {
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
    const isRendaFixa = txClasse === 'Renda Fixa'
    const isFuturo = txClasse === 'Futuros'
    if (isRendaFixa) {
      if (!txTicker || !rfValor) return
    } else {
      if (!txTicker || !txQuantidade || !txPreco) return
    }
    setSalvandoTransacao(true)
    try {
      const margemUnit = ftTipoOp === 'Intraday' ? 150 : 5000
      const body = isRendaFixa
        ? {
            ticker: txTicker.toUpperCase(),
            nomeAtivo: txAtivo?.nome || txTicker,
            classeAtivo: 'Renda Fixa',
            quantidade: 1,
            precoMedio: parseFloat(rfValor),
            dataEntrada: txData || null
          }
        : isFuturo
        ? {
            ticker: txTicker.toUpperCase(),
            nomeAtivo: `${txTicker.toUpperCase()} (${ftTipoOp}|margem:${margemUnit})`,
            classeAtivo: 'Futuros',
            quantidade: parseFloat(txQuantidade),
            precoMedio: parseFloat(txPreco), // preço de entrada do contrato (pontos)
            dataEntrada: txData || null
          }
        : {
            ticker: txTicker.toUpperCase(),
            nomeAtivo: txAtivo?.nome || txTicker,
            classeAtivo: txAtivo?.classe || txClasse,
            quantidade: parseFloat(txQuantidade),
            precoMedio: parseFloat(txPreco),
            dataEntrada: txData || null
          }
      const res = await fetch(`http://localhost:5194/api/portfolio/${id}/posicoes`, {
        method: 'POST', headers,
        body: JSON.stringify(body)
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
    async function removerPosicao(posicaoId: number) {
    await fetch(`http://localhost:5194/api/portfolio/${id}/posicoes/${posicaoId}`, { method: 'DELETE', headers })
    carregarPortfolio()
  }

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const totalAportes = aportes.reduce((a, ap) => a + ap.valor, 0)

  const custoTotalPosicoes = (portfolio?.posicoes ?? []).reduce((a, p) => a + p.precoMedio * p.quantidade, 0)
  const valorMercadoPosicoes = (portfolio?.posicoes ?? []).reduce((a, p) => {
    const precoAtual = precosAtuais[p.ticker] ?? p.precoMedio
    return a + precoAtual * p.quantidade
  }, 0)
  const caixaNaoInvestido = Math.max(0, totalAportes - custoTotalPosicoes)
  const patrimonio = valorMercadoPosicoes + caixaNaoInvestido

  const posicoesFiltradas = (portfolio?.posicoes ?? []).filter(p => {
    const d = p.dataEntrada.slice(0, 10)
    return d >= periodoInicio && d <= periodoFim
  })

  const { resultado, pctResultado } = (() => {
    let custoTotal = 0, valorAtualTotal = 0
    for (const p of posicoesFiltradas) {
      const precoAtual = precosAtuais[p.ticker] ?? p.precoMedio
      custoTotal += p.precoMedio * p.quantidade
      valorAtualTotal += precoAtual * p.quantidade
    }
    const resultado = valorAtualTotal - custoTotal
    const pct = totalAportes > 0 ? (resultado / totalAportes) * 100 : 0
    return { resultado, pctResultado: pct }
  })()

  const alocacaoPorClasse = portfolio?.posicoes?.reduce((acc, p) => {
    acc[p.classeAtivo] = (acc[p.classeAtivo] || 0) + p.valorTotal
    return acc
  }, {} as Record<string, number>) ?? {}
  if (caixaNaoInvestido > 0) alocacaoPorClasse['Caixa Livre'] = caixaNaoInvestido
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
          {/* Linha superior: nome + seletor de data */}
          <div className="pd-header-top">
            <div className="pd-header-cliente">
              <h2 className="pd-nome-cliente">{portfolio.nomeCliente}</h2>
              <span className="pd-data-inicio">📅 Início do portfólio: {
                aportes.length > 0
                  ? new Date(aportes.reduce((min, a) => a.dataAporte < min ? a.dataAporte : min, aportes[0].dataAporte)).toLocaleDateString('pt-BR')
                  : new Date(portfolio.dataInicio).toLocaleDateString('pt-BR')
              }</span>
            </div>
            <div style={{ position: 'relative' }}>
              <button className="pd-periodo-btn" onClick={() => setMostrarSeletorData(v => !v)}>
                📅 Ano atual | {periodoInicio.split('-').reverse().join('/')} – {periodoFim.split('-').reverse().join('/')} ▾
              </button>
              {mostrarSeletorData && (
                <div className="pd-seletor-data">
                  <label>De<input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} /></label>
                  <label>Até<input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} /></label>
                  <button onClick={() => setMostrarSeletorData(false)} className="pd-seletor-ok">OK</button>
                </div>
              )}
            </div>
          </div>
          {/* Linha inferior: stats */}
          <div className="pd-header-stats">
            <div className="pd-stat">
              <span className="pd-stat-label">Patrimônio em {new Date().toLocaleDateString('pt-BR')}</span>
              <span className="pd-stat-val">{formatBRL(patrimonio)}</span>
            </div>
            <div className="pd-stat">
              <span className="pd-stat-label">Resultado (Ano atual)</span>
              {posicoesFiltradas.length > 0
                ? <span className="pd-stat-resultado">
                    {formatBRL(resultado)}{' '}
                    <span className={resultado >= 0 ? 'pd-badge-positivo' : 'pd-badge-negativo'}>
                      {resultado >= 0 ? '+' : ''}{pctResultado.toFixed(2)}% {resultado >= 0 ? '↑' : '↓'}
                    </span>
                  </span>
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
                  <div className="pd-resumo-stat" style={{ borderTop: '1px solid #30363d', paddingTop: 10, marginTop: 4 }}>
                    <span className="pd-resumo-label">💰 Caixa Livre</span>
                    <span className="pd-resumo-valor" style={{ color: caixaNaoInvestido > 0 ? '#22c55e' : '#8b949e' }}>
                      {formatBRL(caixaNaoInvestido)}
                    </span>
                    {totalAportes > 0 && (
                      <span style={{ fontSize: '0.72rem', color: '#8b949e' }}>
                        {((caixaNaoInvestido / totalAportes) * 100).toFixed(1)}% do capital total
                      </span>
                    )}
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
              ) : (() => {
                const totalPort = portfolio.posicoes!.reduce((a, p) => {
                  const pa = precosAtuais[p.ticker] ?? p.precoMedio
                  return a + pa * p.quantidade
                }, 0)
                const grupos = portfolio.posicoes!.reduce((acc, p) => {
                  const cl = p.classeAtivo || 'Outros'
                  if (!acc[cl]) acc[cl] = []
                  acc[cl].push(p)
                  return acc
                }, {} as Record<string, Posicao[]>)

                return (
                  <table className="pd-table pd-table-posicoes">
                    <thead>
                      <tr>
                        <th>Classe / Ativo</th>
                        <th style={{textAlign:'right'}}>Valor atualizado</th>
                        <th style={{textAlign:'right'}}>Valor investido</th>
                        <th style={{textAlign:'right'}}>P&L</th>
                        <th style={{textAlign:'right'}}>Rent. TWR</th>
                        <th style={{textAlign:'right'}}>Quantidade</th>
                        <th style={{textAlign:'right'}}>% portfólio</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(grupos).map(([classe, posicoes]) => {
                        const cor = CORES_CLASSE[classe] || '#6b7280'
                        const totalInvCl = posicoes.reduce((a, p) => {
                          const m = p.nomeAtivo.match(/margem:(\d+)/)
                          return a + (p.classeAtivo === 'Futuros' && m ? parseInt(m[1]) * p.quantidade : p.precoMedio * p.quantidade)
                        }, 0)
                        const totalAtCl = posicoes.reduce((a, p) => {
                          const pa = precosAtuais[p.ticker] ?? p.precoMedio
                          const m = p.nomeAtivo.match(/margem:(\d+)/)
                          const isFut = p.classeAtivo === 'Futuros' && m
                          const inv = isFut ? parseInt(m![1]) * p.quantidade : p.precoMedio * p.quantidade
                          const pl = isFut ? (pa - p.precoMedio) * p.quantidade * 0.20 : pa * p.quantidade - inv
                          return a + (isFut ? inv + pl : pa * p.quantidade)
                        }, 0)
                        const plCl = totalAtCl - totalInvCl
                        const pctCl = totalInvCl > 0 ? (plCl / totalInvCl) * 100 : 0
                        const pctPortCl = totalPort > 0 ? (totalAtCl / totalPort) * 100 : 0
                        return [
                          // Linha de classe
                          <tr key={`cl-${classe}`} className="pd-row-classe">
                            <td>
                              <span style={{ display:'inline-block', width:10, height:10, borderRadius:2, background:cor, marginRight:8 }}/>
                              <strong>{classe}</strong>
                            </td>
                            <td style={{textAlign:'right'}}><strong>{formatBRL(totalAtCl)}</strong></td>
                            <td style={{textAlign:'right'}}><strong>{formatBRL(totalInvCl)}</strong></td>
                            <td style={{textAlign:'right'}}>
                              <strong style={{color: plCl >= 0 ? '#22c55e' : '#ef4444'}}>
                                {plCl >= 0 ? '+' : ''}{formatBRL(plCl)}
                              </strong>
                            </td>
                            <td style={{textAlign:'right'}}>
                              <span style={{color: pctCl >= 0 ? '#22c55e' : '#ef4444', fontWeight:600}}>
                                {pctCl >= 0 ? '+' : ''}{pctCl.toFixed(2)}% {pctCl >= 0 ? '↑' : '↓'}
                              </span>
                            </td>
                            <td style={{textAlign:'right'}}>—</td>
                            <td style={{textAlign:'right'}}><strong>{pctPortCl.toFixed(2)}%</strong></td>
                            <td/>
                          </tr>,
                          // Linhas de ativos
                          ...posicoes.map(p => {
                            const margemMatch = p.nomeAtivo.match(/margem:(\d+)/)
                            const isFut = p.classeAtivo === 'Futuros' && margemMatch
                            const venc = isFut ? vencimentoFuturo(p.ticker) : null
                            const vencido = venc ? venc < new Date() : false
                            const pa = precosAtuais[p.ticker] ?? (vencido ? p.precoMedio : p.precoMedio)
                            const inv = isFut
                              ? parseInt(margemMatch![1]) * p.quantidade
                              : p.precoMedio * p.quantidade
                            const pl = isFut
                              ? (pa - p.precoMedio) * p.quantidade * 0.20
                              : pa * p.quantidade - inv
                            const atual = isFut ? inv + pl : pa * p.quantidade
                            const twr = inv > 0 ? (pl / inv) * 100 : 0
                            const pctPort = totalPort > 0 ? (atual / totalPort) * 100 : 0
                            return (
                              <tr key={p.id} className="pd-row-ativo">
                                <td style={{paddingLeft:28}}>
                                  <span className="pd-ticker">{p.ticker}</span>
                                  <span className="pd-ativo-nome">{p.nomeAtivo}</span>
                                </td>
                                <td style={{textAlign:'right'}}>{formatBRL(atual)}</td>
                                <td style={{textAlign:'right'}}>{formatBRL(inv)}</td>
                                <td style={{textAlign:'right', color: pl >= 0 ? '#22c55e' : '#ef4444'}}>
                                  {pl >= 0 ? '+' : ''}{formatBRL(pl)}
                                  {vencido && <span style={{display:'block', fontSize:'0.7rem', color:'#8b949e'}}>Fechado</span>}
                                </td>
                                <td style={{textAlign:'right', color: twr >= 0 ? '#22c55e' : '#ef4444'}}>
                                  {twr >= 0 ? '+' : ''}{twr.toFixed(2)}% {twr >= 0 ? '↑' : '↓'}
                                </td>
                                <td style={{textAlign:'right'}}>{p.quantidade}</td>
                                <td style={{textAlign:'right'}}>{pctPort.toFixed(2)}%</td>
                                <td>
                                  <div style={{position:'relative'}}>
                                    <button className="pd-btn-3pontos" onClick={() => setMenuAberto(menuAberto === p.id ? null : p.id)}>⋮</button>
                                    {menuAberto === p.id && (
                                      <div className="pd-dropdown-menu">
                                        <button className="pd-dropdown-item" onClick={() => { setModalPrecoManual({ posicaoId: p.id, ticker: p.ticker }); setPrecoManualInput(''); setMenuAberto(null) }}>✏️ Atualizar preço</button>
                                        <button className="pd-dropdown-excluir" onClick={() => { removerPosicao(p.id); setMenuAberto(null) }}>Excluir</button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })
                        ]
                      })}
                    </tbody>
                  </table>
                )
              })()}
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

      {/* Modal preço manual */}
      {modalPrecoManual && (
        <div className="pd-modal-overlay" onClick={() => setModalPrecoManual(null)}>
          <div className="pd-modal" onClick={e => e.stopPropagation()} style={{maxWidth: 360}}>
            <div className="pd-modal-header">
              <h3>Atualizar preço — {modalPrecoManual.ticker}</h3>
              <button className="pd-modal-tx-fechar" onClick={() => setModalPrecoManual(null)}>✕</button>
            </div>
            <div style={{padding: '20px 24px', display:'flex', flexDirection:'column', gap:16}}>
              <div className="pd-form-group">
                <label>Preço atual (pontos/R$)</label>
                <input type="number" placeholder="Ex.: 135250" value={precoManualInput}
                  onChange={e => setPrecoManualInput(e.target.value)}
                  autoFocus />
              </div>
              <div className="pd-modal-acoes">
                <button className="pd-btn-primary" onClick={() => {
                  const v = parseFloat(precoManualInput)
                  if (!isNaN(v) && modalPrecoManual) {
                    setPrecosAtuais(prev => ({ ...prev, [modalPrecoManual.ticker]: v }))
                    setModalPrecoManual(null)
                    mostrarToast('✅ Preço atualizado!')
                  }
                }}>Confirmar</button>
                <button className="pd-btn-cancelar" onClick={() => setModalPrecoManual(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                      <option>Commodities</option>
                      <option>Futuros</option>
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

                {/* Painel direito */}
                <div className="pd-tx-detalhes">
                  {txClasse === 'Futuros' ? (() => {
                    const margemUnit = ftTipoOp === 'Intraday' ? 150 : 5000
                    const qtd = parseFloat(txQuantidade) || 0
                    const precoNocional = parseFloat(txPreco) || 0
                    const margemTotal = qtd * margemUnit
                    const exposicao = qtd * precoNocional
                    return (
                      <>
                        <div className="pd-form-group">
                          <label>Tipo de operação</label>
                          <div style={{ display: 'flex', gap: 16 }}>
                            {(['Intraday', 'Swing'] as const).map(t => (
                              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.88rem' }}>
                                <input type="radio" name="ftTipo" checked={ftTipoOp === t} onChange={() => setFtTipoOp(t)} />
                                {t} {t === 'Intraday' ? '(R$ 150/contrato)' : '(R$ 5.000/contrato)'}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div className="pd-form-group">
                            <label>Quantidade (contratos)</label>
                            <input type="number" placeholder="Ex.: 5" value={txQuantidade} onChange={e => setTxQuantidade(e.target.value)} />
                          </div>
                          <div className="pd-form-group">
                            <label>Preço do contrato (pts)</label>
                            <input type="number" placeholder="Ex.: 172025" value={txPreco} onChange={e => setTxPreco(e.target.value)} />
                          </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#8b949e' }}>
                            <span>Margem por contrato</span>
                            <span>{formatBRL(margemUnit)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#8b949e' }}>
                            <span>Exposição total (nocional)</span>
                            <span>{exposicao > 0 ? formatBRL(exposicao) : '—'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #30363d', paddingTop: 8 }}>
                            <span>Capital alocado (margem)</span>
                            <span style={{ color: '#00B4D8' }}>{margemTotal > 0 ? formatBRL(margemTotal) : 'R$ 0,00'}</span>
                          </div>
                        </div>
                      </>
                    )
                  })() : txClasse === 'Renda Fixa' ? (
                    <>
                      {/* Modalidade */}
                      <div className="pd-form-group">
                        <label>Modalidade</label>
                        <div style={{ display: 'flex', gap: 16 }}>
                          {(['Pós-fixado', 'Prefixado'] as const).map(m => (
                            <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.88rem' }}>
                              <input type="radio" name="rfModalidade" checked={rfModalidade === m} onChange={() => setRfModalidade(m)} />
                              {m}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Indexador + Taxa */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="pd-form-group">
                          <label>Indexador</label>
                          <select value={rfIndexador} onChange={e => setRfIndexador(e.target.value)}>
                            <option>% do CDI</option>
                            <option>CDI +</option>
                            <option>IPCA +</option>
                            <option>SELIC</option>
                            <option>Prefixado</option>
                          </select>
                        </div>
                        <div className="pd-form-group">
                          <label>{rfIndexador === 'Prefixado' ? 'Taxa a.a.' : rfIndexador}</label>
                          <input type="text" value={rfTaxa} onChange={e => setRfTaxa(e.target.value)} placeholder="100,00%" />
                        </div>
                      </div>

                      {/* Valor + Vencimento */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="pd-form-group">
                          <label>Valor investido (R$)</label>
                          <input type="number" placeholder="Ex.: 1000,00" value={rfValor} onChange={e => setRfValor(e.target.value)} />
                        </div>
                        <div className="pd-form-group">
                          <label>Data de vencimento</label>
                          <input type="date" value={rfVencimento} onChange={e => setRfVencimento(e.target.value)} />
                        </div>
                      </div>

                      {/* Banco + Periodicidade */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="pd-form-group">
                          <label>Banco emissor</label>
                          <input type="text" placeholder="Ex.: Banco Inter" value={rfBanco} onChange={e => setRfBanco(e.target.value)} />
                        </div>
                        <div className="pd-form-group">
                          <label>Periodicidade de pagamento</label>
                          <select value={rfPeriodicidade} onChange={e => setRfPeriodicidade(e.target.value)}>
                            <option>No vencimento</option>
                            <option>Mensal</option>
                            <option>Semestral</option>
                            <option>Anual</option>
                          </select>
                        </div>
                      </div>

                      <div className="pd-tx-total">
                        <span>Total</span>
                        <strong>{rfValor ? formatBRL(parseFloat(rfValor)) : 'R$ 0,00'}</strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="pd-form-group">
                        <label>Quantidade</label>
                        <input type="number" placeholder="Ex.: 100" value={txQuantidade}
                          onChange={e => setTxQuantidade(e.target.value)} />
                      </div>
                      <div className="pd-form-group">
                        <label>Preço</label>
                        <input type="number" value={txPreco} onChange={e => setTxPreco(e.target.value)} />
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
                    </>
                  )}

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
