import React, { useState, useEffect } from "react";
import axios from "axios";
import "./TopBar.css";
import { useMsal } from "@azure/msal-react";
import { googleLogout } from "@react-oauth/google";

interface UserProfile {
  nome: string;
  email: string;
  tipoPerfil: string;
}

export default function TopBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const { instance, accounts } = useMsal();

  useEffect(() => {
    const carregarPerfil = async () => {
      try {
        const token = localStorage.getItem('caddie_token');
        const response = await axios.get('http://localhost:5194/api/usuario/meu-perfil', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      }
    };

    carregarPerfil();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('caddie_token');
    
    if (accounts.length > 0) {
      instance.logoutRedirect();
    } else {
      googleLogout();
      window.location.href = "/login";
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" placeholder="Buscar ativos, relatórios..." />
      </div>

      <div className="topbar-actions">
        <button className="icon-btn" title="Notificações">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className="badge"></span>
        </button>

        <div className="user-profile" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
          <div className="user-info">
            <span className="user-name">{user?.nome || "Carregando..."}</span>
            {/* Exibe o selo do plano real vindo do banco */}
            <span className={`user-plan plan-${user?.tipoPerfil?.toLowerCase() || 'free'}`}>
              {user?.tipoPerfil || "Free"}
            </span>
          </div>
          <div className="avatar">
            <div className="avatar-placeholder">
              {user?.nome?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>

          {isDropdownOpen && (
            <div className="dropdown-menu">
              <a href="/home/perfil" className="dropdown-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Meu Perfil
              </a>
              <a href="/gerenciar-plano" className="dropdown-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                Assinatura
              </a>
              <div className="dropdown-divider"></div>
              <button onClick={handleLogout} className="dropdown-item logout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}