import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Link } from 'react-router-dom';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { Logo } from '../components/Logo';
import { Trans, t } from '@lingui/macro';

function SupportPage() {
    const { authArgs, isAuthenticated } = useTelegramAuth();

    const myTickets = useQuery(
        api.support.getMyTickets,
        isAuthenticated ? authArgs : 'skip'
    );

    const createTicket = useMutation(api.support.createTicket);

    const [question, setQuestion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isAuthenticated) {
        return (
            <div className="page">
                <div className="card">
                    <div className="empty-state">
                        <p><Trans>Откройте приложение из Telegram</Trans></p>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;

        setIsSubmitting(true);
        try {
            await createTicket({
                ...authArgs,
                question: question.trim(),
            });
            setSubmitted(true);
            setQuestion('');
        } catch (error) {
            alert(t`Не удалось отправить вопрос. Попробуйте ещё раз.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page">
            <div className="page-header decorated-section">
                <Logo size={80} className="page-header-logo" />
                <h1><Trans>Поддержка</Trans></h1>
                <p><Trans>Мы рады помочь!</Trans></p>
            </div>

            {submitted && (
                <div className="card animate-fade-in" style={{ background: 'rgba(76, 175, 80, 0.08)', borderColor: 'var(--accent-success)' }}>
                    <p style={{ textAlign: 'center', color: 'var(--accent-success)', fontWeight: 500 }}>
                        <Trans>Твой вопрос отправлен. Мы скоро ответим!</Trans>
                    </p>
                </div>
            )}

            <div className="card animate-fade-in">
                <span className="card-title"><Trans>Задай вопрос</Trans></span>
                <form onSubmit={handleSubmit} style={{ marginTop: 'var(--spacing-md)' }}>
                    <div className="input-group">
                        <textarea
                            className="input"
                            rows={4}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder={t`Чем мы можем помочь?`}
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={!question.trim() || isSubmitting}
                    >
                        {isSubmitting ? t`Отправка...` : t`Отправить вопрос`}
                    </button>
                </form>
            </div>

            {myTickets && myTickets.length > 0 && (
                <div className="card animate-fade-in" style={{ background: 'var(--bg-alt)' }}>
                    <span className="card-title"><Trans>Твои вопросы</Trans></span>
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                        {myTickets.map((ticket) => (
                            <div
                                key={ticket._id}
                                style={{
                                    padding: 'var(--spacing-md)',
                                    borderBottom: '1px solid var(--border-color)',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' }}>
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                        {new Date(ticket.createdAt).toLocaleDateString('ru-RU')}
                                    </span>
                                    <span className={`badge badge-${ticket.status === 'Open' ? 'pending' : ticket.status === 'Answered' ? 'active' : 'inactive'}`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <p style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)', color: 'var(--text-primary)' }}>
                                    {ticket.question}
                                </p>
                                {ticket.answer && (
                                    <div className="ticket-answer">
                                        <div className="ticket-answer-label"><Trans>Ответ:</Trans></div>
                                        <p style={{ fontSize: 'var(--font-size-sm)', margin: 0, color: 'var(--text-primary)' }}>
                                            {ticket.answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Link to="/" className="btn btn-secondary btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                <Trans>На главную</Trans>
            </Link>
        </div>
    );
}

export default SupportPage;
