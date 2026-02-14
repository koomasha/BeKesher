import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';
import logo from '../assets/logo.png';

interface UserProfile {
    name: string;
    phone: string;
    city: string;
    age: string;
    gender: string;
    aboutMe: string;
    profession: string;
    purpose: string;
    expectations: string;
}

function ProfilePage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
            setProfile(JSON.parse(savedProfile));
        }
    }, []);

    if (!profile) {
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
                            <span className="info-label">Регион</span>
                            <span className="info-value">{profile.city}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Возраст</span>
                            <span className="info-value">{profile.age} лет</span>
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
                        <span className="section-icon">💬</span>
                        <h2 className="section-title">О себе</h2>
                    </div>
                    <div className="about-content">
                        <div className="about-item">
                            <span className="info-label">Профессия</span>
                            <p className="about-text">{profile.profession}</p>
                        </div>
                        <div className="about-item">
                            <span className="info-label">О себе</span>
                            <p className="about-text">{profile.aboutMe}</p>
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
                            <span className="info-label">Зачем пришёл в игру</span>
                            <p className="about-text">{profile.purpose}</p>
                        </div>
                        <div className="about-item">
                            <span className="info-label">Ожидания от людей</span>
                            <p className="about-text">{profile.expectations}</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <button
                    className="btn btn-primary btn-edit"
                    onClick={() => navigate('/onboarding', { state: { editMode: true, profileData: profile } })}
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
