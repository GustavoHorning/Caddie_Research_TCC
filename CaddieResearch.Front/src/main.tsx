import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'

const msalConfig = {
    auth: {
        clientId: "2eb8e789-1006-4836-b9c9-eedfd85054d5",
        authority: "https://login.microsoftonline.com/common", 
        redirectUri: "http://localhost:5173",
    }
};

const msalInstance = new PublicClientApplication(msalConfig);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <MsalProvider instance={msalInstance}>
            <GoogleOAuthProvider clientId="926702701587-u8gcgcgdf7aa28c846mj9cibs3mtm4fk.apps.googleusercontent.com">
                <App />
            </GoogleOAuthProvider>
        </MsalProvider>
    </React.StrictMode>,
)
