import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import './CarteiraDetalhes.css';
import CardAtivo from '../components/CardAtivo';
import CardInternacional from '../components/CardInternacional';
import CardRendaFixa from '../components/CardRendaFixa';

export default function CarteiraDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [carteira, setCarteira] = useState<any>(null);
    const [carregando, setCarregando] = useState(true);
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);

    const [taxasMacro, setTaxasMacro] = useState({ selic: '---', cdi: '---' });

    useEffect(() => {
        const token = localStorage.getItem('caddie_token');

        api.get(`/api/carteiras/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((response) => {
                setCarteira(response.data);
                setCarregando(false);
            })
            .catch((error) => {
                if (error.response && (error.response.status === 403 || error.response.status === 401)) {
                    navigate('/gerenciar-plano');
                    return;
                }
                console.error("Erro ao buscar detalhes:", error);
                setCarregando(false);
            });

        if (['6', '7', '8'].includes(id || '')) {
            api.get('/api/indicadores/macro')
                .then(res => setTaxasMacro(res.data))
                .catch(err => console.error("Erro ao buscar indicadores macro", err));
        }
    }, [id, navigate]);

    const ativos = carteira?.ativos || [];
    const totalAtivos = ativos.length;
    const qtdComprar = ativos.filter((a: any) => a.vies === 'Comprar').length;
    const qtdAguardar = ativos.filter((a: any) => a.vies === 'Aguardar').length;
    const qtdVender = ativos.filter((a: any) => a.vies === 'Vender').length;

    const isInternacional = carteira?.id === 3;
    const isRendaFixaOuFundo = [6, 7, 8].includes(carteira?.id);

    const indiceConviccao = totalAtivos > 0 ? Math.round((qtdComprar / totalAtivos) * 100) : 0;

    return (
        <div className="dashboard-layout">
            <Sidebar
                activePath="/carteiras"
                isOpen={menuMobileAberto}
                onClose={() => setMenuMobileAberto(false)}
            />

            {menuMobileAberto && (
                <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>
            )}

            <TopBar onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />

            <main className="dashboard-main">
                <div className="detalhes-content-wrapper">

                    <Link to="/carteiras" className="btn-voltar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Voltar para Carteiras
                    </Link>

                    {carregando ? (
                        <div className="detalhes-header">
                            <div>
                                <div className="skeleton skeleton-text" style={{ width: '250px', height: '40px', marginBottom: '12px' }}></div>
                                <div className="skeleton skeleton-text" style={{ width: '180px', height: '16px' }}></div>
                            </div>
                            <div className="skeleton" style={{ width: '220px', height: '90px', borderRadius: '16px' }}></div>
                        </div>
                    ) : carteira ? (
                        <>
                            <div className="detalhes-header">
                                <div className="detalhes-titulo-wrap">
                                    <div className="detalhes-badge-tipo">Carteira Recomendada</div>
                                    <h1>{carteira.nome}</h1>
                                    <p>Análise estratégica e recomendações atualizadas pelo nosso time de gestão.</p>
                                </div>

                                <div className="card-rentabilidade-destaque">
                                    <div className="rentabilidade-icone" style={{ background: 'rgba(0, 180, 216, 0.1)', color: '#00B4D8' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <circle cx="12" cy="12" r="6"></circle>
                                            <circle cx="12" cy="12" r="2"></circle>
                                        </svg>
                                    </div>
                                    <div className="rentabilidade-info">
                                        <span>Índice de Convicção</span>
                                        <strong style={{ color: '#00B4D8' }}>{indiceConviccao}% Compra</strong>
                                    </div>
                                </div>
                            </div>

                            {totalAtivos > 0 && (
                                <div style={{ marginBottom: '32px' }}>
                                    <div className="detalhes-kpi-row" style={{ marginBottom: '16px' }}>
                                        <div className="detalhes-kpi-item">
                                            <span className="kpi-label">Total de Ativos</span>
                                            <strong className="kpi-valor">{totalAtivos}</strong>
                                        </div>
                                        <div className="detalhes-kpi-item">
                                            <span className="kpi-label">Oportunidades (Comprar)</span>
                                            <strong className="kpi-valor highlight-green">{qtdComprar}</strong>
                                        </div>
                                        <div className="detalhes-kpi-item">
                                            <span className="kpi-label">Em Observação (Aguardar)</span>
                                            <strong className="kpi-valor highlight-orange">{qtdAguardar}</strong>
                                        </div>
                                        <div className="detalhes-kpi-item">
                                            <span className="kpi-label">Alerta de Saída (Vender)</span>
                                            <strong className="kpi-valor highlight-red">{qtdVender}</strong>
                                        </div>
                                    </div>

                                    {isRendaFixaOuFundo && !carregando && totalAtivos > 0 && (
                                        <div className="detalhes-kpi-row macro-cards-wrapper">
                                            <div className="detalhes-kpi-item">
                                                <span className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00B4D8' }}>
                                                    <span className="pulse-dot"></span> SELIC Oficial
                                                </span>
                                                <strong className="kpi-valor">{taxasMacro.selic}</strong>
                                            </div>
                                            <div className="detalhes-kpi-item">
                                                <span className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c4b5fd' }}>
                                                    📊 Taxa CDI
                                                </span>
                                                <strong className="kpi-valor">{taxasMacro.cdi}</strong>
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ background: '#111', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', color: '#8b949e', fontWeight: 600 }}>
                                            <span>Distribuição de Viés</span>
                                            <span>Atualizado hoje</span>
                                        </div>
                                        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                                            <div style={{ width: `${(qtdComprar / totalAtivos) * 100}%`, backgroundColor: '#4caf50', transition: 'width 1s ease-in-out' }} title={`Comprar: ${qtdComprar}`}></div>
                                            <div style={{ width: `${(qtdAguardar / totalAtivos) * 100}%`, backgroundColor: '#ff9800', transition: 'width 1s ease-in-out' }} title={`Aguardar: ${qtdAguardar}`}></div>
                                            <div style={{ width: `${(qtdVender / totalAtivos) * 100}%`, backgroundColor: '#f44336', transition: 'width 1s ease-in-out' }} title={`Vender: ${qtdVender}`}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="estado-vazio-container">
                            <h2>Carteira não encontrada.</h2>
                        </div>
                    )}

                    <div className="tabela-container">
                        <div className="tabela-header-premium">
                            <h2>Ativos Recomendados</h2>
                            <span className="tabela-subtitle">
                                {isRendaFixaOuFundo
                                    ? "Taxas, liquidez e recomendações atualizadas"
                                    : "Preços teto e viés de mercado atualizados"}
                            </span>
                        </div>

                        {carregando ? (
                            <div className="ativos-grid">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '12px' }}></div>
                                ))}
                            </div>
                        ) : totalAtivos > 0 ? (
                            <div className="ativos-grid">
                                {ativos.map((ativo: any, index: number) => {

                                    if (isRendaFixaOuFundo || ativo.rentabilidade) {
                                        let tipoCard: 'renda-fixa' | 'fundo' | 'reserva' = 'renda-fixa';
                                        if (carteira?.id === 6) tipoCard = 'fundo';
                                        if (carteira?.id === 8) tipoCard = 'reserva';

                                        return (
                                            <CardRendaFixa
                                                key={index}
                                                tipo={tipoCard}
                                                nome={ativo.ticker}
                                                rentabilidade={ativo.rentabilidade || "--"}
                                                vencimento={ativo.vencimento}
                                                liquidez={ativo.liquidez}
                                                cnpj={ativo.nomeEmpresa}
                                                vies={ativo.vies}
                                                dataEntrada={ativo.dataEntrada}
                                                categoria={ativo.categoria}
                                                nomeCarteira={carteira?.nome}
                                            />
                                        );
                                    }

                                    if (isInternacional) {
                                        return (
                                            <CardInternacional
                                                key={index}
                                                ticker={ativo.ticker}
                                                vies={ativo.vies}
                                                precoTeto={ativo.precoTeto}
                                                dataEntrada={ativo.dataEntrada}
                                                categoria={ativo.categoria}
                                                nomeCarteira={carteira?.nome}
                                            />
                                        );
                                    }

                                    return (
                                        <CardAtivo
                                            key={index}
                                            ticker={ativo.ticker}
                                            vies={ativo.vies}
                                            precoTeto={ativo.precoTeto}
                                            dataEntrada={ativo.dataEntrada}
                                            categoria={ativo.categoria}
                                            nomeEmpresa={ativo.nomeEmpresa}
                                            nomeCarteira={carteira?.nome}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="estado-vazio-tabela">
                                <div className="vazio-icone">📭</div>
                                <h3>Carteira em formação</h3>
                                <p>Os gestores ainda não adicionaram recomendações para esta carteira. Volte em breve.</p>
                            </div>
                        )}
                    </div>

                    {!carregando && carteira && (
                        <div className="detalhes-disclaimer">
                            <p>
                                <strong>Aviso Legal:</strong> As informações apresentadas nesta carteira têm caráter exclusivamente informativo e não constituem garantia de retornos futuros. O "Preço Teto" representa o valor máximo recomendado para aquisição do ativo visando margem de segurança, mas a decisão final de investimento é de inteira responsabilidade do cliente. <strong>O "Índice de Convicção" reflete o percentual de ativos com viés de compra no momento atual.</strong>
                            </p>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}