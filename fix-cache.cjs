const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/services/IndexedDBCacheL3.ts', 'utf8');

// Fix 1: Update keys() method to filter out __stats__
content = content.replace(
  'return await this.getAllKeys();',
  'const allKeys = await this.getAllKeys();\n      // Filter out internal stats key\n      return allKeys.filter(key => key !== \'__stats__\');'
);

// Fix 2: Fix hitRate calculation to avoid NaN
content = content.replace(
  'this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) * 100;',
  'const totalRequests = this.stats.hits + this.stats.misses;\n    this.stats.hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;'
);

// Fix 3: Fix calculateSize to handle undefined/null values
content = content.replace(
  'return JSON.stringify(value).length * 2;',
  'if (value === undefined || value === null) {\n      return 0;\n    }\n    try {\n      return JSON.stringify(value).length * 2;\n    } catch {\n      return 0;\n    }'
);

// Write the file back
fs.writeFileSync('src/services/IndexedDBCacheL3.ts', content);

console.log('Fixes applied successfully!'); 