const fs = require('fs');
const path = require('path');

const treePath = path.join(__dirname, '../TREE.md');
let treeContent = fs.readFileSync(treePath, 'utf8');
const lines = treeContent.split('\n');

let counter = 0;

function pad(num) {
  return num.toString().padStart(2, '0');
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Match any line starting with src/app/
  const match = line.match(/^(src\/app\/[\w\-\/\[\]]+(?:page\.tsx)?)(.*)$/);
  
  if (match) {
    let relativePath = match[1];
    let restOfLine = match[2];
    
    // Normalize path to always point to page.tsx if it's a directory
    if (relativePath.endsWith('/')) {
      relativePath += 'page.tsx';
    } else if (!relativePath.endsWith('.tsx')) {
        // e.g. src/app/dashboard -> src/app/dashboard/page.tsx
        relativePath += '/page.tsx';
    }
    
    // Check if it already has #pagXX
    let pagId = '';
    const pagMatch = restOfLine.match(/#pag(\d+)/);
    if (pagMatch) {
      pagId = `#pag${pagMatch[1]}`;
      counter = Math.max(counter, parseInt(pagMatch[1], 10) + 1);
    } else {
      pagId = `#pag${pad(counter)}`;
      counter++;
      
      // Update line in TREE.md
      if (restOfLine.includes('←')) {
         lines[i] = `${match[1]}${restOfLine} - ${pagId}`;
      } else {
         lines[i] = `${match[1].padEnd(30, ' ')} ← [Tela] - ${pagId}`;
      }
    }
    
    // Now handle the file
    const absolutePath = path.join(__dirname, '..', relativePath);
    if (fs.existsSync(absolutePath)) {
      let fileContent = fs.readFileSync(absolutePath, 'utf8');
      
      if (fileContent.includes('MAPA DO TESOURO')) {
        // Just update the #pag line if it exists
        // Since we might have multiple #pagXX in file, we replace the one in the header
        fileContent = fileContent.replace(/\/\/ #pag\d+ —/g, `// ${pagId} —`);
      } else {
        // Inject template at the top
        const folderName = relativePath.replace('src/app/', '').replace('/page.tsx', '') || 'Raiz';
        const template = `// ============================================================
// MAPA DO TESOURO — ${folderName}
// ============================================================
// PROPÓSITO:
//   [Descrever o propósito da página]
//
// INPUTS / ESTADOS:
//   - [Estado]: [Descrição]
//
// INTEGRAÇÃO BACKEND (CRÍTICO):
//   - [Ação]: [Onde e como a API deve ser chamada]
//
// ${pagId} — ${folderName}
// ============================================================\n`;
        
        if (fileContent.startsWith('"use client";')) {
          fileContent = fileContent.replace('"use client";', `"use client";\n\n${template}`);
        } else {
          fileContent = template + '\n' + fileContent;
        }
      }
      fs.writeFileSync(absolutePath, fileContent, 'utf8');
      console.log(`Updated ${relativePath} -> ${pagId}`);
    } else {
      console.log(`File NOT FOUND: ${relativePath}`);
    }
  }
}

fs.writeFileSync(treePath, lines.join('\n'), 'utf8');
console.log('\\nTREE.md fully synchronized!');
