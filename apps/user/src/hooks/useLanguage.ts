import { useState, useEffect } from 'react';
import { loadCatalog } from '../i18n';

const LOCALE_KEY = 'bekesher_locale';

export function useLanguage() {
  const [locale, setLocale] = useState<string>(
    localStorage.getItem(LOCALE_KEY) || 'ru'
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      await loadCatalog(locale);
      setIsLoading(false);
    }
    init();
  }, [locale]);

  const switchLanguage = async (newLocale: string) => {
    setIsLoading(true);
    localStorage.setItem(LOCALE_KEY, newLocale);
    await loadCatalog(newLocale);
    setLocale(newLocale);
    setIsLoading(false);
  };

  return { locale, switchLanguage, isLoading };
}
