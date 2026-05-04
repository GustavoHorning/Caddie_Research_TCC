import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../pages/Dashboard/Sidebar';
import TopBar from '../pages/Dashboard/TopBar';
import './CarteiraDetalhes.css';

export default function CarteiraDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [carteira, setCarteira] = useState<any>(null);
    const [carregando, setCarregando] = useState(true);
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);

    useEffect(() => {
        api.get(`/carteiras/${id}`)
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
    }, [id, navigate]);

    const ativos = carteira?.ativos || [];
    const totalAtivos = ativos.length;
    const qtdComprar = ativos.filter((a: any) => a.vies === 'Comprar').length;
    const qtdAguardar = ativos.filter((a: any) => a.vies === 'Aguardar').length; 
    const qtdVender = ativos.filter((a: any) => a.vies === 'Vender').length;

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
                                    <div className="rentabilidade-icone">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                            <polyline points="17 6 23 6 23 12"></polyline>
                                        </svg>
                                    </div>
                                    <div className="rentabilidade-info">
                                        <span>Rentabilidade Histórica</span>
                                        <strong>+{carteira.rentabilidade}%</strong>
                                    </div>
                                </div>
                            </div>

                            {totalAtivos > 0 && (
                                <div className="detalhes-kpi-row">
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
                            <span className="tabela-subtitle">Preços teto e viés de mercado atualizados</span>
                        </div>

                        {carregando ? (
                            <table className="ativos-table">
                                <thead>
                                <tr>
                                    <th>Ativo</th>
                                    <th>Empresa</th>
                                    <th className="col-valor">Preço Teto</th>
                                    <th className="col-status">Viés</th>
                                </tr>
                                </thead>
                                <tbody>
                                {[1, 2, 3, 4, 5].map((item) => (
                                    <tr key={item}>
                                        <td data-label="Ativo"><div className="skeleton skeleton-text" style={{ width: '60px', height: '24px', borderRadius: '6px' }}></div></td>
                                        <td data-label="Empresa"><div className="skeleton skeleton-text" style={{ width: '140px', height: '16px' }}></div></td>
                                        <td className="col-valor" data-label="Preço Teto"><div className="skeleton skeleton-text" style={{ width: '80px', height: '16px', marginLeft: 'auto' }}></div></td>
                                        <td className="col-status" data-label="Viés"><div className="skeleton skeleton-text" style={{ width: '90px', height: '28px', borderRadius: '20px', margin: '0 auto' }}></div></td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : totalAtivos > 0 ? (
                            <table className="ativos-table">
                                <thead>
                                <tr>
                                    <th>Ativo</th>
                                    <th>Empresa</th>
                                    <th className="col-valor">Preço Teto (R$)</th>
                                    <th className="col-status">Viés Analítico</th>
                                </tr>
                                </thead>
                                <tbody>
                                {ativos.map((ativo: any, index: number) => {
                                    const isComprar = ativo.vies === 'Comprar';
                                    const isVender = ativo.vies === 'Vender';

                                    return (
                                        <tr key={index}>
                                            <td data-label="Ativo">
                                                <div className="ticker-wrapper">
                                                    <div className="ticker-icone">{ativo.ticker.substring(0, 1)}</div>
                                                    <span className="ticker-destaque">{ativo.ticker}</span>
                                                </div>
                                            </td>
                                            <td className="nome-empresa" data-label="Empresa">{ativo.nomeEmpresa || '---'}</td>
                                            <td className="col-valor" data-label="Preço Teto">
                                                {ativo.precoTeto?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                                            </td>
                                            <td className="col-status" data-label="Viés Analítico">
                                                <span className={`status-badge badge-${ativo.vies.toLowerCase()}`}>
                                                    {isComprar && <span className="badge-dot"></span>}
                                                    {ativo.vies}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
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
                                <strong>Aviso Legal:</strong> As informações apresentadas nesta carteira têm caráter exclusivamente informativo e não constituem garantia de retornos futuros. O "Preço Teto" representa o valor máximo recomendado para aquisição do ativo visando margem de segurança, mas a decisão final de investimento é de inteira responsabilidade do cliente. Rentabilidade passada não é garantia de rentabilidade futura.
                            </p>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}