import './CTASection.css';

export default function CTASection() {
  return (
    <section className="cta-section" id="planos">
      <div className="cta-container">
        <div className="cta-badge">🚀 Comece hoje mesmo</div>
        <h2 className="cta-title">
          Pronto para investir com <span className="cta-highlight">mais inteligência?</span>
        </h2>
        <p className="cta-subtitle">
          Junte-se a milhares de investidores que já usam a Caddie Research para tomar decisões
          mais embasadas e construir patrimônio com consistência.
        </p>
        <div className="cta-actions">
          <a href="/cadastro" className="cta-btn-primary">Criar conta grátis</a>
          <a href="/planos" className="cta-btn-secondary">Ver planos e preços</a>
        </div>
        <p className="cta-disclaimer">Sem compromisso. Cancele quando quiser.</p>
      </div>
      <div className="cta-glow" />
    </section>
  );
}