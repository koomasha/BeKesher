import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import './ProfilePage.css';
import { Logo } from '../components/Logo';
import { CollapsibleProfileCard } from '../components/CollapsibleProfileCard';
import { Trans, t } from '@lingui/macro';
import { calculateAge } from '../utils/dateUtils';

import { useTelegramAuth } from '../hooks/useTelegramAuth';

function ProfilePage() {
    const navigate = useNavigate();
    const { authArgs, isAuthenticated } = useTelegramAuth();

    // Fetch user profile from Convex
    const profile = useQuery(
        api.participants.getMyProfile,
        isAuthenticated ? authArgs : 'skip'
    );

    const getZodiacSign = (birthDate: string): string => {
        const date = new Date(birthDate);
        const month = date.getMonth() + 1; // 1-12
        const day = date.getDate();

        if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return t`Овен`;
        if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return t`Телец`;
        if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return t`Близнецы`;
        if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return t`Рак`;
        if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return t`Лев`;
        if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return t`Дева`;
        if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return t`Весы`;
        if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return t`Скорпион`;
        if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return t`Стрелец`;
        if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return t`Козерог`;
        if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return t`Водолей`;
        if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return t`Рыбы`;

        return '';
    };

    // Map English region names to Russian
    const regionMap: { [key: string]: string } = {
        'North': t`Север`,
        'Center': t`Центр`,
        'South': t`Юг`
    };

    // Loading state
    if (profile === undefined && isAuthenticated) {
        return (
            <div className="profile-page">
                <div className="profile-container">
                    <div className="empty-state">
                        <div className="spinner"></div>
                        <p><Trans>Загрузка профиля...</Trans></p>
                    </div>
                </div>
            </div>
        );
    }

    // Not authenticated state
    if (!isAuthenticated) {
        return (
            <div className="profile-page">
                <div className="profile-container">
                    <div className="empty-state">
                        <Logo size={96} className="empty-logo" />
                        <h2><Trans>Требуется авторизация</Trans></h2>
                        <p><Trans>Пожалуйста, откройте приложение через Telegram</Trans></p>
                    </div>
                </div>
            </div>
        );
    }

    // No profile state
    if (!profile) {
        return (
            <div className="profile-page">
                <div className="profile-container">
                    <div className="empty-state">
                        <Logo size={96} className="empty-logo" />
                        <h2><Trans>Профиль не заполнен</Trans></h2>
                        <p><Trans>Пожалуйста, заполните анкету для создания профиля</Trans></p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/onboarding')}
                        >
                            <Trans>Заполнить анкету</Trans>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate age from birthDate
    const displayAge = profile ? calculateAge(profile.birthDate) : 0;

    // Check subscription status
    const now = Date.now();
    const isSubscriptionActive = profile.paidUntil && profile.paidUntil > now;
    const subscriptionEndDate = profile.paidUntil
        ? new Date(profile.paidUntil).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          })
        : null;

    return (
        <div className="profile-page">
            <div className="profile-container">
                {/* Header with Logo */}
                <div className="profile-header">
                    <div>
                        <h1><Trans>Мой профиль</Trans></h1>
                        <p className="profile-subtitle">Tuk-Tuk</p>
                    </div>
                    <Logo size={64} />
                </div>

                {/* Subscription Status Section */}
                <div className="profile-card subscription-card">
                    <div className="card-header">
                        <span className="section-icon">💳</span>
                        <h2 className="section-title">Подписка</h2>
                    </div>
                    {isSubscriptionActive ? (
                        <div className="subscription-active">
                            <div className="subscription-status">
                                <span className="status-icon">✅</span>
                                <span className="status-text">Подписка активна</span>
                            </div>
                            <p className="subscription-date">
                                Действительна до: <strong>{subscriptionEndDate}</strong>
                            </p>
                        </div>
                    ) : (
                        <div className="subscription-inactive">
                            <p className="subscription-message">
                                {profile.paidUntil
                                    ? '⚠️ Ваша подписка истекла'
                                    : 'Оформите подписку для участия в играх'}
                            </p>
                            <button
                                className="btn btn-primary btn-subscription"
                                onClick={() => navigate('/payment')}
                            >
                                💳 Оплатить подписку
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Info Section */}
                <CollapsibleProfileCard
                    title={t`Основная информация`}
                    icon={
                        <div className="section-icon-circle section-icon-teal">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" /></svg>
                        </div>
                    }
                >
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label"><Trans>Имя</Trans></span>
                            <span className="info-value">{profile?.name}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label"><Trans>Телефон</Trans></span>
                            <span className="info-value">{profile?.phone}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label"><Trans>Дата рождения</Trans></span>
                            <span className="info-value">
                                {profile?.birthDate ? new Date(profile.birthDate).toLocaleDateString('ru-RU') : '\u2014'}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label"><Trans>Возраст</Trans></span>
                            <span className="info-value"><Trans>{displayAge} лет</Trans></span>
                        </div>
                        <div className="info-item">
                            <span className="info-label"><Trans>Знак зодиака</Trans></span>
                            <span className="info-value">{profile?.birthDate ? getZodiacSign(profile.birthDate) : '\u2014'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label"><Trans>Регион</Trans></span>
                            <span className="info-value">{profile?.region ? (regionMap[profile.region] || profile.region) : '\u2014'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label"><Trans>Пол</Trans></span>
                            <span className="info-value">{profile?.gender}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label"><Trans>Email</Trans></span>
                            <span className="info-value">{profile?.email || '\u2014'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label"><Trans>Согласие на публикацию фото</Trans></span>
                            <span className="info-value">
                                {profile?.socialMediaConsent ?
                                    <Trans>Разрешено</Trans> :
                                    <Trans>Не разрешено</Trans>
                                }
                            </span>
                        </div>
                    </div>
                </CollapsibleProfileCard>

                {/* About Me Section */}
                <CollapsibleProfileCard
                    title={t`О себе`}
                    icon={
                        <div className="section-icon-circle section-icon-coral">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M16 7V5a4 4 0 00-8 0v2" stroke="currentColor" strokeWidth="2" /></svg>
                        </div>
                    }
                >
                    <div className="about-content">
                        <div className="about-item">
                            <span className="info-label"><Trans>Профессия/сфера деятельности</Trans></span>
                            <p className="about-text">{profile?.profession || '\u2014'}</p>
                        </div>
                        <div className="about-item">
                            <span className="info-label"><Trans>О себе</Trans></span>
                            <p className="about-text">{profile?.aboutMe || '\u2014'}</p>
                        </div>
                    </div>
                </CollapsibleProfileCard>

                {/* Goals and Expectations Section */}
                <CollapsibleProfileCard
                    title={t`Цели и ожидания`}
                    icon={
                        <div className="section-icon-circle section-icon-highlight">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="2" fill="currentColor" /></svg>
                        </div>
                    }
                >
                    <div className="about-content">
                        <div className="about-item">
                            <span className="info-label"><Trans>Зачем пришёл(а) в игру</Trans></span>
                            <p className="about-text">{profile?.purpose || '\u2014'}</p>
                        </div>
                        <div className="about-item">
                            <span className="info-label"><Trans>Каких людей хочу встретить</Trans></span>
                            <p className="about-text">{profile?.expectations || '\u2014'}</p>
                        </div>
                    </div>
                </CollapsibleProfileCard>

                {/* Action Buttons */}
                <button
                    className="btn btn-primary btn-edit"
                    onClick={() => navigate('/onboarding', {
                        state: {
                            editMode: true,
                            profileData: {
                                name: profile?.name || '',
                                phone: profile?.phone || '',
                                city: profile?.region ? (regionMap[profile.region] || profile.region) : '',
                                birthDate: profile?.birthDate || '',
                                gender: profile?.gender || '',
                                aboutMe: profile?.aboutMe || '',
                                profession: profile?.profession || '',
                                purpose: profile?.purpose || '',
                                expectations: profile?.expectations || '',
                                email: profile?.email || '',
                                socialMediaConsent: profile?.socialMediaConsent ?? true,
                            }
                        }
                    })}
                >
                    <Trans>Редактировать профиль</Trans>
                </button>

                <button
                    className="btn btn-secondary btn-home"
                    onClick={() => navigate('/')}
                >
                    <Trans>Назад в Главное меню</Trans>
                </button>
            </div>
        </div>
    );
}

export default ProfilePage;
