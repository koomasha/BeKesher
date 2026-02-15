import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Trans } from '@lingui/macro';

function GroupsPage() {
    const [statusFilter, setStatusFilter] = useState<string>('');

    const groups = useQuery(api.groups.list, {
        status: statusFilter || undefined,
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
                                                {g.status}
                                            </span>
                                        </td>
                                        <td>{g.region || <Trans>Mixed</Trans>}</td>
                                        <td><Trans>{g.memberCount} people</Trans></td>
                                        <td>
                                            <button className="btn btn-secondary">
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
        </div>
    );
}

export default GroupsPage;
