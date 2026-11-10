"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import i18n from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import LoadingState from "@/components/ui/LoadingState";

export interface LanguageOption {
  code: string;
  name: string;
  native: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "pt-BR", name: "Portuguese (Brazil)", native: "Português (Brasil)" },
  { code: "en", name: "English", native: "English" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "fr", name: "French", native: "Français" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "nl", name: "Dutch", native: "Nederlands" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "zh", name: "Chinese (Simplified)", native: "简体中文" },
  { code: "zh-TW", name: "Chinese (Traditional)", native: "繁體中文" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "tr", name: "Turkish", native: "Türkçe" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt" },
  { code: "th", name: "Thai", native: "ไทย" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu" },
  { code: "tl", name: "Filipino", native: "Filipino" },
  { code: "pl", name: "Polish", native: "Polski" },
  { code: "uk", name: "Ukrainian", native: "Українська" },
  { code: "ro", name: "Romanian", native: "Română" },
  { code: "hu", name: "Hungarian", native: "Magyar" },
  { code: "cs", name: "Czech", native: "Čeština" },
  { code: "el", name: "Greek", native: "Ελληνικά" },
  { code: "he", name: "Hebrew", native: "עברית" },
  { code: "sv", name: "Swedish", native: "Svenska" },
  { code: "no", name: "Norwegian", native: "Norsk" },
  { code: "da", name: "Danish", native: "Dansk" },
  { code: "fi", name: "Finnish", native: "Suomi" },
  { code: "sk", name: "Slovak", native: "Slovenčina" },
  { code: "bg", name: "Bulgarian", native: "Български" },
  { code: "sr", name: "Serbian", native: "Српски" },
  { code: "hr", name: "Croatian", native: "Hrvatski" },
  { code: "lt", name: "Lithuanian", native: "Lietuvių" },
  { code: "lv", name: "Latvian", native: "Latviešu" },
  { code: "et", name: "Estonian", native: "Eesti" },
  { code: "sl", name: "Slovenian", native: "Slovenščina" },
  { code: "ka", name: "Georgian", native: "ქართული" },
  { code: "hy", name: "Armenian", native: "Հայերեն" },
  { code: "az", name: "Azerbaijani", native: "Azərbaycan dili" },
  { code: "kk", name: "Kazakh", native: "Қазақ тілі" },
  { code: "uz", name: "Uzbek", native: "Oʻzbekcha" },
  { code: "ne", name: "Nepali", native: "नेपाली" },
  { code: "si", name: "Sinhala", native: "සිංහල" },
  { code: "my", name: "Burmese", native: "မြန်မာဘာသာ" },
  { code: "km", name: "Khmer", native: "ភាសាខ្មែរ" },
  { code: "lo", name: "Lao", native: "ລາວ" },
  { code: "mn", name: "Mongolian", native: "Монгол" },
  { code: "am", name: "Amharic", native: "አማርኛ" },
  { code: "sw", name: "Swahili", native: "Kiswahili" },
  { code: "af", name: "Afrikaans", native: "Afrikaans" },
  { code: "ca", name: "Catalan", native: "Català" },
  { code: "gl", name: "Galician", native: "Galego" },
  { code: "eu", name: "Basque", native: "Euskara" },
  { code: "bs", name: "Bosnian", native: "Bosanski" },
  { code: "sq", name: "Albanian", native: "Shqip" },
  { code: "mk", name: "Macedonian", native: "Македонски" },
  { code: "fa", name: "Persian", native: "فارسی" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese", native: "অসমীয়া" },
  { code: "sd", name: "Sindhi", native: "سنڌي" },
  { code: "bo", name: "Tibetan", native: "བོད་སྐད" },
  { code: "dz", name: "Dzongkha", native: "རྫོང་ཁ" },
  { code: "fy", name: "Frisian", native: "Frysk" },
  { code: "ga", name: "Irish", native: "Gaeilge" },
  { code: "gd", name: "Scottish Gaelic", native: "Gàidhlig" },
  { code: "cy", name: "Welsh", native: "Cymraeg" },
  { code: "mt", name: "Maltese", native: "Malti" },
  { code: "is", name: "Icelandic", native: "Íslenska" },
  { code: "lb", name: "Luxembourgish", native: "Lëtzebuergesch" },
  { code: "mg", name: "Malagasy", native: "Malagasy" },
  { code: "ny", name: "Chichewa", native: "Chichewa" },
  { code: "ha", name: "Hausa", native: "Hausa" },
  { code: "yo", name: "Yoruba", native: "Yorùbá" },
  { code: "ig", name: "Igbo", native: "Igbo" },
  { code: "zu", name: "Zulu", native: "isiZulu" },
  { code: "xh", name: "Xhosa", native: "isiXhosa" },
  { code: "st", name: "Sesotho", native: "Sesotho" },
  { code: "tn", name: "Tswana", native: "Setswana" },
  { code: "rw", name: "Kinyarwanda", native: "Ikinyarwanda" },
  { code: "sn", name: "Shona", native: "chiShona" },
  { code: "so", name: "Somali", native: "Soomaali" },
  { code: "ti", name: "Tigrinya", native: "ትግርኛ" },
  { code: "ku", name: "Kurdish", native: "Kurdî" },
  { code: "ps", name: "Pashto", native: "پښتو" },
  { code: "jw", name: "Javanese", native: "Basa Jawa" },
  { code: "su", name: "Sundanese", native: "Basa Sunda" },
  { code: "ceb", name: "Cebuano", native: "Cebuano" },
  { code: "hmn", name: "Hmong", native: "Hmoob" },
  { code: "co", name: "Corsican", native: "Corsu" },
  { code: "ht", name: "Haitian Creole", native: "Kreyòl Ayisyen" },
  { code: "la", name: "Latin", native: "Latina" },
  { code: "mi", name: "Maori", native: "Te Reo Māori" },
  { code: "sm", name: "Samoan", native: "Gagana Samoa" },
  { code: "haw", name: "Hawaiian", native: "ʻŌlelo Hawaiʻi" },
  { code: "yi", name: "Yiddish", native: "ייִדיש" },
];

interface LocaleContextType {
  locale: string;
  setLocale: (code: string) => void;
  t: (text: string) => string;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "pt-BR",
  setLocale: () => {},
  t: (text: string) => text,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState("pt-BR");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("basileia_locale") || "pt-BR";
    setLocaleState(saved);
    i18n.changeLanguage(saved).then(() => setReady(true));
  }, []);

  const setLocale = useCallback((code: string) => {
    setLocaleState(code);
    localStorage.setItem("basileia_locale", code);
    i18n.changeLanguage(code);
  }, []);

  const t = useCallback((text: string) => {
    const translated = i18n.t(text);
    return translated || text;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {ready ? children : <LoadingState variant="brand" minHeight="h-screen" />}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
