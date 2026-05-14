import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './CardAtivo.css';

interface CotacaoIntProps {
    symbol: string;
    shortName: string;
    logoUrl: string;
    priceUsd: number;
    changePercent: number;
    exchangeRate: number;
    priceBrl: number;
}

interface CardInternacionalProps {
    ticker: string;
    vies?: string;
    precoTeto?: number;
}

export default function CardInternacional({ ticker, vies, precoTeto }: CardInternacionalProps) {
    const [cotacao, setCotacao] = useState<CotacaoIntProps | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [imgErro, setImgErro] = useState(false);

    useEffect(() => {
        const buscarCotacao = async () => {
            try {
                setCarregando(true);
                const response = await api.get(`/api/internacional/cotacao/${ticker}`);
                setCotacao(response.data);
            } catch (error) {
                console.error(`Erro ao buscar ${ticker}:`, error);
            } finally {
                setCarregando(false);
            }
        };
        buscarCotacao();
    }, [ticker]);

    if (carregando) {
        return <div className="card-ativo skeleton" style={{ minHeight: '180px' }}></div>;
    }

    if (!cotacao) {
        return (
            <div className="card-ativo error" style={{ minHeight: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: '28px', marginBottom: '8px' }}>⚠️</span>
                <span style={{ color: '#8b949e', fontSize: '14px' }}>
                    Ativo <strong style={{ color: '#fff' }}>{ticker}</strong> indisponível ou não encontrado.
                </span>
            </div>
        );
    }

    const isPositivo = cotacao.changePercent >= 0;
    const corVies = vies === 'Comprar' ? '#10b981' : vies === 'Vender' ? '#ef4444' : '#f59e0b';

    return (
        <div className="card-ativo">
            <div className="ativo-header">
                {cotacao.logoUrl && !imgErro ? (
                    <img
                        src={cotacao.logoUrl}
                        alt={cotacao.symbol}
                        className="ativo-logo"
                        onError={() => setImgErro(true)}
                    />
                ) : (
                    <div className="ativo-logo-placeholder" style={{ background: '#3b82f6' }}>
                        {cotacao.symbol.substring(0, 1)}
                    </div>
                )}

                <div className="ativo-info">
                    <h3 className="ativo-symbol" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        {cotacao.symbol}
                        <span style={{
                            fontSize: '9px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#a1a1aa',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                            letterSpacing: '0.5px'
                        }}>
                            EUA
                        </span>
                    </h3>
                    <span className="ativo-name" style={{ color: '#8b949e' }}>
                        {cotacao.shortName ? cotacao.shortName.substring(0, 20) : "Bolsa Americana"}
                    </span>
                </div>
            </div>

            <div className="ativo-realtime">
                <span className="preco-label" style={{
                    color: '#8b949e',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: '4px'
                }}>
                    Cotação Atual (USD)
                </span>

                <div className="ativo-footer">
                    <div className="ativo-price" style={{ color: '#ffffff', fontWeight: 'bold' }}>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cotacao.priceUsd)}
                    </div>
                    <div className={`ativo-change ${isPositivo ? 'positive' : 'negative'}`}>
                        {isPositivo ? '▲' : '▼'} {Math.abs(cotacao.changePercent).toFixed(2)}%
                    </div>
                </div>
                <div style={{ fontSize: '11px', color: '#6e7681', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 500 }}>
                    <span>≈ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cotacao.priceBrl)}</span>
                    <span>Dólar: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cotacao.exchangeRate)}</span>
                </div>
            </div>

            {(vies || precoTeto) && (
                <div className="ativo-recomendacao" style={{ marginTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
                    {precoTeto && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', alignItems: 'center' }}>
                            <span style={{ color: '#8b949e', fontWeight: 500 }}>Preço Teto (USD):</span>
                            <strong style={{ color: '#ffffff', fontSize: '14px' }}>
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(precoTeto)}
                            </strong>
                        </div>
                    )}
                    {vies && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center' }}>
                            {/* E aqui */}
                            <span style={{ color: '#8b949e', fontWeight: 500 }}>Viés:</span>
                            <span style={{
                                backgroundColor: corVies,
                                color: 'white',
                                padding: '2px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                boxShadow: `0 0 8px ${corVies}40` 
                            }}>
                                {vies}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}