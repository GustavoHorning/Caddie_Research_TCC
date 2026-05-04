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
                <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>

                    <Link to="/carteiras" className="btn-voltar">
                        ← Voltar para Carteiras
                    </Link>

                    {carregando ? (
                        <div className="detalhes-header">
                            <div>
                                <div className="skeleton skeleton-text" style={{ width: '250px', height: '36px', marginBottom: '8px' }}></div>
                                <div className="skeleton skeleton-text" style={{ width: '150px', height: '16px' }}></div>
                            </div>
                            <div className="skeleton" style={{ width: '200px', height: '80px', borderRadius: '12px' }}></div>
                        </div>
                    ) : carteira ? (
                        <div className="detalhes-header">
                            <div className="detalhes-titulo-wrap">
                                <h1>{carteira.nome}</h1>
                                <p style={{ color: '#aaa', margin: 0 }}>Análise e recomendações atualizadas.</p>
                            </div>
                            <div className="card-rentabilidade-destaque">
                                <span>Rentabilidade Histórica</span>
                                <strong>+{carteira.rentabilidade}</strong>
                            </div>
                        </div>
                    ) : (
                        <h2 style={{ color: '#fff' }}>Carteira não encontrada.</h2>
                    )}

                    <div className="tabela-container">
                        <h2>Ativos Recomendados</h2>

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
                                        <td data-label="Ativo"><div className="skeleton skeleton-text" style={{ width: '60px', height: '20px' }}></div></td>
                                        <td data-label="Empresa"><div className="skeleton skeleton-text" style={{ width: '140px', height: '16px' }}></div></td>
                                        <td className="col-valor" data-label="Preço Teto"><div className="skeleton skeleton-text" style={{ width: '80px', height: '16px', marginLeft: 'auto' }}></div></td>
                                        <td className="col-status" data-label="Viés"><div className="skeleton skeleton-text" style={{ width: '80px', height: '24px', borderRadius: '20px', margin: '0 auto' }}></div></td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : carteira?.ativos && carteira.ativos.length > 0 ? (
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
                                {carteira.ativos.map((ativo: any, index: number) => {
                                    const isComprar = ativo.vies === 'Comprar';
                                    const isVender = ativo.vies === 'Vender';

                                    return (
                                        <tr key={index}>
                                            <td className="ticker-destaque" data-label="Ativo">{ativo.ticker}</td>
                                            <td className="nome-empresa" data-label="Empresa">{ativo.nomeEmpresa || '---'}</td>
                                            <td className="col-valor" data-label="Preço Teto">
                                                {ativo.precoTeto?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                                            </td>
                                            <td className="col-status" data-label="Viés">
                                                <span className="status-badge" style={{
                                                    backgroundColor: isComprar ? 'rgba(76, 175, 80, 0.15)' : isVender ? 'rgba(244, 67, 54, 0.15)' : 'rgba(255, 152, 0, 0.15)',
                                                    color: isComprar ? '#4caf50' : isVender ? '#f44336' : '#ff9800',
                                                    border: `1px solid ${isComprar ? 'rgba(76, 175, 80, 0.3)' : isVender ? 'rgba(244, 67, 54, 0.3)' : 'rgba(255, 152, 0, 0.3)'}`
                                                }}>
                                                    {ativo.vies}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '40px 0', textAlign: 'center', color: '#8b949e' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>📭</div>
                                <p>Nenhum ativo recomendado no momento para esta carteira.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}