import React, { useEffect, useState } from 'react'
import axios from 'axios'
import './GerenciarPlano.css'
// Importamos o CSS do Planos público para a tela "Sem Plano" ficar igual!
import '../Assinaturas.css' 
import { useNavigate } from 'react-router-dom'

const planos = [
  {
    nome: 'Basic', preco: 29.90, icone: '📊', cor: '#00B4D8', bg: 'rgba(0,180,216,0.08)', borda: 'rgba(0,180,216,0.3)',
    beneficios: ['Acesso a 1 carteira de investimentos', 'Dashboard com resumo de ativos', 'Relatórios mensais básicos', 'Suporte por e-mail'],
    naoinclui: ['Análises avançadas', 'Alertas de mercado', 'Suporte prioritário'],
  },
  {
    nome: 'Premium', preco: 59.90, icone: '⭐', cor: '#F59E0B', bg: 'rgba(245,158,11,0.08)', borda: 'rgba(245,158,11,0.3)', destaque: true,
    beneficios: ['Acesso a 2 carteiras de investimentos', 'Dashboard com resumo de ativos', 'Relatórios mensais avançados', 'Análises avançadas de mercado', 'Alertas de mercado em tempo real', 'Suporte prioritário por e-mail'],
    naoinclui: ['Acesso ilimitado a carteiras'],
  },
  {
    nome: 'Black', preco: 99.90, icone: '💎', cor: '#A78BFA', bg: 'rgba(167,139,250,0.08)', borda: 'rgba(167,139,250,0.3)',
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
      
      // SALVA O TOKEN NOVO E ATUALIZA A TELA IMEDIATAMENTE
      if (response.data.token) {
        localStorage.setItem('caddie_token', response.data.token);
        window.dispatchEvent(new Event('perfilAtualizado'));
      }

      setPlanoAtualNome(null);
      setVencimento(null);
      setCancelado(true);
      setConfirmandoCancelamento(false);
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

  // TELA 1: USUÁRIO SEM PLANO (AGORA ESTÁ IGUAL A PÁGINA PÚBLICA /PLANOS)
  if (!planoAtualNome && !cancelado && !alterando) {
    return (
      <div className="ass-page" style={{ minHeight: 'auto', padding: '0', background: 'transparent' }}>
        <button onClick={() => navigate('/home')} className="ass-back-btn" style={{ marginBottom: '40px' }}>
            ← Voltar ao Painel
        </button>

        <div className="ass-header" style={{ marginBottom: '40px' }}>
          <h1 className="ass-title">Escolha seu primeiro plano</h1>
          <p className="ass-subtitle">Libere relatórios exclusivos e ferramentas avançadas de análise.</p>
        </div>

        <div className="ass-grid">
          {planos.map((plano) => (
            <div key={plano.nome} className={`ass-card ${plano.destaque ? 'destaque' : ''}`}>
              {plano.destaque && <div className="ass-badge-card">Mais popular</div>}
              <div className="ass-card-header">
                <div className="ass-icone">{plano.icone}</div>
                <h2 className="ass-nome">{plano.nome}</h2>
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
                className={`ass-btn ${plano.destaque ? 'ass-btn-destaque' : ''}`}
                onClick={() => handleAlterarPlano(plano.nome)}
              >
                Assinar {plano.nome}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // TELA 2: SUCESSO AO CANCELAR (Inalterada)
  if (cancelado) {
    return (
        <div className="mp-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '75vh', width: '100%', padding: '20px', boxSizing: 'border-box' }}>
          <div className="mp-sucesso-cancel" style={{ maxWidth: '450px', width: '100%', textAlign: 'center', backgroundColor: '#161b22', padding: '40px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div className="mp-sucesso-icone" style={{ fontSize: '48px', color: '#00B4D8', marginBottom: '20px' }}>✓</div>
            <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '16px' }}>Plano cancelado</h2>
            <p style={{ color: '#7a90a8', lineHeight: '1.6', marginBottom: '32px' }}>
              Seu plano foi cancelado com sucesso.
            </p>
            <button
                className="mp-btn-primario"
                onClick={() => { setCancelado(false); setAlterando(false); }}
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

          <div className="mp-header">
            <h1 className="mp-titulo">Meu Plano</h1>
            <p className="mp-subtitulo">Gerencie sua assinatura e benefícios</p>
          </div>

          <div className="mp-plano-atual">
            <div className="mp-plano-atual-info">
              <div className="mp-plano-atual-icone"
                   style={{ background: planoAtualObj?.bg, border: `1px solid ${planoAtualObj?.borda}` }}>
                {planoAtualObj?.icone}
              </div>
              <div>
                <p className="mp-plano-atual-label">Plano ativo</p>
                <h2 className="mp-plano-atual-nome" style={{ color: planoAtualObj?.cor }}>
                  {planoAtualObj?.icone} {planoAtualNome}
                </h2>
                <p className="mp-plano-atual-preco">
                  Válido até: <span>{vencimento}</span>
                </p>
              </div>
            </div>

            <div className="mp-plano-atual-acoes">
              <button className="mp-btn-alterar" onClick={() => setAlterando(true)}>
                🔄 Alterar plano
              </button>
              <button className="mp-btn-cancelar" onClick={() => setConfirmandoCancelamento(true)}>
                ❌ Cancelar plano
              </button>
            </div>
          </div>

          <div className="mp-section">
            <h3 className="mp-section-titulo">Seus benefícios</h3>
            <div className="mp-beneficios">
              {planoAtualObj?.beneficios.map((b) => (
                  <div key={b} className="mp-beneficio-item">
                    <span className="mp-beneficio-check" style={{ color: planoAtualObj?.cor }}>✓</span>
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