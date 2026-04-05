import './Carteiras.css'
import Sidebar from '../Sidebar'
import TopBar from '../TopBar'

const carteiras = [
  {
    nome: 'Dividendos',
    rentabilidade: '519,25%',
    comprar: 8,
    aguardar: 5,
    tempo: 'ha 17 dias',
  },
  {
    nome: 'Valor',
    rentabilidade: '140,17%',
    comprar: 4,
    aguardar: 9,
    tempo: 'ha 1 mes',
  },
  {
    nome: 'FIIs',
    rentabilidade: '163,36%',
    comprar: 33,
    aguardar: 22,
    tempo: 'ha 11 dias',
  },
  {
    nome: 'Small Caps',
    rentabilidade: '308,51%',
    comprar: 8,
    aguardar: 7,
    tempo: 'ha 1 mes',
  },
  {
    nome: 'Internacional',
    rentabilidade: '334,89%',
    comprar: 11,
    aguardar: 10,
    tempo: 'ha 20 dias',
    link: '/carteiras/internacional',
  },
  {
    nome: 'Fundos',
    rentabilidade: '87,42%',
    comprar: 6,
    aguardar: 4,
    tempo: 'ha 3 anos',
  },
  {
    nome: 'Renda Fixa',
    rentabilidade: '112,30%',
    comprar: 10,
    aguardar: 3,
    tempo: 'ha 1 mes',
  },
  {
    nome: 'Reserva de Emergencia',
    rentabilidade: '45,60%',
    comprar: 3,
    aguardar: 2,
    tempo: 'ha 2 anos',
  },
]

export default function Carteiras() {
  return (
    <div className="dashboard-layout">
      <Sidebar activePath="/carteiras" />
      <TopBar userName="Usuario" />
      <main className="dashboard-main">
        <div className="carteiras-content">
          <h1 className="carteiras-titulo">Carteiras disponiveis</h1>

          <div className="carteiras-grid">
            {carteiras.map((carteira, i) => (
              <a key={i} className="carteira-card" href={carteira.link ? carteira.link : '#'} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="carteira-card-top">
                  <div className="carteira-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                  </div>
                  <span className="carteira-tempo">{carteira.tempo}</span>
                </div>

                <h3 className="carteira-nome">{carteira.nome}</h3>

                <div className="carteira-card-bottom">
                  <div className="carteira-rent">
                    <span className="carteira-rent-valor">
                      <span className="carteira-seta">&#9650;</span> {carteira.rentabilidade}
                    </span>
                    <span className="carteira-rent-label">rentabilidade total</span>
                  </div>
                  <div className="carteira-ativos">
                    <div className="carteira-ativo-linha">
                      <span className="carteira-ativo-tipo">Comprar</span>
                      <strong>{carteira.comprar} ativos</strong>
                    </div>
                    <div className="carteira-ativo-linha">
                      <span className="carteira-ativo-tipo">Aguardar</span>
                      <strong>{carteira.aguardar} ativos</strong>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}