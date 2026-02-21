import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import './UserFooter.css';

export function UserFooter() {
    return (
        <footer className="user-footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <Logo size={24} />
                    <span className="footer-wordmark">Tuk-Tuk</span>
                </div>
                <LanguageSwitcher />
                <div className="footer-copyright">
                    © 2026 Tuk-Tuk
                </div>
            </div>
        </footer>
    );
}
