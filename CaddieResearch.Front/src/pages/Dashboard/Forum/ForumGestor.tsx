import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import SidebarGestor from '../../../components/SidebarGestor';
import TopBar from '../../../components/TopBar';
import { AutorInfo, IconeCurtir, IconeResposta } from './forumComum';
import { formatarDataHora, mensagemErro, type ForumAutor } from './forumUtils';
import '../../../components/DashboardLayout.css';
import './Forum.css';

interface Chamado {
    id: number;
    titulo: string;
    conteudo: string;
    categoria: string;
    status: string;
    motivoRecusa: string | null;
    dataCriacao: string;
    dataModeracao: string | null;
    autor: ForumAutor;
    totalRespostas: number;
    totalCurtidas: number;
}

const ABAS = [
    { status: 'Pendente', rotulo: 'Pendentes' },
    { status: 'Publicado', rotulo: 'Publicados' },
    { status: 'Recusado', rotulo: 'Recusados' },
];

export default function ForumGestor() {
    const navigate = useNavigate();
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);
    const [status, setStatus] = useState('Pendente');
    const [chamados, setChamados] = useState<Chamado[]>([]);
    const [contagem, setContagem] = useState<Record<string, number>>({});
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [processando, setProcessando] = useState<number | null>(null);
    const [recusando, setRecusando] = useState<Chamado | null>(null);
    const [motivo, setMotivo] = useState('');
    const [toast, setToast] = useState('');

    function mostrarToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    }

    const carregar = useCallback(async () => {
        setCarregando(true);
        setErro('');
        try {
            const res = await api.get('/api/forum/chamados', { params: { status } });
            setChamados(res.data.chamados);
            setContagem(res.data.contagem);
        } catch {
            setErro('Não foi possível carregar os chamados do fórum.');
        } finally {
            setCarregando(false);
        }
    }, [status]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        carregar();
    }, [carregar]);

    async function aprovar(c: Chamado) {
        setProcessando(c.id);
        try {
            await api.post(`/api/forum/topicos/${c.id}/aprovar`);
            mostrarToast('Tópico publicado. O autor foi notificado.');
            await carregar();
        } catch (error) {
            setErro(mensagemErro(error, 'Não foi possível aprovar o tópico.'));
        } finally {
            setProcessando(null);
        }
    }

    async function confirmarRecusa() {
        if (!recusando) return;
        setProcessando(recusando.id);
        try {
            await api.post(`/api/forum/topicos/${recusando.id}/recusar`, { motivo });
            setRecusando(null);
            setMotivo('');
            mostrarToast('Tópico recusado. O autor foi notificado com o motivo.');
            await carregar();
        } catch (error) {
            setErro(mensagemErro(error, 'Não foi possível recusar o tópico.'));
        } finally {
            setProcessando(null);
        }
    }

    async function excluir(c: Chamado) {
        if (!window.confirm(`Excluir o tópico "${c.titulo}" e todas as respostas?`)) return;
        setProcessando(c.id);
        try {
            await api.delete(`/api/forum/topicos/${c.id}`);
            mostrarToast('Tópico excluído.');
            await carregar();
        } catch (error) {
            setErro(mensagemErro(error, 'Não foi possível excluir o tópico.'));
        } finally {
            setProcessando(null);
        }
    }

    return (
        <div className="dashboard-layout">
            <SidebarGestor activePath="/gestor/forum" isOpen={menuMobileAberto} onClose={() => setMenuMobileAberto(false)} />
            {menuMobileAberto && <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>}
            <TopBar userName="Gestor" onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />

            <main className="dashboard-main">
                <div className="fr-page">
                    <div className="fr-header">
                        <div>
                            <h1 className="fr-titulo">Fórum — Chamados</h1>
                            <p className="fr-subtitulo">Revise os tópicos enviados pelos membros e decida o que fica público para a comunidade.</p>
                        </div>
                    </div>

                    <div className="fr-abas">
                        {ABAS.map(a => (
                            <button key={a.status} className={`fr-aba ${status === a.status ? 'ativa' : ''}`} onClick={() => setStatus(a.status)}>
                                {a.rotulo}
                                <span className="fr-contador">{contagem[a.status] ?? 0}</span>
                            </button>
                        ))}
                    </div>

                    {erro && <div className="fr-erro-msg">{erro}</div>}

                    {carregando ? (
                        <div className="fr-vazio">Carregando...</div>
                    ) : chamados.length === 0 ? (
                        <div className="fr-vazio">
                            {status === 'Pendente' ? 'Nenhum chamado pendente. Tudo em dia!' : 'Nenhum tópico nesta lista.'}
                        </div>
                    ) : (
                        <div className="fr-lista">
                            {chamados.map(c => (
                                <div key={c.id} className="fr-card">
                                    <div className="fr-resposta-rodape" style={{ marginTop: 0, alignItems: 'flex-start' }}>
                                        <AutorInfo autor={c.autor} data={`enviado em ${formatarDataHora(c.dataCriacao)}`} />
                                        <span className="fr-categoria">{c.categoria}</span>
                                    </div>

                                    <h2 className="fr-card-titulo">{c.titulo}</h2>
                                    <p className="fr-detalhe-texto" style={{ fontSize: '0.92rem', color: '#c9d1d9' }}>{c.conteudo}</p>

                                    {c.status === 'Recusado' && c.motivoRecusa && (
                                        <div className="fr-motivo">Motivo da recusa: {c.motivoRecusa}</div>
                                    )}

                                    <div className="fr-resposta-rodape">
                                        <div className="fr-card-rodape" style={{ marginTop: 0 }}>
                                            {c.status === 'Publicado' && (
                                                <>
                                                    <span className="fr-meta"><IconeCurtir /> {c.totalCurtidas}</span>
                                                    <span className="fr-meta"><IconeResposta /> {c.totalRespostas}</span>
                                                </>
                                            )}
                                            {c.dataModeracao && (
                                                <span className="fr-meta">
                                                    {c.status === 'Publicado' ? 'Publicado' : 'Revisado'} em {formatarDataHora(c.dataModeracao)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="fr-acoes" style={{ marginTop: 0 }}>
                                            <button className="fr-btn fr-btn-secundario" onClick={() => navigate(`/gestor/forum/topico/${c.id}`)}>
                                                Abrir
                                            </button>
                                            {c.status === 'Pendente' && (
                                                <button className="fr-btn fr-btn-vermelho" onClick={() => { setRecusando(c); setMotivo(''); }} disabled={processando === c.id}>
                                                    Recusar
                                                </button>
                                            )}
                                            {c.status !== 'Publicado' && (
                                                <button className="fr-btn fr-btn-verde" onClick={() => aprovar(c)} disabled={processando === c.id}>
                                                    {processando === c.id ? 'Salvando...' : 'Aprovar e publicar'}
                                                </button>
                                            )}
                                            {c.status === 'Publicado' && (
                                                <button className="fr-btn fr-btn-vermelho" onClick={() => excluir(c)} disabled={processando === c.id}>
                                                    Excluir
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {recusando && (
                <div className="fr-modal-overlay" onClick={() => processando === null && setRecusando(null)}>
                    <div className="fr-modal" onClick={e => e.stopPropagation()}>
                        <h3>Recusar tópico</h3>
                        <p className="fr-modal-sub">"{recusando.titulo}" — o autor recebe uma notificação com o motivo.</p>
                        <div className="fr-campo">
                            <label>Motivo da recusa</label>
                            <textarea
                                style={{ minHeight: 100 }}
                                maxLength={500}
                                placeholder="Ex: o assunto já foi tratado em outro tópico."
                                value={motivo}
                                onChange={e => setMotivo(e.target.value)}
                                autoFocus
                            />
                            <span className="fr-contagem">{motivo.length}/500</span>
                        </div>
                        <div className="fr-acoes">
                            <button className="fr-btn fr-btn-secundario" onClick={() => setRecusando(null)} disabled={processando !== null}>Cancelar</button>
                            <button className="fr-btn fr-btn-vermelho" onClick={confirmarRecusa} disabled={processando !== null || motivo.trim().length < 5}>
                                {processando !== null ? 'Salvando...' : 'Confirmar recusa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className="fr-toast">{toast}</div>}
        </div>
    );
}
