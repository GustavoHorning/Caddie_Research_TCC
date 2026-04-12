import { useState } from 'react'
import './PainelGestor.css'
import Sidebar from '../Sidebar'
import TopBar from '../TopBar'

const relatoriosRecentes = [
  { titulo: 'Analise VALE3 - Abril 2026', carteira: 'Dividendos', tempo: 'ha 2 dias' },
  { titulo: 'Radar Economico #49', carteira: 'Internacional', tempo: 'ha 5 dias' },
  { titulo: 'Carteira Small Caps - Marco', carteira: 'Small Caps', tempo: 'ha 1 semana' },
  { titulo: 'Analise FIIs HGLG11', carteira: 'FIIs', tempo: 'ha 2 semanas' },
]

const ativosIniciais = [
  { ticker: 'VALE3', empresa: 'Vale S.A.', precoEntrada: 'R$ 62,40', precoTeto: 'R$ 85,00', vies: 'Comprar' },
  { ticker: 'BBAS3', empresa: 'Banco do Brasil', precoEntrada: 'R$ 28,15', precoTeto: 'R$ 38,00', vies: 'Comprar' },
  { ticker: 'ITUB4', empresa: 'Itau Unibanco', precoEntrada: 'R$ 32,80', precoTeto: 'R$ 42,00', vies: 'Aguardar' },
  { ticker: 'TAEE11', empresa: 'Taesa', precoEntrada: 'R$ 35,20', precoTeto: 'R$ 44,00', vies: 'Comprar' },
  { ticker: 'PETR4', empresa: 'Petrobras', precoEntrada: 'R$ 36,90', precoTeto: 'R$ 48,00', vies: 'Comprar' },
  { ticker: 'WEGE3', empresa: 'WEG S.A.', precoEntrada: 'R$ 38,50', precoTeto: 'R$ 52,00', vies: 'Aguardar' },
]

export default function PainelGestor() {
  const [carteiraUpload, setCarteiraUpload] = useState('Dividendos')
  const [tipoRelatorio, setTipoRelatorio] = useState('Analise de ativo')
  const [tituloRelatorio, setTituloRelatorio] = useState('')
  const [carteiraAtivos, setCarteiraAtivos] = useState('Dividendos')

  return (
    <div className="dashboard-layout">
      <Sidebar activePath="/gestor" />
      <TopBar userName="Gestor" />
      <main className="dashboard-main">
        <div className="gestor-content">

          {/* Metricas */}
          <div className="gestor-metricas">
            <div className="gestor-metrica-card">
              <span className="gestor-metrica-label">Relatorios publicados</span>
              <span className="gestor-metrica-valor">47</span>
            </div>
            <div className="gestor-metrica-card">
              <span className="gestor-metrica-label">Carteiras ativas</span>
              <span className="gestor-metrica-valor">8</span>
            </div>
            <div className="gestor-metrica-card">
              <span className="gestor-metrica-label">Ativos gerenciados</span>
              <span className="gestor-metrica-valor">156</span>
            </div>
            <div className="gestor-metrica-card">
              <span className="gestor-metrica-label">Assinantes ativos</span>
              <span className="gestor-metrica-valor">1.240</span>
            </div>
          </div>

          {/* Upload + Recentes */}
          <div className="gestor-meio-row">

            {/* Upload */}
            <div className="gestor-card gestor-upload">
              <div className="gestor-card-header">
                <h3>Upload de relatorios</h3>
                <span className="gestor-badge-novo">Novo</span>
              </div>

              <div className="gestor-dropzone">
                <div className="gestor-dropzone-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="gestor-dropzone-texto">Arraste o PDF aqui ou clique para selecionar</p>
                <p className="gestor-dropzone-sub">Formatos aceitos: PDF, ate 25MB</p>
              </div>

              <div className="gestor-upload-campos">
                <div className="gestor-campo-row">
                  <div className="gestor-campo">
                    <label>Carteira destino</label>
                    <select value={carteiraUpload} onChange={(e) => setCarteiraUpload(e.target.value)}>
                      <option>Dividendos</option>
                      <option>Internacional</option>
                      <option>FIIs</option>
                      <option>Small Caps</option>
                      <option>Valor</option>
                      <option>Fundos</option>
                      <option>Renda Fixa</option>
                    </select>
                  </div>
                  <div className="gestor-campo">
                    <label>Tipo de relatorio</label>
                    <select value={tipoRelatorio} onChange={(e) => setTipoRelatorio(e.target.value)}>
                      <option>Analise de ativo</option>
                      <option>Radar economico</option>
                      <option>Carteira recomendada</option>
                      <option>Paper economico</option>
                    </select>
                  </div>
                </div>
                <div className="gestor-campo">
                  <label>Titulo do relatorio</label>
                  <input
                    type="text"
                    placeholder="Ex: Analise PETR4 - Maio 2026"
                    value={tituloRelatorio}
                    onChange={(e) => setTituloRelatorio(e.target.value)}
                  />
                </div>
              </div>

              <button className="gestor-btn-publicar">Publicar relatorio</button>
            </div>

            {/* Recentes */}
            <div className="gestor-card gestor-recentes">
              <h3 className="gestor-recentes-titulo">Relatorios recentes</h3>
              <div className="gestor-recentes-lista">
                {relatoriosRecentes.map((rel, i) => (
                  <div key={i} className="gestor-recente-item">
                    <div className="gestor-recente-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div className="gestor-recente-info">
                      <strong>{rel.titulo}</strong>
                      <span>{rel.carteira} - {rel.tempo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gerenciar ativos */}
          <div className="gestor-card gestor-ativos">
            <div className="gestor-ativos-header">
              <h3>Gerenciar ativos da carteira</h3>
              <div className="gestor-ativos-acoes">
                <select value={carteiraAtivos} onChange={(e) => setCarteiraAtivos(e.target.value)}>
                  <option>Dividendos</option>
                  <option>Internacional</option>
                  <option>FIIs</option>
                  <option>Small Caps</option>
                  <option>Valor</option>
                </select>
                <button className="gestor-btn-novo-ativo">+ Novo ativo</button>
              </div>
            </div>

            <div className="gestor-tabela-wrapper">
              <table className="gestor-tabela">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Empresa</th>
                    <th>Preco entrada</th>
                    <th>Preco teto</th>
                    <th>Vies</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {ativosIniciais.map((ativo, i) => (
                    <tr key={i}>
                      <td className="gestor-td-ticker">{ativo.ticker}</td>
                      <td className="gestor-td-empresa">{ativo.empresa}</td>
                      <td>{ativo.precoEntrada}</td>
                      <td>{ativo.precoTeto}</td>
                      <td>
                        <span className={'gestor-vies' + (ativo.vies === 'Comprar' ? ' vies-comprar' : ' vies-aguardar')}>
                          {ativo.vies}
                        </span>
                      </td>
                      <td className="gestor-td-acoes">
                        <span className="gestor-acao-editar">Editar</span>
                        <span className="gestor-acao-remover">Remover</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}