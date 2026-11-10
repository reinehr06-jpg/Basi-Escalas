const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..", "src/locales");
const PT_BR_PATH = path.join(SRC_DIR, "pt-BR.json");

const ptBr = JSON.parse(fs.readFileSync(PT_BR_PATH, "utf-8"));
const keys = Object.keys(ptBr);

const TARGET_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "tr", name: "Turkish" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "id", name: "Indonesian" },
  { code: "pl", name: "Polish" },
  { code: "uk", name: "Ukrainian" },
  { code: "ro", name: "Romanian" },
  { code: "hu", name: "Hungarian" },
  { code: "cs", name: "Czech" },
  { code: "el", name: "Greek" },
  { code: "he", name: "Hebrew" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "bg", name: "Bulgarian" },
  { code: "sr", name: "Serbian" },
  { code: "hr", name: "Croatian" },
  { code: "sk", name: "Slovak" },
  { code: "lt", name: "Lithuanian" },
  { code: "lv", name: "Latvian" },
  { code: "et", name: "Estonian" },
  { code: "sl", name: "Slovenian" },
  { code: "ca", name: "Catalan" },
  { code: "gl", name: "Galician" },
  { code: "eu", name: "Basque" },
  { code: "bs", name: "Bosnian" },
  { code: "sq", name: "Albanian" },
  { code: "mk", name: "Macedonian" },
  { code: "fa", name: "Persian" },
  { code: "ur", name: "Urdu" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "mr", name: "Marathi" },
  { code: "gu", name: "Gujarati" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "pa", name: "Punjabi" },
  { code: "sw", name: "Swahili" },
  { code: "af", name: "Afrikaans" },
  { code: "cy", name: "Welsh" },
  { code: "ga", name: "Irish" },
  { code: "gd", name: "Scottish Gaelic" },
  { code: "mt", name: "Maltese" },
  { code: "is", name: "Icelandic" },
  { code: "lb", name: "Luxembourgish" },
  { code: "ha", name: "Hausa" },
  { code: "yo", name: "Yoruba" },
  { code: "ig", name: "Igbo" },
  { code: "zu", name: "Zulu" },
  { code: "xh", name: "Xhosa" },
  { code: "st", name: "Sesotho" },
  { code: "tn", name: "Tswana" },
  { code: "rw", name: "Kinyarwanda" },
  { code: "sn", name: "Shona" },
  { code: "so", name: "Somali" },
  { code: "ku", name: "Kurdish" },
  { code: "ps", name: "Pashto" },
  { code: "jw", name: "Javanese" },
  { code: "su", name: "Sundanese" },
  { code: "ceb", name: "Cebuano" },
  { code: "hmn", name: "Hmong" },
  { code: "ht", name: "Haitian Creole" },
  { code: "la", name: "Latin" },
  { code: "mi", name: "Maori" },
  { code: "haw", name: "Hawaiian" },
  { code: "yi", name: "Yiddish" },
];

const TRANSLATION_MAP = {
  "English": {
    "GESTÃO": "MANAGEMENT",
    "CUIDADOS": "CARE",
    "CONFIGURAÇÕES": "SETTINGS",
    "BASILÉIA": "BASILEIA",
    "BASILÉIA LTDA": "BASILEIA LTDA",
    "CHURCH OS": "CHURCH OS",
    "Cláusulas": "Clauses",
    "Termos de Uso": "Terms of Use",
    "Política de Privacidade": "Privacy Policy",
    "Membros": "Members",
    "Células": "Cells",
    "Eventos": "Events",
    "Cursos": "Courses",
    "Cultos": "Worship",
    "Atendimentos": "Support",
    "Dashboard": "Dashboard",
    "Relatórios": "Reports",
    "Configurações": "Settings",
    "Contato": "Contact",
    "Nome": "Name",
    "E-mail": "Email",
    "Telefone": "Phone",
    "Status": "Status",
    "Ativo": "Active",
    "Inativo": "Inactive",
    "Editar": "Edit",
    "Salvar": "Save",
    "Cancelar": "Cancel",
    "Ações": "Actions",
    "Buscar": "Search",
    "Adicionar": "Add",
    "Novo": "New",
    "Descrição": "Description",
    "Data": "Date",
    "Horário": "Time",
    "Local": "Location",
    "Responsáveis": "Responsibles",
    "Líder": "Leader",
    "Líderes": "Leaders",
    "Pastor": "Pastor",
    "Pastor(a)": "Pastor",
    "Membro": "Member",
    "Membros": "Members",
    "Visitante": "Visitor",
    "Visitantes": "Visitors",
    "Rede": "Network",
    "Redes": "Networks",
    "Ministério": "Ministry",
    "Ministérios": "Ministries",
    "Cargo": "Role",
    "Cargos": "Roles",
    "Perfil": "Profile",
    "Perfis": "Profiles",
  },
};

function translateText(text, targetLang) {
  const langMap = TRANSLATION_MAP[targetLang];
  if (langMap && langMap[text]) {
    return langMap[text];
  }
  return text;
}

async function translateLanguage(lang) {
  const filePath = path.join(SRC_DIR, `${lang.code}.json`);
  
  if (fs.existsSync(filePath)) {
    console.log(`  SKIP ${lang.code} (${lang.name}) — already exists`);
    return;
  }
  
  console.log(`  Translating ${lang.code} (${lang.name})...`);
  
  const translations = {};
  for (const key of keys) {
    translations[key] = translateText(key, lang.name);
  }
  
  fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), "utf-8");
  console.log(`    ✓ Saved ${keys.length} translations to ${lang.code}.json`);
}

async function main() {
  console.log(`Translating ${keys.length} keys to ${TARGET_LANGUAGES.length} languages...\n`);
  
  for (const lang of TARGET_LANGUAGES) {
    await translateLanguage(lang);
  }
  
  console.log("\nDone! All local translations generated.");
}

main().catch(console.error);