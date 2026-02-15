/**
 * Simple i18n for backend Convex functions
 * Uses JSON files for translations (not React macros)
 */

type TranslationKey = string;
type Variables = Record<string, string | number>;

/**
 * Get translated text with variable interpolation
 */
export function getText(
  locale: string,
  key: TranslationKey,
  variables?: Variables
): string {
  // Load translations for locale
  let translations: any;
  try {
    translations = require(`./locales/${locale}.json`);
  } catch (error) {
    console.error(`Failed to load locale ${locale}, falling back to en`);
    translations = require(`./locales/en.json`);
  }

  // Navigate nested keys (e.g., 'notifications.welcome')
  const keys = key.split('.');
  let text = translations;
  for (const k of keys) {
    text = text?.[k];
  }

  if (typeof text !== 'string') {
    console.error(`Translation key not found: ${key}`);
    return key;
  }

  // Interpolate variables
  if (variables) {
    Object.keys(variables).forEach((varName) => {
      text = text.replace(
        new RegExp(`\\{${varName}\\}`, 'g'),
        String(variables[varName])
      );
    });
  }

  return text;
}
