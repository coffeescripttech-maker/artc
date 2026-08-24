const fs = require('fs');
const content = fs.readFileSync('apps/api/src/modules/programs/templates.ts', 'utf8');

let currentModuleSlug = null;
const lines = content.split('\n');
const newLines = lines.map(line => {
    // Track module slug
    const slugMatch = line.match(/slug:\s*"([^"]+)"/);
    if (slugMatch) {
        const slugVal = slugMatch[1];
        if (slugVal.endsWith('-grade-9') || slugVal.endsWith('-grade-10') || slugVal.endsWith('-grade-11') || slugVal.endsWith('-grade-12')) {
            currentModuleSlug = null;
        } else if (slugVal.match(/^(math|lang|read|bio|chem|phys|earth|ar|math10|math11|lang10|lang11|read10|read11|bio10|chem10|phys10|earth10|ar10|math11|lang11|read11|bio11|chem11|phys11|earth11|ar11)/)) {
            currentModuleSlug = slugVal;
        }
    }

    // Prefix topic slug if in a module
    if (currentModuleSlug) {
        const topicMatch = line.match(/slug:\s*"([^"]+)"/);
        if (topicMatch && !topicMatch[1].startsWith(currentModuleSlug + '-')) {
            const topicSlug = topicMatch[1];
            const newTopicSlug = currentModuleSlug + '-' + topicSlug;
            return line.replace(`slug: "${topicSlug}"`, `slug: "${newTopicSlug}"`);
        }
    }
    return line;
});

fs.writeFileSync('apps/api/src/modules/programs/templates.ts', newLines.join('\n'));
console.log('Done prefixing topic slugs');