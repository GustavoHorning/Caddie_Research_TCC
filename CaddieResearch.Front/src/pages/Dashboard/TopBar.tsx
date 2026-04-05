import './TopBar.css'

interface TopBarProps {
  userName?: string
}

export default function TopBar({ userName = 'Usuário' }: TopBarProps) {
  return (
    <header className="topbar">
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