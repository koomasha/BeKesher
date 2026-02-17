import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAction, useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import './PaymentPage.css';
import { Logo } from '../components/Logo';
import { useTelegramAuth } from '../hooks/useTelegramAuth';

function PaymentPage() {
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { authArgs, isAuthenticated } = useTelegramAuth();

    // Fetch user profile
    const profile = useQuery(
        api.participants.getMyProfile,
        isAuthenticated ? authArgs : 'skip'
    );

    // Fetch payment amount
    const paymentAmount = useQuery(api.payments.getPaymentAmount) ?? 100;

    // Payment action
    const createPaymentLink = useAction(api.payments.createPaymentLink);

    const handlePayment = async () => {
        if (!isAuthenticated) {
            setError('Откройте приложение из Telegram');
            return;
        }

        if (!profile) {
            setError('Профиль не найден. Пожалуйста, заполните анкету.');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const result = await createPaymentLink({
                ...authArgs,
                amount: paymentAmount,
                months: 1,
            });

            if (result.success && result.paymentUrl) {
                // Redirect to PayPlus payment page
                window.location.href = result.paymentUrl;
            } else {
                setError(result.error || 'Не удалось создать ссылку для оплаты');
                setIsProcessing(false);
            }
        } catch (err) {
            console.error('Payment error:', err);
            setError('Произошла ошибка при создании платежа');
            setIsProcessing(false);
        }
    };

    // Loading state
    if (profile === undefined && isAuthenticated) {
        return (
            <div className="payment-page">
                <div className="payment-container">
                    <div className="empty-state">
                        <div className="spinner"></div>
                        <p>Загрузка...</p>
                    </div>
                </div>
            </div>
        );
    }

    // No profile state
    if (!profile || !isAuthenticated) {
        return (
            <div className="payment-page">
                <div className="payment-container">
                    <div className="empty-state">
                        <Logo size={96} className="empty-logo" />
                        <h2>Профиль не найден</h2>
                        <p>Пожалуйста, сначала заполните анкету</p>
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
        <div className="payment-page">
            <div className="payment-container">
                {/* Header */}
                <div className="payment-header">
                    <Logo size={80} className="payment-logo" />
                    <h1>Подписка BeKesher</h1>
                    <p className="payment-subtitle">Присоединяйтесь к нашему сообществу</p>
                </div>

                {/* Pricing Card */}
                <div className="pricing-card">
                    <div className="price-section">
                        <div className="price">{paymentAmount} ₪</div>
                        <div className="price-period">/ месяц</div>
                    </div>
                </div>

                {/* Benefits */}
                <div className="benefits-card">
                    <h2>Что входит в подписку:</h2>
                    <ul className="benefits-list">
                        <li className="benefit-item">
                            <span className="benefit-icon">✅</span>
                            <span className="benefit-text">Участие в еженедельных играх</span>
                        </li>
                        <li className="benefit-item">
                            <span className="benefit-icon">✅</span>
                            <span className="benefit-text">Новые знакомства</span>
                        </li>
                        <li className="benefit-item">
                            <span className="benefit-icon">✅</span>
                            <span className="benefit-text">Доступ к группам</span>
                        </li>
                        <li className="benefit-item">
                            <span className="benefit-icon">✅</span>
                            <span className="benefit-text">Поддержка 24/7</span>
                        </li>
                    </ul>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Payment Button */}
                <button
                    className="btn btn-payment"
                    onClick={handlePayment}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <>
                            <div className="spinner-small"></div>
                            <span>Создаем платеж...</span>
                        </>
                    ) : (
                        <span>Оплатить {paymentAmount} ₪</span>
                    )}
                </button>

                {/* Back Button */}
                <button
                    className="btn btn-secondary btn-back"
                    onClick={() => navigate('/profile')}
                    disabled={isProcessing}
                >
                    Назад в профиль
                </button>
            </div>
        </div>
    );
}

export default PaymentPage;
