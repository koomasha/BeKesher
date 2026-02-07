import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Link } from 'react-router-dom';

function SupportPage() {
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const telegramId = telegramUser?.id?.toString() || '';

    const myTickets = useQuery(
        api.support.getMyTickets,
        telegramId ? { telegramId } : 'skip'
    );

    const createTicket = useMutation(api.support.createTicket);

    const [question, setQuestion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!telegramId) {
        return (
            <div className="page">
                <div className="card">
                    <div className="empty-state">
                        <div className="icon">📱</div>
                        <p>Open this app from Telegram</p>
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
                telegramId,
                question: question.trim(),
            });
            setSubmitted(true);
            setQuestion('');
        } catch (error) {
            console.error('Failed to submit question:', error);
            alert('Failed to submit question. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page">
            <header className="header">
                <h1>💬 Support</h1>
                <p>We're here to help</p>
            </header>

            {submitted && (
                <div className="card animate-fade-in" style={{ background: 'rgba(72, 187, 120, 0.1)', borderColor: 'var(--accent-success)' }}>
                    <p style={{ textAlign: 'center', color: 'var(--accent-success)' }}>
                        ✅ Your question has been submitted. We'll get back to you soon!
                    </p>
                </div>
            )}

            <div className="card animate-fade-in">
                <span className="card-title">Ask a Question</span>
                <form onSubmit={handleSubmit} style={{ marginTop: 'var(--spacing-md)' }}>
                    <div className="input-group">
                        <textarea
                            className="input"
                            rows={4}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="How can we help you?"
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={!question.trim() || isSubmitting}
                    >
                        {isSubmitting ? 'Sending...' : 'Send Question'}
                    </button>
                </form>
            </div>

            {myTickets && myTickets.length > 0 && (
                <div className="card animate-fade-in">
                    <span className="card-title">Your Questions</span>
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
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className={`badge badge-${ticket.status === 'Open' ? 'pending' : ticket.status === 'Answered' ? 'active' : 'inactive'}`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <p style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
                                    {ticket.question}
                                </p>
                                {ticket.answer && (
                                    <div style={{
                                        background: 'rgba(102, 126, 234, 0.1)',
                                        padding: 'var(--spacing-sm)',
                                        borderRadius: 'var(--radius-sm)',
                                        marginTop: 'var(--spacing-sm)'
                                    }}>
                                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--primary-start)', fontWeight: 500 }}>
                                            Answer:
                                        </span>
                                        <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)' }}>
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
                ← Back to Home
            </Link>
        </div>
    );
}

export default SupportPage;
