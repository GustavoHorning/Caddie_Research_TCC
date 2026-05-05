import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../services/api'
import './CarteiraInternacional.css'
import Sidebar from '../../../components/Sidebar'
import TopBar from '../../../components/TopBar'

const subcarteiras = [
  { nome: 'Dollar Income', ativos: 5 },
  { nome: 'Hidden Value', ativos: 8 },
  { nome: 'Great Companies', ativos: 8 },
  { nome: 'ETF Renda Variavel', ativos: 9 },
  { nome: 'ETF Renda Fixa', ativos: 5 },
]

const atualizacoes = [
  { icone: 'rank', texto: 'BTC agora esta na posicao 1 do ranking', tempo: 'ha 2 meses' },
  { icone: 'novo', texto: 'Novo ativo adicionado a Carteira: SOL', tempo: 'ha 7 meses' },
]

const ativos = [
  { rank: 1, variacao: 0, ticker: 'BTC', nome: 'Bitcoin', dyEsperado: '0,0%', entrada: '28.450,00', dataEntrada: '15.03.2023', precoAtual: '67.890,00', varPreco: '2,35%', precoTeto: '95.000,00', rentabilidade: '138,56%', rentPositiva: true, vies: 'Comprar' },
  { rank: 2, variacao: 3, ticker: 'ETH', nome: 'Ethereum', dyEsperado: '0,0%', entrada: '1.820,00', dataEntrada: '01.09.2022', precoAtual: '3.450,00', varPreco: '1,87%', precoTeto: '5.200,00', rentabilidade: '89,56%', rentPositiva: true, vies: 'Comprar' },
  { rank: 3, variacao: 1, ticker: 'SOL', nome: 'Solana', dyEsperado: '0,0%', entrada: '22,50', dataEntrada: '28.06.2023', precoAtual: '145,30', varPreco: '3,12%', precoTeto: '200,00', rentabilidade: '545,78%', rentPositiva: true, vies: 'Comprar' },
  { rank: 4, variacao: 1, ticker: 'ADA', nome: 'Cardano', dyEsperado: '0,0%', entrada: '0,35', dataEntrada: '01.03.2023', precoAtual: '0,62', varPreco: '1,45%', precoTeto: '0,90', rentabilidade: '77,14%', rentPositiva: true, vies: 'Comprar' },
  { rank: 5, variacao: 1, ticker: 'DOT', nome: 'Polkadot', dyEsperado: '0,0%', entrada: '5,80', dataEntrada: '10.07.2019', precoAtual: '7,25', varPreco: '0,89%', precoTeto: '12,00', rentabilidade: '25,00%', rentPositiva: true, vies: 'Aguardar' },
]

const benchmarks = [
  { nome: 'Carteira Internacional', valor: '334,89%', cor: '#4caf50', largura: '90%' },
  { nome: 'Ibovespa', valor: '145,85%', cor: '#666', largura: '55%' },
  { nome: 'S&P 500', valor: '194,09%', cor: '#4caf50', largura: '65%' },
]

export default function CarteiraInternacional() {
  const [abaAtiva, setAbaAtiva] = useState(0)
  const [somenteDestaque, setSomenteDestaque] = useState(false)
  const [menuMobileAberto, setMenuMobileAberto] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const verificarAcesso = async () => {
      try {
        const token = localStorage.getItem('caddie_token');
        const res = await api.get('/usuario/meu-perfil', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.tipoPerfil !== 'Gestor' && res.data.plano !== 'Black') {
          navigate('/gerenciar-plano');
        }
      } catch (err) {
        navigate('/login');
      }
    };
    verificarAcesso();
  }, [navigate]);

  return (
    <div className="dashboard-layout">
      <Sidebar
        activePath="/carteiras"
        isOpen={menuMobileAberto}
        onClose={() => setMenuMobileAberto(false)}
      />
      
      {menuMobileAberto && (
        <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>
      )}

      <TopBar
        userName="Usuario"
        onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)}
      />

      <main className="dashboard-main">
        <div className="detalhe-content">
          <div className="detalhe-topo-row">
            <div className="detalhe-card detalhe-card-rent">
              <h3 className="detalhe-card-titulo">Rentabilidade</h3>
              <div className="detalhe-rent-valor">
                <span className="detalhe-seta-verde">&#9650;</span>334,89%
              </div>
              <div className="detalhe-rent-grafico">
                <svg viewBox="0 0 300 60" className="detalhe-mini-chart">
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4caf50" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#4caf50" stopOpacity="0" />
                  </linearGradient>
                  <polygon fill="url(#chartGrad)" points="0,55 30,50 60,45 90,40 120,38 150,30 180,25 210,20 240,12 270,8 300,5 300,60 0,60" />
                  <polyline fill="none" stroke="#4caf50" strokeWidth="2" points="0,55 30,50 60,45 90,40 120,38 150,30 180,25 210,20 240,12 270,8 300,5" />
                </svg>
              </div>
              <span className="detalhe-rent-periodo">Set 2018 - Mar 2026</span>
              <div className="detalhe-benchmarks">
                <span className="detalhe-bench-label">BENCHMARKS</span>
                {benchmarks.map((b, i) => (
                  <div key={i} className="detalhe-bench-item">
                    <span className="detalhe-bench-nome">{b.nome}</span>
                    <span className="detalhe-bench-valor" style={{ color: b.cor }}>
                      <span className="detalhe-seta-verde" style={{color: b.cor}}>&#9650;</span> {b.valor}
                    </span>
                    <div className="detalhe-bench-barra">
                      <div className="detalhe-bench-fill" style={{ width: b.largura, background: b.cor }} />
                    </div>
                  </div>
                ))}
              </div>
              <span className="detalhe-bench-nota">Rentabilidade referente ao mesmo periodo da Carteira.</span>
            </div>

            <div className="detalhe-card detalhe-card-atualiz">
              <div className="detalhe-card-header-row">
                <h3 className="detalhe-card-titulo">Atualizacoes</h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <ul className="detalhe-atualiz-lista">
                {atualizacoes.map((item, i) => (
                  <li key={i} className="detalhe-atualiz-item">
                    <div className="detalhe-atualiz-icon">
                      {item.icone === 'rank' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <line x1="12" y1="19" x2="12" y2="5" />
                          <polyline points="5 12 12 5 19 12" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      )}
                    </div>
                    <div className="detalhe-atualiz-info">
                      <strong>{item.texto}</strong>
                      <span>{item.tempo}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="detalhe-card detalhe-card-video">
              <div className="detalhe-video-bg">
                <div className="detalhe-video-overlay">
                  <span className="detalhe-video-badge">CADDIE</span>
                  <h2 className="detalhe-video-titulo">INTER NACIONAL</h2>
                  <div className="detalhe-video-bottom">
                    <div className="detalhe-video-play">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    </div>
                    <div className="detalhe-video-info">
                      <strong>Plantao de Duvidas Internacional - 31/03</strong>
                      <span>ha 5 dias</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="detalhe-abas">
            {subcarteiras.map((sub, i) => (
              <button
                key={i}
                className={'detalhe-aba' + (abaAtiva === i ? ' aba-ativa' : '')}
                onClick={() => setAbaAtiva(i)}
              >
                <strong>{sub.nome}</strong>
                <span>{sub.ativos} ativos</span>
              </button>
            ))}
          </div>

          <div className="detalhe-toggle-row">
            <div
              className={'detalhe-toggle' + (somenteDestaque ? ' toggle-on' : '')}
              onClick={() => setSomenteDestaque(!somenteDestaque)}
            >
              <div className="detalhe-toggle-circle" />
            </div>
            <span className="detalhe-toggle-label">Exibir somente BDRs</span>
          </div>

          <div className="detalhe-tabela-wrapper">
            <table className="detalhe-tabela">
              <thead>
                <tr>
                  <th>rank</th>
                  <th>ativo</th>
                  <th>ticker / empresa</th>
                  <th>DY esperado</th>
                  <th>entrada (U$)</th>
                  <th>preco atual (U$)</th>
                  <th>preco-teto (U$)</th>
                  <th>rentabilidade</th>
                  <th>vies</th>
                </tr>
              </thead>
              <tbody>
                {ativos.map((ativo, i) => (
                  <tr key={i}>
                    <td className="detalhe-td-rank">
                      <span className="detalhe-rank-num">{ativo.rank}</span>
                      {ativo.variacao !== 0 && (
                        <span className="detalhe-rank-var">
                          <span className="detalhe-rank-seta">&#9650;</span>{ativo.variacao}
                        </span>
                      )}
                      {ativo.variacao === 0 && (
                        <span className="detalhe-rank-igual">= 0</span>
                      )}
                    </td>
                    <td>
                      <div className="detalhe-ativo-logo">{ativo.ticker.substring(0, 2)}</div>
                    </td>
                    <td className="detalhe-td-ticker">
                      <strong>{ativo.ticker}</strong> <span className="detalhe-ticker-nome">{ativo.nome}</span>
                      <br />
                      <a href="#" className="detalhe-ver-relatorio">Ver relatorios</a>
                    </td>
                    <td>{ativo.dyEsperado}</td>
                    <td className="detalhe-td-entrada">
                      <span>{ativo.entrada}</span>
                      <br />
                      <span className="detalhe-data-entrada">{ativo.dataEntrada}</span>
                    </td>
                    <td className="detalhe-td-preco">
                      <span>{ativo.precoAtual}</span>
                      <br />
                      <span className="detalhe-var-preco">{ativo.varPreco}</span>
                    </td>
                    <td>{ativo.precoTeto}</td>
                    <td>
                      <span style={{ color: ativo.rentPositiva ? '#4caf50' : '#e53935' }}>
                        {ativo.rentabilidade}
                      </span>
                    </td>
                    <td>
                      <span className={'detalhe-vies' + (ativo.vies === 'Comprar' ? ' vies-comprar' : ' vies-aguardar')}>
                        {ativo.vies}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}