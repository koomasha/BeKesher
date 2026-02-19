import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from '@lingui/react';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import GroupsPage from './pages/GroupsPage';
import FeedbackPage from './pages/FeedbackPage';
import SupportPage from './pages/SupportPage';
import OnboardingPage from './pages/OnboardingPage';
import PaymentPage from './pages/PaymentPage';
import TaskPage from './pages/TaskPage';
import { UserHeader } from './components/UserHeader';
import { UserFooter } from './components/UserFooter';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useTelegramAuth } from './hooks/useTelegramAuth';
import { useLanguage } from './hooks/useLanguage';
import { i18n } from './i18n';

function App() {
    const { telegramUser } = useTelegramAuth();
    const { isLoading } = useLanguage();

    // Show loading state while i18n catalogs are loading
    if (isLoading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    // In production, restrict access to users with a valid Telegram ID
    if (import.meta.env.PROD && !telegramUser?.id) {
        return (
            <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div className="card" style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-md)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="2"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="white" strokeWidth="2"/></svg>
                    </div>
                    <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, marginBottom: 'var(--spacing-sm)', color: 'var(--text-primary)' }}>
                        Доступ ограничен
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Это приложение доступно только через Telegram
                    </p>
                </div>
            </div>
        );
    }

    return (
        <I18nProvider i18n={i18n}>
            <BrowserRouter>
                <div className="app">
                    <UserHeader />
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/onboarding" element={<OnboardingPage />} />
                        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                        <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
                        <Route path="/task" element={<ProtectedRoute><TaskPage /></ProtectedRoute>} />
                        <Route path="/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
                        <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
                        <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
                    </Routes>
                    <UserFooter />
                </div>
            </BrowserRouter>
        </I18nProvider>
    );
}

export default App;
