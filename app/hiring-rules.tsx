import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, RotateCcw, ShieldAlert, UserCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { approvalOutcome, type ApprovalRules } from "@/lib/approval";
import { hasAvailability, type JourneyCandidate } from "@/lib/journey";
import { useJourney } from "./journey-state";

const MODES = [
  {
    auto: false,
    title: "Manual HR approval",
    icon: UserCheck,
    lead: "HR approves every interview invitation.",
    steps: ["Assessment", "Rules check", "HR approves", "Interview"],
    note: "Best while the benchmark is still being calibrated.",
  },
  {
    auto: true,
    title: "Automatic progression",
    icon: Zap,
    lead: "Clear passes are invited straight away.",
    steps: ["Assessment", "Rules check", "Interview"],
    note: "Exceptions and integrity flags still go to HR.",
  },
];

/** Progression rules with a live preview. Nothing changes until HR confirms. */
export function HiringRules({ candidates }: { candidates: JourneyCandidate[] }) {
  const [state, update] = useJourney(false, candidates);
  const saved = state.rules;
  const [draft, setDraft] = useState<ApprovalRules>(saved);
  const [confirm, setConfirm] = useState(false);
  const dirty = (Object.keys(saved) as (keyof ApprovalRules)[]).some((k) => saved[k] !== draft[k]);
  const invalid =
    draft.minimum >= draft.benchmark
      ? "Minimum section score must be lower than the pass benchmark."
      : null;

  // How the waiting candidates would be routed under the draft rules.
  const impact = useMemo(() => {
    const waiting = candidates.filter(
      (c) =>
        c.kind !== "employee" &&
        c.status === "Completed" &&
        !state.invites[c.id] &&
        !state.decisions[c.id] &&
        !state.reviews[c.id],
    );
    const route = (r: ApprovalRules) => waiting.filter((c) => approvalOutcome(c, r).route === "passed").length;
    return { waiting: waiting.length, before: route(saved), after: route(draft) };
  }, [candidates, state, saved, draft]);

  const set = (key: keyof ApprovalRules, value: number | boolean) =>
    setDraft({ ...draft, [key]: typeof value === "number" ? Math.max(0, Math.min(100, Math.round(value))) : value });

  function save() {
    try {
      update((s) => ({ ...s, rules: { ...draft } }));
      setConfirm(false);
      toast.success("Hiring rules updated");
    } catch (e: any) {
      toast.error(e.message);
    }
  }
  const changes = [
    saved.automatic !== draft.automatic &&
      `Progression: ${saved.automatic ? "Automatic" : "Manual HR approval"} → ${draft.automatic ? "Automatic" : "Manual HR approval"}`,
    saved.benchmark !== draft.benchmark && `Pass benchmark: ${saved.benchmark} → ${draft.benchmark}`,
    saved.minimum !== draft.minimum && `Minimum section score: ${saved.minimum} → ${draft.minimum}`,
    saved.spread !== draft.spread && `Maximum score gap: ${saved.spread} → ${draft.spread}`,
  ].filter(Boolean) as string[];
  const autoNow = draft.automatic && !saved.automatic && hasAvailability(state) ? impact.after : 0;

  return (
    <div className="hr-rules">
      <section className="settings-card">
        <div className="hr-rules-head">
          <h2>How candidates progress</h2>
          <span className={"stage " + (saved.automatic ? "stage-good" : "stage-info")}>
            Current: {saved.automatic ? "Automatic" : "Manual"}
          </span>
        </div>
        <div className="mode-grid" role="radiogroup" aria-label="Progression mode">
          {MODES.map((m) => {
            const on = draft.automatic === m.auto;
            return (
              <button
                key={m.title}
                role="radio"
                aria-checked={on}
                className={"mode-card" + (on ? " on" : "")}
                onClick={() => set("automatic", m.auto)}
              >
                <div className="mode-top">
                  <span className="mode-icon"><m.icon size={18} /></span>
                  <div>
                    <strong>{m.title}</strong>
                    <small>{m.lead}</small>
                  </div>
                  <span className="mode-radio" aria-hidden />
                </div>
                <div className={"flow" + (m.auto ? " auto" : "")} aria-hidden>
                  <div className="flow-track">
                    <i className="flow-dot" />
                  </div>
                  {m.steps.map((s) => (
                    <span key={s} className={"flow-step" + (s === "HR approves" ? " hr" : "")}>
                      {s}
                    </span>
                  ))}
                </div>
                {m.auto && (
                  <div className="flow-branch" aria-hidden>
                    <ShieldAlert size={13} /> Exceptions → HR review
                  </div>
                )}
                <small className="mode-note">{m.note}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="settings-card">
        <div className="hr-rules-head">
          <h2>Pass criteria</h2>
          <small className="muted">Weighted score by job level, out of 100</small>
        </div>
        <div className="scale" aria-hidden>
          <div className="scale-track">
            <span className="zone-low" style={{ width: draft.minimum + "%" }} />
            <span className="zone-pass" style={{ left: draft.benchmark + "%", width: 100 - draft.benchmark + "%" }} />
            <span className="mark min" style={{ left: draft.minimum + "%" }}><b>{draft.minimum}</b></span>
            <span className="mark bench" style={{ left: draft.benchmark + "%" }}><b>{draft.benchmark}</b></span>
          </div>
          <div className="scale-legend">
            <span><i className="low" /> Any section below {draft.minimum} → HR review</span>
            <span><i className="mid" /> Below {draft.benchmark} → HR review</span>
            <span><i className="pass" /> {draft.benchmark}+ with no exception → clear pass</span>
          </div>
        </div>
        <div className="criteria">
          <Criterion
            label="Pass benchmark"
            help="Minimum weighted score for a clear pass."
            value={draft.benchmark}
            onChange={(v) => set("benchmark", v)}
          />
          <Criterion
            label="Minimum section score"
            help="Any single capability below this goes to HR, even if the average passes."
            value={draft.minimum}
            onChange={(v) => set("minimum", v)}
          />
          <Criterion
            label="Maximum score gap"
            help="Highest minus lowest capability. A wider gap means an uneven profile and goes to HR."
            value={draft.spread}
            onChange={(v) => set("spread", v)}
          />
        </div>
        <p className="hr-rules-fixed">
          <ShieldAlert size={14} /> Always reviewed by HR: answers scored as a policy breach or fraud (integrity flags).
        </p>
      </section>

      <div className={"save-bar" + (dirty ? " show" : "")}>
        <span>
          {invalid ? (
            <b className="warn-text">{invalid}</b>
          ) : dirty ? (
            <>
              Unsaved changes
              {impact.waiting > 0 && (
                <> · clear passes among {impact.waiting} waiting: {impact.before} → <b>{impact.after}</b></>
              )}
            </>
          ) : (
            <>
              <CheckCircle2 size={14} /> All changes saved
            </>
          )}
        </span>
        <div>
          <Button variant="ghost" disabled={!dirty} onClick={() => setDraft(saved)}>
            <RotateCcw size={14} /> Discard
          </Button>
          <Button disabled={!dirty || !!invalid} onClick={() => setConfirm(true)}>
            Review and save
          </Button>
        </div>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm hiring rule changes</DialogTitle>
            <DialogDescription>
              These rules apply to every completed assessment from now on.
            </DialogDescription>
          </DialogHeader>
          <ul className="confirm-list">
            {changes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          {autoNow > 0 && (
            <div className="notice">
              <Zap size={16} />
              <span>
                {autoNow} candidate{autoNow > 1 ? "s" : ""} waiting for review will be invited to book an interview immediately.
              </span>
            </div>
          )}
          <div className="confirm-actions">
            <Button variant="outline" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button onClick={save}>Confirm and save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Criterion({ label, help, value, onChange }: { label: string; help: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="criterion">
      <div className="criterion-top">
        <label>{label}</label>
        <input
          type="number"
          min={0}
          max={100}
          value={value}
          aria-label={label}
          onChange={(e) => e.target.value !== "" && onChange(Number(e.target.value))}
        />
      </div>
      <input type="range" min={0} max={100} value={value} aria-label={label + " slider"} onChange={(e) => onChange(Number(e.target.value))} />
      <small>{help}</small>
    </div>
  );
}
