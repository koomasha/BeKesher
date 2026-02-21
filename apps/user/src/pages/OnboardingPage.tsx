import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { Logo } from '../components/Logo';
import { Trans, t } from '@lingui/macro';
import './OnboardingPage.css';

interface LocationState {
    editMode?: boolean;
}

interface FormData {
    // Step 1: Personal Info
    name: string;
    phone: string;
    city: string;
    birthDate: string;
    gender: string;

    // Step 2: About Me
    aboutMe: string;
    profession: string;

    // Step 3: Purpose
    purpose: string;

    // Step 4: Expectations
    expectations: string;

    email: string;
    socialMediaConsent: boolean;
}

interface FormErrors {
    [key: string]: string;
}

function OnboardingPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const registerParticipant = useMutation(api.participants.register);
    const updateProfile = useMutation(api.participants.updateProfile);
    const { telegramUser, authArgs } = useTelegramAuth(); // Use the hook
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        phone: '',
        city: '',
        birthDate: '',
        gender: '',
        aboutMe: '',
        profession: '',
        purpose: '',
        expectations: '',
        email: '',
        socialMediaConsent: false
    });
    const [errors, setErrors] = useState<FormErrors>({});

    // Load existing profile data when editing
    useEffect(() => {
        const state = location.state as { editMode?: boolean; profileData?: FormData };
        if (state?.editMode && state?.profileData) {
            setFormData(state.profileData);
        }
    }, [location]);

    const regions = [
        t`Север`,
        t`Центр`,
        t`Юг`
    ];

    const purposes = [
        t`Найти друзей и единомышленников`,
        t`Расширить круг общения / нетворкинг`,
        t`Провести время интересно и с пользой`,
        t`Узнать себя и других с новой стороны`,
        t`И дружбу, и романтическое знакомство`
    ];

    const validatePhone = (phone: string): boolean => {
        // Israeli phone format: +972xxxxxxxxx or 05xxxxxxxx
        const regex = /^(\+972|0)(5[0-9])[0-9]{7}$/;
        return regex.test(phone.replace(/[\s-]/g, ''));
    };

    const validateStep = (step: number): boolean => {
        const newErrors: FormErrors = {};

        if (step === 1) {
            if (!formData.name.trim()) {
                newErrors.name = t`Имя обязательно`;
            }
            if (!formData.phone.trim()) {
                newErrors.phone = t`Телефон обязателен`;
            } else if (!validatePhone(formData.phone)) {
                newErrors.phone = t`Неверный формат телефона (например: 0501234567 или +972501234567)`;
            }
            if (!formData.city) {
                newErrors.city = t`Выберите регион`;
            }
            if (!formData.birthDate) {
                newErrors.birthDate = t`Дата рождения обязательна`;
            } else {
                // Calculate age from birthDate
                const today = new Date();
                const birthDate = new Date(formData.birthDate);
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();

                // Adjust age if birthday hasn't occurred this year yet
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }

                if (age < 18) {
                    newErrors.birthDate = t`Вам должно быть 18 лет или больше`;
                } else if (age > 100) {
                    newErrors.birthDate = t`Пожалуйста, проверьте правильность даты`;
                }
            }
            if (!formData.gender) {
                newErrors.gender = t`Выберите пол`;
            }
        } else if (step === 2) {
            if (!formData.aboutMe.trim()) {
                newErrors.aboutMe = t`Это поле обязательно`;
            } else if (formData.aboutMe.trim().length < 20) {
                newErrors.aboutMe = t`Минимум 20 символов`;
            }
            if (!formData.profession.trim()) {
                newErrors.profession = t`Профессия обязательна`;
            }
        } else if (step === 3) {
            if (!formData.purpose) {
                newErrors.purpose = t`Выберите цель участия`;
            }
        } else if (step === 4) {
            if (!formData.expectations.trim()) {
                newErrors.expectations = t`Это поле обязательно`;
            } else if (formData.expectations.trim().length < 20) {
                newErrors.expectations = t`Минимум 20 символов`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(currentStep + 1);
            setErrors({});
        }
    };

    const handleBack = () => {
        setCurrentStep(currentStep - 1);
        setErrors({});
    };

    const handleCancel = () => {
        navigate('/profile');
    };

    const handleFinish = async () => {
        if (validateStep(currentStep)) {
            try {
                // Map region names to English
                const regionMap: { [key: string]: 'North' | 'Center' | 'South' } = {
                    [t`Север`]: 'North',
                    [t`Центр`]: 'Center',
                    [t`Юг`]: 'South'
                };

                // Map gender names to English
                const genderMap: { [key: string]: 'Male' | 'Female' | 'Other' } = {
                    [t`Мужчина`]: 'Male',
                    [t`Женщина`]: 'Female',
                    [t`Другое`]: 'Other'
                };

                const isEditing = (location.state as LocationState)?.editMode;

                if (isEditing) {
                    await updateProfile({
                        ...authArgs, // Pass authentication arguments
                        name: formData.name,
                        phone: formData.phone,
                        birthDate: formData.birthDate,
                        gender: genderMap[formData.gender] || 'Male',
                        region: regionMap[formData.city] || 'Center',
                        aboutMe: formData.aboutMe,
                        profession: formData.profession,
                        purpose: formData.purpose,
                        expectations: formData.expectations,
                        email: formData.email,
                        socialMediaConsent: formData.socialMediaConsent,
                    });

                    // Update localStorage
                    localStorage.setItem('userProfile', JSON.stringify(formData));

                    navigate('/profile');
                    return;
                }

                // Get Telegram user data from hook
                const telegramId = telegramUser?.id?.toString() || '';

                if (!telegramId) {
                    alert(t`Ошибка: не удалось получить Telegram ID. Откройте приложение из Telegram.`);
                    return;
                }

                // Register participant in Convex
                await registerParticipant({
                    name: formData.name,
                    phone: formData.phone,
                    telegramId: telegramId,
                    tgFirstName: telegramUser?.first_name,
                    tgLastName: telegramUser?.last_name,
                    tgUsername: telegramUser?.username,
                    birthDate: formData.birthDate,
                    gender: genderMap[formData.gender] || 'Male',
                    region: regionMap[formData.city] || 'Center',
                    aboutMe: formData.aboutMe,
                    profession: formData.profession,
                    purpose: formData.purpose,
                    expectations: formData.expectations,
                    email: formData.email,
                    socialMediaConsent: formData.socialMediaConsent,
                });

                // Also save to localStorage for ProfilePage compatibility
                localStorage.setItem('userProfile', JSON.stringify(formData));

                navigate('/');
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);

                if (errorMessage.includes("already exists")) {
                    alert(t`Пользователь с таким Telegram ID уже зарегистрирован.`);
                    navigate('/');
                } else {
                    alert(t`Ошибка: ${errorMessage}`);
                }
            }
        }
    };

    const handleInputChange = (field: keyof FormData, value: string | boolean) => {
        setFormData({ ...formData, [field]: value });
    };

    const renderProgressBar = () => {
        const progress = (currentStep / 4) * 100;
        return (
            <div className="progress-container">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="progress-text"><Trans>Шаг {currentStep} из 4</Trans></div>
            </div>
        );
    };

    const renderStep1 = () => (
        <div className="step-content">
            <div className="step-header">
                <h2 className="step-title"><Trans>Личные данные</Trans></h2>
                <Logo size={56} />
            </div>

            <div className="form-group">
                <label className="form-label"><Trans>Имя *</Trans></label>
                <input
                    type="text"
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder={t`Введите ваше имя`}
                />
                {errors.name && <div className="error-text">{errors.name}</div>}
            </div>

            <div className="form-group">
                <label className="form-label"><Trans>Телефон *</Trans></label>
                <input
                    type="tel"
                    className={`form-input ${errors.phone ? 'error' : ''}`}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="0501234567"
                />
                {errors.phone && <div className="error-text">{errors.phone}</div>}
            </div>

            <div className="form-group">
                <label className="form-label"><Trans>Email (опционально)</Trans></label>
                <input
                    type="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={t`example@email.com`}
                />
                {errors.email && <div className="error-text">{errors.email}</div>}
            </div>

            <div className="form-group">
                <label className="form-label"><Trans>Регион *</Trans></label>
                <select
                    className={`form-input ${errors.city ? 'error' : ''}`}
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                >
                    <option value="">{t`Выберите регион`}</option>
                    {regions.map(region => (
                        <option key={region} value={region}>{region}</option>
                    ))}
                </select>
                {errors.city && <div className="error-text">{errors.city}</div>}
            </div>

            <div className="form-group">
                <label className="form-label"><Trans>Дата рождения *</Trans></label>
                <input
                    type="date"
                    className={`form-input ${errors.birthDate ? 'error' : ''}`}
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                />
                {errors.birthDate && <div className="error-text">{errors.birthDate}</div>}
            </div>

            <div className="form-group">
                <label className="form-label"><Trans>Пол *</Trans></label>
                <div className="radio-group">
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="gender"
                            value={t`Мужчина`}
                            checked={formData.gender === t`Мужчина`}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                        />
                        <span><Trans>Мужчина</Trans></span>
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="gender"
                            value={t`Женщина`}
                            checked={formData.gender === t`Женщина`}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                        />
                        <span><Trans>Женщина</Trans></span>
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="gender"
                            value={t`Другое`}
                            checked={formData.gender === t`Другое`}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                        />
                        <span><Trans>Другое</Trans></span>
                    </label>
                </div>
                {errors.gender && <div className="error-text">{errors.gender}</div>}
            </div>

            <div className="form-group">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={formData.socialMediaConsent}
                        onChange={(e) => handleInputChange('socialMediaConsent', e.target.checked)}
                    />
                    <span>
                        <Trans>Согласен(а) на использование фото и видео с моим участием для публикаций и продвижения игры Tuk-Tuk</Trans>
                    </span>
                </label>
                <p className="form-hint">
                    <Trans>Вы можете изменить это в любое время в настройках профиля</Trans>
                </p>
            </div>

            <p className="form-hint" style={{ marginTop: 'var(--spacing-md)' }}>
                <Trans>Регистрируясь, вы соглашаетесь с</Trans>{' '}
                <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="privacy-link">
                    <Trans>Политикой конфиденциальности</Trans>
                </a>{' '}
                <Trans>и</Trans>{' '}
                <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="privacy-link">
                    <Trans>Условиями использования</Trans>
                </a>
            </p>
        </div>
    );

    const renderStep2 = () => (
        <div className="step-content">
            <div className="step-header">
                <h2 className="step-title"><Trans>О себе</Trans></h2>
                <Logo size={56} />
            </div>

            <div className="form-group">
                <label className="form-label"><Trans>Напиши о себе *</Trans></label>
                <textarea
                    className={`form-textarea ${errors.aboutMe ? 'error' : ''}`}
                    value={formData.aboutMe}
                    onChange={(e) => handleInputChange('aboutMe', e.target.value)}
                    placeholder={t`Никто не знает обо мне, что...`}
                    rows={5}
                />
                <div className="char-count">
                    <Trans>{formData.aboutMe.length} / минимум 20 символов</Trans>
                </div>
                {errors.aboutMe && <div className="error-text">{errors.aboutMe}</div>}
            </div>

            <div className="form-group">
                <label className="form-label"><Trans>Профессия/сфера деятельности *</Trans></label>
                <textarea
                    className={`form-textarea ${errors.profession ? 'error' : ''}`}
                    value={formData.profession}
                    onChange={(e) => handleInputChange('profession', e.target.value)}
                    placeholder={t`Например: Разработчик, Дизайнер, Учитель`}
                    rows={5}
                />
                {errors.profession && <div className="error-text">{errors.profession}</div>}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="step-content">
            <div className="step-header">
                <h2 className="step-title"><Trans>Цель участия</Trans></h2>
                <Logo size={56} />
            </div>

            <div className="form-group">
                <label className="form-label"><Trans>Зачем ты пришёл(а) в игру? *</Trans></label>
                <div className="radio-group-vertical">
                    {purposes.map(purpose => (
                        <label key={purpose} className="radio-label-block">
                            <input
                                type="radio"
                                name="purpose"
                                value={purpose}
                                checked={formData.purpose === purpose}
                                onChange={(e) => handleInputChange('purpose', e.target.value)}
                            />
                            <span>{purpose}</span>
                        </label>
                    ))}
                </div>
                {errors.purpose && <div className="error-text">{errors.purpose}</div>}
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="step-content">
            <div className="step-header">
                <h2 className="step-title"><Trans>Ожидания</Trans></h2>
                <Logo size={56} />
            </div>

            <div className="form-group">
                <label className="form-label"><Trans>Каких людей хочешь встретить, что важно, ожидания *</Trans></label>
                <textarea
                    className={`form-textarea ${errors.expectations ? 'error' : ''}`}
                    value={formData.expectations}
                    onChange={(e) => handleInputChange('expectations', e.target.value)}
                    placeholder={t`Опишите ваши ожидания от встреч...`}
                    rows={6}
                />
                <div className="char-count">
                    <Trans>{formData.expectations.length} / минимум 20 символов</Trans>
                </div>
                {errors.expectations && <div className="error-text">{errors.expectations}</div>}
            </div>
        </div>
    );

    return (
        <div className="onboarding-page">
            <div className="onboarding-container">
                {renderProgressBar()}

                <div className="form-container">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}
                </div>

                <div className="navigation-buttons">
                    {(location.state as LocationState)?.editMode && (
                        <button
                            className="btn btn-secondary"
                            onClick={handleCancel}
                            style={{ marginRight: 'auto' }}
                        >
                            <Trans>Отмена</Trans>
                        </button>
                    )}

                    {currentStep > 1 && (
                        <button
                            className="btn btn-secondary"
                            onClick={handleBack}
                        >
                            <Trans>Назад</Trans>
                        </button>
                    )}

                    {currentStep < 4 ? (
                        <button
                            className="btn btn-primary"
                            onClick={handleNext}
                        >
                            <Trans>Далее</Trans>
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary"
                            onClick={handleFinish}
                        >
                            {(location.state as LocationState)?.editMode ? <Trans>Сохранить</Trans> : <Trans>Завершить</Trans>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OnboardingPage;
