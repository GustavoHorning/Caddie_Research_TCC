import React, { useState, useEffect } from 'react';
import './Gestor/PainelGestor.css';
import SidebarGestor from '../../components/SidebarGestor';
import TopBar from '../../components/TopBar';
import api from '../../services/api';
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
    carteiraId: number;
    carteira?: Carteira;
    dataPublicacao: string;
    tagsAtivos: string;
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
    const [tagsAtivos, setTagsAtivos] = useState('');
    const [carteiraId, setCarteiraId] = useState<number | string>('');
    const [arquivoPdf, setArquivoPdf] = useState<File | null>(null);
    const [loadingForm, setLoadingForm] = useState(false);

    const [viewerAberto, setViewerAberto] = useState(false);
    const [viewerUrl, setViewerUrl] = useState('');
    const [viewerTitulo, setViewerTitulo] = useState('');

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

    const handleAbrirPdf = async (id: number, titulo: string) => {
        try {
            mostrarNotificacao("A carregar visualizador...", "sucesso");

            const response = await api.get(`/api/relatorios/${id}/download`, {
                ...configSeguranca,
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            setViewerUrl(url);
            setViewerTitulo(titulo);
            setViewerAberto(true);
        } catch (error) {
            console.error("Erro ao abrir o PDF", error);
            mostrarNotificacao("Erro ao carregar documento ou acesso negado.", "erro");
        }
    };

    const handleFecharViewer = () => {
        if (viewerUrl) window.URL.revokeObjectURL(viewerUrl);
        setViewerAberto(false);
        setViewerUrl('');
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
        setTagsAtivos('');
        if (carteirasLista.length > 0) setCarteiraId(carteirasLista[0].id);
        setArquivoPdf(null);
    };

    const handleEditar = (relatorio: Relatorio) => {
        setRelatorioEditandoId(relatorio.id);
        setTitulo(relatorio.titulo);
        setAssunto(relatorio.assunto);
        setConteudoTexto(relatorio.conteudoTexto);
        setTagsAtivos(relatorio.tagsAtivos || '');
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
        formData.append('tagsAtivos', tagsAtivos);
        formData.append('carteiraId', carteiraId.toString());

        if (arquivoPdf) {
            formData.append('arquivoPdf', arquivoPdf);
        }

        try {
            if (relatorioEditandoId) {
                await api.put(`/api/relatorios/${relatorioEditandoId}`, formData, configSeguranca);
                mostrarNotificacao("Relatório atualizado com sucesso!", "sucesso");
            } else {
                await api.post('/api/relatorios', formData, configSeguranca);
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
        rel.assunto.toLowerCase().includes(termoBusca.toLowerCase()) ||
        (rel.tagsAtivos && rel.tagsAtivos.toLowerCase().includes(termoBusca.toLowerCase()))
    );

    // KPIs Calculados
    const totalRelatorios = relatorios.length;
    const relatoriosMes = relatorios.filter(r => {
        const dataPub = new Date(r.dataPublicacao);
        const hoje = new Date();
        return dataPub.getMonth() === hoje.getMonth() && dataPub.getFullYear() === hoje.getFullYear();
    }).length;
    const temArquivoUpload = relatorios.filter(r => r.arquivoPdfUrl).length;

    return (
        <div className="dashboard-layout">
            <SidebarGestor activePath="/gestor/relatorios" isOpen={menuMobileAberto} onClose={() => setMenuMobileAberto(false)} />
            {menuMobileAberto && <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>}

            <TopBar userName="Gestor" onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />

            <main className="dashboard-main">
                {/* 1. WRAPPER PRINCIPAL (O segredo do layout perfeito) */}
                <div className="gestor-page">

                    {/* 2. HEADER EXECUTIVO */}
                    <header className="gestor-hero">
                        <div className="gestor-hero-left">
                            <div className="gestor-kicker-row">
                                <span className="gestor-kicker-badge">Research & Análise</span>
                            </div>
                            <h1 className="gestor-title">Central de Relatórios</h1>
                            <p className="gestor-subtitle">Publique relatórios em PDF, defina os níveis de subscrição exigidos e vincule as análises aos ativos da carteira.</p>
                        </div>
                    </header>

                    {/* 3. STRIP DE KPIs (Opção premium) */}
                    <section className="gestor-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        <div className="gestor-kpi-card">
                            <div className="gestor-kpi-top">
                                <span className="gestor-kpi-label">Volume do Acervo</span>
                                <span className="gestor-kpi-pill pill-cyan">Publicados</span>
                            </div>
                            <strong className="gestor-kpi-value">{totalRelatorios}</strong>
                            <div className="gestor-kpi-bar"><div className="gestor-kpi-fill fill-cyan" style={{ width: '100%' }}></div></div>
                        </div>
                        <div className="gestor-kpi-card">
                            <div className="gestor-kpi-top">
                                <span className="gestor-kpi-label">Produção Mensal</span>
                                <span className="gestor-kpi-pill pill-emerald">Mês Atual</span>
                            </div>
                            <strong className="gestor-kpi-value text-emerald">{relatoriosMes}</strong>
                            <div className="gestor-kpi-bar"><div className="gestor-kpi-fill fill-emerald" style={{ width: '100%' }}></div></div>
                        </div>
                        <div className="gestor-kpi-card">
                            <div className="gestor-kpi-top">
                                <span className="gestor-kpi-label">Taxa de Anexação</span>
                                <span className="gestor-kpi-pill pill-amber">Com PDF Original</span>
                            </div>
                            <strong className="gestor-kpi-value text-amber">{totalRelatorios > 0 ? Math.round((temArquivoUpload / totalRelatorios) * 100) : 0}%</strong>
                            <div className="gestor-kpi-bar"><div className="gestor-kpi-fill fill-amber" style={{ width: `${totalRelatorios > 0 ? (temArquivoUpload / totalRelatorios) * 100 : 0}%` }}></div></div>
                        </div>
                    </section>

                    {/* 4. PAINEL E TABELA */}
                    <section className="gestor-panel">
                        <div className="gestor-toolbar">
                            <div className="gestor-toolbar-left">
                                <div className="gestor-search-box">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Pesquisar por título, assunto ou ticker..."
                                        value={termoBusca}
                                        onChange={(e) => setTermoBusca(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button className="gestor-btn gestor-btn-primary" onClick={() => { setMostrarForm(true); setRelatorioEditandoId(null); }}>
                                + Nova Publicação
                            </button>
                        </div>

                        <div className="gestor-table-container">
                            <table className="gestor-table">
                                <thead>
                                <tr>
                                    <th>Título da Publicação</th>
                                    <th>Categoria / Carteira</th>
                                    <th className="align-center">Acesso (Subscrição)</th>
                                    <th className="align-center">Data</th>
                                    <th className="align-center">Ações</th>
                                </tr>
                                </thead>
                                <tbody>
                                {carregando ? (
                                    [1, 2, 3].map((n) => (
                                        <tr key={`sk-${n}`}>
                                            <td colSpan={5}>
                                                <div className="gestor-skeleton-row"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : relatoriosFiltrados.length > 0 ? (
                                    relatoriosFiltrados.map((rel) => (
                                        <tr key={rel.id}>
                                            <td data-label="Título">
                                                <div className="gestor-asset-cell">
                                                    <div className="gestor-asset-avatar" style={{ background: 'var(--g-amber-soft)', color: 'var(--g-amber)' }}>
                                                        📄
                                                    </div>
                                                    <div>
                                                        <strong className="gestor-ticker-name" style={{ whiteSpace: 'normal', maxWidth: '400px', display: 'block' }}>{rel.titulo}</strong>
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                                            <span className="gestor-cat-tag">{rel.assunto}</span>
                                                            {rel.tagsAtivos && <span className="gestor-cat-tag" style={{ background: 'var(--g-bg-subtle)', color: 'var(--g-text-secondary)' }}>📎 {rel.tagsAtivos}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Carteira">
                                                <div className="gestor-secondary-cell">
                                                    <strong>{rel.carteira?.nome || 'Geral (Público)'}</strong>
                                                    <span>Vínculo Estratégico</span>
                                                </div>
                                            </td>
                                            <td data-label="Acesso" className="align-center">
                                                    <span className={`gestor-vies-badge ${rel.carteira?.nivelAcesso === 1 ? 'vies-comprar' : rel.carteira?.nivelAcesso === 2 ? 'vies-aguardar' : 'vies-vender'}`}>
                                                        {rel.carteira?.nivelAcesso === 1 ? 'Basic' : rel.carteira?.nivelAcesso === 2 ? 'Premium' : 'Black'}
                                                    </span>
                                            </td>
                                            <td data-label="Data" className="align-center">
                                                    <span className="gestor-entry-date" style={{ margin: 0 }}>
                                                        {new Date(rel.dataPublicacao).toLocaleDateString('pt-BR')}
                                                    </span>
                                            </td>
                                            <td data-label="Ações" className="align-center">
                                                <div className="gestor-actions-cell">
                                                    {rel.arquivoPdfUrl && (
                                                        <button className="gestor-icon-btn" onClick={() => handleAbrirPdf(rel.id, rel.titulo)} title="Ver PDF" style={{ color: 'var(--g-cyan)' }}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                                                        </button>
                                                    )}
                                                    <button className="gestor-icon-btn edit" onClick={() => handleEditar(rel)} title="Editar Relatório">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                    </button>
                                                    <button className="gestor-icon-btn delete" onClick={() => setRelatorioParaRemover({id: rel.id, titulo: rel.titulo})} title="Apagar Relatório">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="gestor-empty-row">
                                            <div className="gestor-empty-box">
                                                <strong>Nenhuma publicação correspondente.</strong>
                                                <span>Inicie a sua cobertura publicando análises para os subscritores.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>

            {/* 5. MODAL DE PUBLICAÇÃO */}
            {mostrarForm && (
                <div className="gestor-modal-backdrop">
                    <div className="gestor-modal-dialog">
                        <div className="gestor-modal-header">
                            <div>
                                <span className="gestor-modal-kicker">Geração de Conteúdo</span>
                                <h3>{relatorioEditandoId ? "Editar Publicação" : "Nova Publicação de Research"}</h3>
                            </div>
                            <button className="gestor-modal-close" onClick={limparFormulario}>✕</button>
                        </div>

                        <div className="gestor-modal-body" style={{ gridTemplateColumns: '1fr', padding: '32px' }}>
                            <div className="gestor-form-column">
                                <div className="gestor-field-row">
                                    <div className="gestor-field">
                                        <label>Vínculo Estratégico (Carteira / Acesso)</label>
                                        <select value={carteiraId} onChange={e => setCarteiraId(Number(e.target.value))}>
                                            {carteirasLista.length === 0 && <option value="">Carregando carteiras...</option>}
                                            {carteirasLista.map(cart => (
                                                <option key={cart.id} value={cart.id}>
                                                    {cart.nome} (Acesso: Nível {cart.nivelAcesso})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="gestor-field">
                                        <label>Macro-Tema / Assunto</label>
                                        <input type="text" placeholder="Ex: Resultado 3T26, Cenário Macro..." value={assunto} onChange={e => setAssunto(e.target.value)} />
                                    </div>
                                </div>

                                <div className="gestor-field-row">
                                    <div className="gestor-field">
                                        <label>Título da Publicação (Headline)</label>
                                        <input type="text" placeholder="Ex: O destravamento de valor da WEG" value={titulo} onChange={e => setTitulo(e.target.value)} />
                                    </div>
                                </div>

                                <div className="gestor-field-row">
                                    <div className="gestor-field">
                                        <label>Tickers Mencionados (Compliance & Tracking)</label>
                                        <input type="text" placeholder="Ex: WEGE3, PETR4 (Para cruzar na trilha de auditoria do cliente)" value={tagsAtivos} onChange={e => setTagsAtivos(e.target.value)} />
                                    </div>
                                </div>

                                <div className="gestor-field-row">
                                    <div className="gestor-field">
                                        <label>Resumo / Takeaway (Opcional)</label>
                                        <textarea
                                            value={conteudoTexto}
                                            onChange={e => setConteudoTexto(e.target.value)}
                                            placeholder="Descreva os pontos-chave desta tese para leitura rápida..."
                                            rows={4}
                                        />
                                    </div>
                                </div>

                                <div className="gestor-field-row">
                                    <div className="gestor-field">
                                        <label>Anexo (Documento PDF Completo)</label>
                                        <div style={{ border: '2px dashed var(--g-border-strong)', padding: '24px', textAlign: 'center', borderRadius: '12px', background: 'var(--g-bg-input)' }}>
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                onChange={e => setArquivoPdf(e.target.files ? e.target.files[0] : null)}
                                                style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--g-text-secondary)' }}
                                            />
                                            {relatorioEditandoId && !arquivoPdf && <span style={{display: 'block', marginTop: '8px', fontSize: '0.75rem', color: 'var(--g-text-muted)'}}>Mantém o arquivo atual se não selecionar um novo.</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="gestor-modal-footer">
                            <button type="button" className="gestor-btn gestor-btn-outline" onClick={limparFormulario} disabled={loadingForm}>
                                Cancelar
                            </button>
                            <button type="button" className="gestor-btn gestor-btn-primary" onClick={handleSubmit} disabled={loadingForm}>
                                {loadingForm ? 'A publicar...' : (relatorioEditandoId ? "Salvar Alterações" : "Submeter Publicação")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
            {relatorioParaRemover && (
                <div className="gestor-modal-backdrop" onClick={() => setRelatorioParaRemover(null)}>
                    <div className="gestor-confirm-box" onClick={e => e.stopPropagation()}>
                        <div className="gestor-confirm-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </div>
                        <h3>Apagar Publicação</h3>
                        <p>Tem a certeza de que deseja apagar o relatório <strong>{relatorioParaRemover.titulo}</strong>? O documento e o seu histórico na auditoria serão removidos.</p>
                        <div className="gestor-confirm-actions">
                            <button type="button" className="gestor-btn gestor-btn-outline" onClick={() => setRelatorioParaRemover(null)}>Cancelar</button>
                            <button type="button" className="gestor-btn gestor-btn-danger" onClick={handleConfirmarRemocao}>Apagar Relatório</button>
                        </div>
                    </div>
                </div>
            )}

            <PdfViewerModal isOpen={viewerAberto} onClose={handleFecharViewer} pdfUrl={viewerUrl} titulo={viewerTitulo} />

            {toastMsg && <div className={`gestor-toast toast-${toastTipo}`}>{toastMsg}</div>}
        </div>
    )
}