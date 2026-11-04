import { useEffect, useState } from "react";
import {
  emptyJourney,
  normalizeJourney,
  syncAutomatic,
  type JourneyState,
  type JourneyCandidate,
} from "@/lib/journey";
import { STATIC_DEMO } from "@/lib/navigation";
export const journeyKey = (sample = false) =>
  "fieldfit-approvals-v1-" + (sample ? "sample" : "live");
export const JOURNEY_EVENT = "fieldfit-journey-change";
export function readJourney(sample = false): JourneyState {
  try {
    const raw = localStorage.getItem(journeyKey(sample));
    return raw ? normalizeJourney(JSON.parse(raw)) : emptyJourney();
  } catch {
    return emptyJourney();
  }
}
export function updateJourney(
  sample: boolean,
  edit: (s: JourneyState) => JourneyState,
) {
  const current = readJourney(sample);
  const next = edit(current);
  if (next !== current) {
    localStorage.setItem(journeyKey(sample), JSON.stringify(next));
    window.dispatchEvent(new Event(JOURNEY_EVENT));
  }
  return next;
}
export function useJourney(sample = false, candidates?: JourneyCandidate[]) {
  const [state, setState] = useState(() => readJourney(sample));
  useEffect(() => {
    const refresh = () => setState(readJourney(sample));
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(JOURNEY_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(JOURNEY_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [sample]);
  useEffect(() => {
    if (candidates) updateJourney(sample, (s) => syncAutomatic(s, candidates));
  }, [sample, candidates, state.rules, state.host, state.slots, state.reviews]);
  return [
    state,
    (edit: (s: JourneyState) => JourneyState) => updateJourney(sample, edit),
  ] as const;
}
export function readDemoCandidates(): JourneyCandidate[] {
  if (!STATIC_DEMO) return [];
  try {
    return (
      JSON.parse(localStorage.getItem("fieldfit-pages-demo-v1") ?? "{}")
        .candidates ?? []
    );
  } catch {
    return [];
  }
}
export function useDemoCandidates() {
  const [candidates, setCandidates] = useState(readDemoCandidates);
  useEffect(() => {
    const refresh = () => setCandidates(readDemoCandidates());
    window.addEventListener("storage", refresh);
    window.addEventListener(JOURNEY_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(JOURNEY_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return candidates;
}
export function previewResult(
  token: string,
  scenario: "pass" | "exception" | "below",
) {
  if (!STATIC_DEMO)
    throw Error("Walkthrough results are available in the browser demo.");
  const data = JSON.parse(
    localStorage.getItem("fieldfit-pages-demo-v1") ?? "{}",
  );
  const c = data.candidates?.find(
    (c: JourneyCandidate) => c.accessToken === token,
  );
  if (!c || c.status !== "In progress")
    throw Error("Start the assessment before previewing a result.");
  c.status = "Completed";
  c.submitted = new Date().toISOString();
  c.scores =
    scenario === "pass"
      ? [88, 85, 90, 80, 85, 92]
      : scenario === "exception"
        ? [98, 94, 92, 95, 25, 96]
        : [45, 50, 55, 50, 45, 50];
  c.journeyPreview = scenario;
  c.revision += 1;
  localStorage.setItem("fieldfit-pages-demo-v1", JSON.stringify(data));
  window.dispatchEvent(new Event(JOURNEY_EVENT));
}
