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
            mostrarNotificacao('Evento removido com sucesso.', 'sucesso');
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

    return (
        <div className="dashboard-layout">
            <SidebarGestor activePath="/gestor/agenda" isOpen={menuMobileAberto} onClose={() => setMenuMobileAberto(false)} />
            {menuMobileAberto && <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>}
            <TopBar userName="Gestor" onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />

            <main className="dashboard-main">
                <div className="gestor-page">

                    <header className="gestor-hero">
                        <div className="gestor-hero-left">
                            <div className="gestor-kicker-row">
                                <span className="gestor-kicker-badge">Comunicação e Cronograma</span>
                            </div>
                            <h1 className="gestor-title">Agenda & Eventos da Caddie</h1>
                            <p className="gestor-subtitle">Gerencie as lives, calls de rebalanceamento e publicações que aparecem no calendário dos clientes.</p>
                        </div>
                    </header>

                    <div className="gestor-panel">
                        <div className="gestor-toolbar">
                            <div className="gestor-toolbar-left"></div>
                            <button className="gestor-btn gestor-btn-primary" onClick={abrirModalNovo}>
                                + Novo Evento
                            </button>
                        </div>

                        <div className="gestor-table-container">
                            <table className="gestor-table">
                                <thead>
                                <tr>
                                    <th>Data / Hora</th>
                                    <th>Título do Evento</th>
                                    <th className="align-center">Impacto / Relevância</th>
                                    <th>Link da Transmissão</th>
                                    <th className="align-center">Ações</th>
                                </tr>
                                </thead>
                                <tbody>
                                {carregando ? (
                                    <tr><td colSpan={5} className="gestor-empty-row">Sincronizando eventos da agenda...</td></tr>
                                ) : eventos.length > 0 ? (
                                    eventos.map(evento => (
                                        <tr key={evento.id}>
                                            <td data-label="Data / Hora">
                                                <div className="gestor-secondary-cell">
                                                    <strong>{evento.dataStr.split('-').reverse().join('/')}</strong>
                                                    <span>às {evento.hora}</span>
                                                </div>
                                            </td>
                                            <td data-label="Título">
                                                <div className="gestor-secondary-cell">
                                                    <strong className="text-cyan">{evento.titulo}</strong>
                                                    {evento.descricao && <span>{evento.descricao}</span>}
                                                </div>
                                            </td>
                                            <td className="align-center" data-label="Impacto">
                                                <div style={{ display: 'inline-flex', gap: '3px', alignItems: 'flex-end', height: '14px' }} title={`Relevância: ${evento.impacto}`}>
                                                    <span style={{ width: '5px', height: '6px', borderRadius: '1px', background: evento.impacto >= 1 ? 'var(--g-cyan)' : 'var(--g-border-strong)' }}></span>
                                                    <span style={{ width: '5px', height: '10px', borderRadius: '1px', background: evento.impacto >= 2 ? 'var(--g-cyan)' : 'var(--g-border-strong)' }}></span>
                                                    <span style={{ width: '5px', height: '14px', borderRadius: '1px', background: evento.impacto >= 3 ? 'var(--g-cyan)' : 'var(--g-border-strong)' }}></span>
                                                </div>
                                            </td>
                                            <td data-label="Link">
                                                {evento.link || evento.linkExterno ? (
                                                    <a href={evento.link || evento.linkExterno} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--g-cyan)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>Acessar Sala ↗</a>
                                                ) : <span className="gestor-muted">---</span>}
                                            </td>
                                            <td className="align-center" data-label="Ações">
                                                <div className="gestor-actions-cell">
                                                    <button className="gestor-icon-btn edit" onClick={() => abrirModalEdicao(evento)} title="Editar Evento">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                    </button>
                                                    <button className="gestor-icon-btn delete" onClick={() => setEventoParaDeletar(evento.id)} title="Remover Evento">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="gestor-empty-row">
                                            <div className="gestor-empty-box">
                                                <strong>Nenhum evento programado.</strong>
                                                <span>Clique em "+ Novo Evento" para agendar a sua próxima Live.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* MODAL DE CADASTRO DE EVENTO */}
                {modalAberto && (
                    <div className="gestor-modal-backdrop" onClick={fecharModal}>
                        <div className="gestor-modal-dialog" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                            <div className="gestor-modal-header">
                                <div>
                                    <span className="gestor-modal-kicker">Gestão de Cronograma</span>
                                    <h3>{eventoEditando ? 'Editar Agendamento' : 'Programar Novo Evento'}</h3>
                                </div>
                                <button className="gestor-modal-close" onClick={fecharModal}>✕</button>
                            </div>

                            <div className="gestor-modal-body" style={{ gridTemplateColumns: '1fr', padding: '24px 32px' }}>
                                <div className="gestor-form-column">
                                    <div className="gestor-field-row">
                                        <div className="gestor-field" style={{ flex: '1 1 100%' }}>
                                            <label>Título do Evento</label>
                                            <input
                                                type="text"
                                                placeholder="Ex: Live de Rebalanceamento"
                                                value={form.titulo}
                                                onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="gestor-field-row">
                                        <div className="gestor-field">
                                            <label>Data</label>
                                            <input
                                                type="date"
                                                value={form.data}
                                                onChange={e => setForm(p => ({ ...p, data: e.target.value }))}
                                            />
                                        </div>
                                        <div className="gestor-field">
                                            <label>Hora (Ex: 19:00)</label>
                                            <input
                                                type="text"
                                                maxLength={5}
                                                placeholder="19:00"
                                                value={form.hora}
                                                onChange={e => {
                                                    let valor = e.target.value.replace(/\D/g, '');
                                                    if (valor.length > 4) valor = valor.slice(0, 4);
                                                    if (valor.length > 2) valor = valor.slice(0, 2) + ':' + valor.slice(2);
                                                    setForm(p => ({ ...p, hora: valor }));
                                                }}
                                            />
                                        </div>
                                        <div className="gestor-field">
                                            <label>Impacto / Grau (1 a 3)</label>
                                            <select value={form.impacto} onChange={e => setForm(p => ({ ...p, impacto: e.target.value }))}>
                                                <option value="1">Baixo (1)</option>
                                                <option value="2">Médio (2)</option>
                                                <option value="3">Alto (3)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="gestor-field-row">
                                        <div className="gestor-field" style={{ flex: '1 1 100%' }}>
                                            <label>Link (YouTube / Zoom)</label>
                                            <input
                                                type="text"
                                                placeholder="https://..."
                                                value={form.linkExterno}
                                                onChange={e => setForm(p => ({ ...p, linkExterno: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="gestor-field-row">
                                        <div className="gestor-field" style={{ flex: '1 1 100%' }}>
                                            <label>Descrição Opcional</label>
                                            <input
                                                type="text"
                                                placeholder="Breve resumo..."
                                                value={form.descricao}
                                                onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="gestor-modal-footer">
                                <button className="gestor-btn gestor-btn-outline" onClick={fecharModal} disabled={enviando}>Cancelar</button>
                                <button className="gestor-btn gestor-btn-primary" onClick={salvarEvento} disabled={enviando}>
                                    {enviando ? 'A guardar...' : (eventoEditando ? 'Salvar Alterações' : 'Publicar Evento')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL DE EXCLUSÃO DE EVENTO */}
                {eventoParaDeletar !== null && (
                    <div className="gestor-modal-backdrop" onClick={() => setEventoParaDeletar(null)}>
                        <div className="gestor-confirm-box" onClick={e => e.stopPropagation()}>
                            <div className="gestor-confirm-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </div>
                            <h3>Cancelar Evento</h3>
                            <p>Tem a certeza de que deseja apagar este evento da agenda? O link deixará de estar disponível aos clientes.</p>
                            <div className="gestor-confirm-actions">
                                <button className="gestor-btn gestor-btn-outline" onClick={() => setEventoParaDeletar(null)}>Manter Evento</button>
                                <button className="gestor-btn gestor-btn-danger" onClick={deletarEvento}>Sim, excluir</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {toastMsg && <div className={`gestor-toast toast-${toastTipo}`}>{toastMsg}</div>}
        </div>
    );
}