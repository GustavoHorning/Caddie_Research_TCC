import './DashboardLayout.css'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import DashboardHome from './DashboardHome'

export default function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar activePath="/home" />
      <TopBar userName="Usuário" />
      <main className="dashboard-main">
        <DashboardHome />
      </main>
    </div>
  )
}