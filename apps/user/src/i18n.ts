import { i18n } from '@lingui/core';
import { ru, en } from 'make-plural/plurals';

// Load plural rules
i18n.loadLocaleData({
  ru: { plurals: ru },
  en: { plurals: en },
});

/**
 * Load messages catalog for a locale
 */
export async function loadCatalog(locale: string) {
  const { messages } = await import(`./locales/${locale}/messages.mjs`);
  i18n.load(locale, messages);
  i18n.activate(locale);
}

export { i18n };
