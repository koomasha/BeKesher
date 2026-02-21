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
import { AccessDenied } from './components/AccessDenied';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useTelegramAuth } from './hooks/useTelegramAuth';
import { useLanguage } from './hooks/useLanguage';
import { i18n } from './i18n';

function App() {
    const { telegramUser } = useTelegramAuth();
    const { isLoading } = useLanguage();

    if (isLoading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (import.meta.env.PROD && !telegramUser?.id) {
        return <AccessDenied />;
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
