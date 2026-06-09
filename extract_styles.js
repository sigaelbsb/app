const fs = require('fs');
const path = require('path');

const vistasDir = 'c:\\Users\\Luis Velásquez\\Desktop\\SIGAE_Unificado\\vistas';
const cssFile = 'c:\\Users\\Luis Velásquez\\Desktop\\SIGAE_Unificado\\css\\vistas.css';

function getAllHtmlFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllHtmlFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.html')) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });
  return arrayOfFiles;
}

const htmlFiles = getAllHtmlFiles(vistasDir);
let combinedCss = '/* =========================================================================\n   SIGAE - ESTILOS DE VISTAS (vistas.css)\n   ========================================================================= */\n\n';

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  const styleRegex = /<style>([\s\S]*?)<\/style>/gi;
  
  let match;
  let hasStyles = false;
  
  while ((match = styleRegex.exec(content)) !== null) {
      hasStyles = true;
      combinedCss += `/* --- Estilos extraídos de ${path.basename(file)} --- */\n`;
      combinedCss += match[1].trim() + '\n\n';
  }
  
  if (hasStyles) {
      content = content.replace(styleRegex, '');
      content = content.replace(/^\s*$(?:\r\n?|\n)/gm, "");
      fs.writeFileSync(file, content.trim() + '\n', 'utf8');
      console.log(`Limpiado: ${file}`);
  }
});

fs.writeFileSync(cssFile, combinedCss, 'utf8');
console.log('Todos los estilos extraídos a css/vistas.css');
