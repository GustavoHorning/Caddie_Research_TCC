import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './CardAtivo.css'; 

interface CotacaoProps {
    symbol: string;
    shortName: string;
    logourl: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
}

interface CardAtivoProps {
    ticker: string;
    vies?: string;
    precoTeto?: number;
}

export default function CardAtivo({ ticker, vies, precoTeto }: CardAtivoProps) {
    const [cotacao, setCotacao] = useState<CotacaoProps | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [imgErro, setImgErro] = useState(false); 

    useEffect(() => {
        const buscarCotacao = async () => {
            try {
                setCarregando(true);
                const response = await api.get(`/api/acoes/cotacao/${ticker}`);
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
        return <div className="card-ativo skeleton" style={{ minHeight: '180px' }}>Carregando {ticker}...</div>;
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

    const isPositivo = cotacao.regularMarketChangePercent >= 0;
    const corVies = vies === 'Comprar' ? '#10b981' : vies === 'Vender' ? '#ef4444' : '#f59e0b';

    return (
        <div className="card-ativo">
            <div className="ativo-header">
                {cotacao.logourl && !imgErro ? (
                    <img
                        src={cotacao.logourl}
                        alt={cotacao.symbol}
                        className="ativo-logo"
                        onError={() => setImgErro(true)} 
                    />
                ) : (
                    <div className="ativo-logo-placeholder">{cotacao.symbol.substring(0, 1)}</div>
                )}
                <div className="ativo-info">
                    <h3 className="ativo-symbol">{cotacao.symbol}</h3>
                    <span className="ativo-name">{cotacao.shortName.substring(0, 20)}</span>
                </div>
            </div>

            <div className="ativo-realtime">
                <span className="preco-label">Cotação Atual</span>
                <div className="ativo-footer">
                    <div className="ativo-price">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cotacao.regularMarketPrice)}
                    </div>
                    <div className={`ativo-change ${isPositivo ? 'positive' : 'negative'}`}>
                        {isPositivo ? '▲' : '▼'} {Math.abs(cotacao.regularMarketChangePercent).toFixed(2)}%
                    </div>
                </div>
            </div>

            {(vies || precoTeto) && (
                <div className="ativo-recomendacao">
                    {precoTeto && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                            <span style={{ color: '#8b949e' }}>Preço Teto:</span>
                            <strong style={{ color: '#e5e7eb' }}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoTeto)}
                            </strong>
                        </div>
                    )}
                    {vies && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center' }}>
                            <span style={{ color: '#8b949e' }}>Viés:</span>
                            <span style={{ backgroundColor: corVies, color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                {vies}
              </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}