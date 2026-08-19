import { createContext, useContext, useState } from 'react'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  // Default: 'np' for Nepali. Change to 'en' to default to English.
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('pasal_khata_lang') || 'en'
    // To default to Nepali, change the above line to:
    // return localStorage.getItem('pasal_khata_lang') || 'np'
  })

  const switchLang = (newLang) => {
    if (newLang !== 'en' && newLang !== 'np') return
    setLang(newLang)
    localStorage.setItem('pasal_khata_lang', newLang)
  }

  return (
    <LanguageContext.Provider value={{ lang, switchLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider')
  return ctx
}
