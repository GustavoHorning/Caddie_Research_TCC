import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCarteiras } from '../../../hooks/useCarteiras';
import Sidebar from '../../../components/Sidebar';
import TopBar from '../../../components/TopBar';
import './Carteiras.css';

interface CarteiraVitrineConfig {
    id: number;
    nome: string;
    categoria: 'Renda Variável' | 'Renda Passiva' | 'Internacional' | 'Renda Fixa & Fundos';
    perfil: string;
    horizonte: string;
    accentColor: string;
    teaser: string;
    planoMinimo: 'Basic' | 'Premium' | 'Black';
    iconType: 'dividendos' | 'fiis' | 'global' | 'smallcaps' | 'valor' | 'fundos' | 'rendafixa' | 'reserva';
}

const carteirasVitrine: CarteiraVitrineConfig[] = [
    {
        id: 1,
        nome: 'Dividendos',
        categoria: 'Renda Passiva',
        perfil: 'Moderado',
        horizonte: 'Longo Prazo',
        accentColor: '#10b981',
        teaser: 'Geração de renda passiva recorrente através de empresas maduras, fortes geradoras de caixa e líderes setoriais.',
        planoMinimo: 'Basic',
        iconType: 'dividendos'
    },
    {
        id: 2,
        nome: 'FIIs',
        categoria: 'Renda Passiva',
        perfil: 'Moderado',
        horizonte: 'Médio / Longo',
        accentColor: '#f59e0b',
        teaser: 'Portfólio equilibrado entre fundos de tijolo e papel para recebimento de proventos mensais isentos de IR.',
        planoMinimo: 'Premium',
        iconType: 'fiis'
    },
    {
        id: 3,
        nome: 'Internacional',
        categoria: 'Internacional',
        perfil: 'Arrojado',
        horizonte: 'Longo Prazo',
        accentColor: '#00b4d8',
        teaser: 'Exposição cambial e proteção patrimonial em moeda forte através de BDRs, ETFs e gigantes globais.',
        planoMinimo: 'Black',
        iconType: 'global'
    },
    {
        id: 4,
        nome: 'Small Caps',
        categoria: 'Renda Variável',
        perfil: 'Arrojado',
        horizonte: 'Longo Prazo',
        accentColor: '#8b5cf6',
        teaser: 'Empresas em fase de expansão acelerada com alto potencial de destravamento de valor e multiplicação de capital.',
        planoMinimo: 'Black',
        iconType: 'smallcaps'
    },
    {
        id: 5,
        nome: 'Valor',
        categoria: 'Renda Variável',
        perfil: 'Moderado / Arrojado',
        horizonte: 'Médio / Longo',
        accentColor: '#3b82f6',
        teaser: 'Seleção fundamentalista de companhias negociadas abaixo do seu valor intrínseco com ampla margem de segurança.',
        planoMinimo: 'Black',
        iconType: 'valor'
    },
    {
        id: 6,
        nome: 'Fundos',
        categoria: 'Renda Fixa & Fundos',
        perfil: 'Diversificado',
        horizonte: 'Médio Prazo',
        accentColor: '#06b6d4',
        teaser: 'Curadoria institucional dos melhores gestores independentes de multimercados, ações e crédito privado.',
        planoMinimo: 'Black',
        iconType: 'fundos'
    },
    {
        id: 7,
        nome: 'Renda Fixa',
        categoria: 'Renda Fixa & Fundos',
        perfil: 'Conservador',
        horizonte: 'Curto / Médio',
        accentColor: '#64748b',
        teaser: 'Títulos públicos e privados indexados ao IPCA+, CDI e prefixados para preservação e ganho real acima da inflação.',
        planoMinimo: 'Black',
        iconType: 'rendafixa'
    },
    {
        id: 8,
        nome: 'Reserva de Emergencia',
        categoria: 'Renda Fixa & Fundos',
        perfil: 'Conservador',
        horizonte: 'Liquidez Diária',
        accentColor: '#14b8a6',
        teaser: 'Ativos de baixíssimo risco e resgate imediato (D+0/D+1) para blindagem financeira e oportunidade.',
        planoMinimo: 'Black',
        iconType: 'reserva'
    }
];

function renderizarIconeStrategy(tipo: CarteiraVitrineConfig['iconType']) {
    switch (tipo) {
        case 'dividendos':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
            );
        case 'fiis':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                    <line x1="9" y1="22" x2="9" y2="18" />
                    <line x1="15" y1="22" x2="15" y2="18" />
                    <line x1="8" y1="6" x2="8.01" y2="6" />
                    <line x1="16" y1="6" x2="16.01" y2="6" />
                    <line x1="12" y1="6" x2="12.01" y2="6" />
                    <line x1="12" y1="10" x2="12.01" y2="10" />
                    <line x1="12" y1="14" x2="12.01" y2="14" />
                    <line x1="16" y1="10" x2="16.01" y2="10" />
                    <line x1="8" y1="10" x2="8.01" y2="10" />
                </svg>
            );
        case 'global':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
            );
        case 'smallcaps':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                </svg>
            );
        case 'valor':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                </svg>
            );
        case 'fundos':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
            );
        case 'rendafixa':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
            );
        case 'reserva':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
            );
    }
}

export default function Carteiras() {
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);
    const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas');
    const [busca, setBusca] = useState('');

    const { carteirasAutorizadas, carregando, calcularEstatisticas } = useCarteiras();

    const categorias = ['Todas', 'Renda Passiva', 'Renda Variável', 'Internacional', 'Renda Fixa & Fundos'];

    const carteirasFiltradas = useMemo(() => {
        return carteirasVitrine.filter((item) => {
            const matchCat = filtroCategoria === 'Todas' || item.categoria === filtroCategoria;
            const matchBusca =
                !busca.trim() ||
                item.nome.toLowerCase().includes(busca.toLowerCase()) ||
                item.teaser.toLowerCase().includes(busca.toLowerCase());
            return matchCat && matchBusca;
        });
    }, [filtroCategoria, busca]);

    const resumoGeral = useMemo(() => {
        let liberadas = 0;
        let oportunidadesCompra = 0;

        carteirasVitrine.forEach((v) => {
            const cApi = carteirasAutorizadas.find((c) => c.nome.toLowerCase() === v.nome.toLowerCase());
            const stats = calcularEstatisticas(cApi);
            if (!stats.bloqueada) {
                liberadas++;
                oportunidadesCompra += Number(stats.qtdComprar) || 0;
            }
        });

        return { liberadas, total: carteirasVitrine.length, oportunidadesCompra };
    }, [carteirasAutorizadas, calcularEstatisticas]);

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

            <TopBar onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />

            <main className="dashboard-main">
                <div className="carteiras-page">
                    {/* HEADER EXECUTIVO */}
                    <header className="carteiras-hero">
                        <div className="carteiras-hero-text">
                            <span className="carteiras-kicker">Estratégias & Alocação</span>
                            <h1 className="carteiras-titulo">Carteiras Recomendadas</h1>
                            <p className="carteiras-subtitulo">
                                Portfólios estruturados pela equipe de análise com acompanhamento contínuo de preços-teto, viés de entrada e fundamentos via Brapi PRO.
                            </p>
                        </div>

                        <div className="carteiras-hero-stats">
                            <div className="hero-stat-box">
                                <span className="hero-stat-label">Portfólios Liberados</span>
                                <strong className="hero-stat-value">
                                    {resumoGeral.liberadas} <small>/ {resumoGeral.total}</small>
                                </strong>
                            </div>
                            <div className="hero-stat-divider"></div>
                            <div className="hero-stat-box">
                                <span className="hero-stat-label">Ativos em Compra</span>
                                <strong className="hero-stat-value text-emerald">
                                    {resumoGeral.oportunidadesCompra}
                                </strong>
                            </div>
                        </div>
                    </header>

                    {/* BARRA DE FILTROS E BUSCA */}
                    <div className="carteiras-toolbar">
                        <div className="carteiras-tabs">
                            {categorias.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    className={`carteira-tab-btn ${filtroCategoria === cat ? 'active' : ''}`}
                                    onClick={() => setFiltroCategoria(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="carteiras-search">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Buscar estratégia..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* GRID DE CARTEIRAS */}
                    <div className="carteiras-grid">
                        {carregando ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={`skeleton-${i}`} className="carteira-card skeleton-card">
                                    <div className="sk-line sk-w40"></div>
                                    <div className="sk-line sk-w70 sk-lg"></div>
                                    <div className="sk-line sk-w100"></div>
                                    <div className="sk-line sk-w90"></div>
                                    <div className="sk-footer-block"></div>
                                </div>
                            ))
                        ) : (
                            carteirasFiltradas.map((vitrine) => {
                                const carteiraAPI = carteirasAutorizadas.find(
                                    (c) => c.nome.toLowerCase() === vitrine.nome.toLowerCase()
                                );

                                const { bloqueada, qtdComprar, qtdAguardar, indiceConviccao } =
                                    calcularEstatisticas(carteiraAPI);

                                const conviccaoNum = parseInt(String(indiceConviccao).replace(/\D/g, ''), 10) || 0;
                                const ativosPreview = (carteiraAPI as any)?.ativos?.slice(0, 4) || [];

                                return (
                                    <Link
                                        key={vitrine.id}
                                        id={`carteira_${vitrine.id}`}
                                        className={`carteira-card ${bloqueada ? 'is-locked' : 'is-unlocked'}`}
                                        to={bloqueada ? '/gerenciar-plano' : `/carteiras/${carteiraAPI?.id}`}
                                    >
                                        {/* TOPO DO CARD */}
                                        <div className="carteira-card-top">
                                            <div
                                                className="carteira-icon-box"
                                                style={{
                                                    backgroundColor: `${vitrine.accentColor}18`,
                                                    color: vitrine.accentColor
                                                }}
                                            >
                                                {renderizarIconeStrategy(vitrine.iconType)}
                                            </div>

                                            <div className="carteira-badges">
                                                <span className="badge-categoria">{vitrine.categoria}</span>
                                                <span className={`badge-tier tier-${vitrine.planoMinimo.toLowerCase()}`}>
                                                    {vitrine.planoMinimo}
                                                </span>
                                            </div>
                                        </div>

                                        {/* TÍTULO E TESE */}
                                        <div className="carteira-card-body">
                                            <div className="carteira-title-row">
                                                <h3 className="carteira-nome">{vitrine.nome}</h3>
                                                <span className="carteira-arrow">↗</span>
                                            </div>
                                            <p className="carteira-teaser">{vitrine.teaser}</p>

                                            <div className="carteira-meta-tags">
                                                <span>Perfil: <strong>{vitrine.perfil}</strong></span>
                                                <span>•</span>
                                                <span>Horizonte: <strong>{vitrine.horizonte}</strong></span>
                                            </div>
                                        </div>

                                        {/* SE DESBLOQUEADA: MOSTRA MÉTRICAS E PREVIEW DE TICKERS */}
                                        {!bloqueada ? (
                                            <div className="carteira-metrics-section">
                                                <div className="conviccao-box">
                                                    <div className="conviccao-header">
                                                        <span className="conviccao-label">Índice de Convicção</span>
                                                        <strong className="conviccao-numero">{indiceConviccao}</strong>
                                                    </div>
                                                    <div className="conviccao-track">
                                                        <div
                                                            className="conviccao-fill"
                                                            style={{
                                                                width: `${Math.min(conviccaoNum, 100)}%`,
                                                                backgroundColor: vitrine.accentColor
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {ativosPreview.length > 0 && (
                                                    <div className="tickers-preview-row">
                                                        {ativosPreview.map((at: any, idx: number) => (
                                                            <span key={idx} className="ticker-mini-pill">
                                                                {at.ticker}
                                                            </span>
                                                        ))}
                                                        {(carteiraAPI as any)?.ativos?.length > 4 && (
                                                            <span className="ticker-mini-more">
                                                                +{(carteiraAPI as any).ativos.length - 4}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="carteira-card-footer">
                                                    <div className="stat-pill stat-buy">
                                                        <span className="stat-dot"></span>
                                                        <span>Comprar: <strong>{qtdComprar}</strong></span>
                                                    </div>
                                                    <div className="stat-pill stat-wait">
                                                        <span className="stat-dot"></span>
                                                        <span>Aguardar: <strong>{qtdAguardar}</strong></span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* SE BLOQUEADA: FOOTER DE UPGRADE ELEGANTE (SEM BORRÃO FEIO) */
                                            <div className="carteira-locked-footer">
                                                <div className="locked-info">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                    </svg>
                                                    <span>Disponível no plano <strong>{vitrine.planoMinimo}</strong></span>
                                                </div>
                                                <span className="locked-cta">Desbloquear →</span>
                                            </div>
                                        )}
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}