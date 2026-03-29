(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
  const pendingFrames: number[] = [];
  const pendingCleanups: Array<() => void> = [];

  function managedTimeout(fn: () => void, delay: number): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      const idx = pendingTimeouts.indexOf(id);
      if (idx >= 0) { pendingTimeouts.splice(idx, 1); }
      fn();
    }, delay);
    pendingTimeouts.push(id);
    return id;
  }

  function managedRAF(fn: FrameRequestCallback): number {
    if (typeof requestAnimationFrame !== "function") {
      managedTimeout(() => fn(Date.now()), 16);
      return 0;
    }
    const id = requestAnimationFrame((ts) => {
      const idx = pendingFrames.indexOf(id);
      if (idx >= 0) { pendingFrames.splice(idx, 1); }
      fn(ts);
    });
    pendingFrames.push(id);
    return id;
  }

  function registerCleanup(fn: () => void): () => void {
    pendingCleanups.push(fn);
    return () => {
      const idx = pendingCleanups.indexOf(fn);
      if (idx >= 0) {
        pendingCleanups.splice(idx, 1);
      }
    };
  }

  function cleanup(): void {
    for (const id of pendingTimeouts) {
      clearTimeout(id);
    }
    pendingTimeouts.length = 0;
    for (const id of pendingFrames) {
      if (typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(id);
      }
    }
    pendingFrames.length = 0;
    const cleanups = pendingCleanups.splice(0, pendingCleanups.length);
    for (let index = cleanups.length - 1; index >= 0; index -= 1) {
      cleanups[index]();
    }
  }

  function pendingCount(): number {
    return pendingTimeouts.length + pendingFrames.length + pendingCleanups.length;
  }

  runtimeWindow.ROUGE_VIEW_LIFECYCLE = {
    managedTimeout,
    managedRAF,
    registerCleanup,
    cleanup,
    pendingCount,
  };
})();
