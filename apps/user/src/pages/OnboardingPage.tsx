import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import './OnboardingPage.css';
import logo from '../assets/logo.png';

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
}

interface FormErrors {
    [key: string]: string;
}

function OnboardingPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const registerParticipant = useMutation(api.participants.register);
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
        expectations: ''
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
        'Север',
        'Центр',
        'Юг'
    ];

    const purposes = [
        'Найти друзей и единомышленников',
        'Расширить круг общения / нетворкинг',
        'Провести время интересно и с пользой',
        'Познать себя и людей рядом',
        'И дружбу, и романтическое знакомство'
    ];

    const validatePhone = (phone: string): boolean => {
        // Israeli phone format: +972xxxxxxxxx or 05xxxxxxxx
        const regex = /^(\+972|0)(5[0-9])[0-9]{7}$/;
        return regex.test(phone.replace(/[\s-]/g, ''));
    };

    const getZodiacSign = (birthDate: string): string => {
        const date = new Date(birthDate);
        const month = date.getMonth() + 1; // 1-12
        const day = date.getDate();

        if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Овен ♈';
        if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Телец ♉';
        if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Близнецы ♊';
        if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Рак ♋';
        if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Лев ♌';
        if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Дева ♍';
        if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Весы ♎';
        if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Скорпион ♏';
        if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Стрелец ♐';
        if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Козерог ♑';
        if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Водолей ♒';
        if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Рыбы ♓';

        return '';
    };

    const validateStep = (step: number): boolean => {
        const newErrors: FormErrors = {};

        if (step === 1) {
            if (!formData.name.trim()) {
                newErrors.name = 'Имя обязательно';
            }
            if (!formData.phone.trim()) {
                newErrors.phone = 'Телефон обязателен';
            } else if (!validatePhone(formData.phone)) {
                newErrors.phone = 'Неверный формат телефона (например: 0501234567 или +972501234567)';
            }
            if (!formData.city) {
                newErrors.city = 'Выберите регион';
            }
            if (!formData.birthDate) {
                newErrors.birthDate = 'Дата рождения обязательна';
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
                    newErrors.birthDate = 'Вам должно быть 18 лет или больше';
                } else if (age > 100) {
                    newErrors.birthDate = 'Пожалуйста, проверьте правильность даты';
                }
            }
            if (!formData.gender) {
                newErrors.gender = 'Выберите пол';
            }
        } else if (step === 2) {
            if (!formData.aboutMe.trim()) {
                newErrors.aboutMe = 'Это поле обязательно';
            } else if (formData.aboutMe.trim().length < 20) {
                newErrors.aboutMe = 'Минимум 20 символов';
            }
            if (!formData.profession.trim()) {
                newErrors.profession = 'Профессия обязательна';
            }
        } else if (step === 3) {
            if (!formData.purpose) {
                newErrors.purpose = 'Выберите цель участия';
            }
        } else if (step === 4) {
            if (!formData.expectations.trim()) {
                newErrors.expectations = 'Это поле обязательно';
            } else if (formData.expectations.trim().length < 20) {
                newErrors.expectations = 'Минимум 20 символов';
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

    const handleFinish = async () => {
        if (validateStep(currentStep)) {
            try {
                // Get Telegram user data
                const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
                const telegramId = telegramUser?.id?.toString() || '';

                if (!telegramId) {
                    alert('Ошибка: не удалось получить Telegram ID. Откройте приложение из Telegram.');
                    return;
                }

                // Calculate age from birthDate
                const today = new Date();
                const birthDate = new Date(formData.birthDate);
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();

                // Adjust age if birthday hasn't occurred this year yet
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }

                // Calculate zodiac sign from birthDate
                const zodiacSign = getZodiacSign(formData.birthDate);

                // Combine purpose and expectations into whoToMeet
                const whoToMeet = `${formData.purpose}\n\n${formData.expectations}`;

                // Map region names to English
                const regionMap: { [key: string]: string } = {
                    'Север': 'North',
                    'Центр': 'Center',
                    'Юг': 'South'
                };

                // Register participant in Convex
                await registerParticipant({
                    name: formData.name,
                    phone: formData.phone,
                    telegramId: telegramId,
                    tgFirstName: telegramUser?.first_name,
                    tgLastName: telegramUser?.last_name,
                    age: age,
                    birthDate: formData.birthDate,
                    zodiacSign: zodiacSign,
                    gender: formData.gender,
                    region: regionMap[formData.city] || 'Center',
                    aboutMe: formData.aboutMe,
                    profession: formData.profession,
                    whoToMeet: whoToMeet,
                });

                // Also save to localStorage for ProfilePage compatibility
                localStorage.setItem('userProfile', JSON.stringify(formData));

                console.log('Registration successful!');
                navigate('/');
            } catch (error) {
                console.error('Registration error:', error);
                alert('Ошибка при регистрации. Попробуйте еще раз.');
            }
        }
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
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
                <div className="progress-text">Шаг {currentStep} из 4</div>
            </div>
        );
    };

    const renderStep1 = () => (
        <div className="step-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="step-title">Личные данные</h2>
                <img src={logo} alt="BeKesher" style={{ width: '72px', height: '72px' }} />
            </div>

            <div className="form-group">
                <label className="form-label">Имя *</label>
                <input
                    type="text"
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Введите ваше имя"
                />
                {errors.name && <div className="error-text">{errors.name}</div>}
            </div>

            <div className="form-group">
                <label className="form-label">Телефон *</label>
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
                <label className="form-label">Регион *</label>
                <select
                    className={`form-input ${errors.city ? 'error' : ''}`}
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                >
                    <option value="">Выберите регион</option>
                    {regions.map(region => (
                        <option key={region} value={region}>{region}</option>
                    ))}
                </select>
                {errors.city && <div className="error-text">{errors.city}</div>}
            </div>

            <div className="form-group">
                <label className="form-label">Дата рождения *</label>
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
                <label className="form-label">Пол *</label>
                <div className="radio-group">
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="gender"
                            value="Мужчина"
                            checked={formData.gender === 'Мужчина'}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                        />
                        <span>Мужчина</span>
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="gender"
                            value="Женщина"
                            checked={formData.gender === 'Женщина'}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                        />
                        <span>Женщина</span>
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="gender"
                            value="Другое"
                            checked={formData.gender === 'Другое'}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                        />
                        <span>Другое</span>
                    </label>
                </div>
                {errors.gender && <div className="error-text">{errors.gender}</div>}
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="step-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="step-title">О себе</h2>
                <img src={logo} alt="BeKesher" style={{ width: '72px', height: '72px' }} />
            </div>

            <div className="form-group">
                <label className="form-label">Напиши о себе *</label>
                <textarea
                    className={`form-textarea ${errors.aboutMe ? 'error' : ''}`}
                    value={formData.aboutMe}
                    onChange={(e) => handleInputChange('aboutMe', e.target.value)}
                    placeholder="Никто не знает обо мне, что..."
                    rows={5}
                />
                <div className="char-count">
                    {formData.aboutMe.length} / минимум 20 символов
                </div>
                {errors.aboutMe && <div className="error-text">{errors.aboutMe}</div>}
            </div>

            <div className="form-group">
                <label className="form-label">Профессия/сфера деятельности *</label>
                <textarea
                    className={`form-textarea ${errors.profession ? 'error' : ''}`}
                    value={formData.profession}
                    onChange={(e) => handleInputChange('profession', e.target.value)}
                    placeholder="Например: Разработчик, Дизайнер, Учитель"
                    rows={5}
                />
                {errors.profession && <div className="error-text">{errors.profession}</div>}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="step-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="step-title">Цель участия</h2>
                <img src={logo} alt="BeKesher" style={{ width: '72px', height: '72px' }} />
            </div>

            <div className="form-group">
                <label className="form-label">Зачем ты пришёл(а) в игру? *</label>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="step-title">Ожидания</h2>
                <img src={logo} alt="BeKesher" style={{ width: '72px', height: '72px' }} />
            </div>

            <div className="form-group">
                <label className="form-label">Каких людей хочешь встретить, что важно, ожидания *</label>
                <textarea
                    className={`form-textarea ${errors.expectations ? 'error' : ''}`}
                    value={formData.expectations}
                    onChange={(e) => handleInputChange('expectations', e.target.value)}
                    placeholder="Опишите ваши ожидания от встреч..."
                    rows={6}
                />
                <div className="char-count">
                    {formData.expectations.length} / минимум 20 символов
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
                    {currentStep > 1 && (
                        <button
                            className="btn btn-secondary"
                            onClick={handleBack}
                        >
                            Назад
                        </button>
                    )}

                    {currentStep < 4 ? (
                        <button
                            className="btn btn-primary"
                            onClick={handleNext}
                        >
                            Далее
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary"
                            onClick={handleFinish}
                        >
                            Завершить
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OnboardingPage;
