const fs = require('fs');
const readline = require('readline');

async function run() {
  const fileStream = fs.createReadStream('C:\\Users\\Luis Velásquez\\.gemini\\antigravity-ide\\brain\\bef8fc6e-1fa5-4eb7-a801-4799712ee723\\.system_generated\\logs\\transcript.jsonl');
  
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      const text = obj.content || '';
      const containsKeywords = text.toLowerCase().includes('prioridad') || 
                               text.toLowerCase().includes('pdvsa') || 
                               text.toLowerCase().includes('vivienda') ||
                               text.toLowerCase().includes('casa');
                               
      if (containsKeywords) {
        console.log(`Step ${obj.step_index} (${obj.source}/${obj.type}):`);
        // Print matching lines or short snippet
        const lines = text.split('\n');
        for (const l of lines) {
          if (l.toLowerCase().includes('prioridad') || 
              l.toLowerCase().includes('pdvsa') || 
              l.toLowerCase().includes('vivienda') || 
              l.toLowerCase().includes('casa')) {
            console.log('  >', l.trim().substring(0, 150));
          }
        }
        console.log('----------------------------------------------------');
      }
    } catch (e) {
      // Ignore
    }
  }
}

run();
