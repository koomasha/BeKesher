import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loadCatalog } from '../i18n';

const LOCALE_KEY = 'bekesher_admin_locale';

interface LanguageContextType {
  locale: string;
  switchLanguage: (newLocale: string) => void;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<string>(
    localStorage.getItem(LOCALE_KEY) || 'en'
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await loadCatalog(locale);
      setIsLoading(false);
    }
    init();
  }, [locale]);

  const switchLanguage = (newLocale: string) => {
    if (newLocale !== locale) {
      localStorage.setItem(LOCALE_KEY, newLocale);
      setLocale(newLocale);
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, switchLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
