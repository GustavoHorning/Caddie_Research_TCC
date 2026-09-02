import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Portfolio.css'

interface PortfolioItem {
  id: number
  nome: string
  dataInicio: string
  patrimonio: number
  totalPosicoes: number
  temContaCorrente: boolean
  totalAportes: number
}

export default function Portfolio() {
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalNovo, setModalNovo] = useState(false)
  const [passoModal, setPassoModal] = useState<1 | 2>(1)
  const [nomeNovo, setNomeNovo] = useState('')
  const [aporteInicial, setAporteInicial] = useState('')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 10))
  const [criando, setCriando] = useState(false)
  const navigate = useNavigate()
  const token = localStorage.getItem('caddie_token')
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

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

  function abrirModal() {
    setNomeNovo('')
    setAporteInicial('')
    setDataInicio(new Date().toISOString().slice(0, 10))
    setPassoModal(1)
    setModalNovo(true)
  }

  async function criarPortfolio() {
    if (!nomeNovo.trim()) return
    setCriando(true)
    try {
      const res = await fetch('http://localhost:5194/api/portfolio', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nome: nomeNovo.trim(),
          dataInicio: dataInicio ? new Date(dataInicio).toISOString() : new Date().toISOString(),
          aporteInicial: aporteInicial ? parseFloat(aporteInicial.replace(',', '.')) : null
        })
      })
      if (res.ok) {
        setModalNovo(false)
        carregarPortfolios()
      }
    } catch (e) { console.error(e) }
    finally { setCriando(false) }
  }

  const totalPatrimonio = portfolios.reduce((acc, p) => acc + p.patrimonio, 0)

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="pf-page">
      <div className="pf-main">
        <div className="pf-abas">
          <button className="pf-aba ativa">Portfólios</button>
          <button className="pf-btn-novo" onClick={abrirModal}>+ Novo Portfólio</button>
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
                    <td className="pf-valor">
                      {formatBRL(p.patrimonio)}
                      {p.temContaCorrente && (
                        <span style={{ marginLeft: 8, fontSize: '0.72rem', color: '#8b949e', fontWeight: 400 }}>
                          (Conta Corrente)
                        </span>
                      )}
                    </td>
                    <td>
                      {p.totalPosicoes === 0
                        ? <span style={{ color: '#8b949e', fontSize: '0.82rem' }}>— aguardando posições</span>
                        : `${p.totalPosicoes} ativo${p.totalPosicoes !== 1 ? 's' : ''}`
                      }
                    </td>
                    <td>{new Date(p.dataInicio).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalNovo && (
        <div className="pf-modal-overlay" onClick={() => setModalNovo(false)}>
          <div className="pf-modal" onClick={e => e.stopPropagation()}>
            <div className="pf-modal-passos">
              <span className={passoModal === 1 ? 'ativo' : ''}>1</span>
              <div className="pf-modal-linha" />
              <span className={passoModal === 2 ? 'ativo' : ''}>2</span>
            </div>

            {passoModal === 1 ? (
              <>
                <h3>Novo Portfólio</h3>
                <label className="pf-modal-label">Nome do portfólio</label>
                <input
                  className="pf-modal-input"
                  placeholder="Ex: Carteira Principal"
                  value={nomeNovo}
                  onChange={e => setNomeNovo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && nomeNovo.trim() && setPassoModal(2)}
                  autoFocus
                />
                <div className="pf-modal-actions">
                  <button className="pf-modal-cancel" onClick={() => setModalNovo(false)}>Cancelar</button>
                  <button className="pf-modal-confirm" onClick={() => setPassoModal(2)} disabled={!nomeNovo.trim()}>
                    Próximo →
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Montante inicial</h3>
                <label className="pf-modal-label">Data de início</label>
                <input
                  className="pf-modal-input"
                  type="date"
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                />
                <label className="pf-modal-label">Valor do aporte inicial (R$)</label>
                <input
                  className="pf-modal-input"
                  placeholder="Ex: 10000,00"
                  value={aporteInicial}
                  onChange={e => setAporteInicial(e.target.value)}
                  autoFocus
                />
                <div className="pf-modal-actions">
                  <button className="pf-modal-cancel" onClick={() => setPassoModal(1)}>← Voltar</button>
                  <button className="pf-modal-confirm" onClick={criarPortfolio} disabled={criando}>
                    {criando ? 'Criando...' : 'Criar Portfólio'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
