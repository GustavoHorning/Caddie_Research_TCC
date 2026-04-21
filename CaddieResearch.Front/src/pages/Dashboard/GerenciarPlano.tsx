import React, { useState } from 'react'
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

// Plano atual do usuário — virá do backend futuramente
const PLANO_ATUAL = 'Basic'

export default function MeuPlano() {
  const navigate = useNavigate()
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false)
  const [cancelado, setCancelado] = useState(false)
  const [alterando, setAlterando] = useState(false)
  const [planoSelecionado, setPlanoSelecionado] = useState<string | null>(null)

  const planoAtualObj = planos.find(p => p.nome === PLANO_ATUAL)

  function handleAlterarPlano(nomePlano: string) {
    setPlanoSelecionado(nomePlano)
    const plano = planos.find(p => p.nome === nomePlano)
    if (plano) {
      sessionStorage.setItem('plano_selecionado', JSON.stringify(plano))
      navigate('/pagamento')
    }
  }

  function handleCancelar() {
    setCancelado(true)
    setConfirmandoCancelamento(false)
  }

  if (cancelado) {
    return (
      <div className="mp-page">
        <div className="mp-sucesso-cancel">
          <div className="mp-sucesso-icone">✓</div>
          <h2>Plano cancelado</h2>
          <p>Seu plano foi cancelado com sucesso. Você pode assinar novamente a qualquer momento.</p>
          <button className="mp-btn-primario" onClick={() => navigate('/planos')}>
            Ver planos disponíveis
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mp-page">

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
              {planoAtualObj?.icone} {PLANO_ATUAL}
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
                className={`mp-plano-card ${plano.nome === PLANO_ATUAL ? 'atual' : ''}`}
                style={{ borderColor: plano.nome === PLANO_ATUAL ? plano.borda : undefined }}
              >
                {plano.nome === PLANO_ATUAL && (
                  <span className="mp-plano-card-badge" style={{ color: plano.cor, background: plano.bg }}>
                    Plano atual
                  </span>
                )}
                {plano.destaque && plano.nome !== PLANO_ATUAL && (
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
                    background: plano.nome === PLANO_ATUAL ? 'transparent' : plano.cor,
                    color: plano.nome === PLANO_ATUAL ? plano.cor : '#fff',
                    border: `1px solid ${plano.borda}`,
                  }}
                  disabled={plano.nome === PLANO_ATUAL}
                  onClick={() => handleAlterarPlano(plano.nome)}
                >
                  {plano.nome === PLANO_ATUAL ? 'Plano atual' : `Assinar ${plano.nome}`}
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
              Tem certeza que deseja cancelar seu plano <strong>{PLANO_ATUAL}</strong>?
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
  )
}
