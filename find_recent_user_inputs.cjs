const fs = require('fs');
const readline = require('readline');

async function run() {
  const fileStream = fs.createReadStream('C:\\Users\\Luis Velásquez\\.gemini\\antigravity-ide\\brain\\bef8fc6e-1fa5-4eb7-a801-4799712ee723\\.system_generated\\logs\\transcript.jsonl');
  
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const inputs = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.source === 'USER_EXPLICIT' || obj.type === 'USER_INPUT') {
        inputs.push(obj);
      }
    } catch (e) {
      // Ignore
    }
  }

  // Print the last 15 user inputs
  console.log(`Total user inputs: ${inputs.length}`);
  const recent = inputs.slice(-15);
  for (const item of recent) {
    console.log(`[Step ${item.step_index}] At ${item.created_at || 'unknown'}:`);
    console.log(item.content);
    console.log('====================================================\n');
  }
}

run();
