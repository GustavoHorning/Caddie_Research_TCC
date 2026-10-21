import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
    const [menuAberto, setMenuAberto] = useState(false);
    const location = useLocation();
    const isHome = location.pathname === '/';

    const [tema, setTema] = useState<'dark' | 'light'>(() => {
        return localStorage.getItem('caddie_tema') === 'light' ? 'light' : 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', tema);
        localStorage.setItem('caddie_tema', tema);

        const sincronizar = () => {
            setTema(localStorage.getItem('caddie_tema') === 'light' ? 'light' : 'dark');
        };
        window.addEventListener('temaAtualizado', sincronizar);
        return () => window.removeEventListener('temaAtualizado', sincronizar);
    }, [tema]);

    const alternarTema = () => {
        const novo = tema === 'dark' ? 'light' : 'dark';
        setTema(novo);
        localStorage.setItem('caddie_tema', novo);
        document.documentElement.setAttribute('data-theme', novo);
        window.dispatchEvent(new Event('temaAtualizado'));
    };

    const toggleMenu = () => {
        setMenuAberto(!menuAberto);
    };

    const getNavLink = (hash: string) => isHome ? hash : `/${hash}`;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo" onClick={() => setMenuAberto(false)}>
                    <span className="logo-text">Caddie<span className="logo-highlight">Research</span></span>
                </Link>

                <ul className={`navbar-links ${menuAberto ? 'active' : ''}`}>
                    <li><a href={getNavLink("#produtos")} onClick={toggleMenu}>Produtos</a></li>
                    <li><a href={getNavLink("#como-funciona")} onClick={toggleMenu}>Como Funciona</a></li>
                    <li><a href={getNavLink("#diferenciais")} onClick={toggleMenu}>Diferenciais</a></li>
                    <li><a href={getNavLink("#planos")} onClick={toggleMenu}>Planos</a></li>

                    <li className="mobile-only-btn">
                        <Link to="/login" onClick={toggleMenu}>Entrar</Link>
                    </li>
                    <li className="mobile-only-btn">
                        <Link to="/cadastro" className="btn-cadastro-mobile" onClick={toggleMenu}>Cadastre-se</Link>
                    </li>
                </ul>

                <div className="navbar-actions">
                    <button
                        type="button"
                        className="theme-toggle-btn"
                        onClick={alternarTema}
                        style={{ marginRight: '12px' }}
                        title="Alternar entre Modo Escuro e Modo Claro"
                    >
                        {tema === 'dark' ? (
                            <>🌙 <span className="theme-label-text">Dark</span></>
                        ) : (
                            <>☀️ <span className="theme-label-text">Light</span></>
                        )}
                    </button>

                    <Link to="/login" className="btn-login desktop-btn">Entrar</Link>
                    <Link to="/cadastro" className="btn-cadastro desktop-btn">Cadastre-se</Link>

                    <button className="mobile-menu-btn" onClick={toggleMenu}>
                        <span className={`hamburger ${menuAberto ? 'active' : ''}`}></span>
                    </button>
                </div>
            </div>
        </nav>
    );
}