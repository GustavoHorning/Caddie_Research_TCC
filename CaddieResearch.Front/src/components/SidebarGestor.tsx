import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Sidebar.css'

interface SidebarGestorProps {
    activePath: string
    isOpen?: boolean
    onClose?: () => void
}

const menuGestor = [
    {
        label: 'Mesa de Carteiras',
        path: '/gestor',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
        )
    },
    {
        label: 'Relatórios em PDF',
        path: '/gestor/relatorios',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        )
    },
    {
        label: 'Auditoria de Ativos',
        path: '/auditoria',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
            </svg>
        )
    },
    {
        label: 'Publicar Morning Call',
        path: '/gestor/morning-call',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
        )
    },
    {
        label: 'Acervo Morning Call',
        path: '/gestor/morning-call/gerenciar',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
        )
    },
    {
        label: 'Agenda & Eventos',
        path: '/gestor/agenda',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        )
    },
    {
        label: 'Fórum — Chamados',
        path: '/gestor/forum',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        )
    },
    {
        label: 'Atendimento Direto',
        path: '/gestor/atendimento',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        )
    }
]

export default function SidebarGestor({ activePath, isOpen = false, onClose }: SidebarGestorProps) {
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('caddie_tema') !== 'light')

    useEffect(() => {
        const sincronizarTema = () => {
            setDarkMode(localStorage.getItem('caddie_tema') !== 'light')
        }
        window.addEventListener('temaAtualizado', sincronizarTema)
        return () => window.removeEventListener('temaAtualizado', sincronizarTema)
    }, [])

    const alternarTemaSidebar = () => {
        const novoTema = darkMode ? 'light' : 'dark'
        localStorage.setItem('caddie_tema', novoTema)
        document.documentElement.setAttribute('data-theme', novoTema)
        setDarkMode(!darkMode)
        window.dispatchEvent(new Event('temaAtualizado'))
    }

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-inner">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">CR</div>
                    <div className="sidebar-logo-text">
                        <div>
                            Caddie <span className="sidebar-logo-highlight">Research</span>
                        </div>
                        <span className="logo-badge-gestor">BACKOFFICE</span>
                    </div>
                    <button className="sidebar-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="sidebar-section">
                    <span className="sidebar-section-title">GESTÃO & RESEARCH</span>
                    <ul className="sidebar-menu">
                        {menuGestor.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    onClick={onClose}
                                    className={`sidebar-link ${activePath === item.path ? 'active' : ''}`}
                                >
                                    <span className="sidebar-link-icon">{item.icon}</span>
                                    <span className="sidebar-link-label">{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="sidebar-footer">
                    <div className="sidebar-theme-toggle" onClick={alternarTemaSidebar} title="Alternar Tema">
            <span className={'theme-option' + (darkMode ? ' active' : '')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </span>
                        <span className={'theme-option' + (!darkMode ? ' active' : '')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
              </svg>
            </span>
                    </div>
                </div>
            </div>
        </aside>
    )
}