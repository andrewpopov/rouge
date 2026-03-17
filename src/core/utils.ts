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

  runtimeWindow.ROUGE_UTILS = { clamp, deepClone, toNumber, uniquePush, uniqueStrings };
})();
