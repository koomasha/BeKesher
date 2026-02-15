import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useConvexAuth } from 'convex/react';
import { I18nProvider } from '@lingui/react';
import DashboardPage from './pages/DashboardPage';
import ParticipantsPage from './pages/ParticipantsPage';
import GroupsPage from './pages/GroupsPage';
import FeedbackPage from './pages/FeedbackPage';
import SupportPage from './pages/SupportPage';
import MatchingPage from './pages/MatchingPage';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import { useAdminAuth } from './hooks/useAdminAuth';
import { useLanguage } from './hooks/useLanguage';
import { i18n } from './i18n';

function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isLoading, isAuthenticated } = useConvexAuth();

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

function App() {
    const { login } = useAdminAuth();
    const { isAuthenticated } = useConvexAuth();
    const { isLoading } = useLanguage();

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <I18nProvider i18n={i18n}>
            <BrowserRouter>
                <Routes>
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={login} />}
                />
                <Route
                    path="/*"
                    element={
                        <AuthGuard>
                            <div className="admin-layout">
                                <Sidebar />
                                <main className="admin-main">
                                    <Routes>
                                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                        <Route path="/dashboard" element={<DashboardPage />} />
                                        <Route path="/participants" element={<ParticipantsPage />} />
                                        <Route path="/groups" element={<GroupsPage />} />
                                        <Route path="/feedback" element={<FeedbackPage />} />
                                        <Route path="/support" element={<SupportPage />} />
                                        <Route path="/matching" element={<MatchingPage />} />
                                    </Routes>
                                </main>
                            </div>
                        </AuthGuard>
                    }
                />
            </Routes>
        </BrowserRouter>
        </I18nProvider>
    );
}

export default App;
