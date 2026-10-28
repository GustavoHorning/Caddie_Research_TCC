import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import Sidebar from '../../components/Sidebar';
import SidebarGestor from '../../components/SidebarGestor';
import TopBar from '../../components/TopBar';

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

export default function Auditoria() {
    const [historicoAgrupado, setHistoricoAgrupado] = useState<HistoricoAtivo[]>([]);
    const [carregando, setCarregando] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // Controle do Layout
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);

    // Filtros
    const [busca, setBusca] = useState('');
    const [filtroCarteira, setFiltroCarteira] = useState('Todas');
    const [filtroAcao, setFiltroAcao] = useState('Todas');
    const [filtroPeriodo, setFiltroPeriodo] = useState('Todos');

    // Modais
    const [ativoModal, setAtivoModal] = useState<HistoricoAtivo | null>(null);
    const [modalUpgradeAberto, setModalUpgradeAberto] = useState(false);
    const [infoUpgrade, setInfoUpgrade] = useState<{ carteira: string; plano: string }>({ carteira: '', plano: '' });

    // Lógica Inteligente: Deteta se quem abriu a página foi o Gestor ou o Cliente
    const isGestor = useMemo(() => {
        try {
            const token = localStorage.getItem('caddie_token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const role = payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
                if (String(role).toLowerCase().includes('gestor') || String(role).toLowerCase().includes('admin')) {
                    return true;
                }
            }
            const userStr = localStorage.getItem('caddie_user') || localStorage.getItem('user');
            if (userStr && userStr.toLowerCase().includes('gestor')) return true;
        } catch {}
        return false;
    }, []);

    useEffect(() => {
        carregarHistoricoGlobal();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const termoUrl = params.get('busca');
        const focoUrl = params.get('foco');

        if (termoUrl) setBusca(termoUrl);

        if (focoUrl && historicoAgrupado.length > 0) {
            const ativoEncontrado = historicoAgrupado.find(
                a => a.ticker.toLowerCase() === focoUrl.toLowerCase()
            );
            if (ativoEncontrado) setAtivoModal(ativoEncontrado);
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
        if (!dataIso) return '--/--/----';
        const isoUtc = dataIso.endsWith('Z') || dataIso.includes('+') ? dataIso : `${dataIso}Z`;
        const d = new Date(isoUtc);
        const data = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
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
        <div className="dashboard-layout">
            {/* O SEGREDO ESTÁ AQUI: Renderiza a Sidebar correta dependendo do perfil logado */}
            {isGestor ? (
                <SidebarGestor activePath="/auditoria" isOpen={menuMobileAberto} onClose={() => setMenuMobileAberto(false)} />
            ) : (
                <Sidebar activePath="/auditoria" isOpen={menuMobileAberto} onClose={() => setMenuMobileAberto(false)} />
            )}

            {menuMobileAberto && <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>}

            <TopBar userName={isGestor ? "Gestor" : "Investidor"} onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />

            <main className="dashboard-main">
                <div className="gestor-page">
                    <header className="gestor-hero">
                        <div className="gestor-hero-left">
                            <div className="gestor-kicker-row">
                                <span className="gestor-kicker-badge">Compliance & Tracking</span>
                            </div>
                            <h1 className="gestor-title">Trilha de Auditoria</h1>
                            <p className="gestor-subtitle">Acompanhe o log imutável de movimentações nas carteiras e o histórico de relatórios vinculados a cada ativo.</p>
                        </div>
                    </header>

                    <div className="gestor-panel">
                        <div className="gestor-toolbar">
                            <div className="gestor-toolbar-left" style={{ width: '100%' }}>
                                <div className="gestor-search-box" style={{ flex: 1 }}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                    <input type="text" placeholder="Buscar por Ticker ou Nome..." value={busca} onChange={e => setBusca(e.target.value)} />
                                </div>
                                <select className="gestor-select-premium" value={filtroCarteira} onChange={e => setFiltroCarteira(e.target.value)} style={{ minWidth: '180px' }}>
                                    <option value="Todas">Todas as Carteiras</option>
                                    {carteirasDisponiveis.map(cart => <option key={cart} value={cart}>{cart}</option>)}
                                </select>
                                <select className="gestor-select-premium" value={filtroAcao} onChange={e => setFiltroAcao(e.target.value)} style={{ minWidth: '180px' }}>
                                    <option value="Todas">Todas as Ações</option>
                                    <option value="Adicionou">Apenas Adições</option>
                                    <option value="Atualizou">Apenas Atualizações</option>
                                    <option value="Excluiu">Apenas Exclusões</option>
                                </select>
                                <select className="gestor-select-premium" value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} style={{ minWidth: '180px' }}>
                                    <option value="Todos">Todo o Período</option>
                                    <option value="7">Últimos 7 dias</option>
                                    <option value="30">Últimos 30 dias</option>
                                    <option value="90">Últimos 90 dias</option>
                                </select>
                            </div>
                        </div>

                        {carregando ? (
                            <div className="gestor-empty-row">Sincronizando log de auditoria...</div>
                        ) : historicoFiltrado.length === 0 ? (
                            <div className="gestor-empty-row">
                                <div className="gestor-empty-box">
                                    <strong>Nenhum registro encontrado.</strong>
                                    <span>Tente ajustar os filtros ou pesquisar por outro ativo.</span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
                                {historicoFiltrado.map(ativo => {
                                    const logsExibidos = filtrarLogsDoAtivo(ativo.logs);
                                    const nomeCarteiraPrincipal = logsExibidos[0]?.nomeCarteira || ativo.relatoriosRelacionados[0]?.nomeCarteira || 'Geral';

                                    return (
                                        <div key={ativo.ticker} className="gestor-card" style={{ padding: '0', border: '1px solid var(--g-border-strong)' }}>
                                            <div className="gestor-ativos-header" style={{ padding: '16px 24px', margin: 0, background: 'var(--g-bg-elevated)', borderBottom: '1px solid var(--g-border)' }}>
                                                <div className="gestor-ticker-line" onClick={() => setAtivoModal(ativo)} style={{ cursor: 'pointer' }}>
                                                    <div className="gestor-asset-avatar">{ativo.ticker.slice(0, 4)}</div>
                                                    <div>
                                                        <strong className="gestor-ticker-name text-cyan">{ativo.ticker}</strong>
                                                        <span className="gestor-entry-date">{ativo.nomeAtivo}</span>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    {ativo.bloqueado && (
                                                        <button className="gestor-btn gestor-btn-outline" onClick={() => abrirModalUpgrade(nomeCarteiraPrincipal, ativo.planoMinimo || 'Premium')}>
                                                            🔒 Bloqueado ({ativo.planoMinimo})
                                                        </button>
                                                    )}
                                                    <button className="gestor-btn gestor-btn-primary" onClick={() => setAtivoModal(ativo)}>
                                                        Dossiê & Relatórios ({ativo.relatoriosRelacionados.length})
                                                    </button>
                                                </div>
                                            </div>

                                            {logsExibidos.length > 0 ? (
                                                <div className="gestor-table-container">
                                                    <table className="gestor-table">
                                                        <thead>
                                                        <tr>
                                                            <th>Data / Hora</th>
                                                            <th>Carteira</th>
                                                            <th className="align-center">Ação</th>
                                                            <th className="align-center">Viés</th>
                                                            <th className="align-right">Alvo / Taxa</th>
                                                            <th>Gestor Responsável</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        {logsExibidos.map(log => (
                                                            <tr key={log.id} onClick={() => log.bloqueado && abrirModalUpgrade(log.nomeCarteira, log.planoMinimo || 'Premium')} style={{ cursor: log.bloqueado ? 'pointer' : 'default' }}>
                                                                <td style={{ whiteSpace: 'nowrap' }}>{formatarDataHora(log.dataRecomendacao)}</td>
                                                                <td><span className="gestor-cat-tag">{log.nomeCarteira}</span></td>
                                                                <td className="align-center"><span className="gestor-var-tag pos">{log.acao}</span></td>
                                                                <td className="align-center">
                                                                    {log.bloqueado ? (
                                                                        <span className="gestor-muted">Bloqueado</span>
                                                                    ) : (
                                                                        <span className={`gestor-vies-badge vies-${log.vies.toLowerCase()}`}>{log.vies}</span>
                                                                    )}
                                                                </td>
                                                                <td className="align-right tabular-nums">
                                                                    <strong>
                                                                        {log.bloqueado ? 'R$ --,--' : `R$ ${log.precoAlvo.toFixed(2).replace('.', ',')}`}
                                                                    </strong>
                                                                </td>
                                                                <td>{log.nomeGestor}</td>
                                                            </tr>
                                                        ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="gestor-empty-row" style={{ padding: '20px' }}>Ativo citado em relatórios, mas sem movimentação direta de carteira nos filtros atuais.</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* MODAL DE DOSSIÊ DO ATIVO */}
            {ativoModal && (
                <div className="gestor-modal-backdrop" onClick={() => setAtivoModal(null)}>
                    <div className="gestor-modal-dialog" style={{ maxWidth: '1000px' }} onClick={e => e.stopPropagation()}>
                        <div className="gestor-modal-header">
                            <div>
                                <span className="gestor-modal-kicker">Dossiê Completo de Auditoria</span>
                                <h3>{ativoModal.ticker} — {ativoModal.nomeAtivo}</h3>
                            </div>
                            <button className="gestor-modal-close" onClick={() => setAtivoModal(null)}>✕</button>
                        </div>

                        <div className="gestor-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '24px 32px' }}>
                            <div>
                                <h4 style={{ color: 'var(--g-text-main)', marginBottom: '16px', fontSize: '1.1rem' }}>Linha do Tempo de Movimentações</h4>
                                {ativoModal.logs.length === 0 ? (
                                    <p className="gestor-muted">Nenhuma movimentação direta de carteira registrada.</p>
                                ) : (
                                    <div className="gestor-table-container" style={{ border: '1px solid var(--g-border)', borderRadius: '12px' }}>
                                        <table className="gestor-table">
                                            <thead>
                                            <tr>
                                                <th>Data / Hora</th>
                                                <th>Carteira</th>
                                                <th className="align-center">Ação</th>
                                                <th className="align-center">Viés</th>
                                                <th className="align-right">Alvo</th>
                                                <th>Justificativa / Fato Relevante</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {ativoModal.logs.map(log => (
                                                <tr key={log.id}>
                                                    <td style={{ whiteSpace: 'nowrap' }}>{formatarDataHora(log.dataRecomendacao)}</td>
                                                    <td><span className="gestor-cat-tag">{log.nomeCarteira}</span></td>
                                                    <td className="align-center"><strong>{log.acao}</strong></td>
                                                    <td className="align-center">
                                                        {log.bloqueado ? <span className="gestor-muted">🔒</span> : <span className={`gestor-vies-badge vies-${log.vies.toLowerCase()}`}>{log.vies}</span>}
                                                    </td>
                                                    <td className="align-right tabular-nums">
                                                        <strong>{log.bloqueado ? '🔒' : `R$ ${log.precoAlvo.toFixed(2)}`}</strong>
                                                    </td>
                                                    <td style={{ fontSize: '0.8rem', color: 'var(--g-text-secondary)' }}>
                                                        {log.bloqueado ? `Bloqueado (Plano ${log.planoMinimo})` : (log.justificativa || '---')}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 style={{ color: 'var(--g-text-main)', marginBottom: '16px', fontSize: '1.1rem' }}>Relatórios de Research Vinculados</h4>
                                {ativoModal.relatoriosRelacionados.length === 0 ? (
                                    <p className="gestor-muted">Nenhum relatório em PDF publicado para este ativo.</p>
                                ) : (
                                    <div className="gestor-table-container" style={{ border: '1px solid var(--g-border)', borderRadius: '12px' }}>
                                        <table className="gestor-table">
                                            <thead>
                                            <tr>
                                                <th>Data da Publicação</th>
                                                <th>Carteira Vinculada</th>
                                                <th>Assunto</th>
                                                <th>Título do Relatório</th>
                                                <th className="align-center">Acesso</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {ativoModal.relatoriosRelacionados.map(rel => (
                                                <tr key={rel.id}>
                                                    <td style={{ whiteSpace: 'nowrap' }}>{formatarDataHora(rel.dataPublicacao)}</td>
                                                    <td><span className="gestor-cat-tag">{rel.nomeCarteira || 'Geral'}</span></td>
                                                    <td style={{ color: 'var(--g-text-secondary)' }}>{rel.assunto || 'Análise'}</td>
                                                    <td><strong>{rel.titulo}</strong></td>
                                                    <td className="align-center">
                                                        {rel.bloqueado ? (
                                                            <button className="gestor-btn gestor-btn-outline" onClick={() => abrirModalUpgrade(rel.nomeCarteira || 'Carteira', rel.planoMinimo || 'Premium')}>
                                                                🔒 Plano {rel.planoMinimo}
                                                            </button>
                                                        ) : (
                                                            <button className="gestor-btn gestor-btn-primary" onClick={() => { setAtivoModal(null); navigate(`/relatorios?highlight=${rel.id}`); }}>
                                                                Ler PDF
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE UPGRADE */}
            {modalUpgradeAberto && (
                <div className="gestor-modal-backdrop" onClick={() => setModalUpgradeAberto(false)}>
                    <div className="gestor-confirm-box" onClick={e => e.stopPropagation()}>
                        <div className="gestor-confirm-icon" style={{ background: 'var(--g-cyan-soft)', color: 'var(--g-cyan)' }}>
                            🔒
                        </div>
                        <h3>Conteúdo Exclusivo</h3>
                        <p>Este conteúdo pertence à estratégia de <strong>{infoUpgrade.carteira}</strong> (Exclusivo Plano <strong>{infoUpgrade.plano}</strong>). Deseja conhecer nossos planos?</p>
                        <div className="gestor-confirm-actions">
                            <button className="gestor-btn gestor-btn-outline" onClick={() => setModalUpgradeAberto(false)}>Voltar</button>
                            <button className="gestor-btn gestor-btn-primary" onClick={() => navigate('/gerenciar-plano')}>Ver Planos</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}