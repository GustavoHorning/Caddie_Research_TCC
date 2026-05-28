import React, { useState, useEffect, useRef } from 'react';
import './GlobalSearch.css';
import PdfViewerModal from './PdfViewerModal';
import { useNavigate } from 'react-router-dom';

const mockResultados = [
    { id: 1, tipo: 'Relatório', titulo: 'Oportunidades em Energia e Petróleo', tags: ['PETR4', 'ENBR3', 'PRIO3'], data: '27 Mai 2026', url: '/relatorios/1' },
    { id: 2, tipo: 'Tese', titulo: 'Por que comprar Petrobras agora?', tags: ['PETR4', 'DIVIDENDOS'], data: '15 Mai 2026', url: '/teses/2' },
    { id: 3, tipo: 'Carteira', titulo: 'Carteira Top 10 Dividendos', tags: ['VALE3', 'PETR4', 'BBAS3'], data: '01 Mai 2026', url: '/carteiras/1' },
    { id: 4, tipo: 'Relatório', titulo: 'Resultados do 1T26 do Banco do Brasil', tags: ['BBAS3', 'BANCOS'], data: '10 Mai 2026', url: '/relatorios/4' },
    { id: 5, tipo: 'Tese', titulo: 'A Queda da Selic e o Impacto nos FIIs', tags: ['FIIs', 'MACRO', 'SELIC'], data: '20 Abr 2026', url: '/teses/5' },
];

export default function GlobalSearch({ onClose }: { onClose: () => void }) {
    const [termoBusca, setTermoBusca] = useState('');
    const [termoDebounced, setTermoDebounced] = useState('');
    const [filtroAtivo, setFiltroAtivo] = useState('Todos');
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const [documentoAtivo, setDocumentoAtivo] = useState<{url: string, titulo: string} | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        setIsSearching(true);
        const timer = setTimeout(() => {
            setTermoDebounced(termoBusca);
            setIsSearching(false);
            setSelectedIndex(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [termoBusca]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev < resultadosFiltrados.length - 1 ? prev + 1 : prev));
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
            }
            if (e.key === 'Enter' && resultadosFiltrados.length > 0) {
                e.preventDefault();
                handleOpenResult(resultadosFiltrados[selectedIndex]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const resultadosFiltrados = mockResultados.filter(item =>
        (filtroAtivo === 'Todos' || item.tipo === filtroAtivo) &&
        (item.titulo.toLowerCase().includes(termoDebounced.toLowerCase()) ||
            item.tags.some(tag => tag.toLowerCase().includes(termoDebounced.toLowerCase())))
    );

    const handleOpenResult = (item: any) => {
        if (item.tipo === 'Relatório' || item.tipo === 'Tese') {
            setDocumentoAtivo({
                url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                titulo: item.titulo
            });
        } else if (item.tipo === 'Carteira') {
            navigate(item.url);
            onClose();
        }
    };

    return (
        <div className="search-overlay" onClick={onClose}>
            <div className="search-modal" onClick={e => e.stopPropagation()}>

                <div className="search-header">
                    <span className="search-icon">{isSearching ? '⏳' : '🔍'}</span>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Pesquisar relatórios, teses ou ativos (ex: PETR4)..."
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                    />
                    <button className="esc-badge" onClick={onClose}>ESC</button>
                </div>

                <div className="search-filters">
                    {['Todos', 'Relatório', 'Tese', 'Carteira'].map(filtro => (
                        <button
                            key={filtro}
                            className={`filter-chip ${filtroAtivo === filtro ? 'active' : ''}`}
                            onClick={() => {
                                setFiltroAtivo(filtro);
                                setSelectedIndex(0);
                                if (inputRef.current) inputRef.current.focus();
                            }}
                        >
                            {filtro}
                        </button>
                    ))}
                </div>

                <div className="search-results">
                    {termoDebounced.length === 0 ? (
                        <div className="search-empty-state">
                            <span>Digite o nome de um ativo (ex: VALE3) ou assunto para começar a buscar.</span>
                        </div>
                    ) : isSearching ? (
                        <div className="search-empty-state">
                            <span style={{ animation: 'pulse 1.5s infinite' }}>Buscando...</span>
                        </div>
                    ) : resultadosFiltrados.length > 0 ? (
                        resultadosFiltrados.map((item, index) => (
                            <div
                                key={item.id}
                                className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                                onMouseEnter={() => setSelectedIndex(index)}
                                onClick={() => handleOpenResult(item)}
                            >
                                <div className="result-info">
                                    <span className="result-type">{item.tipo}</span>
                                    <h4 className="result-title">{item.titulo}</h4>
                                    <div className="result-tags">
                                        {item.tags.map(tag => (
                                            <span key={tag} className={`tag ${tag.toLowerCase().includes(termoDebounced.toLowerCase()) ? 'highlight' : ''}`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <span className="result-date">{item.data}</span>
                                {index === selectedIndex && (
                                    <span style={{marginLeft: '12px', color: '#00B4D8', fontSize: '1.2rem'}}>↵</span>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="search-empty-state">
                            <span>Nenhum resultado encontrado para "{termoDebounced}".</span>
                            <p style={{fontSize: '0.8rem', marginTop: '8px', opacity: 0.5}}>Tente termos como "PETR4", "Dividendos" ou "Tese".</p>
                        </div>
                    )}
                </div>

                <div className="search-footer">
                    <span>Use as setas <strong>↑ ↓</strong> para navegar e <strong>Enter ↵</strong> para abrir.</span>
                </div>
            </div>
            <PdfViewerModal
                isOpen={documentoAtivo !== null}
                onClose={() => setDocumentoAtivo(null)}
                pdfUrl={documentoAtivo?.url || ''}
                titulo={documentoAtivo?.titulo || ''}
            />
            
        </div>
    );
}