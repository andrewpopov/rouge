#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const {
  getBalanceDatabasePath,
  openBalanceDatabase,
  readBalanceArtifactFromDatabase,
  readBalanceArtifactIndexFromDatabase,
  readBalanceJobStateByArtifactPath,
} = require("./balance-db.js");

const ROOT = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const parsed = {
    dbPath: getBalanceDatabasePath(ROOT),
    indexPath: path.join(ROOT, "artifacts", "balance", "index.json"),
    latestJobPath: path.join(ROOT, "artifacts", "balance", "latest-orchestrator-job.json"),
    output: path.join(ROOT, "artifacts", "balance", "dashboard.md"),
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--index" && next) {
      parsed.indexPath = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--db" && next) {
      parsed.dbPath = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--job" && next) {
      parsed.latestJobPath = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--output" && next) {
      parsed.output = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--json") {
      parsed.json = true;
    }
  }

  return parsed;
}

function loadJson(filePath, fallback) {
  if (!filePath || !fs.existsSync(filePath)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadArtifact(artifactPath, db) {
  if (db) {
    const fromDb = readBalanceArtifactFromDatabase(db, artifactPath);
    if (fromDb) {
      return fromDb;
    }
  }
  return loadJson(artifactPath || "", null);
}

function buildDashboard(indexEntries, latestJob, db) {
  const activeJob = latestJob
    ? (() => {
        const jobStatePath = latestJob.output ? latestJob.output.replace(/\.json$/i, ".job.json") : "";
        const jobState = db && latestJob.output
          ? readBalanceJobStateByArtifactPath(db, latestJob.output) || loadJson(jobStatePath, null)
          : loadJson(jobStatePath, null);
        const artifact = loadArtifact(latestJob.output || "", db);
        return {
          ...latestJob,
          jobState,
          artifactCoverage: artifact
            ? {
                completedRuns: artifact.aggregate?.completedRuns || 0,
                totalRuns: artifact.aggregate?.runs || 0,
                coverageRate: artifact.aggregate?.coverageRate || 0,
              }
            : null,
        };
      })()
    : null;

  const latestArtifacts = (Array.isArray(indexEntries) ? indexEntries : []).slice(0, 10).map((entry) => {
    const artifact = loadArtifact(entry.artifactPath || "", db);
    const overall = artifact?.aggregate?.overall || {};
    const committedLanes = [...(artifact?.aggregate?.archetypes?.committedLanes || [])]
      .sort((left, right) =>
        String(left.laneHealth || "").localeCompare(String(right.laneHealth || "")) ||
        Number(right.clearRate || 0) - Number(left.clearRate || 0) ||
        Number(right.averageLaneIntegrityFinal || 0) - Number(left.averageLaneIntegrityFinal || 0)
      );
    const naturalConvergence = [...(artifact?.aggregate?.archetypes?.naturalConvergence || [])]
      .sort((left, right) =>
        Number(right.convergenceRate || 0) - Number(left.convergenceRate || 0) ||
        Number(right.averageFinalLaneIntegrity || 0) - Number(left.averageFinalLaneIntegrity || 0)
      );
    const topDeckRuns = [...(artifact?.runs || [])]
      .filter((run) => run?.summary?.finalBuild?.deckProfile)
      .sort((left, right) =>
        Number(right.summary.finalBuild.deckProfile.targetShapeFit || 0) - Number(left.summary.finalBuild.deckProfile.targetShapeFit || 0) ||
        Number(right.finalLevel || 0) - Number(left.finalLevel || 0) ||
        String(left.className || "").localeCompare(String(right.className || ""))
      )
      .slice(0, 3)
      .map((run) => ({
        className: run.className,
        policyLabel: run.policyLabel,
        targetArchetypeLabel: run.targetArchetypeLabel,
        deckFamily: run.summary.finalBuild.deckProfile.deckFamily,
        targetShapeFit: run.summary.finalBuild.deckProfile.targetShapeFit,
        reinforcedCardCount: run.summary.finalBuild.deckProfile.reinforcedCardCount,
        starterShellCardsRemaining: run.summary.finalBuild.deckProfile.starterShellCardsRemaining,
        centerpieceCards: run.summary.finalBuild.deckProfile.centerpieceCards.map((card) => card.title),
        committedAtAct: run.summary.buildJourney?.committedAtAct || 0,
        firstMajorReinforcementAct: run.summary.buildJourney?.firstMajorReinforcementAct || 0,
      }));
    return {
      ...entry,
      bands: artifact?.bands || [],
      baselineComparison: artifact?.baselineComparison || null,
      decisionTension: artifact?.aggregate?.overall?.decisionTension || null,
      deckProfile: {
        averageTargetShapeFit: Number(overall.averageTargetShapeFit || 0),
        averageStarterShellCardsRemaining: Number(overall.averageStarterShellCardsRemaining || 0),
        averageReinforcedCardCount: Number(overall.averageReinforcedCardCount || 0),
        averageCenterpieceCount: Number(overall.averageCenterpieceCount || 0),
        deckFamilyDistribution: overall.deckFamilyDistribution || {},
      },
      buildJourney: {
        averageCommittedAtAct: Number(overall.averageCommittedAtAct || 0),
        averageFirstMajorReinforcementAct: Number(overall.averageFirstMajorReinforcementAct || 0),
        averagePurgeCount: Number(overall.averagePurgeCount || 0),
        averageRefinementCount: Number(overall.averageRefinementCount || 0),
        averageEvolutionCount: Number(overall.averageEvolutionCount || 0),
      },
      archetypes: {
        naturalConvergence,
        committedLanes,
      },
      topCommittedLanes: committedLanes.slice(0, 3),
      topNaturalConvergence: naturalConvergence.slice(0, 3),
      topDeckRuns,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    activeJob,
    latestArtifacts,
  };
}

function buildMarkdown(dashboard) {
  const lines = [
    "# Balance Dashboard",
    "",
    `Generated: ${dashboard.generatedAt}`,
    "",
    "## Active Job",
  ];

  if (!dashboard.activeJob) {
    lines.push("- None");
  } else {
    const job = dashboard.activeJob;
    lines.push(`- Suite: \`${job.suite}\``);
    lines.push(`- Started: ${job.startedAt}`);
    lines.push(`- PID: ${job.pid}`);
    lines.push(`- Artifact: \`${job.output}\``);
    lines.push(`- Log: \`${job.log}\``);
    if (job.jobState) {
      lines.push(
        `- Progress: ${job.jobState.completedRuns}/${job.jobState.totalRuns} completed, ${job.jobState.pendingRunKeys.length} pending, ${job.jobState.failedRunKeys.length} failed, ${job.jobState.slowRunKeys.length} slow`
      );
    }
    if (job.artifactCoverage) {
      lines.push(`- Artifact coverage: ${(Number(job.artifactCoverage.coverageRate || 0) * 100).toFixed(1)}%`);
    }
  }

  lines.push("", "## Latest Artifacts");
  if ((dashboard.latestArtifacts || []).length === 0) {
    lines.push("- None");
  } else {
    dashboard.latestArtifacts.forEach((entry) => {
      const failedBands = (entry.bands || []).filter((band) => band.status === "fail").length;
      const healthyLanes = (entry.archetypes?.committedLanes || []).filter((lane) => lane.laneHealth === "healthy").length;
      const tension = entry.decisionTension?.status ? `, tension ${entry.decisionTension.status}` : "";
      const deckFit = Number(entry.deckProfile?.averageTargetShapeFit || 0);
      lines.push(
        `- \`${entry.experimentId}\` (${entry.scenarioType}): ${(Number(entry.coverageRate || 0) * 100).toFixed(1)}% coverage, ${(Number(entry.overallWinRate || 0) * 100).toFixed(1)}% win, ${failedBands} failed bands, ${healthyLanes} healthy committed lanes, deck fit ${deckFit.toFixed(2)}${tension}`
      );
      if (entry.decisionTension?.reasons?.length) {
        lines.push(`  tension notes: ${entry.decisionTension.reasons.join("; ")}`);
      }
      const deckFamilies = Object.entries(entry.deckProfile?.deckFamilyDistribution || {})
        .map(([family, rate]) => `${family} ${(Number(rate || 0) * 100).toFixed(1)}%`)
        .join(", ");
      lines.push(
        `  deck profile: reinforced ${Number(entry.deckProfile?.averageReinforcedCardCount || 0).toFixed(2)}, starter shell ${Number(entry.deckProfile?.averageStarterShellCardsRemaining || 0).toFixed(2)}, centerpieces ${Number(entry.deckProfile?.averageCenterpieceCount || 0).toFixed(2)}`
      );
      lines.push(
        `  build journey: commit act ${Number(entry.buildJourney?.averageCommittedAtAct || 0).toFixed(2)}, first reinforcement ${Number(entry.buildJourney?.averageFirstMajorReinforcementAct || 0).toFixed(2)}, purges ${Number(entry.buildJourney?.averagePurgeCount || 0).toFixed(2)}, refinements ${Number(entry.buildJourney?.averageRefinementCount || 0).toFixed(2)}, evolutions ${Number(entry.buildJourney?.averageEvolutionCount || 0).toFixed(2)}`
      );
      if (deckFamilies) {
        lines.push(`  families: ${deckFamilies}`);
      }
      (entry.topCommittedLanes || []).forEach((lane) => {
        lines.push(
          `  lane ${lane.className} / ${lane.targetArchetypeLabel}: ${(Number(lane.clearRate || 0) * 100).toFixed(1)}% clear, ${(Number(lane.committedByCheckpointRate || 0) * 100).toFixed(1)}% commit, integrity ${Number(lane.averageLaneIntegrityFinal || 0).toFixed(2)}, ${lane.laneHealth}`
        );
      });
      (entry.topNaturalConvergence || []).forEach((lane) => {
        lines.push(
          `  natural ${lane.className} / ${lane.policyLabel} -> ${lane.archetypeLabel}: ${(Number(lane.convergenceRate || 0) * 100).toFixed(1)}% convergence, integrity ${Number(lane.averageFinalLaneIntegrity || 0).toFixed(2)}`
        );
      });
      (entry.topDeckRuns || []).forEach((run) => {
        const targetSuffix = run.targetArchetypeLabel ? ` / ${run.targetArchetypeLabel}` : "";
        lines.push(
          `  deck ${run.className} / ${run.policyLabel}${targetSuffix}: ${run.deckFamily}, fit ${Number(run.targetShapeFit || 0).toFixed(2)}, reinforced ${Number(run.reinforcedCardCount || 0)}, starter shell ${Number(run.starterShellCardsRemaining || 0)}, commit act ${Number(run.committedAtAct || 0)}, reinforce act ${Number(run.firstMajorReinforcementAct || 0)}`
        );
        if ((run.centerpieceCards || []).length > 0) {
          lines.push(`    centerpiece cards: ${run.centerpieceCards.join(", ")}`);
        }
      });
    });
  }

  return lines.join("\n");
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const db = openBalanceDatabase({ dbPath: options.dbPath, readonly: true });
  try {
    const indexEntries = db
      ? readBalanceArtifactIndexFromDatabase(db, { limit: 10 })
      : loadJson(options.indexPath, []);
    const dashboard = buildDashboard(
      indexEntries.length > 0 ? indexEntries : loadJson(options.indexPath, []),
      loadJson(options.latestJobPath, null),
      db
    );

    if (options.json) {
      console.log(JSON.stringify(dashboard, null, 2));
      return;
    }

    fs.mkdirSync(path.dirname(options.output), { recursive: true });
    fs.writeFileSync(options.output, buildMarkdown(dashboard));
    console.log(options.output);
  } finally {
    if (db) {
      db.close();
    }
  }
}

main();
