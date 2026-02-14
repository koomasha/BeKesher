import { useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Link } from 'react-router-dom';
import { Id } from 'convex/_generated/dataModel';
import { useTelegramAuth } from '../hooks/useTelegramAuth';

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
                        filter: `drop-shadow(0 0 ${rocketPosition * 20}px rgba(79, 70, 229, ${rocketPosition * 0.8}))`,
                    }}
                >
                    🚀
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
                    console.error('Photo upload failed:', error);
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
            console.error('Failed to submit feedback:', error);
            alert('Не удалось отправить отзыв. Пожалуйста, попробуйте еще раз.');
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
                        <div className="icon">📱</div>
                        <p>Откройте приложение из Telegram</p>
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
                <header className="header">
                    <h1>⭐ Обратная связь</h1>
                </header>
                <div className="success-state animate-fade-in">
                    <div className="icon">🎉</div>
                    <h2>Спасибо за отзыв!</h2>
                    <p>Вы получили 10 баллов!</p>
                    <button
                        className="btn btn-primary btn-full"
                        onClick={() => setSubmitted(false)}
                    >
                        Оставить ещё отзыв
                    </button>
                    <Link to="/" className="btn btn-secondary btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                        ← На главную
                    </Link>
                </div>
            </div>
        );
    }

    if (pendingFeedback.length === 0) {
        return (
            <div className="page">
                <header className="header">
                    <h1>⭐ Обратная связь</h1>
                </header>
                <div className="card animate-fade-in">
                    <div className="empty-state">
                        <div className="icon">✅</div>
                        <p>Нет ожидающих отзывов</p>
                        <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)' }}>
                            Вы в курсе всех дел!
                        </p>
                    </div>
                </div>
                <Link to="/" className="btn btn-secondary btn-full">
                    ← На главную
                </Link>
            </div>
        );
    }

    if (!selectedGroup) {
        return (
            <div className="page">
                <header className="header">
                    <h1>⭐ Обратная связь</h1>
                    <p>Поделитесь впечатлениями</p>
                </header>
                <div className="card animate-fade-in">
                    <span className="card-title">Выберите группу для оценки:</span>
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
                                        С: {group.members.join(', ')}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <Link to="/" className="btn btn-secondary btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                    ← На главную
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
            <header className="header">
                <h1>⭐ Обратная связь</h1>
            </header>

            <div className="wizard-container">
                {/* Progress indicator */}
                <div className="wizard-progress">
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => i).map((s, i) => (
                        <div key={s}>
                            <div className={`wizard-step ${s === step ? 'active' : s < step ? 'completed' : ''}`}>
                                {s < step ? '✓' : s + 1}
                            </div>
                            {i < TOTAL_STEPS - 1 && <div className={`wizard-divider ${s < step ? 'completed' : ''}`} />}
                        </div>
                    ))}
                </div>

                {/* Cancel link */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <button onClick={handleCancel} className="btn btn-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                        ← Назад к выбору группы
                    </button>
                </div>

                {/* Step content */}
                <div className="wizard-content animate-fade-in">
                    {step === 0 && (
                        <>
                            <h2 className="wizard-title">Дай оценку этой недели</h2>
                            <p className="wizard-subtitle">Подними ракету вверх!</p>
                            <RocketRating rating={rating} onRatingChange={setRating} />
                            <div className="rating-labels">
                                <span>Полный отстой</span>
                                <span>Не хочу чтобы заканчивалась</span>
                            </div>
                        </>
                    )}

                    {step === 1 && (
                        <>
                            <h2 className="wizard-title">Загрузи фотку с вашей встречи</h2>
                            <p className="wizard-subtitle">(если хочешь)</p>
                            <div className="photo-upload">
                                {photos.length > 0 && (
                                    <div className="photo-grid">
                                        {photos.map((photo, index) => (
                                            <div key={index} className="photo-preview">
                                                <img src={photo.preview} alt={`Preview ${index + 1}`} />
                                                <button
                                                    className="remove-photo"
                                                    onClick={() => handleRemovePhoto(index)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {photos.length < MAX_PHOTOS && (
                                    <label className="photo-upload-button">
                                        <div className="upload-icon">📷</div>
                                        <span>Нажмите для загрузки</span>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handlePhotoSelect}
                                        />
                                    </label>
                                )}
                                <p className="photo-count">{photos.length} / {MAX_PHOTOS} фотографий</p>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <h2 className="wizard-title">Как задание повлияло на ваше общение?</h2>
                            <div className="choice-group">
                                <button
                                    className={`choice-button ${taskEffect === 'deeper' ? 'selected' : ''}`}
                                    onClick={() => setTaskEffect('deeper')}
                                >
                                    <div className="choice-icon">🤝</div>
                                    <span>Сделало общение глубже</span>
                                </button>
                                <button
                                    className={`choice-button ${taskEffect === 'fun' ? 'selected' : ''}`}
                                    onClick={() => setTaskEffect('fun')}
                                >
                                    <div className="choice-icon">😄</div>
                                    <span>Добавило веселья</span>
                                </button>
                                <button
                                    className={`choice-button ${taskEffect === 'not_fit' ? 'selected' : ''}`}
                                    onClick={() => setTaskEffect('not_fit')}
                                >
                                    <div className="choice-icon">🤷</div>
                                    <span>Не очень подошло</span>
                                </button>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <h2 className="wizard-title">Хочешь ли встретиться с этим партнером снова?</h2>
                            <div className="choice-group">
                                <button
                                    className={`choice-button ${wouldMeetAgain === 'yes' ? 'selected' : ''}`}
                                    onClick={() => setWouldMeetAgain('yes')}
                                >
                                    <div className="choice-icon">👍</div>
                                    <span>Да</span>
                                </button>
                                <button
                                    className={`choice-button ${wouldMeetAgain === 'no' ? 'selected' : ''}`}
                                    onClick={() => setWouldMeetAgain('no')}
                                >
                                    <div className="choice-icon">👎</div>
                                    <span>Нет</span>
                                </button>
                                <button
                                    className={`choice-button ${wouldMeetAgain === 'maybe' ? 'selected' : ''}`}
                                    onClick={() => setWouldMeetAgain('maybe')}
                                >
                                    <div className="choice-icon">🤔</div>
                                    <span>Может быть</span>
                                </button>
                            </div>
                        </>
                    )}

                    {step === 4 && (
                        <>
                            <h2 className="wizard-title">Что понравилось в этой встрече?</h2>
                            <div className="input-group">
                                <textarea
                                    className="input"
                                    rows={4}
                                    value={textFeedback}
                                    onChange={(e) => setTextFeedback(e.target.value)}
                                    placeholder="Расскажи, что понравилось..."
                                />
                            </div>
                        </>
                    )}

                    {step === 5 && (
                        <>
                            <h2 className="wizard-title">Что бы ты хотел/а улучшить в игре?</h2>
                            <div className="input-group">
                                <textarea
                                    className="input"
                                    rows={4}
                                    value={improvementSuggestion}
                                    onChange={(e) => setImprovementSuggestion(e.target.value)}
                                    placeholder="Расскажи, что можно улучшить..."
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Navigation */}
                <div className="wizard-actions">
                    {step > 0 && (
                        <button className="btn btn-secondary" onClick={handleBack}>
                            ← Назад
                        </button>
                    )}
                    {step < TOTAL_STEPS - 1 ? (
                        <button
                            className="btn btn-primary"
                            onClick={handleNext}
                            disabled={!canProceed()}
                        >
                            Далее →
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Отправка...' : 'Отправить'}
                        </button>
                    )}
                </div>
            </div>

            <Link to="/" className="btn btn-secondary btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                ← На главную
            </Link>
        </div>
    );
}

export default FeedbackPage;
