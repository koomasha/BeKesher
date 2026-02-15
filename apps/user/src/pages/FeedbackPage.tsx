import { useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Link } from 'react-router-dom';
import { Id } from 'convex/_generated/dataModel';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { Trans, t } from '@lingui/macro';

const TOTAL_STEPS = 6;
const MAX_PHOTOS = 5;

// Rocket Rating Component
function RocketRating({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const getRatingFromPosition = (clientY: number) => {
        if (!trackRef.current) return 1;

        const rect = trackRef.current.getBoundingClientRect();
        const trackHeight = rect.height;
        const relativeY = clientY - rect.top;

        // Invert Y (bottom = 1, top = 10)
        const percentage = Math.max(0, Math.min(1, 1 - relativeY / trackHeight));
        const newRating = Math.max(1, Math.min(10, Math.round(percentage * 9 + 1)));

        return newRating;
    };

    const handleStart = (clientY: number) => {
        setIsDragging(true);
        const newRating = getRatingFromPosition(clientY);
        onRatingChange(newRating);
    };

    const handleMove = (clientY: number) => {
        if (!isDragging) return;
        const newRating = getRatingFromPosition(clientY);
        onRatingChange(newRating);
    };

    const handleEnd = () => {
        setIsDragging(false);
    };

    // Mouse events
    const handleMouseDown = (e: React.MouseEvent) => {
        handleStart(e.clientY);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        handleMove(e.clientY);
    };

    const handleMouseUp = () => {
        handleEnd();
    };

    // Touch events
    const handleTouchStart = (e: React.TouchEvent) => {
        handleStart(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        handleMove(e.touches[0].clientY);
    };

    const handleTouchEnd = () => {
        handleEnd();
    };

    // Calculate rocket position (0 = bottom, 1 = top)
    const rocketPosition = rating === 0 ? 0 : (rating - 1) / 9;

    return (
        <div className="rocket-rating-container">
            <div className="rocket-rating-value">{rating > 0 ? rating : '?'}</div>
            <div
                ref={trackRef}
                className="rocket-track"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="rocket-trail" style={{ height: `${rocketPosition * 100}%` }} />
                <div
                    className={`rocket ${isDragging ? 'dragging' : ''}`}
                    style={{
                        bottom: `${rocketPosition * 100}%`,
                        filter: `drop-shadow(0 0 ${rocketPosition * 20}px rgba(255, 127, 80, ${rocketPosition * 0.8}))`,
                    }}
                >
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C12 2 4 8 4 14c0 3 2 6 4 7l1-3h6l1 3c2-1 4-4 4-7 0-6-8-12-8-12z" fill="#FF7F50"/>
                        <path d="M12 2C12 2 8 6 8 11c0 2 1 4 2 5h4c1-1 2-3 2-5 0-5-4-9-4-9z" fill="#33BECC" opacity="0.6"/>
                        <circle cx="12" cy="10" r="2" fill="white"/>
                    </svg>
                </div>
            </div>
        </div>
    );
}

function FeedbackPage() {
    const { authArgs, isAuthenticated } = useTelegramAuth();

    const pendingFeedback = useQuery(
        api.feedback.getPendingFeedback,
        isAuthenticated ? authArgs : 'skip'
    );

    const submitFeedbackMutation = useMutation(api.feedback.submitFeedback);
    const generateUploadUrl = useMutation(api.feedback.generateUploadUrl);

    // State
    const [selectedGroup, setSelectedGroup] = useState<Id<'groups'> | null>(null);
    const [step, setStep] = useState(0); // 0-5 for 6 wizard steps
    const [rating, setRating] = useState(0);
    const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
    const [taskEffect, setTaskEffect] = useState<string | null>(null);
    const [wouldMeetAgain, setWouldMeetAgain] = useState<string | null>(null);
    const [textFeedback, setTextFeedback] = useState('');
    const [improvementSuggestion, setImprovementSuggestion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset form state
    const resetForm = () => {
        setSelectedGroup(null);
        setStep(0);
        setRating(0);
        setPhotos([]);
        setTaskEffect(null);
        setWouldMeetAgain(null);
        setTextFeedback('');
        setImprovementSuggestion('');
    };

    // Handle photo selection
    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newPhotos = Array.from(files).slice(0, MAX_PHOTOS - photos.length).map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));

        setPhotos([...photos, ...newPhotos]);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle photo removal
    const handleRemovePhoto = (index: number) => {
        const newPhotos = [...photos];
        URL.revokeObjectURL(newPhotos[index].preview);
        newPhotos.splice(index, 1);
        setPhotos(newPhotos);
    };

    // Navigation
    const handleNext = () => {
        if (step < TOTAL_STEPS - 1) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    // Submit handler
    const handleSubmit = async () => {
        if (!selectedGroup) return;

        setIsSubmitting(true);
        try {
            // Upload photos if any
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
                } catch (error) {
                    // Photo upload failed - continue without this photo
                }
            }

            // Submit feedback
            await submitFeedbackMutation({
                ...authArgs,
                groupId: selectedGroup,
                rating,
                textFeedback: textFeedback || undefined,
                wouldMeetAgain: wouldMeetAgain || undefined,
                photos: storageIds.length > 0 ? storageIds : undefined,
                taskEffect: taskEffect || undefined,
                improvementSuggestion: improvementSuggestion || undefined,
            });

            // Clean up photo previews
            photos.forEach((photo) => URL.revokeObjectURL(photo.preview));

            // Reset state
            resetForm();
            setSubmitted(true);
        } catch (error) {
            alert(t`Не удалось отправить отзыв. Пожалуйста, попробуйте еще раз.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Cancel and go back to group selection
    const handleCancel = () => {
        photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
        resetForm();
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

    if (pendingFeedback === undefined) {
        return (
            <div className="page">
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1><Trans>Обратная связь</Trans></h1>
                </div>
                <div className="success-state animate-fade-in">
                    <div className="success-icon-circle">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <h2><Trans>Спасибо за отзыв!</Trans></h2>
                    <p><Trans>Ты получил(а) 10 баллов!</Trans></p>
                    <button
                        className="btn btn-warm btn-full"
                        onClick={() => setSubmitted(false)}
                    >
                        <Trans>Оставить ещё отзыв</Trans>
                    </button>
                    <Link to="/" className="btn btn-secondary btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                        <Trans>На главную</Trans>
                    </Link>
                </div>
            </div>
        );
    }

    if (pendingFeedback.length === 0) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1><Trans>Обратная связь</Trans></h1>
                </div>
                <div className="card animate-fade-in">
                    <div className="empty-state">
                        <p><Trans>Нет ожидающих отзывов</Trans></p>
                        <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)', color: 'var(--text-muted)' }}>
                            <Trans>Ты в курсе всех дел!</Trans>
                        </p>
                    </div>
                </div>
                <Link to="/" className="btn btn-secondary btn-full">
                    <Trans>На главную</Trans>
                </Link>
            </div>
        );
    }

    if (!selectedGroup) {
        return (
            <div className="page">
                <div className="page-header decorated-section">
                    <h1><Trans>Обратная связь</Trans></h1>
                    <p><Trans>Поделись впечатлениями</Trans></p>
                </div>
                <div className="card animate-fade-in">
                    <span className="card-title"><Trans>Выбери группу для оценки:</Trans></span>
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                        {pendingFeedback.map((group) => (
                            <button
                                key={group.groupId}
                                className="btn btn-secondary btn-full"
                                style={{ marginBottom: 'var(--spacing-sm)', textAlign: 'left' }}
                                onClick={() => setSelectedGroup(group.groupId)}
                            >
                                <div>
                                    <div style={{ fontWeight: 500 }}>
                                        {new Date(group.groupCreatedAt).toLocaleDateString('ru-RU')}
                                    </div>
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                        <Trans>С: {group.members.join(', ')}</Trans>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <Link to="/" className="btn btn-secondary btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                    <Trans>На главную</Trans>
                </Link>
            </div>
        );
    }

    // Wizard view
    const canProceed = () => {
        if (step === 0) return rating > 0;
        if (step === 2) return taskEffect !== null;
        if (step === 3) return wouldMeetAgain !== null;
        return true;
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1><Trans>Обратная связь</Trans></h1>
            </div>

            <div className="wizard-container">
                {/* Progress indicator */}
                <div className="wizard-progress">
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => i).map((s, i) => (
                        <div key={s}>
                            <div className={`wizard-step ${s === step ? 'active' : s < step ? 'completed' : ''}`}>
                                {s < step ? '\u2713' : s + 1}
                            </div>
                            {i < TOTAL_STEPS - 1 && <div className={`wizard-divider ${s < step ? 'completed' : ''}`} />}
                        </div>
                    ))}
                </div>

                {/* Cancel link */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <button onClick={handleCancel} className="btn btn-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                        <Trans>Назад к выбору группы</Trans>
                    </button>
                </div>

                {/* Step content */}
                <div className="wizard-content animate-fade-in">
                    {step === 0 && (
                        <>
                            <h2 className="wizard-title"><Trans>Дай оценку этой недели</Trans></h2>
                            <p className="wizard-subtitle"><Trans>Подними ракету вверх!</Trans></p>
                            <RocketRating rating={rating} onRatingChange={setRating} />
                            <div className="rating-labels">
                                <span><Trans>Полный отстой</Trans></span>
                                <span><Trans>Не хочу чтобы заканчивалась</Trans></span>
                            </div>
                        </>
                    )}

                    {step === 1 && (
                        <>
                            <h2 className="wizard-title"><Trans>Загрузи фотку с вашей встречи</Trans></h2>
                            <p className="wizard-subtitle"><Trans>(если хочешь)</Trans></p>
                            <div className="photo-upload">
                                {photos.length > 0 && (
                                    <div className="photo-grid">
                                        {photos.map((photo, index) => (
                                            <div key={index} className="photo-preview">
                                                <img src={photo.preview} alt={t`Preview ${index + 1}`} />
                                                <button
                                                    className="remove-photo"
                                                    onClick={() => handleRemovePhoto(index)}
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {photos.length < MAX_PHOTOS && (
                                    <label className="photo-upload-button">
                                        <div className="upload-icon">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="var(--color-accent)" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="var(--color-accent)" strokeWidth="1.5"/><circle cx="17" cy="8" r="1" fill="var(--color-accent)"/></svg>
                                        </div>
                                        <span><Trans>Нажми для загрузки</Trans></span>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handlePhotoSelect}
                                        />
                                    </label>
                                )}
                                <p className="photo-count"><Trans>{photos.length} / {MAX_PHOTOS} фотографий</Trans></p>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <h2 className="wizard-title"><Trans>Как задание повлияло на ваше общение?</Trans></h2>
                            <div className="choice-group">
                                <button
                                    className={`choice-button ${taskEffect === 'deeper' ? 'selected' : ''}`}
                                    onClick={() => setTaskEffect('deeper')}
                                >
                                    <div className="choice-icon-circle choice-icon-teal">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M17 11h-4V7a1 1 0 00-2 0v4H7a1 1 0 000 2h4v4a1 1 0 002 0v-4h4a1 1 0 000-2z" fill="currentColor"/></svg>
                                    </div>
                                    <span><Trans>Сделало общение глубже</Trans></span>
                                </button>
                                <button
                                    className={`choice-button ${taskEffect === 'fun' ? 'selected' : ''}`}
                                    onClick={() => setTaskEffect('fun')}
                                >
                                    <div className="choice-icon-circle choice-icon-coral">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>
                                    </div>
                                    <span><Trans>Добавило веселья</Trans></span>
                                </button>
                                <button
                                    className={`choice-button ${taskEffect === 'not_fit' ? 'selected' : ''}`}
                                    onClick={() => setTaskEffect('not_fit')}
                                >
                                    <div className="choice-icon-circle choice-icon-muted">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/></svg>
                                    </div>
                                    <span><Trans>Не очень подошло</Trans></span>
                                </button>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <h2 className="wizard-title"><Trans>Хочешь встретиться с этим партнером снова?</Trans></h2>
                            <div className="choice-group">
                                <button
                                    className={`choice-button ${wouldMeetAgain === 'yes' ? 'selected' : ''}`}
                                    onClick={() => setWouldMeetAgain('yes')}
                                >
                                    <div className="choice-icon-circle choice-icon-teal">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </div>
                                    <span><Trans>Да</Trans></span>
                                </button>
                                <button
                                    className={`choice-button ${wouldMeetAgain === 'no' ? 'selected' : ''}`}
                                    onClick={() => setWouldMeetAgain('no')}
                                >
                                    <div className="choice-icon-circle choice-icon-coral">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                    </div>
                                    <span><Trans>Нет</Trans></span>
                                </button>
                                <button
                                    className={`choice-button ${wouldMeetAgain === 'maybe' ? 'selected' : ''}`}
                                    onClick={() => setWouldMeetAgain('maybe')}
                                >
                                    <div className="choice-icon-circle choice-icon-muted">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M9 10c0-1.7 1.3-3 3-3s3 1.3 3 3c0 1.2-.7 2-1.5 2.5-.5.3-1.5.5-1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="0.5"/></svg>
                                    </div>
                                    <span><Trans>Может быть</Trans></span>
                                </button>
                            </div>
                        </>
                    )}

                    {step === 4 && (
                        <>
                            <h2 className="wizard-title"><Trans>Что понравилось в этой встрече?</Trans></h2>
                            <div className="input-group">
                                <textarea
                                    className="input"
                                    rows={4}
                                    value={textFeedback}
                                    onChange={(e) => setTextFeedback(e.target.value)}
                                    placeholder={t`Расскажи, что понравилось...`}
                                />
                            </div>
                        </>
                    )}

                    {step === 5 && (
                        <>
                            <h2 className="wizard-title"><Trans>Что бы ты хотел(а) улучшить в игре?</Trans></h2>
                            <div className="input-group">
                                <textarea
                                    className="input"
                                    rows={4}
                                    value={improvementSuggestion}
                                    onChange={(e) => setImprovementSuggestion(e.target.value)}
                                    placeholder={t`Расскажи, что можно улучшить...`}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Navigation */}
                <div className="wizard-actions">
                    {step > 0 && (
                        <button className="btn btn-secondary" onClick={handleBack}>
                            <Trans>Назад</Trans>
                        </button>
                    )}
                    {step < TOTAL_STEPS - 1 ? (
                        <button
                            className="btn btn-primary"
                            onClick={handleNext}
                            disabled={!canProceed()}
                        >
                            <Trans>Далее</Trans>
                        </button>
                    ) : (
                        <button
                            className="btn btn-warm"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Trans>Отправка...</Trans> : <Trans>Отправить</Trans>}
                        </button>
                    )}
                </div>
            </div>

            <Link to="/" className="btn btn-secondary btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                <Trans>На главную</Trans>
            </Link>
        </div>
    );
}

export default FeedbackPage;
