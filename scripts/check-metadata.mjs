import fs from "fs";
import path from "path";

const cwd = process.cwd();
const appDir = path.join(cwd, "app");

function findPageFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findPageFiles(filePath));
    } else if (file === "page.tsx") {
      results.push(filePath);
    }
  }
  return results;
}

const pageFiles = findPageFiles(appDir);
let missing = 0;
let valid = 0;

console.log("\n🔍 Auditing Dime Next.js Page Metadata...\n");

for (const file of pageFiles) {
  const relative = path.relative(appDir, file).replace(/\\/g, "/");
  const content = fs.readFileSync(file, "utf8");

  const hasStaticMetadata = /export\s+const\s+metadata/m.test(content);
  const hasDynamicMetadata = /export\s+(async\s+)?function\s+generateMetadata/m.test(content);
  const isClient = content.trim().startsWith('"use client"') || content.trim().startsWith("'use client'");

  // Check co-located layout.tsx if page is client
  let layoutHasMetadata = false;
  const layoutPath = path.join(path.dirname(file), "layout.tsx");
  if (fs.existsSync(layoutPath)) {
    const layoutContent = fs.readFileSync(layoutPath, "utf8");
    layoutHasMetadata = /export\s+const\s+metadata/m.test(layoutContent) || /export\s+(async\s+)?function\s+generateMetadata/m.test(layoutContent);
  }

  const isResolved = hasStaticMetadata || hasDynamicMetadata || layoutHasMetadata || relative === "page.tsx";

  if (isResolved) {
    valid++;
    const source = hasStaticMetadata ? "static" : hasDynamicMetadata ? "dynamic" : layoutHasMetadata ? "layout" : "root (layout)";
    console.log(`  ✅ [${source.padEnd(14)}] ${relative}`);
  } else {
    missing++;
    console.log(`  ❌ [MISSING       ] ${relative}${isClient ? " (use client - needs layout)" : ""}`);
  }
}

console.log(`\nAudit Complete: ${valid} passed, ${missing} missing.\n`);
if (missing > 0) process.exit(1);
