import { useState } from 'react';
import SidebarGestor from '../../../components/SidebarGestor';
import TopBar from '../../../components/TopBar';
import ForumTopico from './ForumTopico';
import '../../../components/DashboardLayout.css';

export default function ForumTopicoGestor() {
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);

    return (
        <div className="dashboard-layout">
            <SidebarGestor activePath="/gestor/forum" isOpen={menuMobileAberto} onClose={() => setMenuMobileAberto(false)} />
            {menuMobileAberto && <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>}
            <TopBar userName="Gestor" onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />
            <main className="dashboard-main">
                <ForumTopico voltarPara="/gestor/forum" voltarRotulo="Chamados do fórum" />
            </main>
        </div>
    );
}
