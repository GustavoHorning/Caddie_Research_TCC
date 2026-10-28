import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import './CarteiraDetalhes.css';
import CardAtivo from '../components/CardAtivo';
import CardInternacional from '../components/CardInternacional';
import CardRendaFixa from '../components/CardRendaFixa';
import ModalHistoricoCarteira from '../components/ModalHistoricoCarteira';

interface BrapiQuote {
    regularMarketPrice: number;
    regularMarketChangePercent: number;
    shortName?: string;
    longName?: string;
    logourl?: string;
    regularMarketDayHigh?: number;
    regularMarketDayLow?: number;
    priceEarnings?: number;
    dividendYield?: number;
}

export default function CarteiraDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [carteira, setCarteira] = useState<any>(null);
    const [carregando, setCarregando] = useState(true);
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);

    const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
    const [tickerFocoModal, setTickerFocoModal] = useState<string>('Todos');

    const [taxasMacro, setTaxasMacro] = useState({ selic: '---', cdi: '---' });

    // Estados Brapi PRO + Ferramentas Institucionais
    const [cotacoesBrapi, setCotacoesBrapi] = useState<Record<string, BrapiQuote>>({});
    const [carregandoBrapi, setCarregandoBrapi] = useState(false);
    const [favoritosSet, setFavoritosSet] = useState<Record<string, boolean>>({});
    const [modoVisao, setModoVisao] = useState<'tabela' | 'cards'>('tabela');
    const [filtroVies, setFiltroVies] = useState<'Todos' | 'Comprar' | 'Aguardar' | 'Vender'>('Todos');
    const [buscaAtivo, setBuscaAtivo] = useState('');

    // Simulador de Aporte Inteligente
    const [simuladorAberto, setSimuladorAberto] = useState(false);
    const [valorAporte, setValorAporte] = useState<string>('10000');

    const abrirHistoricoCarteira = () => {
        setTickerFocoModal('Todos');
        setModalHistoricoAberto(true);
    };

    const abrirHistoricoAtivo = (ticker: string) => {
        setTickerFocoModal(ticker);
        setModalHistoricoAberto(true);
    };

    useEffect(() => {
        const token = localStorage.getItem('caddie_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        setCarregando(true);
        api.get(`/api/carteiras/${id}`, { headers })
            .then((response) => {
                const data = response.data;
                setCarteira(data);
                setCarregando(false);

                const rfOuFundo = [6, 7, 8].includes(data?.id);
                if (data?.ativos?.length > 0 && !rfOuFundo) {
                    carregarCotacoesBrapiPro(data.ativos, headers);
                }
            })
            .catch((error) => {
                if (error.response && (error.response.status === 403 || error.response.status === 401)) {
                    navigate('/gerenciar-plano');
                    return;
                }
                console.error('Erro ao buscar detalhes:', error);
                setCarregando(false);
            });

        // Carrega favoritos atuais para sincronizar estrelas da tabela
        api.get('/api/favoritos', { headers })
            .then((res) => {
                if (Array.isArray(res.data)) {
                    const mapa: Record<string, boolean> = {};
                    res.data.forEach((f: any) => {
                        if (f.ticker) mapa[f.ticker] = true;
                    });
                    setFavoritosSet(mapa);
                }
            })
            .catch(() => {});

        if (['6', '7', '8'].includes(id || '')) {
            api.get('/api/indicadores/macro')
                .then((res) => setTaxasMacro(res.data))
                .catch((err) => console.error('Erro ao buscar indicadores macro', err));
        }
    }, [id, navigate]);

    async function carregarCotacoesBrapiPro(listaAtivos: any[], headers: any) {
        setCarregandoBrapi(true);
        const mapaCotacoes: Record<string, BrapiQuote> = {};

        await Promise.allSettled(
            listaAtivos.map(async (at) => {
                try {
                    const res = await api.get(`/api/acoes/cotacao/${at.ticker}`, { headers });
                    if (res.data) {
                        mapaCotacoes[at.ticker] = res.data;
                    }
                } catch {
                    // Silencioso caso um ticker específico falhe
                }
            })
        );

        setCotacoesBrapi(mapaCotacoes);
        setCarregandoBrapi(false);
    }

    async function alternarFavorito(e: React.MouseEvent, ativo: any) {
        e.stopPropagation();
        const token = localStorage.getItem('caddie_token');
        const headers = { Authorization: `Bearer ${token}` };
        const jaFavorito = !!favoritosSet[ativo.ticker];

        try {
            if (jaFavorito) {
                await api.delete(`/api/favoritos/${ativo.ticker}`, { headers });
                setFavoritosSet((prev) => {
                    const copia = { ...prev };
                    delete copia[ativo.ticker];
                    return copia;
                });
            } else {
                await api.post(
                    '/api/favoritos',
                    {
                        ticker: ativo.ticker,
                        nomeEmpresa: cotacoesBrapi[ativo.ticker]?.shortName || ativo.nomeEmpresa,
                        categoria: ativo.categoria || carteira?.nome,
                        rentabilidade: ativo.rentabilidade,
                        nomeCarteira: carteira?.nome
                    },
                    { headers }
                );
                setFavoritosSet((prev) => ({ ...prev, [ativo.ticker]: true }));
            }
        } catch (err) {
            console.error('Erro ao atualizar favorito', err);
        }
    }

    useEffect(() => {
        if (carregando || !carteira || !carteira.ativos) return;

        const params = new URLSearchParams(location.search);
        const highlightId = params.get('highlight');

        if (highlightId) {
            setTimeout(() => {
                const element = document.getElementById(`ativo-${highlightId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('highlight-pulse');
                    window.history.replaceState(null, '', location.pathname);
                    setTimeout(() => element.classList.remove('highlight-pulse'), 2500);
                }
            }, 300);
        }
    }, [location.search, carregando, carteira, modoVisao]);

    const ativos: any[] = carteira?.ativos || [];
    const totalAtivos = ativos.length;
    const qtdComprar = ativos.filter((a: any) => a.vies === 'Comprar').length;
    const qtdAguardar = ativos.filter((a: any) => a.vies === 'Aguardar').length;
    const qtdVender = ativos.filter((a: any) => a.vies === 'Vender').length;

    const isInternacional = carteira?.id === 3;
    const isRendaFixaOuFundo = [6, 7, 8].includes(carteira?.id);
    const indiceConviccao = totalAtivos > 0 ? Math.round((qtdComprar / totalAtivos) * 100) : 0;
    const pesoIdeal = totalAtivos > 0 ? (100 / totalAtivos).toFixed(1) : '0';

    // Estatísticas em Tempo Real da Carteira via Brapi PRO
    const metricasTempoReal = useMemo(() => {
        const cots = Object.values(cotacoesBrapi);
        const variacaoMediaDia =
            cots.length > 0
                ? cots.reduce((acc, c) => acc + (c.regularMarketChangePercent || 0), 0) / cots.length
                : null;

        let somaUpside = 0;
        let contUpside = 0;

        ativos.forEach((at) => {
            const precoAtual = cotacoesBrapi[at.ticker]?.regularMarketPrice;
            if (precoAtual && at.precoTeto && precoAtual > 0) {
                const up = ((at.precoTeto - precoAtual) / precoAtual) * 100;
                somaUpside += up;
                contUpside++;
            }
        });

        const upsideMedio = contUpside > 0 ? somaUpside / contUpside : null;
        return { variacaoMediaDia, upsideMedio };
    }, [cotacoesBrapi, ativos]);

    const ativosFiltrados = useMemo(() => {
        return ativos.filter((at) => {
            const matchVies = filtroVies === 'Todos' || at.vies === filtroVies;
            const termo = buscaAtivo.toLowerCase();
            const nomeBrapi = cotacoesBrapi[at.ticker]?.shortName?.toLowerCase() || '';
            const matchBusca =
                !termo ||
                at.ticker?.toLowerCase().includes(termo) ||
                at.nomeEmpresa?.toLowerCase().includes(termo) ||
                nomeBrapi.includes(termo);
            return matchVies && matchBusca;
        });
    }, [ativos, filtroVies, buscaAtivo, cotacoesBrapi]);

    const aporteNumerico = parseFloat(valorAporte.replace(/\./g, '').replace(',', '.')) || 0;
    const ativosElegiveisAporte = qtdComprar > 0 ? qtdComprar : totalAtivos;
    const aportePorAtivo = ativosElegiveisAporte > 0 ? aporteNumerico / ativosElegiveisAporte : 0;

    const formatarMoeda = (val?: number) => {
        if (val === undefined || val === null || isNaN(val)) return '---';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: isInternacional ? 'USD' : 'BRL'
        }).format(val);
    };

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
                <div className="detalhes-page">
                    {/* NAVEGAÇÃO DE TOPO */}
                    <div className="detalhes-topbar-nav">
                        <Link to="/carteiras" className="btn-voltar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Voltar para Carteiras
                        </Link>

                        {!isRendaFixaOuFundo && !carregando && (
                            <span className="brapi-live-indicator">
                                <span className="pulse-dot"></span>
                                {carregandoBrapi ? 'Sincronizando cotações Brapi PRO...' : 'Cotações Brapi PRO em Tempo Real'}
                            </span>
                        )}
                    </div>

                    {carregando ? (
                        <div className="detalhes-skeleton-wrap">
                            <div className="sk-box" style={{ height: '140px' }}></div>
                            <div className="sk-box" style={{ height: '90px' }}></div>
                            <div className="sk-box" style={{ height: '380px' }}></div>
                        </div>
                    ) : carteira ? (
                        <>
                            {/* HEADER PRINCIPAL */}
                            <header className="detalhes-hero-card">
                                <div className="detalhes-hero-left">
                                    <div className="detalhes-badges-row">
                                        <span className="detalhes-badge-tipo">Carteira Recomendada</span>
                                        <span className="detalhes-badge-neutral">Peso Igualitário ({pesoIdeal}% / ativo)</span>
                                    </div>
                                    <h1>{carteira.nome}</h1>
                                    <p>
                                        Alocação estratégica monitorada pelo time de gestão com preços-teto fundamentalistas e acompanhamento em tempo real.
                                    </p>

                                    <div className="detalhes-hero-actions">
                                        <button type="button" className="btn-institucional-outline" onClick={abrirHistoricoCarteira}>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            Histórico de Decisões
                                        </button>

                                        {!isRendaFixaOuFundo && totalAtivos > 0 && (
                                            <button
                                                type="button"
                                                className={`btn-institucional-primary ${simuladorAberto ? 'active' : ''}`}
                                                onClick={() => setSimuladorAberto(!simuladorAberto)}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="4" y="2" width="16" height="20" rx="2" />
                                                    <line x1="8" y1="6" x2="16" y2="6" />
                                                    <line x1="16" y1="14" x2="16" y2="18" />
                                                    <path d="M16 10h.01" />
                                                    <path d="M12 10h.01" />
                                                    <path d="M8 10h.01" />
                                                    <path d="M12 14h.01" />
                                                    <path d="M8 14h.01" />
                                                    <path d="M12 18h.01" />
                                                    <path d="M8 18h.01" />
                                                </svg>
                                                {simuladorAberto ? 'Fechar Simulador de Aporte' : 'Simular Aporte na Carteira'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="card-conviccao-box">
                                    <span className="conviccao-kicker">Índice de Convicção</span>
                                    <strong className="conviccao-big-num">{indiceConviccao}%</strong>
                                    <span className="conviccao-sub">dos ativos em janela de compra</span>
                                    <div className="conviccao-mini-bar">
                                        <div style={{ width: `${indiceConviccao}%` }}></div>
                                    </div>
                                </div>
                            </header>

                            {/* SIMULADOR DE APORTE INTELIGENTE (EXPANSÍVEL) */}
                            {simuladorAberto && !isRendaFixaOuFundo && (
                                <section className="simulador-aporte-panel">
                                    <div className="simulador-header">
                                        <div>
                                            <h3>Simulador de Aporte Inteligente (Brapi Real-Time)</h3>
                                            <p>
                                                Informe o valor que deseja investir. O cálculo divide o montante entre os{' '}
                                                <strong>{ativosElegiveisAporte} ativos recomendados para Compra</strong> e calcula a quantidade exata de ações na cotação atual.
                                            </p>
                                        </div>
                                        <div className="simulador-input-group">
                                            <label>Valor do Aporte ({isInternacional ? 'US$' : 'R$'})</label>
                                            <input
                                                type="number"
                                                min="100"
                                                step="500"
                                                value={valorAporte}
                                                onChange={(e) => setValorAporte(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="simulador-resumo-strip">
                                        <span>Alocação por Ativo Elegível: <strong>{formatarMoeda(aportePorAtivo)}</strong></span>
                                        <span>•</span>
                                        <span>As quantidades sugeridas já aparecem na coluna <strong>"Sugestão de Aporte"</strong> da tabela abaixo.</span>
                                    </div>
                                </section>
                            )}

                            {/* STRIP DE KPIs EXECUTIVOS */}
                            {totalAtivos > 0 && (
                                <div className="detalhes-analytics-section">
                                    <div className="detalhes-kpi-grid">
                                        <div className="detalhes-kpi-card">
                                            <span className="kpi-label">Total de Ativos</span>
                                            <strong className="kpi-valor">{totalAtivos}</strong>
                                            <span className="kpi-foot">Diversificação ativa</span>
                                        </div>

                                        <div className="detalhes-kpi-card">
                                            <span className="kpi-label">Janela de Compra</span>
                                            <strong className="kpi-valor highlight-green">{qtdComprar}</strong>
                                            <span className="kpi-foot">Abaixo do preço-teto</span>
                                        </div>

                                        <div className="detalhes-kpi-card">
                                            <span className="kpi-label">Em Observação / Saída</span>
                                            <strong className="kpi-valor highlight-orange">
                                                {qtdAguardar} <small style={{ fontSize: '0.9rem', opacity: 0.7 }}>/ {qtdVender} venda</small>
                                            </strong>
                                            <span className="kpi-foot">Aguardar ponto de entrada</span>
                                        </div>

                                        {!isRendaFixaOuFundo ? (
                                            <>
                                                <div className="detalhes-kpi-card">
                                                    <span className="kpi-label">Desempenho Hoje (Média)</span>
                                                    <strong
                                                        className={`kpi-valor ${
                                                            metricasTempoReal.variacaoMediaDia !== null
                                                                ? metricasTempoReal.variacaoMediaDia >= 0
                                                                    ? 'highlight-green'
                                                                    : 'highlight-red'
                                                                : ''
                                                        }`}
                                                    >
                                                        {metricasTempoReal.variacaoMediaDia !== null
                                                            ? `${metricasTempoReal.variacaoMediaDia >= 0 ? '+' : ''}${metricasTempoReal.variacaoMediaDia.toFixed(2)}%`
                                                            : '---'}
                                                    </strong>
                                                    <span className="kpi-foot">Cotação intradiária Brapi</span>
                                                </div>

                                                <div className="detalhes-kpi-card">
                                                    <span className="kpi-label">Margem Média (Upside)</span>
                                                    <strong
                                                        className={`kpi-valor ${
                                                            metricasTempoReal.upsideMedio !== null && metricasTempoReal.upsideMedio >= 0
                                                                ? 'highlight-cyan'
                                                                : ''
                                                        }`}
                                                    >
                                                        {metricasTempoReal.upsideMedio !== null
                                                            ? `${metricasTempoReal.upsideMedio >= 0 ? '+' : ''}${metricasTempoReal.upsideMedio.toFixed(1)}%`
                                                            : '---'}
                                                    </strong>
                                                    <span className="kpi-foot">Potencial até o Preço Teto</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="detalhes-kpi-card">
                                                    <span className="kpi-label">SELIC Oficial</span>
                                                    <strong className="kpi-valor highlight-cyan">{taxasMacro.selic}</strong>
                                                    <span className="kpi-foot">Taxa básica de juros</span>
                                                </div>
                                                <div className="detalhes-kpi-card">
                                                    <span className="kpi-label">Taxa CDI</span>
                                                    <strong className="kpi-valor">{taxasMacro.cdi}</strong>
                                                    <span className="kpi-foot">Benchmark Renda Fixa</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* BARRA DE DISTRIBUIÇÃO DE VIÉS */}
                                    <div className="distribuicao-vies-card">
                                        <div className="distribuicao-vies-header">
                                            <span>Distribuição de Recomendações da Carteira</span>
                                            <div className="distribuicao-legenda">
                                                <span><i className="dot-green"></i> Comprar ({qtdComprar})</span>
                                                <span><i className="dot-orange"></i> Aguardar ({qtdAguardar})</span>
                                                {qtdVender > 0 && <span><i className="dot-red"></i> Vender ({qtdVender})</span>}
                                            </div>
                                        </div>
                                        <div className="distribuicao-vies-barra">
                                            <div
                                                style={{ width: `${(qtdComprar / totalAtivos) * 100}%`, backgroundColor: '#10b981' }}
                                                title={`Comprar: ${qtdComprar}`}
                                            />
                                            <div
                                                style={{ width: `${(qtdAguardar / totalAtivos) * 100}%`, backgroundColor: '#f59e0b' }}
                                                title={`Aguardar: ${qtdAguardar}`}
                                            />
                                            <div
                                                style={{ width: `${(qtdVender / totalAtivos) * 100}%`, backgroundColor: '#ef4444' }}
                                                title={`Vender: ${qtdVender}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* CONTAINER DE ATIVOS (COM BARRA DE FERRAMENTAS E ALTERNADOR DE VISÃO) */}
                            <div className="tabela-container">
                                <div className="tabela-header-premium">
                                    <div>
                                        <h2>Composição do Portfólio</h2>
                                        <span className="tabela-subtitle">
                                            Clique em qualquer ativo para inspecionar o histórico de decisões e fatos relevantes da gestão.
                                        </span>
                                    </div>

                                    <div className="tabela-controles">
                                        <div className="filtro-vies-group">
                                            {(['Todos', 'Comprar', 'Aguardar', 'Vender'] as const).map((v) => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    className={`vies-pill-btn ${filtroVies === v ? 'active' : ''}`}
                                                    onClick={() => setFiltroVies(v)}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="busca-ativo-input">
                                            <input
                                                type="text"
                                                placeholder="Filtrar ticker..."
                                                value={buscaAtivo}
                                                onChange={(e) => setBuscaAtivo(e.target.value)}
                                            />
                                        </div>

                                        <div className="visao-toggle-group" title="Alternar modo de visualização">
                                            <button
                                                type="button"
                                                className={`visao-btn ${modoVisao === 'tabela' ? 'active' : ''}`}
                                                onClick={() => setModoVisao('tabela')}
                                            >
                                                ☰ Tabela
                                            </button>
                                            <button
                                                type="button"
                                                className={`visao-btn ${modoVisao === 'cards' ? 'active' : ''}`}
                                                onClick={() => setModoVisao('cards')}
                                            >
                                                ⊞ Cards
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {ativosFiltrados.length === 0 ? (
                                    <div className="estado-vazio-tabela">
                                        <h3>Nenhum ativo encontrado para este filtro</h3>
                                        <p>Altere os filtros de viés ou limpe o campo de pesquisa.</p>
                                    </div>
                                ) : modoVisao === 'tabela' ? (
                                    /* VISÃO 1: TABELA TERMINAL INSTITUCIONAL (COM DADOS BRAPI PRO) */
                                    <div className="ativos-table-scroll">
                                        <table className="ativos-table">
                                            <thead>
                                            <tr>
                                                <th>Ativo</th>
                                                <th>Viés Atual</th>
                                                <th className="align-center">Peso Alvo</th>
                                                {isRendaFixaOuFundo ? (
                                                    <>
                                                        <th className="align-right">Rentabilidade / Taxa</th>
                                                        <th className="align-right">Liquidez / Vencimento</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th className="align-right">Cotação Atual (Brapi)</th>
                                                        <th className="align-right">Preço Teto</th>
                                                        <th className="align-right">Margem / Upside</th>
                                                        {simuladorAberto && <th className="align-right">Sugestão de Aporte</th>}
                                                    </>
                                                )}
                                                <th className="align-center">Watchlist</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {ativosFiltrados.map((ativo: any) => {
                                                const quote = cotacoesBrapi[ativo.ticker];
                                                const precoAtual = quote?.regularMarketPrice;
                                                const varDia = quote?.regularMarketChangePercent;
                                                const upside =
                                                    precoAtual && ativo.precoTeto
                                                        ? ((ativo.precoTeto - precoAtual) / precoAtual) * 100
                                                        : null;

                                                const qtdCotasSugeridas =
                                                    precoAtual && precoAtual > 0 && ativo.vies === 'Comprar'
                                                        ? Math.floor(aportePorAtivo / precoAtual)
                                                        : 0;

                                                const isFav = !!favoritosSet[ativo.ticker];

                                                return (
                                                    <tr
                                                        key={ativo.id || ativo.ticker}
                                                        id={`ativo-${ativo.id}`}
                                                        onClick={() => abrirHistoricoAtivo(ativo.ticker)}
                                                        className="linha-ativo-interativa"
                                                    >
                                                        <td data-label="Ativo">
                                                            <div className="ticker-wrapper">
                                                                <div className="ticker-icone">
                                                                    {quote?.logourl ? (
                                                                        <img
                                                                            src={quote.logourl}
                                                                            alt={ativo.ticker}
                                                                            onError={(e) => {
                                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        ativo.ticker?.slice(0, 4)
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <strong className="ticker-destaque">{ativo.ticker}</strong>
                                                                    <span className="nome-empresa">
                                                                            {quote?.shortName || ativo.nomeEmpresa || ativo.categoria || 'Ativo Recomendado'}
                                                                        </span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td data-label="Viés Atual">
                                                                <span className={`status-badge badge-${ativo.vies?.toLowerCase()}`}>
                                                                    <span className="badge-dot"></span>
                                                                    {ativo.vies}
                                                                </span>
                                                        </td>

                                                        <td data-label="Peso Alvo" className="align-center tabular-nums">
                                                            <span className="peso-pill">{pesoIdeal}%</span>
                                                        </td>

                                                        {isRendaFixaOuFundo ? (
                                                            <>
                                                                <td data-label="Rentabilidade" className="align-right tabular-nums">
                                                                    <strong className="highlight-cyan">{ativo.rentabilidade || '---'}</strong>
                                                                </td>
                                                                <td data-label="Liquidez / Venc." className="align-right">
                                                                        <span className="texto-secundario">
                                                                            {ativo.liquidez || ativo.vencimento || 'Consultar lâmina'}
                                                                        </span>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td data-label="Cotação Atual" className="align-right tabular-nums">
                                                                    {precoAtual ? (
                                                                        <div className="cotacao-cell">
                                                                            <strong>{formatarMoeda(precoAtual)}</strong>
                                                                            {varDia !== undefined && (
                                                                                <span className={`var-mini ${varDia >= 0 ? 'pos' : 'neg'}`}>
                                                                                        {varDia >= 0 ? '▲' : '▼'} {Math.abs(varDia).toFixed(2)}%
                                                                                    </span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="texto-secundario">---</span>
                                                                    )}
                                                                </td>

                                                                <td data-label="Preço Teto" className="align-right tabular-nums">
                                                                    <strong>{ativo.precoTeto ? formatarMoeda(ativo.precoTeto) : '---'}</strong>
                                                                </td>

                                                                <td data-label="Margem / Upside" className="align-right tabular-nums">
                                                                    {upside !== null ? (
                                                                        <div className="upside-cell">
                                                                                <span className={`upside-badge ${upside >= 0 ? 'descontado' : 'acima'}`}>
                                                                                    {upside >= 0 ? `+${upside.toFixed(1)}%` : `${upside.toFixed(1)}%`}
                                                                                </span>
                                                                            <small>{upside >= 0 ? 'Margem favorável' : 'Acima do teto'}</small>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="texto-secundario">---</span>
                                                                    )}
                                                                </td>

                                                                {simuladorAberto && (
                                                                    <td data-label="Sugestão Aporte" className="align-right tabular-nums">
                                                                        {ativo.vies === 'Comprar' ? (
                                                                            <div className="aporte-sugestao-cell">
                                                                                <strong>{formatarMoeda(aportePorAtivo)}</strong>
                                                                                <span>
                                                                                        {precoAtual ? `≈ ${qtdCotasSugeridas} cotas` : 'Calculando...'}
                                                                                    </span>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="texto-secundario">Aguardar</span>
                                                                        )}
                                                                    </td>
                                                                )}
                                                            </>
                                                        )}

                                                        <td data-label="Watchlist" className="align-center">
                                                            <button
                                                                type="button"
                                                                className={`btn-star-fav ${isFav ? 'ativo' : ''}`}
                                                                onClick={(e) => alternarFavorito(e, ativo)}
                                                                title={isFav ? 'Remover da Watchlist' : 'Adicionar à Watchlist'}
                                                            >
                                                                ★
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    /* VISÃO 2: CARDS ORIGINAIS DO SISTEMA */
                                    <div className="ativos-grid">
                                        {ativosFiltrados.map((ativo: any, index: number) => {
                                            if (isRendaFixaOuFundo || ativo.rentabilidade) {
                                                let tipoCard: 'renda-fixa' | 'fundo' | 'reserva' = 'renda-fixa';
                                                if (carteira?.id === 6) tipoCard = 'fundo';
                                                if (carteira?.id === 8) tipoCard = 'reserva';

                                                return (
                                                    <div
                                                        key={index}
                                                        id={`ativo-${ativo.id}`}
                                                        onClick={() => abrirHistoricoAtivo(ativo.ticker)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <CardRendaFixa
                                                            tipo={tipoCard}
                                                            nome={ativo.ticker}
                                                            rentabilidade={ativo.rentabilidade || '--'}
                                                            vencimento={ativo.vencimento}
                                                            liquidez={ativo.liquidez}
                                                            cnpj={ativo.nomeEmpresa}
                                                            vies={ativo.vies}
                                                            dataEntrada={ativo.dataEntrada}
                                                            categoria={ativo.categoria}
                                                            nomeCarteira={carteira?.nome}
                                                        />
                                                    </div>
                                                );
                                            }

                                            if (isInternacional) {
                                                return (
                                                    <div
                                                        key={index}
                                                        id={`ativo-${ativo.id}`}
                                                        onClick={() => abrirHistoricoAtivo(ativo.ticker)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <CardInternacional
                                                            ticker={ativo.ticker}
                                                            vies={ativo.vies}
                                                            precoTeto={ativo.precoTeto}
                                                            dataEntrada={ativo.dataEntrada}
                                                            categoria={ativo.categoria}
                                                            nomeCarteira={carteira?.nome}
                                                        />
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div
                                                    key={index}
                                                    id={`ativo-${ativo.id}`}
                                                    onClick={() => abrirHistoricoAtivo(ativo.ticker)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <CardAtivo
                                                        ticker={ativo.ticker}
                                                        vies={ativo.vies}
                                                        precoTeto={ativo.precoTeto}
                                                        dataEntrada={ativo.dataEntrada}
                                                        categoria={ativo.categoria}
                                                        nomeEmpresa={ativo.nomeEmpresa}
                                                        nomeCarteira={carteira?.nome}
                                                        onVerHistorico={() => abrirHistoricoAtivo(ativo.ticker)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* AVISO LEGAL */}
                            <div className="detalhes-disclaimer">
                                <p>
                                    <strong>Aviso Legal & Governança:</strong> As informações apresentadas nesta carteira têm caráter exclusivamente analítico e informativo, não constituindo promessa de rentabilidade futura. O <strong>Preço Teto</strong> reflete o valor máximo estipulado pela equipe de análise para aquisição com margem de segurança. Cotações de mercado são fornecidas via integração Brapi PRO.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="estado-vazio-tabela">
                            <h2>Carteira não encontrada.</h2>
                        </div>
                    )}
                </div>
            </main>

            {modalHistoricoAberto && carteira && (
                <ModalHistoricoCarteira
                    carteiraId={carteira.id}
                    carteiraNome={carteira.nome}
                    tickerInicial={tickerFocoModal}
                    onClose={() => setModalHistoricoAberto(false)}
                />
            )}
        </div>
    );
}