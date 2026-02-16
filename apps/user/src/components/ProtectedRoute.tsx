import { useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { useTelegramAuth } from '../hooks/useTelegramAuth';

interface ProtectedRouteProps {
    children: ReactNode;
}

/**
 * Wrapper component that ensures users have completed their profile
 * before accessing protected routes. Redirects to /onboarding if profile is incomplete.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const navigate = useNavigate();
    const { authArgs, isAuthenticated } = useTelegramAuth();

    // Fetch user profile
    const profile = useQuery(
        api.participants.getMyProfile,
        isAuthenticated ? authArgs : 'skip'
    );

    useEffect(() => {
        // Wait for profile to load
        if (profile === undefined) return;

        // If no profile or incomplete profile, redirect to onboarding
        if (!profile || isProfileIncomplete(profile)) {
            navigate('/onboarding');
        }
    }, [profile, navigate]);

    // Helper function to check if profile is incomplete
    const isProfileIncomplete = (p: {
        phone?: string;
        birthDate?: string;
        aboutMe?: string;
        profession?: string;
        purpose?: string;
        expectations?: string;
    } | null) => {
        if (!p) return true;

        // Check for placeholder values that indicate an incomplete profile
        return (
            !p.phone || // Empty phone
            p.phone === "" || // Empty phone
            p.birthDate === "2000-01-01" || // Placeholder birthDate
            !p.aboutMe || // No aboutMe
            !p.profession || // No profession
            !p.purpose || // No purpose
            !p.expectations // No expectations
        );
    };

    // Show loading while checking profile
    if (profile === undefined) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    // Show nothing while redirecting
    if (!profile || isProfileIncomplete(profile)) {
        return null;
    }

    // Profile is complete, render the protected content
    return <>{children}</>;
}
