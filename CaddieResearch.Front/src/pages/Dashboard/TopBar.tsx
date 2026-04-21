import React, { useState, useRef, useEffect } from 'react'
import './TopBar.css'
import { useMsal } from '@azure/msal-react'
import { googleLogout } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'

interface TopBarProps {
  userName?: string
  userPlan?: 'Basic' | 'Premium' | 'Black' | null
  onMenuToggle?: () => void
}

const planConfig = {
  Basic:   { label: 'Basic',   color: '#00B4D8', bg: 'rgba(0,180,216,0.15)',   icon: '📊' },
  Premium: { label: 'Premium', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  icon: '⭐' },
  Black:   { label: 'Black',   color: '#A78BFA', bg: 'rgba(167,139,250,0.15)', icon: '💎' },
}

export default function TopBar({ userName = 'Usuário', userPlan = 'Basic', onMenuToggle }: TopBarProps) {
  const { instance, accounts } = useMsal()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const plano = userPlan ? planConfig[userPlan] : null

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('caddie_token')
    googleLogout()
    sessionStorage.clear()
    window.location.replace('/')
  }

  return (
    <header className="topbar">
      <div className="topbar-left-group">
        <button className="mobile-menu-toggle" onClick={onMenuToggle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="topbar-search">
          <span className="topbar-search-icon">🔍</span>
          <input type="text" className="topbar-search-input" placeholder="Pesquise por empresa ou ticker..." />
          <div className="topbar-search-filter">
            <span className="topbar-radio" />
            Somente relatórios
          </div>
        </div>
      </div>

      <div className="topbar-actions">
        <button className="topbar-btn-icon" title="Configurações">⚙️</button>
        <button className="topbar-btn-icon topbar-notif" title="Notificações">
          🔔
          <span className="topbar-notif-badge">1</span>
        </button>

        <div className="topbar-profile-wrapper" ref={menuRef}>
          <button className="topbar-avatar" title={userName} onClick={() => setMenuAberto(v => !v)}>
            {userName.charAt(0).toUpperCase()}
          </button>

          {menuAberto && (
            <div className="topbar-dropdown">
              <div className="topbar-dropdown-header">
                <div className="topbar-dropdown-avatar">{userName.charAt(0).toUpperCase()}</div>
                <div>
                  <p className="topbar-dropdown-nome">{userName}</p>
                  {plano && (
                    <span className="topbar-plano-badge" style={{ color: plano.color, background: plano.bg }}>
                      {plano.icon} {plano.label}
                    </span>
                  )}
                </div>
              </div>

              <div className="topbar-dropdown-divider" />

              <button className="topbar-dropdown-item" onClick={() => { navigate('/minha-conta'); setMenuAberto(false) }}>
                <span className="topbar-dropdown-item-icon">👤</span>
                Minha conta
              </button>

              <button className="topbar-dropdown-item" onClick={() => { navigate('/gerenciar-plano'); setMenuAberto(false) }}>
                <span className="topbar-dropdown-item-icon">💳</span>
                Gerenciar plano
              </button>

              <div className="topbar-dropdown-divider" />

              <button className="topbar-dropdown-item topbar-dropdown-item-logout" onClick={handleLogout}>
                <span className="topbar-dropdown-item-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </span>
                Sair da conta
              </button>
            </div>
          )}
        </div>

        <button className="topbar-btn-icon topbar-logout" title="Sair do Sistema" onClick={handleLogout}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </header>
  )
}