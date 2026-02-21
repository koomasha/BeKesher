import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAction, useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import './PaymentPage.css';
import { Logo } from '../components/Logo';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { Trans, t } from '@lingui/macro';

function PaymentPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [waitingForPayment, setWaitingForPayment] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { authArgs, isAuthenticated } = useTelegramAuth();

    // Get season info from route state (passed from HomePage)
    const seasonId = location.state?.seasonId as string | undefined;
    const seasonName = location.state?.seasonName as string | undefined;
    const paymentAmount = (location.state?.price as number) || 100;
    const tierLabel = location.state?.tierLabel as string | undefined;

    // Fetch user profile
    const profile = useQuery(
        api.participants.getMyProfile,
        isAuthenticated ? authArgs : 'skip'
    );

    // Subscribe to enrollment status — auto-updates when webhook processes payment
    const enrollment = useQuery(
        api.seasonParticipants.getMyEnrollment,
        isAuthenticated ? authArgs : 'skip'
    );

    // Payment action
    const createPaymentLink = useAction(api.payments.createPaymentLink);

    // Auto-redirect to home when enrollment is detected after payment
    useEffect(() => {
        if (waitingForPayment && enrollment) {
            navigate('/', { replace: true });
        }
    }, [waitingForPayment, enrollment, navigate]);

    const handlePayment = async () => {
        if (!isAuthenticated) {
            setError(t`Откройте приложение из Telegram`);
            return;
        }

        if (!profile) {
            setError(t`Профиль не найден. Пожалуйста, заполните анкету.`);
            return;
        }

        if (!seasonId) {
            setError(t`Сезон не выбран. Вернитесь на главную.`);
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const result = await createPaymentLink({
                ...authArgs,
                amount: paymentAmount,
                months: 1,
                seasonId,
                returnUrl: window.location.origin,
            });

            if (result.success && result.paymentUrl) {
                // Open PayPlus in external browser, stay in mini app
                if (window.Telegram?.WebApp?.openLink) {
                    window.Telegram.WebApp.openLink(result.paymentUrl);
                } else {
                    window.open(result.paymentUrl, '_blank');
                }
                setIsProcessing(false);
                setWaitingForPayment(true);
            } else {
                setError(result.error || t`Не удалось создать ссылку для оплаты`);
                setIsProcessing(false);
            }
        } catch (err) {
            console.error('Payment error:', err);
            setError(t`Произошла ошибка при создании платежа`);
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
                        <p><Trans>Загрузка...</Trans></p>
                    </div>
                </div>
            </div>
        );
    }

    // No profile or no season state
    if (!profile || !isAuthenticated || !seasonId) {
        return (
            <div className="payment-page">
                <div className="payment-container">
                    <div className="empty-state">
                        <Logo size={80} className="empty-logo" />
                        <h2>{!seasonId ? t`Сезон не выбран` : t`Профиль не найден`}</h2>
                        <p>{!seasonId ? t`Вернитесь на главную и выберите сезон` : t`Пожалуйста, сначала заполните анкету`}</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate(!seasonId ? '/' : '/onboarding')}
                        >
                            {!seasonId ? t`На главную` : t`Заполнить анкету`}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Waiting for payment confirmation
    if (waitingForPayment) {
        return (
            <div className="payment-page">
                <div className="payment-container">
                    <div className="payment-header">
                        <Logo size={80} className="payment-logo" />
                        <h1><Trans>Ожидаем оплату</Trans></h1>
                        <p className="payment-subtitle"><Trans>Завершите оплату в открывшемся окне</Trans></p>
                    </div>
                    <div className="payment-waiting-card">
                        <div className="spinner"></div>
                        <p className="payment-waiting-text">
                            <Trans>После оплаты вы будете автоматически записаны в сезон</Trans>
                        </p>
                    </div>
                    <button
                        className="btn btn-secondary btn-back"
                        onClick={() => navigate('/')}
                    >
                        <Trans>Назад</Trans>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-page">
            <div className="payment-container">
                <div className="payment-header">
                    <Logo size={80} className="payment-logo" />
                    <h1><Trans>Оплата сезона</Trans></h1>
                    {seasonName && <p className="payment-subtitle">{seasonName}</p>}
                </div>

                <div className="payment-card">
                    <div className="payment-price-row">
                        <div className="payment-price-left">
                            <span className="payment-price-amount">{paymentAmount}</span>
                            <span className="payment-price-currency">₪</span>
                        </div>
                        {tierLabel && <span className="payment-price-tier">{tierLabel}</span>}
                    </div>
                    <div className="payment-benefits">
                        <div className="payment-benefits-item">
                            <div className="payment-benefits-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            </div>
                            <span className="payment-benefits-text"><Trans>4 недели встреч</Trans></span>
                        </div>
                        <div className="payment-benefits-item">
                            <div className="payment-benefits-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            </div>
                            <span className="payment-benefits-text"><Trans>Новые знакомства каждую неделю</Trans></span>
                        </div>
                        <div className="payment-benefits-item">
                            <div className="payment-benefits-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            </div>
                            <span className="payment-benefits-text"><Trans>Группы и задания</Trans></span>
                        </div>
                        <div className="payment-benefits-item">
                            <div className="payment-benefits-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            </div>
                            <span className="payment-benefits-text"><Trans>Поддержка 24/7</Trans></span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="payment-error">
                        <span>{error}</span>
                    </div>
                )}

                <button
                    className="btn btn-payment"
                    onClick={handlePayment}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <>
                            <div className="spinner-small"></div>
                            <span><Trans>Создаем платеж...</Trans></span>
                        </>
                    ) : (
                        <span><Trans>Оплатить {paymentAmount} ₪</Trans></span>
                    )}
                </button>

                <button
                    className="btn btn-secondary btn-back"
                    onClick={() => navigate('/')}
                    disabled={isProcessing}
                >
                    <Trans>Назад</Trans>
                </button>
            </div>
        </div>
    );
}

export default PaymentPage;
