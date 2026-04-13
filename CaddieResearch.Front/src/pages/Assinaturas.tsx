import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Assinaturas.css'

const planos = [
  {
    nome: 'Basic',
    preco: 29.90,
    descricao: 'Ideal para quem está começando a investir.',
    icone: '📊',
    carteiras: 1,
    destaque: false,
    beneficios: [
      'Acesso a 1 carteira de investimentos',
      'Dashboard com resumo de ativos',
      'Relatórios mensais básicos',
      'Suporte por e-mail',
    ],
    naoinclui: [
      'Análises avançadas',
      'Alertas de mercado',
      'Suporte prioritário',
    ],
  },
  {
    nome: 'Premium',
    preco: 59.90,
    descricao: 'Para investidores que querem ir além.',
    icone: '⭐',
    destaque: true,
    carteiras: 2,
    beneficios: [
      'Acesso a 2 carteiras de investimentos',
      'Dashboard com resumo de ativos',
      'Relatórios mensais avançados',
      'Análises avançadas de mercado',
      'Alertas de mercado em tempo real',
      'Suporte prioritário por e-mail',
    ],
    naoinclui: [
      'Acesso ilimitado a carteiras',
    ],
  },
  {
    nome: 'Black',
    preco: 99.90,
    descricao: 'Acesso completo a todas as funcionalidades.',
    icone: '💎',
    carteiras: 999,
    destaque: false,
    beneficios: [
      'Acesso a todas as carteiras',
      'Dashboard completo com analytics',
      'Relatórios ilimitados e personalizados',
      'Análises avançadas de mercado',
      'Alertas de mercado em tempo real',
      'Suporte VIP 24/7',
      'Consultoria mensal exclusiva',
    ],
    naoinclui: [],
  },
]

export default function Assinaturas() {
  const navigate = useNavigate()

  function handleAssinar(plano: typeof planos[0]) {
    navigate('/pagamento', { state: { plano } })
  }

  return (
    <div className="ass-page">
      <div className="ass-glow" />

      <div className="ass-header">
        <a href="/" className="ass-logo">Caddie<span>Research</span></a>
        <div className="ass-badge-topo-page">💳 Planos e Preços</div>
        <h1 className="ass-title">Escolha seu plano</h1>
        <p className="ass-subtitle">Invista com inteligência. Cancele quando quiser.</p>
      </div>

      <div className="ass-grid">
        {planos.map((plano) => (
          <div key={plano.nome} className={`ass-card ${plano.destaque ? 'destaque' : ''}`}>
            {plano.destaque && <div className="ass-badge-card">Mais popular</div>}

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
                <li key={b} className="ass-item ass-item-ok">
                  <span className="ass-check">✓</span>{b}
                </li>
              ))}
              {plano.naoinclui.map((n) => (
                <li key={n} className="ass-item ass-item-no">
                  <span className="ass-x">✕</span>{n}
                </li>
              ))}
            </ul>

            <button
              className={`ass-btn ${plano.destaque ? 'ass-btn-destaque' : ''}`}
              onClick={() => handleAssinar(plano)}
            >
              Assinar {plano.nome}
            </button>
          </div>
        ))}
      </div>

      <p className="ass-rodape">
        Cobrado mensalmente. Cancele quando quiser.
      </p>
    </div>
  )
}