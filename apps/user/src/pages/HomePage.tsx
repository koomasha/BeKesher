import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';

function HomePage() {
    // Get Telegram user ID if available
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const telegramId = telegramUser?.id?.toString() || '';

    // Fetch user profile if we have a Telegram ID
    const profile = useQuery(
        api.participants.getMyProfile,
        telegramId ? { telegramId } : 'skip'
    );

    const firstName = telegramUser?.first_name || 'Friend';

    return (
        <div className="page">
            <header className="header">
                <h1>👋 Hey, {firstName}!</h1>
                <p>Welcome to BeKesher</p>
            </header>

            {profile === undefined && telegramId && (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading your profile...</p>
                </div>
            )}

            {profile && (
                <div className="card animate-fade-in">
                    <div className="card-header">
                        <span className="card-title">Your Status</span>
                        <span className={`badge badge-${profile.status.toLowerCase()}`}>
                            {profile.status}
                        </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        Points: {profile.totalPoints} ⭐
                    </p>
                    {profile.paidUntil && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            Subscription until: {new Date(profile.paidUntil).toLocaleDateString()}
                        </p>
                    )}
                </div>
            )}

            {!profile && !telegramId && (
                <div className="card animate-fade-in">
                    <div className="empty-state">
                        <div className="icon">📱</div>
                        <p>Open this app from Telegram to see your profile</p>
                    </div>
                </div>
            )}

            <nav className="nav-menu">
                <Link to="/profile" className="nav-item">
                    <span className="icon">👤</span>
                    <span className="label">My Profile</span>
                </Link>
                <Link to="/groups" className="nav-item">
                    <span className="icon">👥</span>
                    <span className="label">My Groups</span>
                </Link>
                <Link to="/feedback" className="nav-item">
                    <span className="icon">⭐</span>
                    <span className="label">Feedback</span>
                </Link>
                <Link to="/support" className="nav-item">
                    <span className="icon">💬</span>
                    <span className="label">Support</span>
                </Link>
            </nav>
        </div>
    );
}

export default HomePage;
