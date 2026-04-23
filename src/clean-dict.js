const fs = require('fs');
const raw = JSON.parse(fs.readFileSync(__dirname + '/dictionary.json', 'utf-8'));

const cleaned = {};
Object.entries(raw).forEach(([arm, trans]) => {
  // Skip entries with HTML artifacts
  if (arm.includes('<') || arm.includes('>') || arm.includes('/p')) {
    return;
  }
  if (trans.includes('<') || trans.includes('>') || trans.includes('/p')) {
    return;
  }
  
  // Skip obvious misalignments
  if (arm.length <= 2 && trans.length > arm.length * 3) return;
  if (trans.length <= 2 && arm.length > trans.length * 3) return;
  
  // Skip if translit doesn't start with a letter (likely misaligned)
  if (!/^[a-zA-Z]/.test(trans)) return;
  
  // Skip if Armenian word contains Latin or vice versa
  if (/[a-zA-Z]/.test(arm)) return;
  if (/[\u0530-\u058F]/.test(trans)) return;
  
  cleaned[arm] = trans;
});

fs.writeFileSync('./dictionary.json', JSON.stringify(cleaned, null, 2));
console.log(`Cleaned dictionary: ${Object.keys(raw).length} → ${Object.keys(cleaned).length}`);
