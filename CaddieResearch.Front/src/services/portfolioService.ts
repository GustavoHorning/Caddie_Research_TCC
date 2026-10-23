import { API_URL } from './api';

export interface PortfolioItem {
    id: number;
    nome: string;
    dataInicio: string;
    patrimonio: number;
    totalPosicoes: number;
    temContaCorrente: boolean;
    totalAportes: number;
}

export interface CriarPortfolioRequest {
    nome: string;
    dataInicio: string;
    aporteInicial: number | null;
}

export const portfolioService = {
    getHeaders: () => ({
        'Authorization': `Bearer ${localStorage.getItem('caddie_token')}`,
        'Content-Type': 'application/json'
    }),

    async getPortfolios(): Promise<PortfolioItem[]> {
        const res = await fetch(`${API_URL}/api/portfolio`, {
            headers: this.getHeaders()
        });
        if (!res.ok) throw new Error('Falha ao buscar portfólios');
        return res.json();
    },

    async criarPortfolio(dados: CriarPortfolioRequest): Promise<void> {
        const res = await fetch(`${API_URL}/api/portfolio`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(dados)
        });
        if (!res.ok) throw new Error('Falha ao criar portfólio');
    }
};