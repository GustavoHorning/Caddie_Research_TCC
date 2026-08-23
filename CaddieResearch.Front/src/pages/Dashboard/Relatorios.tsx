import React, { useState, useEffect } from 'react';
import './Relatorios.css';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import api from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import PdfViewerModal from '../../components/PdfViewerModal';

interface Carteira {
    id: number;
    nome: string;
    nivelAcesso: number;
}

interface Relatorio {
    id: number;
    titulo: string;
    assunto: string;
    conteudoTexto: string;
    arquivoPdfUrl: string | null;
    carteira?: Carteira;
    dataPublicacao: string;
}

export default function Relatorios() {
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);
    const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [abaAtiva, setAbaAtiva] = useState<'todos' | 'revisados'>('todos');
    const [idsRevisados, setIdsRevisados] = useState<number[]>([]);

    const [nivelAcessoUsuario, setNivelAcessoUsuario] = useState<number>(0);

    const [modalUpgradeAberto, setModalUpgradeAberto] = useState(false);
    const [nomeCarteiraModal, setNomeCarteiraModal] = useState('');

    const [viewerAberto, setViewerAberto] = useState(false);
    const [viewerUrl, setViewerUrl] = useState('');
    const [viewerTitulo, setViewerTitulo] = useState('');

    const navigate = useNavigate();

    const location = useLocation();

    useEffect(() => {
        if (carregando || relatorios.length === 0) return;

        const params = new URLSearchParams(location.search);
        const highlightId = params.get('highlight');
        
        if (highlightId) {
            setTimeout(() => {
                const element = document.getElementById(`relatorio-${highlightId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('highlight-pulse');
                    
                    window.history.replaceState(null, '', '/relatorios');
                    
                    setTimeout(() => element.classList.remove('highlight-pulse'), 2000);
                }
            }, 300);
        }
    }, [location.search, relatorios, carregando]);
    
    const configSeguranca = { headers: { Authorization: `Bearer ${localStorage.getItem('caddie_token')}` } };

    useEffect(() => {
        descobrirNivelUsuario();
        carregarRelatorios();
        carregarRevisados();
    }, []);

    const descobrirNivelUsuario = () => {
        const token = localStorage.getItem('caddie_token');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const decoded = JSON.parse(jsonPayload);
                
                const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded['Role'] || decoded['role'];
                const plano = (decoded['Plano'] || decoded['plano'] || '').toLowerCase();

                if (role === 'Gestor') {
                    setNivelAcessoUsuario(999);
                    return;
                }
                
                if (plano.includes('black')) setNivelAcessoUsuario(3);
                else if (plano.includes('premium')) setNivelAcessoUsuario(2);
                else if (plano.includes('basic')) setNivelAcessoUsuario(1);
                else setNivelAcessoUsuario(0);
                
            } catch (e) {
                console.error("Erro ao ler token", e);
                setNivelAcessoUsuario(0);
            }
        }
    };

    const carregarRevisados = async () => {
        try {
            const response = await api.get('/api/relatorios/revisados', configSeguranca);
            setIdsRevisados(response.data);
        } catch (error) {
            console.error("Erro ao carregar revisados", error);
        }
    };

    const toggleRevisado = async (id: number) => {
        const jaRevisado = idsRevisados.includes(id);
        try {
            if (jaRevisado) {
                await api.delete(`/api/relatorios/${id}/revisado`, configSeguranca);
                setIdsRevisados(prev => prev.filter(r => r !== id));
            } else {
                await api.post(`/api/relatorios/${id}/revisado`, {}, configSeguranca);
                setIdsRevisados(prev => [...prev, id]);
            }
        } catch (error) {
            console.error("Erro ao marcar revisado", error);
        }
    };

    const carregarRelatorios = async () => {
        try {
            const response = await api.get('/api/relatorios', configSeguranca);
            setRelatorios(response.data);
        } catch (error) {
            console.error("Erro ao carregar relatórios", error);
        } finally {
            setCarregando(false);
        }
    };

    const abrirModalUpgrade = (carteiraNome: string) => {
        setNomeCarteiraModal(carteiraNome);
        setModalUpgradeAberto(true);
    };

    const handleAbrirPdf = async (id: number, titulo: string, carteiraNome: string) => {
        try {
            const response = await api.get(`/api/relatorios/${id}/download`, {
                ...configSeguranca,
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            setViewerUrl(url);
            setViewerTitulo(titulo);
            setViewerAberto(true);
        } catch (error: any) {
            console.error("Erro ao abrir PDF", error);
            if (error.response?.status === 403 || error.response?.status === 401) {
                abrirModalUpgrade(carteiraNome);
            } else {
                alert("Ocorreu um erro ao baixar o arquivo.");
            }
        }
    };

    const handleFecharViewer = () => {
        if (viewerUrl) window.URL.revokeObjectURL(viewerUrl);
        setViewerAberto(false);
        setViewerUrl('');
    };

    return (
        <div className="dashboard-layout">
            <Sidebar activePath="/relatorios" isOpen={menuMobileAberto} onClose={() => setMenuMobileAberto(false)} />
            {menuMobileAberto && <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>}

            <TopBar userName="Assinante" onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />

            <main className="dashboard-main">
                <div className="gestor-content">
                    <div className="gestor-header-title">
                        <h2>Biblioteca de Relatórios</h2>
                        <p>Acompanhe as análises exclusivas, resultados e recomendações dos nossos especialistas.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', margin: '24px 0 8px' }}>
                        <button
                            onClick={() => setAbaAtiva('todos')}
                            style={{
                                padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                                background: abaAtiva === 'todos' ? '#00B4D8' : 'rgba(255,255,255,0.07)',
                                color: abaAtiva === 'todos' ? '#fff' : '#8b949e'
                            }}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setAbaAtiva('revisados')}
                            style={{
                                padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                                background: abaAtiva === 'revisados' ? '#00B4D8' : 'rgba(255,255,255,0.07)',
                                color: abaAtiva === 'revisados' ? '#fff' : '#8b949e'
                            }}
                        >
                            ✓ Revisados ({idsRevisados.length})
                        </button>
                    </div>

                    {carregando ? (
                        <p style={{ color: '#8b949e', marginTop: '24px' }}>Carregando biblioteca...</p>
                    ) : (
                        <div className="relatorios-cliente-grid">
                            {relatorios.filter(rel => abaAtiva === 'todos' || idsRevisados.includes(rel.id)).map(rel => {
                                const nivelExigido = rel.carteira?.nivelAcesso || 1;
                                const temAcesso = nivelAcessoUsuario >= nivelExigido;
                                const nomeCarteira = rel.carteira?.nome || 'Geral';

                                return (
                                    <div key={rel.id} id={`relatorio-${rel.id}`} className={`relatorio-cliente-card ${!temAcesso ? 'locked' : ''}`}>
                                        <span className="relatorio-tag-carteira">
                                            {nomeCarteira}
                                        </span>
                                        
                                        <h3 className="relatorio-titulo">{rel.titulo}</h3>
                                        <div className="relatorio-assunto">
                                            {rel.assunto} • {new Date(rel.dataPublicacao).toLocaleDateString('pt-BR')}
                                        </div>

                                        <div className="relatorio-conteudo-wrapper">
                                            <p className="relatorio-conteudo-preview">
                                                {!temAcesso 
                                                    ? "Conteúdo indisponível para o seu plano atual. Ative uma assinatura para desbloquear a leitura detalhada desta análise estrutural completa da casa de pesquisa."
                                                    : (rel.conteudoTexto || "Confira a análise completa e os fundamentos da nossa recomendação no anexo PDF deste relatório.")
                                                }
                                            </p>
                                        </div>

                                        <div style={{ marginTop: '12px' }}>
                                            <button
                                                onClick={() => toggleRevisado(rel.id)}
                                                style={{
                                                    background: idsRevisados.includes(rel.id) ? 'rgba(0, 180, 216, 0.15)' : 'rgba(255,255,255,0.05)',
                                                    border: `1px solid ${idsRevisados.includes(rel.id) ? '#00B4D8' : 'rgba(255,255,255,0.1)'}`,
                                                    color: idsRevisados.includes(rel.id) ? '#00B4D8' : '#8b949e',
                                                    borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
                                                    fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'
                                                }}
                                            >
                                                {idsRevisados.includes(rel.id) ? '✓ Revisado' : '○ Marcar como Revisado'}
                                            </button>
                                        </div>

                                        <div className="relatorio-footer">
                                            {!temAcesso ? (
                                                <button onClick={() => abrirModalUpgrade(nomeCarteira)} className="btn-relatorio-bloqueado">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                    Conteúdo Restrito (Upgrade)
                                                </button>
                                            ) : (
                                                rel.arquivoPdfUrl ? (
                                                    <button onClick={() => handleAbrirPdf(rel.id, rel.titulo, nomeCarteira)} className="btn-baixar-pdf">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                                        Ler Relatório PDF
                                                    </button>
                                                ) : (
                                                    <span style={{ color: '#8b949e', fontSize: '0.85rem' }}>Relatório apenas em texto</span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>

            {modalUpgradeAberto && (
                <div className="upgrade-modal-overlay" onClick={() => setModalUpgradeAberto(false)}>
                    <div className="upgrade-modal-box" onClick={e => e.stopPropagation()}>
                        <div className="upgrade-modal-icone">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <h3>Conteúdo Exclusivo</h3>
                        <p>
                            Este relatório pertence à estratégia de <strong>{nomeCarteiraModal}</strong>. 
                            Sua conta atual não possui acesso a esta análise. Deseja conhecer nossos planos para liberar o acesso?
                        </p>
                        <div className="upgrade-modal-acoes">
                            <button className="btn-modal-upgrade-confirmar" onClick={() => navigate('/gerenciar-plano')}>
                                Ver Planos de Assinatura
                            </button>
                            <button className="btn-modal-upgrade-cancelar" onClick={() => setModalUpgradeAberto(false)}>
                                Voltar para a Biblioteca
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <PdfViewerModal 
                isOpen={viewerAberto} 
                onClose={handleFecharViewer} 
                pdfUrl={viewerUrl} 
                titulo={viewerTitulo} 
            />
        </div>
    );
}