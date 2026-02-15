import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Custom auth hook for ConvexProviderWithAuth.
 * Manages Google ID token state and implements the interface
 * expected by ConvexProviderWithAuth: { isLoading, isAuthenticated, fetchAccessToken }.
 */
export function useAdminAuth() {
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem("adminGoogleToken");
    });
    const isLoading = false;

    // Listen for storage changes across tabs and within the same tab
    useEffect(() => {
        const handleStorageChange = () => {
            setToken(localStorage.getItem("adminGoogleToken"));
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("admin-auth-change", handleStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("admin-auth-change", handleStorageChange);
        };
    }, []);

    const login = useCallback((credential: string) => {
        localStorage.setItem("adminGoogleToken", credential);
        setToken(credential);
        // Dispatch event so other hook instances (like in ConvexProvider) update immediately
        window.dispatchEvent(new Event("admin-auth-change"));
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("adminGoogleToken");
        setToken(null);
        window.dispatchEvent(new Event("admin-auth-change"));
    }, []);

    const isAuthenticated = token !== null;

    const fetchAccessToken = useCallback(
        async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
            // Always return the current token. Google ID tokens can't be
            // refreshed client-side, but we should still provide the existing
            // token so Convex can validate it. If it's expired, Convex will
            // reject it and the AuthGuard will redirect to /login.
            if (forceRefreshToken && token) {
                // Check if token is expired
                try {
                    const payload = JSON.parse(atob(token.split(".")[1]));
                    if (payload.exp && payload.exp < Date.now() / 1000) {
                        // Token expired — clear it and force re-login
                        localStorage.removeItem("adminGoogleToken");
                        setToken(null);
                        return null;
                    }
                } catch {
                    // If token parsing fails, clear it
                    localStorage.removeItem("adminGoogleToken");
                    setToken(null);
                    return null;
                }
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
