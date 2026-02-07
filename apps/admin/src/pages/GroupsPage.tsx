import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';

function GroupsPage() {
    const [statusFilter, setStatusFilter] = useState<string>('');

    const groups = useQuery(api.groups.list, {
        status: statusFilter || undefined,
    });

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Groups</h1>
                <span style={{ color: 'var(--text-secondary)' }}>
                    {groups?.length || 0} total
                </span>
            </div>

            <div className="filter-bar">
                <div className="filter-group">
                    <label className="filter-label">Status:</label>
                    <select
                        className="input"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
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
                        No groups found.
                    </p>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Created</th>
                                    <th>Status</th>
                                    <th>Region</th>
                                    <th>Members</th>
                                    <th>Actions</th>
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
                                        <td>{g.region || 'Mixed'}</td>
                                        <td>{g.memberCount} people</td>
                                        <td>
                                            <button className="btn btn-secondary">
                                                View Details
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
