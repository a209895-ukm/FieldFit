import { useSyncExternalStore } from "react";

export const GUIDE_EVENT = "fieldfit-demo-guide";
const KEY = "fieldfit-demo-guide-v1";
export const GUIDE_STEPS = [
  "rules",
  "availability",
  "automatic",
  "invite",
  "form",
  "open",
  "accept",
  "prepare",
  "question",
  "result",
  "progression",
  "slots",
  "attendance",
  "calendar",
  "done",
] as const;
export type GuideStep = (typeof GUIDE_STEPS)[number];
type GuideState = { step: GuideStep; path?: string };
let cached: GuideState | null = null;
try {
  const saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
  if (saved && GUIDE_STEPS.includes(saved.step)) cached = saved;
} catch {
  /* A guide can still run when browser storage is unavailable. */
}
export function readGuide() {
  return cached;
}
function save(state: GuideState | null) {
  cached = state;
  try {
    if (state) sessionStorage.setItem(KEY, JSON.stringify(state));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* Keep the in-memory tour usable. */
  }
  window.dispatchEvent(new Event(GUIDE_EVENT));
}
export function startGuide() {
  save({ step: "rules" });
}
export function endGuide() {
  save(null);
}
export function advanceGuide(expected: GuideStep, path?: string) {
  if (cached?.step !== expected) return;
  const next = GUIDE_STEPS[GUIDE_STEPS.indexOf(expected) + 1];
  if (next) save({ ...cached, step: next, ...(path ? { path } : {}) });
}
function subscribe(callback: () => void) {
  window.addEventListener(GUIDE_EVENT, callback);
  return () => window.removeEventListener(GUIDE_EVENT, callback);
}
export function useGuide() {
  return useSyncExternalStore(subscribe, readGuide, () => null);
}
