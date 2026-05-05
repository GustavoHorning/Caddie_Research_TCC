import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./TopBar.css";
import { useNavigate } from 'react-router-dom';

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
  const [user, setUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const carregarPerfil = async () => {
      try {
        const token = localStorage.getItem('caddie_token');
        const response = await axios.get('http://localhost:5194/api/usuario/meu-perfil', {
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

  return (
      <header className="topbar">

        <div className="topbar-left">
          <button className="menu-btn" onClick={onMenuToggle} title="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <div className="topbar-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Buscar ativos, relatórios..." />
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
  );
}