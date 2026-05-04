import { useState, useEffect } from 'react'
import './PainelGestor.css'
import TopBar from '../TopBar'
import api from '../../../services/api'
import SidebarGestor from '../SidebarGestor'

export default function PainelGestor() {
  const [menuMobileAberto, setMenuMobileAberto] = useState(false)

  const [carteirasDisponiveis, setCarteirasDisponiveis] = useState<any[]>([])
  const [carteiraAtivosId, setCarteiraAtivosId] = useState('')
  const [ativosTabela, setAtivosTabela] = useState<any[]>([])
  const [carregandoAtivos, setCarregandoAtivos] = useState(false)
  const [termoBusca, setTermoBusca] = useState('')

  const [mostrarFormAtivo, setMostrarFormAtivo] = useState(false)
  const [formTicker, setFormTicker] = useState('')
  const [formEmpresa, setFormEmpresa] = useState('')
  const [formPrecoTeto, setFormPrecoTeto] = useState('')
  const [formVies, setFormVies] = useState('Comprar')
  const [ativoEditandoId, setAtivoEditandoId] = useState<number | null>(null)

  const [toastMsg, setToastMsg] = useState('');
  const [toastTipo, setToastTipo] = useState<'sucesso' | 'erro'>('sucesso');
  const [ativoParaRemover, setAtivoParaRemover] = useState<{id: number, ticker: string} | null>(null);

  useEffect(() => {
    api.get('/carteiras')
        .then(res => {
          setCarteirasDisponiveis(res.data)
          if (res.data.length > 0) {
            setCarteiraAtivosId(res.data[0].id.toString())
          }
        })
        .catch(err => console.error("Erro ao carregar carteiras:", err))
  }, [])

  useEffect(() => {
    if (!carteiraAtivosId) return;

    setCarregandoAtivos(true);
    setMostrarFormAtivo(false); 
    setTermoBusca(''); 

    api.get(`/carteiras/${carteiraAtivosId}`)
        .then(res => {
          setAtivosTabela(res.data.ativos || [])
        })
        .catch(err => console.error("Erro ao carregar ativos:", err))
        .finally(() => setCarregandoAtivos(false)) // Tira o loading
  }, [carteiraAtivosId])

  const ativosFiltrados = ativosTabela.filter(ativo =>
      ativo.ticker.toLowerCase().includes(termoBusca.toLowerCase()) ||
      (ativo.nomeEmpresa && ativo.nomeEmpresa.toLowerCase().includes(termoBusca.toLowerCase()))
  );

  const totalAtivos = ativosTabela.length;
  const qtdComprar = ativosTabela.filter(a => a.vies === 'Comprar').length;
  const qtdVenderAguardar = totalAtivos - qtdComprar;

  const pctComprar = totalAtivos > 0 ? Math.round((qtdComprar / totalAtivos) * 100) : 0;
  const pctVenderAguardar = totalAtivos > 0 ? Math.round((qtdVenderAguardar / totalAtivos) * 100) : 0;

  const handleEditarClique = (ativo: any) => {
    setFormTicker(ativo.ticker)
    setFormEmpresa(ativo.nomeEmpresa || '')
    setFormPrecoTeto(ativo.precoTeto ? ativo.precoTeto.toString() : '')
    setFormVies(ativo.vies)
    setAtivoEditandoId(ativo.id)
    setMostrarFormAtivo(true)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleSalvarAtivo = async () => {
    if (!formTicker || !formPrecoTeto) {
      mostrarNotificacao("Ticker e Preço Teto são obrigatórios!", "erro")
      return
    }

    const payload = {
      ticker: formTicker.toUpperCase(),
      nomeEmpresa: formEmpresa,
      precoTeto: parseFloat(formPrecoTeto.replace(',', '.')),
      vies: formVies,
      carteiraId: parseInt(carteiraAtivosId)
    }

    try {
      if (ativoEditandoId) {
        await api.put(`/ativos/${ativoEditandoId}`, payload)
        mostrarNotificacao("Recomendação atualizada com sucesso!", "sucesso")
      } else {
        await api.post('/ativos', payload)
        mostrarNotificacao("Novo ativo cadastrado com sucesso!", "sucesso")
      }

      setCarregandoAtivos(true);
      const res = await api.get(`/carteiras/${carteiraAtivosId}`)
      setAtivosTabela(res.data.ativos || [])
      setCarregandoAtivos(false);

      handleCancelarForm()
    } catch (error) {
      console.error(error)
      mostrarNotificacao("Erro ao salvar. Verifique a conexão.", "erro")
    }
  }

  const handleCancelarForm = () => {
    setMostrarFormAtivo(false)
    setAtivoEditandoId(null)
    setFormTicker('')
    setFormEmpresa('')
    setFormPrecoTeto('')
    setFormVies('Comprar')
  }

  const handleAbrirModalRemover = (idAtivo: number, ticker: string) => {
    setAtivoParaRemover({ id: idAtivo, ticker: ticker });
  }

  const handleConfirmarRemocao = async () => {
    if (!ativoParaRemover) return;

    try {
      await api.delete(`/ativos/${ativoParaRemover.id}`);
      mostrarNotificacao(`${ativoParaRemover.ticker} removido da carteira!`, "sucesso");

      setCarregandoAtivos(true);
      const res = await api.get(`/carteiras/${carteiraAtivosId}`);
      setAtivosTabela(res.data.ativos || []);
      setCarregandoAtivos(false);
    } catch (error) {
      console.error(error);
      mostrarNotificacao("Erro ao remover o ativo.", "erro");
    } finally {
      setAtivoParaRemover(null);
    }
  }

  const mostrarNotificacao = (msg: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setToastMsg(msg);
    setToastTipo(tipo);
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
      <div className="dashboard-layout">
        <SidebarGestor
            activePath="/gestor"
            isOpen={menuMobileAberto}
            onClose={() => setMenuMobileAberto(false)}
        />
        {menuMobileAberto && <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>}

        <TopBar userName="Gestor" onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />

        <main className="dashboard-main">
          <div className="gestor-content">

            <div className="gestor-header-title">
              <h2>Visão Geral da Carteira</h2>
              <p>Gerencie as recomendações e preços teto dos ativos.</p>
            </div>

            <div className="gestor-metricas">

              <div className="gestor-metrica-card">
                <div className="gestor-metrica-header-kpi">
                  <span className="gestor-metrica-label">Total de Ativos</span>
                  <span className="gestor-metrica-badge" style={{ color: '#00B4D8', background: 'rgba(0, 180, 216, 0.1)' }}>100%</span>
                </div>
                <span className="gestor-metrica-valor">{totalAtivos}</span>
                <div className="gestor-barra-bg">
                  <div className="gestor-barra-fill" style={{ width: '100%', backgroundColor: '#00B4D8' }}></div>
                </div>
              </div>

              <div className="gestor-metrica-card">
                <div className="gestor-metrica-header-kpi">
                  <span className="gestor-metrica-label">Índice de Convicção</span>
                  <span className="gestor-metrica-badge" style={{ color: '#4caf50', background: 'rgba(76, 175, 80, 0.1)' }}>{pctComprar}%</span>
                </div>
                <span className="gestor-metrica-valor" style={{ color: '#4caf50' }}>{qtdComprar}</span>
                <div className="gestor-barra-bg">
                  <div className="gestor-barra-fill" style={{ width: `${pctComprar}%`, backgroundColor: '#4caf50' }}></div>
                </div>
              </div>

              <div className="gestor-metrica-card">
                <div className="gestor-metrica-header-kpi">
                  <span className="gestor-metrica-label">Aguardar / Venda</span>
                  <span className="gestor-metrica-badge" style={{ color: '#ff9800', background: 'rgba(255, 152, 0, 0.1)' }}>{pctVenderAguardar}%</span>
                </div>
                <span className="gestor-metrica-valor" style={{ color: '#ff9800' }}>{qtdVenderAguardar}</span>
                <div className="gestor-barra-bg">
                  <div className="gestor-barra-fill" style={{ width: `${pctVenderAguardar}%`, backgroundColor: '#ff9800' }}></div>
                </div>
              </div>

            </div>

            <div className="gestor-card">
              <div className="gestor-ativos-header">

                <div className="gestor-filtros-grupo">
                  <select className="gestor-select-premium" value={carteiraAtivosId} onChange={(e) => setCarteiraAtivosId(e.target.value)}>
                    {carteirasDisponiveis.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>

                  <div className="gestor-busca">
                    <input
                        type="text"
                        placeholder="Buscar ticker..."
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                    />
                  </div>
                </div>

                <button className="gestor-btn-novo-ativo" onClick={() => { setMostrarFormAtivo(true); setAtivoEditandoId(null); }}>
                  + Novo ativo
                </button>
              </div>

              {mostrarFormAtivo && (
                  <div className="gestor-form-panel">
                    <div className="gestor-form-header">
                      <h4>{ativoEditandoId ? "Editar Recomendação" : "Cadastrar Novo Ativo"}</h4>
                      <button className="btn-fechar-form" onClick={handleCancelarForm}>✕</button>
                    </div>

                    <div className="gestor-upload-campos">
                      <div className="gestor-campo-row">
                        <div className="gestor-campo">
                          <label>Ticker</label>
                          <input type="text" placeholder="Ex: ITUB4" value={formTicker} onChange={e => setFormTicker(e.target.value)} />
                        </div>
                        <div className="gestor-campo" style={{ flex: 2 }}>
                          <label>Nome da Empresa</label>
                          <input type="text" placeholder="Ex: Itaú Unibanco" value={formEmpresa} onChange={e => setFormEmpresa(e.target.value)} />
                        </div>
                      </div>

                      <div className="gestor-campo-row">
                        <div className="gestor-campo">
                          <label>Preço Teto (R$)</label>
                          <input type="number" step="0.01" min="0" placeholder="Ex: 42.50" value={formPrecoTeto} onChange={e => setFormPrecoTeto(e.target.value)} />
                        </div>
                        <div className="gestor-campo">
                          <label>Viés de Mercado</label>
                          <select value={formVies} onChange={e => setFormVies(e.target.value)}>
                            <option value="Comprar">Comprar</option>
                            <option value="Aguardar">Aguardar</option>
                            <option value="Vender">Vender</option>
                          </select>
                        </div>
                      </div>

                      <div className="gestor-form-acoes">
                        <button className="gestor-btn-cancelar" onClick={handleCancelarForm}>Cancelar</button>
                        <button className="gestor-btn-publicar" onClick={handleSalvarAtivo}>
                          {ativoEditandoId ? "Salvar Alterações" : "Adicionar à Carteira"}
                        </button>
                      </div>
                    </div>
                  </div>
              )}

              <div className="gestor-tabela-wrapper">
                <table className="gestor-tabela">
                  <thead>
                  <tr>
                    <th>Ativo</th>
                    <th>Empresa</th>
                    <th className="td-right">Preço Teto</th>
                    <th className="td-center">Viés</th>
                    <th className="td-center">Ações</th>
                  </tr>
                  </thead>
                  <tbody>
                  {carregandoAtivos ? (
                      [1, 2, 3].map((skeleton) => (
                          <tr key={`skeleton-${skeleton}`}>
                            <td className="gestor-td-ticker"><div className="skeleton skeleton-text" style={{width: '60px', height: '20px'}}></div></td>
                            <td className="gestor-td-empresa"><div className="skeleton skeleton-text" style={{width: '120px', height: '16px'}}></div></td>
                            <td className="td-right"><div className="skeleton skeleton-text" style={{width: '80px', height: '20px', marginLeft: 'auto'}}></div></td>
                            <td className="td-center"><div className="skeleton skeleton-text" style={{width: '70px', height: '24px', margin: '0 auto', borderRadius: '12px'}}></div></td>
                            <td className="td-center"><div className="skeleton skeleton-text" style={{width: '60px', height: '24px', margin: '0 auto'}}></div></td>
                          </tr>
                      ))
                  ) : ativosFiltrados.length > 0 ? (
                      ativosFiltrados.map((ativo, i) => (
                          <tr key={i}>
                            <td className="gestor-td-ticker" data-label="Ativo">{ativo.ticker}</td>
                            <td className="gestor-td-empresa" data-label="Empresa">{ativo.nomeEmpresa || '---'}</td>
                            <td className="td-right" data-label="Preço Teto">
                              {ativo.precoTeto?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                            </td>
                            <td className="td-center" data-label="Viés">
                              <span className={`gestor-vies vies-${ativo.vies.toLowerCase()}`}>{ativo.vies}</span>
                            </td>
                            <td className="td-center" data-label="Ações">
                              <div className="gestor-acoes-grupo">
                                <button
                                    className="btn-acao-svg btn-editar"
                                    onClick={() => handleEditarClique(ativo)}
                                    title="Editar Ativo"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </button>

                                <button
                                    className="btn-acao-svg btn-remover"
                                    onClick={() => handleAbrirModalRemover(ativo.id, ativo.ticker)}
                                    title="Remover Ativo"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                      ))
                  ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>
                          {termoBusca ? "Nenhum ativo encontrado para esta busca." : "Nenhum ativo cadastrado nesta carteira."}
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
          {ativoParaRemover && (
              <div className="gestor-modal-overlay">
                <div className="gestor-modal-box">
                  <div className="gestor-modal-icone">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                  <h3>Remover Recomendação</h3>
                  <p>Tem certeza que deseja remover <strong>{ativoParaRemover.ticker}</strong> desta carteira? Esta ação não pode ser desfeita.</p>
                  <div className="gestor-modal-acoes">
                    <button className="gestor-btn-cancelar" onClick={() => setAtivoParaRemover(null)}>Cancelar</button>
                    <button className="gestor-btn-remover-confirmar" onClick={handleConfirmarRemocao}>Sim, remover</button>
                  </div>
                </div>
              </div>
          )}
        </main>
        {toastMsg && (
            <div className={`gestor-toast toast-${toastTipo}`}>
              {toastMsg}
            </div>
        )}
      </div>
  )
}