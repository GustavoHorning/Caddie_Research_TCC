import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function CarteiraDetalhes() {
    const { id } = useParams(); 
    const [carteira, setCarteira] = useState<any>(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        api.get(`/carteiras/${id}`)
            .then((response) => {
                setCarteira(response.data);
                setCarregando(false);
            })
            .catch((error) => {
                console.error("Erro ao buscar detalhes:", error);
                setCarregando(false);
            });
    }, [id]);

    if (carregando) return <div style={{ color: 'white', padding: '50px' }}>Carregando ativos...</div>;
    if (!carteira) return <div style={{ color: 'white', padding: '50px' }}>Carteira não encontrada.</div>;

    return (
        <div style={{ padding: '30px', color: '#fff', backgroundColor: '#121212', minHeight: '100vh' }}>
            <Link to="/carteiras" style={{ color: '#4caf50', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
                ← Voltar para Carteiras
            </Link>

            <h1 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>Carteira: {carteira.nome}</h1>
            <p style={{ color: '#aaa' }}>Rentabilidade Histórica: <strong style={{ color: '#4caf50' }}>+{carteira.rentabilidade}</strong></p>

            {/* A TABELA DE ATIVOS VAI AQUI */}
            <div style={{ marginTop: '30px', backgroundColor: '#1e1e1e', borderRadius: '8px', padding: '20px' }}>
                <h2>Ativos Recomendados</h2>

                {carteira.ativos && carteira.ativos.length > 0 ? (

                    <div style={{ overflowX: 'auto', width: '100%' }}>
                        
                        <table style={{ width: '100%', minWidth: '500px', textAlign: 'left', borderCollapse: 'collapse', marginTop: '15px' }}>
                            <thead>
                            <tr style={{ borderBottom: '1px solid #333', color: '#aaa' }}>
                                <th style={{ padding: '10px 0' }}>Ativo</th>
                                <th>Empresa</th>
                                <th>Preço Teto</th>
                                <th>Viés</th>
                            </tr>
                            </thead>
                            <tbody>
                            {carteira.ativos.map((ativo: any, index: number) => (
                                <tr key={index} style={{ borderBottom: '1px solid #2a2a2a' }}>
                                    <td style={{ padding: '15px 0', fontWeight: 'bold' }}>{ativo.ticker}</td>
                                    <td>{ativo.nomeEmpresa || '---'}</td>
                                    <td>R$ {ativo.precoTeto?.toFixed(2) || '0.00'}</td>
                                    <td>
                     <span style={{
                         padding: '5px 10px',
                         borderRadius: '4px',
                         fontSize: '0.85rem',
                         whiteSpace: 'nowrap',

                         backgroundColor:
                             ativo.vies === 'Comprar' ? '#4caf5020' :
                                 ativo.vies === 'Vender' ? '#f4433620' : '#ff980020',

                         color:
                             ativo.vies === 'Comprar' ? '#4caf50' :
                                 ativo.vies === 'Vender' ? '#f44336' : '#ff9800'
                     }}>
                        {ativo.vies}
                        </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    ) : (
                    <p style={{ color: '#888' }}>Nenhum ativo recomendado no momento.</p>
            )}
            </div>
        </div>
    );
}