const fs = require('fs');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function cleanJsonQuotes(str) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch (e) {
    try {
      let fixed = str;
      if (fixed.startsWith('"') && fixed.endsWith('"')) {
        fixed = fixed.slice(1, -1);
      }
      fixed = fixed.replace(/""/g, '"');
      return JSON.parse(fixed);
    } catch (err) {
      return null;
    }
  }
}

function run() {
  const content = fs.readFileSync('./expedientes_docentes_libertador.csv', 'utf-8');
  const lines = content.split(/\r?\n/);
  const housingData = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const columns = parseCSVLine(line);
    if (columns.length < 6) continue;
    const datosFicha = cleanJsonQuotes(columns[5]);
    if (datosFicha && datosFicha.vivienda_creditos) {
      housingData.push(datosFicha.vivienda_creditos);
    }
  }

  // Find unique keys and sample values
  const uniqueKeys = new Set();
  housingData.forEach(h => {
    Object.keys(h).forEach(k => uniqueKeys.add(k));
  });

  console.log("Unique keys in vivienda_creditos:", Array.from(uniqueKeys));
  console.log("Sample records of vivienda_creditos:", JSON.stringify(housingData.slice(0, 10), null, 2));
}

run();
