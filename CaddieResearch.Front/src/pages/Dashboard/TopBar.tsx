import './TopBar.css'
import { useMsal } from '@azure/msal-react'
import { googleLogout } from '@react-oauth/google'

interface TopBarProps {
  userName?: string
  onMenuToggle?: () => void
}

export default function TopBar({ userName = 'Usuário', onMenuToggle }: TopBarProps) {

  const { instance, accounts } = useMsal()

  const handleLogout = () => {
    localStorage.removeItem('caddie_token');

    googleLogout();

    sessionStorage.clear();

    window.location.replace('/');
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
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Pesquise por empresa ou ticker..."
          />
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
        <div className="topbar-avatar" title={userName}>
          {userName.charAt(0).toUpperCase()}
        </div>

        <button
            className="topbar-btn-icon topbar-logout"
            title="Sair do Sistema"
            onClick={handleLogout}
        >
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