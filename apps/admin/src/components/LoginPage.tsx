import { useEffect, useRef, useState } from "react";
import { Trans, t } from '@lingui/macro';

interface LoginPageProps {
    onLogin: (credential: string) => void;
}

// Type declarations for Google Identity Services
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: { credential: string }) => void;
                        auto_select?: boolean;
                    }) => void;
                    renderButton: (
                        parent: HTMLElement,
                        options: {
                            type?: "standard" | "icon";
                            theme?: "outline" | "filled_blue" | "filled_black";
                            size?: "large" | "medium" | "small";
                            text?: "signin_with" | "signup_with" | "continue_with" | "signin";
                            shape?: "rectangular" | "pill" | "circle" | "square";
                            width?: number;
                        }
                    ) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

/**
 * Admin login page using Google Identity Services directly.
 *
 * Instead of using the <GoogleLogin> component from @react-oauth/google
 * (which loads an iframe that can cause "origin not allowed" errors),
 * this component uses google.accounts.id.renderButton() to render
 * the Google Sign-In button natively in the DOM. This avoids all
 * iframe-related origin issues while still returning the id_token (JWT)
 * that Convex needs for OIDC authentication.
 */
function LoginPage({ onLogin }: LoginPageProps) {
    const googleBtnRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [gsiLoaded, setGsiLoaded] = useState(false);

    useEffect(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

        const initializeGsi = () => {
            if (!window.google?.accounts?.id || !googleBtnRef.current) return;

            try {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: (response) => {
                        if (response.credential) {
                            setError(null);
                            onLogin(response.credential);
                        } else {
                            setError(t`No credential received. Please try again.`);
                        }
                    },
                });

                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    type: "standard",
                    theme: "outline",
                    size: "large",
                    text: "signin_with",
                    shape: "rectangular",
                    width: 280,
                });

                setGsiLoaded(true);
            } catch (err) {
                setError(t`Failed to load Google Sign-In. Please refresh.`);
            }
        };

        // Check if GSI script is already loaded
        if (window.google?.accounts?.id) {
            initializeGsi();
            return;
        }

        // Load GSI script dynamically
        let script = document.querySelector(
            'script[src="https://accounts.google.com/gsi/client"]'
        ) as HTMLScriptElement | null;

        if (script) {
            script.addEventListener("load", initializeGsi);
            // Try initializing in case it's already loaded or loads immediately
            initializeGsi();
        } else {
            script = document.createElement("script");
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.addEventListener("load", initializeGsi);
            script.onerror = () => {
                setError(t`Failed to load Google Sign-In script.`);
            };
            document.head.appendChild(script);
        }

        return () => {
            if (script) {
                script.removeEventListener("load", initializeGsi);
            }
        };
    }, [onLogin]);

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                background: "var(--bg-primary)",
            }}
        >
            <div
                style={{
                    background: "var(--bg-secondary)",
                    borderRadius: "12px",
                    padding: "48px",
                    boxShadow: "var(--shadow-md)",
                    textAlign: "center",
                    maxWidth: "400px",
                    width: "100%",
                }}
            >
                <h1
                    style={{
                        fontSize: "24px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: "8px",
                    }}
                >
                    <Trans>BeKesher Admin</Trans>
                </h1>
                <p
                    style={{
                        color: "var(--text-secondary)",
                        marginBottom: "32px",
                        fontSize: "14px",
                    }}
                >
                    <Trans>Sign in with your Google account to continue</Trans>
                </p>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        minHeight: "44px",
                        alignItems: "center",
                    }}
                >
                    {!gsiLoaded && !error && (
                        <div
                            style={{
                                color: "var(--text-secondary)",
                                fontSize: "14px",
                            }}
                        >
                            <Trans>Loading...</Trans>
                        </div>
                    )}
                    <div ref={googleBtnRef} />
                </div>
                {error && (
                    <p
                        style={{
                            color: "var(--accent-error)",
                            marginTop: "16px",
                            fontSize: "13px",
                        }}
                    >
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}

export default LoginPage;
