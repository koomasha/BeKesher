# Feature: Internationalization (i18n) System for Text Management

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Implement a comprehensive internationalization (i18n) system across the BeKesher platform to replace ~157 hardcoded text strings scattered across 16 files. The system will create a single source of truth for all user-facing text with **Russian as the primary language everywhere** and **English as a required secondary language**.

**CRITICAL REQUIREMENT**: Both User and Admin apps must support language switching between Russian (primary) and English (secondary) via UI controls.

This system will cover:
- **User Telegram Mini App** (apps/user) - 6 files with ~99 Russian strings → translate to English
- **Admin Dashboard** (apps/admin) - 10 files with ~55 English strings → translate to Russian (primary) + keep English
- **Backend Notifications** (convex/notifications.ts) - 3 notification templates in both Russian and English
- **Language Switcher UI** - User-facing controls in both apps to switch between ru/en

## User Story

As a **developer maintaining BeKesher**
I want to **centralize all user-facing text in a single source of truth with i18n infrastructure**
So that **I can easily manage translations, support multiple languages, and eliminate hardcoded strings across the codebase**

## Problem Statement

The BeKesher platform currently has ~157 hardcoded text strings scattered across 16 files with inconsistent language usage (User app in Russian, Admin app in English, no unified approach), with no centralized text management or i18n infrastructure. This creates several problems:

1. **No Single Source of Truth**: Text is duplicated and inconsistent (e.g., region names map between Russian/English in multiple places)
2. **No Language Consistency**: Admin is in English, User is in Russian - should both be Russian-first with English option
3. **No Language Switching**: Users cannot change language preference
4. **Maintainability Issues**: Updating a single string requires hunting through multiple files
5. **No Language Extensibility**: Adding a new language would require code changes in 16+ files
6. **Mixed Language Patterns**: Some files have language mapping objects, others have hardcoded strings
7. **Backend Coupling**: Telegram notification texts are hardcoded in TypeScript functions, not easily editable
8. **No Type Safety**: No TypeScript support for translation keys
9. **Developer Experience**: No tooling for extracting, managing, or compiling translations

## Solution Statement

Implement **@lingui/react** as the i18n framework for the following reasons:

1. **Smallest Bundle Size**: 10.4 kB (50% smaller than react-i18next)
2. **Best Developer Experience**: Automatic message extraction with CLI
3. **Native TypeScript Support**: No extra configuration needed
4. **Official Vite Plugin**: Seamless integration with existing build setup
5. **Macro-Based Approach**: Write translations inline, compile-time optimized
6. **ICU MessageFormat**: Native support for pluralization, interpolation, formatting
7. **Modern & Maintained**: v5.9.1 (2026), active development

The implementation will:
- Extract all 157+ strings into centralized translation catalogs (PO format)
- Create **complete Russian and English translations** for all apps (no optional languages)
- **Build language switcher UI components** for both User and Admin apps
- Set up automatic extraction and compilation workflows
- Provide type-safe translation keys with autocomplete
- Enable language switching with localStorage persistence
- Support date/number formatting per locale (ru-RU, en-US)
- Create reusable patterns for future text additions
- **Default to Russian everywhere** with easy switch to English

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**:
- User App (apps/user) - all 6 pages + 4 components
- Admin App (apps/admin) - all 10 pages + 2 components
- Backend (convex/notifications.ts)
- Build system (Vite config, package.json)

**Dependencies**:
- @lingui/react v5.9.1
- @lingui/core v5.9.1
- @lingui/cli v5.9.1
- @lingui/vite-plugin v5.9.1
- @lingui/babel-plugin-lingui-macro v5.9.1
- make-plural v7.4.1

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

#### User App Files (Russian Text)
- [apps/user/src/pages/HomePage.tsx](apps/user/src/pages/HomePage.tsx) - Why: 8 Russian strings (greeting, status, navigation labels)
- [apps/user/src/pages/ProfilePage.tsx](apps/user/src/pages/ProfilePage.tsx) - Why: 18 Russian strings + zodiac signs + region mapping pattern
- [apps/user/src/pages/OnboardingPage.tsx](apps/user/src/pages/OnboardingPage.tsx) - Why: 35 Russian strings (form validation, step titles, purpose options, region names)
- [apps/user/src/pages/GroupsPage.tsx](apps/user/src/pages/GroupsPage.tsx) - Why: 6 Russian strings (headers, group info)
- [apps/user/src/pages/FeedbackPage.tsx](apps/user/src/pages/FeedbackPage.tsx) - Why: 25 Russian strings (wizard, ratings, choices)
- [apps/user/src/pages/SupportPage.tsx](apps/user/src/pages/SupportPage.tsx) - Why: 7 Russian strings (headers, form labels)

#### Admin App Files (Currently English, needs Russian + English)
- [apps/admin/src/pages/DashboardPage.tsx](apps/admin/src/pages/DashboardPage.tsx) - Why: 10 English strings → need Russian translations
- [apps/admin/src/pages/ParticipantsPage.tsx](apps/admin/src/pages/ParticipantsPage.tsx) - Why: 9 English strings → need Russian translations
- [apps/admin/src/pages/GroupsPage.tsx](apps/admin/src/pages/GroupsPage.tsx) - Why: 6 English strings → need Russian translations
- [apps/admin/src/pages/SupportPage.tsx](apps/admin/src/pages/SupportPage.tsx) - Why: 5 English strings → need Russian translations
- [apps/admin/src/pages/MatchingPage.tsx](apps/admin/src/pages/MatchingPage.tsx) - Why: 15 English strings → need Russian translations
- [apps/admin/src/pages/FeedbackPage.tsx](apps/admin/src/pages/FeedbackPage.tsx) - Why: May contain text → needs both languages
- [apps/admin/src/components/LoginPage.tsx](apps/admin/src/components/LoginPage.tsx) - Why: 3 English strings → need Russian translations
- [apps/admin/src/components/Sidebar.tsx](apps/admin/src/components/Sidebar.tsx) - Why: 7 English strings → need Russian translations

#### Backend Files (Currently English, needs Russian + English)
- [convex/notifications.ts](convex/notifications.ts) - Why: 3 notification templates → need both Russian and English versions

#### Build Configuration
- [apps/user/package.json](apps/user/package.json) - Will need to add lingui dependencies
- [apps/admin/package.json](apps/admin/package.json) - Will need to add lingui dependencies
- [apps/user/vite.config.ts](apps/user/vite.config.ts) - Will need to configure lingui plugin
- [apps/admin/vite.config.ts](apps/admin/vite.config.ts) - Will need to configure lingui plugin

### New Files to Create

#### Lingui Configuration
- `lingui.config.ts` (root) - Central Lingui configuration for all workspaces
- `apps/user/src/i18n.ts` - User app i18n initialization and locale loading
- `apps/admin/src/i18n.ts` - Admin app i18n initialization and locale loading

#### Translation Catalogs (User App)
- `apps/user/src/locales/ru/messages.po` - Russian translations (primary, extracted from source)
- `apps/user/src/locales/en/messages.po` - English translations (REQUIRED, must translate all strings)

#### Translation Catalogs (Admin App)
- `apps/admin/src/locales/ru/messages.po` - Russian translations (REQUIRED, translate all English strings)
- `apps/admin/src/locales/en/messages.po` - English translations (secondary, extracted from current source)

#### Backend Translation System
- `convex/locales/ru.json` - Russian notification templates (REQUIRED, primary language)
- `convex/locales/en.json` - English notification templates (REQUIRED, translate from current)
- `convex/i18n.ts` - Simple locale-based text lookup for backend notifications (supports both ru/en)

#### Hooks & Utilities
- `apps/user/src/hooks/useLanguage.ts` - Language switching hook with localStorage (defaults to 'ru')
- `apps/admin/src/hooks/useLanguage.ts` - Language switching hook with localStorage (defaults to 'ru')

#### UI Components (NEW - REQUIRED)
- `apps/user/src/components/LanguageSwitcher.tsx` - Language toggle UI for user app (RU/EN buttons)
- `apps/admin/src/components/LanguageSwitcher.tsx` - Language toggle UI for admin app (RU/EN dropdown or buttons)

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Lingui Official Documentation](https://lingui.dev/introduction)
  - Specific section: Installation & Setup
  - Why: Required to understand macro-based approach and setup

- [Lingui Vite Plugin Guide](https://lingui.dev/ref/vite-plugin)
  - Specific section: Configuration with @vitejs/plugin-react
  - Why: Critical for proper Vite integration with Babel macros

- [Lingui TypeScript Support](https://lingui.dev/guides/typescript)
  - Specific section: Type safety with macros
  - Why: Ensures type-safe translation keys

- [Lingui CLI Reference](https://lingui.dev/ref/cli)
  - Specific section: extract, compile commands
  - Why: Understanding extraction and compilation workflow

- [ICU MessageFormat Guide](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
  - Specific section: Pluralization and interpolation
  - Why: Required for handling dynamic content (counts, names, dates)

- [React i18n Best Practices 2026](https://www.glorywebs.com/blog/internationalization-in-react)
  - Specific section: File organization and language switching
  - Why: Industry patterns for React i18n architecture

### Patterns to Follow

**Component Import Pattern** (from existing codebase):
```typescript
// Existing pattern in all components
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';

// New pattern to add
import { Trans, t } from '@lingui/macro';
import { i18n } from '@lingui/core';
```

**Naming Conventions**:
- Translation keys: `kebab-case` with namespace dots (e.g., `home.greeting`, `profile.labels.name`)
- Locale codes: ISO 639-1 (e.g., `ru`, `en`, `he`)
- File names: `messages.po` (Lingui standard)

**Region Mapping Pattern** (found in ProfilePage.tsx and OnboardingPage.tsx):
```typescript
// Current hardcoded pattern
const regionMap: { [key: string]: string } = {
    'Север': 'North',
    'Центр': 'Center',
    'Юг': 'South'
};

// New i18n pattern
import { t } from '@lingui/macro';

const regions = [
  { value: 'North', label: t`North` },
  { value: 'Center', label: t`Center` },
  { value: 'South', label: t`South` }
];
```

**Zodiac Signs Pattern** (found in ProfilePage.tsx):
```typescript
// Current hardcoded function
const getZodiacSign = (birthDate: string): string => {
    // Returns Russian zodiac names
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Овен';
    // ...
}

// New i18n pattern
import { t } from '@lingui/macro';

const zodiacSigns = {
    aries: t`Aries`,
    taurus: t`Taurus`,
    // ... all 12 signs
}

const getZodiacSign = (birthDate: string): string => {
    // Calculate sign key (e.g., 'aries')
    // Return zodiacSigns[signKey]
}
```

**Validation Error Pattern** (found in OnboardingPage.tsx):
```typescript
// Current pattern
if (!formData.name.trim()) {
    newErrors.name = 'Имя обязательно';
}

// New i18n pattern
import { t } from '@lingui/macro';

if (!formData.name.trim()) {
    newErrors.name = t`Name is required`;
}
```

**Notification Template Pattern** (found in notifications.ts):
```typescript
// Current pattern
const welcomeText = `🥳 Hooray, ${args.name}! Your profile is accepted!
You're officially in the game! 🚀`;

// New i18n pattern (backend - simple JSON lookup)
import { getText } from './i18n';

const welcomeText = getText('en', 'notifications.welcome', { name: args.name });

// Frontend pattern (React component)
<Trans>🥳 Hooray, {name}! Your profile is accepted!</Trans>
```

**Other Relevant Patterns**:

**Date Formatting Pattern** (found in ProfilePage.tsx):
```typescript
// Current pattern
new Date(profile.birthDate).toLocaleDateString('ru-RU')

// New i18n pattern
import { i18n } from '@lingui/core';

i18n.date(new Date(profile.birthDate), { dateStyle: 'medium' })
```

**Pluralization Pattern** (for future use):
```typescript
import { plural } from '@lingui/macro';

const itemsText = plural(count, {
    zero: 'No items',
    one: '# item',
    other: '# items'
});
```

### Blueprint Alignment (Critical)

- **Data Architecture**: No database schema changes required. This is purely a presentation layer enhancement.
- **Logic Workflows**: No workflow changes. The i18n system is transparent to business logic.
- **Identity Guidelines**: No branding changes. Existing CSS variables and visual design remain unchanged.

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation - Install Dependencies & Configure Build System

Set up Lingui framework, configure Vite build system, and create base configuration files. This phase establishes the infrastructure for all i18n operations.

**Tasks:**

1. Install Lingui dependencies in both frontend apps (user + admin)
2. Create root `lingui.config.ts` configuration file
3. Configure Vite plugins in both apps to support Babel macros
4. Add npm scripts for extraction and compilation workflows
5. Create base i18n initialization files for both apps

### Phase 2: Backend Translation System - Convex Notifications

Implement a simple locale-based translation system for backend Telegram notifications. Backend uses simple JSON lookup (not React macros). **CRITICAL**: Must create BOTH Russian (primary) and English (secondary) translations.

**Tasks:**

1. Create Russian JSON translation file for notifications (primary language)
2. Create English JSON translation file for notifications (secondary language)
3. Implement `convex/i18n.ts` utility for text lookup with interpolation (supports ru/en)
4. Refactor `notifications.ts` to use translation system with locale parameter

### Phase 3: User App Translation - Extract & Migrate Russian Strings

Migrate all 99 Russian strings from 6 user app pages/components to Lingui macros and translation catalogs. **Create BOTH Russian (primary extracted) and English (manually translated) catalogs.**

**Tasks:**

1. Wrap App with `<I18nProvider>` and initialize i18n (defaults to 'ru')
2. Create language switching hook with localStorage (defaults to 'ru')
3. **CREATE LanguageSwitcher UI component** with RU/EN toggle buttons
4. **ADD LanguageSwitcher to user app header/navigation**
5. Replace hardcoded strings with `<Trans>` macro in all pages
6. Replace inline strings with `t` macro (placeholders, alerts, etc.)
7. Handle special patterns (zodiac signs, regions, date formatting)
8. Extract all messages to Russian `messages.po` catalog
9. **Translate all Russian strings to English** in en/messages.po
10. Compile translations for runtime (both ru and en)

### Phase 4: Admin App Translation - Extract & Migrate to Russian Primary

Admin currently has English strings. Migrate all 55 strings to Lingui macros, extract to English catalog, then **translate ALL to Russian (primary language)**. Add language switcher UI.

**Tasks:**

1. Wrap App with `<I18nProvider>` and initialize i18n (defaults to 'ru')
2. Create language switching hook (defaults to 'ru')
3. **CREATE LanguageSwitcher UI component** for admin (dropdown or buttons)
4. **ADD LanguageSwitcher to admin Sidebar or header**
5. Replace hardcoded English strings with `<Trans>` macro in all pages
6. Replace inline strings with `t` macro
7. Extract all messages to English `messages.po` catalog (current source)
8. **Translate ALL English strings to Russian** in ru/messages.po (PRIMARY)
9. Compile translations for runtime (both ru and en)
10. **Test admin app defaults to Russian** with working English toggle

### Phase 5: Testing & Validation

Comprehensive testing across all apps to ensure translations work correctly in BOTH languages and no regressions were introduced. **CRITICAL**: Test language switcher UI in both apps.

**Tasks:**

1. **Test user app language switcher** - toggle between RU/EN
2. Manually test all user app pages in **Russian (primary)**
3. Manually test all user app pages in **English (secondary)**
4. **Test admin app language switcher** - toggle between RU/EN
5. Manually test all admin app pages in **Russian (primary)**
6. Manually test all admin app pages in **English (secondary)**
7. Test date/number formatting in both locales (ru-RU, en-US)
8. Test language preference persistence (localStorage)
9. Run existing test suite to ensure no regressions
10. Run linting and type checking
11. **Verify all apps default to Russian** on first load

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Phase 1: Foundation

#### Task 1.1: INSTALL lingui dependencies in user app

- **IMPLEMENT**: Install all required Lingui packages
- **PATTERN**: Follow npm workspaces pattern - install in specific workspace
- **IMPORTS**: N/A (dependency installation)
- **GOTCHA**: Must install in workspace, not root
- **VALIDATE**: `npm list @lingui/react -w apps/user`

```bash
npm install --save @lingui/react @lingui/core make-plural -w apps/user
npm install --save-dev @lingui/cli @lingui/vite-plugin @lingui/babel-plugin-lingui-macro -w apps/user
```

#### Task 1.2: INSTALL lingui dependencies in admin app

- **IMPLEMENT**: Install all required Lingui packages
- **PATTERN**: Same as Task 1.1
- **IMPORTS**: N/A
- **GOTCHA**: Must install in workspace, not root
- **VALIDATE**: `npm list @lingui/react -w apps/admin`

```bash
npm install --save @lingui/react @lingui/core make-plural -w apps/admin
npm install --save-dev @lingui/cli @lingui/vite-plugin @lingui/babel-plugin-lingui-macro -w apps/admin
```

#### Task 1.3: CREATE root lingui configuration

- **IMPLEMENT**: Create `lingui.config.ts` in project root with configuration for both apps
- **PATTERN**: TypeScript config with type imports from @lingui/conf
- **IMPORTS**: `import type { LinguiConfig } from '@lingui/conf'`
- **GOTCHA**: Path patterns must match actual source structure
- **VALIDATE**: `npx lingui extract --dry-run` (should not error)

```typescript
import type { LinguiConfig } from '@lingui/conf';

const config: LinguiConfig = {
  locales: ['ru', 'en'],
  sourceLocale: 'ru',
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
};

export default config;
```

#### Task 1.4: UPDATE user app Vite config

- **IMPLEMENT**: Add Lingui Vite plugin and Babel macro configuration
- **PATTERN**: Read existing vite.config.ts, add to plugins array
- **IMPORTS**: `import { lingui } from '@lingui/vite-plugin'`
- **GOTCHA**: Must configure Babel plugin inside react() plugin
- **VALIDATE**: `npm run dev -w apps/user` (should start without errors)

Update `apps/user/vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { lingui } from '@lingui/vite-plugin';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['@lingui/babel-plugin-lingui-macro'],
      },
    }),
    lingui(),
  ],
  // ... rest of existing config
});
```

#### Task 1.5: UPDATE admin app Vite config

- **IMPLEMENT**: Add Lingui Vite plugin and Babel macro configuration
- **PATTERN**: Same as Task 1.4
- **IMPORTS**: Same as Task 1.4
- **GOTCHA**: Must configure Babel plugin inside react() plugin
- **VALIDATE**: `npm run dev -w apps/admin` (should start without errors)

Update `apps/admin/vite.config.ts` (same pattern as user app).

#### Task 1.6: ADD npm scripts for i18n workflows

- **IMPLEMENT**: Add extraction and compilation scripts to root package.json
- **PATTERN**: Root scripts delegate to lingui CLI
- **IMPORTS**: N/A
- **GOTCHA**: Scripts run from root, but operate on both apps
- **VALIDATE**: `npm run lingui:extract -- --help` (should show CLI help)

Add to `package.json` scripts:
```json
{
  "scripts": {
    "lingui:extract": "lingui extract",
    "lingui:compile": "lingui compile",
    "lingui:extract:watch": "lingui extract --watch"
  }
}
```

#### Task 1.7: CREATE user app i18n initialization

- **IMPLEMENT**: Create i18n setup file with locale loading and plurals configuration
- **PATTERN**: Async import pattern for dynamic locale loading
- **IMPORTS**: `import { i18n } from '@lingui/core'; import { ru, en } from 'make-plural/plurals';`
- **GOTCHA**: Must load plurals before activating locale
- **VALIDATE**: Manual inspection (will be tested when integrated into App)

Create `apps/user/src/i18n.ts`:
```typescript
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
  const { messages } = await import(`./locales/${locale}/messages.po`);
  i18n.load(locale, messages);
  i18n.activate(locale);
}

/**
 * Initialize i18n with default locale
 */
export async function initI18n(locale: string = 'ru') {
  await loadCatalog(locale);
}

export { i18n };
```

#### Task 1.8: CREATE admin app i18n initialization

- **IMPLEMENT**: Create i18n setup file (same pattern as user app, default to 'ru')
- **PATTERN**: Same as Task 1.7
- **IMPORTS**: Same as Task 1.7
- **GOTCHA**: **CRITICAL**: Default locale should be 'ru' for admin app (not 'en')
- **VALIDATE**: Manual inspection

Create `apps/admin/src/i18n.ts` (same as user app, default locale 'ru').

---

### Phase 2: Backend Translation System

#### Task 2.1: CREATE backend translation JSON files (BOTH Russian and English)

- **IMPLEMENT**: Create Russian (primary) and English (secondary) notification templates in JSON format
- **PATTERN**: Nested object structure with interpolation placeholders
- **IMPORTS**: N/A (JSON file)
- **GOTCHA**: Use `{variableName}` for interpolation placeholders. **CRITICAL**: Create BOTH files now, not just English
- **VALIDATE**: Manual JSON validation for both files

Create `convex/locales/ru.json` (PRIMARY LANGUAGE):
```json
{
  "notifications": {
    "welcome": "🥳 Ура, {name}! Твой профиль принят!\nТы официально в игре! 🚀\n\nЧто дальше?\n⏳ Жди воскресенья. Тогда наш алгоритм формирует группы. Вечером ты получишь сообщение с твоей командой и первым заданием!\n\n🎁 Напоминание: Первая неделя БЕСПЛАТНАЯ. Попробуй, познакомься, получи удовольствие!",
    "groupMatch": "🎉 <b>Твоя группа на эту неделю готова!</b>\n\n📍 Регион: {region}\n\n👥 Твоя группа:\n{memberList}\n\n📋 <b>Ваше задание:</b>\nВстретьтесь с группой на этой неделе и познакомьтесь друг с другом!\n\n💡 Совет: Обменяйтесь контактами и спланируйте встречу!\n\nУдачи! 🚀",
    "feedbackRequest": "📝 <b>Как прошла встреча?</b>\n\nТы встречался с: {members}\n\nПожалуйста, поделись отзывом - это помогает нам улучшить подбор!\n\nНажми кнопку ниже, чтобы оставить отзыв:"
  }
}
```

Create `convex/locales/en.json` (SECONDARY LANGUAGE - keep current English):
```json
{
  "notifications": {
    "welcome": "🥳 Hooray, {name}! Your profile is accepted!\nYou're officially in the game! 🚀\n\nWhat happens next?\n⏳ Wait for Sunday. That's when our algorithm forms groups. In the evening you'll get a message with your team and first task!\n\n🎁 Reminder: First week is FREE. Try it, meet people, enjoy!",
    "groupMatch": "🎉 <b>Your group for this week is ready!</b>\n\n📍 Region: {region}\n\n👥 Your group:\n{memberList}\n\n📋 <b>Your task:</b>\nMeet up with your group this week and get to know each other!\n\n💡 Tip: Exchange contacts and plan a meeting!\n\nGood luck! 🚀",
    "feedbackRequest": "📝 <b>How was your meetup?</b>\n\nYou met with: {members}\n\nPlease share your feedback - it helps us improve the matching!\n\nTap the button below to submit your feedback:"
  }
}
```

#### Task 2.2: CREATE backend i18n utility

- **IMPLEMENT**: Simple text lookup function with interpolation support
- **PATTERN**: Synchronous require() for JSON, string interpolation
- **IMPORTS**: N/A (uses require for JSON)
- **GOTCHA**: Must handle nested keys (e.g., 'notifications.welcome')
- **VALIDATE**: Write simple test in console: `getText('en', 'notifications.welcome', { name: 'Test' })`

Create `convex/i18n.ts`:
```typescript
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
```

#### Task 2.3: REFACTOR notifications.ts to use i18n

- **IMPLEMENT**: Replace hardcoded strings with getText() calls
- **PATTERN**: Import getText, pass locale and key with variables
- **IMPORTS**: `import { getText } from './i18n';`
- **GOTCHA**: **CRITICAL**: Default to 'ru' (not 'en'). Later will add locale parameter based on user preference
- **VALIDATE**: Run existing notification tests: `npm run test:once convex/notifications.test.ts`

Update `convex/notifications.ts`:
```typescript
import { getText } from './i18n';

// In sendWelcomeMessage handler:
// TODO: Add locale parameter to function args later (default to 'ru' for now)
const welcomeText = getText('ru', 'notifications.welcome', {
  name: args.name,
});

// In notifyGroupMembers handler:
const memberList = memberNames.map((name, i) => `${i + 1}. ${name}`).join('\n');
const message = getText('ru', 'notifications.groupMatch', {
  region: args.region,
  memberList,
});

// In sendFeedbackRequest handler:
const members = args.groupMemberNames.join(', ');
const message = getText('ru', 'notifications.feedbackRequest', { members });
```

---

### Phase 3: User App Translation

#### Task 3.1: CREATE language switching hook

- **IMPLEMENT**: Custom hook for language state with localStorage persistence
- **PATTERN**: useState + useEffect for side effects
- **IMPORTS**: `import { useState, useEffect } from 'react'; import { i18n, loadCatalog } from '../i18n';`
- **GOTCHA**: Must call loadCatalog when locale changes
- **VALIDATE**: Manual testing after App integration

Create `apps/user/src/hooks/useLanguage.ts`:
```typescript
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
```

#### Task 3.2: UPDATE User App.tsx with I18nProvider

- **IMPLEMENT**: Wrap app with I18nProvider and initialize i18n
- **PATTERN**: Read existing App.tsx, add provider at top level
- **IMPORTS**: `import { I18nProvider } from '@lingui/react'; import { i18n } from './i18n'; import { useLanguage } from './hooks/useLanguage';`
- **GOTCHA**: Show loading state while catalogs load
- **VALIDATE**: `npm run dev -w apps/user` (should render without errors)

Update `apps/user/src/App.tsx`:
```typescript
import { I18nProvider } from '@lingui/react';
import { i18n } from './i18n';
import { useLanguage } from './hooks/useLanguage';

function App() {
  const { isLoading } = useLanguage();

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <I18nProvider i18n={i18n}>
      {/* Existing app content */}
    </I18nProvider>
  );
}

export default App;
```

#### Task 3.3: CREATE LanguageSwitcher component for user app

- **IMPLEMENT**: Create reusable language toggle component with RU/EN buttons
- **PATTERN**: React component with click handlers
- **IMPORTS**: `import { useLanguage } from '../hooks/useLanguage';`
- **GOTCHA**: Should show current active language visually
- **VALIDATE**: Visual inspection (will test after adding to UI)

Create `apps/user/src/components/LanguageSwitcher.tsx`:
```typescript
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
```

Create `apps/user/src/components/LanguageSwitcher.css`:
```css
.language-switcher {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.lang-btn {
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.lang-btn.active {
  background: var(--primary);
  color: white;
}

.lang-btn:hover:not(.active) {
  background: var(--bg-hover);
  color: var(--text-primary);
}
```

#### Task 3.4: ADD LanguageSwitcher to user app header

- **IMPLEMENT**: Add LanguageSwitcher component to UserHeader or HomePage header
- **PATTERN**: Import and render component
- **IMPORTS**: `import { LanguageSwitcher } from './LanguageSwitcher';`
- **GOTCHA**: Place in visible location (top right of header recommended)
- **VALIDATE**: Visual check - buttons should appear and be clickable

Update `apps/user/src/components/UserHeader.tsx` or appropriate header component to include:
```typescript
<LanguageSwitcher />
```

#### Task 3.5: REFACTOR HomePage.tsx with Trans macros

- **IMPLEMENT**: Replace all 8 hardcoded Russian strings with `<Trans>` and `t` macros
- **PATTERN**: `<Trans>Text</Trans>` for JSX, `t\`Text\`` for strings
- **IMPORTS**: `import { Trans, t } from '@lingui/macro';`
- **GOTCHA**: Keep interpolation syntax (e.g., `<Trans>Привет, {firstName}!</Trans>`)
- **VALIDATE**: Visual check in browser after running extract + compile

Example changes in `apps/user/src/pages/HomePage.tsx`:
```typescript
// Before:
<h1>Привет, {firstName}!</h1>
<p>Добро пожаловать в BeKesher</p>

// After:
import { Trans, t } from '@lingui/macro';

<h1><Trans>Привет, {firstName}!</Trans></h1>
<p><Trans>Добро пожаловать в BeKesher</Trans></p>

// Before (inline string):
<p>Загружаем профиль...</p>

// After:
<p><Trans>Загружаем профиль...</Trans></p>

// Navigation labels:
<span className="label"><Trans>Мой профиль</Trans></span>
<span className="label"><Trans>Мои группы</Trans></span>
<span className="label"><Trans>Отзывы</Trans></span>
<span className="label"><Trans>Поддержка</Trans></span>
```

#### Task 3.6-3.8: REFACTOR remaining user app pages

Follow the same pattern as Task 3.5 for:
- **Task 3.6**: ProfilePage.tsx (18 strings + zodiac + regions)
- **Task 3.7**: OnboardingPage.tsx (35 strings)
- **Task 3.8**: GroupsPage.tsx, FeedbackPage.tsx, SupportPage.tsx

#### Task 3.9: EXTRACT messages from user app

- **IMPLEMENT**: Run Lingui CLI to extract all messages to Russian catalog
- **VALIDATE**: `apps/user/src/locales/ru/messages.po` created with ~99 messages

```bash
npm run lingui:extract
```

#### Task 3.10: TRANSLATE all user app strings to English

- **IMPLEMENT**: **MANUALLY** translate all Russian strings in `ru/messages.po` to English in `en/messages.po`
- **PATTERN**: Open both PO files, copy msgid, translate msgstr
- **GOTCHA**: **CRITICAL** - This is manual translation work, ~99 strings
- **VALIDATE**: All msgstr fields in `en/messages.po` filled with English translations

This is a significant manual task. Each Russian string must be translated to English.

#### Task 3.11: COMPILE translations for user app

- **IMPLEMENT**: Run Lingui CLI to compile both ru and en catalogs
- **VALIDATE**: Check `.js` files generated for both locales

```bash
npm run lingui:compile
```

#### Task 3.12: TEST language switching in user app

- **IMPLEMENT**: Start dev server, click RU/EN buttons, verify all pages
- **VALIDATE**: All pages render correctly in both Russian and English

---

## TESTING STRATEGY

The testing strategy follows the project's existing test framework (Vitest with convex-test) and manual validation patterns.

### Unit Tests

**Scope**: Backend i18n utility function

Design unit tests for `convex/i18n.ts`:

```typescript
// convex/i18n.test.ts
import { describe, it, expect } from 'vitest';
import { getText } from './i18n';

describe('Backend i18n', () => {
  it('should return translated text for valid key', () => {
    const text = getText('en', 'notifications.welcome', { name: 'John' });
    expect(text).toContain('Hooray, John!');
  });

  it('should interpolate variables', () => {
    const text = getText('en', 'notifications.groupMatch', {
      region: 'Center',
      memberList: '1. Alice\n2. Bob',
    });
    expect(text).toContain('Region: Center');
    expect(text).toContain('1. Alice');
  });

  it('should fallback to en for missing locale', () => {
    const text = getText('invalid', 'notifications.welcome', { name: 'Test' });
    expect(text).toContain('Hooray');
  });

  it('should return key if translation not found', () => {
    const text = getText('en', 'invalid.key');
    expect(text).toBe('invalid.key');
  });
});
```

**Run**: `npm run test:once convex/i18n.test.ts`

### Integration Tests

**Scope**: End-to-end text rendering in browser environment

Manual integration testing workflow:

1. **User App Flow**:
   - Open app in browser
   - Navigate through all pages (Home → Profile → Onboarding → Groups → Feedback → Support)
   - Verify all text renders in Russian
   - Test form validation error messages
   - Test dynamic content (dates, numbers, names)

2. **Admin App Flow**:
   - Login with Google
   - Navigate through all pages
   - Verify all text renders in English
   - Test stat labels, table headers, buttons
   - Run matching algorithm, verify result messages

3. **Backend Notifications** (requires Telegram integration):
   - Trigger welcome message (register new user)
   - Verify message received in English with correct interpolation
   - Trigger group match notification
   - Verify message formatting and variables

### Edge Cases

**Edge cases that must be tested:**

1. **Missing Translation Keys**: What happens if a key is missing from catalog?
2. **Empty Interpolation Variables**: What happens if variable is undefined?
3. **Locale Not Loaded**: What happens if catalog fails to load?
4. **Date Edge Cases**: Test date formatting for leap years, different months
5. **Plural Edge Cases**: Test with count = 0, 1, 2, 5, 10, 100 (Russian plural rules)
6. **Long Text Overflow**: Test UI with very long translated strings
7. **HTML in Translations**: Verify HTML is preserved in backend notification templates
8. **Emoji Preservation**: Verify emojis render correctly after translation

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

#### Lint User App
```bash
cd apps/user && npm run lint
```
**Expected**: Exit code 0, no warnings

#### Lint Admin App
```bash
cd apps/admin && npm run lint
```
**Expected**: Exit code 0, no warnings

#### TypeScript Type Check
```bash
npx tsc --noEmit
```
**Expected**: Exit code 0, no errors

### Level 2: Unit Tests

#### Run All Tests
```bash
npm run test:once
```
**Expected**: All tests pass

#### Run i18n-Specific Tests
```bash
npm run test:once convex/i18n.test.ts
```
**Expected**: All i18n utility tests pass

### Level 3: Integration Tests

#### Extract Messages (Dry Run)
```bash
npm run lingui:extract -- --dry-run
```
**Expected**: No errors, shows count of messages

#### Compile Translations
```bash
npm run lingui:compile
```
**Expected**: Generates .js files next to .po files

#### Build User App
```bash
cd apps/user && npm run build
```
**Expected**: Build succeeds, creates dist/

#### Build Admin App
```bash
cd apps/admin && npm run build
```
**Expected**: Build succeeds, creates dist/

### Level 4: Manual Validation

#### Start User App Dev Server
```bash
npm run dev:user
```
**Expected**: Runs on http://localhost:5173

**Manual Tests**:
1. Navigate to HomePage - verify Russian text
2. Navigate to ProfilePage - verify all labels, zodiac, regions in Russian
3. Navigate to OnboardingPage - complete wizard, verify all steps in Russian
4. Test form validation - verify error messages in Russian
5. Navigate to GroupsPage - verify Russian text
6. Navigate to FeedbackPage - verify wizard in Russian
7. Navigate to SupportPage - verify form in Russian
8. Check browser console - no errors

#### Start Admin App Dev Server
```bash
npm run dev:admin
```
**Expected**: Runs on http://localhost:5174

**Manual Tests**:
1. Login with Google
2. Navigate to Dashboard - verify stat labels in English
3. Navigate to ParticipantsPage - verify table headers, filters in English
4. Navigate to GroupsPage - verify table in English
5. Navigate to MatchingPage - verify description, buttons in English
6. Navigate to SupportPage - verify form in English
7. Check Sidebar - verify nav labels in English
8. Check browser console - no errors

---

## ACCEPTANCE CRITERIA

**CRITICAL REQUIREMENTS** (Must be completed):
- [ ] **Russian is primary language everywhere** - all apps default to Russian
- [ ] **Complete Russian translations** - 100% of all strings translated (ru.po for both apps)
- [ ] **Complete English translations** - 100% of all strings translated (en.po for both apps)
- [ ] **Language switcher UI in user app** - RU/EN toggle buttons visible and functional
- [ ] **Language switcher UI in admin app** - RU/EN toggle buttons/dropdown visible and functional
- [ ] **Backend supports both languages** - Russian and English notification templates

**Implementation Requirements**:
- [ ] **All 157+ hardcoded strings extracted** to translation catalogs
- [ ] **Lingui framework installed** and configured in both apps
- [ ] **Translation catalogs created** - BOTH ru.po AND en.po for user app
- [ ] **Translation catalogs created** - BOTH ru.po AND en.po for admin app
- [ ] **All user app pages** use Trans/t macros (6 pages + components)
- [ ] **All admin app pages** use Trans/t macros (10 pages + components)
- [ ] **Backend notifications** use i18n system with ru.json and en.json
- [ ] **Build system configured** with Vite + Babel macro plugin
- [ ] **Extraction workflow** set up (npm run lingui:extract)
- [ ] **Compilation workflow** set up (npm run lingui:compile)
- [ ] **TypeScript type safety** for translation keys (via macros)
- [ ] **Language switching hooks** created (defaults to 'ru')
- [ ] **LanguageSwitcher components** created for both apps
- [ ] **Date/number formatting** uses Intl API (ru-RU, en-US)

**Testing & Quality**:
- [ ] **All apps default to Russian** on first load
- [ ] **Language preference persists** via localStorage
- [ ] **All pages render in Russian** - user app tested
- [ ] **All pages render in English** - user app tested
- [ ] **All pages render in Russian** - admin app tested
- [ ] **All pages render in English** - admin app tested
- [ ] **Language switcher works** - toggle between RU/EN in both apps
- [ ] **All validation commands pass** with zero errors
- [ ] **No hardcoded strings** remain in components
- [ ] **Production builds succeed** for both apps
- [ ] **Bundle size** is reasonable (~10-15kB increase per app)
- [ ] **All existing tests pass** (no regressions)
- [ ] **Date/number formatting correct** in both locales

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order (1.1 → 5.11)
- [ ] Lingui dependencies installed in both apps
- [ ] Vite configs updated with lingui plugin
- [ ] Root lingui.config.ts created and validated
- [ ] i18n initialization files created for both apps
- [ ] Language switching hooks created
- [ ] Backend i18n utility created and tested
- [ ] All user app pages refactored
- [ ] All admin app pages refactored
- [ ] Messages extracted (ru.po, en.po created)
- [ ] Translations compiled (.js files generated)
- [ ] Manual testing completed for user app
- [ ] Manual testing completed for admin app
- [ ] Full test suite passes
- [ ] TypeScript type checking passes
- [ ] Linting passes for both apps
- [ ] Production builds succeed for both apps
- [ ] No hardcoded strings remain
- [ ] Bundle sizes are reasonable
- [ ] Code reviewed for quality and patterns

---

## NOTES

### Design Decisions

1. **Why Lingui over react-i18next?**
   - 50% smaller bundle size (10.4kB vs 22.2kB)
   - Automatic message extraction (better DX)
   - Compile-time optimizations (better runtime performance)
   - Native TypeScript support (no extra config)
   - Official Vite plugin (seamless integration)
   - Modern macro-based approach (write translations inline)

2. **Why PO format instead of JSON?**
   - Industry standard for translations
   - Better tooling support (Poedit, Lokalize, etc.)
   - Supports translator comments and context
   - Lingui default format

3. **Why separate i18n systems for backend vs frontend?**
   - Backend (Convex) doesn't support React macros
   - Backend has simpler needs (3 notification templates)
   - Simple JSON lookup is sufficient for backend
   - Frontend needs full i18n features

### Trade-offs

**Chosen**: Macro-based approach (Lingui)
**Alternative**: JSON-based approach (react-i18next)
**Rationale**: Better DX, smaller bundle, compile-time safety

**Chosen**: PO format for catalogs
**Alternative**: JSON format
**Rationale**: Better translator tooling, industry standard

### Future Enhancements

1. **Add Language Switcher UI**: Currently no UI for language switching (hooks are ready, just needs buttons)
2. **Add More Languages**: Easy to add Hebrew, English (user app), Russian (admin app)
3. **Namespace Splitting**: Split messages.po into page-based namespaces if catalog grows
4. **Translation Service Integration**: Connect to Phrase, Lokalise, or Crowdin
5. **Pseudo-locale for Testing**: Add 'pseudo' locale to test i18n without knowing target language
6. **RTL Support**: Add RTL layout support when adding Hebrew/Arabic
7. **Backend Locale Detection**: Pass user's preferred locale to backend for personalized notifications
8. **Pluralization Audit**: Review all count displays to ensure proper pluralization
