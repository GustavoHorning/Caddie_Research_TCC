import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { AutorInfo, IconeCurtir, IconeResposta } from './forumComum';
import { STATUS_LABEL, formatarData, mensagemErro, type ForumAutor } from './forumUtils';
import './Forum.css';

interface TopicoResumo {
    id: number;
    titulo: string;
    conteudo: string;
    categoria: string;
    data: string;
    autor: ForumAutor;
    totalCurtidas: number;
    totalRespostas: number;
    curtidoPorMim: boolean;
}

interface MeuTopico {
    id: number;
    titulo: string;
    categoria: string;
    status: string;
    motivoRecusa: string | null;
    dataCriacao: string;
    totalRespostas: number;
    totalCurtidas: number;
}

type Aba = 'comunidade' | 'meus';

export default function Forum() {
    const navigate = useNavigate();
    const [aba, setAba] = useState<Aba>('comunidade');
    const [categorias, setCategorias] = useState<string[]>([]);
    const [categoria, setCategoria] = useState('');
    const [busca, setBusca] = useState('');
    const [buscaAplicada, setBuscaAplicada] = useState('');
    const [topicos, setTopicos] = useState<TopicoResumo[]>([]);
    const [meus, setMeus] = useState<MeuTopico[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [toast, setToast] = useState('');

    const [modalAberto, setModalAberto] = useState(false);
    const [novo, setNovo] = useState({ titulo: '', categoria: '', conteudo: '' });
    const [enviando, setEnviando] = useState(false);
    const [erroModal, setErroModal] = useState('');

    function mostrarToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(''), 4000);
    }

    useEffect(() => {
        api.get('/api/forum/categorias')
            .then(res => setCategorias(res.data))
            .catch(() => setCategorias([]));
    }, []);

    // Espera o usuário parar de digitar antes de buscar
    useEffect(() => {
        const t = setTimeout(() => setBuscaAplicada(busca.trim()), 400);
        return () => clearTimeout(t);
    }, [busca]);

    useEffect(() => {
        let cancelado = false;
        async function carregar() {
            setCarregando(true);
            setErro('');
            try {
                if (aba === 'comunidade') {
                    const res = await api.get('/api/forum/topicos', {
                        params: { categoria: categoria || undefined, busca: buscaAplicada || undefined },
                    });
                    if (!cancelado) setTopicos(res.data);
                } else {
                    const res = await api.get('/api/forum/meus-topicos');
                    if (!cancelado) setMeus(res.data);
                }
            } catch {
                if (!cancelado) setErro('Não foi possível carregar o fórum agora.');
            } finally {
                if (!cancelado) setCarregando(false);
            }
        }
        carregar();
        return () => { cancelado = true; };
    }, [aba, categoria, buscaAplicada]);

    function abrirModal() {
        setNovo({ titulo: '', categoria: categorias[0] ?? '', conteudo: '' });
        setErroModal('');
        setModalAberto(true);
    }

    async function enviarTopico() {
        if (novo.titulo.trim().length < 5) { setErroModal('O título deve ter pelo menos 5 caracteres.'); return; }
        if (!novo.categoria) { setErroModal('Escolha uma categoria.'); return; }
        if (novo.conteudo.trim().length < 10) { setErroModal('Escreva pelo menos 10 caracteres no conteúdo.'); return; }

        setEnviando(true);
        setErroModal('');
        try {
            const res = await api.post('/api/forum/topicos', novo);
            setModalAberto(false);
            mostrarToast(res.data.mensagem);
            setAba('meus');
        } catch (error) {
            setErroModal(mensagemErro(error, 'Não foi possível enviar o tópico.'));
        } finally {
            setEnviando(false);
        }
    }

    async function curtir(e: React.MouseEvent, topicoId: number) {
        e.stopPropagation();
        try {
            const res = await api.post(`/api/forum/topicos/${topicoId}/curtir`);
            setTopicos(prev => prev.map(t => t.id === topicoId
                ? { ...t, curtidoPorMim: res.data.curtido, totalCurtidas: res.data.total }
                : t));
        } catch {
            mostrarToast('Não foi possível registrar a curtida.');
        }
    }

    return (
        <div className="fr-page">
            <div className="fr-header">
                <div>
                    <h1 className="fr-titulo">Fórum da Comunidade</h1>
                    <p className="fr-subtitulo">Troque conhecimentos e evolua junto com a Caddie Research.</p>
                </div>
                <button className="fr-btn fr-btn-primario" onClick={abrirModal}>+ Novo Tópico</button>
            </div>

            <div className="fr-abas">
                <button className={`fr-aba ${aba === 'comunidade' ? 'ativa' : ''}`} onClick={() => setAba('comunidade')}>
                    Comunidade
                </button>
                <button className={`fr-aba ${aba === 'meus' ? 'ativa' : ''}`} onClick={() => setAba('meus')}>
                    Meus tópicos
                </button>
            </div>

            {aba === 'comunidade' && (
                <div className="fr-filtros">
                    <div className="fr-busca">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2">
                            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input placeholder="Buscar tópicos..." value={busca} onChange={e => setBusca(e.target.value)} />
                    </div>
                    <div className="fr-chips">
                        <button className={`fr-chip ${categoria === '' ? 'ativo' : ''}`} onClick={() => setCategoria('')}>Todos</button>
                        {categorias.map(c => (
                            <button key={c} className={`fr-chip ${categoria === c ? 'ativo' : ''}`} onClick={() => setCategoria(c)}>{c}</button>
                        ))}
                    </div>
                </div>
            )}

            {erro && <div className="fr-erro-msg">{erro}</div>}

            {carregando ? (
                <div className="fr-vazio">Carregando...</div>
            ) : aba === 'comunidade' ? (
                topicos.length === 0 ? (
                    <div className="fr-vazio">
                        {buscaAplicada || categoria
                            ? 'Nenhum tópico encontrado com esses filtros.'
                            : 'Nenhum tópico publicado ainda. Que tal abrir o primeiro?'}
                    </div>
                ) : (
                    <div className="fr-lista">
                        {topicos.map(t => (
                            <div key={t.id} className="fr-card fr-card-clicavel" onClick={() => navigate(`/forum/topico/${t.id}`)}>
                                <AutorInfo autor={t.autor} data={formatarData(t.data)} />
                                <h2 className="fr-card-titulo">{t.titulo}</h2>
                                <p className="fr-card-resumo">{t.conteudo}</p>
                                <div className="fr-card-rodape">
                                    <span className="fr-categoria">{t.categoria}</span>
                                    <button className={`fr-curtir ${t.curtidoPorMim ? 'ativo' : ''}`} onClick={e => curtir(e, t.id)}>
                                        <IconeCurtir /> {t.totalCurtidas} {t.totalCurtidas === 1 ? 'Curtida' : 'Curtidas'}
                                    </button>
                                    <span className="fr-meta">
                                        <IconeResposta /> {t.totalRespostas} {t.totalRespostas === 1 ? 'Resposta' : 'Respostas'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : meus.length === 0 ? (
                <div className="fr-vazio">Você ainda não abriu nenhum tópico.</div>
            ) : (
                <div className="fr-lista">
                    {meus.map(t => (
                        <div key={t.id} className="fr-card fr-card-clicavel" onClick={() => navigate(`/forum/topico/${t.id}`)}>
                            <div className="fr-card-rodape" style={{ marginTop: 0 }}>
                                <span className={`fr-status fr-status-${t.status}`}>{STATUS_LABEL[t.status] ?? t.status}</span>
                                <span className="fr-categoria">{t.categoria}</span>
                                <span className="fr-meta">Enviado em {formatarData(t.dataCriacao)}</span>
                            </div>
                            <h2 className="fr-card-titulo">{t.titulo}</h2>
                            {t.status === 'Publicado' && (
                                <div className="fr-card-rodape" style={{ marginTop: 6 }}>
                                    <span className="fr-meta"><IconeCurtir /> {t.totalCurtidas}</span>
                                    <span className="fr-meta"><IconeResposta /> {t.totalRespostas}</span>
                                </div>
                            )}
                            {t.status === 'Pendente' && (
                                <p className="fr-card-resumo">O gestor vai revisar o seu tópico. Você será avisado quando ele for publicado.</p>
                            )}
                            {t.status === 'Recusado' && t.motivoRecusa && (
                                <div className="fr-motivo">Motivo: {t.motivoRecusa}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {modalAberto && (
                <div className="fr-modal-overlay" onClick={() => !enviando && setModalAberto(false)}>
                    <div className="fr-modal" onClick={e => e.stopPropagation()}>
                        <h3>Novo tópico</h3>
                        <p className="fr-modal-sub">O tópico passa pela aprovação do gestor antes de ficar visível para a comunidade.</p>

                        {erroModal && <div className="fr-erro-msg">{erroModal}</div>}

                        <div className="fr-campo">
                            <label>Título</label>
                            <input
                                maxLength={150}
                                placeholder="Ex: Como vocês definem o preço teto de uma ação?"
                                value={novo.titulo}
                                onChange={e => setNovo(p => ({ ...p, titulo: e.target.value }))}
                                autoFocus
                            />
                            <span className="fr-contagem">{novo.titulo.length}/150</span>
                        </div>

                        <div className="fr-campo">
                            <label>Categoria</label>
                            <select value={novo.categoria} onChange={e => setNovo(p => ({ ...p, categoria: e.target.value }))}>
                                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="fr-campo">
                            <label>Conteúdo</label>
                            <textarea
                                placeholder="Descreva a sua dúvida ou análise com detalhes..."
                                value={novo.conteudo}
                                onChange={e => setNovo(p => ({ ...p, conteudo: e.target.value }))}
                            />
                        </div>

                        <div className="fr-acoes">
                            <button className="fr-btn fr-btn-secundario" onClick={() => setModalAberto(false)} disabled={enviando}>Cancelar</button>
                            <button className="fr-btn fr-btn-cheio" onClick={enviarTopico} disabled={enviando}>
                                {enviando ? 'Enviando...' : 'Enviar para aprovação'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className="fr-toast">{toast}</div>}
        </div>
    );
}
