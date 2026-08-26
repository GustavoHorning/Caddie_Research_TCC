import { useState } from 'react';
import './MorningCall.css';

interface Topico {
    titulo: string;
    texto: string;
    link: string;
}

// Lista de clientes mockada (por enquanto fixa; depois vem do backend)
const CLIENTES_MOCK = [
    'João Silva',
    'Maria Souza',
    'Carlos Lima',
];

function MorningCallGestor() {
    const [cliente, setCliente] = useState(CLIENTES_MOCK[0]);
    const [titulo, setTitulo] = useState('');
    const [data, setData] = useState(new Date().toISOString().split('T')[0]);
    const [topicos, setTopicos] = useState<Topico[]>([
        { titulo: '', texto: '', link: '' },
    ]);

    function adicionarTopico() {
        setTopicos([...topicos, { titulo: '', texto: '', link: '' }]);
    }

    function removerTopico(index: number) {
        setTopicos(topicos.filter((_, i) => i !== index));
    }

    function atualizarTopico(index: number, campo: keyof Topico, valor: string) {
        const novos = [...topicos];
        novos[index][campo] = valor;
        setTopicos(novos);
    }

    function publicar() {
        // Por enquanto só mostra no console (sem backend ainda)
        const morningCall = { cliente, titulo, data, topicos };
        console.log('Morning Call a publicar:', morningCall);
        alert('Morning Call montado! (integração com o backend será feita na próxima etapa)');
    }

    return (
        <div className="mc-page">
            <div className="mc-container">
                <div className="mc-header">
                    <span className="mc-icon">☕</span>
                    <div>
                        <h1 className="mc-title">Publicar Morning Call</h1>
                        <p className="mc-subtitle">Monte o resumo do dia para um cliente específico</p>
                    </div>
                </div>

                <div className="mc-row">
                    <div className="mc-field">
                        <label>Cliente</label>
                        <select value={cliente} onChange={e => setCliente(e.target.value)}>
                            {CLIENTES_MOCK.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mc-field">
                        <label>Data</label>
                        <input
                            type="date"
                            value={data}
                            onChange={e => setData(e.target.value)}
                        />
                    </div>
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
                        <input
                            type="text"
                            placeholder="Título da notícia"
                            value={topico.titulo}
                            onChange={e => atualizarTopico(index, 'titulo', e.target.value)}
                        />
                        <textarea
                            placeholder="Escreva o resumo para este cliente..."
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
                    <button className="mc-btn-cancel">Cancelar</button>
                    <button className="mc-btn-publish" onClick={publicar}>
                        Publicar Morning Call
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MorningCallGestor;