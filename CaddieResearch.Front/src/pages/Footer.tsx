import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-logo">Caddie <span className="footer-logo-highlight">Research</span></span>
            <p className="footer-tagline">
              Pesquisa de investimentos independente e de qualidade para o investidor brasileiro.
            </p>
          </div>

          <div className="footer-links-group">
            <h4>Produtos</h4>
            <ul>
              <li><a href="#">Relatórios de Ações</a></li>
              <li><a href="#">Relatórios de FIIs</a></li>
              <li><a href="#">Carteiras Recomendadas</a></li>
              <li><a href="#">Papers Econômicos</a></li>
            </ul>
          </div>

          <div className="footer-links-group">
            <h4>Empresa</h4>
            <ul>
              <li><a href="#">Sobre nós</a></li>
              <li><a href="#">Nossa equipe</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Contato</a></li>
            </ul>
          </div>

          <div className="footer-links-group">
            <h4>Conta</h4>
            <ul>
              <li><a href="/login">Entrar</a></li>
              <li><a href="/cadastro">Criar conta</a></li>
              <li><a href="#">Planos</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Caddie Research. Todos os direitos reservados.</p>
          <div className="footer-legal">
            <a href="#">Termos de uso</a>
            <a href="#">Política de privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
}