import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Trans } from '@lingui/macro';

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
                <h1 className="page-title"><Trans>Dashboard</Trans></h1>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{participants?.length || 0}</div>
                    <div className="stat-label"><Trans>Total Participants</Trans></div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--accent-success)' }}>{activeCount}</div>
                    <div className="stat-label"><Trans>Active Participants</Trans></div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--primary)' }}>{leadCount}</div>
                    <div className="stat-label"><Trans>Leads (New)</Trans></div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{activeGroups}</div>
                    <div className="stat-label"><Trans>Active Groups</Trans></div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--accent-warning)' }}>{ticketCount}</div>
                    <div className="stat-label"><Trans>Open Tickets</Trans></div>
                </div>
            </div>

            <div className="card">
                <h2 className="card-title"><Trans>Recent Activity</Trans></h2>
                {groups === undefined ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : groups.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}><Trans>No groups yet.</Trans></p>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th><Trans>Date</Trans></th>
                                    <th><Trans>Status</Trans></th>
                                    <th><Trans>Region</Trans></th>
                                    <th><Trans>Members</Trans></th>
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
                                        <td>{group.region || <Trans>Mixed</Trans>}</td>
                                        <td><Trans>{group.memberCount} people</Trans></td>
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
