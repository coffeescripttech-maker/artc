// Quick smoke test: exercises parseMineru against the live mineru-api
// Run from apps/api: pnpm exec tsx mineru-smoke.ts
import { readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { parseMineru } from "./src/modules/utils/mineru.ts";
import { MINERU_FLAG } from "./src/config/index.ts";

const pdfPath = "test_quiz.pdf";
const buf = readFileSync(pdfPath);

console.log("MINERU_ENABLED =", MINERU_FLAG);
console.log("Calling parseMineru with", buf.length, "bytes from", pdfPath);

try {
  const start = Date.now();
  const result = await parseMineru(buf);
  const el = Date.now() - start;

  console.log("\n=== RESULT ===");
  console.log("transport:", result.transport);
  console.log("pages:", result.totalPages);
  console.log("figureCount:", result.figures.length);
  console.log("warnings:", result.warnings);
  console.log("markdown length:", result.markdown?.length);
  console.log("elapsed:", el + "ms");

  if (result.figures.length > 0) {
    const f = result.figures[0];
    console.log("\n=== FIRST FIGURE ===");
    console.log(JSON.stringify(f, null, 2));
  }

  if (result.markdown) {
    const lines = result.markdown.split("\n").slice(0, 12);
    console.log("\n=== markdown head ===");
    lines.forEach((l) => console.log(l));
  }

  writeFileSync(
    join(tmpdir(), "mineru-smoke.json"),
    JSON.stringify(
      { elapsed: el, pages: result.totalPages, figures: result.figures, mdLen: result.markdown?.length },
      null,
      2
    )
  );
  console.log("\n✅ ADAPTER SMOKE TEST PASSED");
} catch (e) {
  console.error("\n❌ parseMineru failed:", e instanceof Error ? e.message : String(e));
  process.exit(1);
}