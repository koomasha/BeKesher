import { createContext, useContext } from "react";

export interface TelegramAuthState {
    /** Telegram's initData string (signed) for production auth */
    telegramToken: string | undefined;
    /** Session token for CI/CD/AI bypass auth */
    sessionToken: string | undefined;
    /** Auth args object to spread into every Convex function call */
    authArgs: { telegramToken?: string; sessionToken?: string };
    /** Whether auth is available (either telegramToken or sessionToken present) */
    isAuthenticated: boolean;
    /** Telegram user info from initDataUnsafe (for display purposes only) */
    telegramUser: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
    } | undefined;
}

/**
 * Read auth state from Telegram WebApp or localStorage.
 * This is called once at app startup and provides the auth context.
 */
export function getTelegramAuthState(): TelegramAuthState {
    // Check for Telegram initData (production mode)
    const telegramToken = window.Telegram?.WebApp?.initData || undefined;
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

    // Check for session token (CI/CD/AI/dev mode)
    const sessionToken = localStorage.getItem("sessionToken") || undefined;

    const authArgs: { telegramToken?: string; sessionToken?: string } = {};
    if (telegramToken) {
        authArgs.telegramToken = telegramToken;
    } else if (sessionToken) {
        authArgs.sessionToken = sessionToken;
    }

    return {
        telegramToken,
        sessionToken,
        authArgs,
        isAuthenticated: !!(telegramToken || sessionToken),
        telegramUser,
    };
}

export const TelegramAuthContext = createContext<TelegramAuthState>({
    telegramToken: undefined,
    sessionToken: undefined,
    authArgs: {},
    isAuthenticated: false,
    telegramUser: undefined,
});

export function useTelegramAuth(): TelegramAuthState {
    return useContext(TelegramAuthContext);
}
