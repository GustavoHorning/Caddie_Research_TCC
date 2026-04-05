import './DashboardHome.css'

const ultimasAtualizacoes = [
  { icon: 'RE', titulo: 'Radar Econ\u00F4mico', subtitulo: 'Edi\u00E7\u00E3o #48', tag: 'Relat\u00F3rio', tempo: 'h\u00E1 2 dias' },
  { icon: 'RF', titulo: 'Caddie Renda Fixa', subtitulo: 'Edi\u00E7\u00E3o #237', tag: 'Relat\u00F3rio', tempo: 'h\u00E1 2 dias' },
  { icon: 'ET', titulo: 'ETFs Internacionais', subtitulo: 'Edi\u00E7\u00E3o #281', tag: 'Relat\u00F3rio', tempo: 'h\u00E1 2 dias' },
  { icon: 'CC', titulo: 'Caddie Call #2026', subtitulo: 'A replica\u00E7\u00E3o e os investimentos.', tag: '', tempo: '' },
]


export default function DashboardHome() {
  return (
    <div className="dash-content">
      {/* Topo: Banner + Promo lado a lado */}
      <div className="dash-topo-row">
        <section className="dash-banner">
          <div className="dash-banner-content">
            <div className="dash-banner-badge">Bem-vindo a Caddie Research</div>
            <h2 className="dash-banner-title">Sua jornada de investimentos começa aqui</h2>
            <p className="dash-banner-text">
              Explore relatórios, carteiras recomendadas e análises exclusivas para tomar decisões mais inteligentes.
            </p>
            <a href="/relatorios" className="dash-banner-btn">VER RELATÓRIOS</a>
          </div>
          <div className="dash-banner-visual">
            <div className="dash-banner-graphic">
              <span className="dash-banner-chart">C</span>
            </div>
          </div>
        </section>

        <div className="dash-promo-card dash-promo-whatsapp">
          <span className="dash-promo-beta">BETA</span>
          <h3>Converse com a Caddie no WhatsApp</h3>
          <p>Tire suas dúvidassobre as carteiras e ativos recomendados com o nosso suporte</p>
          <a href="#" className="dash-promo-btn">COMECE A USAR</a>
        </div>
      </div>

      {/* Grid principal de cards */}
      <section className="dash-grid">
        {/* Ultimas Atualizacoes */}
        <div className="dash-card dash-card-atualizacoes">
          <div className="dash-card-header">
            <h3>{'\u00DAltimas Atualiza\u00E7\u00F5es'}</h3>
            <button className="dash-card-toggle">v</button>
          </div>
          <ul className="dash-lista">
            {ultimasAtualizacoes.map((item, i) => (
              <li key={i} className="dash-lista-item">
                <span className="dash-lista-icon">{item.icon}</span>
                <div className="dash-lista-info">
                  <strong>{item.titulo}</strong>
                  <span className="dash-lista-sub">{item.subtitulo}</span>
                </div>
                {item.tag && <span className="dash-lista-tag">{item.tag}</span>}
                {item.tempo && <span className="dash-lista-tempo">{item.tempo}</span>}
              </li>
            ))}
          </ul>
        </div>

        {/* Proximos Eventos */}
        <div className="dash-card dash-card-eventos">
          <div className="dash-card-header">
            <h3>{`Pr\u00F3ximos Eventos`}</h3>
            <span className="dash-card-icon">E</span>
          </div>
          <div className="dash-eventos-empty">
            <span className="dash-eventos-check">ok</span>
            <p>Sem eventos previstos</p>
            <span className="dash-eventos-sub">Confira os eventos que já foram realizados</span>
            <a href="#" className="dash-eventos-btn">EVENTOS PASSADOS</a>
          </div>
        </div>

        {/* Caddie Minuto */}
        <div className="dash-card dash-card-minuto">
          <div className="dash-card-header">
            <h3>Caddie Minuto</h3>
            <span className="dash-card-sub-header">Confira as principais atualizações do mercado.</span>
          </div>
          <div className="dash-minuto-item">
            <div className="dash-minuto-author">
              <div className="dash-minuto-avatar">A</div>
              <div>
                <strong>Analista Caddie</strong>
                <span className="dash-minuto-time"> 7 dias</span>
              </div>
            </div>
            <p className="dash-minuto-text">
              O foco da semana foi a inclusão de novos ativos na carteira de Dividendos, refletindo a estratégia de capturar valor no longo prazo.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}