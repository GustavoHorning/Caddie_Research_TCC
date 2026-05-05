import './HeroSection.css';

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-badge">📊 Análises profissionais para investidores</div>

        <h1 className="hero-headline">
          Pesquisa de investimentos <br />
          <span className="hero-highlight">que gera resultado.</span>
        </h1>

        <p className="hero-subtitle">
          Acesse relatórios de ações, FIIs, carteiras recomendadas e papers econômicos
          elaborados por especialistas para guiar suas decisões com clareza e confiança.
        </p>

        <div className="hero-actions">
          <a href="/cadastro" className="hero-btn-primary">Começar Gratuitamente</a>
          <a href="#como-funciona" className="hero-btn-secondary">Ver como funciona →</a>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">500+</span>
            <span className="stat-label">Relatórios publicados</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-number">200+</span>
            <span className="stat-label">Ativos analisados</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-number">98%</span>
            <span className="stat-label">Satisfação dos assinantes</span>
          </div>
        </div>
      </div>

      <div className="hero-glow" />
    </section>
  );
}