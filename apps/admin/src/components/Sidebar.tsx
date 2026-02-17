import { NavLink } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Trans } from '@lingui/macro';

function Sidebar() {
    const user = useQuery(api.authAdmin.getAdminIdentity);
    const { logout } = useAdminAuth();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1><Trans>🔗 BeKesher</Trans></h1>
                <p style={{ fontSize: '0.75rem', opacity: 0.7 }}><Trans>Admin Dashboard</Trans></p>
                <LanguageSwitcher />
            </div>

            <nav className="sidebar-nav">
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Trans>📊 Dashboard</Trans>
                </NavLink>
                <NavLink
                    to="/participants"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Trans>👥 Participants</Trans>
                </NavLink>
                <NavLink
                    to="/groups"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Trans>🎯 Groups</Trans>
                </NavLink>
                <div style={{ margin: 'var(--spacing-sm) 0', padding: '0 var(--spacing-md)', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                    <Trans>Season Flow</Trans>
                </div>
                <NavLink
                    to="/seasons"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Trans>📅 Seasons</Trans>
                </NavLink>
                <NavLink
                    to="/tasks"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Trans>📝 Task Library</Trans>
                </NavLink>
                <NavLink
                    to="/assignments"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Trans>📌 Assign Tasks</Trans>
                </NavLink>
                <NavLink
                    to="/review"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Trans>✅ Review Tasks</Trans>
                </NavLink>
                <div style={{ margin: 'var(--spacing-sm) 0', padding: '0 var(--spacing-md)', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                    <Trans>Operations</Trans>
                </div>
                <NavLink
                    to="/matching"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Trans>🔄 Run Matching</Trans>
                </NavLink>
                <NavLink
                    to="/feedback"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Trans>⭐ Feedback</Trans>
                </NavLink>
                <NavLink
                    to="/support"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Trans>💬 Support Tickets</Trans>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                {user && (
                    <div className="user-profile">
                        {user.picture && (
                            <img src={user.picture} alt={user.name || "User"} className="user-avatar" />
                        )}
                        <div className="user-info">
                            <div className="user-name">{user.name}</div>
                            <div className="user-email" title={user.email}>{user.email}</div>
                        </div>
                        <button onClick={logout} className="logout-btn" title="Logout">
                            🚪
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
