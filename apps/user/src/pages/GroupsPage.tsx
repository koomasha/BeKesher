import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Link } from 'react-router-dom';
import { useTelegramAuth } from '../hooks/useTelegramAuth';

function GroupsPage() {
    const { authArgs, isAuthenticated } = useTelegramAuth();

    const activeGroup = useQuery(
        api.groups.getActiveForParticipant,
        isAuthenticated ? authArgs : 'skip'
    );

    const allGroups = useQuery(
        api.groups.getForParticipant,
        isAuthenticated ? authArgs : 'skip'
    );

    if (!isAuthenticated) {
        return (
            <div className="page">
                <div className="card">
                    <div className="empty-state">
                        <div className="icon">📱</div>
                        <p>Open this app from Telegram</p>
                    </div>
                </div>
            </div>
        );
    }

    if (activeGroup === undefined || allGroups === undefined) {
        return (
            <div className="page">
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <header className="header">
                <h1>👥 My Groups</h1>
                <p>Connect with your matches</p>
            </header>

            {activeGroup && (
                <div className="card animate-fade-in">
                    <div className="card-header">
                        <span className="card-title">🔥 This Week's Group</span>
                        <span className="badge badge-active">Active</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)' }}>
                        📍 Region: {activeGroup.region || 'Mixed'}
                    </p>
                    <ul className="member-list">
                        {activeGroup.members.map((member) => (
                            <li key={member._id} className="member-item">
                                <div className="member-avatar">
                                    {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="member-info">
                                    <div className="member-name">{member.name}</div>
                                    <div className="member-detail">📞 {member.phone}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {!activeGroup && (
                <div className="card animate-fade-in">
                    <div className="empty-state">
                        <div className="icon">⏳</div>
                        <p>No active group this week</p>
                        <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)' }}>
                            Groups are formed every Sunday
                        </p>
                    </div>
                </div>
            )}

            {allGroups && allGroups.length > 0 && (
                <div className="card animate-fade-in">
                    <span className="card-title">📜 Past Groups</span>
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                        {allGroups
                            .filter((g) => g.status !== 'Active')
                            .slice(0, 5)
                            .map((group) => (
                                <div
                                    key={group._id}
                                    style={{
                                        padding: 'var(--spacing-sm)',
                                        borderBottom: '1px solid var(--border-color)',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 'var(--font-size-sm)' }}>
                                            {new Date(group.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className={`badge badge-${group.status.toLowerCase()}`}>
                                            {group.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                                        {group.members.map((m) => m.name).join(', ')}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            <Link to="/" className="btn btn-secondary btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                ← Back to Home
            </Link>
        </div>
    );
}

export default GroupsPage;
