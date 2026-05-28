import React, { useState, useEffect, useRef } from "react";
import "./TopBar.css";
import { useNavigate } from 'react-router-dom';
import api from "../services/api.tsx";
import AtendimentoWidget from './AtendimentoWidget'
import GlobalSearch from './GlobalSearch'; 

interface UserProfile {
  nome: string;
  email: string;
  tipoPerfil: string;
  plano: string | null;
  fotoPerfilUrl?: string | null;
}

interface TopBarProps {
  userName?: string;
  onMenuToggle?: () => void;
}

export default function TopBar({ userName, onMenuToggle }: TopBarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAtendimentoOpen, setIsAtendimentoOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const carregarPerfil = async () => {
      try {
        const token = localStorage.getItem('caddie_token');
        const response = await api.get('/api/usuario/meu-perfil',  {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      }
    };

    carregarPerfil();
    window.addEventListener('perfilAtualizado', carregarPerfil);
    return () => window.removeEventListener('perfilAtualizado', carregarPerfil);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('caddie_token');
    sessionStorage.clear();
    navigate('/login');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="topbar">

        <div className="topbar-left">
          <button className="menu-btn" onClick={onMenuToggle} title="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <div className="topbar-search search-trigger" onClick={() => setIsSearchOpen(true)}>
            <div className="search-trigger-left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="search-text-desktop">Buscar ativos, relatórios...</span>
            </div>
            <span className="ctrl-k-badge">Ctrl K</span>
          </div>
        </div>

        <div className="topbar-actions">
          <button className="icon-btn" title="Notificações">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className="badge"></span>
          </button>

          <button className="icon-btn" title="Configurações" onClick={() => navigate('/gerenciar-plano')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>

          <button className="icon-btn" title="Atendimento" onClick={() => setIsAtendimentoOpen(!isAtendimentoOpen)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 18v-6a9 9 0 0118 0v6" />
              <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
            </svg>
          </button>

          <div className="user-profile" ref={menuRef} onClick={() => user && setIsDropdownOpen(!isDropdownOpen)}>
            {!user ? (
                <>
                  <div className="user-info skeleton-container">
                    <div className="skeleton skeleton-text" style={{ width: '100px', height: '14px' }}></div>
                    <div className="skeleton skeleton-text" style={{ width: '60px', height: '10px' }}></div>
                  </div>
                  <div className="skeleton skeleton-circular avatar-skeleton"></div>
                </>
            ) : (
                <>
                  <div className="user-info">
                    <span className="user-name">{user.nome}</span>
                    <span className={`user-plan plan-${(user.tipoPerfil === 'Gestor' ? 'gestor' : user.plano || 'free').toLowerCase()}`}>
                        {user.tipoPerfil === 'Gestor' ? 'Gestor' : (user.plano || 'Free')}
                      </span>
                  </div>

                  <div className="avatar">
                    {user.fotoPerfilUrl ? (
                        <img src={user.fotoPerfilUrl} alt="Avatar" />
                    ) : (
                        <div className="avatar-placeholder">
                          {user.nome.charAt(0).toUpperCase()}
                        </div>
                    )}
                  </div>
                </>
            )}

            {isDropdownOpen && (
                <div className="dropdown-menu">
                  <button onClick={() => { navigate('/home/perfil'); setIsDropdownOpen(false); }} className="dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Meu Perfil
                  </button>

                  {user?.tipoPerfil !== 'Gestor' && (
                      <button onClick={() => { navigate('/gerenciar-plano'); setIsDropdownOpen(false); }} className="dropdown-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                        Assinatura
                      </button>
                  )}

                  <div className="dropdown-divider"></div>

                  <button onClick={handleLogout} className="dropdown-item logout">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sair
                  </button>
                </div>
            )}
          </div>
        </div>
      </header>

      {isSearchOpen && <GlobalSearch onClose={() => setIsSearchOpen(false)} />}

      <AtendimentoWidget
        isOpen={isAtendimentoOpen}
        onClose={() => setIsAtendimentoOpen(false)}
        userName={user?.nome || 'Usuário'}
      />
    </>
  );
}