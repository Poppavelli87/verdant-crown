#!/usr/bin/env node
const fs = require("node:fs/promises");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_OUT = path.join(PROJECT_ROOT, "output", "qa", "scan-report.md");

function parseArgs(argv) {
  const options = {
    out: DEFAULT_OUT,
    outDir: "",
  };
  for (const raw of argv) {
    const [key, value = ""] = String(raw).split("=");
    if (key === "--out") options.out = path.resolve(PROJECT_ROOT, value);
    if (key === "--outDir") options.outDir = path.resolve(PROJECT_ROOT, value);
  }
  return options;
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function listFilesRecursive(rootDir, matcher, out = []) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "test-results" || entry.name === "playwright-report") {
      continue;
    }
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      await listFilesRecursive(fullPath, matcher, out);
      continue;
    }
    if (matcher(fullPath)) {
      out.push(fullPath);
    }
  }
  return out;
}

function rel(filePath) {
  return path.relative(PROJECT_ROOT, filePath).replace(/\\/g, "/");
}

function findPatternLines(content, regex) {
  const lines = String(content).split(/\r?\n/);
  const matches = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (regex.test(lines[i])) {
      matches.push({ line: i + 1, text: lines[i].trim() });
    }
  }
  return matches;
}

function collectHotAllocationHeuristics(filePath, content) {
  const lines = String(content).split(/\r?\n/);
  const candidates = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!/(function\s+update|function\s+render|\bupdate\s*\(|\brender\s*\(|\btick\s*\()/i.test(line)) {
      continue;
    }
    const windowEnd = Math.min(lines.length, i + 38);
    for (let j = i; j < windowEnd; j += 1) {
      const probe = lines[j];
      if (/\bnew\s+[A-Za-z_][A-Za-z0-9_]*(\(|\s)/.test(probe) || /\bArray\(/.test(probe) || /\{.*\}/.test(probe)) {
        candidates.push({
          file: rel(filePath),
          line: j + 1,
          text: probe.trim(),
        });
      }
    }
  }
  return candidates;
}

function summarizeDebugHooks(mainContent, allFileContents) {
  const hookRegex = /window\.(debug_[a-z0-9_]+)/gi;
  const defined = new Set();
  let match = hookRegex.exec(mainContent);
  while (match) {
    defined.add(match[1]);
    match = hookRegex.exec(mainContent);
  }
  const potentiallyUnused = [];
  for (const hook of [...defined].sort()) {
    const usedOutsideMain = allFileContents.some((entry) => {
      if (entry.path.endsWith("/src/main.js")) return false;
      return entry.content.includes(hook);
    });
    if (!usedOutsideMain) {
      potentiallyUnused.push(hook);
    }
  }
  return {
    count: defined.size,
    potentiallyUnused,
  };
}

function buildReport({
  generatedAt,
  todoMatches,
  consoleMatches,
  hotAllocations,
  debugSummary,
}) {
  const lines = [];
  lines.push("# Project Scan Report");
  lines.push("");
  lines.push(`- Generated: ${generatedAt}`);
  lines.push(`- TODO/FIXME matches: ${todoMatches.length}`);
  lines.push(`- console.error/warn in src: ${consoleMatches.length}`);
  lines.push(`- Hot-loop allocation heuristics: ${hotAllocations.length}`);
  lines.push(`- Debug hooks defined: ${debugSummary.count}`);
  lines.push(`- Potentially unused debug hooks: ${debugSummary.potentiallyUnused.length}`);
  lines.push("");

  lines.push("## TODO/FIXME");
  if (todoMatches.length === 0) {
    lines.push("- none");
  } else {
    for (const hit of todoMatches.slice(0, 120)) {
      lines.push(`- \`${hit.file}:${hit.line}\` ${hit.text}`);
    }
  }
  lines.push("");

  lines.push("## console.error / console.warn in src");
  if (consoleMatches.length === 0) {
    lines.push("- none");
  } else {
    for (const hit of consoleMatches.slice(0, 120)) {
      lines.push(`- \`${hit.file}:${hit.line}\` ${hit.text}`);
    }
  }
  lines.push("");

  lines.push("## Hot-loop allocation heuristics");
  if (hotAllocations.length === 0) {
    lines.push("- none");
  } else {
    for (const hit of hotAllocations.slice(0, 120)) {
      lines.push(`- \`${hit.file}:${hit.line}\` ${hit.text}`);
    }
  }
  lines.push("");

  lines.push("## Potentially unused debug hooks");
  if (debugSummary.potentiallyUnused.length === 0) {
    lines.push("- none");
  } else {
    for (const hook of debugSummary.potentiallyUnused.slice(0, 120)) {
      lines.push(`- \`${hook}\``);
    }
  }
  lines.push("");
  return lines.join("\n");
}

async function runScan(options) {
  const jsFiles = await listFilesRecursive(
    PROJECT_ROOT,
    (filePath) => filePath.endsWith(".js") || filePath.endsWith(".mjs")
  );
  const contents = [];
  for (const filePath of jsFiles) {
    const content = await fs.readFile(filePath, "utf8");
    contents.push({ path: rel(filePath), abs: filePath, content });
  }

  const todoMatches = [];
  const consoleMatches = [];
  const hotAllocations = [];

  for (const entry of contents) {
    const todo = findPatternLines(entry.content, /\b(?:TODO|FIXME)\b/);
    for (const hit of todo) {
      todoMatches.push({ file: entry.path, ...hit });
    }
    if (entry.path.startsWith("src/")) {
      const consoleHits = findPatternLines(entry.content, /\bconsole\.(?:error|warn)\s*\(/);
      for (const hit of consoleHits) {
        consoleMatches.push({ file: entry.path, ...hit });
      }
      hotAllocations.push(...collectHotAllocationHeuristics(entry.abs, entry.content));
    }
  }

  const mainEntry = contents.find((entry) => entry.path === "src/main.js");
  const debugSummary = summarizeDebugHooks(
    mainEntry?.content ?? "",
    contents.map((entry) => ({ path: `/${entry.path}`, content: entry.content }))
  );

  const report = buildReport({
    generatedAt: new Date().toISOString(),
    todoMatches,
    consoleMatches,
    hotAllocations,
    debugSummary,
  });

  await ensureDir(options.out);
  await fs.writeFile(options.out, report);
  if (options.outDir) {
    const inRunOut = path.join(options.outDir, "scan-report.md");
    await ensureDir(inRunOut);
    await fs.writeFile(inRunOut, report);
  }
  process.stdout.write(`${options.out}\n`);
}

runScan(parseArgs(process.argv.slice(2))).catch((error) => {
  process.stderr.write(`${error?.stack ?? error?.message ?? String(error)}\n`);
  process.exitCode = 1;
});
