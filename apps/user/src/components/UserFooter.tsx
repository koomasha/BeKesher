import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Trans } from '@lingui/macro';
import './UserFooter.css';

export function UserFooter() {
    return (
        <footer className="user-footer">
            <div className="footer-content">
                <div className="footer-row">
                    <div className="footer-brand">
                        <Logo size={24} />
                        <span className="footer-wordmark">Tuk-Tuk</span>
                    </div>
                    <LanguageSwitcher />
                </div>
                <div className="footer-bottom">
                    <div className="footer-links">
                        <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="footer-link">
                            <Trans>Политика конфиденциальности</Trans>
                        </a>
                        <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="footer-link">
                            <Trans>Условия использования</Trans>
                        </a>
                    </div>
                    <span className="footer-copyright">© 2026 Tuk-Tuk</span>
                </div>
            </div>
        </footer>
    );
}
