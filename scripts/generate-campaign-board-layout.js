#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ZONES_PATH = path.join(ROOT, "data/seeds/d2/zones.json");

const ROW_Y = [26, 48, 70, 86];
const LEFT = 6;
const RIGHT = 94;
const MAX_MAINLINE_PER_ROW = 5;

function loadActs() {
  return JSON.parse(fs.readFileSync(ZONES_PATH, "utf8")).acts || [];
}

function buildActNodes(act) {
  const branchNames = new Set((act.sideBranches || []).map((branch) => branch.name));
  const mainline = (act.mainlineZones || []).filter((title) => title !== act.town);
  const nodes = [
    { id: "town", title: act.town, kind: "town", from: null },
    ...mainline.map((title) => ({ id: title, title, kind: "battle", from: null })),
    { id: act.boss.zone, title: act.boss.zone, kind: "boss", from: mainline[mainline.length - 1] || act.town },
    ...(act.sideBranches || []).map((branch) => ({
      id: branch.name,
      title: branch.name,
      kind: branch.kind || "battle",
      from: branch.from,
      gatedBy: branch.gatedBy || "",
    })),
  ];

  const branchChildren = new Map();
  for (const branch of act.sideBranches || []) {
    if (!branchChildren.has(branch.from)) {
      branchChildren.set(branch.from, []);
    }
    branchChildren.get(branch.from).push(branch.name);
  }

  return { nodes, branchNames, branchChildren };
}

function layoutMainline(act) {
  const mainline = [act.town, ...(act.mainlineZones || []).filter((title) => title !== act.town), act.boss.zone];
  const positions = {};
  const rowSizes = distributeRowSizes(mainline.length, MAX_MAINLINE_PER_ROW);
  let consumed = 0;

  for (let row = 0; row < rowSizes.length; row += 1) {
    const rowCount = rowSizes[row];
    const forward = row % 2 === 0;
    const y = ROW_Y[Math.min(row, ROW_Y.length - 1)];
    for (let slot = 0; slot < rowCount; slot += 1) {
      const index = consumed + slot;
      const progress = rowCount <= 1 ? 0.5 : slot / (rowCount - 1);
      const x = forward
        ? LEFT + progress * (RIGHT - LEFT)
        : RIGHT - progress * (RIGHT - LEFT);
      positions[mainline[index] === act.town ? "town" : mainline[index]] = [round(x), y];
    }
    consumed += rowCount;
  }

  return positions;
}

function distributeRowSizes(total, maxPerRow) {
  const rows = Math.ceil(total / maxPerRow);
  const sizes = new Array(rows).fill(Math.floor(total / rows));
  let remainder = total % rows;
  for (let index = 0; index < sizes.length; index += 1) {
    if (remainder <= 0) { break; }
    sizes[index] += 1;
    remainder -= 1;
  }
  return sizes;
}

function buildBranchChains(act) {
  const branchMap = new Map((act.sideBranches || []).map((branch) => [branch.name, branch]));
  const roots = (act.sideBranches || []).filter((branch) => !branchMap.has(branch.from));

  return roots.map((root) => {
    const chain = [root];
    let cursor = root.name;
    while (true) {
      const next = (act.sideBranches || []).find((branch) => branch.from === cursor);
      if (!next) { break; }
      chain.push(next);
      cursor = next.name;
    }
    return chain;
  });
}

function findRow(y) {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < ROW_Y.length; index += 1) {
    const distance = Math.abs(ROW_Y[index] - y);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }
  return bestIndex;
}

function layoutBranches(act, positions) {
  const chains = buildBranchChains(act);

  for (const chain of chains) {
    const root = chain[0];
    const sourceKey = root.from === act.town ? "town" : root.from;
    const source = positions[sourceKey];
    if (!source) { continue; }

    const sourceRow = findRow(source[1]);
    const chainLength = chain.length;
    const chainBelow = chainLength > 1 || Boolean(root.gatedBy);
    const y = chainBelow
      ? ROW_Y[Math.min(sourceRow + 1, ROW_Y.length - 2)]
      : Math.max(12, ROW_Y[Math.max(sourceRow - 1, 0)] - 8);

    let startX = source[0];
    let step = 18;

    if (chainBelow) {
      startX = source[0] + 9;
    } else if (source[0] > 72) {
      startX = source[0];
      step = 0;
    }

    if (source[0] > 76 && chainLength > 1) {
      startX = source[0] - 8;
      step = -16;
    }

    for (let index = 0; index < chain.length; index += 1) {
      const branch = chain[index];
      let x = startX + step * index;

      if (branch.name === "Icebound River") {
        x = source[0];
      }
      if (branch.name === "White Drift Cavern") {
        x = Math.min(RIGHT - 3, source[0] + 13);
        positions[branch.name] = [round(clamp(x, LEFT + 2, RIGHT - 2)), source[1]];
        continue;
      }

      positions[branch.name] = [round(clamp(x, LEFT + 2, RIGHT - 2)), y];
    }
  }
}

function buildLayout(act) {
  const positions = layoutMainline(act);
  layoutBranches(act, positions);
  return positions;
}

function buildLabelPlacements(positions) {
  const top = [];
  const right = [];
  const left = [];

  for (const [title, [x, y]] of Object.entries(positions)) {
    if (title === "town") { continue; }
    if (y <= 16) {
      if (x < 18) {
        right.push(title);
      } else if (x > 84) {
        left.push(title);
      } else {
        top.push(title);
      }
    } else if (x >= 84) {
      right.push(title);
    } else if (x <= 18) {
      left.push(title);
    }
  }

  return { top, right, left };
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function printUsage() {
  console.log("Usage: node scripts/generate-campaign-board-layout.js [--act 5]");
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    return;
  }

  const actIndex = args.indexOf("--act");
  const targetAct = actIndex >= 0 ? Number(args[actIndex + 1]) : 0;
  const acts = loadActs().filter((act) => !targetAct || act.act === targetAct);

  const output = {
    positions: {},
    labelPlacements: {
      top: [],
      right: [],
      left: [],
    },
  };

  for (const act of acts) {
    const positions = buildLayout(act);
    const placements = buildLabelPlacements(positions);
    output.positions[String(act.act)] = positions;
    output.labelPlacements.top.push(...placements.top);
    output.labelPlacements.right.push(...placements.right);
    output.labelPlacements.left.push(...placements.left);
  }

  console.log(JSON.stringify(output, null, 2));
}

main();
