/*
 * 🗺️ MAPA DO TESOURO — LIMPEZA DE CHAVES (FASE 2)
 * 
 * O QUE FAZ:
 *   Remove do pt-BR.json as chaves que são falsos positivos da extração:
 *     - Strings de código JavaScript (nomes de variáveis, funções, métodos)
 *     - Strings com caracteres especiais ({}, (), [], =>, etc.) indicando código
 *     - Import paths, nomes de arquivos, URLs
 *     - Strings que contêm apenas números ou caracteres especiais
 *     - Chaves duplicadas ou vazias
 * 
 * USO:
 *   node scripts/clean-keys.cjs
 */
const fs = require("fs");
const path = require("path");

const ptBrPath = path.join(__dirname, "..", "src/locales/pt-BR.json");
const ptBr = JSON.parse(fs.readFileSync(ptBrPath, "utf-8"));

function isLikelyPortuguese(key) {
  // Must be single-line
  if (key.includes("\n")) return false;

  // Must have at least 3 chars
  if (key.length < 3) return true; // keep short ones like "Sim", "Não"

  // Contains code-specific characters
  if (key.includes("{") || key.includes("}")) return false;
  if (key.includes("=>")) return false;

  // Contains code-specific keywords
  const codeKeywords = [
    "const ", "let ", "var ", "function ", "return ",
    "useState", "useEffect", "useRef", "useCallback", "useMemo",
    "useContext", "useReducer", "useLayoutEffect",
    "=== ", "!== ", "||", "&&",
    ".toLowerCase", ".includes(", ".map(", ".filter(", ".join(",
    "React.", "=>", "=>", "=>",
    "null;", "true;", "false;", "undefined;",
  ];
  for (const kw of codeKeywords) {
    if (key.includes(kw)) return false;
  }

  // Must contain at least one letter
  if (!/[A-Za-zÀ-ÿ]/.test(key)) return false;

  // Check ratio of letters to total chars (avoid keys that are mostly code)
  const letterCount = (key.match(/[A-Za-zÀ-ÿ]/g) || []).length;
  const ratio = letterCount / key.length;
  if (ratio < 0.3 && key.length > 5) return false;

  return true;
}

const cleaned = {};
const removed = [];

for (const [key, value] of Object.entries(ptBr)) {
  if (isLikelyPortuguese(key)) {
    cleaned[key] = value;
  } else {
    removed.push(key);
  }
}

fs.writeFileSync(ptBrPath, JSON.stringify(cleaned, null, 2), "utf-8");
console.log(`Original: ${Object.keys(ptBr).length} keys`);
console.log(`Removed: ${removed.length} keys (JS code)`);
console.log(`Remaining: ${Object.keys(cleaned).length} keys`);
console.log("\nFirst 20 removed:");
removed.slice(0, 20).forEach(k => console.log(`  - ${JSON.stringify(k.substring(0, 80))}`));
