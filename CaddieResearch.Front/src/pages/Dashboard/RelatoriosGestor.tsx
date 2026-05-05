import React, { useState } from 'react'
import './Gestor/PainelGestor.css' 
import SidebarGestor from '../../components/SidebarGestor'
import TopBar from '../../components/TopBar'

const relatoriosRecentes = [
    { id: 1, titulo: 'Análise VALE3 - Abril 2026', carteira: 'Dividendos', tempo: 'há 2 dias' },
    { id: 2, titulo: 'Radar Econômico #49', carteira: 'Internacional', tempo: 'há 5 dias' },
    { id: 3, titulo: 'Carteira Small Caps - Março', carteira: 'Small Caps', tempo: 'há 1 semana' },
    { id: 4, titulo: 'Análise FIIs HGLG11', carteira: 'FIIs', tempo: 'há 2 semanas' },
]

export default function RelatoriosGestor() {
    const [carteiraUpload, setCarteiraUpload] = useState('Dividendos')
    const [tipoRelatorio, setTipoRelatorio] = useState('Análise de ativo')

    return (
        <div className="dashboard-layout">
            <SidebarGestor activePath="/gestor/relatorios" />
            <TopBar userName="Gestor" />

            <main className="dashboard-main">
                <div className="gestor-content">

                    <div className="gestor-header">
                        <h2>Central de Relatórios</h2>
                        <p>Faça o upload de análises em PDF para os assinantes.</p>
                    </div>

                    <div className="gestor-card gestor-upload" style={{ marginTop: '24px' }}>
                        <h3>Publicar Novo Relatório</h3>

                        <div className="gestor-upload-campos">
                            <div className="gestor-campo-row">
                                <div className="gestor-campo">
                                    <label>Carteira Destino</label>
                                    <select value={carteiraUpload} onChange={e => setCarteiraUpload(e.target.value)}>
                                        <option>Dividendos</option>
                                        <option>Internacional</option>
                                        <option>Small Caps</option>
                                        <option>FIIs</option>
                                    </select>
                                </div>
                                <div className="gestor-campo">
                                    <label>Tipo de Documento</label>
                                    <select value={tipoRelatorio} onChange={e => setTipoRelatorio(e.target.value)}>
                                        <option>Análise de ativo</option>
                                        <option>Radar Semanal</option>
                                        <option>Fechamento de Mercado</option>
                                    </select>
                                </div>
                            </div>

                            <div className="gestor-campo">
                                <label>Título do Relatório</label>
                                <input type="text" placeholder="Ex: Resultado 1T26 - Petrobras" />
                            </div>

                            <div className="upload-area" style={{
                                border: '2px dashed rgba(255,255,255,0.2)',
                                padding: '32px',
                                textAlign: 'center',
                                borderRadius: '8px',
                                marginTop: '16px',
                                cursor: 'pointer'
                            }}>
                                <span style={{ fontSize: '2rem' }}>📄</span>
                                <p style={{ margin: '8px 0', color: '#a0aec0' }}>Arraste o arquivo PDF aqui ou clique para buscar</p>
                            </div>

                            <button className="gestor-btn-publicar" style={{ marginTop: '16px' }} onClick={() => alert("Simulação de Upload na nuvem (Azure Blob Storage).")}>
                                Fazer Upload e Publicar
                            </button>
                        </div>
                    </div>

                    <div className="gestor-card gestor-relatorios-recentes" style={{ marginTop: '24px' }}>
                        <h3>Últimos Relatórios Publicados</h3>
                        <ul className="relatorios-lista">
                            {relatoriosRecentes.map((rel) => (
                                <li key={rel.id} className="relatorio-item" style={{
                                    display: 'flex', justifyContent: 'space-between', padding: '16px',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div>
                                        <strong style={{ color: '#00B4D8', display: 'block', marginBottom: '4px' }}>{rel.titulo}</strong>
                                        <span style={{ fontSize: '0.85rem', color: '#a0aec0' }}>Carteira: {rel.carteira}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#a0aec0', display: 'block' }}>{rel.tempo}</span>
                                        <button style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', marginTop: '4px', fontSize: '0.85rem' }}>Ocultar</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </main>
        </div>
    )
}