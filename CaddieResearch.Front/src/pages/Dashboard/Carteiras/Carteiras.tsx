import { useState, useEffect } from 'react'
import './Carteiras.css'
import Sidebar from '../Sidebar'
import TopBar from '../TopBar'
import api from '../../../services/api';
import { Link } from 'react-router-dom';

const carteirasVitrine = [
    { nome: 'Dividendos', iconeCor: '#4caf50', icone: '💸', teaser: 'Gere renda passiva recorrente com as melhores pagadoras.', planoMinimo: 'Basic' },
    { nome: 'FIIs', iconeCor: '#ff9800', icone: '🏢', teaser: 'Receba aluguéis mensais isentos de imposto de renda.', planoMinimo: 'Premium' },
    { nome: 'Internacional', iconeCor: '#2196f3', icone: '🌎', teaser: 'Proteja seu patrimônio em dólar com gigantes globais.', planoMinimo: 'Black' },
    { nome: 'Small Caps', iconeCor: '#9c27b0', icone: '🚀', teaser: 'Descubra empresas com altíssimo potencial de multiplicação.', planoMinimo: 'Black' },
    { nome: 'Valor', iconeCor: '#f44336', icone: '📈', teaser: 'Ações descontadas com forte potencial de valorização.', planoMinimo: 'Black' },
    { nome: 'Fundos', iconeCor: '#00bcd4', icone: '💼', teaser: 'Acesso aos melhores gestores do mercado.', planoMinimo: 'Black' },
    { nome: 'Renda Fixa', iconeCor: '#607d8b', icone: '🛡️', teaser: 'Segurança e previsibilidade para seu patrimônio.', planoMinimo: 'Black' },
    { nome: 'Reserva de Emergencia', iconeCor: '#e91e63', icone: '🐷', teaser: 'Liquidez diária para imprevistos do dia a dia.', planoMinimo: 'Black' }
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
                                <div key={`skeleton-${i}`} className="carteira-card">
                                    <div className="carteira-header">
                                        <div className="skeleton skeleton-circular" style={{ width: '48px', height: '48px' }}></div>
                                        <div className="skeleton skeleton-text" style={{ width: '120px', height: '24px' }}></div>
                                    </div>
                                    <div className="carteira-rentabilidade">
                                        <div className="skeleton skeleton-text" style={{ width: '140px', height: '14px', marginBottom: '12px' }}></div>
                                        <div className="skeleton skeleton-text" style={{ width: '90px', height: '36px' }}></div>
                                    </div>
                                    <div className="carteira-footer">
                                        <div className="carteira-stat">
                                            <div className="skeleton skeleton-text" style={{ width: '50px', height: '12px', marginBottom: '8px' }}></div>
                                            <div className="skeleton skeleton-text" style={{ width: '60px', height: '16px' }}></div>
                                        </div>
                                        <div className="carteira-stat right">
                                            <div className="skeleton skeleton-text" style={{ width: '50px', height: '12px', marginBottom: '8px' }}></div>
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
                                let totalAtivos: number = 0;
                                let indiceConviccao = bloqueada ? '??%' : "0%";

                                if (carteiraAPI && carteiraAPI.ativos) {
                                    const ativos = carteiraAPI.ativos;
                                    totalAtivos = ativos.length;
                                    qtdComprar = ativos.filter((a: any) => a.vies === 'Comprar').length;
                                    qtdAguardar = ativos.filter((a: any) => a.vies === 'Aguardar').length;

                                    if (totalAtivos > 0) {
                                        indiceConviccao = `${Math.round((Number(qtdComprar) / totalAtivos) * 100)}%`;
                                    }
                                }

                                return (
                                    <Link
                                        key={i}
                                        className={`carteira-card ${bloqueada ? 'carteira-bloqueada' : ''}`}
                                        to={bloqueada ? '/gerenciar-plano' : `/carteiras/${carteiraAPI?.id}`}
                                    >
                                        {bloqueada && (
                                            <div className="overlay-cadeado">
                                                <span className={`premium-badge badge-${vitrine.planoMinimo.toLowerCase()}`}>
                                                    Exclusivo {vitrine.planoMinimo}
                                                </span>
                                                <h4>{vitrine.nome}</h4>
                                                <p>{vitrine.teaser}</p>
                                            </div>
                                        )}

                                        <div className={bloqueada ? 'conteudo-bloqueado' : ''}>
                                            <div className="carteira-header">
                                                <div className="carteira-icon-wrap" style={{ backgroundColor: vitrine.iconeCor + '20', color: vitrine.iconeCor }}>
                                                    {vitrine.icone}
                                                </div>
                                                <h3 className="carteira-nome">{vitrine.nome}</h3>
                                            </div>

                                            <div className="carteira-rentabilidade">
                                                <span className="carteira-label">Índice de Convicção</span>
                                                <h2 className="carteira-valor" style={{ color: bloqueada ? '#8b949e' : '#00B4D8' }}>
                                                    {indiceConviccao}
                                                </h2>
                                            </div>

                                            <div className="carteira-footer">
                                                <div className="carteira-stat">
                                                    <span className="carteira-label">Comprar</span>
                                                    <span className="carteira-stat-valor">{qtdComprar} ativos</span>
                                                </div>
                                                <div className="carteira-stat right">
                                                    <span className="carteira-label">Aguardar</span>
                                                    <span className="carteira-stat-valor">{qtdAguardar} ativos</span>
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