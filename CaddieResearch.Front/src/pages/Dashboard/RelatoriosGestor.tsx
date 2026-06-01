import React, { useState, useEffect } from 'react';
import './Gestor/PainelGestor.css';
import SidebarGestor from '../../components/SidebarGestor';
import TopBar from '../../components/TopBar';
import api from '../../services/api';

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
    carteiraId: number;
    carteira?: Carteira;
    dataPublicacao: string;
}

export default function RelatoriosGestor() {
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);
    
    const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
    const [carteirasLista, setCarteirasLista] = useState<Carteira[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [termoBusca, setTermoBusca] = useState('');

    const [mostrarForm, setMostrarForm] = useState(false);
    const [relatorioEditandoId, setRelatorioEditandoId] = useState<number | null>(null);
    const [relatorioParaRemover, setRelatorioParaRemover] = useState<{id: number, titulo: string} | null>(null);

    const [toastMsg, setToastMsg] = useState('');
    const [toastTipo, setToastTipo] = useState<'sucesso' | 'erro'>('sucesso');

    const [titulo, setTitulo] = useState('');
    const [assunto, setAssunto] = useState('');
    const [conteudoTexto, setConteudoTexto] = useState('');
    const [carteiraId, setCarteiraId] = useState<number | string>('');
    const [arquivoPdf, setArquivoPdf] = useState<File | null>(null);
    const [loadingForm, setLoadingForm] = useState(false);

    const configSeguranca = { headers: { Authorization: `Bearer ${localStorage.getItem('caddie_token')}` } };

    useEffect(() => {
        carregarCarteiras();
        carregarRelatorios();
    }, []);

    const carregarCarteiras = async () => {
        try {
            const response = await api.get('/api/carteiras', configSeguranca);
            setCarteirasLista(response.data);
            if (response.data.length > 0) {
                setCarteiraId(response.data[0].id);
            }
        } catch (error) {
            console.error("Erro ao carregar carteiras", error);
        }
    };

    const carregarRelatorios = async () => {
        setCarregando(true);
        try {
            const response = await api.get('/api/relatorios', configSeguranca);
            setRelatorios(response.data);
        } catch (error) {
            console.error("Erro ao carregar relatórios", error);
        } finally {
            setCarregando(false);
        }
    };

    const mostrarNotificacao = (msg: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
        setToastMsg(msg);
        setToastTipo(tipo);
        setTimeout(() => setToastMsg(''), 3000);
    };

    const limparFormulario = () => {
        setMostrarForm(false);
        setRelatorioEditandoId(null);
        setTitulo('');
        setAssunto('');
        setConteudoTexto('');
        if (carteirasLista.length > 0) setCarteiraId(carteirasLista[0].id);
        setArquivoPdf(null);
    };

    const handleEditar = (relatorio: Relatorio) => {
        setRelatorioEditandoId(relatorio.id);
        setTitulo(relatorio.titulo);
        setAssunto(relatorio.assunto);
        setConteudoTexto(relatorio.conteudoTexto);
        setCarteiraId(relatorio.carteiraId);
        setArquivoPdf(null); 
        setMostrarForm(true);
    };

    const handleConfirmarRemocao = async () => {
        if (!relatorioParaRemover) return;
        try {
            await api.delete(`/api/relatorios/${relatorioParaRemover.id}`, configSeguranca);
            mostrarNotificacao(`Relatório removido com sucesso!`, "sucesso");
            carregarRelatorios();
        } catch (error) {
            console.error(error);
            mostrarNotificacao("Erro ao remover relatório.", "erro");
        } finally {
            setRelatorioParaRemover(null);
        }
    };

    const handleSubmit = async () => {
        if (!titulo || !assunto || !carteiraId) {
            return mostrarNotificacao("Preencha os campos obrigatórios!", "erro");
        }

        setLoadingForm(true);
        const formData = new FormData();
        formData.append('titulo', titulo);
        formData.append('assunto', assunto);
        formData.append('conteudoTexto', conteudoTexto);
        formData.append('carteiraId', carteiraId.toString());
        
        if (arquivoPdf) {
            formData.append('arquivoPdf', arquivoPdf);
        }

        try {
            if (relatorioEditandoId) {
                await api.put(`/api/relatorios/${relatorioEditandoId}`, formData, {
                    headers: { ...configSeguranca.headers, 'Content-Type': 'multipart/form-data' }
                });
                mostrarNotificacao("Relatório atualizado com sucesso!", "sucesso");
            } else {
                await api.post('/api/relatorios', formData, {
                    headers: { ...configSeguranca.headers, 'Content-Type': 'multipart/form-data' }
                });
                mostrarNotificacao("Relatório publicado com sucesso!", "sucesso");
            }
            limparFormulario();
            carregarRelatorios();
        } catch (error) {
            console.error("Erro ao salvar relatório", error);
            mostrarNotificacao("Ocorreu um erro ao salvar o relatório.", "erro");
        } finally {
            setLoadingForm(false);
        }
    };

    const relatoriosFiltrados = relatorios.filter(rel => 
        rel.titulo.toLowerCase().includes(termoBusca.toLowerCase()) || 
        rel.assunto.toLowerCase().includes(termoBusca.toLowerCase())
    );

    return (
        <div className="dashboard-layout">
            <SidebarGestor activePath="/gestor/relatorios" isOpen={menuMobileAberto} onClose={() => setMenuMobileAberto(false)} />
            {menuMobileAberto && <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>}

            <TopBar userName="Gestor" onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />

            <main className="dashboard-main">
                <div className="gestor-content">

                    <div className="gestor-header-title">
                        <h2>Central de Relatórios</h2>
                        <p>Publique relatórios em PDF e análises vinculadas aos planos de assinatura.</p>
                    </div>

                    <div className="gestor-card" style={{ marginTop: '32px' }}>
                        <div className="gestor-ativos-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '16px' }}>
                            <div className="gestor-busca">
                                <input 
                                    type="text" 
                                    placeholder="Buscar relatório..." 
                                    value={termoBusca} 
                                    onChange={(e) => setTermoBusca(e.target.value)} 
                                />
                            </div>
                            <button className="gestor-btn-novo-ativo" onClick={() => { setMostrarForm(true); setRelatorioEditandoId(null); }}>
                                + Novo Relatório
                            </button>
                        </div>

                        {/* Modal de Formulário (Mesmo padrão do PainelGestor) */}
                        {mostrarForm && (
                            <div className="modal-cadastro-overlay">
                                <div className="modal-cadastro-content">
                                    <div className="modal-cadastro-header">
                                        <h3>{relatorioEditandoId ? "Editar Relatório" : "Publicar Novo Relatório"}</h3>
                                        <button className="modal-btn-fechar" onClick={limparFormulario}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </div>

                                    <div className="gestor-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                                        <div className="gestor-upload-campos">
                                            
                                            <div className="gestor-campo-row">
                                                <div className="gestor-campo">
                                                    <label>Carteira Destino (Define o plano necessário para ler)</label>
                                                    <select value={carteiraId} onChange={e => setCarteiraId(Number(e.target.value))}>
                                                        {carteirasLista.length === 0 && <option value="">Carregando carteiras...</option>}
                                                        {carteirasLista.map(cart => (
                                                            <option key={cart.id} value={cart.id}>
                                                                {cart.nome} (Nível {cart.nivelAcesso})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="gestor-campo">
                                                    <label>Assunto / Categoria</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Ex: Fechamento de Mercado, Resultado 3T26..." 
                                                        value={assunto} 
                                                        onChange={e => setAssunto(e.target.value)} 
                                                    />
                                                </div>
                                            </div>

                                            <div className="gestor-campo-row">
                                                <div className="gestor-campo">
                                                    <label>Título do Relatório</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Ex: A tese estrutural de Vale (VALE3)" 
                                                        value={titulo} 
                                                        onChange={e => setTitulo(e.target.value)} 
                                                    />
                                                </div>
                                            </div>

                                            <div className="gestor-campo-row">
                                                <div className="gestor-campo">
                                                    <label>Conteúdo (Texto Livre)</label>
                                                    <textarea 
                                                        value={conteudoTexto} 
                                                        onChange={e => setConteudoTexto(e.target.value)} 
                                                        placeholder="Escreva um resumo ou a análise completa aqui..." 
                                                        rows={5}
                                                        style={{ 
                                                            width: '100%', padding: '12px 16px', borderRadius: '10px', 
                                                            background: 'rgba(255, 255, 255, 0.04)', color: '#fff', 
                                                            border: '1px solid rgba(255, 255, 255, 0.1)', outline: 'none',
                                                            fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical'
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="gestor-campo-row">
                                                <div className="gestor-campo">
                                                    <label>Anexar Arquivo PDF {relatorioEditandoId && "(Opcional - Selecione para substituir)"}</label>
                                                    <div style={{ border: '2px dashed rgba(0, 180, 216, 0.3)', padding: '24px', textAlign: 'center', borderRadius: '10px', background: 'rgba(0, 180, 216, 0.02)' }}>
                                                        <input 
                                                            type="file" 
                                                            accept="application/pdf"
                                                            onChange={e => setArquivoPdf(e.target.files ? e.target.files[0] : null)}
                                                            style={{ width: '100%', background: 'transparent', border: 'none' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="gestor-form-acoes" style={{ gridColumn: '1 / -1', marginTop: '24px' }}>
                                                <button className="gestor-btn-cancelar" onClick={limparFormulario} disabled={loadingForm}>Cancelar</button>
                                                <button className="gestor-btn-publicar" onClick={handleSubmit} disabled={loadingForm}>
                                                    {loadingForm ? 'Salvando...' : (relatorioEditandoId ? "Salvar Alterações" : "Publicar Relatório")}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="gestor-tabela-wrapper">
                            <table className="gestor-tabela">
                                <thead>
                                    <tr>
                                        <th>Título / Assunto</th>
                                        <th>Carteira Vinculada</th>
                                        <th className="td-center">Data</th>
                                        <th className="td-center">Anexo</th>
                                        <th className="td-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {carregando ? (
                                        [1, 2, 3].map((skeleton) => (
                                            <tr key={`skeleton-${skeleton}`}>
                                                <td className="gestor-td-ticker"><div className="skeleton skeleton-text" style={{width: '180px', height: '20px'}}></div></td>
                                                <td className="gestor-td-empresa"><div className="skeleton skeleton-text" style={{width: '100px', height: '16px'}}></div></td>
                                                <td className="td-center"><div className="skeleton skeleton-text" style={{width: '80px', height: '20px', margin: '0 auto'}}></div></td>
                                                <td className="td-center"><div className="skeleton skeleton-text" style={{width: '40px', height: '24px', margin: '0 auto'}}></div></td>
                                                <td className="td-center"><div className="skeleton skeleton-text" style={{width: '60px', height: '24px', margin: '0 auto'}}></div></td>
                                            </tr>
                                        ))
                                    ) : relatoriosFiltrados.length > 0 ? (
                                        relatoriosFiltrados.map((rel) => (
                                            <tr key={rel.id}>
                                                <td className="gestor-td-ticker" data-label="Título">
                                                    {rel.titulo}
                                                    <span style={{ display: 'block', fontSize: '11px', color: '#8b949e', fontWeight: 500, marginTop: '4px' }}>
                                                        {rel.assunto}
                                                    </span>
                                                </td>

                                                <td className="gestor-td-empresa" data-label="Carteira">
                                                    <span style={{ color: '#e6edf3', fontWeight: 500 }}>
                                                        {rel.carteira ? rel.carteira.nome : 'Desconhecida'}
                                                    </span>
                                                </td>

                                                <td className="td-center" data-label="Data" style={{ color: '#8b949e', fontSize: '0.9rem' }}>
                                                    {new Date(rel.dataPublicacao).toLocaleDateString('pt-BR')}
                                                </td>

                                                <td className="td-center" data-label="Anexo">
                                                    {rel.arquivoPdfUrl ? (
                                                        <a href={rel.arquivoPdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#00B4D8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                                            PDF
                                                        </a>
                                                    ) : (
                                                        <span style={{ color: '#6e7681', fontSize: '0.85rem' }}>Sem anexo</span>
                                                    )}
                                                </td>

                                                <td className="td-center" data-label="Ações">
                                                    <div className="gestor-acoes-grupo">
                                                        <button className="btn-acao-svg btn-editar" onClick={() => handleEditar(rel)} title="Editar Relatório">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                            </svg>
                                                        </button>
                                                        <button className="btn-acao-svg btn-remover" onClick={() => setRelatorioParaRemover({id: rel.id, titulo: rel.titulo})} title="Remover Relatório">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                                                <line x1="14" y1="11" x2="14" y2="17"></line>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>
                                                {termoBusca ? "Nenhum relatório encontrado." : "Nenhum relatório publicado ainda."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>

            {/* Modal de Confirmação de Remoção */}
            {relatorioParaRemover && (
                <div className="gestor-modal-overlay">
                    <div className="gestor-modal-box">
                        <div className="gestor-modal-icone">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <h3>Remover Relatório</h3>
                        <p>Tem certeza que deseja apagar o relatório <strong>{relatorioParaRemover.titulo}</strong>? O PDF associado também será apagado da nuvem.</p>
                        <div className="gestor-modal-acoes">
                            <button className="gestor-btn-cancelar" onClick={() => setRelatorioParaRemover(null)}>Cancelar</button>
                            <button className="gestor-btn-remover-confirmar" onClick={handleConfirmarRemocao}>Sim, apagar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toasts (Notificações) */}
            {toastMsg && (
                <div className={`gestor-toast toast-${toastTipo}`}>
                    {toastMsg}
                </div>
            )}
        </div>
    )
}