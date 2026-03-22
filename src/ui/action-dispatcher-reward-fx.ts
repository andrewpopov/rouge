(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function spawnRewardParticles(sourceEl: HTMLElement): void {
    if (typeof document === "undefined" || !document.body || typeof sourceEl.getBoundingClientRect !== "function") { return; }
    const rect = sourceEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ["#f5c176", "#d48f46", "#ffd764", "#fff1dc"];
    for (let i = 0; i < 12; i++) {
      const dot = document.createElement("div");
      const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.5;
      const dist = 40 + Math.random() * 60;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      dot.style.cssText = `
        position:fixed; left:${cx}px; top:${cy}px; width:6px; height:6px;
        border-radius:50%; pointer-events:none; z-index:9999;
        background:${colors[i % colors.length]};
        box-shadow: 0 0 6px ${colors[i % colors.length]};
      `;
      document.body.appendChild(dot);
      if (typeof dot.animate === "function") {
        const anim = dot.animate([
          { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`, opacity: 0 },
        ], { duration: 600 + Math.random() * 200, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" });
        anim.onfinish = () => dot.remove();
      } else {
        runtimeWindow.ROUGE_VIEW_LIFECYCLE.managedTimeout(() => dot.remove(), 800);
      }
    }
  }

  runtimeWindow.__ROUGE_ACTION_DISPATCHER_REWARD_FX = {
    spawnRewardParticles,
  };
})();
