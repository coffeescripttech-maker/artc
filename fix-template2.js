const fs = require('fs');
let content = fs.readFileSync('apps/api/src/modules/programs/templates.ts', 'utf8');

// Fix CET exam topicSlugs to use prefixed versions
const topicSlugMap = {
  "linear-equations": "math9-algebra-linear-equations",
  "triangle-similarity": "math10-geometry-triangle-similarity",
  "balancing-equations": "chem10-matter-balancing-equations",
  "periodic-trends": "chem10-matter-periodic-trends",
  "central-tendency": "math11-statistics-central-tendency",
  "inferring-meaning": "read9-literary-inferring-meaning",
  "parts-of-speech": "lang9-grammar-parts-of-speech",
  "trig-ratios": "math10-trigonometry-trig-ratios",
  "reaction-types": "chem10-matter-reaction-types",
  "authors-tone": "read11-critical-authors-tone",
  "polynomial-functions": "math11-precalc-polynomial-functions",
  "number-series": "ar9-patterns-number-series",
  "synonyms-antonyms": "lang10-composition-synonyms-antonyms",
  "essay-structure": "lang11-technical-essay-structure",
  "earth-layers": "earth11-earth-earth-layers",
  "symbol-series": "ar11-deduction-symbol-series",
  "laws-of-motion": "phys11-mechanics-laws-of-motion",
  "cell-structure": "bio9-life-processes-cell-structure",
  "enzymes": "bio10-genetics-enzymes",
  "polygon-functions": "math11-precalc-polygon-functions", // typo in DECAT, should be polynomial
  "syllogisms": "ar11-deduction-syllogisms",
};

for (const [oldSlug, newSlug] of Object.entries(topicSlugMap)) {
  content = content.replace(
    new RegExp(`"${oldSlug}"`, 'g'),
    `"${newSlug}"`
  );
}

fs.writeFileSync('apps/api/src/modules/programs/templates.ts', content);
console.log('Fixed CET topic slugs');