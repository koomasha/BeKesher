import { NavLink } from 'react-router-dom';

function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1>🔗 BeKesher</h1>
                <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>Admin Dashboard</p>
            </div>

            <nav className="sidebar-nav">
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    📊 Dashboard
                </NavLink>
                <NavLink
                    to="/participants"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    👥 Participants
                </NavLink>
                <NavLink
                    to="/groups"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    🎯 Groups
                </NavLink>
                <NavLink
                    to="/matching"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    🔄 Run Matching
                </NavLink>
                <NavLink
                    to="/support"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    💬 Support Tickets
                </NavLink>
            </nav>
        </aside>
    );
}

export default Sidebar;
