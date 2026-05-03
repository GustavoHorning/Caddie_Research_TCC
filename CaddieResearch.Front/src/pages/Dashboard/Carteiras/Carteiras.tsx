import { useState, useEffect } from 'react'
import './Carteiras.css'
import Sidebar from '../Sidebar'
import TopBar from '../TopBar'
import api from '../../../services/api';
import { Link } from 'react-router-dom';

const carteirasVitrine = [
    { nome: 'Dividendos', iconeCor: '#4caf50', icone: '💸' },
    { nome: 'FIIs', iconeCor: '#ff9800', icone: '🏢' },
    { nome: 'Internacional', iconeCor: '#2196f3', icone: '🌎' },
    { nome: 'Small Caps', iconeCor: '#9c27b0', icone: '🚀' },
    { nome: 'Valor', iconeCor: '#f44336', icone: '📈' },
    { nome: 'Fundos', iconeCor: '#00bcd4', icone: '💼' },
    { nome: 'Renda Fixa', iconeCor: '#607d8b', icone: '🛡️' },
    { nome: 'Reserva de Emergencia', iconeCor: '#e91e63', icone: '🐷' }
];

export default function Carteiras() {
    const [menuMobileAberto, setMenuMobileAberto] = useState(false)
    const [carteirasAutorizadas, setCarteirasAutorizadas] = useState<any[]>([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        api.get('/carteiras')
            .then((response) => {
                setCarteirasAutorizadas(response.data);
                setCarregando(false);
            })
            .catch((error) => {
                console.error("Erro ao buscar carteiras:", error);
                setCarregando(false);
            });
    }, []);

    return (
        <div className="dashboard-layout">
            <Sidebar
                activePath="/carteiras"
                isOpen={menuMobileAberto}
                onClose={() => setMenuMobileAberto(false)}
            />

            {menuMobileAberto && (
                <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>
            )}

            <TopBar
                onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)}
            />

            <main className="dashboard-main">
                <div className="carteiras-content">
                    <h1 className="carteiras-titulo">Carteiras disponíveis</h1>
                    <div className="carteiras-grid">

                        {carregando ? (
                            carteirasVitrine.map((_, i) => (
                                <div key={`skeleton-${i}`} className="carteira-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px', borderRadius: '12px', background: '#1e1e1e', border: '1px solid #333' }}>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                        <div className="skeleton skeleton-circular" style={{ width: '48px', height: '48px' }}></div>
                                        <div className="skeleton skeleton-text" style={{ width: '120px', height: '24px' }}></div>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <div className="skeleton skeleton-text" style={{ width: '140px', height: '14px', marginBottom: '12px' }}></div>
                                        <div className="skeleton skeleton-text" style={{ width: '90px', height: '36px' }}></div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333', paddingTop: '15px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div className="skeleton skeleton-text" style={{ width: '50px', height: '12px' }}></div>
                                            <div className="skeleton skeleton-text" style={{ width: '60px', height: '16px' }}></div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                                            <div className="skeleton skeleton-text" style={{ width: '50px', height: '12px' }}></div>
                                            <div className="skeleton skeleton-text" style={{ width: '60px', height: '16px' }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            carteirasVitrine.map((vitrine, i) => {
                                const carteiraAPI = carteirasAutorizadas.find(
                                    c => c.nome.toLowerCase() === vitrine.nome.toLowerCase()
                                );
                                const bloqueada = !carteiraAPI;

                                let qtdComprar: string | number = bloqueada ? '?' : 0;
                                let qtdAguardar: string | number = bloqueada ? '?' : 0;
                                let rentabilidade = bloqueada ? '??,??%' : "0,00%";

                                if (carteiraAPI) {
                                    if (carteiraAPI.rentabilidade) {
                                        rentabilidade = carteiraAPI.rentabilidade;
                                    }

                                    if (carteiraAPI.ativos) {
                                        qtdComprar = carteiraAPI.ativos.filter((a: any) => a.vies === 'Comprar').length;
                                        qtdAguardar = carteiraAPI.ativos.filter((a: any) => a.vies === 'Aguardar').length;
                                    }
                                }

                                return (
                                    <Link
                                        key={i}
                                        className={`carteira-card ${bloqueada ? 'carteira-bloqueada' : ''}`}
                                        to={bloqueada ? '/gerenciar-plano' : `/carteiras/${carteiraAPI?.id}`}
                                        style={{ textDecoration: 'none', color: 'inherit', position: 'relative', display: 'flex', flexDirection: 'column', padding: '20px', borderRadius: '12px', background: '#1e1e1e', border: '1px solid #333', overflow: 'hidden' }}
                                    >
                                        {bloqueada && (
                                            <div className="overlay-cadeado" style={{
                                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                                                flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10
                                            }}>
                                                <span style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔒</span>
                                                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>Desbloquear Acesso</span>
                                                <span style={{ color: '#00B4D8', fontSize: '0.8rem', marginTop: '4px', fontWeight: '600' }}>Exclusivo para assinantes</span>
                                            </div>
                                        )}

                                        <div style={{ filter: bloqueada ? 'blur(4px) grayscale(60%)' : 'none', opacity: bloqueada ? 0.4 : 1, transition: 'all 0.3s ease', pointerEvents: bloqueada ? 'none' : 'auto' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                                <div style={{
                                                    backgroundColor: vitrine.iconeCor + '20',
                                                    color: vitrine.iconeCor, padding: '12px', borderRadius: '8px',
                                                    fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {vitrine.icone}
                                                </div>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{vitrine.nome}</h3>
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '20px' }}>
                                                <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Rentabilidade Histórica</span>
                                                <h2 style={{ margin: '5px 0 0 0', color: bloqueada ? '#888' : '#4caf50', fontSize: '1.8rem' }}>+{rentabilidade}</h2>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333', paddingTop: '15px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ color: '#aaa', fontSize: '0.8rem' }}>Comprar</span>
                                                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{qtdComprar} ativos</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                                                    <span style={{ color: '#aaa', fontSize: '0.8rem' }}>Aguardar</span>
                                                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{qtdAguardar} ativos</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}