(() => {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randomInt(max) {
    return Math.floor(Math.random() * max);
  }

  function shuffleInPlace(list) {
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = randomInt(i + 1);
      const temp = list[i];
      list[i] = list[j];
      list[j] = temp;
    }
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatLaneCoverage(lanes) {
    if (!lanes || lanes.length === 0) {
      return "none";
    }

    const sorted = [...new Set(lanes)].sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        ranges.push([start, end]);
        start = sorted[i];
        end = sorted[i];
      }
    }
    ranges.push([start, end]);

    return ranges
      .map(([a, b]) => {
        if (a === b) {
          return `T${a + 1}`;
        }
        return `T${a + 1}-T${b + 1}`;
      })
      .join(", ");
  }

  function parseLaneData(rawValue, laneCount) {
    if (!rawValue) {
      return [];
    }
    const maxLanes = Number.isInteger(laneCount) && laneCount > 0 ? laneCount : 0;
    return rawValue
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((lane) => Number.isInteger(lane) && lane >= 0 && lane < maxLanes);
  }

  function getTelegraphProgress(telegraph) {
    if (!telegraph || !Number.isFinite(telegraph.cookTurns) || telegraph.cookTurns <= 0) {
      return 1;
    }
    const ratio = (telegraph.cookTurns - telegraph.turnsLeft) / telegraph.cookTurns;
    return clamp(ratio, 0, 1);
  }

  window.BRASSLINE_UTILS = {
    clamp,
    randomInt,
    shuffleInPlace,
    escapeHtml,
    formatLaneCoverage,
    parseLaneData,
    getTelegraphProgress,
  };
})();
