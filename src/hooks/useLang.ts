import { create } from 'zustand'
import { translations, type I18nKey } from '../lib/i18n'

type Lang = 'zh' | 'en'

interface LangState {
  lang: Lang
  toggle: () => void
}

export const useLangStore = create<LangState>((set, get) => ({
  lang: (localStorage.getItem('listgo_lang') as Lang) ?? 'zh',
  toggle: () => {
    const next: Lang = get().lang === 'zh' ? 'en' : 'zh'
    localStorage.setItem('listgo_lang', next)
    set({ lang: next })
  },
}))

export function useT() {
  const lang = useLangStore(s => s.lang)
  return (key: I18nKey): string => translations[lang][key] ?? translations.zh[key]
}
