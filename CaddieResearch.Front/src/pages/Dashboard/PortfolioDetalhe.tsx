import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './PortfolioDetalhe.css'

interface Posicao {
  id: number
  ticker: string
  nomeAtivo: string
  classeAtivo: string
  quantidade: number
  precoMedio: number
  dataEntrada: string
  valorTotal: number
  precoAtual?: number
  rentabilidade?: number
}

interface PortfolioDetalheData {
  id: number
  nome: string
  dataInicio: string
  nomeCliente: string
  posicoes: Posicao[]
}

const CORES_CLASSE: Record<string, string> = {
  'Renda Variável': '#00B4D8',
  'Renda Fixa': '#7B61FF',
  'Internacional': '#F59E0B',
  'Outros': '#6b7280',
}

export default function PortfolioDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [portfolio, setPortfolio] = useState<PortfolioDetalheData | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    carregarPortfolio()
  }, [id])

  async function carregarPortfolio() {
    try {
      const token = localStorage.getItem('caddie_token')
      const res = await fetch(`http://localhost:5194/api/portfolio/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPortfolio(data)
      }
    } catch (e) {
      console.error('Erro ao carregar portfólio', e)
    } finally {
      setCarregando(false)
    }
  }

  if (carregando) return <div className="pd-loading">Carregando portfólio...</div>
  if (!portfolio) return <div className="pd-loading">Portfólio não encontrado.</div>

  const patrimonio = portfolio.posicoes?.reduce((a, p) => a + p.valorTotal, 0) ?? 0

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  // Alocação por classe
  const alocacaoPorClasse = portfolio.posicoes?.reduce((acc, p) => {
    acc[p.classeAtivo] = (acc[p.classeAtivo] || 0) + p.valorTotal
    return acc
  }, {} as Record<string, number>) ?? {}

  const totalAlocacao = Object.values(alocacaoPorClasse).reduce((a, b) => a + b, 0)

  // Donut SVG simples
  const donutSegments = () => {
    const classes = Object.entries(alocacaoPorClasse)
    const radius = 70
    const cx = 90
    const cy = 90
    const circunferencia = 2 * Math.PI * radius
    let offset = 0

    return classes.map(([classe, valor]) => {
      const pct = totalAlocacao > 0 ? valor / totalAlocacao : 0
      const dash = pct * circunferencia
      const gap = circunferencia - dash
      const seg = (
        <circle
          key={classe}
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={CORES_CLASSE[classe] || CORES_CLASSE['Outros']}
          strokeWidth="30"
          strokeDasharray={`${dash} ${gap}`}
          strokeDashoffset={-offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
        />
      )
      offset += dash
      return seg
    })
  }

  return (
    <div className="pd-page">
      {/* Header */}
      <div className="pd-header">
        <button className="pd-voltar" onClick={() => navigate('/portfolio')}>← Portfólios</button>
        <div className="pd-header-info">
          <div>
            <h2 className="pd-nome-cliente">{portfolio.nomeCliente}</h2>
            <span className="pd-data-inicio">📅 Início: {new Date(portfolio.dataInicio).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="pd-header-stats">
            <div className="pd-stat">
              <span className="pd-stat-label">Patrimônio atual</span>
              <span className="pd-stat-val">{formatBRL(patrimonio)}</span>
            </div>
            <div className="pd-stat">
              <span className="pd-stat-label">Portfólio</span>
              <span className="pd-stat-nome">{portfolio.nome}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Corpo */}
      <div className="pd-body">
        {/* Posições */}
        <div className="pd-posicoes-card">
          <h3>Posições</h3>
          {!portfolio.posicoes || portfolio.posicoes.length === 0 ? (
            <div className="pd-vazio">
              <span>📊</span>
              <p>Nenhuma posição registrada ainda.</p>
              <span className="pd-vazio-sub">As posições serão adicionadas após o alinhamento com o gestor.</span>
            </div>
          ) : (
            <table className="pd-table">
              <thead>
                <tr>
                  <th>Ativo</th>
                  <th>Classe</th>
                  <th>Qtd</th>
                  <th>Preço Médio</th>
                  <th>Valor Total</th>
                  <th>Entrada</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.posicoes.map(p => (
                  <tr key={p.id}>
                    <td>
                      <span className="pd-ticker">{p.ticker}</span>
                      <span className="pd-ativo-nome">{p.nomeAtivo}</span>
                    </td>
                    <td>
                      <span className="pd-classe-tag" style={{ borderColor: CORES_CLASSE[p.classeAtivo] || '#6b7280', color: CORES_CLASSE[p.classeAtivo] || '#6b7280' }}>
                        {p.classeAtivo}
                      </span>
                    </td>
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

        {/* Alocação */}
        <div className="pd-alocacao-card">
          <h3>Alocação Patrimonial</h3>
          {totalAlocacao === 0 ? (
            <div className="pd-vazio">
              <span>🥧</span>
              <p>Sem dados de alocação.</p>
            </div>
          ) : (
            <>
              <svg viewBox="0 0 180 180" className="pd-donut">
                {donutSegments()}
                <circle cx="90" cy="90" r="55" fill="#0d1117" />
                <text x="90" y="86" textAnchor="middle" fill="#e6edf3" fontSize="11" fontWeight="700">Patrimônio</text>
                <text x="90" y="102" textAnchor="middle" fill="#8b949e" fontSize="9">{formatBRL(totalAlocacao)}</text>
              </svg>
              <div className="pd-legenda">
                {Object.entries(alocacaoPorClasse).map(([classe, valor]) => (
                  <div key={classe} className="pd-legenda-item">
                    <span className="pd-legenda-cor" style={{ background: CORES_CLASSE[classe] || '#6b7280' }} />
                    <span className="pd-legenda-label">{classe}</span>
                    <span className="pd-legenda-pct">
                      {totalAlocacao > 0 ? ((valor / totalAlocacao) * 100).toFixed(1) : 0}%
                    </span>
                    <span className="pd-legenda-val">{formatBRL(valor)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
