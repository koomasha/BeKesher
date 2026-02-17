import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Trans } from '@lingui/macro';
import { calculateAge } from '../utils/dateUtils';
import { useLanguage } from '../hooks/useLanguage';
import { label } from '../utils/enumLabels';

function ParticipantsPage() {
    const { locale } = useLanguage();
    const [regionFilter, setRegionFilter] = useState<string>('');

    const participants = useQuery(api.participants.list, {
        region: regionFilter || undefined,
    });

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title"><Trans>Participants</Trans></h1>
                <span style={{ color: 'var(--text-secondary)' }}>
                    <Trans>{participants?.length || 0} total</Trans>
                </span>
            </div>

            <div className="filter-bar">
                <div className="filter-group">
                    <label className="filter-label"><Trans>Region:</Trans></label>
                    <select
                        className="input"
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                    >
                        <option value=""><Trans>All</Trans></option>
                        <option value="North"><Trans>North</Trans></option>
                        <option value="Center"><Trans>Center</Trans></option>
                        <option value="South"><Trans>South</Trans></option>
                    </select>
                </div>
            </div>

            <div className="card">
                {participants === undefined ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : participants.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                        <Trans>No participants found.</Trans>
                    </p>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th><Trans>Name</Trans></th>
                                    <th><Trans>Age</Trans></th>
                                    <th><Trans>Gender</Trans></th>
                                    <th><Trans>Region</Trans></th>
                                    <th><Trans>Paused</Trans></th>
                                    <th><Trans>Paid Until</Trans></th>
                                    <th><Trans>Actions</Trans></th>
                                </tr>
                            </thead>
                            <tbody>
                                {participants.map((p) => (
                                    <tr key={p._id}>
                                        <td>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{p.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {p.telegramId}
                                                </div>
                                            </div>
                                        </td>
                                        <td>{calculateAge(p.birthDate)}</td>
                                        <td>{label(locale, p.gender)}</td>
                                        <td>{label(locale, p.region)}</td>
                                        <td>{p.onPause ? <Trans>⏸️ Yes</Trans> : '-'}</td>
                                        <td>
                                            {p.paidUntil
                                                ? new Date(p.paidUntil).toLocaleDateString()
                                                : '-'
                                            }
                                        </td>
                                        <td>
                                            <button className="btn btn-secondary" style={{ marginRight: 'var(--spacing-xs)' }}>
                                                <Trans>View</Trans>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ParticipantsPage;
