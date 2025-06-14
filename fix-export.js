const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/services/IndexedDBCacheL3.ts', 'utf8');

// Uncomment the singleton export
content = content.replace('// export const indexedDBCacheL3 = new IndexedDBCacheL3();', 'export const indexedDBCacheL3 = new IndexedDBCacheL3();');

// Write the file back
fs.writeFileSync('src/services/IndexedDBCacheL3.ts', content);

console.log('✅ Export decommentato con successo!'); 