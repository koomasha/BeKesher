import { useCallback, useMemo, useState } from "react";

/**
 * Custom auth hook for ConvexProviderWithAuth.
 * Manages Google ID token state and implements the interface
 * expected by ConvexProviderWithAuth: { isLoading, isAuthenticated, fetchAccessToken }.
 */
export function useAdminAuth() {
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem("adminGoogleToken");
    });
    const [isLoading, setIsLoading] = useState(false);

    const login = useCallback((credential: string) => {
        localStorage.setItem("adminGoogleToken", credential);
        setToken(credential);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("adminGoogleToken");
        setToken(null);
    }, []);

    const isAuthenticated = token !== null;

    const fetchAccessToken = useCallback(
        async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
            if (forceRefreshToken) {
                // Google ID tokens can't be refreshed client-side.
                // If forced refresh is needed, user must re-login.
                return null;
            }
            return token;
        },
        [token]
    );

    return useMemo(
        () => ({
            isLoading,
            isAuthenticated,
            fetchAccessToken,
            login,
            logout,
        }),
        [isLoading, isAuthenticated, fetchAccessToken, login, logout]
    );
}
