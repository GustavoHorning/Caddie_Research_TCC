import { useState, useEffect, useMemo } from 'react';
import {type PortfolioItem, type CriarPortfolioRequest, portfolioService} from '../services/portfolioService';

export function usePortfolio() {
    const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
    const [carregando, setCarregando] = useState(true);

    const carregarPortfolios = async () => {
        try {
            setCarregando(true);
            const dados = await portfolioService.getPortfolios();
            setPortfolios(dados);
        } catch (e) {
            console.error('Erro ao carregar portfólios', e);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarPortfolios();
    }, []);

    const criarPortfolio = async (dados: CriarPortfolioRequest) => {
        await portfolioService.criarPortfolio(dados);
        await carregarPortfolios(); 
    };

    const totalPatrimonio = useMemo(() =>
            portfolios.reduce((acc, p) => acc + p.patrimonio, 0),
        [portfolios]);

    const totalPosicoes = useMemo(() =>
            portfolios.reduce((a, p) => a + p.totalPosicoes, 0),
        [portfolios]);

    return {
        portfolios,
        carregando,
        totalPatrimonio,
        totalPosicoes,
        criarPortfolio
    };
}