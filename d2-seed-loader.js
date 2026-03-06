(() => {
  const SEED_ROOT = "./data/seeds/d2";
  const SEED_FILES = {
    classes: "classes.json",
    skills: "skills.json",
    zones: "zones.json",
    enemyPools: "enemy-pools.json",
    assetsManifest: "assets-manifest.json",
  };

  function readJsonSync(path) {
    if (typeof XMLHttpRequest !== "function") {
      return null;
    }

    try {
      const request = new XMLHttpRequest();
      request.open("GET", path, false);
      request.send(null);
      if ((request.status >= 200 && request.status < 300) || request.status === 0) {
        return JSON.parse(request.responseText || "null");
      }
    } catch (_error) {
      return null;
    }

    return null;
  }

  function loadSeedBundle() {
    const bundle = Object.entries(SEED_FILES).reduce((acc, [key, fileName]) => {
      acc[key] = readJsonSync(`${SEED_ROOT}/${fileName}`);
      return acc;
    }, {});

    const loaded = [bundle.classes, bundle.skills, bundle.zones, bundle.enemyPools].every(
      (entry) => entry && typeof entry === "object"
    );

    window.BRASSLINE_SEEDS_D2 = bundle;
    window.BRASSLINE_SEEDS_D2_LOADED = loaded;
  }

  if (!window.BRASSLINE_SEEDS_D2) {
    loadSeedBundle();
  }
})();
