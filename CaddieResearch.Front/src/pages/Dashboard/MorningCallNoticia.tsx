import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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

function formatarDataCurta(dataIso: string): string {
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
}

function MorningCallNoticia() {
    const { id } = useParams();
    const [morningCall, setMorningCall] = useState<MorningCallItem | null>(null);
    const [topico, setTopico] = useState<Topico | null>(null);
    const [indiceTopico, setIndiceTopico] = useState(0);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);

    const configSeguranca = { headers: { Authorization: `Bearer ${localStorage.getItem('caddie_token')}` } };

    useEffect(() => {
        async function carregarNoticia() {
            setCarregando(true);
            setErro(false);
            try {
                const response = await api.get('/api/morningcall', configSeguranca);
                const morningCalls: MorningCallItem[] = response.data;

                // Procura, entre todos os Morning Calls, qual tem o tópico com esse id
                for (const mc of morningCalls) {
                    const idx = mc.topicos.findIndex(t => t.id === Number(id));
                    if (idx !== -1) {
                        setMorningCall(mc);
                        setTopico(mc.topicos[idx]);
                        setIndiceTopico(idx);
                        return;
                    }
                }
                setErro(true);
            } catch (error) {
                console.error('Erro ao carregar notícia', error);
                setErro(true);
            } finally {
                setCarregando(false);
            }
        }

        carregarNoticia();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (carregando) {
        return (
            <div className="mc-page">
                <div className="mc-container mc-container-noticia">
                    <p className="mc-estado-vazio">Carregando notícia...</p>
                </div>
            </div>
        );
    }

    if (erro || !morningCall || !topico) {
        return (
            <div className="mc-page">
                <div className="mc-container mc-container-noticia">
                    <p className="mc-estado-vazio">Não foi possível encontrar essa notícia.</p>
                    <Link to="/morning-call" className="mc-voltar-link">← Voltar para o Morning Call</Link>
                </div>
            </div>
        );
    }

    // Divide o texto em parágrafos reais (ignora linhas em branco)
    const paragrafos = topico.texto.split('\n').filter(p => p.trim().length > 0);

    return (
        <div className="mc-page">
            <div className="mc-container mc-container-noticia">
                <Link to="/morning-call" className="mc-voltar-link">← Voltar para o Morning Call</Link>

                {/* Cabeçalho editorial: etiqueta + numeração + linha de destaque */}
                <div className="mc-editorial-header">
                    <div className="mc-editorial-etiqueta">
                        <span className="mc-icon-sm">☕</span>
                        <span>MORNING CALL</span>
                        <span className="mc-editorial-separador">•</span>
                        <span>NOTÍCIA {String(indiceTopico + 1).padStart(2, '0')} DE {String(morningCall.topicos.length).padStart(2, '0')}</span>
                    </div>
                    <div className="mc-editorial-linha"></div>
                </div>

                <h1 className="mc-noticia-titulo-completo">{topico.titulo}</h1>

                {/* Barra de metadados no estilo "byline" de jornal */}
                <div className="mc-editorial-byline">
                    <div className="mc-editorial-byline-item">
                        <span className="mc-editorial-byline-label">Publicado por</span>
                        <span className="mc-editorial-byline-valor">{morningCall.nomeGestor}</span>
                    </div>
                    <div className="mc-editorial-byline-divisor"></div>
                    <div className="mc-editorial-byline-item">
                        <span className="mc-editorial-byline-label">Data</span>
                        <span className="mc-editorial-byline-valor">{formatarData(morningCall.data)}</span>
                    </div>
                    <div className="mc-editorial-byline-divisor"></div>
                    <div className="mc-editorial-byline-item">
                        <span className="mc-editorial-byline-label">Leitura</span>
                        <span className="mc-editorial-byline-valor">{tempoLeitura(topico.texto)}</span>
                    </div>
                </div>

                {topico.imagemUrl && (
                    <figure className="mc-noticia-imagem-destaque-wrap">
                        <img
                            className="mc-noticia-imagem-destaque"
                            src={topico.imagemUrl}
                            alt={topico.titulo}
                        />
                        <figcaption className="mc-editorial-legenda">{morningCall.titulo}</figcaption>
                    </figure>
                )}

                <div className="mc-noticia-texto-completo">
                    {paragrafos.map((paragrafo, i) => (
                        <p key={i} className={i === 0 ? 'mc-paragrafo-capitular' : ''}>{paragrafo}</p>
                    ))}
                </div>

                {topico.link && (
                    <a className="mc-reader-link" href={topico.link} target="_blank" rel="noopener noreferrer">
                        🔗 Ver fonte original
                    </a>
                )}

                <div className="mc-editorial-linha" style={{ marginTop: '40px' }}></div>
                <div className="mc-reader-footer" style={{ marginTop: '20px' }}>
                    Parte do Morning Call <strong>"{morningCall.titulo}"</strong>, de {formatarDataCurta(morningCall.data)} · Preparado por {morningCall.nomeGestor}
                </div>
            </div>
        </div>
    );
}

export default MorningCallNoticia;