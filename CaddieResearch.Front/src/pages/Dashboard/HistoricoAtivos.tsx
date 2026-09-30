import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import './HistoricoAtivos.css';

interface LogAcao {
    id: number;
    acao: string;
    vies: string;
    precoAlvo: number;
    justificativa: string;
    dataRecomendacao: string;
    nomeGestor: string;
    nomeCarteira: string;
    bloqueado?: boolean;
    planoMinimo?: string;
}

interface Relatorio {
    id: number;
    titulo: string;
    assunto?: string;
    dataPublicacao: string;
    nomeCarteira?: string;
    bloqueado?: boolean;
    planoMinimo?: string;
}

interface HistoricoAtivo {
    ticker: string;
    nomeAtivo: string;
    bloqueado?: boolean;
    nivelExigido?: number;
    planoMinimo?: string;
    logs: LogAcao[];
    relatoriosRelacionados: Relatorio[];
}

export default function HistoricoAtivos() {
    const [historicoAgrupado, setHistoricoAgrupado] = useState<HistoricoAtivo[]>([]);
    const [carregando, setCarregando] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    
    // Filtros
    const [busca, setBusca] = useState('');
    const [filtroCarteira, setFiltroCarteira] = useState('Todas');
    const [filtroAcao, setFiltroAcao] = useState('Todas');
    const [filtroPeriodo, setFiltroPeriodo] = useState('Todos');

    // Estado do Modal de Dossiê do Ativo
    const [ativoModal, setAtivoModal] = useState<HistoricoAtivo | null>(null);

    // Estado do Modal de Upgrade
    const [modalUpgradeAberto, setModalUpgradeAberto] = useState(false);
    const [infoUpgrade, setInfoUpgrade] = useState<{ carteira: string; plano: string }>({ carteira: '', plano: '' });

    useEffect(() => {
        carregarHistoricoGlobal();
    }, []);

    // Lê os parâmetros vindos da Busca Global ou de Relatórios (?busca=PETR4&foco=PETR4)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const termoUrl = params.get('busca');
        const focoUrl = params.get('foco');

        if (termoUrl) {
            setBusca(termoUrl);
        }

        if (focoUrl && historicoAgrupado.length > 0) {
            const ativoEncontrado = historicoAgrupado.find(
                a => a.ticker.toLowerCase() === focoUrl.toLowerCase()
            );
            if (ativoEncontrado) {
                setAtivoModal(ativoEncontrado);
            }
        }
    }, [location.search, historicoAgrupado]);

    const carregarHistoricoGlobal = async () => {
        try {
            const token = localStorage.getItem('caddie_token');
            const res = await api.get('/api/historico-carteiras', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistoricoAgrupado(res.data);
        } catch (error) {
            console.error("Erro ao carregar auditoria", error);
        } finally {
            setCarregando(false);
        }
    };

    const abrirModalUpgrade = (carteira: string, plano: string) => {
        setInfoUpgrade({ carteira, plano });
        setModalUpgradeAberto(true);
    };

    const formatarDataHora = (dataIso: string) => {
        const d = new Date(dataIso);
        const data = d.toLocaleDateString('pt-BR');
        const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `${data} às ${hora}`;
    };

    const dentroDoPeriodo = (dataIso: string) => {
        if (filtroPeriodo === 'Todos') return true;
        const dataLog = new Date(dataIso).getTime();
        const agora = new Date().getTime();
        const dias = Number(filtroPeriodo);
        return (agora - dataLog) <= dias * 24 * 60 * 60 * 1000;
    };

    const carteirasDisponiveis = Array.from(
        new Set(
            historicoAgrupado.flatMap(a => [
                ...a.logs.map(l => l.nomeCarteira),
                ...a.relatoriosRelacionados.map(r => r.nomeCarteira || '')
            ]).filter(Boolean)
        )
    );

    const filtrarLogsDoAtivo = (logs: LogAcao[]) => {
        return logs.filter(log => 
            (filtroCarteira === 'Todas' || log.nomeCarteira === filtroCarteira) &&
            (filtroAcao === 'Todas' || log.acao === filtroAcao) &&
            dentroDoPeriodo(log.dataRecomendacao)
        );
    };

    const historicoFiltrado = historicoAgrupado.filter(ativo => {
        const matchBusca = ativo.ticker.toLowerCase().includes(busca.toLowerCase()) || 
                           ativo.nomeAtivo.toLowerCase().includes(busca.toLowerCase());
        
        const logsValidos = filtrarLogsDoAtivo(ativo.logs);
        const temRelatorioValido = filtroAcao === 'Todas' && ativo.relatoriosRelacionados.some(
            r => (filtroCarteira === 'Todas' || r.nomeCarteira === filtroCarteira) && dentroDoPeriodo(r.dataPublicacao)
        );

        return matchBusca && (logsValidos.length > 0 || temRelatorioValido);
    });

    return (
        <div className="historico-page">
            <div className="historico-header">
                <h2>Auditoria de Recomendações e Relatórios</h2>
                <p>Acompanhe o log imutável de movimentações nas carteiras e o histórico de relatórios vinculados a cada ativo.</p>
            </div>

            <div className="historico-filtros">
                <input 
                    type="text" 
                    placeholder="Buscar por Ticker ou Nome..." 
                    value={busca} 
                    onChange={e => setBusca(e.target.value)} 
                    className="historico-input"
                />
                <select value={filtroCarteira} onChange={e => setFiltroCarteira(e.target.value)} className="historico-select">
                    <option value="Todas">Todas as Carteiras</option>
                    {carteirasDisponiveis.map(cart => (
                        <option key={cart} value={cart}>{cart}</option>
                    ))}
                </select>
                <select value={filtroAcao} onChange={e => setFiltroAcao(e.target.value)} className="historico-select">
                    <option value="Todas">Todas as Ações</option>
                    <option value="Adicionou">Apenas Adições</option>
                    <option value="Atualizou">Apenas Atualizações</option>
                    <option value="Excluiu">Apenas Exclusões</option>
                </select>
                <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} className="historico-select">
                    <option value="Todos">Todo o Período</option>
                    <option value="7">Últimos 7 dias</option>
                    <option value="30">Últimos 30 dias</option>
                    <option value="90">Últimos 90 dias</option>
                </select>
            </div>

            {carregando ? (
                <div className="historico-mensagem">Carregando base de auditoria...</div>
            ) : historicoFiltrado.length === 0 ? (
                <div className="historico-mensagem">Nenhum registro encontrado para os filtros atuais.</div>
            ) : (
                <div className="historico-lista">
                    {historicoFiltrado.map(ativo => {
                        const logsExibidos = filtrarLogsDoAtivo(ativo.logs);
                        const nomeCarteiraPrincipal = logsExibidos[0]?.nomeCarteira || ativo.relatoriosRelacionados[0]?.nomeCarteira || 'Geral';

                        return (
                            <div key={ativo.ticker} className={`historico-card ${ativo.bloqueado ? 'locked' : ''}`}>
                                <div className="historico-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                                    <h3 style={{ margin: 0 }} onClick={() => setAtivoModal(ativo)}>
                                        <span style={{ cursor: 'pointer', color: '#00B4D8' }}>{ativo.ticker}</span> 
                                        <span style={{ marginLeft: '10px' }}>{ativo.nomeAtivo}</span>
                                    </h3>

                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        {ativo.bloqueado && (
                                            <button 
                                                className="btn-relatorio-bloqueado"
                                                style={{ width: 'auto', padding: '8px 14px', fontSize: '0.8rem' }}
                                                onClick={() => abrirModalUpgrade(nomeCarteiraPrincipal, ativo.planoMinimo || 'Premium')}
                                            >
                                                🔒 Recomendação Restrita (Plano {ativo.planoMinimo})
                                            </button>
                                        )}
                                        <button 
                                            className="historico-btn-detalhes"
                                            onClick={() => setAtivoModal(ativo)}
                                        >
                                            🔍 Dossiê & Histórico de Relatórios ({ativo.relatoriosRelacionados.length})
                                        </button>
                                    </div>
                                </div>

                                {logsExibidos.length > 0 ? (
                                    <table className="historico-table">
                                        <thead>
                                            <tr>
                                                <th>Data / Hora</th>
                                                <th>Carteira</th>
                                                <th>Ação</th>
                                                <th>Viés</th>
                                                <th>Alvo</th>
                                                <th>Gestor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logsExibidos.map(log => (
                                                <tr key={log.id} onClick={() => log.bloqueado && abrirModalUpgrade(log.nomeCarteira, log.planoMinimo || 'Premium')} style={{ cursor: log.bloqueado ? 'pointer' : 'default' }}>
                                                    <td style={{ whiteSpace: 'nowrap' }}>{formatarDataHora(log.dataRecomendacao)}</td>
                                                    <td><span className="h-badge-carteira">{log.nomeCarteira}</span></td>
                                                    <td><span className={`h-badge-acao h-acao-${log.acao}`}>{log.acao}</span></td>
                                                    <td>
                                                        {log.bloqueado ? (
                                                            <span className="texto-borrado-auditoria">Comprar</span>
                                                        ) : (
                                                            <span className={`h-badge-vies h-vies-${log.vies}`}>{log.vies}</span>
                                                        )}
                                                    </td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        {log.bloqueado ? (
                                                            <span className="texto-borrado-auditoria">R$ 99,90</span>
                                                        ) : (
                                                            `R$ ${log.precoAlvo.toFixed(2).replace('.', ',')}`
                                                        )}
                                                    </td>
                                                    <td>{log.nomeGestor}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ color: '#8b949e', fontSize: '0.85rem', padding: '8px 0' }}>
                                        Ativo citado em relatórios de cobertura (sem movimentação direta de carteira neste filtro).
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL DE DOSSIÊ DO ATIVO (MOSTRA LOGS + HISTÓRICO DE RELATÓRIOS) */}
            {ativoModal && (
                <div className="modal-hc-overlay" onClick={() => setAtivoModal(null)}>
                    <div className="modal-hc-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-hc-header">
                            <div>
                                <h3 style={{ margin: 0, color: '#00B4D8' }}>Dossiê do Ativo: {ativoModal.ticker}</h3>
                                <span style={{ fontSize: '0.85rem', color: '#8b949e' }}>{ativoModal.nomeAtivo} — Histórico Completo de Recomendações e Relatórios</span>
                            </div>
                            <button className="modal-hc-fechar" onClick={() => setAtivoModal(null)}>✕</button>
                        </div>
                        <div className="modal-hc-body">
                            <h4 style={{ color: '#e6edf3', marginTop: 0, marginBottom: '12px' }}>
                                Linha do Tempo de Recomendações ({ativoModal.logs.length})
                            </h4>
                            {ativoModal.logs.length === 0 ? (
                                <p style={{ color: '#8b949e', fontSize: '0.85rem', marginBottom: '24px' }}>
                                    Nenhuma recomendação direta em carteira para {ativoModal.ticker}. Confira abaixo os relatórios onde este ativo foi analisado.
                                </p>
                            ) : (
                                <table className="historico-table" style={{ marginBottom: '28px' }}>
                                    <thead>
                                        <tr>
                                            <th>Data / Hora</th>
                                            <th>Carteira</th>
                                            <th>Ação</th>
                                            <th>Viés</th>
                                            <th>Alvo</th>
                                            <th>Justificativa</th>
                                            <th>Gestor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ativoModal.logs.map(log => (
                                            <tr 
                                                key={log.id}
                                                onClick={() => log.bloqueado && abrirModalUpgrade(log.nomeCarteira, log.planoMinimo || 'Premium')}
                                                style={{ cursor: log.bloqueado ? 'pointer' : 'default' }}
                                            >
                                                <td style={{ whiteSpace: 'nowrap' }}>{formatarDataHora(log.dataRecomendacao)}</td>
                                                <td><span className="h-badge-carteira">{log.nomeCarteira}</span></td>
                                                <td><span className={`h-badge-acao h-acao-${log.acao}`}>{log.acao}</span></td>
                                                <td>
                                                    {log.bloqueado ? (
                                                        <span className="texto-borrado-auditoria">Comprar</span>
                                                    ) : (
                                                        <span className={`h-badge-vies h-vies-${log.vies}`}>{log.vies}</span>
                                                    )}
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    {log.bloqueado ? (
                                                        <span className="texto-borrado-auditoria">R$ 99,90</span>
                                                    ) : (
                                                        `R$ ${log.precoAlvo.toFixed(2).replace('.', ',')}`
                                                    )}
                                                </td>
                                                <td style={{ color: log.bloqueado ? '#ffc107' : '#8b949e', fontSize: '0.8rem' }}>
                                                    {log.bloqueado ? `🔒 Exclusivo Plano ${log.planoMinimo} (Clique para liberar)` : (log.justificativa || '-')}
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{log.nomeGestor}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            <div className="historico-relatorios" style={{ marginTop: 0 }}>
                                <strong>Histórico de Relatórios de Cobertura Vinculados a {ativoModal.ticker} ({ativoModal.relatoriosRelacionados.length}):</strong>
                                {ativoModal.relatoriosRelacionados.length === 0 ? (
                                    <p style={{ color: '#8b949e', fontSize: '0.85rem', margin: 0 }}>
                                        Nenhum relatório em PDF vinculado diretamente a {ativoModal.ticker} até o momento.
                                    </p>
                                ) : (
                                    <table className="historico-table" style={{ marginTop: '8px' }}>
                                        <thead>
                                            <tr>
                                                <th>Publicação</th>
                                                <th>Carteira</th>
                                                <th>Assunto</th>
                                                <th>Título do Relatório</th>
                                                <th>Acesso</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ativoModal.relatoriosRelacionados.map(rel => (
                                                <tr key={rel.id}>
                                                    <td style={{ whiteSpace: 'nowrap' }}>{formatarDataHora(rel.dataPublicacao)}</td>
                                                    <td><span className="h-badge-carteira">{rel.nomeCarteira || 'Geral'}</span></td>
                                                    <td style={{ color: '#8b949e' }}>{rel.assunto || 'Análise'}</td>
                                                    <td style={{ color: '#fff', fontWeight: 600 }}>{rel.titulo}</td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        {rel.bloqueado ? (
                                                            <button
                                                                className="btn-relatorio-bloqueado"
                                                                style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto' }}
                                                                onClick={() => abrirModalUpgrade(rel.nomeCarteira || 'Carteira', rel.planoMinimo || 'Premium')}
                                                            >
                                                                🔒 Plano {rel.planoMinimo}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="historico-btn-detalhes"
                                                                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                                                onClick={() => {
                                                                    setAtivoModal(null);
                                                                    navigate(`/relatorios?highlight=${rel.id}`);
                                                                }}
                                                            >
                                                                📄 Abrir Relatório
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE UPGRADE */}
            {modalUpgradeAberto && (
                <div className="upgrade-modal-overlay" onClick={() => setModalUpgradeAberto(false)}>
                    <div className="upgrade-modal-box" onClick={e => e.stopPropagation()}>
                        <div className="upgrade-modal-icone">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <h3>Conteúdo Exclusivo</h3>
                        <p>
                            Este conteúdo pertence à estratégia de <strong>{infoUpgrade.carteira}</strong> (Exclusivo Plano <strong>{infoUpgrade.plano}</strong>). Deseja conhecer nossos planos para liberar o acesso completo?
                        </p>
                        <div className="upgrade-modal-acoes">
                            <button className="btn-modal-upgrade-confirmar" onClick={() => navigate('/gerenciar-plano')}>
                                Ver Planos de Assinatura
                            </button>
                            <button className="btn-modal-upgrade-cancelar" onClick={() => setModalUpgradeAberto(false)}>
                                Continuar na Auditoria
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}