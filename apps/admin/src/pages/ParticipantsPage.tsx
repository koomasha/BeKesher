import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';

function calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function ParticipantsPage() {
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [regionFilter, setRegionFilter] = useState<string>('');

    const participants = useQuery(api.participants.list, {
        status: statusFilter || undefined,
        region: regionFilter || undefined,
    });

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Participants</h1>
                <span style={{ color: 'var(--text-secondary)' }}>
                    {participants?.length || 0} total
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
                        <option value="Lead">Lead</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label className="filter-label">Region:</label>
                    <select
                        className="input"
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                    >
                        <option value="">All</option>
                        <option value="North">North</option>
                        <option value="Center">Center</option>
                        <option value="South">South</option>
                    </select>
                </div>
            </div>

            <div className="card">
                {participants === undefined ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : participants.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                        No participants found.
                    </p>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Age</th>
                                    <th>Gender</th>
                                    <th>Region</th>
                                    <th>Status</th>
                                    <th>Paused</th>
                                    <th>Paid Until</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {participants.map((p) => (
                                    <tr key={p._id}>
                                        <td>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{p.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {p.telegramId}
                                                </div>
                                            </div>
                                        </td>
                                        <td>{calculateAge(p.birthDate)}</td>
                                        <td>{p.gender}</td>
                                        <td>{p.region}</td>
                                        <td>
                                            <span className={`badge badge-${p.status.toLowerCase()}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td>{p.onPause ? '⏸️ Yes' : '-'}</td>
                                        <td>
                                            {p.paidUntil
                                                ? new Date(p.paidUntil).toLocaleDateString()
                                                : '-'
                                            }
                                        </td>
                                        <td>
                                            <button className="btn btn-secondary" style={{ marginRight: 'var(--spacing-xs)' }}>
                                                View
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

export default ParticipantsPage;
