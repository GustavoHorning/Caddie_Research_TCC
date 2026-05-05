import './ComoFunciona.css';

const passos = [
  {
    numero: '01',
    titulo: 'Crie sua conta',
    descricao: 'Cadastre-se gratuitamente em menos de 2 minutos. Sem cartão de crédito necessário para começar.',
  },
  {
    numero: '02',
    titulo: 'Escolha seu plano',
    descricao: 'Selecione o plano que melhor se adapta ao seu perfil de investidor e aos conteúdos que deseja acessar.',
  },
  {
    numero: '03',
    titulo: 'Acesse os relatórios',
    descricao: 'Explore nossa biblioteca completa de relatórios de ações, FIIs, carteiras recomendadas e papers econômicos.',
  },
  {
    numero: '04',
    titulo: 'Invista com mais segurança',
    descricao: 'Use as análises da Caddie Research para tomar decisões de investimento mais fundamentadas e consistentes.',
  },
];

export default function ComoFunciona() {
  return (
    <section className="como-funciona" id="como-funciona">
      <div className="como-funciona-container">
        <div className="section-label">Como Funciona</div>
        <h2 className="section-title">Simples de começar. Poderoso para investir.</h2>
        <p className="section-subtitle">
          Em poucos passos você já tem acesso a toda a inteligência da Caddie Research.
        </p>

        <div className="passos-grid">
          {passos.map((passo, index) => (
            <div className="passo-item" key={index}>
              <div className="passo-numero">{passo.numero}</div>
              {index < passos.length - 1 && <div className="passo-linha" />}
              <h3 className="passo-titulo">{passo.titulo}</h3>
              <p className="passo-descricao">{passo.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}