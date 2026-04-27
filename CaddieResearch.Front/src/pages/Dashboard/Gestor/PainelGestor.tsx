import { useState, useEffect } from 'react'
import './PainelGestor.css'
import TopBar from '../TopBar'
import api from '../../../services/api'
import SidebarGestor from '../SidebarGestor'



export default function PainelGestor() {

  const [carteirasDisponiveis, setCarteirasDisponiveis] = useState<any[]>([])
  const [carteiraAtivosId, setCarteiraAtivosId] = useState('')
  const [ativosTabela, setAtivosTabela] = useState<any[]>([])

  const [mostrarFormAtivo, setMostrarFormAtivo] = useState(false)
  const [formTicker, setFormTicker] = useState('')
  const [formEmpresa, setFormEmpresa] = useState('')
  const [formPrecoTeto, setFormPrecoTeto] = useState('')
  const [formVies, setFormVies] = useState('Comprar')
  const [ativoEditandoId, setAtivoEditandoId] = useState<number | null>(null)

  const [toastMsg, setToastMsg] = useState('');
  const [toastTipo, setToastTipo] = useState<'sucesso' | 'erro'>('sucesso');

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

    api.get(`/carteiras/${carteiraAtivosId}`)
        .then(res => {
          setAtivosTabela(res.data.ativos || [])
        })
        .catch(err => console.error("Erro ao carregar ativos:", err))
  }, [carteiraAtivosId])

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

      const res = await api.get(`/carteiras/${carteiraAtivosId}`)
      setAtivosTabela(res.data.ativos || [])

      setFormTicker('')
      setFormEmpresa('')
      setFormPrecoTeto('')
      setFormVies('Comprar')
      setAtivoEditandoId(null) 
      setMostrarFormAtivo(false)
    } catch (error) {
      console.error(error)
      mostrarNotificacao("Erro ao salvar. Verifique se a API está rodando.", "erro")
    }
  }

  const handleCancelarForm = () => {
    setMostrarFormAtivo(!mostrarFormAtivo)
    if (mostrarFormAtivo) {
      setAtivoEditandoId(null)
      setFormTicker('')
      setFormEmpresa('')
      setFormPrecoTeto('')
      setFormVies('Comprar')
    }
  }

  

  const mostrarNotificacao = (msg: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setToastMsg(msg);
    setToastTipo(tipo);
    setTimeout(() => setToastMsg(''), 3000); 
  };

  return (
      <div className="dashboard-layout">
        <SidebarGestor activePath="/gestor" />
        <TopBar userName="Gestor" />
        <main className="dashboard-main">
          <div className="gestor-content">

            <div className="gestor-card gestor-ativos" style={{ marginTop: '24px' }}>
              <div className="gestor-ativos-header">
                <h3>Gerenciar ativos da carteira</h3>
                <div className="gestor-ativos-acoes">
                  <select value={carteiraAtivosId} onChange={(e) => setCarteiraAtivosId(e.target.value)}>
                    {carteirasDisponiveis.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                  <button
                      className="gestor-btn-novo-ativo"
                      onClick={handleCancelarForm}
                  >
                    {mostrarFormAtivo ? "Cancelar" : "+ Novo ativo"}
                  </button>
                </div>
              </div>

              {mostrarFormAtivo && (
                  <div className="gestor-card" style={{ marginBottom: '24px', borderTop: '4px solid #00B4D8' }}>
                    <h4 style={{ color: '#fff', marginBottom: '16px', fontSize: '0.95rem' }}>Cadastrar Novo Ativo</h4>

                    <div className="gestor-upload-campos">
                      <div className="gestor-campo-row">
                        <div className="gestor-campo">
                          <label>Ticker</label>
                          <input
                              type="text"
                              placeholder="Ex: ITUB4"
                              value={formTicker}
                              onChange={e => setFormTicker(e.target.value)}
                          />
                        </div>
                        <div className="gestor-campo" style={{ flex: 2 }}>
                          <label>Empresa</label>
                          <input
                              type="text"
                              placeholder="Ex: Itaú Unibanco"
                              value={formEmpresa}
                              onChange={e => setFormEmpresa(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="gestor-campo-row">
                        <div className="gestor-campo">
                          <label>Preço Teto (R$)</label>
                          <input
                              type="number"
                              placeholder="Ex: 42.50"
                              value={formPrecoTeto}
                              onChange={e => setFormPrecoTeto(e.target.value)}
                          />
                        </div>
                        <div className="gestor-campo">
                          <label>Viés</label>
                          <select value={formVies} onChange={e => setFormVies(e.target.value)}>
                            <option value="Comprar">Comprar</option>
                            <option value="Aguardar">Aguardar</option>
                            <option value="Vender">Vender</option>
                          </select>
                        </div>
                      </div>

                      <button
                          className="gestor-btn-publicar"
                          onClick={handleSalvarAtivo}
                          style={{ marginTop: '10px' }}
                      >
                        {ativoEditandoId ? "Atualizar Ativo na Carteira" : "Salvar Ativo na Carteira"}
                      </button>
                    </div>
                  </div>
              )}

              <div className="gestor-tabela-wrapper">
                <table className="gestor-tabela">
                  <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Empresa</th>
                    <th>Preço Teto</th>
                    <th>Viés</th>
                    <th>Ações</th>
                  </tr>
                  </thead>
                  <tbody>
                  {ativosTabela.length > 0 ? (
                      ativosTabela.map((ativo, i) => (
                          <tr key={i}>
                            <td className="gestor-td-ticker">{ativo.ticker}</td>
                            <td className="gestor-td-empresa">{ativo.nomeEmpresa || '---'}</td>
                            <td>R$ {ativo.precoTeto?.toFixed(2) || '0.00'}</td>
                            <td>
                          <span className={`gestor-vies vies-${ativo.vies.toLowerCase()}`}>
                            {ativo.vies}
                          </span>
                            </td>
                            <td className="gestor-td-acoes">
                          <span
                              className="gestor-acao-editar"
                              onClick={() => handleEditarClique(ativo)}
                          >
                            Editar
                          </span>
                            </td>
                          </tr>
                      ))
                  ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.4)' }}>
                          Nenhum ativo cadastrado nesta carteira.
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
        {toastMsg && (
            <div className={`gestor-toast toast-${toastTipo}`}>
              {toastMsg}
            </div>
        )}
      </div>
  )
}