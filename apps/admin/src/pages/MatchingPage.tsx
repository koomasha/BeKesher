import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from 'convex/_generated/api';

function MatchingPage() {
    const runMatching = useAction(api.matching.runWeeklyMatching);

    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        groupsCreated: number;
        unpaired: number;
        unpairedNames: string[];
        message?: string;
    } | null>(null);

    const handleRunMatching = async () => {
        if (!confirm('Are you sure you want to run the matching algorithm? This will create new groups.')) {
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
                message: 'Matching failed. Check console for details.',
            });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Run Matching</h1>
            </div>

            <div className="card">
                <h2 className="card-title">Weekly Matching Algorithm</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                    This will run the matching algorithm to create new groups for this week.
                    The algorithm works in 5 stages:
                </p>

                <ol style={{ marginLeft: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)', lineHeight: 2 }}>
                    <li><strong>Stage A:</strong> Strict matching (same region, ±10 years, no repeats)</li>
                    <li><strong>Stage B:</strong> Expanded age (same region, ±15 years, no repeats)</li>
                    <li><strong>Stage C:</strong> Allow repeats (same region, ±15 years)</li>
                    <li><strong>Stage D:</strong> Neighboring regions</li>
                    <li><strong>Stage E:</strong> Force majeure (no one left behind)</li>
                </ol>

                <button
                    className="btn btn-primary"
                    onClick={handleRunMatching}
                    disabled={isRunning}
                    style={{ fontSize: '1rem', padding: 'var(--spacing-md) var(--spacing-xl)' }}
                >
                    {isRunning ? '🔄 Running...' : '🚀 Run Matching Algorithm'}
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
                        {result.success ? '✅ Matching Complete' : '❌ Matching Failed'}
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
                            <div style={{ color: 'var(--text-secondary)' }}>Groups Created</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: result.unpaired > 0 ? 'var(--accent-warning)' : 'var(--text-secondary)' }}>
                                {result.unpaired}
                            </div>
                            <div style={{ color: 'var(--text-secondary)' }}>Unpaired Participants</div>
                        </div>
                    </div>

                    {result.unpairedNames.length > 0 && (
                        <div style={{ marginTop: 'var(--spacing-lg)' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                                Unpaired Participants:
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
                <h2 className="card-title">⚠️ Important Notes</h2>
                <ul style={{ marginLeft: 'var(--spacing-lg)', lineHeight: 2, color: 'var(--text-secondary)' }}>
                    <li>Matching runs automatically every Sunday at 18:00 Israel time</li>
                    <li>Only active participants not already in groups are matched</li>
                    <li>Participants on pause are excluded</li>
                    <li>North and South regions are never matched together (Center acts as bridge)</li>
                    <li>Meeting history from the last 4 weeks is considered to avoid repeats</li>
                </ul>
            </div>
        </div>
    );
}

export default MatchingPage;
