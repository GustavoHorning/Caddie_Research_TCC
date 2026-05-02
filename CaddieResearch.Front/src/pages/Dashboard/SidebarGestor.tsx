import { Link } from 'react-router-dom'
import './Sidebar.css'

interface SidebarGestorProps {
    activePath: string;
    isOpen?: boolean;
    onClose?: () => void;
}

export default function SidebarGestor({ activePath, isOpen = false, onClose }: SidebarGestorProps) {
    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-inner">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">CR</div>
                    <div className="sidebar-logo-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <div>Caddie <span className="sidebar-logo-highlight">Research</span></div>
                        <div className="logo-badge-gestor" style={{ marginLeft: 0 }}>GESTOR</div>
                    </div>
                    {/* Botão de Fechar no Celular */}
                    <button className="sidebar-close-btn" onClick={onClose}>✖</button>
                </div>

                <div className="sidebar-section">
                    <span className="sidebar-section-title">ADMINISTRAÇÃO</span>
                    <ul className="sidebar-menu">
                        <li>
                            <Link
                                to="/gestor"
                                onClick={onClose}
                                className={`sidebar-link ${activePath === '/gestor' ? 'active' : ''}`}
                            >
                                <span className="sidebar-link-icon">📊</span>
                                <span className="sidebar-link-label">Dashboard / Ativos</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/gestor/relatorios"
                                onClick={onClose}
                                className={`sidebar-link ${activePath === '/gestor/relatorios' ? 'active' : ''}`}
                            >
                                <span className="sidebar-link-icon">📄</span>
                                <span className="sidebar-link-label">Relatórios em PDF</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/gestor/clientes"
                                onClick={onClose}
                                className={`sidebar-link ${activePath === '/gestor/clientes' ? 'active' : ''}`}
                            >
                                <span className="sidebar-link-icon">👥</span>
                                <span className="sidebar-link-label">Assinantes</span>
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </aside>
    )
}