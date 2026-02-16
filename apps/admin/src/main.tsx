import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import App from './App';
import './index.css';
import { useAdminAuth } from './hooks/useAdminAuth';
import { LanguageProvider } from './hooks/useLanguage';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <LanguageProvider>
            <ConvexProviderWithAuth client={convex} useAuth={useAdminAuth}>
                <App />
            </ConvexProviderWithAuth>
        </LanguageProvider>
    </React.StrictMode>
);
