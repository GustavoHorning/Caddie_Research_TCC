import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import api from '../services/api';

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
}

const NotificationContext = createContext<NotificationContextData>({} as NotificationContextData);

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const naoLidas = notificacoes.filter(n => !n.lida).length;

    useEffect(() => {
        api.get('/api/notificacoes')
            .then(res => setNotificacoes(res.data))
            .catch(() => console.log('Ainda não há notificações ou endpoint pendente.'));

        const token = localStorage.getItem('caddie_token');
        const baseUrl = import.meta.env.DEV
            ? 'http://localhost:5194'
            : 'https://caddieresearch-api-gnewb5eebrckadfk.brazilsouth-01.azurewebsites.net';

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${baseUrl}/hubs/notificacoes`, {
                accessTokenFactory: () => token || ''
            })
            .withAutomaticReconnect() 
            .build();

        connection.start()
            .then(() => console.log('🟢 [SignalR] Conectado! Ouvindo notificações em tempo real.'))
            .catch(err => console.error('🔴 [SignalR] Erro ao conectar:', err));

        connection.on('ReceberNotificacao', (novaNotificacao: Notificacao) => {
            console.log('🔔 NOVA NOTIFICAÇÃO CHEGOU DIRETO DO AZURE:', novaNotificacao);

            setNotificacoes(prev => [novaNotificacao, ...prev]);
        });

        return () => {
            connection.stop();
        };
    }, []);

    return (
        <NotificationContext.Provider value={{ notificacoes, naoLidas }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);