import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { Logo } from '../components/Logo';
import { User2, Heart, LifeBuoy } from 'lucide-react';
import { Trans } from '@lingui/macro';
import { useEffect } from 'react';

function HomePage() {
    const navigate = useNavigate();
    const { authArgs, isAuthenticated, telegramUser } = useTelegramAuth();
    const createLeadParticipant = useMutation(api.participants.createLeadParticipant);

    // Fetch user profile if authenticated
    const profile = useQuery(
        api.participants.getMyProfile,
        isAuthenticated ? authArgs : 'skip'
    );

    const firstName = telegramUser?.first_name || 'Friend';

    // Auto-create Lead participant and redirect to onboarding for new users
    useEffect(() => {
        const initializeUser = async () => {
            if (!isAuthenticated || !telegramUser) return;

            // Wait for profile to load
            if (profile === undefined) return;

            // If no profile exists, create a Lead participant
            if (profile === null && telegramUser.id) {
                try {
                    await createLeadParticipant({
                        telegramId: telegramUser.id.toString(),
                        tgFirstName: telegramUser.first_name,
                        tgLastName: telegramUser.last_name,
                        tgUsername: telegramUser.username,
                        photo: telegramUser.photo_url,
                    });
                    // Redirect to onboarding immediately after creating lead
                    navigate('/onboarding');
                } catch (error) {
                    console.error('Failed to create lead participant:', error);
                }
                return;
            }

            // If profile exists but is incomplete (has placeholder values), redirect to onboarding
            if (profile && isProfileIncomplete(profile)) {
                navigate('/onboarding');
            }
        };

        initializeUser();
    }, [isAuthenticated, telegramUser, profile, createLeadParticipant, navigate]);

    // Helper function to check if profile is incomplete
    const isProfileIncomplete = (p: {
        phone?: string;
        birthDate?: string;
        aboutMe?: string;
        profession?: string;
        purpose?: string;
        expectations?: string;
    } | null) => {
        if (!p) return true;

        // Check for placeholder values that indicate an incomplete profile
        return (
            !p.phone || // Empty phone
            p.phone === "" || // Empty phone
            p.birthDate === "2000-01-01" || // Placeholder birthDate
            !p.aboutMe || // No aboutMe
            !p.profession || // No profession
            !p.purpose || // No purpose
            !p.expectations // No expectations
        );
    };

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
