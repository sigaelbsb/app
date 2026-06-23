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
      // We only care about explicit user inputs
      if (obj.source === 'USER_EXPLICIT' || obj.type === 'USER_INPUT') {
        const text = obj.content || '';
        if (text.toLowerCase().includes('pdvsa') || text.toLowerCase().includes('prioridad') || text.toLowerCase().includes('vivienda')) {
          console.log(`Step ${obj.step_index}:`, text);
          console.log('----------------------------------------------------');
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
}

run();
