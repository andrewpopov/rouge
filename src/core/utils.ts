(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  function deepClone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  function toNumber(value: unknown, fallback = 0): number {
    const n = Number(value);
    return Number.isNaN(n) ? fallback : n;
  }

  function uniquePush(list: string[], value: string | undefined | null): void {
    if (value && !list.includes(value)) {
      list.push(value);
    }
  }

  function uniqueStrings(values: unknown): string[] {
    if (!Array.isArray(values)) {
      return [];
    }
    const seen = new Set<string>();
    for (const v of values) {
      if (typeof v === "string" && v) {
        seen.add(v);
      }
    }
    return [...seen];
  }

  function slugify(value: unknown): string {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function parseInteger(value: unknown, fallback: number): number {
    const parsed = Number.parseInt(String(value ?? fallback), 10);
    return Number.isInteger(parsed) ? parsed : fallback;
  }

  function isObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object";
  }

  function hasTownFeature(profile: ProfileState | null | undefined, featureId: string): boolean {
    return Array.isArray(profile?.meta?.unlocks?.townFeatureIds) && profile.meta.unlocks.townFeatureIds.includes(featureId);
  }

  function getFocusedAccountTreeId(profile: ProfileState | null | undefined): string {
    return typeof profile?.meta?.accountProgression?.focusedTreeId === "string" ? profile.meta.accountProgression.focusedTreeId : "";
  }

  runtimeWindow.ROUGE_UTILS = {
    clamp, deepClone, toNumber, uniquePush, uniqueStrings,
    slugify, parseInteger, isObject, hasTownFeature, getFocusedAccountTreeId,
  };
})();
