import './TopBar.css'

interface TopBarProps {
  userName?: string
  onMenuToggle?: () => void
}

export default function TopBar({ userName = 'Usuário', onMenuToggle }: TopBarProps) {
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
      </div>
    </header>
  )
}