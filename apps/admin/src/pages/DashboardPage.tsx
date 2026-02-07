import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';

function DashboardPage() {
    const participants = useQuery(api.participants.list, {});
    const groups = useQuery(api.groups.list, {});
    const openTickets = useQuery(api.support.list, { status: 'Open' });

    const activeCount = participants?.filter((p) => p.status === 'Active').length || 0;
    const leadCount = participants?.filter((p) => p.status === 'Lead').length || 0;
    const activeGroups = groups?.filter((g) => g.status === 'Active').length || 0;
    const ticketCount = openTickets?.length || 0;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{participants?.length || 0}</div>
                    <div className="stat-label">Total Participants</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--accent-success)' }}>{activeCount}</div>
                    <div className="stat-label">Active Participants</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--primary)' }}>{leadCount}</div>
                    <div className="stat-label">Leads (New)</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{activeGroups}</div>
                    <div className="stat-label">Active Groups</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--accent-warning)' }}>{ticketCount}</div>
                    <div className="stat-label">Open Tickets</div>
                </div>
            </div>

            <div className="card">
                <h2 className="card-title">Recent Activity</h2>
                {groups === undefined ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : groups.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No groups yet.</p>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Region</th>
                                    <th>Members</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.slice(0, 10).map((group) => (
                                    <tr key={group._id}>
                                        <td>{new Date(group.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge badge-${group.status.toLowerCase()}`}>
                                                {group.status}
                                            </span>
                                        </td>
                                        <td>{group.region || 'Mixed'}</td>
                                        <td>{group.memberCount} people</td>
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

export default DashboardPage;
