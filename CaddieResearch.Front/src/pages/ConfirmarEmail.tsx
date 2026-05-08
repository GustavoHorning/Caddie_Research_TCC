import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Login.css';

export default function ConfirmarEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'carregando' | 'sucesso' | 'erro'>('carregando');
    const [mensagem, setMensagem] = useState('');
    const effectRan = useRef(false);

    const email = searchParams.get('email');
    const token = searchParams.get('token');

    useEffect(() => {
        if (effectRan.current) return;
        effectRan.current = true;

        if (!email || !token) {
            setStatus('erro');
            setMensagem('Link de confirmação inválido ou incompleto.');
            return;
        }

        const confirmarConta = async () => {
            try {
                const res = await api.get(`/api/auth/confirmar-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
                setStatus('sucesso');
                setMensagem(res.data.mensagem || 'E-mail confirmado com sucesso!');
            } catch (error: any) {
                setStatus('erro');
                setMensagem(error.response?.data?.mensagem || 'Erro ao confirmar e-mail. O link pode ter expirado ou já foi utilizado.');
            }
        };

        confirmarConta();
    }, [email, token]);

    return (
        <div className="wrapper">
            <div className="card" style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>

                {status === 'carregando' && (
                    <>
                        <h1 className="title" style={{ marginTop: '20px' }}>Validando conta...</h1>
                        <p className="subtitle">Aguarde enquanto verificamos suas credenciais.</p>
                    </>
                )}

                {status === 'sucesso' && (
                    <>
                        <div style={{ fontSize: '64px', color: '#10B981', marginBottom: '16px' }}>✓</div>
                        <h1 className="title">Tudo Certo!</h1>
                        <p className="subtitle">{mensagem}</p>
                        <button
                            className="btn-primary"
                            style={{ marginTop: '24px' }}
                            onClick={() => navigate('/login')}
                        >
                            Ir para o Login
                        </button>
                    </>
                )}

                {status === 'erro' && (
                    <>
                        <div style={{ fontSize: '64px', color: '#EF4444', marginBottom: '16px' }}>✕</div>
                        <h1 className="title">Ops! Algo deu errado.</h1>
                        <p className="subtitle">{mensagem}</p>
                        <button
                            className="btn-primary"
                            style={{ marginTop: '24px', backgroundColor: '#6B7280' }}
                            onClick={() => navigate('/login')}
                        >
                            Voltar para o Início
                        </button>
                    </>
                )}

            </div>
        </div>
    );
}