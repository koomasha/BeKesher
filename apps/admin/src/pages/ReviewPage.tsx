import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Trans, t } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { Id } from 'convex/_generated/dataModel';

function ReviewPage() {
    const [statusFilter, setStatusFilter] = useState<'Pending' | 'Approved' | 'Revision' | 'Rejected' | 'NotCompleted' | ''>('Pending');
    const [selectedAssignment, setSelectedAssignment] = useState<Id<"taskAssignments"> | null>(null);

    const assignments = useQuery(api.taskAssignments.listForReview,
        statusFilter ? { reviewStatus: statusFilter } : {}
    );

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title"><Trans>Task Review</Trans></h1>
                <span style={{ color: 'var(--text-secondary)' }}>
                    {assignments?.length || 0} <Trans>assignments</Trans>
                </span>
            </div>

            <div className="filter-bar">
                <div className="filter-group">
                    <label className="filter-label"><Trans>Status:</Trans></label>
                    <select
                        className="input"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    >
                        <option value=""><Trans>All</Trans></option>
                        <option value="Pending"><Trans>Pending Review</Trans></option>
                        <option value="Approved"><Trans>Approved</Trans></option>
                        <option value="Revision"><Trans>Needs Revision</Trans></option>
                        <option value="Rejected"><Trans>Rejected</Trans></option>
                        <option value="NotCompleted"><Trans>Not Completed</Trans></option>
                    </select>
                </div>
            </div>

            <div className="card">
                {assignments === undefined ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : assignments.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                        <Trans>No assignments found.</Trans>
                    </p>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th><Trans>Task</Trans></th>
                                    <th><Trans>Week</Trans></th>
                                    <th><Trans>Submitted By</Trans></th>
                                    <th><Trans>Submitted At</Trans></th>
                                    <th><Trans>Status</Trans></th>
                                    <th><Trans>Points</Trans></th>
                                    <th><Trans>Actions</Trans></th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.map((assignment) => (
                                    <tr key={assignment._id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{assignment.taskTitle}</div>
                                        </td>
                                        <td>Week {assignment.weekInSeason}</td>
                                        <td>{assignment.submittedByName || '-'}</td>
                                        <td>
                                            {assignment.submittedAt
                                                ? new Date(assignment.submittedAt).toLocaleString()
                                                : '-'
                                            }
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${assignment.reviewStatus.toLowerCase()}`}>
                                                {assignment.reviewStatus}
                                            </span>
                                        </td>
                                        <td>{assignment.pointsAwarded}</td>
                                        <td>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => setSelectedAssignment(assignment._id)}
                                            >
                                                <Trans>Review</Trans>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedAssignment && (
                <ReviewModal
                    assignmentId={selectedAssignment}
                    onClose={() => setSelectedAssignment(null)}
                />
            )}
        </div>
    );
}

function ReviewModal({
    assignmentId,
    onClose,
}: {
    assignmentId: Id<"taskAssignments">;
    onClose: () => void;
}) {
    const { _ } = useLingui();
    const currentAssignment = useQuery(api.taskAssignments.getAssignment, { assignmentId });

    const [reviewStatus, setReviewStatus] = useState<'Approved' | 'Revision' | 'Rejected'>('Approved');
    const [reviewComment, setReviewComment] = useState('');
    const [pointsAwarded, setPointsAwarded] = useState(10);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reviewCompletion = useMutation(api.taskAssignments.reviewCompletion);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        try {
            await reviewCompletion({
                assignmentId,
                reviewStatus,
                reviewComment: reviewComment || undefined,
                pointsAwarded,
            });
            alert('Review submitted successfully!');
            onClose();
        } catch (error) {
            alert(`Error: ${error}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentAssignment) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <p><Trans>Loading...</Trans></p>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                <div className="modal-header">
                    <h2><Trans>Review Task Completion</Trans></h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>{currentAssignment.taskTitle}</h3>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <div><Trans>Week:</Trans> {currentAssignment.weekInSeason}</div>
                        <div><Trans>Submitted by:</Trans> {currentAssignment.submittedByName}</div>
                        {currentAssignment.submittedAt && (
                            <div>
                                <Trans>Submitted at:</Trans> {new Date(currentAssignment.submittedAt).toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label"><Trans>Completion Notes</Trans></label>
                    <div style={{
                        padding: 'var(--spacing-md)',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {currentAssignment.completionNotes || <em style={{ color: 'var(--text-secondary)' }}>No notes provided</em>}
                    </div>
                </div>

                {currentAssignment.completionPhotoUrls && currentAssignment.completionPhotoUrls.length > 0 && (
                    <div className="form-group">
                        <label className="form-label"><Trans>Photos</Trans></label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: 'var(--spacing-sm)',
                        }}>
                            {currentAssignment.completionPhotoUrls.map((url, index) => (
                                url && (
                                    <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={url}
                                            alt={`Completion photo ${index + 1}`}
                                            style={{
                                                width: '100%',
                                                borderRadius: 'var(--radius-md)',
                                                objectFit: 'cover',
                                                aspectRatio: '1',
                                            }}
                                        />
                                    </a>
                                )
                            ))}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label"><Trans>Review Decision</Trans> *</label>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    value="Approved"
                                    checked={reviewStatus === 'Approved'}
                                    onChange={(e) => {
                                        setReviewStatus(e.target.value as 'Approved' | 'Revision' | 'Rejected');
                                        if (e.target.value === 'Approved') {
                                            setPointsAwarded(currentAssignment.completionPhotoUrls?.length ? 10 : 5);
                                        } else {
                                            setPointsAwarded(0);
                                        }
                                    }}
                                />
                                <Trans>✅ Approve</Trans>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    value="Revision"
                                    checked={reviewStatus === 'Revision'}
                                    onChange={(e) => {
                                        setReviewStatus(e.target.value as 'Approved' | 'Revision' | 'Rejected');
                                        setPointsAwarded(0);
                                    }}
                                />
                                <Trans>🔄 Needs Revision</Trans>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    value="Rejected"
                                    checked={reviewStatus === 'Rejected'}
                                    onChange={(e) => {
                                        setReviewStatus(e.target.value as 'Approved' | 'Revision' | 'Rejected');
                                        setPointsAwarded(0);
                                    }}
                                />
                                <Trans>❌ Reject</Trans>
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label"><Trans>Points to Award</Trans></label>
                        <input
                            type="number"
                            className="input"
                            value={pointsAwarded}
                            onChange={(e) => setPointsAwarded(Number(e.target.value))}
                            min="0"
                            max="20"
                            disabled={reviewStatus !== 'Approved'}
                        />
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                            <Trans>Suggested: 5 points for text only, 10 points with photos</Trans>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label"><Trans>Review Comment</Trans></label>
                        <textarea
                            className="input"
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            rows={3}
                            placeholder={_(t`Optional feedback for the participant`)}
                        />
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            <Trans>Cancel</Trans>
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Trans>Submitting...</Trans> : <Trans>Submit Review</Trans>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ReviewPage;
