import { useState, useEffect } from 'react';
import api from '../../services/api'; 
import './Calendario.css';

interface EventoMercado {
    id: number;
    dataStr: string;
    hora: string;
    titulo: string;
    tipo: string;
    impacto: number;
    projecao: string | null;
    atual: string | null;
    TickerRelacionado: string | null;
    pais: string;
    descricao: string | null;
    link: string | null;
}

export default function Calendario() {
    const [eventos, setEventos] = useState<EventoMercado[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [busca, setBusca] = useState<string>('');
    const [filtroTipo, setFiltroTipo] = useState<string>('Todos');
    const [apenasWatchlist, setApenasWatchlist] = useState<boolean>(false);
    const [eventoExpandido, setEventoExpandido] = useState<number | null>(null);

    const [meusTickers, setMeusTickers] = useState<string[]>([]);

    useEffect(() => {
        const buscarDados = async () => {
            try {
                const resEventos = await api.get('/api/calendario');
                if (Array.isArray(resEventos.data)) {
                    setEventos(resEventos.data);
                }

                const resFavs = await api.get('/api/favoritos');
                const tickersExtraidos = resFavs.data.map((fav: any) => fav.ticker);
                setMeusTickers(tickersExtraidos);

            } catch (error) {
                console.error("Erro ao carregar o calendário ou favoritos:", error);
            } finally {
                setLoading(false);
            }
        };

        buscarDados();
    }, []);

    const dataHoje = new Date();
    const hojeIso = `${dataHoje.getFullYear()}-${String(dataHoje.getMonth() + 1).padStart(2, '0')}-${String(dataHoje.getDate()).padStart(2, '0')}`;

    const eventosFiltrados = eventos.filter(evento => {
        const passaTempo = evento.dataStr >= hojeIso;
        const passaTipo = filtroTipo === 'Todos' || evento.tipo === filtroTipo;

        const tickerBruto = evento.TickerRelacionado || (evento as any).ticker || "";
        let tickerEvento = tickerBruto.trim().toUpperCase();

        if (!tickerEvento && evento.tipo === 'Balanço' && evento.titulo.includes(':')) {
            tickerEvento = evento.titulo.split(':')[1].trim().toUpperCase();
        }

        const passaWatchlist = apenasWatchlist
            ? (tickerEvento && meusTickers.some(t => {
                const tWatchlist = t.trim().toUpperCase();

                if (tWatchlist.includes('ROXO') && tickerEvento === 'NU') return true;
                if (tWatchlist.includes('PETR') && tickerEvento === 'PBR') return true;
                if (tWatchlist.includes('VALE') && tickerEvento === 'VALE') return true;
                if (tWatchlist.includes('ITUB') && tickerEvento === 'ITUB') return true;
                if (tWatchlist.includes('BBDC') && tickerEvento === 'BBD') return true;
                if (tWatchlist.includes('ELET') && tickerEvento === 'EBR') return true;

                if (tWatchlist.includes('AMZO') && tickerEvento === 'AMZN') return true;
                if (tWatchlist.includes('MSFT') && tickerEvento === 'MSFT') return true;
                if (tWatchlist.includes('AAPL') && tickerEvento === 'AAPL') return true;
                if (tWatchlist.includes('MELI') && tickerEvento === 'MELI') return true;

                return tWatchlist === tickerEvento;
            }))
            : true;

        const passaBusca = evento.titulo.toLowerCase().includes(busca.toLowerCase()) ||
            tickerEvento.toLowerCase().includes(busca.toLowerCase());

        return passaTempo && passaTipo && passaWatchlist && passaBusca;
    });

    const eventosAgrupados = eventosFiltrados.reduce((acc, evento) => {
        if (!acc[evento.dataStr]) acc[evento.dataStr] = [];
        acc[evento.dataStr].push(evento);
        return acc;
    }, {} as Record<string, EventoMercado[]>);

    const formatarDataCabecalho = (dataISO: string) => {
        const dataHoje = new Date();
        const hoje = `${dataHoje.getFullYear()}-${String(dataHoje.getMonth() + 1).padStart(2, '0')}-${String(dataHoje.getDate()).padStart(2, '0')}`;

        const dataAmanha = new Date();
        dataAmanha.setDate(dataAmanha.getDate() + 1);
        const amanha = `${dataAmanha.getFullYear()}-${String(dataAmanha.getMonth() + 1).padStart(2, '0')}-${String(dataAmanha.getDate()).padStart(2, '0')}`;

        if (dataISO === hoje) return 'HOJE';
        if (dataISO === amanha) return 'AMANHÃ';

        const dataObj = new Date(dataISO + 'T12:00:00');
        return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(dataObj).toUpperCase();
    };

    return (
        <div className="cal-page">
            <div className="cal-header">
                <div>
                    <h1 className="cal-title">Calendário de Mercado</h1>
                    <p className="cal-subtitle">Acompanhe os eventos macroeconômicos, balanços e comunicados da Caddie.</p>
                </div>
            </div>

            <div className="cal-toolbar">
                <div className="cal-filtros">
                    {['Todos', 'Macro', 'Balanço', 'Caddie'].map(tipo => (
                        <button
                            key={tipo}
                            className={`cal-btn-filtro ${filtroTipo === tipo ? 'ativo' : ''}`}
                            onClick={() => setFiltroTipo(tipo)}
                        >
                            {tipo}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Buscar evento ou ticker..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '20px', outline: 'none', fontSize: '0.85rem' }}
                    />
                    <button
                        className={`cal-btn-watchlist ${apenasWatchlist ? 'ativo' : ''}`}
                        onClick={() => setApenasWatchlist(!apenasWatchlist)}
                        disabled={meusTickers.length === 0}
                        title={meusTickers.length === 0 ? "Você ainda não tem ativos favoritados" : "Filtrar por meus favoritos"}
                        style={{ opacity: meusTickers.length === 0 ? 0.5 : 1, cursor: meusTickers.length === 0 ? 'not-allowed' : 'pointer' }}
                    >
                        ⭐ Apenas minha Watchlist
                    </button>
                </div>
            </div>

            <div className="cal-content">
                {loading ? (
                    <div className="cal-vazio">
                        <p>Carregando eventos do mercado...</p>
                    </div>
                ) : Object.keys(eventosAgrupados).length === 0 ? (
                    <div className="cal-vazio">
                        <p>Nenhum evento encontrado para os filtros selecionados.</p>
                    </div>
                ) : (
                    Object.entries(eventosAgrupados).map(([dataStr, listaEventos]) => (
                        <div key={dataStr} className="cal-dia-grupo">
                            <h3 className="cal-dia-header">{formatarDataCabecalho(dataStr)}</h3>

                            <div className="cal-timeline">
                                {(listaEventos as EventoMercado[]).map((evento) => {
                                    const isExpandido = eventoExpandido === evento.id;

                                    return (
                                        <div
                                            key={evento.id}
                                            className={`cal-item-wrapper ${isExpandido ? 'expandido' : ''}`}
                                            onClick={() => setEventoExpandido(isExpandido ? null : evento.id)}
                                        >
                                            <div className="cal-item">
                                                <div className="cal-hora">{evento.hora}</div>

                                                <div className="cal-impacto-box" title={`Impacto: ${evento.impacto}`}>
                                                    <div className={`cal-barra ${evento.impacto >= 1 ? 'ativa' : ''}`}></div>
                                                    <div className={`cal-barra ${evento.impacto >= 2 ? 'ativa' : ''}`}></div>
                                                    <div className={`cal-barra ${evento.impacto >= 3 ? 'ativa' : ''}`}></div>
                                                </div>

                                                <div className="cal-info">
                                                    <span className={`cal-tag tipo-${evento.tipo?.toLowerCase()}`}>{evento.tipo}</span>
                                                    {evento.pais && (evento.tipo === 'Balanço' || evento.tipo === 'Macro') && (
                                                        <span className="cal-bandeira-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>                                                    {evento.pais.length === 2 && (
                                                            <img
                                                                src={`https://flagcdn.com/w20/${evento.pais.toLowerCase()}.png`}
                                                                alt={evento.pais}
                                                                title={evento.pais}
                                                                style={{ width: '20px', height: '14px', borderRadius: '2px', objectFit: 'cover' }}
                                                            />
                                                        )}
                                                            {evento.pais}
                                                        </span>
                                                    )}
                                                    <strong className="cal-evento-titulo">{evento.titulo}</strong>
                                                </div>

                                                <div className="cal-dados">
                                                    {evento.projecao && <span className="cal-dado-badge">Proj: {evento.projecao}</span>}
                                                    {evento.atual && <span className="cal-dado-badge destaque">Atual: {evento.atual}</span>}
                                                    <span className="cal-seta-expansao">{isExpandido ? '▲' : '▼'}</span>
                                                </div>
                                            </div>

                                            {isExpandido && (
                                                <div className="cal-detalhes-expandido">
                                                    <p className="cal-descricao">{evento.descricao}</p>
                                                    {evento.link && (
                                                        <a
                                                            href={evento.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="cal-link-externo"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            Acessar conteúdo ➔
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}