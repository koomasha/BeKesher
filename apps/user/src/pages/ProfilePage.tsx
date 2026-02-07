import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Link } from 'react-router-dom';

function ProfilePage() {
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const telegramId = telegramUser?.id?.toString() || '';

    const profile = useQuery(
        api.participants.getByTelegramId,
        telegramId ? { telegramId } : 'skip'
    );

    if (!telegramId) {
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

    if (profile === undefined) {
        return (
            <div className="page">
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="page">
                <header className="header">
                    <h1>Profile</h1>
                    <p>Complete your registration</p>
                </header>
                <div className="card">
                    <p style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                        You haven't registered yet. Please complete your registration to join BeKesher!
                    </p>
                    <button className="btn btn-primary btn-full">
                        Register Now
                    </button>
                </div>
                <Link to="/" className="btn btn-secondary btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                    ← Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="page">
            <header className="header">
                <h1>👤 My Profile</h1>
                <p>{profile.name}</p>
            </header>

            <div className="card animate-fade-in">
                <div className="card-header">
                    <span className="card-title">Personal Info</span>
                    <span className={`badge badge-${profile.status.toLowerCase()}`}>
                        {profile.status}
                    </span>
                </div>

                <div className="info-grid" style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                    <div className="info-item">
                        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Age</span>
                        <span style={{ fontWeight: 500 }}>{profile.age}</span>
                    </div>
                    <div className="info-item">
                        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Gender</span>
                        <span style={{ fontWeight: 500 }}>{profile.gender}</span>
                    </div>
                    <div className="info-item">
                        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Region</span>
                        <span style={{ fontWeight: 500 }}>{profile.region}</span>
                    </div>
                    {profile.city && (
                        <div className="info-item">
                            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>City</span>
                            <span style={{ fontWeight: 500 }}>{profile.city}</span>
                        </div>
                    )}
                </div>
            </div>

            {profile.aboutMe && (
                <div className="card animate-fade-in">
                    <span className="card-title">About Me</span>
                    <p style={{ marginTop: 'var(--spacing-sm)', color: 'var(--text-secondary)' }}>
                        {profile.aboutMe}
                    </p>
                </div>
            )}

            <div className="card animate-fade-in">
                <span className="card-title">Subscription</span>
                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        Status: <span className={`badge badge-${profile.onPause ? 'pending' : 'active'}`}>
                            {profile.onPause ? 'Paused' : 'Active'}
                        </span>
                    </p>
                    {profile.paidUntil && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)' }}>
                            Valid until: {new Date(profile.paidUntil).toLocaleDateString()}
                        </p>
                    )}
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)' }}>
                        Total Points: {profile.totalPoints} ⭐
                    </p>
                </div>
            </div>

            <button className="btn btn-secondary btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                ✏️ Edit Profile
            </button>

            <Link to="/" className="btn btn-secondary btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                ← Back to Home
            </Link>
        </div>
    );
}

export default ProfilePage;
