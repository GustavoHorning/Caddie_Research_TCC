import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../../hooks/usePortfolio';
import NovoPortfolioModal from './NovoPortfolioModal';
import './Portfolio.css';

export default function Portfolio() {
  const navigate = useNavigate();
  const [modalAberto, setModalAberto] = useState(false);

  const { portfolios, carregando, totalPatrimonio, totalPosicoes, criarPortfolio } = usePortfolio();

  const formatBRL = (v: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
      <div className="pf-page">
        <div className="pf-main">
          <div className="pf-abas">
            <button className="pf-aba ativa">Portfólios</button>
            <button className="pf-btn-novo" onClick={() => setModalAberto(true)}>+ Novo Portfólio</button>
          </div>

          <div className="pf-table-wrap">
            <table className="pf-table">
              <thead>
              <tr>
                <th>Nome</th>
                <th>Patrimônio</th>
                <th>Posições</th>
                <th>Início</th>
              </tr>
              </thead>
              <tbody>
              {carregando ? (
                  <tr><td colSpan={4} className="pf-loading">Carregando...</td></tr>
              ) : portfolios.length === 0 ? (
                  <tr><td colSpan={4} className="pf-loading">Nenhum portfólio encontrado.</td></tr>
              ) : (
                  portfolios.map(p => (
                      <tr key={p.id} className="pf-row" onClick={() => navigate(`/portfolio/${p.id}`)}>
                        <td className="pf-nome">{p.nome}</td>
                        <td className="pf-valor">
                          {formatBRL(p.patrimonio)}
                          {p.temContaCorrente && (
                              <span style={{ marginLeft: 8, fontSize: '0.72rem', color: '#8b949e', fontWeight: 400 }}>
                          (Conta Corrente)
                        </span>
                          )}
                        </td>
                        <td>
                          {p.totalPosicoes === 0
                              ? <span style={{ color: '#8b949e', fontSize: '0.82rem' }}>— aguardando posições</span>
                              : `${p.totalPosicoes} ativo${p.totalPosicoes !== 1 ? 's' : ''}`
                          }
                        </td>
                        <td>{new Date(p.dataInicio).toLocaleDateString('pt-BR')}</td>
                      </tr>
                  ))
              )}
              </tbody>
            </table>
          </div>
        </div>

        {modalAberto && (
            <NovoPortfolioModal
                onClose={() => setModalAberto(false)}
                onConfirm={criarPortfolio}
            />
        )}

        <div className="pf-sidebar">
          <div className="pf-resumo-card">
            <h3>Resumo</h3>
            <div className="pf-resumo-grid">
              <div>
                <span className="pf-resumo-label">Portfólios</span>
                <span className="pf-resumo-val">{portfolios.length}</span>
              </div>
              <div>
                <span className="pf-resumo-label">Posições</span>
                <span className="pf-resumo-val">{totalPosicoes}</span>
              </div>
            </div>
          </div>

          <div className="pf-patrimonio-card">
            <h3>Patrimônio total</h3>
            <span className="pf-patrimonio-val">{formatBRL(totalPatrimonio)}</span>
          </div>
        </div>
      </div>
  );
}