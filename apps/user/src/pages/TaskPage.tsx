import { useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Link } from 'react-router-dom';
import { Id } from 'convex/_generated/dataModel';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { Trans, t } from '@lingui/macro';

const MAX_PHOTOS = 5;

function TaskPage() {
    const { authArgs, isAuthenticated } = useTelegramAuth();

    const assignment = useQuery(
        api.taskAssignments.getForActiveGroup,
        isAuthenticated ? authArgs : 'skip'
    );

    const submitCompletion = useMutation(api.taskAssignments.submitCompletion);
    const generateUploadUrl = useMutation(api.taskAssignments.generateUploadUrl);

    // Submission form state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [completionNotes, setCompletionNotes] = useState('');
    const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Photo handlers (mirror FeedbackPage pattern)
    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const newPhotos = Array.from(files)
            .slice(0, MAX_PHOTOS - photos.length)
            .map((file) => ({ file, preview: URL.createObjectURL(file) }));
        setPhotos([...photos, ...newPhotos]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemovePhoto = (index: number) => {
        const newPhotos = [...photos];
        URL.revokeObjectURL(newPhotos[index].preview);
        newPhotos.splice(index, 1);
        setPhotos(newPhotos);
    };

    const handleSubmit = async () => {
        if (!assignment || !completionNotes.trim()) return;

        setIsSubmitting(true);
        try {
            // Upload photos
            const storageIds: Id<'_storage'>[] = [];
            for (const photo of photos) {
                try {
                    const uploadUrl = await generateUploadUrl(authArgs);
                    const result = await fetch(uploadUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': photo.file.type },
                        body: photo.file,
                    });
                    const { storageId } = await result.json();
                    storageIds.push(storageId);
                } catch {
                    // Photo upload failed - continue without
                }
            }

            await submitCompletion({
                ...authArgs,
                assignmentId: assignment._id,
                completionNotes,
                completionPhotos: storageIds.length > 0 ? storageIds : undefined,
            });

            photos.forEach((p) => URL.revokeObjectURL(p.preview));
            setSubmitted(true);
        } catch {
            alert(t`Не удалось отправить. Попробуйте еще раз.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="page">
                <div className="card">
                    <div className="empty-state">
                        <p><Trans>Откройте приложение из Telegram</Trans></p>
                    </div>
                </div>
            </div>
        );
    }

    if (assignment === undefined) {
        return (
            <div className="page">
                <div className="loading"><div className="spinner"></div></div>
            </div>
        );
    }

    if (assignment === null) {
        return (
            <div className="page">
                <div className="page-header decorated-section">
                    <h1><Trans>Задание</Trans></h1>
                </div>
                <div className="card animate-fade-in">
                    <div className="empty-state">
                        <p><Trans>Нет активного задания</Trans></p>
                        <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)', color: 'var(--text-muted)' }}>
                            <Trans>Задания назначаются после формирования группы</Trans>
                        </p>
                    </div>
                </div>
                <Link to="/groups" className="btn btn-secondary btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                    <Trans>К группам</Trans>
                </Link>
            </div>
        );
    }

    // Success state after submission
    if (submitted) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1><Trans>Задание</Trans></h1>
                </div>
                <div className="success-state animate-fade-in">
                    <div className="success-icon-circle">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h2><Trans>Отчёт отправлен!</Trans></h2>
                    <p><Trans>Администратор скоро проверит выполнение</Trans></p>
                    <Link to="/" className="btn btn-warm btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                        <Trans>На главную</Trans>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header decorated-section">
                <h1><Trans>Задание</Trans></h1>
                <p><Trans>Выполни задание вместе с группой</Trans></p>
            </div>

            {/* Task details */}
            <div className="card animate-fade-in">
                <div className="card-header">
                    <span className="card-title">{assignment.task.title}</span>
                    <span className={`badge badge-${assignment.reviewStatus.toLowerCase()}`}>
                        {assignment.reviewStatus === 'Pending' && <Trans>Ожидает</Trans>}
                        {assignment.reviewStatus === 'Approved' && <Trans>Принято</Trans>}
                        {assignment.reviewStatus === 'Revision' && <Trans>На доработку</Trans>}
                        {assignment.reviewStatus === 'Rejected' && <Trans>Отклонено</Trans>}
                        {assignment.reviewStatus === 'NotCompleted' && <Trans>Не выполнено</Trans>}
                    </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                    {assignment.task.description}
                </p>
                {assignment.task.onlineInstructions && (
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
                            <Trans>Инструкции:</Trans>
                        </div>
                        <div style={{
                            padding: 'var(--spacing-md)',
                            backgroundColor: 'var(--bg-alt)',
                            borderRadius: 'var(--radius-md)',
                            whiteSpace: 'pre-wrap',
                            fontSize: 'var(--font-size-sm)',
                        }}>
                            {assignment.task.onlineInstructions}
                        </div>
                    </div>
                )}
                <div>
                    <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
                        <Trans>Как отчитаться:</Trans>
                    </div>
                    <div style={{
                        padding: 'var(--spacing-md)',
                        backgroundColor: 'var(--bg-warm)',
                        borderRadius: 'var(--radius-md)',
                        whiteSpace: 'pre-wrap',
                        fontSize: 'var(--font-size-sm)',
                    }}>
                        {assignment.task.reportInstructions}
                    </div>
                </div>
            </div>

            {/* Review feedback (if revision/rejected) */}
            {assignment.reviewComment && (assignment.reviewStatus === 'Revision' || assignment.reviewStatus === 'Rejected') && (
                <div className="card animate-fade-in" style={{ borderLeft: '3px solid var(--color-warning)' }}>
                    <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
                        <Trans>Комментарий проверяющего:</Trans>
                    </div>
                    <p style={{ color: 'var(--text-secondary)' }}>{assignment.reviewComment}</p>
                </div>
            )}

            {/* Approved state */}
            {assignment.reviewStatus === 'Approved' && (
                <div className="card animate-fade-in" style={{ background: 'var(--bg-warm)' }}>
                    <div className="empty-state">
                        <p style={{ fontWeight: 600 }}>
                            <Trans>Задание выполнено! +{assignment.pointsAwarded} баллов</Trans>
                        </p>
                    </div>
                </div>
            )}

            {/* Submission form (show when Pending or Revision) */}
            {(assignment.reviewStatus === 'Pending' || assignment.reviewStatus === 'Revision') && (
                <div className="card animate-fade-in">
                    <span className="card-title"><Trans>Отчёт о выполнении</Trans></span>

                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                        <textarea
                            className="input"
                            rows={4}
                            value={completionNotes}
                            onChange={(e) => setCompletionNotes(e.target.value)}
                            placeholder={t`Расскажи, как вы выполнили задание...`}
                        />
                    </div>

                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                        <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)' }}>
                            <Trans>Фотографии (необязательно)</Trans>
                        </div>
                        {photos.length > 0 && (
                            <div className="photo-grid">
                                {photos.map((photo, index) => (
                                    <div key={index} className="photo-preview">
                                        <img src={photo.preview} alt={t`Фото ${index + 1}`} />
                                        <button className="remove-photo" onClick={() => handleRemovePhoto(index)}>
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {photos.length < MAX_PHOTOS && (
                            <label className="photo-upload-button">
                                <div className="upload-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <rect x="2" y="5" width="20" height="14" rx="2" stroke="var(--color-accent)" strokeWidth="1.5"/>
                                        <circle cx="12" cy="12" r="3" stroke="var(--color-accent)" strokeWidth="1.5"/>
                                        <circle cx="17" cy="8" r="1" fill="var(--color-accent)"/>
                                    </svg>
                                </div>
                                <span><Trans>Загрузить фото</Trans></span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePhotoSelect}
                                />
                            </label>
                        )}
                        <p className="photo-count">
                            <Trans>{photos.length} / {MAX_PHOTOS} фото</Trans>
                        </p>
                    </div>

                    <button
                        className="btn btn-warm btn-full"
                        style={{ marginTop: 'var(--spacing-md)' }}
                        onClick={handleSubmit}
                        disabled={isSubmitting || !completionNotes.trim()}
                    >
                        {isSubmitting ? <Trans>Отправка...</Trans> : <Trans>Отправить отчёт</Trans>}
                    </button>

                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)', textAlign: 'center' }}>
                        <Trans>С фото: 10 баллов | Только текст: 5 баллов</Trans>
                    </p>
                </div>
            )}

            {/* Already submitted, waiting for review */}
            {assignment.completionNotes && assignment.reviewStatus === 'Pending' && (
                <div className="card animate-fade-in" style={{ background: 'var(--bg-alt)' }}>
                    <div className="empty-state">
                        <p><Trans>Отчёт отправлен, ожидает проверки</Trans></p>
                    </div>
                </div>
            )}

            <Link to="/groups" className="btn btn-secondary btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                <Trans>К группам</Trans>
            </Link>
        </div>
    );
}

export default TaskPage;
