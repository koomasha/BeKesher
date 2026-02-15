import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Link } from 'react-router-dom';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { Trans } from '@lingui/macro';

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
                        <p><Trans>Откройте приложение из Telegram</Trans></p>
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
                <h1><Trans>Мои группы</Trans></h1>
                <p><Trans>Общайся с новыми друзьями</Trans></p>
            </div>

            {activeGroup && (
                <div className="card animate-fade-in">
                    <div className="card-header">
                        <span className="card-title"><Trans>Группа этой недели</Trans></span>
                        <span className="badge badge-active">Active</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)' }}>
                        <Trans>Регион: {activeGroup.region || 'Смешанный'}</Trans>
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
                        <p><Trans>На этой неделе пока нет группы</Trans></p>
                        <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)', color: 'var(--text-muted)' }}>
                            <Trans>Группы формируются каждое воскресенье</Trans>
                        </p>
                    </div>
                </div>
            )}

            {allGroups && allGroups.length > 0 && (
                <div className="card animate-fade-in" style={{ background: 'var(--bg-alt)' }}>
                    <span className="card-title"><Trans>Прошлые группы</Trans></span>
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
                <Trans>На главную</Trans>
            </Link>
        </div>
    );
}

export default GroupsPage;
