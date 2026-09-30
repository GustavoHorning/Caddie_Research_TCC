import { useState, useEffect } from 'react';
import SidebarGestor from '../../components/SidebarGestor';
import TopBar from '../../components/TopBar';
import api from '../../services/api';
import './Gestor/PainelGestor.css';

export default function GestorAgenda() {
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);
    const [eventos, setEventos] = useState<any[]>([]);
    const [carregando, setCarregando] = useState(true);

    const [modalAberto, setModalAberto] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [eventoEditando, setEventoEditando] = useState<number | null>(null); 

    const [form, setForm] = useState({
        titulo: '', data: '', hora: '', impacto: '2', linkExterno: '', descricao: ''
    });

    const [toastMsg, setToastMsg] = useState('');
    const [toastTipo, setToastTipo] = useState<'sucesso' | 'erro'>('sucesso');
    const [eventoParaDeletar, setEventoParaDeletar] = useState<number | null>(null);

    const configSeguranca = { headers: { Authorization: `Bearer ${localStorage.getItem('caddie_token')}` } };

    useEffect(() => {
        carregarEventos();
    }, []);

    async function carregarEventos() {
        setCarregando(true);
        try {
            const res = await api.get('/api/calendario');
            const eventosCaddie = res.data.filter((e: any) => e.tipo === 'Caddie');
            setEventos(eventosCaddie);
        } catch (e) {
            console.error("Erro ao carregar agenda", e);
        } finally {
            setCarregando(false);
        }
    }

    const abrirModalEdicao = (evento: any) => {
        setEventoEditando(evento.id);
        setForm({
            titulo: evento.titulo,
            data: evento.dataStr,
            hora: evento.hora,    
            impacto: evento.impacto.toString(),
            linkExterno: evento.link || evento.linkExterno || '',
            descricao: evento.descricao || ''
        });
        setModalAberto(true);
    };

    const abrirModalNovo = () => {
        setEventoEditando(null);
        setForm({ titulo: '', data: '', hora: '', impacto: '2', linkExterno: '', descricao: '' });
        setModalAberto(true);
    };

    const fecharModal = () => {
        setModalAberto(false);
        setEventoEditando(null);
    };

    async function salvarEvento() {
        if (!form.titulo || !form.data || !form.hora) {
            return mostrarNotificacao('Título, data e hora são obrigatórios.', 'erro');
        }

        if (form.hora.length < 5) {
            return mostrarNotificacao('Digite o horário completo (Ex: 19:00).', 'erro');
        }

        setEnviando(true);
        try {
            const dataHoraIso = `${form.data}T${form.hora}:00`;
            const payload = {
                titulo: form.titulo,
                dataHora: dataHoraIso,
                descricao: form.descricao,
                linkExterno: form.linkExterno,
                impacto: parseInt(form.impacto),
                tipo: 'Caddie' 
            };

            if (eventoEditando) {
                await api.put(`/api/calendario/${eventoEditando}`, payload, configSeguranca);
                mostrarNotificacao('Evento atualizado com sucesso!', 'sucesso');
            } else {
                await api.post('/api/calendario/caddie', payload, configSeguranca);
                mostrarNotificacao('Evento publicado com sucesso!', 'sucesso');
            }

            fecharModal();
            carregarEventos();
        } catch {
            mostrarNotificacao(eventoEditando ? 'Erro ao atualizar evento.' : 'Erro ao publicar evento.', 'erro');
        } finally {
            setEnviando(false);
        }
    }

    async function deletarEvento() {
        if (eventoParaDeletar === null) return;

        try {
            await api.delete(`/api/calendario/${eventoParaDeletar}`, configSeguranca);
            mostrarNotificacao('Evento removido.', 'sucesso');
            setEventoParaDeletar(null);
            carregarEventos();
        } catch {
            mostrarNotificacao('Erro ao remover evento.', 'erro');
        }
    }

    const mostrarNotificacao = (msg: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
        setToastMsg(msg); setToastTipo(tipo);
        setTimeout(() => setToastMsg(''), 3000);
    };

    const inpStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', color: '#e6edf3', fontSize: '0.9rem', outline: 'none' };
    const selStyle: React.CSSProperties = { ...inpStyle, cursor: 'pointer' };

    return (
        <div className="dashboard-layout">
            <SidebarGestor activePath="/gestor/agenda" isOpen={menuMobileAberto} onClose={() => setMenuMobileAberto(false)} />
            {menuMobileAberto && <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>}
            <TopBar userName="Gestor" onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />

            <main className="dashboard-main">
                <div className="gestor-content">

                    <div className="gestor-header-title">
                        <h2>Agenda & Eventos da Caddie</h2>
                        <p>Gerencie as lives, calls de rebalanceamento e publicações que aparecem no calendário dos clientes.</p>
                    </div>

                    <div className="gestor-card">
                        <div className="gestor-ativos-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '16px' }}>
                            <div></div>
                            <button className="gestor-btn-novo-ativo" onClick={abrirModalNovo}>
                                + Novo Evento
                            </button>
                        </div>

                        <div className="gestor-tabela-wrapper">
                            <table className="gestor-tabela">
                                <thead>
                                <tr>
                                    <th>Data / Hora</th>
                                    <th>Título do Evento</th>
                                    <th className="td-center">Impacto</th>
                                    <th>Link</th>
                                    <th className="td-center">Ações</th>
                                </tr>
                                </thead>
                                <tbody>
                                {carregando ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>Carregando eventos...</td></tr>
                                ) : eventos.length > 0 ? (
                                    eventos.map(evento => (
                                        <tr key={evento.id}>
                                            <td>
                                                <div style={{ color: '#e6edf3', fontWeight: 500 }}>{evento.dataStr.split('-').reverse().join('/')}</div>
                                                <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '2px' }}>às {evento.hora}</div>
                                            </td>
                                            <td>
                                                <strong style={{ color: '#00B4D8' }}>{evento.titulo}</strong>
                                                {evento.descricao && <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '4px' }}>{evento.descricao}</div>}
                                            </td>
                                            <td className="td-center">
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.05)' }}>
                                                    {evento.impacto} Estrela{evento.impacto > 1 && 's'}
                                                </span>
                                            </td>
                                            <td>
                                                {evento.link ? (
                                                    <a href={evento.link} target="_blank" rel="noopener noreferrer" style={{ color: '#58a6ff', fontSize: '0.85rem', textDecoration: 'none' }}>Acessar Link ↗</a>
                                                ) : '---'}
                                            </td>
                                            <td className="td-center">
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    {/* BOTÃO DE EDITAR (LÁPIS) */}
                                                    <button
                                                        className="btn-acao-svg btn-editar"
                                                        onClick={() => abrirModalEdicao(evento)}
                                                        title="Editar Evento"
                                                        style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', transition: 'color 0.2s' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                                                        onMouseLeave={(e) => e.currentTarget.style.color = '#8b949e'}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                        </svg>
                                                    </button>

                                                    <button
                                                        className="btn-acao-svg btn-remover"
                                                        onClick={() => setEventoParaDeletar(evento.id)}
                                                        title="Remover Evento"
                                                        style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', transition: 'color 0.2s' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.color = '#ff6b6b'}
                                                        onMouseLeave={(e) => e.currentTarget.style.color = '#8b949e'}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>Nenhum evento da Caddie programado.</td></tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {modalAberto && (
                    <div className="gestor-modal-overlay" onClick={fecharModal}>
                        <div className="gestor-modal-box" style={{ width: 500, maxWidth: '95vw', background: '#161b22', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }} onClick={e => e.stopPropagation()}>
                            <h3 style={{ margin: 0, color: '#e6edf3', fontSize: '1.05rem' }}>
                                📅 {eventoEditando ? 'Editar Evento Caddie' : 'Novo Evento Caddie'}
                            </h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                {[
                                    { label: 'Título do Evento', col: '1/-1', el: <input style={inpStyle} type="text" placeholder="Ex: Live de Rebalanceamento" value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} /> },
                                    { label: 'Data', el: <input style={inpStyle} type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} /> },
                                    { label: 'Hora (Ex: 19:00)',
                                        el: <input
                                            style={inpStyle}
                                            type="text"
                                            maxLength={5}
                                            placeholder="19:00"
                                            value={form.hora}
                                            onChange={e => {
                                                let valor = e.target.value.replace(/\D/g, '');
                                                if (valor.length > 4) valor = valor.slice(0, 4);

                                                if (valor.length > 2) {
                                                    valor = valor.slice(0, 2) + ':' + valor.slice(2);
                                                }

                                                setForm(p => ({ ...p, hora: valor }));
                                            }}
                                        /> },
                                    { label: 'Impacto (1 a 3)', el: <select style={selStyle} value={form.impacto} onChange={e => setForm(p => ({ ...p, impacto: e.target.value }))}>
                                            <option value="1" style={{ background: '#161b22', color: '#e6edf3' }}>Baixo (1)</option>
                                            <option value="2" style={{ background: '#161b22', color: '#e6edf3' }}>Médio (2)</option>
                                            <option value="3" style={{ background: '#161b22', color: '#e6edf3' }}>Alto (3)</option>
                                        </select> },
                                    { label: 'Link (YouTube/Zoom/PDF)', col: '1/-1', el: <input style={inpStyle} type="text" placeholder="https://..." value={form.linkExterno} onChange={e => setForm(p => ({ ...p, linkExterno: e.target.value }))} /> },
                                    { label: 'Descrição (opcional)', col: '1/-1', el: <input style={inpStyle} type="text" placeholder="Breve resumo..." value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} /> },
                                ].map(({ label, col, el }) => (
                                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: col }}>
                                        <label style={{ fontSize: '0.8rem', color: '#8b949e' }}>{label}</label>
                                        {el}
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                                <button className="gestor-btn-novo-ativo" onClick={salvarEvento} disabled={enviando}>
                                    {enviando ? 'Salvando...' : eventoEditando ? 'Salvar Alterações' : 'Publicar Evento'}
                                </button>
                                <button className="gestor-btn-cancelar" onClick={fecharModal}>Cancelar</button>
                            </div>
                        </div>
                    </div>
                )}

                {eventoParaDeletar !== null && (
                    <div className="gestor-modal-overlay" onClick={() => setEventoParaDeletar(null)}>
                        <div className="gestor-modal-box" style={{ width: 400, maxWidth: '90vw', background: '#161b22', borderRadius: 16, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                            <div style={{ background: 'rgba(218, 54, 51, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#da3633" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </div>
                            <h3 style={{ margin: 0, color: '#e6edf3', fontSize: '1.2rem' }}>Excluir Evento</h3>
                            <p style={{ margin: 0, color: '#8b949e', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                Tem certeza que deseja remover este evento da agenda? Esta ação não poderá ser desfeita.
                            </p>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 }}>
                                <button
                                    className="gestor-btn-cancelar"
                                    onClick={() => setEventoParaDeletar(null)}
                                    style={{ flex: 1, padding: '10px 0' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={deletarEvento}
                                    style={{ flex: 1, background: '#da3633', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 0', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#b32624'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#da3633'}
                                >
                                    Sim, excluir
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {toastMsg && <div className={`gestor-toast toast-${toastTipo}`}>{toastMsg}</div>}
        </div>
    );
}