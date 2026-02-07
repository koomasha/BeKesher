import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Link } from 'react-router-dom';
import { Id } from 'convex/_generated/dataModel';

function FeedbackPage() {
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const telegramId = telegramUser?.id?.toString() || '';

    const pendingFeedback = useQuery(
        api.feedback.getPendingFeedback,
        telegramId ? { telegramId } : 'skip'
    );

    const submitFeedback = useMutation(api.feedback.submitFeedback);

    const [selectedGroup, setSelectedGroup] = useState<Id<'groups'> | null>(null);
    const [rating, setRating] = useState(0);
    const [textFeedback, setTextFeedback] = useState('');
    const [wouldMeetAgain, setWouldMeetAgain] = useState<boolean | null>(null);
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

    if (pendingFeedback === undefined) {
        return (
            <div className="page">
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    const handleSubmit = async () => {
        if (!selectedGroup || rating === 0) return;

        setIsSubmitting(true);
        try {
            await submitFeedback({
                telegramId,
                groupId: selectedGroup,
                rating,
                textFeedback: textFeedback || undefined,
                wouldMeetAgain: wouldMeetAgain ?? undefined,
            });
            setSubmitted(true);
            setSelectedGroup(null);
            setRating(0);
            setTextFeedback('');
            setWouldMeetAgain(null);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            alert('Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="page">
                <header className="header">
                    <h1>⭐ Feedback</h1>
                </header>
                <div className="card animate-fade-in">
                    <div className="empty-state">
                        <div className="icon">🎉</div>
                        <p>Thank you for your feedback!</p>
                        <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)' }}>
                            You've earned 10 points!
                        </p>
                    </div>
                </div>
                <button
                    className="btn btn-primary btn-full"
                    onClick={() => setSubmitted(false)}
                >
                    Submit More Feedback
                </button>
                <Link to="/" className="btn btn-secondary btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                    ← Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="page">
            <header className="header">
                <h1>⭐ Feedback</h1>
                <p>Share your experience</p>
            </header>

            {pendingFeedback.length === 0 ? (
                <div className="card animate-fade-in">
                    <div className="empty-state">
                        <div className="icon">✅</div>
                        <p>No pending feedback</p>
                        <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)' }}>
                            You're all caught up!
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {!selectedGroup && (
                        <div className="card animate-fade-in">
                            <span className="card-title">Select a group to review:</span>
                            <div style={{ marginTop: 'var(--spacing-md)' }}>
                                {pendingFeedback.map((group) => (
                                    <button
                                        key={group.groupId}
                                        className="btn btn-secondary btn-full"
                                        style={{ marginBottom: 'var(--spacing-sm)', textAlign: 'left' }}
                                        onClick={() => setSelectedGroup(group.groupId)}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 500 }}>
                                                {new Date(group.groupCreatedAt).toLocaleDateString()}
                                            </div>
                                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                                With: {group.members.join(', ')}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedGroup && (
                        <div className="card animate-fade-in">
                            <span className="card-title">Rate your experience</span>

                            <div style={{ marginTop: 'var(--spacing-lg)', textAlign: 'center' }}>
                                <div className="rating" style={{ justifyContent: 'center', marginBottom: 'var(--spacing-lg)' }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                            key={star}
                                            className={`star ${star <= rating ? 'active' : ''}`}
                                            onClick={() => setRating(star)}
                                        >
                                            ⭐
                                        </span>
                                    ))}
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Would you meet again?</label>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center' }}>
                                        <button
                                            className={`btn ${wouldMeetAgain === true ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setWouldMeetAgain(true)}
                                        >
                                            👍 Yes
                                        </button>
                                        <button
                                            className={`btn ${wouldMeetAgain === false ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setWouldMeetAgain(false)}
                                        >
                                            👎 No
                                        </button>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Comments (optional)</label>
                                    <textarea
                                        className="input"
                                        rows={3}
                                        value={textFeedback}
                                        onChange={(e) => setTextFeedback(e.target.value)}
                                        placeholder="Tell us about your experience..."
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>

                                <button
                                    className="btn btn-primary btn-full"
                                    onClick={handleSubmit}
                                    disabled={rating === 0 || isSubmitting}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                                </button>

                                <button
                                    className="btn btn-secondary btn-full"
                                    style={{ marginTop: 'var(--spacing-sm)' }}
                                    onClick={() => setSelectedGroup(null)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <Link to="/" className="btn btn-secondary btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                ← Back to Home
            </Link>
        </div>
    );
}

export default FeedbackPage;
