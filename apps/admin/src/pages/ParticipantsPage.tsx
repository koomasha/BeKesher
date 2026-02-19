import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Trans, t } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { Id } from 'convex/_generated/dataModel';
import { calculateAge } from '../utils/dateUtils';
import { useLanguage } from '../hooks/useLanguage';
import { label } from '../utils/enumLabels';

function ParticipantsPage() {
    const { locale } = useLanguage();
    const { _ } = useLingui();
    const [regionFilter, setRegionFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [seasonFilter, setSeasonFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [numberFilter, setNumberFilter] = useState<string>('');
    const [selectedParticipantId, setSelectedParticipantId] = useState<Id<"participants"> | null>(null);

    const participants = useQuery(api.participants.list, {
        region: regionFilter || undefined,
        status: statusFilter || undefined,
    });
    const openSeasonEnrollments = useQuery(api.seasonParticipants.listEnrollmentsForOpenSeasons);

    // Build map: participantId → [{seasonId, seasonName, seasonStatus}]
    const participantSeasonMap = useMemo(() => {
        const map = new Map<string, Array<{ seasonId: string; seasonName: string; seasonStatus: string }>>();
        if (!openSeasonEnrollments) return map;
        for (const e of openSeasonEnrollments) {
            const existing = map.get(e.participantId) || [];
            existing.push({ seasonId: e.seasonId, seasonName: e.seasonName, seasonStatus: e.seasonStatus });
            map.set(e.participantId, existing);
        }
        return map;
    }, [openSeasonEnrollments]);

    // Extract unique seasons for the filter dropdown
    const availableSeasons = useMemo(() => {
        if (!openSeasonEnrollments) return [];
        const seen = new Map<string, { seasonId: string; seasonName: string; seasonStatus: string }>();
        for (const e of openSeasonEnrollments) {
            if (!seen.has(e.seasonId)) {
                seen.set(e.seasonId, { seasonId: e.seasonId, seasonName: e.seasonName, seasonStatus: e.seasonStatus });
            }
        }
        return Array.from(seen.values());
    }, [openSeasonEnrollments]);

    // Client-side search and season filtering
    const filteredParticipants = useMemo(() => {
        if (!participants) return undefined;
        let result = participants;

        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            result = result.filter((p) => p.name.toLowerCase().includes(q));
        }

        if (seasonFilter) {
            const enrolledIds = new Set(
                openSeasonEnrollments
                    ?.filter((e) => e.seasonId === seasonFilter)
                    .map((e) => e.participantId)
            );
            result = result.filter((p) => enrolledIds.has(p._id));
        }

        if (numberFilter.trim()) {
            const targetNumber = parseInt(numberFilter.trim(), 10);
            if (!isNaN(targetNumber) && targetNumber > 0 && targetNumber <= result.length) {
                result = [result[targetNumber - 1]];
            } else {
                result = [];
            }
        }

        return result;
    }, [participants, searchQuery, seasonFilter, numberFilter, openSeasonEnrollments]);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title"><Trans>Participants</Trans></h1>
                <span style={{ color: 'var(--text-secondary)' }}>
                    <Trans>{filteredParticipants?.length || 0} total</Trans>
                </span>
            </div>

            <div className="filter-bar">
                <div className="filter-group">
                    <label className="filter-label">#:</label>
                    <input
                        type="number"
                        className="input"
                        value={numberFilter}
                        onChange={(e) => setNumberFilter(e.target.value)}
                        placeholder={_(t`Filter by #...`)}
                        min="1"
                    />
                </div>
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
                <div className="filter-group">
                    <label className="filter-label"><Trans>Status:</Trans></label>
                    <select
                        className="input"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value=""><Trans>All</Trans></option>
                        <option value="Lead">Lead</option>
                        <option value="Active"><Trans>Active</Trans></option>
                        <option value="Inactive"><Trans>Inactive</Trans></option>
                    </select>
                </div>
                <div className="filter-group">
                    <label className="filter-label"><Trans>Season:</Trans></label>
                    <select
                        className="input"
                        value={seasonFilter}
                        onChange={(e) => setSeasonFilter(e.target.value)}
                    >
                        <option value=""><Trans>All</Trans></option>
                        {availableSeasons.map((s) => (
                            <option key={s.seasonId} value={s.seasonId}>
                                {s.seasonName}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label className="filter-label"><Trans>Search:</Trans></label>
                    <input
                        type="text"
                        className="input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={_(t`Search by name...`)}
                    />
                </div>
            </div>

            <div className="card">
                {filteredParticipants === undefined ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : filteredParticipants.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                        <Trans>No participants found.</Trans>
                    </p>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: '60px' }}>#</th>
                                    <th><Trans>Name</Trans></th>
                                    <th><Trans>Age</Trans></th>
                                    <th><Trans>Gender</Trans></th>
                                    <th><Trans>Region</Trans></th>
                                    <th><Trans>Status</Trans></th>
                                    <th><Trans>Season</Trans></th>
                                    <th><Trans>Paused</Trans></th>
                                    <th><Trans>Paid Until</Trans></th>
                                    <th><Trans>Actions</Trans></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredParticipants.map((p, index) => {
                                    const seasons = participantSeasonMap.get(p._id);
                                    const isEnrolled = !!seasons && seasons.length > 0;
                                    return (
                                        <tr key={p._id}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                {index + 1}
                                            </td>
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
                                            <td>
                                                <span className={`badge badge-${p.status.toLowerCase()}`}>
                                                    {label(locale, p.status)}
                                                </span>
                                            </td>
                                            <td>
                                                {isEnrolled
                                                    ? seasons.map((s) => (
                                                        <span
                                                            key={s.seasonId}
                                                            className={`badge badge-${s.seasonStatus === 'Active' ? 'active' : 'lead'}`}
                                                            style={{ marginRight: '4px' }}
                                                        >
                                                            {s.seasonName}
                                                        </span>
                                                    ))
                                                    : '-'
                                                }
                                            </td>
                                            <td>
                                                {p.onPause ? (
                                                    <span className="badge" style={{ background: 'var(--accent-error)', color: 'white' }}>
                                                        {locale === 'ru' ? 'Да' : 'Yes'}
                                                    </span>
                                                ) : isEnrolled ? (
                                                    <span className="badge" style={{ background: 'var(--accent-success)', color: 'white' }}>
                                                        {locale === 'ru' ? 'Нет' : 'No'}
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td>
                                                {p.paidUntil
                                                    ? new Date(p.paidUntil).toLocaleDateString()
                                                    : '-'
                                                }
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => setSelectedParticipantId(p._id)}
                                                >
                                                    <Trans>View</Trans>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedParticipantId && (
                <ParticipantDetailModal
                    participantId={selectedParticipantId}
                    onClose={() => setSelectedParticipantId(null)}
                />
            )}
        </div>
    );
}

function ParticipantDetailModal({
    participantId,
    onClose,
}: {
    participantId: Id<"participants">;
    onClose: () => void;
}) {
    const { locale } = useLanguage();
    const { _ } = useLingui();
    const [isEditing, setIsEditing] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);

    const participant = useQuery(api.participants.getById, { participantId });
    const activeSeason = useQuery(api.seasons.getActive);
    const seasonHistory = useQuery(api.seasonParticipants.listForParticipant, { participantId });
    const adminUpdate = useMutation(api.participants.adminUpdate);
    const enrollInSeason = useMutation(api.seasonParticipants.enroll);

    // Close on ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Check if participant is already enrolled in the active season
    const isAlreadyEnrolled = activeSeason && seasonHistory?.some(
        (enrollment) => enrollment.seasonId === activeSeason._id
    );

    // Edit form state
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editRegion, setEditRegion] = useState('');
    const [editCity, setEditCity] = useState('');
    const [editGender, setEditGender] = useState('');
    const [editStatus, setEditStatus] = useState('');
    const [editOnPause, setEditOnPause] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const startEditing = () => {
        if (!participant) return;
        setEditName(participant.name);
        setEditPhone(participant.phone);
        setEditEmail(participant.email || '');
        setEditRegion(participant.region);
        setEditCity(participant.city || '');
        setEditGender(participant.gender);
        setEditStatus(participant.status);
        setEditOnPause(participant.onPause);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!participant) return;
        setIsSaving(true);
        try {
            await adminUpdate({
                participantId,
                name: editName !== participant.name ? editName : undefined,
                phone: editPhone !== participant.phone ? editPhone : undefined,
                email: editEmail !== (participant.email || '') ? editEmail || undefined : undefined,
                region: editRegion !== participant.region ? editRegion as "North" | "Center" | "South" : undefined,
                city: editCity !== (participant.city || '') ? editCity || undefined : undefined,
                gender: editGender !== participant.gender ? editGender as "Male" | "Female" | "Other" : undefined,
                status: editStatus !== participant.status ? editStatus as "Lead" | "Active" | "Inactive" : undefined,
                onPause: editOnPause !== participant.onPause ? editOnPause : undefined,
            });
            setIsEditing(false);
        } catch (error) {
            alert(`Error: ${error}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEnroll = async () => {
        if (!activeSeason) return;
        setIsEnrolling(true);
        try {
            await enrollInSeason({
                seasonId: activeSeason._id,
                participantId,
            });
            alert(locale === 'ru' ? 'Участник зачислён в сезон!' : 'Participant enrolled in season!');
        } catch (error) {
            alert(`Error: ${error}`);
        } finally {
            setIsEnrolling(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isEditing ? <Trans>Edit Participant</Trans> : <Trans>Participant Details</Trans>}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div>
                    {participant === undefined ? (
                        <div className="loading">
                            <div className="spinner"></div>
                        </div>
                    ) : participant === null ? (
                        <p style={{ color: 'var(--text-secondary)' }}><Trans>Participant not found.</Trans></p>
                    ) : isEditing ? (
                        <>
                            <div className="form-group">
                                <label className="form-label"><Trans>Name</Trans></label>
                                <input
                                    type="text"
                                    className="input"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label"><Trans>Phone</Trans></label>
                                <input
                                    type="text"
                                    className="input"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label"><Trans>Email</Trans></label>
                                <input
                                    type="email"
                                    className="input"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div className="form-group">
                                    <label className="form-label"><Trans>Region</Trans></label>
                                    <select
                                        className="input"
                                        value={editRegion}
                                        onChange={(e) => setEditRegion(e.target.value)}
                                    >
                                        <option value="North"><Trans>North</Trans></option>
                                        <option value="Center"><Trans>Center</Trans></option>
                                        <option value="South"><Trans>South</Trans></option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><Trans>City</Trans></label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={editCity}
                                        onChange={(e) => setEditCity(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div className="form-group">
                                    <label className="form-label"><Trans>Gender</Trans></label>
                                    <select
                                        className="input"
                                        value={editGender}
                                        onChange={(e) => setEditGender(e.target.value)}
                                    >
                                        <option value="Male"><Trans>Male</Trans></option>
                                        <option value="Female"><Trans>Female</Trans></option>
                                        <option value="Other"><Trans>Other</Trans></option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><Trans>Status</Trans></label>
                                    <select
                                        className="input"
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value)}
                                    >
                                        <option value="Lead">Lead</option>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={editOnPause}
                                        onChange={(e) => setEditOnPause(e.target.checked)}
                                    />
                                    <Trans>On Pause</Trans>
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setIsEditing(false)}
                                    disabled={isSaving}
                                >
                                    <Trans>Cancel</Trans>
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? <Trans>Saving...</Trans> : <Trans>Save</Trans>}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                                <DetailField label={_(t`Name`)} value={participant.name} />
                                <DetailField label={_(t`Telegram ID`)} value={participant.telegramId} />
                                <DetailField label={_(t`Phone`)} value={participant.phone} />
                                <DetailField label={_(t`Email`)} value={participant.email || '-'} />
                                <DetailField label={_(t`Age`)} value={String(calculateAge(participant.birthDate))} />
                                <DetailField label={_(t`Birth Date`)} value={participant.birthDate} />
                                <DetailField label={_(t`Gender`)} value={label(locale, participant.gender)} />
                                <DetailField label={_(t`Region`)} value={label(locale, participant.region)} />
                                <DetailField label={_(t`City`)} value={participant.city || '-'} />
                                <DetailField label={_(t`Status`)} value={label(locale, participant.status)} />
                                <DetailField label={_(t`On Pause`)} value={participant.onPause ? (locale === 'ru' ? 'Да' : 'Yes') : (locale === 'ru' ? 'Нет' : 'No')} />
                                <DetailField label={_(t`Points`)} value={String(participant.totalPoints)} />
                                <DetailField
                                    label={_(t`Paid Until`)}
                                    value={participant.paidUntil ? new Date(participant.paidUntil).toLocaleDateString() : '-'}
                                />
                                <DetailField
                                    label={_(t`Registered`)}
                                    value={participant.registrationDate ? new Date(participant.registrationDate).toLocaleDateString() : '-'}
                                />
                            </div>
                            {participant.aboutMe && (
                                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                        <Trans>About</Trans>
                                    </div>
                                    <div style={{ fontSize: '0.875rem' }}>{participant.aboutMe}</div>
                                </div>
                            )}
                            {participant.profession && (
                                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                        <Trans>Profession</Trans>
                                    </div>
                                    <div style={{ fontSize: '0.875rem' }}>{participant.profession}</div>
                                </div>
                            )}
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                                    <Trans>Season History</Trans>
                                </div>
                                {seasonHistory === undefined ? (
                                    <div className="loading"><div className="spinner"></div></div>
                                ) : seasonHistory.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        <Trans>Not enrolled in any season.</Trans>
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                        {seasonHistory.map((enrollment) => (
                                            <div
                                                key={enrollment._id}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                                    background: 'var(--bg-primary)',
                                                    borderRadius: 'var(--radius-md)',
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                                        {enrollment.seasonName}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <span className={`badge badge-${enrollment.status.toLowerCase()}`}>
                                                    {label(locale, enrollment.status)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions">
                                {activeSeason && !isAlreadyEnrolled && (
                                    <button
                                        className="btn btn-success"
                                        onClick={handleEnroll}
                                        disabled={isEnrolling}
                                    >
                                        {isEnrolling
                                            ? <Trans>Enrolling...</Trans>
                                            : <><Trans>Enroll in</Trans> {activeSeason.name}</>
                                        }
                                    </button>
                                )}
                                <button className="btn btn-primary" onClick={startEditing}>
                                    <Trans>Edit</Trans>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                {label}
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{value}</div>
        </div>
    );
}

export default ParticipantsPage;
