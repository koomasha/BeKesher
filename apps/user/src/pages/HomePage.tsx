import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { Logo } from '../components/Logo';

function HomePage() {
    const { authArgs, isAuthenticated, telegramUser } = useTelegramAuth();

    // Fetch user profile if authenticated
    const profile = useQuery(
        api.participants.getMyProfile,
        isAuthenticated ? authArgs : 'skip'
    );

    const firstName = telegramUser?.first_name || 'Friend';

    return (
        <div className="page">
            <div className="page-header decorated-section">
                <Logo size={56} className="home-logo" />
                <h1>Привет, {firstName}!</h1>
                <p>Добро пожаловать в BeKesher</p>
            </div>

            {profile === undefined && isAuthenticated && (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Загружаем профиль...</p>
                </div>
            )}

            {profile && (
                <div className="card animate-fade-in section-warm" style={{ background: 'var(--bg-warm)' }}>
                    <div className="card-header">
                        <span className="card-title">Твой статус</span>
                        <span className={`badge badge-${profile.status.toLowerCase()}`}>
                            {profile.status}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <span className="points-badge">
                            {profile.totalPoints} баллов
                        </span>
                    </div>
                    {profile.paidUntil && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)' }}>
                            Подписка до: {new Date(profile.paidUntil).toLocaleDateString('ru-RU')}
                        </p>
                    )}
                </div>
            )}

            {!profile && !isAuthenticated && (
                <div className="card animate-fade-in">
                    <div className="empty-state">
                        <p>Откройте приложение из Telegram</p>
                    </div>
                </div>
            )}

            <nav className="nav-menu">
                <Link to="/profile" className="nav-item">
                    <span className="nav-icon nav-icon-profile">P</span>
                    <span className="label">Мой профиль</span>
                </Link>
                <Link to="/groups" className="nav-item">
                    <span className="nav-icon nav-icon-groups">G</span>
                    <span className="label">Мои группы</span>
                </Link>
                <Link to="/feedback" className="nav-item">
                    <span className="nav-icon nav-icon-feedback">F</span>
                    <span className="label">Отзывы</span>
                </Link>
                <Link to="/support" className="nav-item">
                    <span className="nav-icon nav-icon-support">S</span>
                    <span className="label">Поддержка</span>
                </Link>
            </nav>
        </div>
    );
}

export default HomePage;
