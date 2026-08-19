import { useLang } from '../context/LanguageContext'
import { translations } from '../utils/translations'

export function useTranslation() {
  const { lang, switchLang } = useLang()
  const t = translations[lang]

  // getText('dashboard.title') — safe path-based lookup with fallback
  function getText(path) {
    const keys = path.split('.')
    let result = t
    for (const key of keys) {
      if (result === undefined || result === null) return path
      result = result[key]
    }
    return result || path
  }

  return { t, getText, lang, switchLang }
}
