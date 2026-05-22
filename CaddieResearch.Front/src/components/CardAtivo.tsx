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
    dataEntrada?: string;
    categoria?: string;
}

export default function CardAtivo({ ticker, vies, precoTeto, dataEntrada, categoria }: CardAtivoProps) {
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
                    Ativo <strong style={{ color: '#fff' }}>{ticker}</strong> indisponível.
                </span>
            </div>
        );
    }

    const isPositivo = cotacao.regularMarketChangePercent >= 0;
    const corVies = vies === 'Comprar' ? '#10b981' : vies === 'Vender' ? '#ef4444' : '#f59e0b';

    const viesExibicao = vies === 'Comprar' ? 'Alocar' : vies === 'Vender' ? 'Vender' : 'Aguardar';
    const dataFormatada = dataEntrada ? dataEntrada.substring(0, 10).split('-').reverse().join('/') : '--/--/----';

    return (
        <div className="card-ativo" style={{ borderTop: '3px solid #00B4D8' }}>
            <div className="ativo-header">
                {cotacao.logourl && !imgErro ? (
                    <img
                        src={cotacao.logourl}
                        alt={cotacao.symbol}
                        className="ativo-logo"
                        onError={() => setImgErro(true)}
                    />
                ) : (
                    <div className="ativo-logo-placeholder" style={{ background: '#00B4D8' }}>{cotacao.symbol.substring(0, 1)}</div>
                )}

                <div className="ativo-info" style={{ overflow: 'hidden' }}>
                    <h3 className="ativo-symbol" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', margin: 0, width: '100%' }}>
                        <span style={{ lineHeight: '1.2', flex: 1 }}>{cotacao.symbol}</span>
                        {categoria && (
                            <span style={{
                                fontSize: '9px', background: 'rgba(0, 180, 216, 0.15)', color: '#00B4D8',
                                padding: '3px 6px', borderRadius: '4px', fontWeight: 700,
                                letterSpacing: '0.5px', flexShrink: 0, marginTop: '2px'
                            }}>
                                {categoria.toUpperCase()}
                            </span>
                        )}
                    </h3>
                    <span className="ativo-name" style={{ color: '#8b949e', fontSize: '0.8rem' }}>
                        {cotacao.shortName ? cotacao.shortName.substring(0, 25) : "Bolsa B3"}
                    </span>
                </div>
            </div>

            <div className="ativo-realtime" style={{ marginTop: '16px' }}>
                <span className="preco-label" style={{ color: '#8b949e', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Cotação Atual</span>
                <div className="ativo-footer" style={{ marginTop: '4px' }}>
                    <div className="ativo-price" style={{ fontWeight: 'bold', fontSize: '1.4rem' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cotacao.regularMarketPrice)}
                    </div>
                    <div className={`ativo-change ${isPositivo ? 'positive' : 'negative'}`}>
                        {isPositivo ? '▲' : '▼'} {Math.abs(cotacao.regularMarketChangePercent).toFixed(2)}%
                    </div>
                </div>

                {/* Data de Entrada */}
                <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '16px', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '6px' }}>
                    Recomendado em: <strong style={{color: '#e6edf3'}}>{dataFormatada}</strong>
                </div>
            </div>

            {(vies || precoTeto) && (
                <div className="ativo-recomendacao" style={{ marginTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
                    {precoTeto && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', alignItems: 'center' }}>
                            <span style={{ color: '#8b949e', fontWeight: 500 }}>Preço Teto:</span>
                            <strong style={{ color: '#ffffff', fontSize: '14px' }}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoTeto)}
                            </strong>
                        </div>
                    )}
                    {vies && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center' }}>
                            <span style={{ color: '#8b949e', fontWeight: 500 }}>Recomendação:</span>
                            <span style={{
                                backgroundColor: corVies, color: 'white', padding: '4px 12px',
                                borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px',
                                boxShadow: `0 0 10px ${corVies}40`
                            }}>
                                {viesExibicao}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}