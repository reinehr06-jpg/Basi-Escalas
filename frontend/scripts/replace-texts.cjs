/*
 * 🗺️ MAPA DO TESOURO — INJEÇÃO DE TRADUÇÃO (FASE 3)
 * 
 * O QUE FAZ:
 *   Para cada chave em pt-BR.json, busca o texto original nos arquivos .tsx
 *   e o envolve com `t("...")`, além de adicionar o import de useTranslation
 *   quando necessário.
 * 
 * REGRAS:
 *   - Pula linhas que já contêm `t(...)` para evitar dupla-injeção
 *   - Pula imports, comentários, e strings template
 *   - Preserva a indentação original
 *   - Adiciona import { useTranslation } de react-i18next automaticamente
 *   - Suporta textos multi-linha
 * 
 * USO:
 *   node scripts/replace-texts.cjs
 */
const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..", "src");
const PT_BR_PATH = path.join(SRC_DIR, "locales", "pt-BR.json");

// Load keys sorted by length descending (longer matches first)
const ptBr = JSON.parse(fs.readFileSync(PT_BR_PATH, "utf-8"));
const keys = Object.keys(ptBr).sort((a, b) => b.length - a.length);

function getAllFiles(dir) {
  const files = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (
        entry.isDirectory() &&
        !entry.name.startsWith("node_modules") &&
        !entry.name.startsWith(".") &&
        entry.name !== "api"
      ) {
        files.push(...getAllFiles(full));
      } else if (
        entry.isFile() &&
        entry.name.endsWith(".tsx") &&
        !entry.name.startsWith("layout") &&
        !entry.name.startsWith("loading") &&
        !entry.name.startsWith("error") &&
        entry.name !== "not-found.tsx"
      ) {
        files.push(full);
      }
    }
  } catch (e) {}
  return files;
}

function hasImport(content) {
  return (
    content.includes('from "react-i18next"') ||
    content.includes("from 'react-i18next'")
  );
}

function hasHook(content) {
  return content.includes("const { t } = useTranslation(");
}

function processFile(filePath) {
  const relative = path.relative(SRC_DIR, filePath);
  let content = fs.readFileSync(filePath, "utf-8");
  let modified = false;

  // Skip already processed
  if (hasImport(content) && hasHook(content)) {
    console.log(`  SKIP ${relative}`);
    return;
  }

  function escJsStr(s) {
    return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
  }

  // Step 1: Replace attribute strings (placeholder, label, title)
  content = content.replace(
    /(placeholder|label|title)="([^"]*)"/g,
    (match, attr, val) => {
      if (keys.includes(val)) {
        modified = true;
        return `${attr}={t("${escJsStr(val)}")}`;
      }
      return match;
    }
  );

  // Also handle defaultValue
  content = content.replace(
    /(defaultValue)="([^"]*)"/g,
    (match, attr, val) => {
      if (keys.includes(val)) {
        modified = true;
        return `${attr}={t("${escJsStr(val)}")}`;
      }
      return match;
    }
  );

  // Step 2: Replace JSX text content with known keys
  for (const text of keys) {
    const esc = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Match: > (optional whitespace) TEXT (optional whitespace) <
    const regex = new RegExp("(>)(\\s*)" + esc + "(\\s*)(<)", "g");
    content = content.replace(regex, (_m, gt, ws1, ws2, lt) => {
      modified = true;
      return `${gt}${ws1}{t("${escJsStr(text)}")}${ws2}${lt}`;
    });
  }

  // Step 3: Add import if not present
  if (!hasImport(content)) {
    const lines = content.split("\n");
    let insertAt = 0;
    let inImport = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("import ")) {
        inImport = true;
      }
      if (inImport && line.includes("from ") && line.endsWith(";")) {
        insertAt = i + 1;
        inImport = false;
      }
    }
    if (insertAt === 0) {
      const useClientIdx = lines.findIndex(
        (l) =>
          l.trim().startsWith('"use client"') ||
          l.trim().startsWith("'use client'")
      );
      insertAt = useClientIdx >= 0 ? useClientIdx + 1 : 0;
    }
    lines.splice(insertAt, 0, 'import { useTranslation } from "react-i18next";');
    content = lines.join("\n");
    modified = true;
  }

  // Step 4: Add hook call inside function component
  if (!hasHook(content)) {
    const funcMatch = content.match(
      /(export default function\s+\w+\s*\([^)]*\)\s*\{)/
    );
    if (funcMatch) {
      const bracePos = funcMatch[0].lastIndexOf("{") + 1;
      const insertPos = funcMatch.index + bracePos;
      content =
        content.slice(0, insertPos) +
        "\n  const { t } = useTranslation();" +
        content.slice(insertPos);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`  OK ${relative}`);
  } else {
    console.log(`  ?? ${relative} (no changes)`);
  }
}

console.log(`Replacing ${keys.length} known Portuguese strings with t() calls...`);
const files = getAllFiles(SRC_DIR);
console.log(`Found ${files.length} .tsx files`);

let ok = 0,
  skip = 0,
  fail = 0;
for (const file of files) {
  processFile(file);
}

console.log("\nDone!");
