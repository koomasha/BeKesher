import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import './ProfilePage.css';
import { Logo } from '../components/Logo';
import { CollapsibleProfileCard } from '../components/CollapsibleProfileCard';

import { useTelegramAuth } from '../hooks/useTelegramAuth';

function ProfilePage() {
    const navigate = useNavigate();
    const { authArgs, isAuthenticated } = useTelegramAuth();

    // Fetch user profile from Convex
    const profile = useQuery(
        api.participants.getMyProfile,
        isAuthenticated ? authArgs : 'skip'
    );

    // Helper function to calculate age from birthDate
    const calculateAge = (birthDate: string): number => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    };

    const getZodiacSign = (birthDate: string): string => {
        const date = new Date(birthDate);
        const month = date.getMonth() + 1; // 1-12
        const day = date.getDate();

        if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Овен';
        if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Телец';
        if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Близнецы';
        if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Рак';
        if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Лев';
        if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Дева';
        if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Весы';
        if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Скорпион';
        if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Стрелец';
        if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Козерог';
        if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Водолей';
        if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Рыбы';

        return '';
    };

    // Map English region names to Russian
    const regionMap: { [key: string]: string } = {
        'North': 'Север',
        'Center': 'Центр',
        'South': 'Юг'
    };

    // Loading state
    if (profile === undefined && isAuthenticated) {
        return (
            <div className="profile-page">
                <div className="profile-container">
                    <div className="empty-state">
                        <div className="spinner"></div>
                        <p>Загрузка профиля...</p>
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
                        <h2>Требуется авторизация</h2>
                        <p>Пожалуйста, откройте приложение через Telegram</p>
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
                        <h2>Профиль не заполнен</h2>
                        <p>Пожалуйста, заполните анкету для создания профиля</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/onboarding')}
                        >
                            Заполнить анкету
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate age from birthDate
    const displayAge = profile ? calculateAge(profile.birthDate) : 0;

    return (
        <div className="profile-page">
            <div className="profile-container">
                {/* Header with Logo */}
                <div className="profile-header">
                    <div>
                        <h1>Мой профиль</h1>
                        <p className="profile-subtitle">BeKesher</p>
                    </div>
                    <Logo size={64} />
                </div>

                {/* Main Info Section */}
                <CollapsibleProfileCard
                    title="Основная информация"
                    icon={
                        <div className="section-icon-circle section-icon-teal">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" /></svg>
                        </div>
                    }
                >
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Имя</span>
                            <span className="info-value">{profile?.name}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Телефон</span>
                            <span className="info-value">{profile?.phone}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Дата рождения</span>
                            <span className="info-value">
                                {profile?.birthDate ? new Date(profile.birthDate).toLocaleDateString('ru-RU') : '\u2014'}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Возраст</span>
                            <span className="info-value">{displayAge} лет</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Знак зодиака</span>
                            <span className="info-value">{profile?.birthDate ? getZodiacSign(profile.birthDate) : '\u2014'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Регион</span>
                            <span className="info-value">{profile?.region ? (regionMap[profile.region] || profile.region) : '\u2014'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Пол</span>
                            <span className="info-value">{profile?.gender}</span>
                        </div>
                    </div>
                </CollapsibleProfileCard>

                {/* About Me Section */}
                <CollapsibleProfileCard
                    title="О себе"
                    icon={
                        <div className="section-icon-circle section-icon-coral">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M16 7V5a4 4 0 00-8 0v2" stroke="currentColor" strokeWidth="2" /></svg>
                        </div>
                    }
                >
                    <div className="about-content">
                        <div className="about-item">
                            <span className="info-label">Профессия/сфера деятельности</span>
                            <p className="about-text">{profile?.profession || '\u2014'}</p>
                        </div>
                        <div className="about-item">
                            <span className="info-label">О себе</span>
                            <p className="about-text">{profile?.aboutMe || '\u2014'}</p>
                        </div>
                    </div>
                </CollapsibleProfileCard>

                {/* Goals and Expectations Section */}
                <CollapsibleProfileCard
                    title="Цели и ожидания"
                    icon={
                        <div className="section-icon-circle section-icon-highlight">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="2" fill="currentColor" /></svg>
                        </div>
                    }
                >
                    <div className="about-content">
                        <div className="about-item">
                            <span className="info-label">Зачем пришёл(а) в игру</span>
                            <p className="about-text">{profile?.purpose || '\u2014'}</p>
                        </div>
                        <div className="about-item">
                            <span className="info-label">Каких людей хочу встретить</span>
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
                                expectations: profile?.expectations || ''
                            }
                        }
                    })}
                >
                    Редактировать профиль
                </button>

                <button
                    className="btn btn-secondary btn-home"
                    onClick={() => navigate('/')}
                >
                    Назад в Главное меню
                </button>
            </div>
        </div>
    );
}

export default ProfilePage;
