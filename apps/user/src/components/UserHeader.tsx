import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import './UserHeader.css';

export function UserHeader() {
    const { authArgs, isAuthenticated, telegramUser } = useTelegramAuth();

    const profile = useQuery(
        api.participants.getMyProfile,
        isAuthenticated ? authArgs : 'skip'
    );

    if (!isAuthenticated) {
        return null;
    }

    if (profile === undefined) {
        return <div className="user-header skeleton"></div>;
    }

    const displayName = profile?.name || telegramUser?.first_name || 'Friend';
    const avatarUrl = telegramUser?.photo_url;

    const initials = displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const status = profile?.status || 'Guest';
    const statusClass = status.toLowerCase();

    return (
        <div className="user-header animate-fade-in">
            <div className="user-info">
                <div className="user-avatar">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} />
                    ) : (
                        <span>{initials}</span>
                    )}
                </div>
                <div className="user-details">
                    <span className="user-name">{displayName}</span>
                    <span className={`user-status badge-${statusClass}`}>
                        {status}
                    </span>
                </div>
            </div>
            {profile && (
                <div className="user-points">
                    <span className="points-label">Points</span>
                    <span className="points-value">{profile.totalPoints}</span>
                </div>
            )}
        </div>
    );
}
