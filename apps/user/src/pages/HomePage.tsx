import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { Logo } from '../components/Logo';
import { User2, Heart, LifeBuoy } from 'lucide-react';
import { Trans } from '@lingui/macro';

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
                <h1><Trans>Привет, {firstName}!</Trans></h1>
                <p><Trans>Добро пожаловать в BeKesher</Trans></p>
            </div>

            {profile === undefined && isAuthenticated && (
                <div className="loading">
                    <div className="spinner"></div>
                    <p><Trans>Загружаем профиль...</Trans></p>
                </div>
            )}

            {profile && (
                <div className="card animate-fade-in section-warm" style={{ background: 'var(--bg-warm)' }}>
                    <div className="card-header">
                        <span className="card-title"><Trans>Твой статус</Trans></span>
                        <span className={`badge badge-${profile.status.toLowerCase()}`}>
                            {profile.status}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <span className="points-badge">
                            <Trans>{profile.totalPoints} баллов</Trans>
                        </span>
                    </div>
                    {profile.paidUntil && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)' }}>
                            <Trans>Подписка до: {new Date(profile.paidUntil).toLocaleDateString('ru-RU')}</Trans>
                        </p>
                    )}
                </div>
            )}

            {!profile && !isAuthenticated && (
                <div className="card animate-fade-in">
                    <div className="empty-state">
                        <p><Trans>Откройте приложение из Telegram</Trans></p>
                    </div>
                </div>
            )}

            <nav className="nav-menu">
                <Link to="/profile" className="nav-item">
                    <div className="nav-icon nav-icon-profile">
                        <User2 size={24} strokeWidth={2} />
                        <span className="nav-icon-dot nav-icon-dot-profile"></span>
                    </div>
                    <span className="label"><Trans>Мой профиль</Trans></span>
                </Link>
                <Link to="/groups" className="nav-item">
                    <div className="nav-icon nav-icon-groups">
                        <div className="cluster-circles">
                            <div className="cluster-circle cluster-circle-1"></div>
                            <div className="cluster-circle cluster-circle-2"></div>
                            <div className="cluster-circle cluster-circle-3"></div>
                        </div>
                    </div>
                    <span className="label"><Trans>Мои группы</Trans></span>
                </Link>
                <Link to="/feedback" className="nav-item">
                    <div className="nav-icon nav-icon-feedback">
                        <Heart size={24} strokeWidth={2} fill="currentColor" />
                    </div>
                    <span className="label"><Trans>Отзывы</Trans></span>
                </Link>
                <Link to="/support" className="nav-item">
                    <div className="nav-icon nav-icon-support">
                        <LifeBuoy size={24} strokeWidth={2} />
                    </div>
                    <span className="label"><Trans>Поддержка</Trans></span>
                </Link>
            </nav>
        </div>
    );
}

export default HomePage;
