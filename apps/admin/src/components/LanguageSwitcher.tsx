import { useLanguage } from '../hooks/useLanguage';
import './LanguageSwitcher.css';

export function LanguageSwitcher() {
  const { locale, switchLanguage } = useLanguage();

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${locale === 'ru' ? 'active' : ''}`}
        onClick={() => switchLanguage('ru')}
      >
        RU
      </button>
      <button
        className={`lang-btn ${locale === 'en' ? 'active' : ''}`}
        onClick={() => switchLanguage('en')}
      >
        EN
      </button>
    </div>
  );
}
