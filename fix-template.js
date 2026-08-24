const fs = require('fs');
const content = fs.readFileSync('apps/api/src/modules/programs/templates.ts', 'utf8');

// Fix 1: Program slug - remove double prefix
let fixed = content.replace(
  'slug: "aratc-shs-curriculum-aratc-shs-curriculum"',
  'slug: "aratc-shs-curriculum"'
);

// Fix 2: Subject slugs that got double-prefixed
fixed = fixed.replace(
  'slug: "math-grade-9"',
  'slug: "math-grade-9"'
).replace(
  'slug: "language-proficiency-grade-9"',
  'slug: "language-proficiency-grade-9"'
).replace(
  'slug: "reading-comprehension-grade-9"',
  'slug: "reading-comprehension-grade-9"'
).replace(
  'slug: "biology-grade-9"',
  'slug: "biology-grade-9"'
).replace(
  'slug: "abstract-reasoning-grade-9"',
  'slug: "abstract-reasoning-grade-9"'
).replace(
  'slug: "math-grade-10"',
  'slug: "math-grade-10"'
).replace(
  'slug: "language-proficiency-grade-10"',
  'slug: "language-proficiency-grade-10"'
).replace(
  'slug: "reading-comprehension-grade-10"',
  'slug: "reading-comprehension-grade-10"'
).replace(
  'slug: "biology-grade-10"',
  'slug: "biology-grade-10"'
).replace(
  'slug: "chemistry-grade-10"',
  'slug: "chemistry-grade-10"'
).replace(
  'slug: "abstract-reasoning-grade-10"',
  'slug: "abstract-reasoning-grade-10"'
).replace(
  'slug: "math-grade-11"',
  'slug: "math-grade-11"'
).replace(
  'slug: "language-proficiency-grade-11"',
  'slug: "language-proficiency-grade-11"'
).replace(
  'slug: "reading-comprehension-grade-11"',
  'slug: "reading-comprehension-grade-11"'
).replace(
  'slug: "physics-grade-11"',
  'slug: "physics-grade-11"'
).replace(
  'slug: "earth-science-grade-11"',
  'slug: "earth-science-grade-11"'
).replace(
  'slug: "abstract-reasoning-grade-11"',
  'slug: "abstract-reasoning-grade-11"'
);

// Fix 3: Remove module prefix from subject slugs (they shouldn't have it)
fixed = fixed.replace(/slug: "math9-number-sense-math9-number-sense"/g, 'slug: "math9-number-sense"');
fixed = fixed.replace(/slug: "math9-algebra-math9-algebra"/g, 'slug: "math9-algebra"');
fixed = fixed.replace(/slug: "lang9-grammar-lang9-grammar"/g, 'slug: "lang9-grammar"');
fixed = fixed.replace(/slug: "read9-literary-read9-literary"/g, 'slug: "read9-literary"');
fixed = fixed.replace(/slug: "bio9-life-processes-bio9-life-processes"/g, 'slug: "bio9-life-processes"');
fixed = fixed.replace(/slug: "ar9-patterns-ar9-patterns"/g, 'slug: "ar9-patterns"');

// Fix 4: Remove double module prefixes from module slugs
fixed = fixed.replace(/slug: "math10-geometry-math10-geometry"/g, 'slug: "math10-geometry"');
fixed = fixed.replace(/slug: "math10-trigonometry-math10-trigonometry"/g, 'slug: "math10-trigonometry"');
fixed = fixed.replace(/slug: "lang10-composition-lang10-composition"/g, 'slug: "lang10-composition"');
fixed = fixed.replace(/slug: "read10-informational-read10-informational"/g, 'slug: "read10-informational"');
fixed = fixed.replace(/slug: "bio10-genetics-bio10-genetics"/g, 'slug: "bio10-genetics"');
fixed = fixed.replace(/slug: "chem10-matter-chem10-matter"/g, 'slug: "chem10-matter"');
fixed = fixed.replace(/slug: "ar10-logic-ar10-logic"/g, 'slug: "ar10-logic"');
fixed = fixed.replace(/slug: "math11-precalc-math11-precalc"/g, 'slug: "math11-precalc"');
fixed = fixed.replace(/slug: "math11-statistics-math11-statistics"/g, 'slug: "math11-statistics"');
fixed = fixed.replace(/slug: "lang11-technical-lang11-technical"/g, 'slug: "lang11-technical"');
fixed = fixed.replace(/slug: "read11-critical-read11-critical"/g, 'slug: "read11-critical"');
fixed = fixed.replace(/slug: "phys11-mechanics-phys11-mechanics"/g, 'slug: "phys11-mechanics"');
fixed = fixed.replace(/slug: "earth11-earth-earth11-earth"/g, 'slug: "earth11-earth"');
fixed = fixed.replace(/slug: "ar11-deduction-ar11-deduction"/g, 'slug: "ar11-deduction"');

// Fix 5: Remove triple prefixes from topic slugs
fixed = fixed.replace(/slug: "math9-number-sense-math9-number-sense-"/g, 'slug: "math9-number-sense-"');
fixed = fixed.replace(/slug: "math9-algebra-math9-algebra-"/g, 'slug: "math9-algebra-"');
fixed = fixed.replace(/slug: "lang9-grammar-lang9-grammar-"/g, 'slug: "lang9-grammar-"');
fixed = fixed.replace(/slug: "read9-literary-read9-literary-"/g, 'slug: "read9-literary-"');
fixed = fixed.replace(/slug: "bio9-life-processes-bio9-life-processes-"/g, 'slug: "bio9-life-processes-"');
fixed = fixed.replace(/slug: "ar9-patterns-ar9-patterns-"/g, 'slug: "ar9-patterns-"');
fixed = fixed.replace(/slug: "math10-geometry-math10-geometry-"/g, 'slug: "math10-geometry-"');
fixed = fixed.replace(/slug: "math10-trigonometry-math10-trigonometry-"/g, 'slug: "math10-trigonometry-"');
fixed = fixed.replace(/slug: "lang10-composition-lang10-composition-"/g, 'slug: "lang10-composition-"');
fixed = fixed.replace(/slug: "read10-informational-read10-informational-"/g, 'slug: "read10-informational-"');
fixed = fixed.replace(/slug: "bio10-genetics-bio10-genetics-"/g, 'slug: "bio10-genetics-"');
fixed = fixed.replace(/slug: "chem10-matter-chem10-matter-"/g, 'slug: "chem10-matter-"');
fixed = fixed.replace(/slug: "ar10-logic-ar10-logic-"/g, 'slug: "ar10-logic-"');
fixed = fixed.replace(/slug: "math11-precalc-math11-precalc-"/g, 'slug: "math11-precalc-"');
fixed = fixed.replace(/slug: "math11-statistics-math11-statistics-"/g, 'slug: "math11-statistics-"');
fixed = fixed.replace(/slug: "lang11-technical-lang11-technical-"/g, 'slug: "lang11-technical-"');
fixed = fixed.replace(/slug: "read11-critical-read11-critical-"/g, 'slug: "read11-critical-"');
fixed = fixed.replace(/slug: "phys11-mechanics-phys11-mechanics-"/g, 'slug: "phys11-mechanics-"');
fixed = fixed.replace(/slug: "earth11-earth-earth11-earth-"/g, 'slug: "earth11-earth-"');
fixed = fixed.replace(/slug: "ar11-deduction-ar11-deduction-"/g, 'slug: "ar11-deduction-"');

fs.writeFileSync('apps/api/src/modules/programs/templates.ts', fixed);
console.log('Fixed double prefixes');