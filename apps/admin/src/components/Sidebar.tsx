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
                <NavLink
                    to="/feedback"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Trans>⭐ Feedback</Trans>
                </NavLink>
                <NavLink
                    to="/matching"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Trans>🔄 Run Matching</Trans>
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
