import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
export type Language = "tr" | "en";
const Context = createContext<{
  language: Language;
  setLanguage: (value: Language) => void;
}>({ language: "tr", setLanguage: () => {} });
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return localStorage.getItem("arena-language") === "en" ? "en" : "tr";
    } catch {
      return "tr";
    }
  });
  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem("arena-language", language);
    } catch {
      /* Optional persistence. */
    }
  }, [language]);
  return (
    <Context.Provider value={{ language, setLanguage }}>
      {children}
    </Context.Provider>
  );
}
export function useLanguage() {
  const state = useContext(Context);
  const copy=useCallback((tr:string,en:string)=>state.language==="tr"?tr:en,[state.language]);
  return {
    ...state,
    copy,
  };
}
