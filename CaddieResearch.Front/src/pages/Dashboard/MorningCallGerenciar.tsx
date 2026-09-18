import { useEffect, useState } from 'react';
import api from '../../services/api';
import SidebarGestor from '../../components/SidebarGestor';
import TopBar from '../../components/TopBar';
import '../../components/DashboardLayout.css';
import './Gestor/PainelGestor.css';
import './MorningCall.css';

interface Topico {
    id: number;
    titulo: string;
    texto: string;
    link: string | null;
    imagemUrl: string | null;
}

interface MorningCallItem {
    id: number;
    titulo: string;
    data: string;
    topicos: Topico[];
}

// Estrutura do tópico usada dentro do formulário de edição (permite tópico novo, sem id)
interface TopicoEdicao {
    id: number | null;
    titulo: string;
    texto: string;
    link: string;
    imagemUrl: string;
    imagemArquivo: File | null;
}

function novoTopicoEdicao(): TopicoEdicao {
    return { id: null, titulo: '', texto: '', link: '', imagemUrl: '', imagemArquivo: null };
}

function formatarData(dataIso: string): string {
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR');
}

function formatarDataInput(dataIso: string): string {
    return dataIso.slice(0, 10);
}

export default function MorningCallGerenciar() {
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);
    const [morningCalls, setMorningCalls] = useState<MorningCallItem[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [excluindoTopico, setExcluindoTopico] = useState<number | null>(null);
    const [excluindoMorningCall, setExcluindoMorningCall] = useState<number | null>(null);
    const [confirmacao, setConfirmacao] = useState<{ tipo: 'topico' | 'morningcall'; morningCallId: number; topicoId?: number; label: string } | null>(null);

    // ---------- Estado do modal de edição ----------
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [edTitulo, setEdTitulo] = useState('');
    const [edData, setEdData] = useState('');
    const [edTopicos, setEdTopicos] = useState<TopicoEdicao[]>([]);
    const [salvandoEdicao, setSalvandoEdicao] = useState(false);
    const [erroEdicao, setErroEdicao] = useState('');

    const configSeguranca = { headers: { Authorization: `Bearer ${localStorage.getItem('caddie_token')}` } };

    async function carregarMeusMorningCalls() {
        setCarregando(true);
        try {
            const response = await api.get('/api/morningcall/meus', configSeguranca);
            setMorningCalls(response.data);
        } catch (error) {
            console.error('Erro ao carregar Morning Calls', error);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        carregarMeusMorningCalls();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function excluirTopico(morningCallId: number, topicoId: number) {
        setExcluindoTopico(topicoId);
        try {
            await api.delete(`/api/morningcall/${morningCallId}/topicos/${topicoId}`, configSeguranca);
            setMorningCalls(prev => prev.map(mc =>
                mc.id === morningCallId
                    ? { ...mc, topicos: mc.topicos.filter(t => t.id !== topicoId) }
                    : mc
            ));
        } catch (error) {
            console.error('Erro ao excluir notícia', error);
        } finally {
            setExcluindoTopico(null);
            setConfirmacao(null);
        }
    }

    async function excluirMorningCall(morningCallId: number) {
        setExcluindoMorningCall(morningCallId);
        try {
            await api.delete(`/api/morningcall/${morningCallId}`, configSeguranca);
            setMorningCalls(prev => prev.filter(mc => mc.id !== morningCallId));
        } catch (error) {
            console.error('Erro ao excluir Morning Call', error);
        } finally {
            setExcluindoMorningCall(null);
            setConfirmacao(null);
        }
    }

    function confirmarAcao() {
        if (!confirmacao) return;
        if (confirmacao.tipo === 'topico' && confirmacao.topicoId) {
            excluirTopico(confirmacao.morningCallId, confirmacao.topicoId);
        } else if (confirmacao.tipo === 'morningcall') {
            excluirMorningCall(confirmacao.morningCallId);
        }
    }

    // ---------- Edição ----------

    function abrirEdicao(mc: MorningCallItem) {
        setEditandoId(mc.id);
        setEdTitulo(mc.titulo);
        setEdData(formatarDataInput(mc.data));
        setEdTopicos(mc.topicos.map(t => ({
            id: t.id,
            titulo: t.titulo,
            texto: t.texto,
            link: t.link || '',
            imagemUrl: t.imagemUrl || '',
            imagemArquivo: null
        })));
        setErroEdicao('');
    }

    function fecharEdicao() {
        setEditandoId(null);
        setEdTopicos([]);
        setErroEdicao('');
    }

    function edAdicionarTopico() {
        setEdTopicos([...edTopicos, novoTopicoEdicao()]);
    }

    function edRemoverTopico(index: number) {
        setEdTopicos(edTopicos.filter((_, i) => i !== index));
    }

    function edAtualizarTopico(index: number, campo: 'titulo' | 'texto' | 'link', valor: string) {
        const novos = [...edTopicos];
        novos[index][campo] = valor;
        setEdTopicos(novos);
    }

    function edHandleImagemArquivo(index: number, event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        const novos = [...edTopicos];
        novos[index].imagemArquivo = file;
        novos[index].imagemUrl = previewUrl;
        setEdTopicos(novos);
    }

    function edHandleImagemUrl(index: number, valor: string) {
        const novos = [...edTopicos];
        novos[index].imagemUrl = valor;
        novos[index].imagemArquivo = null;
        setEdTopicos(novos);
    }

    function edRemoverImagem(index: number) {
        const novos = [...edTopicos];
        novos[index].imagemUrl = '';
        novos[index].imagemArquivo = null;
        setEdTopicos(novos);
    }

    async function salvarEdicao() {
        if (!editandoId) return;

        if (!edTitulo.trim()) {
            setErroEdicao('Preencha o título do Morning Call.');
            return;
        }
        if (edTopicos.some(t => !t.titulo.trim() || !t.texto.trim())) {
            setErroEdicao('Preencha título e texto em todos os tópicos.');
            return;
        }

        setSalvandoEdicao(true);
        setErroEdicao('');

        const topicosParaEnviar = edTopicos.map(t => ({
            id: t.id,
            titulo: t.titulo,
            texto: t.texto,
            link: t.link,
            imagemUrlExistente: t.imagemArquivo ? null : (t.imagemUrl || null),
        }));

        const formData = new FormData();
        formData.append('titulo', edTitulo);
        formData.append('data', edData);
        formData.append('topicosJson', JSON.stringify(topicosParaEnviar));

        edTopicos.forEach((t, i) => {
            if (t.imagemArquivo) {
                formData.append(`imagem_${i}`, t.imagemArquivo);
            }
        });

        try {
            await api.put(`/api/morningcall/${editandoId}`, formData, {
                headers: { ...configSeguranca.headers, 'Content-Type': 'multipart/form-data' },
            });

            // Recarrega do servidor para garantir ids e dados corretos (ex: tópicos novos)
            await carregarMeusMorningCalls();
            fecharEdicao();
        } catch (error) {
            console.error('Erro ao editar Morning Call', error);
            setErroEdicao('Ocorreu um erro ao salvar as alterações.');
        } finally {
            setSalvandoEdicao(false);
        }
    }

    return (
        <div className="dashboard-layout">
            <SidebarGestor activePath="/gestor/morning-call/gerenciar" isOpen={menuMobileAberto} onClose={() => setMenuMobileAberto(false)} />
            {menuMobileAberto && <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>}

            <TopBar userName="Gestor" onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />

            <main className="dashboard-main">
                <div className="gestor-content">
                    <div className="gestor-header-title">
                        <h2>Gerenciar Morning Call</h2>
                        <p>Edite ou remova notícias e Morning Calls já publicados</p>
                    </div>

                    <div className="gestor-card" style={{ marginTop: '32px' }}>
                        {carregando ? (
                            <p style={{ color: '#8b949e', textAlign: 'center', padding: '40px 0' }}>Carregando...</p>
                        ) : morningCalls.length === 0 ? (
                            <p style={{ color: '#8b949e', textAlign: 'center', padding: '40px 0' }}>
                                Você ainda não publicou nenhum Morning Call.
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {morningCalls.map(mc => (
                                    <div key={mc.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
                                            <div>
                                                <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: '0 0 4px' }}>{mc.titulo}</h3>
                                                <span style={{ color: '#8b949e', fontSize: '0.82rem' }}>{formatarData(mc.data)} · {mc.topicos.length} notícia(s)</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                                <button
                                                    onClick={() => abrirEdicao(mc)}
                                                    style={{
                                                        background: 'rgba(0, 180, 216, 0.1)', border: '1px solid rgba(0, 180, 216, 0.3)',
                                                        color: '#00B4D8', borderRadius: '8px', padding: '8px 14px',
                                                        fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    ✏️ Editar
                                                </button>
                                                <button
                                                    onClick={() => setConfirmacao({ tipo: 'morningcall', morningCallId: mc.id, label: mc.titulo })}
                                                    disabled={excluindoMorningCall === mc.id}
                                                    style={{
                                                        background: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)',
                                                        color: '#f44336', borderRadius: '8px', padding: '8px 14px',
                                                        fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {excluindoMorningCall === mc.id ? 'Excluindo...' : '🗑️ Excluir'}
                                                </button>
                                            </div>
                                        </div>

                                        {mc.topicos.length === 0 ? (
                                            <p style={{ color: '#6e7681', fontSize: '0.85rem' }}>Nenhuma notícia neste Morning Call.</p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {mc.topicos.map(topico => (
                                                    <div key={topico.id} style={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                                                        background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px 14px'
                                                    }}>
                                                        <div style={{ minWidth: 0 }}>
                                                            <strong style={{ color: '#e6edf3', fontSize: '0.9rem', display: 'block' }}>{topico.titulo}</strong>
                                                            <span style={{ color: '#8b949e', fontSize: '0.78rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {topico.texto}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => setConfirmacao({ tipo: 'topico', morningCallId: mc.id, topicoId: topico.id, label: topico.titulo })}
                                                            disabled={excluindoTopico === topico.id}
                                                            style={{
                                                                background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                                                                color: '#8b949e', borderRadius: '6px', padding: '6px 10px',
                                                                fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0
                                                            }}
                                                        >
                                                            {excluindoTopico === topico.id ? '...' : '✕ Remover'}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modal de confirmação de exclusão */}
            {confirmacao && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
                }} onClick={() => setConfirmacao(null)}>
                    <div
                        style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ color: '#fff', margin: '0 0 8px' }}>
                            {confirmacao.tipo === 'topico' ? 'Remover notícia?' : 'Excluir Morning Call?'}
                        </h3>
                        <p style={{ color: '#8b949e', fontSize: '0.9rem', margin: '0 0 20px' }}>
                            {confirmacao.tipo === 'topico'
                                ? <>Tem certeza que deseja remover "<strong style={{ color: '#e6edf3' }}>{confirmacao.label}</strong>"? Essa ação não pode ser desfeita.</>
                                : <>Tem certeza que deseja excluir "<strong style={{ color: '#e6edf3' }}>{confirmacao.label}</strong>" e todas as suas notícias? Essa ação não pode ser desfeita.</>}
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setConfirmacao(null)}
                                style={{ background: 'rgba(255,255,255,0.06)', color: '#8b949e', border: 'none', borderRadius: '8px', padding: '9px 16px', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarAcao}
                                style={{ background: '#f44336', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 16px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Sim, excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de edição */}
            {editandoId !== null && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 200,
                    overflowY: 'auto', padding: '40px 20px'
                }} onClick={fecharEdicao}>
                    <div
                        style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', maxWidth: '640px', width: '100%' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ color: '#fff', margin: 0 }}>Editar Morning Call</h3>
                            <button
                                onClick={fecharEdicao}
                                style={{ background: 'transparent', border: 'none', color: '#8b949e', fontSize: '1.2rem', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        {erroEdicao && (
                            <div className="mc-mensagem mc-mensagem-erro">{erroEdicao}</div>
                        )}

                        <div className="mc-field">
                            <label>Data</label>
                            <input type="date" value={edData} onChange={e => setEdData(e.target.value)} />
                        </div>

                        <div className="mc-field">
                            <label>Título do Morning Call</label>
                            <input type="text" value={edTitulo} onChange={e => setEdTitulo(e.target.value)} />
                        </div>

                        <div className="mc-divider"></div>
                        <div className="mc-section-label">Tópicos de notícia</div>

                        {edTopicos.map((topico, index) => (
                            <div className="mc-topico" key={topico.id ?? `novo-${index}`}>
                                <div className="mc-topico-head">
                                    <span>Tópico {index + 1}</span>
                                    {edTopicos.length > 1 && (
                                        <button className="mc-remove" onClick={() => edRemoverTopico(index)}>
                                            Remover
                                        </button>
                                    )}
                                </div>

                                <div className="mc-imagem-field">
                                    {topico.imagemUrl ? (
                                        <div className="mc-imagem-preview-wrap">
                                            <img src={topico.imagemUrl} alt="Prévia da imagem da notícia" className="mc-imagem-preview" />
                                            <button type="button" className="mc-imagem-remover" onClick={() => edRemoverImagem(index)}>
                                                ✖ Remover imagem
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="mc-imagem-upload">
                                            <span>🖼️ Clique para enviar uma imagem</span>
                                            <input
                                                type="file"
                                                accept="image/png, image/jpeg, image/webp"
                                                style={{ display: 'none' }}
                                                onChange={e => edHandleImagemArquivo(index, e)}
                                            />
                                        </label>
                                    )}

                                    <div className="mc-imagem-ou">ou</div>

                                    <input
                                        type="text"
                                        placeholder="Colar URL de uma imagem (https://...)"
                                        value={topico.imagemArquivo ? '' : topico.imagemUrl}
                                        onChange={e => edHandleImagemUrl(index, e.target.value)}
                                        disabled={!!topico.imagemArquivo}
                                    />
                                </div>

                                <input
                                    type="text"
                                    placeholder="Título da notícia"
                                    value={topico.titulo}
                                    onChange={e => edAtualizarTopico(index, 'titulo', e.target.value)}
                                />
                                <textarea
                                    placeholder="Escreva o resumo da notícia..."
                                    value={topico.texto}
                                    onChange={e => edAtualizarTopico(index, 'texto', e.target.value)}
                                    rows={3}
                                />
                                <input
                                    type="text"
                                    placeholder="Link da notícia original (https://...)"
                                    value={topico.link}
                                    onChange={e => edAtualizarTopico(index, 'link', e.target.value)}
                                />
                            </div>
                        ))}

                        <button className="mc-add-topico" onClick={edAdicionarTopico}>
                            + Adicionar tópico
                        </button>

                        <div className="mc-actions">
                            <button className="mc-btn-cancel" onClick={fecharEdicao} disabled={salvandoEdicao}>
                                Cancelar
                            </button>
                            <button className="mc-btn-publish" onClick={salvarEdicao} disabled={salvandoEdicao}>
                                {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}