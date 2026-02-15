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
                        <p>Откройте приложение из Telegram</p>
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
            <div className="page-header decorated-section">
                <h1>Мои группы</h1>
                <p>Общайся с новыми друзьями</p>
            </div>

            {activeGroup && (
                <div className="card animate-fade-in">
                    <div className="card-header">
                        <span className="card-title">Группа этой недели</span>
                        <span className="badge badge-active">Active</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)' }}>
                        Регион: {activeGroup.region || 'Смешанный'}
                    </p>
                    <ul className="member-list">
                        {activeGroup.members.map((member) => (
                            <li key={member._id} className="member-item">
                                <div className="member-avatar">
                                    {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="member-info">
                                    <div className="member-name">{member.name}</div>
                                    <div className="member-detail">{member.phone}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {!activeGroup && (
                <div className="card animate-fade-in">
                    <div className="empty-state">
                        <p>На этой неделе пока нет группы</p>
                        <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)', color: 'var(--text-muted)' }}>
                            Группы формируются каждое воскресенье
                        </p>
                    </div>
                </div>
            )}

            {allGroups && allGroups.length > 0 && (
                <div className="card animate-fade-in" style={{ background: 'var(--bg-alt)' }}>
                    <span className="card-title">Прошлые группы</span>
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                        {allGroups
                            .filter((g) => g.status !== 'Active')
                            .slice(0, 5)
                            .map((group) => (
                                <div
                                    key={group._id}
                                    style={{
                                        padding: 'var(--spacing-sm) 0',
                                        borderBottom: '1px solid var(--border-color)',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                                            {new Date(group.createdAt).toLocaleDateString('ru-RU')}
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
                На главную
            </Link>
        </div>
    );
}

export default GroupsPage;
