import React, { useState, useEffect, useRef } from "react";
import "./TopBar.css";
import { useNavigate } from 'react-router-dom';
import api from "../services/api";
import AtendimentoWidget from './AtendimentoWidget';
import GlobalSearch from './GlobalSearch';
import { useNotification } from '../contexts/NotificationContext';

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
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { notificacoes, naoLidas, marcarComoLida, marcarTodasComoLidas } = useNotification();
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutsideNotif(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsideNotif);
    return () => document.removeEventListener("mousedown", handleClickOutsideNotif);
  }, []);

  useEffect(() => {
    const carregarPerfil = async () => {
      try {
        const response = await api.get('/api/usuario/meu-perfil');
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAtendimentoOpen) setHasNewMessage(true);
    }, 4000);
    return () => clearTimeout(timer);
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

  const isGestor = user?.tipoPerfil === 'Gestor';

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
          </div>

          {!isGestor && (
              <div className="topbar-center">
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
          )}

          <div className="topbar-actions">

            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                  className="icon-btn"
                  title="Notificações"
                  onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                {naoLidas > 0 && <span className="badge badge-pulse"></span>}
              </button>

              {isNotifMenuOpen && (
                  <div className="dropdown-menu" style={{ width: '360px', right: '-80px', padding: 0, overflow: 'hidden' }}>

                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong style={{ color: '#fff', fontSize: '0.95rem', lineHeight: 1 }}>Notificações</strong>

                        {naoLidas > 0 && (
                            <span style={{
                              background: '#f44336',
                              color: '#fff',
                              padding: '0 8px',
                              height: '20px', 
                              display: 'inline-flex', 
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '10px',
                              fontSize: '0.65rem',
                              fontWeight: 'bold',
                              letterSpacing: '0.5px'
                            }}>
                        {naoLidas} {naoLidas === 1 ? 'nova' : 'novas'}
                      </span>
                        )}
                      </div>

                      {naoLidas > 0 && (
                          <button
                              onClick={marcarTodasComoLidas}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#00B4D8',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                padding: 0,
                                opacity: 0.9
                              }}
                              onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                              onMouseOut={(e) => e.currentTarget.style.opacity = '0.9'}
                          >
                            Marcar todas como lidas
                          </button>
                      )}
                    </div>

                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                      {notificacoes.length === 0 ? (
                          <div style={{ padding: '30px 20px', textAlign: 'center', color: '#8b949e', fontSize: '0.85rem' }}>
                            Nenhuma notificação no momento.
                          </div>
                      ) : (
                          notificacoes.map(notif => (
                              <div
                                  key={notif.id}
                                  onClick={() => {
                                    if (!notif.lida) marcarComoLida(notif.id);
                                    if (notif.linkDestino) navigate(notif.linkDestino);
                                  }}
                                  style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    background: notif.lida ? 'transparent' : 'rgba(0, 180, 216, 0.08)',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                  }}>
                                <strong style={{ fontSize: '0.85rem', color: notif.lida ? '#c9d1d9' : '#fff' }}>
                                  {notif.titulo}
                                </strong>
                                <span style={{ fontSize: '0.8rem', color: '#8b949e', lineHeight: '1.4' }}>
                          {notif.mensagem}
                        </span>
                                <span style={{ fontSize: '0.65rem', color: '#5a6a7a', marginTop: '2px' }}>
                          {new Date(notif.dataCriacao).toLocaleDateString('pt-BR')} às {new Date(notif.dataCriacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                              </div>
                          ))
                      )}
                    </div>
                  </div>
              )}
            </div>

            {!isGestor && (
                <>
                  <button className="icon-btn" title="Configurações da Assinatura" onClick={() => navigate('/gerenciar-plano')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                    </svg>
                  </button>

                  <button className="icon-btn" title="Atendimento" onClick={() => { setIsAtendimentoOpen(!isAtendimentoOpen); setHasNewMessage(false); }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 18v-6a9 9 0 0118 0v6" />
                      <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
                    </svg>
                    {hasNewMessage && <span className="badge badge-pulse"></span>}
                  </button>
                </>
            )}

            {/* PERFIL (Para todos) */}
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

                    {!isGestor && (
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

        {!isGestor && isSearchOpen && <GlobalSearch onClose={() => setIsSearchOpen(false)} />}

        {!isGestor && (
            <AtendimentoWidget
                isOpen={isAtendimentoOpen}
                onClose={() => setIsAtendimentoOpen(false)}
                userName={user?.nome || 'Usuário'}
            />
        )}
      </>
  );
}