import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';
import { useAdminAuth } from './hooks/useAdminAuth';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <ConvexProviderWithAuth client={convex} useAuth={useAdminAuth}>
                <App />
            </ConvexProviderWithAuth>
        </GoogleOAuthProvider>
    </React.StrictMode>
);
