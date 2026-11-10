import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { localeResources } from "@/locales/registry";

i18n.use(initReactI18next).init({
  resources: localeResources,
  lng: "pt-BR",
  fallbackLng: "pt-BR",
  interpolation: { escapeValue: false },
  returnObjects: true,
  keySeparator: false,
  nsSeparator: false,
});

export default i18n;
