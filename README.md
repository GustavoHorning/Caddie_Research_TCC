

```markdown
# 📈 Caddie | Plataforma de Inteligência em Investimentos

> **Status do Projeto:** 🚀 Sprint 1 (MVP) Concluída 

O **Caddie** é uma plataforma moderna projetada para conectar gestores de carteiras de investimentos aos seus clientes. Através de um painel de alta performance, os gestores podem recomendar ativos (Ações, FIIs, BDRs), definir preços-teto e classificar o viés de mercado em tempo real.

---

## ✨ Principais Funcionalidades (Sprint 1)

*   **📊 Dashboard do Gestor (Cockpit):** Painel gerencial com KPIs calculados em tempo real (Total de ativos, % de viés de Compra/Venda) e barras de progresso animadas.
*   **📱 Responsividade Extrema:** Interface fluida adaptável desde monitores Ultrawide até smartphones compactos (testado rigorosamente em resoluções de 320px).
*   **🛡️ UX Premium:** Modais customizados para proteção contra exclusões acidentais, substituindo alertas nativos do navegador.
*   **🔄 CRUD Completo de Ativos:** Gestão integral de recomendações na carteira, com atualizações assíncronas de estado (sem recarregar a página).
*   **🔐 Autenticação:** Controle de acesso com JWT (JSON Web Tokens) e roteamento protegido (Front e Back-end).

---

## 🛠️ Tecnologias e Arquitetura

Este projeto foi construído utilizando as melhores práticas de Engenharia de Software, separando responsabilidades entre Front-end e Back-end.

### Front-end
*   **React (TypeScript):** Componentização e tipagem estática para maior previsibilidade de código.
*   **CSS3 (Vanilla):** Estilização customizada com foco em performance e UI/UX avançada (efeitos de blur, animações e flexbox/grid layout).
*   **Axios:** Consumo da API RESTful com interceptadores para injeção de tokens de autorização.
*   **React Router Dom:** Navegação fluida de Single Page Application (SPA).

### Back-end & Banco de Dados
*   **C# e .NET 8:** Construção da API RESTful com arquitetura em camadas.
*   **Entity Framework Core:** ORM utilizado para mapeamento objeto-relacional e gerenciamento de Migrations.
*   **SQL Server:** Banco de dados relacional robusto.

---

## 🚀 Como Rodar o Projeto Localmente

Siga as instruções abaixo para executar o projeto no seu ambiente de desenvolvimento (Ideal para demonstrações e testes).

### Pré-requisitos
*   Node.js (v18+)
*   .NET SDK (v8.0+)
*   SQL Server (Express ou LocalDB)

### 1. Configurando o Banco de Dados (Back-end)
1. Clone este repositório: 
   ```bash
   git clone [https://github.com/SEU-USUARIO/caddie.git](https://github.com/SEU-USUARIO/caddie.git)
   ```
2. Abra o projeto C# na sua IDE (Visual Studio / Rider).
3. No arquivo `appsettings.Development.json`, verifique e ajuste a sua `DefaultConnection` para apontar para o seu SQL Server local.
4. Abra o Console do Gerenciador de Pacotes (Package Manager Console) ou terminal e rode as migrations para criar as tabelas:
   ```bash
   dotnet ef database update
   ```
5. Execute a API. Ela ficará rodando (por padrão) em `http://localhost:5194`.

### 2. Configurando o Front-end
1. Navegue até a pasta do Front-end:
   ```bash
   cd caddie-frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. O painel estará disponível em `http://localhost:5173`.

---

## 🗺️ Roadmap (Próximos Passos)

- [ ] Integração com a **BrAPI** para preenchimento automático do nome da empresa e cotação em tempo real via Ticker.
- [ ] Separação visual de painéis para carteiras Internacionais (BDRs/Ações).
- [ ] Recuperação de senha e envio de relatórios semanais automatizados.

---

## 👥 Equipe Desenvolvedora

Projeto desenvolvido com foco em qualidade técnica, código limpo e experiência do usuário como parte das avaliações do curso de Sistemas de Informação.
```
