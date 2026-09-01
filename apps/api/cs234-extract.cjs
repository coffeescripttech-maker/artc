const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "src");
const found = new Map();
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "__tests__") walk(p); continue; }
    if (!e.name.endsWith(".ts")) continue;
    const text = fs.readFileSync(p, "utf8");
    const re = /requirePermission\(\s*"([a-z_]+\.[a-z_]+)"/g;
    let m;
    while ((m = re.exec(text))) {
      if (!found.has(m[1])) found.set(m[1], []);
      found.get(m[1]).push(path.relative(__dirname, p).replace(/\\/g, "/"));
    }
  }
}
walk(root);
const keys = [...found.keys()].sort();
console.log("MIDDLEWARE_KEYS=" + keys.length);
console.log(keys.join("\n"));
