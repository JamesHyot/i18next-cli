import { glob } from 'glob'
import { readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { I18nextToolkitConfig } from './types'

// A list of common glob patterns for the primary language ('en') or ('dev') translation files.
const HEURISTIC_PATTERNS = [
  'public/locales/dev/*.json',
  'locales/dev/*.json',
  'src/locales/dev/*.json',
  'src/assets/locales/dev/*.json',
  'app/i18n/locales/dev/*.json',

  'public/locales/en/*.json',
  'locales/en/*.json',
  'src/locales/en/*.json',
  'src/assets/locales/en/*.json',
  'app/i18n/locales/en/*.json',
]

/**
 * Attempts to automatically detect the project's i18n structure by searching for
 * common translation file locations.
 *
 * @returns A promise that resolves to a partial I18nextToolkitConfig if detection
 * is successful, otherwise null.
 */
export async function detectConfig (): Promise<Partial<I18nextToolkitConfig> | null> {
  for (const pattern of HEURISTIC_PATTERNS) {
    const files = await glob(pattern, { ignore: 'node_modules/**' })

    if (files.length > 0) {
      const firstFile = files[0]
      const basePath = dirname(dirname(firstFile))

      try {
        const allDirs = await readdir(basePath)
        // CORRECTED REGEX: Now accepts 'dev' in addition to standard locale codes.
        let locales = allDirs.filter(dir => /^(dev|[a-z]{2}(-[A-Z]{2})?)$/.test(dir))

        if (locales.length > 0) {
          // Prioritization Logic
          locales.sort()
          if (locales.includes('dev')) {
            locales = ['dev', ...locales.filter(l => l !== 'dev')]
          }
          if (locales.includes('en')) {
            locales = ['en', ...locales.filter(l => l !== 'en')]
          }

          return {
            locales,
            extract: {
              input: [
                'src/**/*.{js,jsx,ts,tsx}',
                'app/**/*.{js,jsx,ts,tsx}',
                'pages/**/*.{js,jsx,ts,tsx}',
                'components/**/*.{js,jsx,ts,tsx}'
              ],
              output: join(basePath, '{{language}}', '{{namespace}}.json'),
              primaryLanguage: locales.includes('en') ? 'en' : locales[0],
            },
          }
        }
      } catch {
        continue
      }
    }
  }

  return null
}
