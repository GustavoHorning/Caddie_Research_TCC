import React from 'react';
import './CardAtivo.css';

interface CardRendaFixaProps {
    tipo: 'renda-fixa' | 'fundo' | 'reserva';
    nome: string;
    rentabilidade: string;
    vencimento?: string;
    liquidez?: string;
    cnpj?: string;
    vies?: string;
    dataEntrada?: string;
    categoria?: string;
}

export default function CardRendaFixa({ tipo, nome, rentabilidade, vencimento, liquidez, cnpj, vies, dataEntrada, categoria }: CardRendaFixaProps) {
    const corVies = vies === 'Comprar' || vies === 'Alocar' ? '#10b981' : vies?.includes('Vender') || vies === 'Resgatar' ? '#ef4444' : '#f59e0b';

    let viesExibicao = vies;
    if (tipo === 'fundo') {
        viesExibicao = vies === 'Comprar' ? 'Alocar' : vies === 'Vender' ? 'Resgatar' : 'Manter Posição';
    } else if (tipo === 'renda-fixa' || tipo === 'reserva') {
        viesExibicao = vies === 'Comprar' ? 'Alocar' : vies === 'Vender' ? 'Vender Antecipado' : 'Aguardar Taxas';
    }

    const config = {
        'renda-fixa': {
            cor: '#3b82f6', bgTag: 'rgba(59, 130, 246, 0.15)', labelTag: 'RENDA FIXA',
            labelValor: 'Rentabilidade Alvo', valorCor: '#93c5fd', icone: '📈'
        },
        'fundo': {
            cor: '#8b5cf6', bgTag: 'rgba(139, 92, 246, 0.15)', labelTag: 'FUNDO',
            labelValor: 'Taxa de Adm', valorCor: '#c4b5fd', icone: '🏢'
        },
        'reserva': {
            cor: '#10b981', bgTag: 'rgba(16, 185, 129, 0.15)', labelTag: 'RESERVA',
            labelValor: 'Rentabilidade', valorCor: '#6ee7b7', icone: '🛡️'
        }
    }[tipo];

    const dataFormatada = dataEntrada ? dataEntrada.substring(0, 10).split('-').reverse().join('/') : '--/--/----';
    const vencimentoFormatado = vencimento ? vencimento.split('-').reverse().join('/') : 'N/A';

    return (
        <div className="card-ativo" style={{ borderTop: `3px solid ${config.cor}` }}>
            <div className="ativo-header">
                <div className="ativo-logo-placeholder" style={{ background: config.cor, fontSize: '1.2rem' }}>
                    {config.icone}
                </div>
                <div className="ativo-info" style={{ overflow: 'hidden' }}>
                    <h3 className="ativo-symbol" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        {nome ? (nome.length > 22 ? nome.substring(0, 22) + '...' : nome) : 'Ativo'}

                        <span style={{
                            fontSize: '9px', background: config.bgTag, color: config.cor,
                            padding: '2px 6px', borderRadius: '4px', fontWeight: 600,
                            letterSpacing: '0.5px', flexShrink: 0
                        }}>
                            {config.labelTag}
                        </span>
                    </h3>
                    <span className="ativo-name" style={{ color: '#8b949e', fontSize: '0.8rem' }}>
                        {tipo === 'fundo' && cnpj ? `CNPJ: ${cnpj}` : (categoria || 'Ativo de Rendimento')}
                    </span>
                </div>
            </div>

            <div className="ativo-realtime" style={{ marginTop: '16px' }}>
                <span className="preco-label" style={{ color: '#8b949e', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    {config.labelValor}
                </span>
                <div className="ativo-price" style={{ color: config.valorCor, fontWeight: 'bold', fontSize: '1.4rem', marginTop: '4px' }}>
                    {rentabilidade || '--'}
                </div>

                <div style={{ fontSize: '12px', color: '#6e7681', marginTop: '16px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                    <div>
                        <span style={{ color: '#8b949e', fontSize: '10px', display: 'block', marginBottom: '2px', fontWeight: 600 }}>LIQUIDEZ</span>
                        <strong style={{ color: tipo === 'reserva' ? '#10b981' : '#e6edf3' }}>{liquidez || 'N/A'}</strong>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        {tipo !== 'fundo' ? (
                            <>
                                <span style={{ color: '#8b949e', fontSize: '10px', display: 'block', marginBottom: '2px', fontWeight: 600 }}>VENCIMENTO</span>
                                <strong style={{ color: '#e6edf3' }}>{vencimentoFormatado}</strong>
                            </>
                        ) : (
                            <>
                                <span style={{ color: '#8b949e', fontSize: '10px', display: 'block', marginBottom: '2px', fontWeight: 600 }}>CATEGORIA</span>
                                <strong style={{ color: '#e6edf3' }}>{categoria || 'Fundo'}</strong>
                            </>
                        )}
                    </div>
                </div>

                <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '12px', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '6px' }}>
                    Recomendado em: <strong style={{color: '#e6edf3'}}>{dataFormatada}</strong>
                </div>
            </div>

            {vies && (
                <div className="ativo-recomendacao" style={{ marginTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
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
    );
}