import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <span className="logo-text">Caddie <span className="logo-highlight">Research</span></span>
        </div>

        <ul className="navbar-links">
          <li><a href="#produtos">Produtos</a></li>
          <li><a href="#diferenciais">Diferenciais</a></li>
          <li><a href="#como-funciona">Como Funciona</a></li>
          <li><a href="#planos">Planos</a></li>
        </ul>

        <div className="navbar-actions">
          <a href="/login" className="btn-login">Entrar</a>
          <a href="/cadastro" className="btn-cadastro">Cadastrar-se</a>
        </div>
      </div>
    </nav>
  );
}