/*
 * 🗺️ MAPA DO TESOURO — EXTRAÇÃO DE TEXTOS (FASE 1)
 * 
 * O QUE FAZ:
 *   Varre todos os arquivos .tsx em src/ (exceto layout, loading, error, api, node_modules)
 *   e extrai TODOS os textos em português encontrados em:
 *     - JSX: conteúdo entre tags (<span>texto</span>, <h1>texto</h1>, etc.)
 *     - JSX: valores de atributos placeholder, title, label
 *     - Strings literais em objetos de dados (label: "Atendimentos")
 *   Remove falsos positivos (código JS puro, imports, tipos, URLs, números, etc.)
 *   Gera um JSON com chave=texto, valor=texto (fonte primária pt-BR)
 * 
 * USO:
 *   node scripts/extract-texts.cjs
 * 
 * PIPELINE COMPLETO (executar em ordem):
 *   1. node scripts/extract-texts.cjs    → extrai textos → pt-BR.json
 *   2. node scripts/clean-keys.cjs       → remove falsos positivos de código
 *   3. node scripts/replace-texts.cjs    → envolve textos com t("...") nos .tsx
 *   4. node scripts/generate-registry.cjs → registra no i18n
 *   5. node scripts/translate-all.cjs    → traduz para 100+ idiomas (Falcon3)
 */
const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..", "src");

function getAllFiles(dir, ext = ".tsx") {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith("node_modules") && !entry.name.startsWith(".") && entry.name !== "api") {
      files.push(...getAllFiles(full, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext) && !entry.name.startsWith("layout") && !entry.name.startsWith("loading") && !entry.name.startsWith("error")) {
      files.push(full);
    }
  }
  return files;
}

function extractTextsFromFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const texts = new Set();

  // Extract JSX text content: >text< but not > {text} <
  const jsxTextRegex = />([^<>{]+)</g;
  let match;
  while ((match = jsxTextRegex.exec(content)) !== null) {
    const text = match[1].trim();
    if (text && text.length > 1 && !text.startsWith("/") && !text.startsWith("'") && !text.startsWith('"') && !text.startsWith("`")) {
      texts.add(text);
    }
  }

  // Extract attribute strings: placeholder="text", label="text", title="text", alt="text"
  const attrRegex = /(placeholder|label|title|alt|aria-label|helperText)=["']([^"']+)["']/g;
  while ((match = attrRegex.exec(content)) !== null) {
    const text = match[2].trim();
    if (text && text.length > 1) {
      texts.add(text);
    }
  }

  // Extract defaultValue="text"
  const defaultValRegex = /defaultValue=["']([^"']+)["']/g;
  while ((match = defaultValRegex.exec(content)) !== null) {
    const text = match[1].trim();
    if (text && text.length > 1) {
      texts.add(text);
    }
  }

  return texts;
}

// Filter out non-translatable texts
const SKIP_PATTERNS = [
  /^\d+$/, /^\d+%$/, /^\d+x\d+$/, /^[a-z-]+$/, /^[A-Z_]+$/, /^-?[\d.]+(px|rem|em|%|vw|vh|vmin|vmax)?$/,
  /^\./, /^#/, /^\//, /^https?:\/\//, /^w-/, /^lg:/, /^md:/, /^sm:/, /^xl:/, /^2xl:/,
  /^text-/, /^bg-/, /^border-/, /^p-/, /^m-/, /^gap-/, /^flex-/, /^grid-/, /^items-/,
  /^justify-/, /^rounded-/, /^shadow-/, /^hover:/, /^focus:/, /^group-/, /^transition-/,
  /^cursor-/, /^w-/, /^h-/, /^min-/, /^max-/, /^self-/, /^shrink-/, /^leading-/,
  /^tracking-/, /^opacity-/, /^z-/, /^inset-/, /^top-/, /^bottom-/, /^left-/, /^right-/,
  /^translate-/, /^-/, /^var\(/, /^attr\(/, /^url\(/, /^rgba?\(/, /^linear-gradient/,
  /^[a-f0-9]{6}$/, /^[a-f0-9]{3}$/,
];

function isTranslatable(text) {
  if (text.length === 0) return false;
  if (text.startsWith("{") && text.endsWith("}")) return false;
  if (text.startsWith("`") && text.endsWith("`")) return false;
  if (text.includes("${")) return false; // template literals with variables
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(text)) return false;
  }
  // Skip pure numbers
  if (/^[\d.,%]+$/.test(text)) return false;
  // Skip hex colors
  if (/^#[a-fA-F0-9]{3,8}$/.test(text)) return false;
  // Skip Tailwind-like classes
  if (/^[a-z]+-\d+/.test(text)) return false;
  // Skip single chars or punctuation
  if (/^[.,!?;:'"()\[\]{}\-–—/*+<=>&|^~%@# ]+$/.test(text)) return false;
  // Must have at least one letter
  if (!/[A-Za-zÀ-ÿ\u00C0-\u024F\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/.test(text)) return false;
  return true;
}

console.log("Scanning for translatable texts...");

const files = getAllFiles(SRC_DIR);
console.log(`Found ${files.length} files to scan`);

const allTexts = new Set();

for (const file of files) {
  const texts = extractTextsFromFile(file);
  for (const t of texts) {
    if (isTranslatable(t)) {
      allTexts.add(t);
    }
  }
}

const sorted = [...allTexts].sort();
const translations = {};
for (const t of sorted) {
  translations[t] = t;
}

const outPath = path.join(SRC_DIR, "locales", "pt-BR.json");
fs.writeFileSync(outPath, JSON.stringify(translations, null, 2), "utf-8");

console.log(`\nDone! Extracted ${sorted.length} unique translatable texts.`);
console.log(`Saved to: ${outPath}`);
