import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Trans, t } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { Id } from 'convex/_generated/dataModel';
import { useLanguage } from '../hooks/useLanguage';
import { label } from '../utils/enumLabels';

function TasksPage() {
    const { locale } = useLanguage();
    const [statusFilter, setStatusFilter] = useState<'Active' | 'Archive' | ''>('Active');
    const [typeFilter, setTypeFilter] = useState<'Activity' | 'Conversation' | 'Creative' | 'Philosophy' | ''>('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Id<"tasks"> | null>(null);

    const tasks = useQuery(api.tasks.list, {
        ...(statusFilter !== '' && { status: statusFilter }),
        ...(typeFilter !== '' && { type: typeFilter }),
    });

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title"><Trans>Task Library</Trans></h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <Trans>+ Create Task</Trans>
                </button>
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
                        <option value="Active"><Trans>Active</Trans></option>
                        <option value="Archive"><Trans>Archive</Trans></option>
                    </select>
                </div>
                <div className="filter-group">
                    <label className="filter-label"><Trans>Type:</Trans></label>
                    <select
                        className="input"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                    >
                        <option value=""><Trans>All</Trans></option>
                        <option value="Activity"><Trans>Activity</Trans></option>
                        <option value="Conversation"><Trans>Conversation</Trans></option>
                        <option value="Creative"><Trans>Creative</Trans></option>
                        <option value="Philosophy"><Trans>Philosophy</Trans></option>
                    </select>
                </div>
            </div>

            <div className="card">
                {tasks === undefined ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : tasks.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                        <Trans>No tasks found.</Trans>
                    </p>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th><Trans>Title</Trans></th>
                                    <th><Trans>Type</Trans></th>
                                    <th><Trans>Difficulty</Trans></th>
                                    <th><Trans>Purpose</Trans></th>
                                    <th><Trans>Status</Trans></th>
                                    <th><Trans>Actions</Trans></th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task) => (
                                    <tr key={task._id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{task.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {task.description.length > 80
                                                    ? `${task.description.substring(0, 80)}...`
                                                    : task.description
                                                }
                                            </div>
                                        </td>
                                        <td>{label(locale, task.type)}</td>
                                        <td>{label(locale, task.difficulty)}</td>
                                        <td>{label(locale, task.purpose)}</td>
                                        <td>
                                            <span className={`status-badge status-${task.status.toLowerCase()}`}>
                                                {label(locale, task.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => setSelectedTask(task._id)}
                                                >
                                                    <Trans>View</Trans>
                                                </button>
                                                <TaskArchiveButton taskId={task._id} status={task.status} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <CreateTaskModal onClose={() => setShowCreateModal(false)} />
            )}

            {selectedTask && (
                <TaskDetailModal taskId={selectedTask} onClose={() => setSelectedTask(null)} />
            )}
        </div>
    );
}

function TaskArchiveButton({ taskId, status }: { taskId: Id<"tasks">; status: string }) {
    const archiveTask = useMutation(api.tasks.archive);
    const unarchiveTask = useMutation(api.tasks.unarchive);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleArchive = async () => {
        if (!confirm('Archive this task?')) return;
        setIsProcessing(true);
        try {
            await archiveTask({ taskId });
        } catch (error) {
            alert(`Error: ${error}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUnarchive = async () => {
        if (!confirm('Restore this task from archive?')) return;
        setIsProcessing(true);
        try {
            await unarchiveTask({ taskId });
        } catch (error) {
            alert(`Error: ${error}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (status === 'Archive') {
        return (
            <button
                className="btn btn-primary"
                onClick={handleUnarchive}
                disabled={isProcessing}
            >
                <Trans>Activate</Trans>
            </button>
        );
    }

    return (
        <button
            className="btn btn-secondary"
            onClick={handleArchive}
            disabled={isProcessing}
        >
            <Trans>Archive</Trans>
        </button>
    );
}

function TaskDetailModal({ taskId, onClose }: { taskId: Id<"tasks">; onClose: () => void }) {
    const { locale } = useLanguage();
    const { _ } = useLingui();
    const task = useQuery(api.tasks.get, { taskId });
    const comments = useQuery(api.taskComments.listByTask, { taskId });
    const addComment = useMutation(api.taskComments.addComment);
    const deleteComment = useMutation(api.taskComments.deleteComment);

    const [newCommentText, setNewCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when comments change
    useEffect(() => {
        if (comments && comments.length > 0) {
            commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [comments]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommentText.trim()) return;

        setIsSubmitting(true);
        try {
            await addComment({
                taskId,
                authorName: 'Admin', // TODO: Get from auth context
                text: newCommentText.trim(),
            });
            setNewCommentText('');
        } catch (error) {
            alert(`Error: ${error}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: Id<"taskComments">) => {
        if (!confirm('Delete this comment?')) return;
        try {
            await deleteComment({ commentId });
        } catch (error) {
            alert(`Error: ${error}`);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2><Trans>Task Details</Trans></h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 'var(--spacing-lg)' }}>
                    {/* Left side - Task details */}
                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: 'var(--spacing-md)' }}>
                        {task === undefined ? (
                            <div className="loading">
                                <div className="spinner"></div>
                            </div>
                        ) : task === null ? (
                            <p><Trans>Task not found</Trans></p>
                        ) : (
                            <div>
                                <div className="form-group">
                                    <label className="form-label"><Trans>Title</Trans></label>
                                    <div>{task.title}</div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><Trans>Description</Trans></label>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{task.description}</div>
                                </div>
                                {task.onlineInstructions && (
                                    <div className="form-group">
                                        <label className="form-label"><Trans>Online Instructions</Trans></label>
                                        <div style={{ whiteSpace: 'pre-wrap' }}>{task.onlineInstructions}</div>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label className="form-label"><Trans>Report Instructions</Trans></label>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{task.reportInstructions}</div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><Trans>Metadata</Trans></label>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        <div><Trans>Type:</Trans> {label(locale, task.type)}</div>
                                        <div><Trans>Difficulty:</Trans> {label(locale, task.difficulty)}</div>
                                        <div><Trans>Purpose:</Trans> {label(locale, task.purpose)}</div>
                                        <div><Trans>Status:</Trans> {label(locale, task.status)}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right side - Comments section */}
                    <div style={{
                        width: '400px',
                        borderLeft: '1px solid var(--border-color)',
                        paddingLeft: 'var(--spacing-lg)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}>
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                📝 <Trans>Admin Comments</Trans>
                                {comments && comments.length > 0 && (
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                                        ({comments.length})
                                    </span>
                                )}
                            </h3>
                        </div>

                        {/* Comments list */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            marginBottom: 'var(--spacing-md)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--spacing-sm)',
                        }}>
                            {comments === undefined ? (
                                <div className="loading">
                                    <div className="spinner"></div>
                                </div>
                            ) : comments.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: 'var(--spacing-md)' }}>
                                    <Trans>No comments yet</Trans>
                                </p>
                            ) : (
                                <>
                                    {comments.map((comment) => (
                                        <div
                                            key={comment._id}
                                            style={{
                                                background: 'var(--bg-secondary)',
                                                borderRadius: '8px',
                                                padding: 'var(--spacing-md)',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                position: 'relative',
                                            }}
                                            onMouseEnter={(e) => {
                                                const deleteBtn = e.currentTarget.querySelector('.delete-comment-btn') as HTMLElement;
                                                if (deleteBtn) deleteBtn.style.opacity = '1';
                                            }}
                                            onMouseLeave={(e) => {
                                                const deleteBtn = e.currentTarget.querySelector('.delete-comment-btn') as HTMLElement;
                                                if (deleteBtn) deleteBtn.style.opacity = '0';
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                                                {/* Avatar with initials */}
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: '#6B5DD3',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    flexShrink: 0,
                                                }}>
                                                    {getInitials(comment.authorName)}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                                            {comment.authorName}
                                                        </span>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            {new Date(comment.createdAt).toLocaleString('ru-RU', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* Delete button */}
                                                <button
                                                    className="delete-comment-btn"
                                                    onClick={() => handleDeleteComment(comment._id)}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 'var(--spacing-xs)',
                                                        right: 'var(--spacing-xs)',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        opacity: 0,
                                                        transition: 'opacity 0.2s',
                                                        fontSize: '1.2rem',
                                                    }}
                                                    title="Delete comment"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                            <div style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', paddingLeft: '40px' }}>
                                                {comment.text}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={commentsEndRef} />
                                </>
                            )}
                        </div>

                        {/* Add comment form */}
                        <form onSubmit={handleAddComment} style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-md)' }}>
                            <textarea
                                className="input"
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                placeholder={_(t`Write a comment...`)}
                                rows={3}
                                style={{ marginBottom: 'var(--spacing-sm)', resize: 'none' }}
                                disabled={isSubmitting}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting || !newCommentText.trim()}
                                style={{
                                    width: '100%',
                                    background: '#6B5DD3',
                                    borderColor: '#6B5DD3',
                                }}
                            >
                                {isSubmitting ? <Trans>Sending...</Trans> : <Trans>Send</Trans>}
                            </button>
                        </form>
                    </div>
                </div>
                <div className="modal-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                    <button className="btn btn-secondary" onClick={onClose}>
                        <Trans>Close</Trans>
                    </button>
                </div>
            </div>
        </div>
    );
}

function CreateTaskModal({ onClose }: { onClose: () => void }) {
    const { _ } = useLingui();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [onlineInstructions, setOnlineInstructions] = useState('');
    const [reportInstructions, setReportInstructions] = useState('');
    const [type, setType] = useState<'Activity' | 'Conversation' | 'Creative' | 'Philosophy'>('Activity');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [purpose, setPurpose] = useState<'Everyone' | 'Romantic' | 'Friendship'>('Everyone');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createTask = useMutation(api.tasks.create);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !reportInstructions) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await createTask({
                title,
                description,
                onlineInstructions: onlineInstructions || undefined,
                reportInstructions,
                type,
                difficulty,
                purpose,
            });
            alert('Task created successfully!');
            onClose();
        } catch (error) {
            alert(`Error: ${error}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2><Trans>Create New Task</Trans></h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label"><Trans>Title</Trans> *</label>
                        <input
                            type="text"
                            className="input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={_(t`Enter a descriptive task title`)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label"><Trans>Description</Trans> *</label>
                        <textarea
                            className="input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            placeholder={_(t`Describe what participants will do in this task`)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label"><Trans>Online Instructions</Trans></label>
                        <textarea
                            className="input"
                            value={onlineInstructions}
                            onChange={(e) => setOnlineInstructions(e.target.value)}
                            rows={3}
                            placeholder={_(t`Instructions for completing online (optional)`)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label"><Trans>Report Instructions</Trans> *</label>
                        <textarea
                            className="input"
                            value={reportInstructions}
                            onChange={(e) => setReportInstructions(e.target.value)}
                            rows={3}
                            placeholder={_(t`Instructions for how participants should report completion`)}
                            required
                        />
                    </div>
                    <div className="form-row-3">
                        <div className="form-group">
                            <label className="form-label"><Trans>Type</Trans></label>
                            <select className="input" value={type} onChange={(e) => setType(e.target.value as 'Activity' | 'Conversation' | 'Creative' | 'Philosophy')}>
                                <option value="Activity">{_(t`Activity`)}</option>
                                <option value="Conversation">{_(t`Conversation`)}</option>
                                <option value="Creative">{_(t`Creative`)}</option>
                                <option value="Philosophy">{_(t`Philosophy`)}</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label"><Trans>Difficulty</Trans></label>
                            <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}>
                                <option value="Easy">{_(t`Easy`)}</option>
                                <option value="Medium">{_(t`Medium`)}</option>
                                <option value="Hard">{_(t`Hard`)}</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label"><Trans>Purpose</Trans></label>
                            <select className="input" value={purpose} onChange={(e) => setPurpose(e.target.value as 'Everyone' | 'Romantic' | 'Friendship')}>
                                <option value="Everyone">{_(t`Everyone`)}</option>
                                <option value="Romantic">{_(t`Romantic`)}</option>
                                <option value="Friendship">{_(t`Friendship`)}</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            <Trans>Cancel</Trans>
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? <Trans>Creating...</Trans> : <Trans>Create Task</Trans>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default TasksPage;
