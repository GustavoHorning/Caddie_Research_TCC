import { useState } from 'react';
import './Navbar.css';

export default function Navbar() {
  const [menuAberto, setMenuAberto] = useState(false);

  const toggleMenu = () => {
    setMenuAberto(!menuAberto);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <span className="logo-text">Caddie<span className="logo-highlight">Research</span></span>
        </div>

        <ul className={`navbar-links ${menuAberto ? 'active' : ''}`}>
           <li><a href="#produtos" onClick={toggleMenu}>Produtos</a></li>
           <li><a href="#como-funciona" onClick={toggleMenu}>Como Funciona</a></li>
           <li><a href="#diferenciais" onClick={toggleMenu}>Diferenciais</a></li>
           <li><a href="#planos" onClick={toggleMenu}>Planos</a></li>
        </ul>

        <div className="navbar-actions">
          <a href="/login" className="btn-login">Entrar</a>
          <a href="/cadastro" className="btn-cadastro">Cadastre-se</a>
          
          <button className="mobile-menu-btn" onClick={toggleMenu}>
            <span className={`hamburger ${menuAberto ? 'active' : ''}`}></span>
          </button>
        </div>
      </div>
    </nav>
  );
}