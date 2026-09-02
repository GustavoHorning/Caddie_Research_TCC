import { useEffect, useState } from 'react';
import api from '../../services/api';
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
    nomeGestor: string;
    topicos: Topico[];
}

// Estimativa simples de tempo de leitura a partir do texto (~200 palavras/min)
function tempoLeitura(texto: string): string {
    const palavras = texto.trim().split(/\s+/).length;
    const minutos = Math.max(1, Math.round(palavras / 200));
    return `${minutos} min de leitura`;
}

function formatarData(dataIso: string): string {
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function MorningCall() {
    const [morningCalls, setMorningCalls] = useState<MorningCallItem[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);

    const configSeguranca = { headers: { Authorization: `Bearer ${localStorage.getItem('caddie_token')}` } };

    useEffect(() => {
        async function carregarMorningCalls() {
            setCarregando(true);
            setErro(false);
            try {
                const response = await api.get('/api/morningcall', configSeguranca);
                setMorningCalls(response.data);
            } catch (error) {
                console.error('Erro ao carregar Morning Calls', error);
                setErro(true);
            } finally {
                setCarregando(false);
            }
        }

        carregarMorningCalls();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (carregando) {
        return (
            <div className="mc-page">
                <div className="mc-container mc-container-jornal">
                    <p className="mc-estado-vazio">Carregando Morning Calls...</p>
                </div>
            </div>
        );
    }

    if (erro) {
        return (
            <div className="mc-page">
                <div className="mc-container mc-container-jornal">
                    <p className="mc-estado-vazio">Não foi possível carregar os Morning Calls agora.</p>
                </div>
            </div>
        );
    }

    if (morningCalls.length === 0) {
        return (
            <div className="mc-page">
                <div className="mc-container mc-container-jornal">
                    <p className="mc-estado-vazio">Nenhum Morning Call publicado ainda.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mc-page">
            <div className="mc-container mc-container-jornal">
                {morningCalls.map(mc => (
                    <div className="mc-bloco" key={mc.id}>
                        <div className="mc-reader-header">
                            <div className="mc-reader-tag">
                                <span className="mc-icon-sm">☕</span>
                                <span>MORNING CALL</span>
                            </div>
                            <h1 className="mc-reader-title">{mc.titulo}</h1>
                            <div className="mc-reader-meta">
                                <span>📅 {formatarData(mc.data)}</span>
                                <span>👤 {mc.nomeGestor}</span>
                            </div>
                        </div>

                        <div className="mc-noticias-grid">
                            {mc.topicos.map((topico, index) => (
                                <article className="mc-noticia-card" key={topico.id}>
                                    {topico.imagemUrl && (
                                        <div className="mc-noticia-imagem-wrap">
                                            <img
                                                className="mc-noticia-imagem"
                                                src={topico.imagemUrl}
                                                alt={topico.titulo}
                                            />
                                            <span className="mc-noticia-badge">MORNING CALL</span>
                                        </div>
                                    )}

                                    <div className="mc-noticia-corpo">
                                        <div className="mc-noticia-meta">
                                            <span>{formatarData(mc.data)}</span>
                                            <span className="mc-noticia-meta-dot">•</span>
                                            <span>{tempoLeitura(topico.texto)}</span>
                                        </div>

                                        <h2 className="mc-noticia-titulo">
                                            <span className="mc-reader-num">
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                            {topico.titulo}
                                        </h2>

                                        <p className="mc-noticia-texto">{topico.texto}</p>

                                        {topico.link && (
                                            <a className="mc-reader-link" href={topico.link} target="_blank" rel="noopener noreferrer">
                                                Ler notícia completa &rarr;
                                            </a>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="mc-reader-footer">
                    Morning Call preparado pelo seu gestor · Caddie Research
                </div>
            </div>
        </div>
    );
}

export default MorningCall;