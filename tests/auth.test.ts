export {};

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import vm from "node:vm";

interface AuthSandbox {
  window: Window & Record<string, unknown>;
  fetch(input: string, init?: RequestInit): Promise<{ json(): Promise<unknown> }>;
  console: Console;
}

interface AuthHarness {
  auth: RogueAuthApi;
  browserWindow: Window & Record<string, unknown>;
  fetchCalls: Array<{ input: string; init?: RequestInit }>;
  initializeCalls: Array<Record<string, unknown>>;
  renderButtonCalls: Array<{ container: unknown; config: Record<string, unknown> }>;
  promptCount: { current: number };
  disableAutoSelectCount: { current: number };
  setFetchImpl(
    impl: (input: string, init?: RequestInit) => Promise<{ json(): Promise<unknown> }>
  ): void;
}

function createAuthHarness(): AuthHarness {
  let fetchImpl: (input: string, init?: RequestInit) => Promise<{ json(): Promise<unknown> }> = async () => ({
    json: async () => ({ authenticated: false, user: null as RogueAuthUser | null }),
  });
  const fetchCalls: Array<{ input: string; init?: RequestInit }> = [];
  const initializeCalls: Array<Record<string, unknown>> = [];
  const renderButtonCalls: Array<{ container: unknown; config: Record<string, unknown> }> = [];
  const promptCount = { current: 0 };
  const disableAutoSelectCount = { current: 0 };

  const googleApi = {
    accounts: {
      id: {
        initialize(config: Record<string, unknown>) {
          initializeCalls.push(config);
        },
        prompt() {
          promptCount.current += 1;
        },
        renderButton(container: unknown, config: Record<string, unknown>) {
          renderButtonCalls.push({ container, config });
        },
        disableAutoSelect() {
          disableAutoSelectCount.current += 1;
        },
      },
    },
  };

  const sandbox: AuthSandbox = {
    window: { google: googleApi } as unknown as Window & Record<string, unknown>,
    async fetch(input: string, init?: RequestInit) {
      fetchCalls.push({ input, init });
      return fetchImpl(input, init);
    },
    console,
  };

  const context = vm.createContext(sandbox);
  const scriptPath = path.resolve(__dirname, "../src/ui/auth.js");
  const source = fs.readFileSync(scriptPath, "utf8");
  vm.runInContext(source, context);

  return {
    auth: sandbox.window.ROGUE_AUTH,
    browserWindow: sandbox.window,
    fetchCalls,
    initializeCalls,
    renderButtonCalls,
    promptCount,
    disableAutoSelectCount,
    setFetchImpl(impl) {
      fetchImpl = impl;
    },
  };
}

function flushAuthWork(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

test("rogue auth initializes Google identity and restores an authenticated session", async () => {
  const harness = createAuthHarness();
  const user: RogueAuthUser = {
    googleId: "gid-1",
    email: "hero@example.com",
    name: "Deckard",
    avatarUrl: "https://example.com/deckard.png",
  };
  let notifications = 0;

  harness.setFetchImpl(async (input, init) => {
    assert.equal(input, "/api/auth/status");
    assert.equal(init?.credentials, "same-origin");
    return { json: async () => ({ authenticated: true, user }) };
  });
  harness.auth.onAuthChange(() => {
    notifications += 1;
  });

  harness.auth.initializeGoogleAuth();
  await flushAuthWork();
  await harness.auth.checkSession();

  assert.equal(harness.initializeCalls.length, 1);
  assert.equal(harness.promptCount.current, 1);
  assert.ok(harness.fetchCalls.length >= 1);
  assert.ok(notifications >= 1);
  assert.deepEqual(toPlain(harness.auth.getAuthState()), { user, loading: false, ready: true });
});

test("rogue auth survives listener errors and signs in through credential exchange", async () => {
  const harness = createAuthHarness();
  const user: RogueAuthUser = {
    googleId: "gid-2",
    email: "rogue@example.com",
    name: "Akara",
    avatarUrl: "https://example.com/akara.png",
  };
  let notifications = 0;

  harness.setFetchImpl(async (input, init) => {
    assert.equal(input, "/api/auth/google");
    assert.equal(init?.method, "POST");
    assert.equal(init?.credentials, "same-origin");
    assert.equal(init?.headers && (init.headers as Record<string, string>)["Content-Type"], "application/json");
    assert.equal(init?.body, JSON.stringify({ credential: "signed-token" }));
    return { json: async () => ({ ok: true, user }) };
  });
  harness.auth.onAuthChange(() => {
    throw new Error("listener failure should be ignored");
  });
  harness.auth.onAuthChange(() => {
    notifications += 1;
  });

  await harness.auth.handleCredentialResponse({ credential: "signed-token" });

  assert.equal(notifications, 1);
  assert.deepEqual(toPlain(harness.auth.getAuthState()), { user, loading: false, ready: true });
});

test("rogue auth renders the sign-in button, falls back cleanly on session failure, and signs out best-effort", async () => {
  const harness = createAuthHarness();
  const buttonContainer = { innerHTML: "" } as Parameters<RogueAuthApi["renderSignInButton"]>[0];
  let notifications = 0;

  harness.auth.onAuthChange(() => {
    notifications += 1;
  });

  harness.auth.renderSignInButton(buttonContainer);
  assert.equal(harness.renderButtonCalls.length, 1);
  assert.equal(harness.renderButtonCalls[0].container, buttonContainer);
  assert.deepEqual(toPlain(harness.renderButtonCalls[0].config), {
    theme: "filled_black",
    shape: "pill",
    size: "large",
  });

  delete (harness.browserWindow as { google?: unknown }).google;
  harness.auth.renderSignInButton(buttonContainer);
  assert.equal(harness.renderButtonCalls.length, 1);

  harness.setFetchImpl(async () => {
    throw new Error("status unavailable");
  });
  await harness.auth.checkSession();
  assert.equal(notifications, 1);
  assert.deepEqual(toPlain(harness.auth.getAuthState()), { user: null, loading: false, ready: true });

  (harness.browserWindow as { google?: unknown }).google = {
    accounts: {
      id: {
        disableAutoSelect() {
          harness.disableAutoSelectCount.current += 1;
        },
      },
    },
  };
  harness.setFetchImpl(async (input, init) => {
    assert.equal(input, "/api/auth/logout");
    assert.equal(init?.method, "POST");
    assert.equal(init?.credentials, "same-origin");
    throw new Error("logout network failure");
  });

  await harness.auth.signOut();

  assert.equal(harness.disableAutoSelectCount.current, 1);
  assert.equal(notifications, 2);
  assert.deepEqual(toPlain(harness.auth.getAuthState()), { user: null, loading: false, ready: true });
});
