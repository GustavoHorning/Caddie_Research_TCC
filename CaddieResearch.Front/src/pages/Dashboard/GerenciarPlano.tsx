import React, { useEffect, useState } from 'react'
import axios from 'axios'
import './GerenciarPlano.css'
import { useNavigate } from 'react-router-dom'

const planos = [
  {
    nome: 'Basic',
    preco: 29.90,
    icone: '📊',
    cor: '#00B4D8',
    bg: 'rgba(0,180,216,0.08)',
    borda: 'rgba(0,180,216,0.3)',
    beneficios: [
      'Acesso a 1 carteira de investimentos',
      'Dashboard com resumo de ativos',
      'Relatórios mensais básicos',
      'Suporte por e-mail',
    ],
  },
  {
    nome: 'Premium',
    preco: 59.90,
    icone: '⭐',
    cor: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    borda: 'rgba(245,158,11,0.3)',
    destaque: true,
    beneficios: [
      'Acesso a 2 carteiras de investimentos',
      'Dashboard com resumo de ativos',
      'Relatórios mensais avançados',
      'Análises avançadas de mercado',
      'Alertas de mercado em tempo real',
      'Suporte prioritário por e-mail',
    ],
  },
  {
    nome: 'Black',
    preco: 99.90,
    icone: '💎',
    cor: '#A78BFA',
    bg: 'rgba(167,139,250,0.08)',
    borda: 'rgba(167,139,250,0.3)',
    beneficios: [
      'Acesso a todas as carteiras',
      'Dashboard completo com analytics',
      'Relatórios ilimitados e personalizados',
      'Análises avançadas de mercado',
      'Alertas de mercado em tempo real',
      'Suporte VIP 24/7',
      'Consultoria mensal exclusiva',
    ],
  },
]

export default function MeuPlano() {
  const navigate = useNavigate()

  const [planoAtualNome, setPlanoAtualNome] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false)
  const [cancelado, setCancelado] = useState(false)
  const [alterando, setAlterando] = useState(false)

  const planoAtualObj = planos.find(p => p.nome === planoAtualNome)

  useEffect(() => {
    const fetchPlanoAtual = async () => {
      try {
        const token = localStorage.getItem('caddie_token')
        const response = await axios.get('http://localhost:5194/api/assinatura/atual', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setPlanoAtualNome(response.data.plano)
      } catch (error: any) {
        if (error.response?.status === 404) {
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
    if (plano) {
      navigate('/pagamento', { state: { plano } });
    }
  }

  async function handleCancelar() {
    try {
      const token = localStorage.getItem('caddie_token')
      await axios.post('http://localhost:5194/api/assinatura/cancelar', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPlanoAtualNome(null);
      setCancelado(true)
      setConfirmandoCancelamento(false)
    } catch (error) {
      console.error(error)
      alert("Erro ao tentar cancelar a assinatura.")
    }
  }

  if (loading) {
    return (
        <div className="mp-page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px', width: '100%' }}>
          <p style={{ color: '#7a90a8' }}>Carregando dados do plano...</p>
        </div>
    )
  }

  // TELA 1: USUÁRIO SEM PLANO
  if (!planoAtualNome && !cancelado && !alterando) {
    return (
        <div className="mp-page" style={{ display: 'flex', justifyContent: 'center', width: '100%', boxSizing: 'border-box', padding: '40px 20px' }}>
          <div style={{ maxWidth: '1100px', width: '100%' }}>

            <button
                onClick={() => navigate('/home')}
                style={{ background: 'none', border: 'none', color: '#7a90a8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', padding: '0', marginBottom: '40px', transition: 'color 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                onMouseOut={(e) => e.currentTarget.style.color = '#7a90a8'}
            >
              ← Voltar ao Painel
            </button>

            <div className="mp-header" style={{ marginBottom: '40px' }}>
              <h1 className="mp-titulo" style={{ fontSize: '32px', color: '#fff', marginBottom: '8px' }}>Escolha seu primeiro plano</h1>
              <p className="mp-subtitulo" style={{ color: '#7a90a8', fontSize: '16px' }}>Libere relatórios exclusivos e ferramentas avançadas de análise.</p>
            </div>

            <div className="mp-planos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {planos.map((plano) => (
                  <div
                      key={plano.nome}
                      className="mp-plano-card"
                      style={{ backgroundColor: '#161b22', border: `1px solid ${plano.borda || 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', padding: '32px 24px', display: 'flex', flexDirection: 'column' }}
                  >
                    <div className="mp-plano-card-icone" style={{ fontSize: '32px', marginBottom: '16px' }}>{plano.icone}</div>
                    <h4 className="mp-plano-card-nome" style={{ color: plano.cor, fontSize: '20px', marginBottom: '12px' }}>{plano.nome}</h4>
                    <p className="mp-plano-card-preco" style={{ color: '#fff', fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>
                      R$ {plano.preco.toFixed(2).replace('.', ',')}
                      <span style={{ fontSize: '14px', color: '#7a90a8', fontWeight: 'normal' }}>/mês</span>
                    </p>

                    <ul className="mp-plano-card-lista" style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', flex: 1 }}>
                      {plano.beneficios.map(b => (
                          <li key={b} style={{ color: '#c9d1d9', fontSize: '14px', marginBottom: '12px', display: 'flex', gap: '8px' }}>
                            <span style={{ color: plano.cor || '#00B4D8' }}>✓</span> {b}
                          </li>
                      ))}
                    </ul>

                    <button
                        className="mp-plano-card-btn"
                        style={{ background: plano.cor, color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginTop: 'auto' }}
                        onClick={() => handleAlterarPlano(plano.nome)}
                    >
                      Assinar {plano.nome}
                    </button>
                  </div>
              ))}
            </div>
          </div>
        </div>
    );
  }

  // TELA 2: SUCESSO AO CANCELAR
  if (cancelado) {
    return (
        <div className="mp-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '75vh', width: '100%', padding: '20px', boxSizing: 'border-box' }}>
          <div className="mp-sucesso-cancel" style={{ maxWidth: '450px', width: '100%', textAlign: 'center', backgroundColor: '#161b22', padding: '40px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div className="mp-sucesso-icone" style={{ fontSize: '48px', color: '#00B4D8', marginBottom: '20px' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto' }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '16px' }}>Plano cancelado</h2>
            <p style={{ color: '#7a90a8', lineHeight: '1.6', marginBottom: '32px' }}>
              Seu plano foi cancelado com sucesso. Você pode assinar novamente a qualquer momento para recuperar seus benefícios.
            </p>
            <button
                className="mp-btn-primario"
                onClick={() => {
                  setCancelado(false);
                  setAlterando(false);
                }}
                style={{ width: '100%', padding: '14px', fontSize: '16px', borderRadius: '8px' }}
            >
              Ver planos disponíveis
            </button>
          </div>
        </div>
    )
  }

  // TELA 3: GERENCIAR PLANO ATUAL
  return (
      <div className="mp-page" style={{ display: 'flex', justifyContent: 'center', width: '100%', boxSizing: 'border-box', padding: '40px 20px' }}>
        <div style={{ maxWidth: '900px', width: '100%' }}>

          <button
              onClick={() => navigate('/home')}
              style={{ background: 'none', border: 'none', color: '#7a90a8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', padding: '0', marginBottom: '30px' }}
          >
            ← Voltar ao Painel
          </button>

          {/* HEADER */}
          <div className="mp-header">
            <h1 className="mp-titulo">Meu Plano</h1>
            <p className="mp-subtitulo">Gerencie sua assinatura e benefícios</p>
          </div>

          {/* PLANO ATUAL */}
          <div className="mp-plano-atual">
            <div className="mp-plano-atual-info">
              <div className="mp-plano-atual-icone"
                   style={{ background: planoAtualObj?.bg, border: `1px solid ${planoAtualObj?.borda}` }}>
                {planoAtualObj?.icone}
              </div>
              <div>
                <p className="mp-plano-atual-label">Plano atual</p>
                <h2 className="mp-plano-atual-nome" style={{ color: planoAtualObj?.cor }}>
                  {planoAtualObj?.icone} {planoAtualNome}
                </h2>
                <p className="mp-plano-atual-preco">
                  R$ {planoAtualObj?.preco.toFixed(2).replace('.', ',')}
                  <span>/mês</span>
                </p>
              </div>
            </div>

            <div className="mp-plano-atual-acoes">
              <button
                  className="mp-btn-alterar"
                  onClick={() => setAlterando(true)}
              >
                🔄 Alterar plano
              </button>
              <button
                  className="mp-btn-cancelar"
                  onClick={() => setConfirmandoCancelamento(true)}
              >
                ❌ Cancelar plano
              </button>
            </div>
          </div>

          {/* BENEFÍCIOS DO PLANO ATUAL */}
          <div className="mp-section">
            <h3 className="mp-section-titulo">Seus benefícios</h3>
            <div className="mp-beneficios">
              {planoAtualObj?.beneficios.map((b) => (
                  <div key={b} className="mp-beneficio-item">
                    <span className="mp-beneficio-check" style={{ color: planoAtualObj.cor }}>✓</span>
                    {b}
                  </div>
              ))}
            </div>
          </div>

          {/* TROCAR PLANO */}
          {alterando && (
              <div className="mp-section">
                <div className="mp-section-header">
                  <h3 className="mp-section-titulo">Escolha um novo plano</h3>
                  <button className="mp-btn-fechar" onClick={() => setAlterando(false)}>✕</button>
                </div>
                <div className="mp-planos-grid">
                  {planos.map((plano) => (
                      <div
                          key={plano.nome}
                          className={`mp-plano-card ${plano.nome === planoAtualNome ? 'atual' : ''}`}
                          style={{ borderColor: plano.nome === planoAtualNome ? plano.borda : undefined }}
                      >
                        {plano.nome === planoAtualNome && (
                            <span className="mp-plano-card-badge" style={{ color: plano.cor, background: plano.bg }}>
                      Plano atual
                    </span>
                        )}
                        {plano.destaque && plano.nome !== planoAtualNome && (
                            <span className="mp-plano-card-badge" style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.1)' }}>
                      Mais popular
                    </span>
                        )}
                        <div className="mp-plano-card-icone">{plano.icone}</div>
                        <h4 className="mp-plano-card-nome" style={{ color: plano.cor }}>{plano.nome}</h4>
                        <p className="mp-plano-card-preco">
                          R$ {plano.preco.toFixed(2).replace('.', ',')}
                          <span>/mês</span>
                        </p>
                        <ul className="mp-plano-card-lista">
                          {plano.beneficios.slice(0, 3).map((b) => (
                              <li key={b}>
                                <span style={{ color: plano.cor }}>✓</span> {b}
                              </li>
                          ))}
                          {plano.beneficios.length > 3 && (
                              <li style={{ color: 'rgba(255,255,255,0.3)' }}>
                                +{plano.beneficios.length - 3} benefícios
                              </li>
                          )}
                        </ul>
                        <button
                            className="mp-plano-card-btn"
                            style={{
                              background: plano.nome === planoAtualNome ? 'transparent' : plano.cor,
                              color: plano.nome === planoAtualNome ? plano.cor : '#fff',
                              border: `1px solid ${plano.borda}`,
                            }}
                            disabled={plano.nome === planoAtualNome}
                            onClick={() => handleAlterarPlano(plano.nome)}
                        >
                          {plano.nome === planoAtualNome ? 'Plano atual' : `Assinar ${plano.nome}`}
                        </button>
                      </div>
                  ))}
                </div>
              </div>
          )}

          {/* MODAL CANCELAMENTO */}
          {confirmandoCancelamento && (
              <div className="mp-overlay">
                <div className="mp-modal">
                  <div className="mp-modal-icone">⚠️</div>
                  <h3 className="mp-modal-titulo">Cancelar plano?</h3>
                  <p className="mp-modal-texto">
                    Tem certeza que deseja cancelar seu plano <strong>{planoAtualNome}</strong>?
                    Você perderá acesso aos benefícios ao final do período atual.
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
      </div>
  )
}