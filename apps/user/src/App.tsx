import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import GroupsPage from './pages/GroupsPage';
import FeedbackPage from './pages/FeedbackPage';
import SupportPage from './pages/SupportPage';
import OnboardingPage from './pages/OnboardingPage';
import { UserHeader } from './components/UserHeader';
import { useTelegramAuth } from './hooks/useTelegramAuth';

function App() {
    const { telegramUser } = useTelegramAuth();

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
        <BrowserRouter>
            <div className="app">
                <UserHeader />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/onboarding" element={<OnboardingPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/groups" element={<GroupsPage />} />
                    <Route path="/feedback" element={<FeedbackPage />} />
                    <Route path="/support" element={<SupportPage />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
