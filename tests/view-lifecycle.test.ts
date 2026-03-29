export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";

test("managedTimeout tracks pending timers and cleanup cancels them", () => {
  const { browserWindow } = createHarness();
  const lifecycle = browserWindow.ROUGE_VIEW_LIFECYCLE;

  assert.equal(lifecycle.pendingCount(), 0);

  let called = false;
  lifecycle.managedTimeout(() => { called = true; }, 100_000);
  assert.equal(lifecycle.pendingCount(), 1);

  lifecycle.managedTimeout(() => {}, 100_000);
  assert.equal(lifecycle.pendingCount(), 2);

  lifecycle.cleanup();
  assert.equal(lifecycle.pendingCount(), 0);
  assert.equal(called, false);
});

test("managedRAF falls back to managedTimeout in non-browser environment", () => {
  const { browserWindow } = createHarness();
  const lifecycle = browserWindow.ROUGE_VIEW_LIFECYCLE;

  lifecycle.cleanup();
  assert.equal(lifecycle.pendingCount(), 0);

  let rafCalled = false;
  lifecycle.managedRAF(() => { rafCalled = true; });
  // In Node, requestAnimationFrame is not available, so it should fall back to managedTimeout
  assert.ok(lifecycle.pendingCount() >= 1);

  lifecycle.cleanup();
  assert.equal(lifecycle.pendingCount(), 0);
  assert.equal(rafCalled, false);
});

test("registerCleanup tracks disposable work and cleanup runs it once", () => {
  const { browserWindow } = createHarness();
  const lifecycle = browserWindow.ROUGE_VIEW_LIFECYCLE;

  lifecycle.cleanup();
  let cleaned = 0;
  lifecycle.registerCleanup(() => { cleaned += 1; });
  assert.equal(lifecycle.pendingCount(), 1);

  lifecycle.cleanup();
  assert.equal(cleaned, 1);
  assert.equal(lifecycle.pendingCount(), 0);

  lifecycle.cleanup();
  assert.equal(cleaned, 1);
});

test("registerCleanup can unregister a pending disposable before cleanup", () => {
  const { browserWindow } = createHarness();
  const lifecycle = browserWindow.ROUGE_VIEW_LIFECYCLE;

  lifecycle.cleanup();
  let cleaned = 0;
  const unregister = lifecycle.registerCleanup(() => { cleaned += 1; });
  assert.equal(lifecycle.pendingCount(), 1);

  unregister();
  assert.equal(lifecycle.pendingCount(), 0);

  lifecycle.cleanup();
  assert.equal(cleaned, 0);
});

test("cleanup is idempotent when called with no pending timers", () => {
  const { browserWindow } = createHarness();
  const lifecycle = browserWindow.ROUGE_VIEW_LIFECYCLE;

  lifecycle.cleanup();
  lifecycle.cleanup();
  assert.equal(lifecycle.pendingCount(), 0);
});

test("managedTimeout callback fires and removes itself from pending count", (_, done) => {
  const { browserWindow } = createHarness();
  const lifecycle = browserWindow.ROUGE_VIEW_LIFECYCLE;

  lifecycle.cleanup();
  lifecycle.managedTimeout(() => {
    assert.equal(lifecycle.pendingCount(), 0);
    done();
  }, 5);
  assert.equal(lifecycle.pendingCount(), 1);
});
