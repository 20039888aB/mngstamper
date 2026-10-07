/**
 * Minimal i18n layer (spec section 34). UI strings live here, not in components,
 * so additional locales (Swahili, French, …) can be dropped in later. Only
 * `en` is provided now; `t()` falls back to the key so nothing breaks.
 */

export type Locale = 'en'

const en: Record<string, string> = {
  'app.name': 'Universal Rubber Stamp',
  'app.tagline': 'Stamp Documents. Anywhere. Securely.',

  'nav.dashboard': 'Dashboard',
  'nav.stamp': 'Stamp a Document',
  'nav.design': 'Design a Stamp',
  'nav.history': 'History',
  'nav.settings': 'Settings',

  'common.upload': 'Upload',
  'common.download': 'Download',
  'common.apply': 'Apply Stamp',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.duplicate': 'Duplicate',
  'common.retry': 'Retry',
  'common.close': 'Close',
  'common.pages': 'pages',

  'drop.title': 'Drag your document here',
  'drop.or': 'or',
  'drop.browse': 'Browse files',
  'drop.supported': 'PDF, Word, Excel, PNG or JPG',
  'drop.privacy': 'Processed on your device. Nothing is uploaded.',

  'stamp.pageScope.current': 'Current page',
  'stamp.pageScope.all': 'All pages',
  'stamp.pageScope.odd': 'Odd pages',
  'stamp.pageScope.even': 'Even pages',
  'stamp.pageScope.selected': 'Selected pages',
  'stamp.pageScope.range': 'Page range',

  'privacy.local': 'Local processing',
  'privacy.localOn': 'Your documents never leave this device.',
  'privacy.localOff': 'Large documents may be sent to a secure server.',

  'error.generic': 'Something went wrong. Please try again.',
}

const dictionaries: Record<Locale, Record<string, string>> = { en }

let currentLocale: Locale = 'en'

export function setLocale(locale: Locale): void {
  currentLocale = locale in dictionaries ? locale : 'en'
}

export function t(key: string): string {
  return dictionaries[currentLocale]?.[key] ?? key
}
