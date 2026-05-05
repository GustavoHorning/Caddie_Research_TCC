import React from 'react'
import './Gestor/PainelGestor.css'
import SidebarGestor from '../../components/SidebarGestor'
import TopBar from '../../components/TopBar'

const mockClientes = [
    { id: 1, nome: 'João Silva', email: 'joao.silva@email.com', plano: 'Black', status: 'Ativo', data: '10/01/2026' },
    { id: 2, nome: 'Mariana Costa', email: 'mariana.c@email.com', plano: 'Premium', status: 'Ativo', data: '15/02/2026' },
    { id: 3, nome: 'Carlos Souza', email: 'carlos123@email.com', plano: 'Basic', status: 'Inativo', data: '22/03/2026' },
    { id: 4, nome: 'Ana Pereira', email: 'ana.p@email.com', plano: 'Black', status: 'Ativo', data: '05/04/2026' },
    { id: 5, nome: 'Lucas Almeida', email: 'lucas.almeida@email.com', plano: 'Basic', status: 'Ativo', data: '20/04/2026' },
]

export default function ClientesGestor() {
    return (
        <div className="dashboard-layout">
            <SidebarGestor activePath="/gestor/clientes" />
            <TopBar userName="Gestor" />

            <main className="dashboard-main">
                <div className="gestor-content">

                    <div className="gestor-header">
                        <h2>Base de Assinantes</h2>
                        <p>Gerenciamento de clientes e planos da plataforma.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '24px' }}>
                        <div className="gestor-card" style={{ textAlign: 'center', padding: '24px' }}>
                            <h4 style={{ color: '#a0aec0', marginBottom: '8px' }}>Total de Clientes</h4>
                            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>1.248</span>
                        </div>
                        <div className="gestor-card" style={{ textAlign: 'center', padding: '24px', borderBottom: '4px solid #ff9800' }}>
                            <h4 style={{ color: '#a0aec0', marginBottom: '8px' }}>Assinantes Black</h4>
                            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff9800' }}>312</span>
                        </div>
                        <div className="gestor-card" style={{ textAlign: 'center', padding: '24px', borderBottom: '4px solid #4caf50' }}>
                            <h4 style={{ color: '#a0aec0', marginBottom: '8px' }}>Assinantes Premium</h4>
                            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4caf50' }}>580</span>
                        </div>
                    </div>

                    <div className="gestor-card" style={{ marginTop: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3>Últimos Cadastros</h3>
                            <button className="gestor-btn-novo-ativo">Exportar para Excel</button>
                        </div>

                        <div className="gestor-tabela-wrapper">
                            <table className="gestor-tabela">
                                <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>E-mail</th>
                                    <th>Plano</th>
                                    <th>Status</th>
                                    <th>Cliente desde</th>
                                </tr>
                                </thead>
                                <tbody>
                                {mockClientes.map(cliente => (
                                    <tr key={cliente.id}>
                                        <td style={{ fontWeight: '500', color: '#fff' }}>{cliente.nome}</td>
                                        <td style={{ color: '#a0aec0' }}>{cliente.email}</td>
                                        <td>
                        <span style={{
                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                            backgroundColor: cliente.plano === 'Black' ? '#ff980020' : cliente.plano === 'Premium' ? '#4caf5020' : '#ffffff10',
                            color: cliente.plano === 'Black' ? '#ff9800' : cliente.plano === 'Premium' ? '#4caf50' : '#a0aec0'
                        }}>
                          {cliente.plano}
                        </span>
                                        </td>
                                        <td>
                        <span style={{
                            color: cliente.status === 'Ativo' ? '#4caf50' : '#e53935',
                            fontWeight: '500'
                        }}>
                          ● {cliente.status}
                        </span>
                                        </td>
                                        <td style={{ color: '#a0aec0' }}>{cliente.data}</td>
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