import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import './ProfilePage.css';
import logo from '../assets/logo.png';

function ProfilePage() {
    const navigate = useNavigate();

    // Get Telegram user ID
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const telegramId = telegramUser?.id?.toString() || '';

    // Fetch user profile from Convex
    const profile = useQuery(
        api.participants.getMyProfile,
        telegramId ? { telegramId } : 'skip'
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

    // Map English region names to Russian
    const regionMap: { [key: string]: string } = {
        'North': 'Север',
        'Center': 'Центр',
        'South': 'Юг'
    };

    // Loading state
    if (profile === undefined && telegramId) {
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

    // No profile state
    if (!profile || !telegramId) {
        return (
            <div className="profile-page">
                <div className="profile-container">
                    <div className="empty-state">
                        <img src={logo} alt="BeKesher" className="empty-logo" />
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

    // Calculate age from birthDate if available, otherwise use age field
    const displayAge = profile.birthDate ? calculateAge(profile.birthDate) : profile.age;

    // Parse whoToMeet into purpose and expectations
    const [purpose, expectations] = profile.whoToMeet?.split('\n\n') || ['', ''];

    return (
        <div className="profile-page">
            <div className="profile-container">
                {/* Header with Logo */}
                <div className="profile-header">
                    <div>
                        <h1>Мой профиль</h1>
                        <p className="profile-subtitle">BeKesher</p>
                    </div>
                    <img src={logo} alt="BeKesher" className="header-logo" />
                </div>

                {/* Main Info Section */}
                <div className="profile-card">
                    <div className="card-header">
                        <span className="section-icon">📋</span>
                        <h2 className="section-title">Основная информация</h2>
                    </div>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Имя</span>
                            <span className="info-value">{profile.name}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Телефон</span>
                            <span className="info-value">{profile.phone}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Дата рождения</span>
                            <span className="info-value">
                                {profile.birthDate ? new Date(profile.birthDate).toLocaleDateString('ru-RU') : '—'}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Возраст</span>
                            <span className="info-value">{displayAge} лет</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Знак зодиака</span>
                            <span className="info-value">{profile.zodiacSign || '—'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Регион</span>
                            <span className="info-value">{regionMap[profile.region] || profile.region}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Пол</span>
                            <span className="info-value">{profile.gender}</span>
                        </div>
                    </div>
                </div>

                {/* About Me Section */}
                <div className="profile-card">
                    <div className="card-header">
                        <span className="section-icon">💼</span>
                        <h2 className="section-title">О себе</h2>
                    </div>
                    <div className="about-content">
                        <div className="about-item">
                            <span className="info-label">Профессия/сфера деятельности</span>
                            <p className="about-text">{profile.profession || '—'}</p>
                        </div>
                        <div className="about-item">
                            <span className="info-label">О себе</span>
                            <p className="about-text">{profile.aboutMe || '—'}</p>
                        </div>
                    </div>
                </div>

                {/* Goals and Expectations Section */}
                <div className="profile-card">
                    <div className="card-header">
                        <span className="section-icon">🎯</span>
                        <h2 className="section-title">Цели и ожидания</h2>
                    </div>
                    <div className="about-content">
                        <div className="about-item">
                            <span className="info-label">Зачем пришёл(а) в игру</span>
                            <p className="about-text">{purpose || '—'}</p>
                        </div>
                        <div className="about-item">
                            <span className="info-label">Каких людей хочу встретить</span>
                            <p className="about-text">{expectations || '—'}</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <button
                    className="btn btn-primary btn-edit"
                    onClick={() => navigate('/onboarding')}
                >
                    ✏️ Редактировать профиль
                </button>

                <button
                    className="btn btn-secondary btn-home"
                    onClick={() => navigate('/')}
                >
                    🏠 Назад в Главное меню
                </button>
            </div>
        </div>
    );
}

export default ProfilePage;
