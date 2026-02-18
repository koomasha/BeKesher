import type { LinguiConfig } from '@lingui/conf';

const config: LinguiConfig = {
  locales: ['en', 'ru'],
  sourceLocale: 'en',
  catalogs: [
    {
      path: 'apps/user/src/locales/{locale}/messages',
      include: ['apps/user/src'],
    },
    {
      path: 'apps/admin/src/locales/{locale}/messages',
      include: ['apps/admin/src'],
    },
  ],
  format: 'po',
  compileNamespace: 'es',
};

export default config;
