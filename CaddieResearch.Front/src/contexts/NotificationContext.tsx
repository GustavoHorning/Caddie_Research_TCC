import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import api from '../services/api';
import { useLocation } from 'react-router-dom';
import './NotificationToast.css';

export interface Notificacao {
    id: number;
    titulo: string;
    mensagem: string;
    tipo: string;
    linkDestino?: string;
    lida: boolean;
    dataCriacao: string;
}

interface NotificationContextData {
    notificacoes: Notificacao[];
    naoLidas: number;
    marcarComoLida: (id: number) => void;
    marcarTodasComoLidas: () => void; 
}

const NotificationContext = createContext<NotificationContextData>({} as NotificationContextData);

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [toasts, setToasts] = useState<Notificacao[]>([]);
    const naoLidas = notificacoes.filter(n => !n.lida).length;

    const location = useLocation();
    const connectionRef = useRef<signalR.HubConnection | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('caddie_token');

        if (!token) {
            if (connectionRef.current) {
                connectionRef.current.stop();
                connectionRef.current = null;
                console.log('⚪ [SignalR] Usuário deslogado. Antena desligada.');
            }
            setToasts([]);
            setNotificacoes([]);
            return;
        }

        if (connectionRef.current) return;

        api.get('/api/notificacoes')
            .then(res => setNotificacoes(res.data))
            .catch(() => console.log('Ainda não há notificações.'));

        const baseUrl = import.meta.env.DEV
            ? 'http://localhost:5194'
            : 'https://caddieresearch-api-gnewb5eebrckadfk.brazilsouth-01.azurewebsites.net';

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${baseUrl}/hubs/notificacoes`, {
                accessTokenFactory: () => token || ''
            })
            .withAutomaticReconnect()
            .build();

        connectionRef.current = connection;

        connection.start()
            .then(() => console.log('🟢 [SignalR] Conectado! Ouvindo notificações em tempo real.'))
            .catch(err => console.error('🔴 [SignalR] Erro ao conectar:', err));

        connection.on('ReceberNotificacao', (novaNotificacao: Notificacao) => {
            setNotificacoes(prev => [novaNotificacao, ...prev]);
            setToasts(prev => [...prev, novaNotificacao]);

            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== novaNotificacao.id));
            }, 6000);
        });

        return () => {
            if (connectionRef.current) {
                connectionRef.current.stop();
                connectionRef.current = null;
            }
        };
    }, [location.pathname]);


    const marcarComoLida = async (id: number) => {
        setNotificacoes(prev =>
            prev.map(n => n.id === id ? { ...n, lida: true } : n)
        );

        try {
            await api.put(`/api/notificacoes/${id}/marcar-lida`);
        } catch (error) {
            console.error("Erro ao marcar notificação como lida:", error);
        }
    };

    const marcarTodasComoLidas = async () => {
        setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));

        try {
            await api.put('/api/notificacoes/marcar-todas-lidas');
        } catch (error) {
            console.error("Erro ao marcar todas como lidas:", error);
        }
    };


    const removerToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ notificacoes, naoLidas, marcarComoLida, marcarTodasComoLidas }}>
            {children}

            <div className="toast-fixed-container">
                {toasts.map(toast => (
                    <div key={toast.id} className="toast-balao">
                        <div className="toast-icon">
                            {toast.tipo === 'Alerta' ? '🚨' : toast.tipo === 'Sucesso' ? '✅' : '🔔'}
                        </div>
                        <div className="toast-content">
                            <strong>{toast.titulo}</strong>
                            <p>{toast.mensagem}</p>
                        </div>
                        <button className="toast-close" onClick={() => removerToast(toast.id)}>×</button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);