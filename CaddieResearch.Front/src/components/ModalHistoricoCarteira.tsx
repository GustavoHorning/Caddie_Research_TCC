import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './ModalHistoricoCarteira.css';

interface LogAcao {
    id: number;
    acao: string;
    vies: string;
    precoAlvo: number;
    justificativa: string;
    dataRecomendacao: string;
    nomeGestor: string;
}

interface Relatorio {
    id: number;
    titulo: string;
    dataPublicacao: string;
}

interface HistoricoAtivo {
    ticker: string;
    nomeAtivo: string;
    logs: LogAcao[];
    relatoriosRelacionados: Relatorio[];
}

interface Props {
    carteiraId: number;
    carteiraNome: string;
    tickerInicial?: string; // Permite abrir o modal focado em 1 ativo específico da carteira!
    onClose: () => void;
}

export default function ModalHistoricoCarteira({ carteiraId, carteiraNome, tickerInicial = 'Todos', onClose }: Props) {
    const [historicoAgrupado, setHistoricoAgrupado] = useState<HistoricoAtivo[]>([]);
    const [tickerSelecionado, setTickerSelecionado] = useState<string>(tickerInicial);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        setTickerSelecionado(tickerInicial);
        carregarHistorico();
    }, [carteiraId, tickerInicial]);

    const carregarHistorico = async () => {
        try {
            const token = localStorage.getItem('caddie_token');
            const res = await api.get(`/api/historico-carteiras/${carteiraId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistoricoAgrupado(res.data);
        } catch (error: any) {
            if (error.response?.status === 403) {
                setErro("Seu plano atual não permite acessar esta auditoria.");
            } else {
                setErro("Erro ao carregar histórico.");
            }
        } finally {
            setCarregando(false);
        }
    };

    const formatarDataHora = (dataIso: string) => {
        if (!dataIso) return '--/--/----';
        const isoUtc = dataIso.endsWith('Z') || dataIso.includes('+') ? dataIso : `${dataIso}Z`;
        const d = new Date(isoUtc);
        const data = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
        return `${data} às ${hora}`;
    };

    const ativosExibidos = tickerSelecionado === 'Todos'
        ? historicoAgrupado
        : historicoAgrupado.filter(a => a.ticker === tickerSelecionado);

    return (
        <div className="modal-hc-overlay" onClick={onClose}>
            <div className="modal-hc-content" onClick={e => e.stopPropagation()}>
                <div className="modal-hc-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
                    <h3>
                        {tickerSelecionado !== 'Todos' 
                            ? `Histórico do Ativo: ${tickerSelecionado} (${carteiraNome})` 
                            : `Auditoria de Recomendações: ${carteiraNome}`}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {historicoAgrupado.length > 0 && (
                            <select 
                                value={tickerSelecionado} 
                                onChange={e => setTickerSelecionado(e.target.value)}
                                style={{ background: '#0d1117', color: '#e6edf3', border: '1px solid #30363d', padding: '6px 10px', borderRadius: '6px', fontSize: '0.85rem' }}
                            >
                                <option value="Todos">Todos os Ativos ({historicoAgrupado.length})</option>
                                {historicoAgrupado.map(a => (
                                    <option key={a.ticker} value={a.ticker}>{a.ticker} - {a.nomeAtivo}</option>
                                ))}
                            </select>
                        )}
                        <button className="modal-hc-fechar" onClick={onClose}>✕</button>
                    </div>
                </div>
                <div className="modal-hc-body">
                    {carregando ? (
                        <div className="hc-mensagem">Carregando log imutável...</div>
                    ) : erro ? (
                        <div className="hc-mensagem erro">{erro}</div>
                    ) : ativosExibidos.length === 0 ? (
                        <div className="hc-mensagem">Nenhuma alteração registrada para este filtro nesta carteira.</div>
                    ) : (
                        <div className="hc-ativos-lista">
                            {ativosExibidos.map(ativo => (
                                <div key={ativo.ticker} className="hc-ativo-card">
                                    <div className="hc-ativo-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4>{ativo.ticker} <span>{ativo.nomeAtivo}</span></h4>
                                        {tickerSelecionado === 'Todos' && (
                                            <button 
                                                onClick={() => setTickerSelecionado(ativo.ticker)}
                                                style={{ background: 'none', border: '1px solid rgba(88,166,255,0.3)', color: '#58a6ff', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                                            >
                                                Focar neste ativo
                                            </button>
                                        )}
                                    </div>
                                    <div className="hc-ativo-timeline">
                                        <table className="hc-table">
                                            <thead>
                                                <tr>
                                                    <th>Data / Hora</th>
                                                    <th>Ação</th>
                                                    <th>Viés</th>
                                                    <th>Alvo</th>
                                                    <th>Gestor</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ativo.logs.map(log => (
                                                    <tr key={log.id}>
                                                        <td>{formatarDataHora(log.dataRecomendacao)}</td>
                                                        <td><span className={`hc-acao-badge hc-acao-${log.acao}`}>{log.acao}</span></td>
                                                        <td><span className={`hc-vies-badge hc-vies-${log.vies}`}>{log.vies}</span></td>
                                                        <td>R$ {log.precoAlvo.toFixed(2).replace('.', ',')}</td>
                                                        <td>{log.nomeGestor}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {ativo.relatoriosRelacionados.length > 0 && (
                                        <div className="hc-relatorios-box">
                                            <strong>Relatórios Associados:</strong>
                                            <ul>
                                                {ativo.relatoriosRelacionados.map(rel => (
                                                    <li 
                                                        key={rel.id}
                                                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                        onClick={() => {
                                                            onClose();
                                                            navigate(`/relatorios?highlight=${rel.id}`);
                                                        }}
                                                    >
                                                        📄 {rel.titulo} <span>({new Date(rel.dataPublicacao).toLocaleDateString('pt-BR')})</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}