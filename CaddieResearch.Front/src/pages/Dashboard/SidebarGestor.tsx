import { Link } from 'react-router-dom'
import './Sidebar.css'

export default function SidebarGestor({ activePath }: { activePath: string }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-inner">

                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">CR</div>

                    <div className="sidebar-logo-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <div>Caddie <span className="sidebar-logo-highlight">Research</span></div>
                        <div className="logo-badge-gestor" style={{ marginLeft: 0 }}>GESTOR</div>
                    </div>
                </div>

                <div className="sidebar-section">
                    <span className="sidebar-section-title">ADMINISTRAÇÃO</span>
                    <ul className="sidebar-menu">
                        <li>
                            <Link
                                to="/gestor"
                                className={`sidebar-link ${activePath === '/gestor' ? 'active' : ''}`}
                            >
                                <span className="sidebar-link-icon">📊</span>
                                <span className="sidebar-link-label">Dashboard / Ativos</span>
                            </Link>
                        </li>

                        <li>
                            <Link
                                to="/gestor/relatorios"
                                className={`sidebar-link ${activePath === '/gestor/relatorios' ? 'active' : ''}`}
                            >
                                <span className="sidebar-link-icon">📄</span>
                                <span className="sidebar-link-label">Relatórios em PDF</span>
                            </Link>
                        </li>

                        <li>
                            <Link
                                to="/gestor/clientes"
                                className={`sidebar-link ${activePath === '/gestor/clientes' ? 'active' : ''}`}
                            >
                                <span className="sidebar-link-icon">👥</span>
                                <span className="sidebar-link-label">Assinantes</span>
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className="sidebar-footer" style={{ padding: '0 0 16px 0', flexDirection: 'column' }}>
                    <ul className="sidebar-menu">
                        <li>
                            <button
                                className="sidebar-link"
                                style={{ background: 'transparent', border: 'none', width: '100%', cursor: 'pointer' }}
                            >
                                <span className="sidebar-link-icon" style={{ color: '#e53935' }}>🚪</span>
                                <span className="sidebar-link-label" style={{ color: '#e53935' }}>Sair do Sistema</span>
                            </button>
                        </li>
                    </ul>
                </div>

            </div>
        </aside>
    )
}