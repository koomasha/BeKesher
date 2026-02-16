import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Trans, t } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { Id } from 'convex/_generated/dataModel';

function SeasonsPage() {
    const [statusFilter, setStatusFilter] = useState<'Draft' | 'Active' | 'Completed' | ''>('');
    const [showCreateModal, setShowCreateModal] = useState(false);

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
                                                {season.status}
                                            </span>
                                        </td>
                                        <td>{new Date(season.startDate).toLocaleDateString()}</td>
                                        <td>{new Date(season.endDate).toLocaleDateString()}</td>
                                        <td>{season.enrolledCount}</td>
                                        <td>
                                            <SeasonActions seasonId={season._id} status={season.status} />
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
        </div>
    );
}

function SeasonActions({ seasonId, status }: { seasonId: Id<"seasons">; status: string }) {
    const activateSeason = useMutation(api.seasons.activate);
    const completeSeason = useMutation(api.seasons.complete);
    const [isProcessing, setIsProcessing] = useState(false);

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
        if (!confirm('Complete this season? This will mark all enrollments as completed.')) return;
        setIsProcessing(true);
        try {
            await completeSeason({ seasonId });
            alert('Season completed successfully!');
        } catch (error) {
            alert(`Error: ${error}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
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
                    onClick={handleComplete}
                    disabled={isProcessing}
                >
                    <Trans>Complete</Trans>
                </button>
            )}
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

export default SeasonsPage;
