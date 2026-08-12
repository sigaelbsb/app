const XLSX = require('xlsx');
const fs = require('fs');

const inputFile = '3.xlsx';
const outputFile = '3_limpio.xlsx';

console.log(`Leyendo archivo: ${inputFile}`);
const workbook = XLSX.readFile(inputFile);

let modificado = false;

workbook.SheetNames.forEach(sheetName => {
    console.log(`Procesando hoja: ${sheetName}`);
    const sheet = workbook.Sheets[sheetName];
    
    for (let cellAddress in sheet) {
        if (cellAddress[0] === '!') continue; // Saltar metadata de la hoja
        
        const cell = sheet[cellAddress];
        
        if (cell && cell.t === 's' && typeof cell.v === 'string') {
            const original = cell.v;
            // Eliminar espacios al inicio/final y reducir multiples espacios a uno solo
            const cleaned = original.trim().replace(/\s+/g, ' ');
            
            if (original !== cleaned) {
                cell.v = cleaned;
                modificado = true;
            }
        }
    }
});

if (modificado) {
    console.log(`Guardando archivo limpio: ${outputFile}`);
    XLSX.writeFile(workbook, outputFile);
    console.log('¡Limpieza completada exitosamente!');
} else {
    console.log('No se encontraron espacios innecesarios que limpiar.');
}
