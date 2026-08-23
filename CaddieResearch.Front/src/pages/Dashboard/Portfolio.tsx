import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Portfolio.css'

interface PortfolioItem {
  id: number
  nome: string
  dataInicio: string
  patrimonio: number
  totalPosicoes: number
}

export default function Portfolio() {
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    carregarPortfolios()
  }, [])

  async function carregarPortfolios() {
    try {
      const token = localStorage.getItem('caddie_token')
      const res = await fetch('http://localhost:5194/api/portfolio', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setPortfolios(await res.json())
    } catch (e) {
      console.error('Erro ao carregar portfólios', e)
    } finally {
      setCarregando(false)
    }
  }

  const totalPatrimonio = portfolios.reduce((acc, p) => acc + p.patrimonio, 0)

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="pf-page">
      <div className="pf-main">
        <div className="pf-abas">
          <button className="pf-aba ativa">Portfólios</button>
        </div>

        <div className="pf-table-wrap">
          <table className="pf-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Patrimônio</th>
                <th>Posições</th>
                <th>Início</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr><td colSpan={4} className="pf-loading">Carregando...</td></tr>
              ) : portfolios.length === 0 ? (
                <tr><td colSpan={4} className="pf-loading">Nenhum portfólio encontrado.</td></tr>
              ) : (
                portfolios.map(p => (
                  <tr key={p.id} className="pf-row" onClick={() => navigate(`/portfolio/${p.id}`)}>
                    <td className="pf-nome">{p.nome}</td>
                    <td className="pf-valor">{formatBRL(p.patrimonio)}</td>
                    <td>{p.totalPosicoes} ativo{p.totalPosicoes !== 1 ? 's' : ''}</td>
                    <td>{new Date(p.dataInicio).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pf-sidebar">
        <div className="pf-resumo-card">
          <h3>Resumo</h3>
          <div className="pf-resumo-grid">
            <div>
              <span className="pf-resumo-label">Portfólios</span>
              <span className="pf-resumo-val">{portfolios.length}</span>
            </div>
            <div>
              <span className="pf-resumo-label">Posições</span>
              <span className="pf-resumo-val">{portfolios.reduce((a, p) => a + p.totalPosicoes, 0)}</span>
            </div>
          </div>
        </div>

        <div className="pf-patrimonio-card">
          <h3>Patrimônio total</h3>
          <span className="pf-patrimonio-val">{formatBRL(totalPatrimonio)}</span>
        </div>
      </div>
    </div>
  )
}
