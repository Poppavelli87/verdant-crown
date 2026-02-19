const { test, expect } = require("@playwright/test");
const {
  SCENARIOS,
  createRunRecord,
  chooseScenarioForRun,
  bootstrapPage,
  attachConsoleTrap,
  runSingleSimulation,
} = require("../scripts/qa/simShared.js");

test.describe.configure({ mode: "serial" });

test("deterministic stress subset (5 loops) has no console/page errors", async ({ browser }, testInfo) => {
  test.setTimeout(15 * 60 * 1000);

  const scenarioList = [SCENARIOS.SMOKE, SCENARIOS.ACT2, SCENARIOS.ACT3_SEAL];
  const seedBase = 7001;
  const loops = 5;
  const results = [];

  for (let i = 0; i < loops; i += 1) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
      colorScheme: "light",
    });
    const page = await context.newPage();
    const run = createRunRecord({
      runIndex: i + 1,
      scenarioId: chooseScenarioForRun(i, seedBase, scenarioList),
      seed: seedBase + i,
      outputDir: testInfo.outputDir,
    });

    try {
      attachConsoleTrap(page, run);
      await bootstrapPage(page, { url: "/" });
      await runSingleSimulation({ page, run });
    } finally {
      await context.close();
    }
    results.push(run);

    expect(run.errors, `${run.runId} errors`).toEqual([]);
    expect(run.pass, `${run.runId} pass state`).toBe(true);
    expect(run.final.integrityIssues, `${run.runId} integrity`).toEqual([]);
  }

  expect(results).toHaveLength(loops);
  expect(results.every((entry) => entry.pass)).toBe(true);
});
