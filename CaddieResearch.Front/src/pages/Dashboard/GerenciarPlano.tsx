import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import Sidebar from '../../pages/Dashboard/Sidebar'
import TopBar from '../../pages/Dashboard/TopBar'

import './GerenciarPlano.css'
import '../Assinaturas.css'

const planos = [
  {
    nome: 'Basic', preco: 29.90, descricao: 'Ideal para quem está começando a investir.', icone: '📊',
    cor: '#00B4D8', bg: 'rgba(0,180,216,0.08)', borda: 'rgba(0,180,216,0.3)', destaque: false,
    beneficios: ['Acesso a 1 carteira de investimentos', 'Dashboard com resumo de ativos', 'Relatórios mensais básicos', 'Suporte por e-mail'],
    naoinclui: ['Análises avançadas', 'Alertas de mercado', 'Suporte prioritário'],
  },
  {
    nome: 'Premium', preco: 59.90, descricao: 'Para investidores que querem ir além.', icone: '⭐',
    cor: '#F59E0B', bg: 'rgba(245,158,11,0.08)', borda: 'rgba(245,158,11,0.3)', destaque: true,
    beneficios: ['Acesso a 2 carteiras de investimentos', 'Dashboard com resumo de ativos', 'Relatórios mensais avançados', 'Análises avançadas de mercado', 'Alertas de mercado em tempo real', 'Suporte prioritário por e-mail'],
    naoinclui: ['Acesso ilimitado a carteiras'],
  },
  {
    nome: 'Black', preco: 99.90, descricao: 'Acesso completo a todas as funcionalidades.', icone: '💎',
    cor: '#A78BFA', bg: 'rgba(167,139,250,0.08)', borda: 'rgba(167,139,250,0.3)', destaque: false,
    beneficios: ['Acesso a todas as carteiras', 'Dashboard completo com analytics', 'Relatórios ilimitados e personalizados', 'Análises avançadas de mercado', 'Alertas de mercado em tempo real', 'Suporte VIP 24/7', 'Consultoria mensal exclusiva'],
    naoinclui: [],
  },
]

export default function MeuPlano() {
  const navigate = useNavigate()
  const [planoAtualNome, setPlanoAtualNome] = useState<string | null>(null)
  const [vencimento, setVencimento] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false)
  const [cancelado, setCancelado] = useState(false)
  const [alterando, setAlterando] = useState(false)
  const [menuMobileAberto, setMenuMobileAberto] = useState(false)

  const planoAtualObj = planos.find(p => p.nome.toLowerCase() === planoAtualNome?.toLowerCase())

  useEffect(() => {
    const fetchPlanoAtual = async () => {
      try {
        const token = localStorage.getItem('caddie_token')
        const response = await axios.get('http://localhost:5194/api/assinatura/atual', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setPlanoAtualNome(response.data.plano)
        setVencimento(response.data.vencimento)
      } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 401) {
          setPlanoAtualNome(null)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchPlanoAtual()
  }, [])

  function handleAlterarPlano(nomePlano: string) {
    const plano = planos.find(p => p.nome === nomePlano);
    if (plano) navigate('/pagamento', { state: { plano } });
  }

  async function handleCancelar() {
    try {
      const token = localStorage.getItem('caddie_token')
      const response = await axios.post('http://localhost:5194/api/assinatura/cancelar', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.token) {
        localStorage.setItem('caddie_token', response.data.token);
        window.dispatchEvent(new Event('perfilAtualizado'));
      }

      setPlanoAtualNome(null);
      setVencimento(null);
      setCancelado(true);
      setConfirmandoCancelamento(false);
      setAlterando(false);
    } catch (error) {
      console.error(error)
      alert("Erro ao tentar cancelar a assinatura.")
    }
  }

  const RenderCardsPlanos = () => (
      <div className="ass-grid" style={{ padding: 0, marginTop: '32px' }}>
        {planos.map((plano) => {
          const isPlanoAtual = plano.nome === planoAtualNome;

          return (
              <div key={plano.nome} className={`ass-card ${plano.destaque && !isPlanoAtual ? 'destaque' : ''}`} style={{ borderColor: isPlanoAtual ? plano.borda : '' }}>
                {plano.destaque && !isPlanoAtual && <div className="ass-badge-card">Mais popular</div>}
                {isPlanoAtual && <div className="ass-badge-card" style={{ background: plano.cor, color: '#fff' }}>Seu Plano Atual</div>}

                <div className="ass-card-header">
                  <div className="ass-icone">{plano.icone}</div>
                  <h2 className="ass-nome">{plano.nome}</h2>
                  <p className="ass-descricao">{plano.descricao}</p>

                  <div className="ass-preco-wrapper">
                    <span className="ass-cifrao">R$</span>
                    <span className="ass-preco">{plano.preco.toFixed(2).replace('.', ',')}</span>
                    <span className="ass-periodo">/mês</span>
                  </div>
                </div>

                <div className="ass-divider" />

                <ul className="ass-lista">
                  {plano.beneficios.map((b) => (
                      <li key={b} className="ass-item ass-item-ok"><span className="ass-check">✓</span>{b}</li>
                  ))}
                  {plano.naoinclui?.map((n) => (
                      <li key={n} className="ass-item ass-item-no"><span className="ass-x">✕</span>{n}</li>
                  ))}
                </ul>

                <button
                    className={`ass-btn ${plano.destaque && !isPlanoAtual ? 'ass-btn-destaque' : ''}`}
                    style={isPlanoAtual ? { background: 'transparent', color: plano.cor, borderColor: plano.borda, opacity: 0.7, cursor: 'default' } : {}}
                    disabled={isPlanoAtual}
                    onClick={() => handleAlterarPlano(plano.nome)}
                >
                  {isPlanoAtual ? 'Plano Ativo' : `Assinar ${plano.nome}`}
                </button>
              </div>
          );
        })}
      </div>
  );

  return (
      <div className="dashboard-layout">
        <Sidebar activePath="/gerenciar-plano" isOpen={menuMobileAberto} onClose={() => setMenuMobileAberto(false)} />
        {menuMobileAberto && <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>}
        <TopBar onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />

        <main className="dashboard-main">
          <div className="mp-container">
            <Link to="/home" className="btn-voltar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Voltar para o Início
            </Link>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#7a90a8' }}>Carregando detalhes da assinatura...</div>
            ) : cancelado ? (
                <div className="mp-sucesso-cancel">
                  <div className="mp-sucesso-icone">✓</div>
                  <h2>Plano cancelado</h2>
                  <p>Seu plano foi cancelado com sucesso. Você retornou ao modo gratuito.</p>
                  <button className="mp-btn-primario" onClick={() => { setCancelado(false); setAlterando(true); }}>
                    Ver planos disponíveis
                  </button>
                </div>
            ) : !planoAtualNome || alterando ? (
                <div>
                  <div className="mp-header">
                    <h1 className="mp-titulo">{alterando ? 'Fazer Upgrade' : 'Escolha seu plano'}</h1>
                    <p className="mp-subtitulo">Libere relatórios exclusivos e ferramentas avançadas de análise para gerenciar sua carteira.</p>
                    {alterando && (
                        <button className="mp-btn-cancelar" style={{ marginTop: '16px' }} onClick={() => setAlterando(false)}>
                          Cancelar alteração
                        </button>
                    )}
                  </div>
                  <RenderCardsPlanos />
                </div>
            ) : (
                <div>
                  <div className="mp-header">
                    <h1 className="mp-titulo">Meu Plano</h1>
                    <p className="mp-subtitulo">Gerencie sua assinatura e seus benefícios ativos</p>
                  </div>

                  <div className="mp-plano-atual">
                    <div className="mp-plano-atual-info">
                      <div className="mp-plano-atual-icone" style={{ background: planoAtualObj?.bg, border: `1px solid ${planoAtualObj?.borda}` }}>
                        {planoAtualObj?.icone}
                      </div>
                      <div>
                        <p className="mp-plano-atual-label">Plano ativo</p>
                        <h2 className="mp-plano-atual-nome" style={{ color: planoAtualObj?.cor }}>
                          {planoAtualNome}
                        </h2>
                        <p className="mp-plano-atual-preco">
                          Válido até: <span>{vencimento}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mp-plano-atual-acoes">
                      <button className="mp-btn-alterar" onClick={() => setAlterando(true)}>
                        🚀 Fazer Upgrade
                      </button>
                      <button className="mp-btn-cancelar" onClick={() => setConfirmandoCancelamento(true)}>
                        Cancelar assinatura
                      </button>
                    </div>
                  </div>

                  <div className="mp-section">
                    <h3 className="mp-section-titulo">Seus benefícios liberados</h3>
                    <div className="mp-beneficios">
                      {planoAtualObj?.beneficios.map((b) => (
                          <div key={b} className="mp-beneficio-item">
                            <span className="mp-beneficio-check" style={{ color: planoAtualObj?.cor }}>✓</span>
                            {b}
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
            )}

            {confirmandoCancelamento && (
                <div className="mp-overlay">
                  <div className="mp-modal">
                    <div className="mp-modal-icone">⚠️</div>
                    <h3 className="mp-modal-titulo">Cancelar plano?</h3>
                    <p className="mp-modal-texto">
                      Tem certeza que deseja cancelar seu plano <strong>{planoAtualNome}</strong>?
                      Você perderá acesso às carteiras e relatórios exclusivos.
                    </p>
                    <div className="mp-modal-acoes">
                      <button className="mp-btn-voltar" onClick={() => setConfirmandoCancelamento(false)}>
                        Manter plano
                      </button>
                      <button className="mp-btn-confirmar-cancel" onClick={handleCancelar}>
                        Sim, cancelar
                      </button>
                    </div>
                  </div>
                </div>
            )}
          </div>
        </main>
      </div>
  )
}