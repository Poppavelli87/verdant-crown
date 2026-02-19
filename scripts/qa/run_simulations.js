#!/usr/bin/env node
const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { chromium } = require("@playwright/test");
const {
  SCENARIOS,
  DEFAULT_WARN_DENYLIST,
  ensureDir,
  resolveScenarioList,
  chooseScenarioForRun,
  createRunRecord,
  pushTimeline,
  bootstrapPage,
  attachConsoleTrap,
  runSingleSimulation,
} = require("./simShared.js");

function parseArgs(argv) {
  const options = {
    runs: 25,
    seedBase: 1234,
    scenario: "all",
    headed: false,
    url: "http://127.0.0.1:4173",
  };
  for (const raw of argv) {
    const [key, value = ""] = String(raw).split("=");
    if (key === "--runs") options.runs = Math.max(1, Number(value) || 25);
    if (key === "--seedBase") options.seedBase = Number(value) || 1234;
    if (key === "--scenario") options.scenario = String(value || "all");
    if (key === "--headed") options.headed = ["1", "true", "yes"].includes(String(value).toLowerCase());
    if (key === "--url") options.url = String(value || options.url);
  }
  return options;
}

function timestampTag(now = new Date()) {
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const mmm = String(now.getMilliseconds()).padStart(3, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}-${mmm}`;
}

async function writeJson(filePath, payload) {
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2));
}

async function checkServer(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return Boolean(response?.ok);
  } catch {
    return false;
  }
}

async function waitForServer(url, timeoutMs = 20_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await checkServer(url)) return true;
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  return false;
}

async function ensureServer(projectRoot, url) {
  const alreadyRunning = await checkServer(url);
  if (alreadyRunning) {
    return { reused: true, child: null, command: "existing" };
  }
  const parsed = new URL(url);
  const port = Number(parsed.port || 4173);
  const child = spawn("python", ["-m", "http.server", String(port)], {
    cwd: projectRoot,
    stdio: "ignore",
    windowsHide: true,
  });
  const healthy = await waitForServer(url, 22_000);
  if (!healthy) {
    child.kill();
    throw new Error(`Unable to start local server at ${url}`);
  }
  return { reused: false, child, command: `python -m http.server ${port}` };
}

function summarizeRuns(runs) {
  const summary = {
    totalRuns: runs.length,
    passedRuns: runs.filter((run) => run.pass).length,
    failedRuns: runs.filter((run) => !run.pass).length,
    totalErrors: runs.reduce((count, run) => count + run.errors.length, 0),
    totalWarnings: runs.reduce((count, run) => count + run.warnings.length, 0),
    scenarios: {},
    dialogueCoverage: {},
  };
  const allMilestones = [
    "elaine_join",
    "act2_entry",
    "loom_proctor_defeat",
    "act3_last_door",
    "final_boss_start",
    "ending_selected",
  ];
  for (const milestone of allMilestones) {
    const hits = runs.filter((run) => Object.prototype.hasOwnProperty.call(run.milestones, milestone)).length;
    const withDialogue = runs.filter((run) => Boolean(run.dialogueCoverage?.[milestone])).length;
    summary.dialogueCoverage[milestone] = { hits, withDialogue };
  }
  for (const run of runs) {
    if (!summary.scenarios[run.scenarioId]) {
      summary.scenarios[run.scenarioId] = {
        runs: 0,
        passed: 0,
        failed: 0,
        errors: 0,
      };
    }
    const target = summary.scenarios[run.scenarioId];
    target.runs += 1;
    target.passed += run.pass ? 1 : 0;
    target.failed += run.pass ? 0 : 1;
    target.errors += run.errors.length;
  }
  return summary;
}

function buildSummaryMarkdown({ options, outDir, summary, runs, routeMap, debugHooks, serverMeta }) {
  const lines = [];
  lines.push("# Verdant Crown RC Simulation Summary");
  lines.push("");
  lines.push(`- Timestamp: ${new Date().toISOString()}`);
  lines.push(`- Output directory: \`${outDir}\``);
  lines.push(`- URL: \`${options.url}\``);
  lines.push(`- Runs: ${summary.totalRuns}`);
  lines.push(`- Pass: ${summary.passedRuns}`);
  lines.push(`- Fail: ${summary.failedRuns}`);
  lines.push(`- Console/page errors: ${summary.totalErrors}`);
  lines.push(`- Warnings captured: ${summary.totalWarnings}`);
  lines.push(`- Server mode: ${serverMeta.reused ? "reused existing" : "spawned local python server"}`);
  lines.push("");
  lines.push("## Route map (internal)");
  for (const item of routeMap) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("## Debug hooks observed");
  for (const hook of debugHooks) {
    lines.push(`- \`${hook}\``);
  }
  lines.push("");
  lines.push("## Scenario breakdown");
  for (const [scenarioId, stats] of Object.entries(summary.scenarios)) {
    lines.push(`- ${scenarioId}: ${stats.passed}/${stats.runs} passed, errors=${stats.errors}`);
  }
  lines.push("");
  lines.push("## Story continuity coverage");
  for (const [milestone, stats] of Object.entries(summary.dialogueCoverage)) {
    lines.push(`- ${milestone}: dialogue ${stats.withDialogue}/${stats.hits}`);
  }
  lines.push("");
  lines.push("## Failed runs");
  const failed = runs.filter((run) => !run.pass);
  if (failed.length === 0) {
    lines.push("- none");
  } else {
    for (const run of failed) {
      lines.push(`- ${run.runId} (${run.scenarioId})`);
      for (const error of run.errors.slice(0, 8)) {
        lines.push(`  - ${error}`);
      }
    }
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("- Scenarios are deterministic and selected with `seedBase + runIndex` over the chosen scenario set.");
  lines.push("- Debug hooks are used as fallback for deep-story reachability and are recorded in each run JSON.");
  lines.push("- Frame-time and heap metrics are best-effort and browser-dependent.");
  lines.push("");
  return lines.join("\n");
}

function buildReleaseNotes(summary) {
  const lines = [];
  lines.push("# Release Candidate QA Notes");
  lines.push("");
  lines.push(`- Deterministic simulation runs: ${summary.totalRuns}`);
  lines.push(`- Passed runs: ${summary.passedRuns}`);
  lines.push(`- Failed runs: ${summary.failedRuns}`);
  lines.push(`- Console/page errors: ${summary.totalErrors}`);
  lines.push("");
  lines.push("## Scope");
  lines.push("- Smoke route");
  lines.push("- Act I threat vein progression");
  lines.push("- Act II inner spire locks + Loom Proctor");
  lines.push("- Act III both endings (seal/rewrite)");
  lines.push("- Regression checks: swaps, Elaine active flow, AI spacing, visual stability");
  lines.push("");
  lines.push("## Recommended commit message");
  lines.push("- `Add deterministic RC simulation harness, stress checks, and QA reporting`");
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const projectRoot = path.resolve(__dirname, "..", "..");
  const outDir = path.join(projectRoot, "output", "qa", timestampTag());
  const runsDir = path.join(outDir, "runs");
  await ensureDir(outDir);
  await ensureDir(runsDir);

  const scenarioList = resolveScenarioList(options.scenario);
  const routeMap = [
    "start -> prologue -> Arthur opening -> Thornmere",
    "Thornmere -> Hollow Scar -> first Vein quest -> Rowan heal/report",
    "Endgame Act II -> Inner Spire locks -> Loom Proctor -> Last Door",
    "Endgame Act III -> Last Spire rift/core setpieces -> Narrator Crown -> ending choice",
  ];
  const debugHooks = [
    "debug_warp_to_scene",
    "debug_set_story_flag",
    "debug_set_objective",
    "debug_get_current_objective",
    "debug_get_story_flags",
    "debug_complete_resonance_lock",
    "debug_start_loom_proctor",
    "debug_start_rift_setpiece",
    "debug_disable_final_clamp",
    "debug_start_final_boss",
    "debug_trigger_choice_ui",
    "debug_force_basic_attack",
    "debug_force_elaine_cast",
    "debug_get_party_ai_state",
    "debug_get_render_state",
    "debug_validate_story",
  ];

  const serverMeta = await ensureServer(projectRoot, options.url);
  const browser = await chromium.launch({
    headless: !options.headed,
  });
  const allRuns = [];

  try {
    for (let i = 0; i < options.runs; i += 1) {
      const runIndex = i + 1;
      const scenarioId = chooseScenarioForRun(i, options.seedBase, scenarioList);
      const seed = options.seedBase + i;
      const run = createRunRecord({
        runIndex,
        scenarioId,
        seed,
        outputDir: outDir,
      });
      pushTimeline(run, "run start", { scenarioId, seed });

      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
        colorScheme: "light",
      });
      const page = await context.newPage();
      attachConsoleTrap(page, run, DEFAULT_WARN_DENYLIST);
      try {
        await bootstrapPage(page, { url: options.url });
        await runSingleSimulation({ page, run });
      } catch (error) {
        run.errors.push(`run exception: ${error?.stack ?? error?.message ?? String(error)}`);
        run.pass = false;
        run.endedAt = new Date().toISOString();
      } finally {
        await context.close();
      }

      const runFile = path.join(runsDir, `${run.runId}.json`);
      await writeJson(runFile, run);
      allRuns.push(run);
      const status = run.pass ? "PASS" : "FAIL";
      process.stdout.write(`[${status}] ${run.runId} ${run.scenarioId} errors=${run.errors.length}\n`);
    }
  } finally {
    await browser.close();
    if (!serverMeta.reused && serverMeta.child) {
      serverMeta.child.kill();
    }
  }

  const summary = summarizeRuns(allRuns);
  const summaryPayload = {
    options,
    outputDir: outDir,
    generatedAt: new Date().toISOString(),
    summary,
    routeMap,
    debugHooks,
    runs: allRuns.map((run) => ({
      runId: run.runId,
      scenarioId: run.scenarioId,
      pass: run.pass,
      errors: run.errors.length,
      objective: run.final.objective,
      sceneId: run.final.sceneId,
      integrityIssues: run.final.integrityIssues,
    })),
  };
  const summaryMd = buildSummaryMarkdown({
    options,
    outDir,
    summary,
    runs: allRuns,
    routeMap,
    debugHooks,
    serverMeta,
  });
  const releaseNotes = buildReleaseNotes(summary);
  await writeJson(path.join(outDir, "summary.json"), summaryPayload);
  await fs.writeFile(path.join(outDir, "summary.md"), summaryMd);
  await fs.writeFile(path.join(outDir, "release-notes.md"), releaseNotes);

  process.stdout.write(`Summary: ${path.join(outDir, "summary.md")}\n`);
  if (summary.failedRuns > 0 || summary.totalErrors > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(`${error?.stack ?? error?.message ?? String(error)}\n`);
  process.exitCode = 1;
});
