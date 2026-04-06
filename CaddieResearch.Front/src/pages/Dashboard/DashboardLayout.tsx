import { useState } from 'react'
import './DashboardLayout.css'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import DashboardHome from './DashboardHome'

export default function DashboardLayout() {
  const [menuMobileAberto, setMenuMobileAberto] = useState(false)

  return (
    <div className="dashboard-layout">
      <Sidebar 
        activePath="/home" 
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
        <DashboardHome />
      </main>
    </div>
  )
}