import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Trans, t } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { Id } from 'convex/_generated/dataModel';
import { useLanguage } from '../hooks/useLanguage';
import { label, weekLabel } from '../utils/enumLabels';

function GroupsPage() {
    const { locale } = useLanguage();
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [seasonFilter, setSeasonFilter] = useState<string>('');
    const [selectedGroupId, setSelectedGroupId] = useState<Id<"groups"> | null>(null);

    // Fetch all seasons for the filter dropdown
    const allSeasons = useQuery(api.seasons.list, {});

    const groups = useQuery(api.groups.list, {
        status: statusFilter || undefined,
        seasonId: seasonFilter ? seasonFilter as Id<"seasons"> : undefined,
    });

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title"><Trans>Groups</Trans></h1>
                <span style={{ color: 'var(--text-secondary)' }}>
                    <Trans>{groups?.length || 0} total</Trans>
                </span>
            </div>

            <div className="filter-bar">
                <div className="filter-group">
                    <label className="filter-label"><Trans>Status:</Trans></label>
                    <select
                        className="input"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value=""><Trans>All</Trans></option>
                        <option value="Active"><Trans>Active</Trans></option>
                        <option value="Completed"><Trans>Completed</Trans></option>
                        <option value="Cancelled"><Trans>Cancelled</Trans></option>
                    </select>
                </div>
                <div className="filter-group">
                    <label className="filter-label"><Trans>Season:</Trans></label>
                    <select
                        className="input"
                        value={seasonFilter}
                        onChange={(e) => setSeasonFilter(e.target.value)}
                    >
                        <option value=""><Trans>All</Trans></option>
                        {allSeasons?.map((season) => (
                            <option key={season._id} value={season._id}>
                                {season.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="card">
                {groups === undefined ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : groups.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                        <Trans>No groups found.</Trans>
                    </p>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th><Trans>Created</Trans></th>
                                    <th><Trans>Status</Trans></th>
                                    <th><Trans>Region</Trans></th>
                                    <th><Trans>Season</Trans></th>
                                    <th><Trans>Week</Trans></th>
                                    <th><Trans>Members</Trans></th>
                                    <th><Trans>Actions</Trans></th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.map((g) => (
                                    <tr key={g._id}>
                                        <td>{new Date(g.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge badge-${g.status.toLowerCase()}`}>
                                                {label(locale, g.status)}
                                            </span>
                                        </td>
                                        <td>{g.region ? label(locale, g.region) : <Trans>Mixed</Trans>}</td>
                                        <td>{g.seasonName || '-'}</td>
                                        <td>{weekLabel(locale, g.weekInSeason)}</td>
                                        <td><Trans>{g.memberCount} people</Trans></td>
                                        <td>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => setSelectedGroupId(g._id)}
                                            >
                                                <Trans>View Details</Trans>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedGroupId && (
                <GroupDetailModal
                    groupId={selectedGroupId}
                    onClose={() => setSelectedGroupId(null)}
                />
            )}
        </div>
    );
}

function GroupDetailModal({
    groupId,
    onClose,
}: {
    groupId: Id<"groups">;
    onClose: () => void;
}) {
    const { locale } = useLanguage();
    const { _ } = useLingui();
    const [newStatus, setNewStatus] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const group = useQuery(api.groups.getById, { groupId });
    const updateStatus = useMutation(api.groups.adminUpdateStatus);

    // Close on ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleUpdateStatus = async () => {
        if (!newStatus) return;
        if (!confirm(locale === 'ru'
            ? `Изменить статус группы на "${label(locale, newStatus)}"?`
            : `Change group status to "${newStatus}"?`
        )) return;

        setIsUpdating(true);
        try {
            await updateStatus({
                groupId,
                status: newStatus as "Active" | "Completed" | "Cancelled",
            });
            setNewStatus('');
        } catch (error) {
            alert(`Error: ${error}`);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><Trans>Group Details</Trans></h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div>
                    {group === undefined ? (
                        <div className="loading">
                            <div className="spinner"></div>
                        </div>
                    ) : group === null ? (
                        <p style={{ color: 'var(--text-secondary)' }}><Trans>Group not found.</Trans></p>
                    ) : (
                        <>
                            <div className="detail-grid" style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                        <Trans>Status</Trans>
                                    </div>
                                    <span className={`badge badge-${group.status.toLowerCase()}`}>
                                        {label(locale, group.status)}
                                    </span>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                        <Trans>Created</Trans>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                        {new Date(group.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                        <Trans>Region</Trans>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                        {group.region ? label(locale, group.region) : (locale === 'ru' ? 'Смешанная' : 'Mixed')}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                        <Trans>Season</Trans>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                        {group.seasonName || (locale === 'ru' ? 'Без сезона' : 'No season')}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                        <Trans>Week</Trans>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                        {weekLabel(locale, group.weekInSeason)}
                                    </div>
                                </div>
                            </div>

                            {/* Task details section */}
                            {group.taskTitle && (
                                <div style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                                        <Trans>Assigned Task</Trans>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
                                        {group.taskTitle}
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {group.taskType && (
                                            <span>{locale === 'ru' ? 'Тип' : 'Type'}: {label(locale, group.taskType)}</span>
                                        )}
                                        {group.taskDifficulty && (
                                            <span>{locale === 'ru' ? 'Сложность' : 'Difficulty'}: {label(locale, group.taskDifficulty)}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                                    <Trans>Members</Trans> ({group.members.length})
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                    {group.members.map((member) => (
                                        <div
                                            key={member._id}
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
                                                    {member.name}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {member.telegramId}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {label(locale, member.region)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-md)' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                                    <Trans>Update Status</Trans>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <select
                                        className="input"
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        style={{ flex: 1 }}
                                    >
                                        <option value="">{_(t`Select status...`)}</option>
                                        <option value="Active">{_(t`Active`)}</option>
                                        <option value="Completed">{_(t`Completed`)}</option>
                                        <option value="Cancelled">{_(t`Cancelled`)}</option>
                                    </select>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleUpdateStatus}
                                        disabled={!newStatus || isUpdating}
                                    >
                                        {isUpdating ? <Trans>Updating...</Trans> : <Trans>Update</Trans>}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default GroupsPage;
