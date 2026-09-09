import { useState } from 'react'
import './Sidebar.css'

const menuResearch = [
    {
        label: 'Home',
        path: '/home',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" />
            </svg>
        ),
    },
    {
        label: 'Relatorios',
        path: '/relatorios',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="16" y2="17" />
            </svg>
        ),
    },
    {
        label: 'Carteiras',
        path: '/carteiras',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v9l6 3" />
            </svg>
        ),
    },
    {
        label: 'Watchlist',
        path: '/watchlist',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ),
    },
    {
        label: 'Calendário',
        path: '/calendario',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
    },
    {
        label: 'Morning Call',
        path: '/morning-call',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8h1a4 4 0 010 8h-1" />
                <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
        ),
    },
    {
        label: 'Portfolio',
        path: '/portfolio',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
        ),
    }
]

interface SidebarProps {
    activePath?: string
    isOpen?: boolean
    onClose?: () => void
}

export default function Sidebar({ activePath = '/home', isOpen = false, onClose }: SidebarProps) {
    const [darkMode, setDarkMode] = useState(true)

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-inner">
                <div className="sidebar-logo">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="sidebar-logo-icon">C</span>
                        <span className="sidebar-logo-text">
              Caddie <span className="sidebar-logo-highlight">Research</span>
            </span>
                    </div>
                    <button className="sidebar-close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="sidebar-section">
                    <span className="sidebar-section-title">RESEARCH</span>
                    <ul className="sidebar-menu">
                        {menuResearch.map((item) => {
                            const isActive = activePath === item.path
                            return (
                                <li key={item.path}>
                                    <a href={item.path} onClick={onClose} className={'sidebar-link' + (isActive ? ' active' : '')}>
                                        <span className="sidebar-link-icon">{item.icon}</span>
                                        <span className="sidebar-link-label">{item.label}</span>
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                </div>

                <div className="sidebar-footer">
                    <div className="sidebar-theme-toggle" onClick={() => setDarkMode(!darkMode)}>
                        <span className={'theme-option' + (darkMode ? ' active' : '')}>🌙</span>
                        <span className={'theme-option' + (!darkMode ? ' active' : '')}>☀️</span>
                    </div>
                </div>
            </div>
        </aside>
    )
}