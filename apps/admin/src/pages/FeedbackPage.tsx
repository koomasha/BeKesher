import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { Trans } from '@lingui/macro';

function FeedbackPage() {
    const [ratingFilter, setRatingFilter] = useState<string>('');
    const [groupStatusFilter, setGroupStatusFilter] = useState<string>('Completed');

    const feedback = useQuery(api.feedback.list, {
        minRating: ratingFilter ? parseInt(ratingFilter) : undefined,
        groupStatus: groupStatusFilter || undefined,
    });

    const [expandedId, setExpandedId] = useState<Id<'feedback'> | null>(null);

    // Calculate average rating
    const avgRating =
        feedback && feedback.length > 0
            ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
            : '0';

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title"><Trans>Feedback</Trans></h1>
                <span style={{ color: 'var(--text-secondary)' }}>
                    <Trans>{feedback?.length || 0} submissions • Avg: {avgRating}/10</Trans>
                </span>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-group">
                    <label className="filter-label"><Trans>Min Rating:</Trans></label>
                    <select
                        className="input"
                        value={ratingFilter}
                        onChange={(e) => setRatingFilter(e.target.value)}
                    >
                        <option value=""><Trans>All</Trans></option>
                        <option value="8"><Trans>8+ (Great)</Trans></option>
                        <option value="6"><Trans>6+ (Good)</Trans></option>
                        <option value="4"><Trans>4+ (Fair)</Trans></option>
                        <option value="1"><Trans>1+ (All)</Trans></option>
                    </select>
                </div>
                <div className="filter-group">
                    <label className="filter-label"><Trans>Group Status:</Trans></label>
                    <select
                        className="input"
                        value={groupStatusFilter}
                        onChange={(e) => setGroupStatusFilter(e.target.value)}
                    >
                        <option value=""><Trans>All</Trans></option>
                        <option value="Completed"><Trans>Completed</Trans></option>
                        <option value="Active"><Trans>Active</Trans></option>
                        <option value="Cancelled"><Trans>Cancelled</Trans></option>
                    </select>
                </div>
            </div>

            {/* Feedback Cards */}
            <div className="card">
                {feedback === undefined ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : feedback.length === 0 ? (
                    <p
                        style={{
                            color: 'var(--text-secondary)',
                            textAlign: 'center',
                            padding: 'var(--spacing-lg)',
                        }}
                    >
                        <Trans>No feedback found.</Trans>
                    </p>
                ) : (
                    <div>
                        {feedback.map((f) => (
                            <div key={f._id} className="feedback-item">
                                {/* Summary Row */}
                                <div className="feedback-summary">
                                    <div className="feedback-header">
                                        <span className="feedback-participant">{f.participantName}</span>
                                        <span className="feedback-rating">⭐ {f.rating}/10</span>
                                    </div>
                                    <div className="feedback-meta">
                                        <span>{new Date(f.submittedAt).toLocaleDateString()}</span>
                                        <span className={`badge badge-${f.groupStatus.toLowerCase()}`}>
                                            {f.groupStatus}
                                        </span>
                                        {f.wouldMeetAgain && (
                                            <span>
                                                <Trans>Would meet again:{' '}
                                                {f.wouldMeetAgain === 'yes'
                                                    ? '👍 Yes'
                                                    : f.wouldMeetAgain === 'no'
                                                      ? '👎 No'
                                                      : '🤔 Maybe'}</Trans>
                                            </span>
                                        )}
                                    </div>

                                    {/* Preview snippet */}
                                    {f.textFeedback && (
                                        <p className="feedback-preview">
                                            {f.textFeedback.length > 100
                                                ? f.textFeedback.substring(0, 100) + '...'
                                                : f.textFeedback}
                                        </p>
                                    )}

                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setExpandedId(expandedId === f._id ? null : f._id)}
                                    >
                                        {expandedId === f._id ? <Trans>Hide Details</Trans> : <Trans>View Details</Trans>}
                                    </button>
                                </div>

                                {/* Expanded Details */}
                                {expandedId === f._id && (
                                    <div className="feedback-details">
                                        {f.textFeedback && (
                                            <div className="feedback-section">
                                                <strong><Trans>What they liked:</Trans></strong>
                                                <p>{f.textFeedback}</p>
                                            </div>
                                        )}

                                        {f.improvementSuggestion && (
                                            <div className="feedback-section">
                                                <strong><Trans>Improvement suggestions:</Trans></strong>
                                                <p>{f.improvementSuggestion}</p>
                                            </div>
                                        )}

                                        {f.taskEffect && (
                                            <div className="feedback-section">
                                                <strong><Trans>Task effect:</Trans></strong>
                                                <div>
                                                    <span className="badge">
                                                        {f.taskEffect === 'deeper' && <Trans>🤝 Made it deeper</Trans>}
                                                        {f.taskEffect === 'fun' && <Trans>🎉 Added fun</Trans>}
                                                        {f.taskEffect === 'not_fit' && <Trans>⚠️ Didn't fit</Trans>}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {f.photoUrls && f.photoUrls.length > 0 && (
                                            <div className="feedback-section">
                                                <strong><Trans>Photos ({f.photoUrls.length}):</Trans></strong>
                                                <div className="feedback-photos">
                                                    {f.photoUrls.map((url, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={url}
                                                            alt={`Feedback photo ${idx + 1}`}
                                                            className="feedback-photo"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default FeedbackPage;
