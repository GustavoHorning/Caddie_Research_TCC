import React, { useState, useEffect, useRef } from 'react';
import './GlobalSearch.css';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function GlobalSearch({ onClose }: { onClose: () => void }) {
    const [termoBusca, setTermoBusca] = useState('');
    const [termoDebounced, setTermoDebounced] = useState('');
    const [filtroAtivo, setFiltroAtivo] = useState('Todos');
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [resultadosApi, setResultadosApi] = useState<any[]>([]);
    const [nivelAcessoUsuario, setNivelAcessoUsuario] = useState<number>(0);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const configSeguranca = { headers: { Authorization: `Bearer ${localStorage.getItem('caddie_token')}` } };

    useEffect(() => {
        const token = localStorage.getItem('caddie_token');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                const decoded = JSON.parse(jsonPayload);
                
                const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded['Role'] || decoded['role'];
                const plano = (decoded['Plano'] || decoded['plano'] || '').toLowerCase();

                if (role === 'Gestor') {
                    setNivelAcessoUsuario(999);
                } else {
                    if (plano.includes('black')) setNivelAcessoUsuario(3);
                    else if (plano.includes('premium')) setNivelAcessoUsuario(2);
                    else if (plano.includes('basic')) setNivelAcessoUsuario(1);
                    else setNivelAcessoUsuario(0);
                }
            } catch (e) {
                setNivelAcessoUsuario(0);
            }
        }
    }, []);

    useEffect(() => {
        setIsSearching(true);
        const timer = setTimeout(() => {
            setTermoDebounced(termoBusca);
        }, 400);
        return () => clearTimeout(timer);
    }, [termoBusca]);

    useEffect(() => {
        const buscarNaApi = async () => {
            if (termoDebounced.length === 0) {
                setResultadosApi([]);
                setIsSearching(false);
                return;
            }

            try {
                const res = await api.get(`/api/buscas/global?termo=${encodeURIComponent(termoDebounced)}`, configSeguranca);
                setResultadosApi(res.data);
            } catch (error) {
                console.error("Erro na busca da API:", error);
            } finally {
                setIsSearching(false);
                setSelectedIndex(0);
            }
        };

        buscarNaApi();
    }, [termoDebounced]);

    const resultadosFiltrados = resultadosApi.filter(item =>
        filtroAtivo === 'Todos' || item.tipo === filtroAtivo || (filtroAtivo === 'Carteira' && item.tipo !== 'Relatório')
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
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

    const handleOpenResult = (item: any) => {
        const temAcesso = nivelAcessoUsuario >= item.nivelExigido;

        if (item.tipo === 'Relatório') {
            navigate(`/relatorios?highlight=${item.realId}`);
        } else {
            if (temAcesso) {
                navigate(`/carteiras/${item.carteiraId}?highlight=${item.realId}`);
            } else {
                navigate(`/carteiras?highlight=carteira_${item.carteiraId}`);
            }
        }
        onClose();
    };

    return (
        <div className="search-overlay" onClick={onClose}>
            <div className="search-modal" onClick={e => e.stopPropagation()}>
                <div className="search-header">
                    <span className="search-icon">{isSearching ? '⏳' : '🔍'}</span>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Pesquisar relatórios, fundos, ativos (ex: PETR4)..."
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                    />
                    <button className="esc-badge" onClick={onClose}>ESC</button>
                </div>

                <div className="search-filters">
                    {['Todos', 'Relatório', 'Ação', 'FII', 'Renda Fixa'].map(filtro => (
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
                            <span>Digite o nome de um ativo, empresa ou assunto para começar a buscar.</span>
                        </div>
                    ) : isSearching ? (
                        <div className="search-empty-state">
                            <span style={{ animation: 'pulse 1.5s infinite' }}>Buscando na base de dados...</span>
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
                                        {item.tags.map((tag: string) => (
                                            <span key={tag} className={`tag ${tag.toLowerCase().includes(termoDebounced.toLowerCase()) ? 'highlight' : ''}`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <span className="result-date">{new Date(item.dataPublicacao).toLocaleDateString('pt-BR')}</span>
                                {index === selectedIndex && (
                                    <span style={{marginLeft: '12px', color: '#00B4D8', fontSize: '1.2rem'}}>↵</span>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="search-empty-state">
                            <span>Nenhum resultado encontrado para "{termoDebounced}".</span>
                            <p style={{fontSize: '0.8rem', marginTop: '8px', opacity: 0.5}}>A busca inteligente pesquisa em relatórios, PDFs e todos os ativos cadastrados.</p>
                        </div>
                    )}
                </div>

                <div className="search-footer">
                    <span>Use as setas <strong>↑ ↓</strong> para navegar e <strong>Enter ↵</strong> para abrir.</span>
                </div>
            </div>
        </div>
    );
}