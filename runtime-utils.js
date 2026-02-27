(() => {
  function createRuntimeUtils({ utils, trackLanes }) {
    const source = utils && typeof utils === "object" ? utils : {};
    const laneCount = Number.isInteger(trackLanes) && trackLanes > 0 ? trackLanes : 5;

    const clamp =
      typeof source.clamp === "function"
        ? source.clamp
        : (value, min, max) => Math.max(min, Math.min(max, value));

    const randomInt =
      typeof source.randomInt === "function"
        ? source.randomInt
        : (max) => Math.floor(Math.random() * max);

    const shuffleInPlace =
      typeof source.shuffleInPlace === "function"
        ? source.shuffleInPlace
        : (list) => {
            for (let i = list.length - 1; i > 0; i -= 1) {
              const j = randomInt(i + 1);
              const temp = list[i];
              list[i] = list[j];
              list[j] = temp;
            }
          };

    const escapeHtml =
      typeof source.escapeHtml === "function"
        ? source.escapeHtml
        : (text) =>
            String(text)
              .replaceAll("&", "&amp;")
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")
              .replaceAll('"', "&quot;")
              .replaceAll("'", "&#39;");

    const formatLaneCoverage =
      typeof source.formatLaneCoverage === "function"
        ? source.formatLaneCoverage
        : (lanes) => {
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
          };

    const parseLaneData =
      typeof source.parseLaneData === "function"
        ? (rawValue) => source.parseLaneData(rawValue, laneCount)
        : (rawValue) => {
            if (!rawValue) {
              return [];
            }
            return rawValue
              .split(",")
              .map((value) => Number.parseInt(value.trim(), 10))
              .filter((lane) => Number.isInteger(lane) && lane >= 0 && lane < laneCount);
          };

    const getTelegraphProgress =
      typeof source.getTelegraphProgress === "function"
        ? source.getTelegraphProgress
        : (telegraph) => {
            if (!telegraph || !Number.isFinite(telegraph.cookTurns) || telegraph.cookTurns <= 0) {
              return 1;
            }
            return clamp((telegraph.cookTurns - telegraph.turnsLeft) / telegraph.cookTurns, 0, 1);
          };

    return {
      clamp,
      randomInt,
      shuffleInPlace,
      escapeHtml,
      formatLaneCoverage,
      parseLaneData,
      getTelegraphProgress,
    };
  }

  window.BRASSLINE_RUNTIME_UTILS = {
    createRuntimeUtils,
  };
})();
