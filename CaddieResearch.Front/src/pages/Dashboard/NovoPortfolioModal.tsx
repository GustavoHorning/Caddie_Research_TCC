import { useState } from 'react';
import type { CriarPortfolioRequest } from '../../services/portfolioService';

interface NovoPortfolioModalProps {
    onClose: () => void;
    onConfirm: (dados: CriarPortfolioRequest) => Promise<void>;
}

export default function NovoPortfolioModal({ onClose, onConfirm }: NovoPortfolioModalProps) {
    const [passo, setPasso] = useState<1 | 2>(1);
    const [nome, setNome] = useState('');
    const [aporteInicial, setAporteInicial] = useState('');
    const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 10));
    const [criando, setCriando] = useState(false);

    async function handleConfirm() {
        setCriando(true);
        try {
            await onConfirm({
                nome: nome.trim(),
                dataInicio: dataInicio ? new Date(dataInicio).toISOString() : new Date().toISOString(),
                aporteInicial: aporteInicial ? parseFloat(aporteInicial.replace(',', '.')) : null
            });
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setCriando(false);
        }
    }

    return (
        <div className="pf-modal-overlay" onClick={onClose}>
            <div className="pf-modal" onClick={e => e.stopPropagation()}>
                <div className="pf-modal-passos">
                    <span className={passo === 1 ? 'ativo' : ''}>1</span>
                    <div className="pf-modal-linha" />
                    <span className={passo === 2 ? 'ativo' : ''}>2</span>
                </div>

                {passo === 1 ? (
                    <>
                        <h3>Novo Portfólio</h3>
                        <label className="pf-modal-label">Nome do portfólio</label>
                        <input
                            className="pf-modal-input"
                            placeholder="Ex: Carteira Principal"
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && nome.trim() && setPasso(2)}
                            autoFocus
                        />
                        <div className="pf-modal-actions">
                            <button className="pf-modal-cancel" onClick={onClose}>Cancelar</button>
                            <button className="pf-modal-confirm" onClick={() => setPasso(2)} disabled={!nome.trim()}>
                                Próximo →
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h3>Montante inicial</h3>
                        <label className="pf-modal-label">Data de início</label>
                        <input
                            className="pf-modal-input"
                            type="date"
                            value={dataInicio}
                            onChange={e => setDataInicio(e.target.value)}
                        />
                        <label className="pf-modal-label">Valor do aporte inicial (R$)</label>
                        <input
                            className="pf-modal-input"
                            placeholder="Ex: 10000,00"
                            value={aporteInicial}
                            onChange={e => setAporteInicial(e.target.value)}
                            autoFocus
                        />
                        <div className="pf-modal-actions">
                            <button className="pf-modal-cancel" onClick={() => setPasso(1)}>← Voltar</button>
                            <button className="pf-modal-confirm" onClick={handleConfirm} disabled={criando}>
                                {criando ? 'Criando...' : 'Criar Portfólio'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}