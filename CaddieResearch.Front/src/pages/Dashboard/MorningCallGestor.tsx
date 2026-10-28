import { useState } from 'react';
import api from '../../services/api';
import SidebarGestor from '../../components/SidebarGestor';
import TopBar from '../../components/TopBar';
import './Gestor/PainelGestor.css';

interface Topico {
    titulo: string;
    texto: string;
    link: string;
    imagemUrl: string;
    imagemArquivo: File | null;
}

function novoTopico(): Topico {
    return { titulo: '', texto: '', link: '', imagemUrl: '', imagemArquivo: null };
}

export default function MorningCallGestor() {
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);

    const [titulo, setTitulo] = useState('');
    const [data, setData] = useState(new Date().toISOString().split('T')[0]);
    const [topicos, setTopicos] = useState<Topico[]>([novoTopico()]);
    const [audioArquivo, setAudioArquivo] = useState<File | null>(null);
    const [audioPreview, setAudioPreview] = useState('');
    const [enviando, setEnviando] = useState(false);

    // Usando o sistema de Toast institucional
    const [toastMsg, setToastMsg] = useState('');
    const [toastTipo, setToastTipo] = useState<'sucesso' | 'erro'>('sucesso');

    const configSeguranca = { headers: { Authorization: `Bearer ${localStorage.getItem('caddie_token')}` } };

    const mostrarNotificacao = (msg: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
        setToastMsg(msg);
        setToastTipo(tipo);
        setTimeout(() => setToastMsg(''), 3000);
    };

    function adicionarTopico() {
        setTopicos([...topicos, novoTopico()]);
    }

    function removerTopico(index: number) {
        setTopicos(topicos.filter((_, i) => i !== index));
    }

    function atualizarTopico(index: number, campo: 'titulo' | 'texto' | 'link', valor: string) {
        const novos = [...topicos];
        novos[index][campo] = valor;
        setTopicos(novos);
    }

    function handleImagemArquivo(index: number, event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        const novos = [...topicos];
        novos[index].imagemArquivo = file;
        novos[index].imagemUrl = previewUrl;
        setTopicos(novos);
    }

    function handleImagemUrl(index: number, valor: string) {
        const novos = [...topicos];
        novos[index].imagemUrl = valor;
        novos[index].imagemArquivo = null;
        setTopicos(novos);
    }

    function removerImagem(index: number) {
        const novos = [...topicos];
        novos[index].imagemUrl = '';
        novos[index].imagemArquivo = null;
        setTopicos(novos);
    }

    function handleAudioArquivo(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        if (file.size > 25 * 1024 * 1024) {
            mostrarNotificacao('O áudio deve ter no máximo 25 MB.', 'erro');
            return;
        }

        if (audioPreview) URL.revokeObjectURL(audioPreview);
        setAudioArquivo(file);
        setAudioPreview(URL.createObjectURL(file));
    }

    function removerAudio() {
        if (audioPreview) URL.revokeObjectURL(audioPreview);
        setAudioArquivo(null);
        setAudioPreview('');
    }

    function limparFormulario() {
        setTitulo('');
        setData(new Date().toISOString().split('T')[0]);
        setTopicos([novoTopico()]);
        removerAudio();
    }

    async function publicar() {
        if (!titulo.trim()) {
            return mostrarNotificacao('Preencha o título do Morning Call.', 'erro');
        }
        if (topicos.some(t => !t.titulo.trim() || !t.texto.trim())) {
            return mostrarNotificacao('Preencha título e texto em todos os tópicos.', 'erro');
        }

        setEnviando(true);

        const topicosParaEnviar = topicos.map(t => ({
            titulo: t.titulo,
            texto: t.texto,
            link: t.link,
            imagemUrlExistente: t.imagemArquivo ? null : (t.imagemUrl || null),
        }));

        const formData = new FormData();
        formData.append('titulo', titulo);
        formData.append('data', data);
        formData.append('topicosJson', JSON.stringify(topicosParaEnviar));

        topicos.forEach((t, i) => {
            if (t.imagemArquivo) {
                formData.append(`imagem_${i}`, t.imagemArquivo);
            }
        });

        if (audioArquivo) {
            formData.append('audio', audioArquivo);
        }

        try {
            await api.post('/api/morningcall', formData, configSeguranca);
            mostrarNotificacao('Morning Call publicado com sucesso!', 'sucesso');
            limparFormulario();
        } catch (error) {
            console.error('Erro ao publicar Morning Call', error);
            const erroApi = (error as { response?: { data?: { erro?: string } } }).response?.data?.erro;
            mostrarNotificacao(erroApi || 'Ocorreu um erro ao publicar o Morning Call.', 'erro');
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="dashboard-layout">
            <SidebarGestor activePath="/gestor/morning-call" isOpen={menuMobileAberto} onClose={() => setMenuMobileAberto(false)} />
            {menuMobileAberto && <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>}

            <TopBar userName="Gestor" onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />

            <main className="dashboard-main">
                <div className="gestor-page">

                    <header className="gestor-hero">
                        <div className="gestor-hero-left">
                            <div className="gestor-kicker-row">
                                <span className="gestor-kicker-badge">Produção de Conteúdo Diário</span>
                            </div>
                            <h1 className="gestor-title">Publicar Morning Call</h1>
                            <p className="gestor-subtitle">Monte o resumo do dia para os seus clientes. Adicione tópicos, imagens e áudio de acompanhamento.</p>
                        </div>
                    </header>

                    <section className="gestor-panel" style={{ maxWidth: '850px', margin: '0 auto', border: '1px solid var(--g-border-strong)' }}>
                        <div className="gestor-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '36px', gridTemplateColumns: '1fr' }}>

                            {/* DADOS GERAIS */}
                            <div className="gestor-form-column">
                                <div className="gestor-preview-title" style={{ marginBottom: '8px' }}>Configurações da Edição</div>

                                <div className="gestor-field-row">
                                    <div className="gestor-field" style={{ flex: 1 }}>
                                        <label>Data de Publicação</label>
                                        <input
                                            type="date"
                                            value={data}
                                            onChange={e => setData(e.target.value)}
                                        />
                                    </div>
                                    <div className="gestor-field" style={{ flex: 3 }}>
                                        <label>Título do Morning Call (Headline Principal)</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Resumo do mercado — 25 de agosto"
                                            value={titulo}
                                            onChange={e => setTitulo(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="gestor-field-row">
                                    <div className="gestor-field" style={{ flex: '1 1 100%' }}>
                                        <label>Áudio do Analista (Formato Podcast)</label>
                                        <div style={{ border: '2px dashed var(--g-border-strong)', padding: '24px', textAlign: 'center', borderRadius: '12px', background: 'var(--g-bg-input)' }}>
                                            {audioArquivo ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--g-text-main)', fontWeight: 600 }}>🎧 {audioArquivo.name}</span>
                                                    <audio src={audioPreview} controls style={{ height: '36px', outline: 'none' }} />
                                                    <button type="button" onClick={removerAudio} style={{ background: 'transparent', border: 'none', color: 'var(--g-rose)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}>
                                                        ✕ Remover Faixa
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <input
                                                        type="file"
                                                        accept=".mp4,.m4a,.mp3,audio/mp4,audio/mpeg,video/mp4"
                                                        onChange={handleAudioArquivo}
                                                        style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--g-text-secondary)' }}
                                                    />
                                                    <span style={{ display: 'block', marginTop: '8px', fontSize: '0.75rem', color: 'var(--g-text-muted)' }}>Formatos Suportados: .mp3, .m4a (Até 25MB)</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--g-border)', margin: 0 }} />

                            {/* TÓPICOS DE NOTÍCIA */}
                            <div className="gestor-form-column">
                                <div className="gestor-preview-title" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Tópicos & Notícias</span>
                                </div>

                                {topicos.map((topico, index) => (
                                    <div key={index} style={{ background: 'var(--g-bg-elevated)', border: '1px solid var(--g-border)', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--g-border)', paddingBottom: '12px', marginBottom: '8px' }}>
                                            <strong style={{ fontSize: '0.9rem', color: 'var(--g-cyan)' }}>Notícia {index + 1}</strong>
                                            {topicos.length > 1 && (
                                                <button onClick={() => removerTopico(index)} style={{ background: 'none', border: 'none', color: 'var(--g-rose)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                                                    Remover Bloco
                                                </button>
                                            )}
                                        </div>

                                        <div className="gestor-field-row">
                                            <div className="gestor-field" style={{ flex: '1 1 100%' }}>
                                                <label>Imagem da Notícia</label>

                                                {topico.imagemUrl ? (
                                                    <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--g-border)' }}>
                                                        <img src={topico.imagemUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <button
                                                            onClick={() => removerImagem(index)}
                                                            style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                                                        >
                                                            ✕ Trocar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                        <div style={{ flex: 1, border: '1px dashed var(--g-border-strong)', padding: '10px 14px', borderRadius: '8px', background: 'var(--g-bg-surface)' }}>
                                                            <input type="file" accept="image/png, image/jpeg, image/webp" onChange={e => handleImagemArquivo(index, e)} style={{ width: '100%', background: 'transparent', border: 'none' }} />
                                                        </div>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--g-text-muted)', fontWeight: 600 }}>OU</span>
                                                        <input
                                                            type="text"
                                                            placeholder="Cole a URL da Imagem aqui..."
                                                            value={topico.imagemArquivo ? '' : topico.imagemUrl}
                                                            onChange={e => handleImagemUrl(index, e.target.value)}
                                                            disabled={!!topico.imagemArquivo}
                                                            style={{ flex: 1 }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="gestor-field-row">
                                            <div className="gestor-field" style={{ flex: '1 1 100%' }}>
                                                <label>Manchete / Título da Notícia</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ex: Ibovespa fecha em alta puxado por commodities"
                                                    value={topico.titulo}
                                                    onChange={e => atualizarTopico(index, 'titulo', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="gestor-field-row">
                                            <div className="gestor-field" style={{ flex: '1 1 100%' }}>
                                                <label>Resumo (Takeaway)</label>
                                                <textarea
                                                    placeholder="Escreva os pontos chave desta notícia..."
                                                    value={topico.texto}
                                                    onChange={e => atualizarTopico(index, 'texto', e.target.value)}
                                                    rows={4}
                                                />
                                            </div>
                                        </div>

                                        <div className="gestor-field-row">
                                            <div className="gestor-field" style={{ flex: '1 1 100%' }}>
                                                <label>Link da Fonte Original (Opcional)</label>
                                                <input
                                                    type="text"
                                                    placeholder="https://exame.com/..."
                                                    value={topico.link}
                                                    onChange={e => atualizarTopico(index, 'link', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    className="gestor-btn gestor-btn-outline"
                                    onClick={adicionarTopico}
                                    style={{ width: 'fit-content', alignSelf: 'center', marginTop: '8px' }}
                                >
                                    + Adicionar Novo Bloco de Notícia
                                </button>
                            </div>

                        </div>

                        {/* RODAPÉ DO FORMULÁRIO */}
                        <div className="gestor-form-acoes">
                            <button className="gestor-btn gestor-btn-outline" onClick={limparFormulario} disabled={enviando}>
                                Limpar
                            </button>
                            <button className="gestor-btn gestor-btn-primary" onClick={publicar} disabled={enviando}>
                                {enviando ? 'A Publicar Morning Call...' : 'Publicar Edição Diária'}
                            </button>
                        </div>
                    </section>

                </div>
            </main>

            {toastMsg && <div className={`gestor-toast toast-${toastTipo}`}>{toastMsg}</div>}
        </div>
    );
}