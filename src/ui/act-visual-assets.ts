(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const typedWindow = runtimeWindow as Window & {
    __ROUGE_ACT_VISUAL_ASSETS?: {
      getPosterSrc(actNumber: number): string;
      getTownArtSrc(actNumber: number): string;
      getEnvironmentSrc(actNumber: number): string;
    };
  };

  const ACT_POSTER_MAP: Record<number, string> = {
    1: "./assets/curated/act-maps/act1-the-blackwood-covenant.webp",
    2: "./assets/curated/act-maps/act2-the-sunken-sepulchers.webp",
    3: "./assets/curated/act-maps/act3-the-river-of-idols.webp",
    4: "./assets/curated/act-maps/act4-the-ashen-gate.webp",
    5: "./assets/curated/act-maps/act5-the-frost-siege-charter.webp",
  };

  const ACT_TOWN_ART_MAP: Record<number, string> = {
    1: "./assets/curated/town-maps/act1.webp",
    2: "./assets/curated/town-maps/act2.webp",
    3: "./assets/curated/town-maps/act3.webp",
    4: "./assets/curated/town-maps/act4.webp",
    5: "./assets/curated/town-maps/act5.webp",
  };

  const ACT_ENVIRONMENT_MAP: Record<number, string> = {
    1: "./assets/curated/combat-backgrounds/moor.webp",
    2: "./assets/curated/combat-backgrounds/desert.webp",
    3: "./assets/curated/combat-backgrounds/jungle.webp",
    4: "./assets/curated/combat-backgrounds/hell.webp",
    5: "./assets/curated/combat-backgrounds/worldstone_keep.webp",
  };

  function normalizeActNumber(actNumber: number): number {
    const value = Number(actNumber) || 1;
    return Math.max(1, Math.min(5, value));
  }

  function getFromMap(map: Record<number, string>, actNumber: number): string {
    const normalizedActNumber = normalizeActNumber(actNumber);
    return map[normalizedActNumber] || map[1] || "";
  }

  typedWindow.__ROUGE_ACT_VISUAL_ASSETS = {
    getPosterSrc(actNumber: number): string {
      return getFromMap(ACT_POSTER_MAP, actNumber);
    },
    getTownArtSrc(actNumber: number): string {
      return getFromMap(ACT_TOWN_ART_MAP, actNumber);
    },
    getEnvironmentSrc(actNumber: number): string {
      return getFromMap(ACT_ENVIRONMENT_MAP, actNumber);
    },
  };
})();
