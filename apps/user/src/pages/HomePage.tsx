import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { Logo } from '../components/Logo';
import { User2, Heart, LifeBuoy, Calendar, UserPlus } from 'lucide-react';
import { Trans, t, Plural } from '@lingui/macro';
import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';

function getWaitingPhrases() {
    return [
        t`Подбираем вам классную компанию...`,
        t`Придумываем задания...`,
        t`Рисуем карту знакомств...`,
        t`Настраиваем магию общения...`,
        t`Ищем интересных людей рядом...`,
        t`Готовим сюрпризы...`,
        t`Варим кофе для первой встречи...`,
        t`Перемешиваем участников...`,
        t`Заряжаем атмосферу...`,
        t`Проверяем совпадения...`,
        t`Планируем незабываемые встречи...`,
        t`Собираем пазл из людей...`,
    ];
}

function getPricingTier(seasonStartDate: number) {
    const daysUntilStart = (seasonStartDate - Date.now()) / (1000 * 60 * 60 * 24);
    const tiers = [
        { label: "Early Bird", price: 100, minDays: 14 },
        { label: "Regular", price: 150, minDays: 3 },
        { label: "Late", price: 200, minDays: -Infinity },
    ];
    const current = tiers.find(t => daysUntilStart >= t.minDays) || tiers[2];
    return { current, all: tiers.map(t => ({ ...t, isCurrent: t === current })) };
}

function HomePage() {
    const navigate = useNavigate();
    const { authArgs, isAuthenticated, telegramUser } = useTelegramAuth();
    const createLeadParticipant = useMutation(api.participants.createLeadParticipant);

    // Fetch user profile if authenticated
    const profile = useQuery(
        api.participants.getMyProfile,
        isAuthenticated ? authArgs : 'skip'
    );

    const enrollment = useQuery(
        api.seasonParticipants.getMyEnrollment,
        isAuthenticated ? authArgs : 'skip'
    );

    const upcomingDraft = useQuery(
        api.seasons.getUpcomingDraft,
        isAuthenticated && enrollment === null ? authArgs : 'skip'
    );

    const selfEnroll = useMutation(api.seasonParticipants.selfEnroll);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [phraseIndex, setPhraseIndex] = useState(0);
    const { locale } = useLanguage();
    const waitingPhrases = getWaitingPhrases();
    const dateLocale = locale === 'ru' ? 'ru-RU' : 'en-US';

    useEffect(() => {
        const timer = setInterval(() => {
            setPhraseIndex((i) => (i + 1) % waitingPhrases.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [waitingPhrases.length]);

    const handleEnroll = async () => {
        if (!upcomingDraft) return;
        setIsEnrolling(true);
        try {
            await selfEnroll({ ...authArgs, seasonId: upcomingDraft._id });
        } catch (error) {
            console.error('Failed to enroll:', error);
        } finally {
            setIsEnrolling(false);
        }
    };

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
                <Logo size={120} className="home-logo" />
                <h1><Trans>Привет, {firstName}!</Trans></h1>
                <p><Trans>Добро пожаловать в Tuk-Tuk</Trans></p>
            </div>

            {profile === undefined && isAuthenticated && (
                <div className="loading">
                    <div className="spinner"></div>
                    <p><Trans>Загружаем профиль...</Trans></p>
                </div>
            )}

            {profile && enrollment !== undefined && (
                <>
                    {enrollment && enrollment.seasonStatus === 'Draft' && (() => {
                        const daysUntil = Math.ceil((enrollment.seasonStartDate - Date.now()) / (1000 * 60 * 60 * 24));
                        return (
                            <div className="card animate-fade-in season-card-draft">
                                <div className="season-card-top-accent"></div>
                                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-lg)' }}>
                                    {enrollment.seasonName}
                                </div>
                                <div style={{ textAlign: 'center', padding: 'var(--spacing-md) 0 var(--spacing-lg)' }}>
                                    <div className="season-countdown">{daysUntil}</div>
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-sm)' }}>
                                        <Plural value={daysUntil} one="день до старта" few="дня до старта" other="дней до старта" />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                        <Calendar size={12} />
                                        {new Date(enrollment.seasonStartDate).toLocaleDateString(dateLocale)}
                                    </div>
                                </div>
                                <div className="season-divider"></div>
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', fontStyle: 'italic', margin: 0 }}>
                                    {waitingPhrases[phraseIndex]}
                                </p>
                            </div>
                        );
                    })()}

                    {enrollment && enrollment.seasonStatus === 'Active' && (
                        <div className="card animate-fade-in season-card-active">
                            <div className="season-card-top-accent"></div>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                                <span style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>
                                    {enrollment.seasonName}
                                </span>
                                <span className="points-badge">
                                    <Trans>{profile.totalPoints} баллов</Trans>
                                </span>
                            </div>
                            {enrollment.weekInSeason && (
                                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                                            <Trans>Неделя {enrollment.weekInSeason} из 4</Trans>
                                        </span>
                                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                            {Math.round((enrollment.weekInSeason / 4) * 100)}%
                                        </span>
                                    </div>
                                    <div className="season-progress-track">
                                        <div className="season-progress-fill" style={{ width: `${(enrollment.weekInSeason / 4) * 100}%` }}></div>
                                    </div>
                                </div>
                            )}
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                {new Date(enrollment.seasonStartDate).toLocaleDateString(dateLocale)} — {new Date(enrollment.seasonEndDate).toLocaleDateString(dateLocale)}
                            </div>
                        </div>
                    )}

                    {enrollment === null && upcomingDraft && (
                        <div className="card animate-fade-in" style={{ background: 'var(--bg-alt)' }}>
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <span style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>
                                    <Trans>Новый сезон</Trans>
                                </span>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)' }}>
                                    {upcomingDraft.name}
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)' }}>
                                <Calendar size={16} />
                                <span>
                                    {new Date(upcomingDraft.startDate).toLocaleDateString(dateLocale)} — {new Date(upcomingDraft.endDate).toLocaleDateString(dateLocale)}
                                </span>
                            </div>
                            {(() => {
                                const pricing = getPricingTier(upcomingDraft.startDate);
                                return (
                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                                        {pricing.all.map((tier) => (
                                            <div key={tier.label} style={{
                                                flex: 1, textAlign: 'center', padding: 'var(--spacing-sm)',
                                                borderRadius: 'var(--radius-sm)',
                                                background: tier.isCurrent ? 'rgba(51, 190, 204, 0.12)' : 'transparent',
                                                border: tier.isCurrent ? '1px solid var(--color-accent)' : '1px solid var(--border-color)',
                                                opacity: tier.isCurrent ? 1 : 0.6,
                                            }}>
                                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                                                    {tier.label}
                                                </div>
                                                <div style={{ fontWeight: 600, color: tier.isCurrent ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                                                    {tier.price} ₪
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                            <button className="btn btn-primary btn-full" onClick={handleEnroll} disabled={isEnrolling}>
                                <UserPlus size={18} />
                                {isEnrolling ? <Trans>Записываемся...</Trans> : <Trans>Записаться</Trans>}
                            </button>
                        </div>
                    )}

                    {enrollment === null && !upcomingDraft && upcomingDraft !== undefined && (
                        <div className="card animate-fade-in section-warm" style={{ background: 'var(--bg-warm)' }}>
                            <span className="points-badge">
                                <Trans>{profile.totalPoints} баллов</Trans>
                            </span>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)' }}>
                                <Trans>Нет активных сезонов. Скоро объявим новый!</Trans>
                            </p>
                        </div>
                    )}
                </>
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
