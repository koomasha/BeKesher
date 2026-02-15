import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Trans, t } from '@lingui/macro';

function MatchingPage() {
    const runMatching = useAction(api.matching.runWeeklyMatchingPublic);

    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        groupsCreated: number;
        unpaired: number;
        unpairedNames: string[];
        message?: string;
    } | null>(null);

    const handleRunMatching = async () => {
        if (!confirm(t`Are you sure you want to run the matching algorithm? This will create new groups.`)) {
            return;
        }

        setIsRunning(true);
        setResult(null);

        try {
            const matchResult = await runMatching({});
            setResult(matchResult);
        } catch (error) {
            console.error('Matching failed:', error);
            setResult({
                success: false,
                groupsCreated: 0,
                unpaired: 0,
                unpairedNames: [],
                message: t`Matching failed. Check console for details.`,
            });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title"><Trans>Run Matching</Trans></h1>
            </div>

            <div className="card">
                <h2 className="card-title"><Trans>Weekly Matching Algorithm</Trans></h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                    <Trans>This will run the matching algorithm to create new groups for this week.
                    The algorithm works in 5 stages:</Trans>
                </p>

                <ol style={{ marginLeft: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)', lineHeight: 2 }}>
                    <li><Trans><strong>Stage A:</strong> Strict matching (same region, ±10 years, no repeats)</Trans></li>
                    <li><Trans><strong>Stage B:</strong> Expanded age (same region, ±15 years, no repeats)</Trans></li>
                    <li><Trans><strong>Stage C:</strong> Allow repeats (same region, ±15 years)</Trans></li>
                    <li><Trans><strong>Stage D:</strong> Neighboring regions</Trans></li>
                    <li><Trans><strong>Stage E:</strong> Force majeure (no one left behind)</Trans></li>
                </ol>

                <button
                    className="btn btn-primary"
                    onClick={handleRunMatching}
                    disabled={isRunning}
                    style={{ fontSize: '1rem', padding: 'var(--spacing-md) var(--spacing-xl)' }}
                >
                    {isRunning ? <Trans>🔄 Running...</Trans> : <Trans>🚀 Run Matching Algorithm</Trans>}
                </button>
            </div>

            {result && (
                <div
                    className="card"
                    style={{
                        background: result.success ? 'rgba(72, 187, 120, 0.1)' : 'rgba(245, 101, 101, 0.1)',
                        border: `1px solid ${result.success ? 'var(--accent-success)' : 'var(--accent-error)'}`,
                    }}
                >
                    <h2 className="card-title">
                        {result.success ? <Trans>✅ Matching Complete</Trans> : <Trans>❌ Matching Failed</Trans>}
                    </h2>

                    {result.message && (
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                            {result.message}
                        </p>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-success)' }}>
                                {result.groupsCreated}
                            </div>
                            <div style={{ color: 'var(--text-secondary)' }}><Trans>Groups Created</Trans></div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: result.unpaired > 0 ? 'var(--accent-warning)' : 'var(--text-secondary)' }}>
                                {result.unpaired}
                            </div>
                            <div style={{ color: 'var(--text-secondary)' }}><Trans>Unpaired Participants</Trans></div>
                        </div>
                    </div>

                    {result.unpairedNames.length > 0 && (
                        <div style={{ marginTop: 'var(--spacing-lg)' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                                <Trans>Unpaired Participants:</Trans>
                            </h3>
                            <ul style={{ marginLeft: 'var(--spacing-lg)', color: 'var(--text-secondary)' }}>
                                {result.unpairedNames.map((name, i) => (
                                    <li key={i}>{name}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <div className="card">
                <h2 className="card-title"><Trans>⚠️ Important Notes</Trans></h2>
                <ul style={{ marginLeft: 'var(--spacing-lg)', lineHeight: 2, color: 'var(--text-secondary)' }}>
                    <li><Trans>Matching runs automatically every Sunday at 18:00 Israel time</Trans></li>
                    <li><Trans>Only active participants not already in groups are matched</Trans></li>
                    <li><Trans>Participants on pause are excluded</Trans></li>
                    <li><Trans>North and South regions are never matched together (Center acts as bridge)</Trans></li>
                    <li><Trans>Meeting history from the last 4 weeks is considered to avoid repeats</Trans></li>
                </ul>
            </div>
        </div>
    );
}

export default MatchingPage;
