(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
  const pendingFrames: number[] = [];

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
  }

  function pendingCount(): number {
    return pendingTimeouts.length + pendingFrames.length;
  }

  runtimeWindow.ROUGE_VIEW_LIFECYCLE = {
    managedTimeout,
    managedRAF,
    cleanup,
    pendingCount,
  };
})();
