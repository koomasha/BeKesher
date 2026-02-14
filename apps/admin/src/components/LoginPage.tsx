import { GoogleLogin } from "@react-oauth/google";

interface LoginPageProps {
    onLogin: (credential: string) => void;
}

function LoginPage({ onLogin }: LoginPageProps) {
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
                    BeKesher Admin
                </h1>
                <p
                    style={{
                        color: "var(--text-secondary)",
                        marginBottom: "32px",
                        fontSize: "14px",
                    }}
                >
                    Sign in with your Google account to continue
                </p>
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <GoogleLogin
                        onSuccess={(credentialResponse) => {
                            if (credentialResponse.credential) {
                                onLogin(credentialResponse.credential);
                            }
                        }}
                        onError={() => {
                            console.error("Google login failed");
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
