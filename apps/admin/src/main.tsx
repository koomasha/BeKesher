import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import App from './App';
import './index.css';
import { useAdminAuth } from './hooks/useAdminAuth';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ConvexProviderWithAuth client={convex} useAuth={useAdminAuth}>
            <App />
        </ConvexProviderWithAuth>
    </React.StrictMode>
);
