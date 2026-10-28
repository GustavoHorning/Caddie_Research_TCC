# ⛳ Caddie Research — Plataforma de Inteligência em Investimentos

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![.NET Core](https://img.shields.io/badge/.NET_8-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL_Server-CC2927?style=for-the-badge&logo=microsoft-sql-server&logoColor=white)
![Azure](https://img.shields.io/badge/Azure-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white)

A **Caddie Research** é uma plataforma inovadora de análise e pesquisa de investimentos que oferece carteiras recomendadas, gestão de portfólio, emissão de relatórios e cobertura macroeconômica. 

O sistema possui uma arquitetura dividida entre uma vitrine pública (Landing Page e Checkout) e dois painéis privados de alta performance: o **Painel do Cliente** e o **Painel do Gestor**, protegidos por um sistema robusto de controle de acesso (Paywall).

---

## ✨ Principais Funcionalidades

- 🔒 **Gestão de Assinaturas (Paywall):** Controle de acesso baseado em planos (Basic, Premium e Black) com integração via gateway de pagamento.
- 🔍 **Omnisearch (Busca Global):** Motor de busca centralizado que varre ativos, conteúdos de relatórios em PDF, metadados e logs de auditoria respeitando o nível de permissão do usuário.
- 🔔 **Notificações em Tempo Real:** Integração com `SignalR` (WebSockets) para alertas instantâneos de novos relatórios, mudanças em carteiras e eventos do mercado.
- 📅 **Calendário Macroeconômico e Corporativo:** Agenda automatizada via *Background Workers* para divulgação de balanços, eventos macroeconômicos e lives exclusivas da equipe Caddie.
- 🌓 **Acessibilidade e UX:** Interface fluida com suporte nativo e sincronizado a Modo Claro (Light Mode) e Modo Escuro (Dark Mode) em toda a aplicação.
- 🛡️ **Segurança e Auditoria:** Histórico imutável de recomendações de carteiras (Logs de Gestor) e suporte a Social Login (Google e Microsoft).

---

## 🛠️ Tecnologias Utilizadas

### Frontend
* **React 18** com **Vite**
* **TypeScript** para tipagem estática rigorosa
* **React Router Dom** para roteamento e proteção de rotas
* **CSS Nativo** com variáveis CSS para injeção dinâmica de temas

### Backend
* **C# / .NET 8** (Web API)
* **Entity Framework Core** (Code-First)
* **SQL Server** (Banco de Dados Relacional)
* **SignalR** para comunicação Bidirecional (WebSockets)
* **Azure Blob Storage** para hospedagem segura de PDFs e Áudios
* Integrações com APIs Externas (Brapi, Finnhub, Microsoft Graph, Google OAuth, AbacatePay)

---

## ⚙️ Pré-requisitos

Certifique-se de ter as seguintes ferramentas instaladas no seu ambiente local:
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js (versão 18+ ou 20+)](https://nodejs.org/)
- [SQL Server](https://www.microsoft.com/sql-server/) (LocalDB, Express ou Developer)
- IDE recomendada: Visual Studio 2022, JetBrains Rider ou VS Code.

---

## 🚀 Como Executar o Projeto

O repositório está configurado como um *monorepo*. Siga os passos abaixo para rodar a aplicação localmente:

### 1. Clonar o Repositório
```bash
git clone https://github.com/SEU_USUARIO/caddie-research.git
cd caddie-research
```

### 2. Configurar o Banco de Dados (Backend)
1. Navegue até a pasta da API:
   ```bash
   cd CaddieResearch.Api
   ```
2. Restaure as dependências do .NET:
   ```bash
   dotnet restore
   ```
3. Verifique o arquivo `appsettings.json` e garanta que a `DefaultConnection` aponta para a sua instância local do SQL Server:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=db-caddie-research;Trusted_Connection=True;MultipleActiveResultSets=true"
   }
   ```
4. Aplique as migrações para criar o banco de dados e as tabelas:
   ```bash
   dotnet ef database update
   ```
5. Inicie o servidor Backend:
   ```bash
   dotnet run
   ```
   *A API estará rodando em `http://localhost:5194`.*

### 3. Iniciar a Aplicação Web (Frontend)
1. Abra um **novo terminal** na pasta base do projeto e navegue até a pasta do Frontend:
   ```bash
   cd CaddieResearch.Front
   ```
2. Instale as dependências do ecossistema Node:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento do Vite:
   ```bash
   npm run dev
   ```
4. Acesse a aplicação no navegador através do endereço: **`http://localhost:5173`**

---

## 📚 Documentação da API (OpenAPI / Swagger)

A API do projeto foi documentada seguindo o padrão **OpenAPI**. Todos os *endpoints* possuem sumários detalhados, descrições dos códigos de status HTTP e exemplos reais de *payload*.

Com o backend em execução, acesse a interface interativa do Swagger pelo navegador:
👉 **`http://localhost:5194/swagger`**

---

## 🤝 Equipe Desenvolvedora

* **Gustavo Horning**
* **Natan Battaglia de Araújo** 
* **Gabriel Ribeiro**
* **Ricardo Horning**
---
*Projeto desenvolvido como requisito acadêmico / portfólio profissional.*
