/**
 * Playwright helpers for Convex Auth Bypass.
 * Used for CI/CD and AI agent testing.
 */

interface BypassSessionResponse {
    token: string;
    telegramId: string;
}

/**
 * Creates a bypass session for Testing/CI/CD.
 * Uses the HTTP endpoint exposed by the Convex backend.
 * 
 * @param convexUrl - The URL of the Convex deployment (e.g. https://happy-otter-123.convex.cloud)
 * @param bypassSecret - The secret key for bypassing auth (must match AUTH_BYPASS_SECRET env var)
 * @param telegramId - The Telegram ID to simulate
 * @param source - The source of the request (default: "cicd")
 * @returns The session token to be used in the client
 */
export async function createTestUserSession(
    convexUrl: string,
    bypassSecret: string,
    telegramId: string,
    source: "cicd" | "ai" | "dev" = "cicd"
): Promise<string> {
    const endpoint = `${convexUrl}/http/auth/bypass-session`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            secret: bypassSecret,
            telegramId,
            source,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `Failed to create bypass session: ${response.status} ${response.statusText}\n${errorText}`
        );
    }

    const data = (await response.json()) as BypassSessionResponse;
    return data.token;
}

/**
 * Helper to inject the session token into the page context.
 * This simulates a user arriving with a valid session.
 * 
 * @param page - Playwright Page object
 * @param token - The session token from createTestUserSession
 */
export async function injectSessionToken(page: any, token: string) {
    // Navigate to the app with the token query param
    // The useTelegramAuth hook will pick it up and store it in localStorage
    await page.goto(`/?token=${token}`);

    // Alternatively, set it directly in localStorage before navigation if the app supports it
    // await page.addInitScript((token) => {
    //   localStorage.setItem("convex_session_token", token);
    // }, token);
}
