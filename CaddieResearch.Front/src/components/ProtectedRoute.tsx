import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '.././services/api'; 

interface ProtectedRouteProps {
    children: React.ReactNode;
    roleRequired?: string;
    clientOnly?: boolean; 
}

export default function ProtectedRoute({ children, roleRequired, clientOnly }: ProtectedRouteProps) {
    const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized' | 'forbidden-user' | 'forbidden-gestor'>('loading');

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('caddie_token');

            if (!token) {
                setStatus('unauthorized');
                return;
            }

            try {
                const res = await api.get('/usuario/meu-perfil');
                const tipoPerfil = res.data.tipoPerfil;

                if (roleRequired === 'Gestor' && tipoPerfil !== 'Gestor') {
                    setStatus('forbidden-user');
                    return;
                }

                if (clientOnly && tipoPerfil === 'Gestor') {
                    setStatus('forbidden-gestor');
                    return;
                }

                setStatus('authorized');
            } catch (error) {
                localStorage.removeItem('caddie_token');
                setStatus('unauthorized');
            }
        };

        checkAuth();
    }, [roleRequired, clientOnly]);

    if (status === 'loading') {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0d1117'
            }}>
                <div className="skeleton skeleton-circular" style={{ width: '60px', height: '60px' }}></div>
            </div>
        );
    }

    if (status === 'unauthorized') {
        return <Navigate to="/login" replace />;
    }

    if (status === 'forbidden-user') {
        return <Navigate to="/home" replace />;
    }

    if (status === 'forbidden-gestor') {
        return <Navigate to="/gestor" replace />;
    }

    return <>{children}</>;
}