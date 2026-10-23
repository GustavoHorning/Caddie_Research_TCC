import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import PlayerAudio from '../../../components/PlayerAudio';
import { AutorInfo, IconeCurtir } from './forumComum';
import { STATUS_LABEL, formatarData, formatarDataHora, formatarTamanho, mensagemErro, type ForumAutor } from './forumUtils';
import '../MorningCall.css';
import './Forum.css';

const MAX_ANEXOS = 3;
const MAX_BYTES_ANEXO = 5 * 1024 * 1024;
const MAX_BYTES_AUDIO = 20 * 1024 * 1024;
const EXTENSOES_ANEXO = '.pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,.docx,.doc,.txt';

interface Anexo {
    id: number;
    nomeArquivo: string;
    url: string;
    contentType: string;
    tamanhoBytes: number;
}

interface Resposta {
    id: number;
    conteudo: string;
    audioUrl: string | null;
    anexos: Anexo[];
    dataCriacao: string;
    autor: ForumAutor;
    totalCurtidas: number;
    curtidoPorMim: boolean;
    podeExcluir: boolean;
}

interface TopicoDetalhe {
    id: number;
    titulo: string;
    conteudo: string;
    categoria: string;
    status: string;
    motivoRecusa: string | null;
    data: string;
    autor: ForumAutor;
    totalCurtidas: number;
    curtidoPorMim: boolean;
    ehAutor: boolean;
    usuarioEhGestor: boolean;
    respostas: Resposta[];
}

interface ForumTopicoProps {
    voltarPara: string;
    voltarRotulo: string;
}

export default function ForumTopico({ voltarPara, voltarRotulo }: ForumTopicoProps) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [topico, setTopico] = useState<TopicoDetalhe | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [naoEncontrado, setNaoEncontrado] = useState(false);
    const [resposta, setResposta] = useState('');
    const [anexos, setAnexos] = useState<File[]>([]);
    const [audio, setAudio] = useState<File | null>(null);
    const [audioPreview, setAudioPreview] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState('');
    const [moderando, setModerando] = useState(false);
    const [modalRecusa, setModalRecusa] = useState(false);
    const [motivo, setMotivo] = useState('');

    const carregar = useCallback(async () => {
        try {
            const res = await api.get(`/api/forum/topicos/${id}`);
            setTopico(res.data);
            setNaoEncontrado(false);
        } catch {
            setNaoEncontrado(true);
        } finally {
            setCarregando(false);
        }
    }, [id]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        carregar();
    }, [carregar]);

    function escolherAnexos(event: React.ChangeEvent<HTMLInputElement>) {
        const escolhidos = Array.from(event.target.files ?? []);
        event.target.value = '';
        if (escolhidos.length === 0) return;

        const grande = escolhidos.find(f => f.size > MAX_BYTES_ANEXO);
        if (grande) { setErro(`O arquivo ${grande.name} passa de 5 MB.`); return; }

        const todos = [...anexos, ...escolhidos];
        if (todos.length > MAX_ANEXOS) { setErro(`Envie no máximo ${MAX_ANEXOS} anexos por resposta.`); return; }

        setErro('');
        setAnexos(todos);
    }

    function escolherAudio(event: React.ChangeEvent<HTMLInputElement>) {
        const arquivo = event.target.files?.[0];
        event.target.value = '';
        if (!arquivo) return;
        if (arquivo.size > MAX_BYTES_AUDIO) { setErro('O áudio deve ter no máximo 20 MB.'); return; }

        if (audioPreview) URL.revokeObjectURL(audioPreview);
        setErro('');
        setAudio(arquivo);
        setAudioPreview(URL.createObjectURL(arquivo));
    }

    function removerAudio() {
        if (audioPreview) URL.revokeObjectURL(audioPreview);
        setAudio(null);
        setAudioPreview('');
    }

    const podeResponder = resposta.trim().length >= 2 || anexos.length > 0 || audio !== null;

    async function responder() {
        if (!podeResponder) return;
        setEnviando(true);
        setErro('');

        const form = new FormData();
        form.append('conteudo', resposta);
        anexos.forEach(a => form.append('anexos', a));
        if (audio) form.append('audio', audio);

        try {
            await api.post(`/api/forum/topicos/${id}/respostas`, form);
            setResposta('');
            setAnexos([]);
            removerAudio();
            await carregar();
        } catch (error) {
            setErro(mensagemErro(error, 'Não foi possível enviar a resposta.'));
        } finally {
            setEnviando(false);
        }
    }

    async function curtirTopico() {
        if (!topico) return;
        try {
            const res = await api.post(`/api/forum/topicos/${topico.id}/curtir`);
            setTopico({ ...topico, curtidoPorMim: res.data.curtido, totalCurtidas: res.data.total });
        } catch {
            setErro('Não foi possível registrar a curtida.');
        }
    }

    async function curtirResposta(respostaId: number) {
        if (!topico) return;
        try {
            const res = await api.post(`/api/forum/respostas/${respostaId}/curtir`);
            setTopico({
                ...topico,
                respostas: topico.respostas.map(r => r.id === respostaId
                    ? { ...r, curtidoPorMim: res.data.curtido, totalCurtidas: res.data.total }
                    : r),
            });
        } catch {
            setErro('Não foi possível registrar a curtida.');
        }
    }

    async function excluirResposta(respostaId: number) {
        if (!window.confirm('Excluir esta resposta?')) return;
        try {
            await api.delete(`/api/forum/respostas/${respostaId}`);
            await carregar();
        } catch (error) {
            setErro(mensagemErro(error, 'Não foi possível excluir a resposta.'));
        }
    }

    async function excluirTopico() {
        if (!window.confirm('Excluir este tópico e todas as respostas? Essa ação não pode ser desfeita.')) return;
        try {
            await api.delete(`/api/forum/topicos/${id}`);
            navigate(voltarPara);
        } catch (error) {
            setErro(mensagemErro(error, 'Não foi possível excluir o tópico.'));
        }
    }

    async function aprovar() {
        setModerando(true);
        setErro('');
        try {
            await api.post(`/api/forum/topicos/${id}/aprovar`);
            await carregar();
        } catch (error) {
            setErro(mensagemErro(error, 'Não foi possível aprovar o tópico.'));
        } finally {
            setModerando(false);
        }
    }

    async function recusar() {
        setModerando(true);
        setErro('');
        try {
            await api.post(`/api/forum/topicos/${id}/recusar`, { motivo });
            setModalRecusa(false);
            setMotivo('');
            await carregar();
        } catch (error) {
            setErro(mensagemErro(error, 'Não foi possível recusar o tópico.'));
        } finally {
            setModerando(false);
        }
    }

    if (carregando) {
        return <div className="fr-page"><div className="fr-vazio">Carregando...</div></div>;
    }

    if (naoEncontrado || !topico) {
        return (
            <div className="fr-page">
                <button className="fr-voltar" onClick={() => navigate(voltarPara)}>← {voltarRotulo}</button>
                <div className="fr-vazio">Tópico não encontrado.</div>
            </div>
        );
    }

    const publicado = topico.status === 'Publicado';

    return (
        <div className="fr-page">
            <button className="fr-voltar" onClick={() => navigate(voltarPara)}>← {voltarRotulo}</button>

            {topico.status === 'Pendente' && (
                <div className="fr-aviso fr-aviso-Pendente">
                    {topico.usuarioEhGestor
                        ? 'Este tópico é um chamado aguardando a sua aprovação. Ele ainda não está visível para a comunidade.'
                        : 'Seu tópico está aguardando a aprovação do gestor. Por enquanto, só você consegue vê-lo.'}
                </div>
            )}
            {topico.status === 'Recusado' && (
                <div className="fr-aviso fr-aviso-Recusado">
                    Este tópico não foi aprovado.{topico.motivoRecusa ? ` Motivo: ${topico.motivoRecusa}` : ''}
                </div>
            )}

            {erro && <div className="fr-erro-msg">{erro}</div>}

            <div className="fr-card">
                <AutorInfo autor={topico.autor} data={formatarData(topico.data)} />
                <h1 className="fr-detalhe-titulo">{topico.titulo}</h1>
                <p className="fr-detalhe-texto">{topico.conteudo}</p>

                <div className="fr-divisor" />

                <div className="fr-resposta-rodape" style={{ marginTop: 0 }}>
                    <div className="fr-card-rodape" style={{ marginTop: 0 }}>
                        {publicado ? (
                            <button className={`fr-curtir ${topico.curtidoPorMim ? 'ativo' : ''}`} onClick={curtirTopico}>
                                <IconeCurtir /> {topico.totalCurtidas} {topico.totalCurtidas === 1 ? 'Curtida' : 'Curtidas'}
                            </button>
                        ) : (
                            <span className={`fr-status fr-status-${topico.status}`}>{STATUS_LABEL[topico.status] ?? topico.status}</span>
                        )}
                        <span className="fr-categoria">{topico.categoria}</span>
                    </div>
                    {(topico.ehAutor || topico.usuarioEhGestor) && (
                        <button className="fr-btn-link" onClick={excluirTopico}>Excluir tópico</button>
                    )}
                </div>

                {topico.usuarioEhGestor && topico.status !== 'Publicado' && (
                    <div className="fr-acoes">
                        {topico.status === 'Pendente' && (
                            <button className="fr-btn fr-btn-vermelho" onClick={() => setModalRecusa(true)} disabled={moderando}>Recusar</button>
                        )}
                        <button className="fr-btn fr-btn-verde" onClick={aprovar} disabled={moderando}>
                            {moderando ? 'Salvando...' : 'Aprovar e publicar'}
                        </button>
                    </div>
                )}
            </div>

            {publicado && (
                <>
                    <h2 className="fr-secao-titulo">Respostas ({topico.respostas.length})</h2>

                    <div className="fr-card" style={{ marginBottom: 14 }}>
                        <textarea
                            className="fr-campo-resposta"
                            placeholder="Adicione um comentário ou responda à análise..."
                            value={resposta}
                            onChange={e => setResposta(e.target.value)}
                        />

                        {anexos.length > 0 && (
                            <div className="fr-anexos-escolhidos">
                                {anexos.map((a, i) => (
                                    <span key={`${a.name}-${i}`} className="fr-anexo-chip">
                                        📎 {a.name} <small>({formatarTamanho(a.size)})</small>
                                        <button onClick={() => setAnexos(anexos.filter((_, j) => j !== i))} aria-label="Remover anexo">✕</button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {audio && (
                            <div className="fr-audio-escolhido">
                                <div className="fr-audio-escolhido-topo">
                                    <span>🎧 {audio.name}</span>
                                    <button className="fr-btn-link" onClick={removerAudio}>Remover áudio</button>
                                </div>
                                <audio src={audioPreview} controls className="fr-audio-preview" />
                            </div>
                        )}

                        <div className="fr-resposta-rodape">
                            <div className="fr-card-rodape" style={{ marginTop: 0 }}>
                                <label className={`fr-btn-anexar ${anexos.length >= MAX_ANEXOS ? 'desativado' : ''}`}>
                                    📎 Anexar arquivo
                                    <input
                                        type="file"
                                        multiple
                                        accept={EXTENSOES_ANEXO}
                                        style={{ display: 'none' }}
                                        onChange={escolherAnexos}
                                        disabled={anexos.length >= MAX_ANEXOS}
                                    />
                                </label>
                                {topico.usuarioEhGestor && !audio && (
                                    <label className="fr-btn-anexar">
                                        🎙️ Anexar áudio
                                        <input
                                            type="file"
                                            accept=".mp4,.m4a,.mp3,audio/mp4,audio/mpeg,video/mp4"
                                            style={{ display: 'none' }}
                                            onChange={escolherAudio}
                                        />
                                    </label>
                                )}
                                <span className="fr-meta">Até {MAX_ANEXOS} arquivos de 5 MB</span>
                            </div>
                            <button className="fr-btn fr-btn-cheio" onClick={responder} disabled={enviando || !podeResponder}>
                                {enviando ? 'Enviando...' : 'Responder'}
                            </button>
                        </div>
                    </div>

                    <div className="fr-lista">
                        {topico.respostas.map(r => (
                            <div key={r.id} className="fr-card">
                                <AutorInfo autor={r.autor} data={formatarDataHora(r.dataCriacao)} />
                                {r.conteudo && <p className="fr-resposta-texto">{r.conteudo}</p>}

                                {r.audioUrl && <PlayerAudio url={r.audioUrl} titulo="Resposta em áudio do gestor" />}

                                {r.anexos.length > 0 && (
                                    <div className="fr-anexos">
                                        {r.anexos.filter(a => a.contentType.startsWith('image/')).map(a => (
                                            <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="fr-anexo-imagem" title={a.nomeArquivo}>
                                                <img src={a.url} alt={a.nomeArquivo} />
                                            </a>
                                        ))}
                                        {r.anexos.filter(a => !a.contentType.startsWith('image/')).map(a => (
                                            <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="fr-anexo-arquivo">
                                                <span className="fr-anexo-icone">📄</span>
                                                <span className="fr-anexo-nome">{a.nomeArquivo}</span>
                                                <small>{formatarTamanho(a.tamanhoBytes)}</small>
                                            </a>
                                        ))}
                                    </div>
                                )}
                                <div className="fr-resposta-rodape">
                                    <button className={`fr-curtir ${r.curtidoPorMim ? 'ativo' : ''}`} onClick={() => curtirResposta(r.id)}>
                                        <IconeCurtir /> {r.totalCurtidas}
                                    </button>
                                    {r.podeExcluir && (
                                        <button className="fr-btn-link" onClick={() => excluirResposta(r.id)}>Excluir</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {modalRecusa && (
                <div className="fr-modal-overlay" onClick={() => !moderando && setModalRecusa(false)}>
                    <div className="fr-modal" onClick={e => e.stopPropagation()}>
                        <h3>Recusar tópico</h3>
                        <p className="fr-modal-sub">O autor recebe uma notificação com o motivo.</p>
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
                            <button className="fr-btn fr-btn-secundario" onClick={() => setModalRecusa(false)} disabled={moderando}>Cancelar</button>
                            <button className="fr-btn fr-btn-vermelho" onClick={recusar} disabled={moderando || motivo.trim().length < 5}>
                                {moderando ? 'Salvando...' : 'Confirmar recusa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
