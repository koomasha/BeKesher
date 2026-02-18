import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Trans, t } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { Id } from 'convex/_generated/dataModel';
import { useLanguage } from '../hooks/useLanguage';
import { label } from '../utils/enumLabels';

function SeasonsPage() {
    const { locale } = useLanguage();
    const [statusFilter, setStatusFilter] = useState<'Draft' | 'Active' | 'Completed' | ''>('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedSeasonId, setSelectedSeasonId] = useState<Id<"seasons"> | null>(null);

    const seasons = useQuery(api.seasons.list,
        statusFilter ? { status: statusFilter } : {}
    );

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title"><Trans>Seasons</Trans></h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <Trans>+ Create Season</Trans>
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
                        <option value="Draft"><Trans>Draft</Trans></option>
                        <option value="Active"><Trans>Active</Trans></option>
                        <option value="Completed"><Trans>Completed</Trans></option>
                    </select>
                </div>
            </div>

            <div className="card">
                {seasons === undefined ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : seasons.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                        <Trans>No seasons found.</Trans>
                    </p>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th><Trans>Name</Trans></th>
                                    <th><Trans>Status</Trans></th>
                                    <th><Trans>Start Date</Trans></th>
                                    <th><Trans>End Date</Trans></th>
                                    <th><Trans>Enrolled</Trans></th>
                                    <th><Trans>Actions</Trans></th>
                                </tr>
                            </thead>
                            <tbody>
                                {seasons.map((season) => (
                                    <tr key={season._id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{season.name}</div>
                                            {season.description && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {season.description}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${season.status.toLowerCase()}`}>
                                                {label(locale, season.status)}
                                            </span>
                                        </td>
                                        <td>{new Date(season.startDate).toLocaleDateString()}</td>
                                        <td>{new Date(season.endDate).toLocaleDateString()}</td>
                                        <td>{season.enrolledCount}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => setSelectedSeasonId(season._id)}
                                                >
                                                    <Trans>View</Trans>
                                                </button>
                                                <SeasonActions seasonId={season._id} status={season.status} seasonName={season.name} />
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
                <CreateSeasonModal onClose={() => setShowCreateModal(false)} />
            )}

            {selectedSeasonId && (
                <SeasonDetailModal
                    seasonId={selectedSeasonId}
                    onClose={() => setSelectedSeasonId(null)}
                />
            )}
        </div>
    );
}

function SeasonActions({ seasonId, status, seasonName }: { seasonId: Id<"seasons">; status: string; seasonName: string }) {
    const activateSeason = useMutation(api.seasons.activate);
    const completeSeason = useMutation(api.seasons.complete);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    const handleActivate = async () => {
        if (!confirm('Activate this season? Only one season can be active at a time.')) return;
        setIsProcessing(true);
        try {
            await activateSeason({ seasonId });
            alert('Season activated successfully!');
        } catch (error) {
            alert(`Error: ${error}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleComplete = async () => {
        setIsProcessing(true);
        try {
            await completeSeason({ seasonId });
            alert('Season completed successfully!');
        } catch (error) {
            alert(`Error: ${error}`);
        } finally {
            setIsProcessing(false);
            setShowCloseConfirm(false);
        }
    };

    return (
        <>
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                {status === 'Draft' && (
                    <button
                        className="btn btn-primary"
                        onClick={handleActivate}
                        disabled={isProcessing}
                    >
                        <Trans>Activate</Trans>
                    </button>
                )}
                {status === 'Active' && (
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowCloseConfirm(true)}
                        disabled={isProcessing}
                    >
                        <Trans>Complete</Trans>
                    </button>
                )}
            </div>
            {showCloseConfirm && (
                <CloseSeasonConfirmModal
                    seasonName={seasonName}
                    isProcessing={isProcessing}
                    onConfirm={handleComplete}
                    onClose={() => setShowCloseConfirm(false)}
                />
            )}
        </>
    );
}

function CloseSeasonConfirmModal({
    seasonName,
    isProcessing,
    onConfirm,
    onClose,
}: {
    seasonName: string;
    isProcessing: boolean;
    onConfirm: () => void;
    onClose: () => void;
}) {
    const [confirmText, setConfirmText] = useState('');
    const expectedText = `закрыть ${seasonName}`;
    const isMatch = confirmText.trim().toLowerCase() === expectedText.toLowerCase();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 style={{ marginBottom: '2px' }}><Trans>Закрыть сезон</Trans></h2>
                        <span style={{ fontSize: '0.85em', color: 'var(--color-text-secondary, #888)' }}>Close Season</span>
                    </div>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <p style={{ marginBottom: 'var(--spacing-xs, 4px)' }}>
                        <Trans>Это завершит сезон, отметит все записи как завершённые и закроет все активные группы.</Trans>
                    </p>
                    <p style={{ marginBottom: 'var(--spacing-md)', fontSize: '0.85em', color: 'var(--color-text-secondary, #888)' }}>
                        This will complete the season, mark all enrollments as completed, and close all active groups.
                    </p>
                    <p style={{ marginBottom: 'var(--spacing-sm)' }}>
                        <Trans>Введите <strong style={{ fontFamily: 'monospace' }}>закрыть {seasonName}</strong> для подтверждения:</Trans>
                    </p>
                    <input
                        type="text"
                        className="input"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={`закрыть ${seasonName}`}
                        autoFocus
                    />
                </div>
                <div className="modal-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={isProcessing}
                    >
                        <Trans>Отмена</Trans>
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={onConfirm}
                        disabled={!isMatch || isProcessing}
                        style={{ background: isMatch ? 'var(--color-error, #e53e3e)' : undefined }}
                    >
                        {isProcessing ? <Trans>Закрытие...</Trans> : <Trans>Закрыть сезон</Trans>}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CreateSeasonModal({ onClose }: { onClose: () => void }) {
    const { _ } = useLingui();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createSeason = useMutation(api.seasons.create);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !startDate) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await createSeason({
                name,
                description: description || undefined,
                startDate: new Date(startDate).getTime(),
            });
            alert('Season created successfully!');
            onClose();
        } catch (error) {
            alert(`Error: ${error}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><Trans>Create New Season</Trans></h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">
                            <Trans>Season Name</Trans> *
                        </label>
                        <input
                            type="text"
                            className="input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={_(t`e.g., Winter 2026`)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">
                            <Trans>Description</Trans>
                        </label>
                        <textarea
                            className="input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={_(t`Brief description of the season (optional)`)}
                            rows={3}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">
                            <Trans>Start Date</Trans> *
                        </label>
                        <input
                            type="date"
                            className="input"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                            <Trans>End date will be automatically set to 4 weeks after start date</Trans>
                        </div>
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
                            {isSubmitting ? <Trans>Creating...</Trans> : <Trans>Create Season</Trans>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function SeasonDetailModal({
    seasonId,
    onClose,
}: {
    seasonId: Id<"seasons">;
    onClose: () => void;
}) {
    const { locale } = useLanguage();

    const season = useQuery(api.seasons.get, { seasonId });
    const enrollments = useQuery(api.seasonParticipants.listForSeason, { seasonId });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{season?.name || <Trans>Season Details</Trans>}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div>
                    {season === undefined || enrollments === undefined ? (
                        <div className="loading">
                            <div className="spinner"></div>
                        </div>
                    ) : season === null ? (
                        <p style={{ color: 'var(--text-secondary)' }}><Trans>Season not found.</Trans></p>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                        <Trans>Status</Trans>
                                    </div>
                                    <span className={`status-badge status-${season.status.toLowerCase()}`}>
                                        {label(locale, season.status)}
                                    </span>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                        <Trans>Start Date</Trans>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                        {new Date(season.startDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                        <Trans>End Date</Trans>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                        {new Date(season.endDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                        <Trans>Enrolled</Trans>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                        {enrollments.length}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                                    <Trans>Enrolled Participants</Trans> ({enrollments.length})
                                </div>
                                {enrollments.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        <Trans>No participants enrolled yet.</Trans>
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', maxHeight: '400px', overflowY: 'auto' }}>
                                        {enrollments.map((enrollment) => (
                                            <div
                                                key={enrollment._id}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                                    background: 'var(--bg-primary)',
                                                    borderRadius: 'var(--radius-md)',
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                                        {enrollment.participantName}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        {[
                                                            enrollment.participantRegion ? label(locale, enrollment.participantRegion) : null,
                                                            enrollment.participantEmail,
                                                        ].filter(Boolean).join(' · ') || ''}
                                                    </div>
                                                </div>
                                                <span className={`badge badge-${enrollment.status.toLowerCase()}`}>
                                                    {label(locale, enrollment.status)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SeasonsPage;
