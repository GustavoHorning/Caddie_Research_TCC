import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export function useCarteiraAuth(planoExigido: string) {
    const navigate = useNavigate();
    const [autorizado, setAutorizado] = useState(false);

    useEffect(() => {
        authService.getMeuPerfil()
            .then((perfil) => {
                if (perfil.tipoPerfil !== 'Gestor' && perfil.plano !== planoExigido) {
                    navigate('/gerenciar-plano');
                } else {
                    setAutorizado(true);
                }
            })
            .catch(() => navigate('/login'));
    }, [navigate, planoExigido]);

    return { autorizado };
}