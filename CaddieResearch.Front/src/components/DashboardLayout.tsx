import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import './DashboardLayout.css'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import DashboardHome from '../pages/Dashboard/DashboardHome'

interface DashboardLayoutProps {
  children?: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [menuMobileAberto, setMenuMobileAberto] = useState(false)
  const location = useLocation()

  return (
    <div className="dashboard-layout">
      <Sidebar
        activePath={location.pathname}
        isOpen={menuMobileAberto}
        onClose={() => setMenuMobileAberto(false)}
      />

      {menuMobileAberto && (
        <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>
      )}

      <TopBar
        userName="Usuário"
        onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)}
      />

      <main className="dashboard-main">
        {children ?? <DashboardHome />}
      </main>
    </div>
  )
}