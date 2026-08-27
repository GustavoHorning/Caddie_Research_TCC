import { useState, useEffect } from 'react';
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
    ticker: string | null;
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

    const meusTickers = ['WEGE3', 'PETR4', 'VALE3'];

    useEffect(() => {
        const buscarEventos = async () => {
            try {
                const response = await fetch('http://localhost:5194/api/calendario');                
                const data = await response.json();

                if (Array.isArray(data)) {
                    setEventos(data);
                } else {
                    console.error("A API não retornou uma lista:", data);
                }
            } catch (error) {
                console.error("Erro ao carregar o calendário:", error);
            } finally {
                setLoading(false);
            }
        };

        buscarEventos();
    }, []);

    const eventosFiltrados = eventos.filter(evento => {
        const passaTipo = filtroTipo === 'Todos' || evento.tipo === filtroTipo;
        const passaWatchlist = apenasWatchlist ? (evento.ticker && meusTickers.includes(evento.ticker)) : true;
        const passaBusca = evento.titulo.toLowerCase().includes(busca.toLowerCase()) ||
            (evento.ticker && evento.ticker.toLowerCase().includes(busca.toLowerCase()));
        return passaTipo && passaWatchlist && passaBusca;
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
                                                    <span className="cal-bandeira-badge">{evento.pais}</span>
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