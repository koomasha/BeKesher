import './AccessDenied.css';

export function AccessDenied() {
    return (
        <div className="access-denied">
            <div className="access-denied__card">
                <div className="access-denied__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" stroke="white" strokeWidth="2" />
                    </svg>
                </div>
                <h2 className="access-denied__title">Доступ ограничен</h2>
                <p className="access-denied__text">
                    Это приложение доступно только через Telegram
                </p>
            </div>
        </div>
    );
}
