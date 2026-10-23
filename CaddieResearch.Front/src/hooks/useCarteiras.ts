import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { carteirasService } from '../services/carteirasService';
import type { CarteiraApi } from '../services/carteirasService';

export function useCarteiras() {
    const [carteirasAutorizadas, setCarteirasAutorizadas] = useState<CarteiraApi[]>([]);
    const [carregando, setCarregando] = useState(true);
    const location = useLocation();

    useEffect(() => {
        carteirasService.getCarteirasAutorizadas()
            .then(setCarteirasAutorizadas)
            .catch(console.error)
            .finally(() => setCarregando(false));
    }, []);

    useEffect(() => {
        if (carregando) return;
        const params = new URLSearchParams(location.search);
        const highlightId = params.get('highlight');

        if (highlightId) {
            setTimeout(() => {
                const element = document.getElementById(highlightId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('highlight-pulse');
                    window.history.replaceState(null, '', location.pathname);
                    setTimeout(() => element.classList.remove('highlight-pulse'), 2000);
                }
            }, 300);
        }
    }, [location.search, carregando, location.pathname]);

    const calcularEstatisticas = (carteiraAPI?: CarteiraApi) => {
        if (!carteiraAPI || !carteiraAPI.ativos) {
            return { bloqueada: true, qtdComprar: '?', qtdAguardar: '?', indiceConviccao: '??%' };
        }

        const ativos = carteiraAPI.ativos;
        const totalAtivos = ativos.length;
        const qtdComprar = ativos.filter(a => a.vies === 'Comprar').length;
        const qtdAguardar = ativos.filter(a => a.vies === 'Aguardar').length;
        const indiceConviccao = totalAtivos > 0 ? `${Math.round((qtdComprar / totalAtivos) * 100)}%` : '0%';

        return { bloqueada: false, qtdComprar, qtdAguardar, indiceConviccao };
    };

    return { carteirasAutorizadas, carregando, calcularEstatisticas };
}