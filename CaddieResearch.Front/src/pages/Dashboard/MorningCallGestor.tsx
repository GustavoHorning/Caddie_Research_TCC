import { useState } from 'react';
import api from '../../services/api';
import './MorningCall.css';

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

function MorningCallGestor() {
    const [titulo, setTitulo] = useState('');
    const [data, setData] = useState(new Date().toISOString().split('T')[0]);
    const [topicos, setTopicos] = useState<Topico[]>([novoTopico()]);
    const [enviando, setEnviando] = useState(false);
    const [mensagem, setMensagem] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);

    const configSeguranca = { headers: { Authorization: `Bearer ${localStorage.getItem('caddie_token')}` } };

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

    // Quando o gestor escolhe um arquivo de imagem no PC dele
    function handleImagemArquivo(index: number, event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        const novos = [...topicos];
        novos[index].imagemArquivo = file;
        novos[index].imagemUrl = previewUrl; // usamos o mesmo campo para exibir o preview
        setTopicos(novos);
    }

    // Quando o gestor cola uma URL de imagem em vez de fazer upload
    function handleImagemUrl(index: number, valor: string) {
        const novos = [...topicos];
        novos[index].imagemUrl = valor;
        novos[index].imagemArquivo = null; // se digitou uma URL, descarta o arquivo escolhido antes
        setTopicos(novos);
    }

    function removerImagem(index: number) {
        const novos = [...topicos];
        novos[index].imagemUrl = '';
        novos[index].imagemArquivo = null;
        setTopicos(novos);
    }

    function limparFormulario() {
        setTitulo('');
        setData(new Date().toISOString().split('T')[0]);
        setTopicos([novoTopico()]);
    }

    async function publicar() {
        if (!titulo.trim()) {
            setMensagem({ texto: 'Preencha o título do Morning Call.', tipo: 'erro' });
            return;
        }
        if (topicos.some(t => !t.titulo.trim() || !t.texto.trim())) {
            setMensagem({ texto: 'Preencha título e texto em todos os tópicos.', tipo: 'erro' });
            return;
        }

        setEnviando(true);
        setMensagem(null);

        // Monta os dados dos tópicos (sem os arquivos, que vão separados no FormData)
        const topicosParaEnviar = topicos.map(t => ({
            titulo: t.titulo,
            texto: t.texto,
            link: t.link,
            // Se o gestor colou uma URL (não escolheu arquivo), manda ela aqui
            imagemUrlExistente: t.imagemArquivo ? null : (t.imagemUrl || null),
        }));

        const formData = new FormData();
        formData.append('titulo', titulo);
        formData.append('data', data);
        formData.append('topicosJson', JSON.stringify(topicosParaEnviar));

        // Cada imagem vai num campo próprio (imagem_0, imagem_1...) — o número é o
        // índice do tópico correspondente. Tópicos sem upload simplesmente não geram campo.
        topicos.forEach((t, i) => {
            if (t.imagemArquivo) {
                formData.append(`imagem_${i}`, t.imagemArquivo);
            }
        });

        try {
            await api.post('/api/morningcall', formData, {
                headers: { ...configSeguranca.headers, 'Content-Type': 'multipart/form-data' },
            });
            setMensagem({ texto: 'Morning Call publicado com sucesso!', tipo: 'sucesso' });
            limparFormulario();
        } catch (error) {
            console.error('Erro ao publicar Morning Call', error);
            setMensagem({ texto: 'Ocorreu um erro ao publicar o Morning Call.', tipo: 'erro' });
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="mc-page">
            <div className="mc-container">
                <div className="mc-header">
                    <span className="mc-icon">☕</span>
                    <div>
                        <h1 className="mc-title">Publicar Morning Call</h1>
                        <p className="mc-subtitle">Monte o resumo do dia para seus clientes</p>
                    </div>
                </div>

                {mensagem && (
                    <div className={`mc-mensagem mc-mensagem-${mensagem.tipo}`}>
                        {mensagem.texto}
                    </div>
                )}

                <div className="mc-field">
                    <label>Data</label>
                    <input
                        type="date"
                        value={data}
                        onChange={e => setData(e.target.value)}
                    />
                </div>

                <div className="mc-field">
                    <label>Título do Morning Call</label>
                    <input
                        type="text"
                        placeholder="Ex: Resumo do mercado — 25 de agosto"
                        value={titulo}
                        onChange={e => setTitulo(e.target.value)}
                    />
                </div>

                <div className="mc-divider"></div>
                <div className="mc-section-label">Tópicos de notícia</div>

                {topicos.map((topico, index) => (
                    <div className="mc-topico" key={index}>
                        <div className="mc-topico-head">
                            <span>Tópico {index + 1}</span>
                            {topicos.length > 1 && (
                                <button className="mc-remove" onClick={() => removerTopico(index)}>
                                    Remover
                                </button>
                            )}
                        </div>

                        {/* ---------- Imagem da notícia (upload ou URL) ---------- */}
                        <div className="mc-imagem-field">
                            {topico.imagemUrl ? (
                                <div className="mc-imagem-preview-wrap">
                                    <img
                                        src={topico.imagemUrl}
                                        alt="Prévia da imagem da notícia"
                                        className="mc-imagem-preview"
                                    />
                                    <button
                                        type="button"
                                        className="mc-imagem-remover"
                                        onClick={() => removerImagem(index)}
                                    >
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
                                        onChange={e => handleImagemArquivo(index, e)}
                                    />
                                </label>
                            )}

                            <div className="mc-imagem-ou">ou</div>

                            <input
                                type="text"
                                placeholder="Colar URL de uma imagem (https://...)"
                                value={topico.imagemArquivo ? '' : topico.imagemUrl}
                                onChange={e => handleImagemUrl(index, e.target.value)}
                                disabled={!!topico.imagemArquivo}
                            />
                        </div>

                        <input
                            type="text"
                            placeholder="Título da notícia"
                            value={topico.titulo}
                            onChange={e => atualizarTopico(index, 'titulo', e.target.value)}
                        />
                        <textarea
                            placeholder="Escreva o resumo da notícia..."
                            value={topico.texto}
                            onChange={e => atualizarTopico(index, 'texto', e.target.value)}
                            rows={3}
                        />
                        <input
                            type="text"
                            placeholder="Link da notícia original (https://...)"
                            value={topico.link}
                            onChange={e => atualizarTopico(index, 'link', e.target.value)}
                        />
                    </div>
                ))}

                <button className="mc-add-topico" onClick={adicionarTopico}>
                    + Adicionar tópico
                </button>

                <div className="mc-actions">
                    <button className="mc-btn-cancel" onClick={limparFormulario} disabled={enviando}>
                        Cancelar
                    </button>
                    <button className="mc-btn-publish" onClick={publicar} disabled={enviando}>
                        {enviando ? 'Publicando...' : 'Publicar Morning Call'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MorningCallGestor;