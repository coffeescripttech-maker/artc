const fs = require('fs');
let content = fs.readFileSync('apps/api/src/modules/programs/templates.ts', 'utf8');

// Fix the broken syntax around line 797 - the Grade 12 insertion broke the array
// The issue: there's a `},` then `, {` which is invalid
// Should be: `},` then `{` (no leading comma for next element)

content = content.replace(
  '      ],\n    },\n  ,\n    {\n      gradeLevel: "GRADE_12"',
  '      ],\n    },\n    {\n      gradeLevel: "GRADE_12"'
);

fs.writeFileSync('apps/api/src/modules/programs/templates.ts', content);
console.log('Fixed Grade 12 syntax');