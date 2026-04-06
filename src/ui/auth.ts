(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const GOOGLE_CLIENT_ID = "446638996728-tbolrc87b1rdj5q8iekcp3e0egqfoato.apps.googleusercontent.com";

  let authState: RogueAuthState = { user: null, loading: true, ready: false };
  const listeners: Array<() => void> = [];
  let readyResolved = false;
  let resolveReady: (() => void) | null = null;
  const readyPromise = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });

  function notifyListeners(): void {
    listeners.forEach((fn) => { try { fn(); } catch { /* listener error */ } });
  }

  function markReady(): void {
    if (!readyResolved && authState.ready) {
      readyResolved = true;
      resolveReady?.();
      resolveReady = null;
    }
  }

  function getAuthState(): RogueAuthState {
    return { ...authState };
  }

  function onAuthChange(fn: () => void): void {
    listeners.push(fn);
  }

  async function checkSession(): Promise<void> {
    try {
      const resp = await fetch("/api/auth/status", { credentials: "same-origin" });
      const data = await resp.json();
      if (data.authenticated && data.user) {
        authState = { user: data.user, loading: false, ready: true };
      } else {
        authState = { user: null, loading: false, ready: true };
      }
    } catch {
      authState = { user: null, loading: false, ready: true };
    }
    markReady();
    notifyListeners();
  }

  async function handleCredentialResponse(response: { credential: string }): Promise<void> {
    try {
      const resp = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await resp.json();
      if (data.ok && data.user) {
        authState = { user: data.user, loading: false, ready: true };
      }
    } catch {
      // silent — user stays signed out
    }
    notifyListeners();
  }

  function initializeGoogleAuth(): void {
    const gis = (runtimeWindow as unknown as Record<string, unknown>).google as
      | { accounts: { id: { initialize: (config: Record<string, unknown>) => void; prompt: () => void } } }
      | undefined;

    if (gis?.accounts?.id) {
      gis.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true,
      });
      gis.accounts.id.prompt();
    }

    checkSession();
  }

  function renderSignInButton(container: HTMLElement): void {
    const gis = (runtimeWindow as unknown as Record<string, unknown>).google as
      | { accounts: { id: { renderButton: (el: HTMLElement, config: Record<string, unknown>) => void } } }
      | undefined;

    if (gis?.accounts?.id?.renderButton) {
      gis.accounts.id.renderButton(container, {
        theme: "filled_black",
        shape: "pill",
        size: "large",
      });
    }
  }

  function waitUntilReady(): Promise<void> {
    return authState.ready ? Promise.resolve() : readyPromise;
  }

  async function signOut(): Promise<void> {
    const gis = (runtimeWindow as unknown as Record<string, unknown>).google as
      | { accounts: { id: { disableAutoSelect: () => void } } }
      | undefined;

    if (gis?.accounts?.id?.disableAutoSelect) {
      gis.accounts.id.disableAutoSelect();
    }

    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      // best-effort
    }
    authState = { user: null, loading: false, ready: true };
    notifyListeners();
  }

  runtimeWindow.ROGUE_AUTH = {
    initializeGoogleAuth,
    checkSession,
    handleCredentialResponse,
    renderSignInButton,
    signOut,
    getAuthState,
    onAuthChange,
    waitUntilReady,
  };
})();
