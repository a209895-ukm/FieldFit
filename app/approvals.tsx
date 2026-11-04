import { useState, useEffect, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Mail,
  CalendarDays,
  CheckCircle2,
  ShieldCheck,
  Clock3,
  Search,
  Zap,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CAPS } from "@/lib/assessment";
import { approvalOutcome } from "@/lib/approval";
import {
  HR_STEPS,
  approveCandidates,
  hasAvailability,
  type JourneyCandidate,
  type JourneyState,
} from "@/lib/journey";
import { pageUrl } from "@/lib/navigation";
import { useJourney } from "./journey-state";
import { JourneySteps } from "./journey-steps";
import { CandidateOutcome } from "./candidate-journey";
import { toast } from "sonner";
import { advanceGuide, useGuide } from "./demo-guide-state";
export { CandidateNextStep } from "./candidate-journey";
const STAGE_COPY = [
  ["Set the rules", "Define a clear standard before you invite candidates."],
  [
    "Invite candidates",
    "Every candidate starts with a personal assessment invitation.",
  ],
  [
    "Review results",
    "Move clear passes forward. Give exceptions an individual review.",
  ],
  [
    "Schedule interview",
    "Candidates choose their time. Keep every interview in view.",
  ],
  [
    "Interview & decide",
    "Bring the evidence into the conversation, then record your decision.",
  ],
];
export function Approvals({
  candidates,
  sample,
  onProfile,
  onInvite,
  sourceControl,
}: {
  candidates: JourneyCandidate[];
  sample: boolean;
  onProfile: (id: string) => void;
  onInvite: () => void;
  sourceControl?: ReactNode;
}) {
  const guide = useGuide();
  const [state, update] = useJourney(sample, candidates);
  const [stage, setStage] = useState(0),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [slot, setSlot] = useState("");
  const [action, setAction] = useState<
      "invite" | "hold" | "decline" | "decision" | null
    >(null),
    [reason, setReason] = useState(""),
    [final, setFinal] = useState<"Hire" | "Hold" | "Reject">("Hire");
  const [preview, setPreview] = useState<JourneyCandidate | null>(null),
    [calendar, setCalendar] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stage]);
  useEffect(() => {
    if (guide?.step === "rules") setStage(0);
    if (guide && ["invite", "form", "open"].includes(guide.step)) setStage(1);
  }, [guide]);
  const mutate = (edit: (s: JourneyState) => JourneyState) => {
    try {
      update(edit);
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    }
  };
  const patch = (value: Partial<JourneyState>) =>
    mutate((s) => ({ ...s, ...value }));
  const people = candidates.filter((c) => c.kind !== "employee");
  const completed = people.filter((c) => c.status === "Completed");
  const pending = completed.filter(
    (c) =>
      !state.invites[c.id] &&
      !state.decisions[c.id] &&
      approvalOutcome(c, state.rules).route !== "closed",
  );
  const passed = pending.filter(
    (c) =>
      approvalOutcome(c, state.rules).route === "passed" &&
      !state.reviews[c.id],
  );
  const exceptions = pending.filter(
    (c) =>
      approvalOutcome(c, state.rules).route === "review" &&
      !state.reviews[c.id],
  );
  const held = pending.filter((c) => !!state.reviews[c.id]);
  const invited = people.filter((c) => state.invites[c.id]);
  const booked = invited.filter((c) => state.invites[c.id].booked);
  const visible = (
    filter === "passed"
      ? passed
      : filter === "review"
        ? exceptions
        : filter === "held"
          ? held
          : pending
  ).filter((c) =>
    (c.name + " " + c.email).toLowerCase().includes(search.toLowerCase()),
  );
  const targets = people.filter((c) => selected.includes(c.id));
  const needsReason =
    action !== "invite" ||
    targets.some(
      (c) =>
        approvalOutcome(c, state.rules).route === "review" ||
        state.reviews[c.id],
    );
  const ready = hasAvailability(state);
  function openAction(kind: typeof action, ids: string[]) {
    setSelected(ids);
    setReason("");
    setAction(kind);
  }
  function applyAction() {
    if (!targets.length) return;
    const ok = mutate((s) => {
      if (action === "invite") return approveCandidates(s, targets, reason);
      if (reason.trim().length < 10)
        throw Error("Please record a reason of at least 10 characters.");
      if (action === "decision") {
        const c = targets[0];
        if (!s.invites[c.id]?.attendedAt)
          throw Error(
            "Mark the interview complete before recording a decision.",
          );
        return {
          ...s,
          decisions: {
            ...s.decisions,
            [c.id]: {
              decision: final,
              reason: reason.trim(),
              at: new Date().toISOString(),
            },
          },
        };
      }
      if (action === "hold" || action === "decline") {
        const reviews = { ...s.reviews };
        for (const c of targets) {
          if (s.invites[c.id] || s.decisions[c.id])
            throw Error(
              "This candidate has already progressed. Refresh the results before reviewing again.",
            );
          reviews[c.id] = {
            action,
            reason: reason.trim(),
            at: new Date().toISOString(),
          };
        }
        return { ...s, reviews };
      }
      return s;
    });
    if (ok) {
      setAction(null);
      setSelected([]);
      toast.success(
        action === "invite"
          ? "Interview invitation ready in the candidate journey."
          : "HR update saved to the demo.",
      );
    }
  }
  function demoSlots() {
    const slots = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + 1 + Math.floor(i / 2));
      d.setHours(i % 2 ? 14 : 10, 0, 0, 0);
      return d.toISOString();
    });
    if (patch({ slots, host: state.host || "hr@example.test" }))
      advanceGuide("availability");
    toast.success("Six demo interview slots added.");
  }
  const stageDone = [
    ...(ready ? [0] : []),
    ...(people.length ? [1] : []),
    ...(invited.length || held.length ? [2] : []),
    ...(booked.length ? [3] : []),
    ...(Object.keys(state.decisions).length ? [4] : []),
  ];
  const bottom = (
    <div className="journey-stage-footer">
      <Button
        variant="outline"
        disabled={stage === 0}
        onClick={() => setStage(stage - 1)}
      >
        <ArrowLeft size={16} /> Previous step
      </Button>
      <span>Step {stage + 1} of 5</span>
      <Button disabled={stage === 4} onClick={() => setStage(stage + 1)}>
        Next: {HR_STEPS[stage + 1]}
        <ArrowRight size={16} />
      </Button>
    </div>
  );
  return (
    <div className="hr-journey">
      <div className="journey-toolbar">
        <span className="journey-tag">
          <ShieldCheck size={14} />{" "}
          {sample ? "Sample walkthrough" : "My candidates"}
        </span>
        {sourceControl}
      </div>
      <JourneySteps
        steps={HR_STEPS}
        active={stage}
        onStep={(i) => {
          setStage(i);
          setSelected([]);
        }}
        complete={stageDone}
      />
      <div className="journey-stage-heading">
        <div>
          <span className="eyebrow">
            HR JOURNEY · STEP {String(stage + 1).padStart(2, "0")}
          </span>
          <h2>{STAGE_COPY[stage][0]}</h2>
          <p>{STAGE_COPY[stage][1]}</p>
        </div>
        <span className="journey-tag">
          {state.rules.automatic ? "Automatic progression" : "HR approval"}
        </span>
      </div>
      {stage === 0 && (
        <>
          <div className="journey-two-columns">
            <section className="journey-panel">
              <h3>
                <Zap size={20} /> Progression rules
              </h3>
              <div className="journey-mode-cards">
                {[false, true].map((auto) => (
                  <button
                    key={String(auto)}
                    data-guide={auto ? "automatic" : undefined}
                    aria-pressed={state.rules.automatic === auto}
                    className={state.rules.automatic === auto ? "selected" : ""}
                    onClick={() => {
                      if (
                        patch({ rules: { ...state.rules, automatic: auto } }) &&
                        auto
                      )
                        advanceGuide("automatic");
                    }}
                  >
                    <strong>
                      {auto ? "Automatic progression" : "Manual HR approval"}
                    </strong>
                    <span>
                      {auto
                        ? "Invite clear passes immediately."
                        : "Select one candidate or select all."}
                    </span>
                  </button>
                ))}
              </div>
              <div className="journey-form-grid" data-guide="rules">
                {(
                  [
                    ["benchmark", "Pass benchmark"],
                    ["minimum", "Minimum section"],
                    ["spread", "Maximum score gap"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      aria-label={label}
                      type="number"
                      min="0"
                      max="100"
                      value={state.rules[key]}
                      onChange={(e) => {
                        if (e.target.value !== "")
                          patch({
                            rules: {
                              ...state.rules,
                              [key]: Math.max(
                                0,
                                Math.min(100, Number(e.target.value)),
                              ),
                            },
                          });
                      }}
                    />
                  </label>
                ))}
              </div>
              <div className="journey-info">
                <ShieldCheck size={20} />
                <span>
                  Exceptions take priority. A low section score or a large score
                  gap always goes to HR, even when the average passes.
                </span>
              </div>
              <p className="journey-muted">
                Average uses the six capability scores. Customer communication
                is reviewed separately.
              </p>
            </section>
            <section className="journey-panel">
              <h3>
                <CalendarDays size={20} /> Interview availability
              </h3>
              <div className="journey-calendar-options">
                <Button variant="outline" onClick={() => setCalendar(true)}>
                  {state.calendarPreview
                    ? "Calendar preview active"
                    : "Preview Google Calendar"}
                </Button>
                <span>or add times manually below</span>
              </div>
              <div className="journey-form-grid two">
                <label>
                  HR email
                  <input
                    type="email"
                    placeholder="hr@company.com"
                    value={state.host}
                    onChange={(e) => patch({ host: e.target.value })}
                  />
                </label>
                <label>
                  Duration
                  <select
                    value={state.duration}
                    onChange={(e) =>
                      patch({ duration: Number(e.target.value) })
                    }
                  >
                    {[30, 45, 60].map((n) => (
                      <option key={n} value={n}>
                        {n} minutes
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="journey-label">
                Location or meeting link
                <input
                  value={state.location}
                  onChange={(e) => patch({ location: e.target.value })}
                />
              </label>
              <form
                className="journey-slot-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const value = String(
                    new FormData(e.currentTarget).get("slot"),
                  );
                  if (
                    !Number.isFinite(Date.parse(value)) ||
                    Date.parse(value) <= Date.now()
                  ) {
                    toast.error("Choose a future interview time.");
                    return;
                  }
                  const iso = new Date(value).toISOString();
                  patch({ slots: [...new Set([...state.slots, iso])].sort() });
                  setSlot("");
                }}
              >
                <label>
                  New slot · {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  <input
                    type="datetime-local"
                    name="slot"
                    aria-label="New interview slot"
                    required
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                  />
                </label>
                <Button type="submit" variant="outline">
                  Add slot
                </Button>
              </form>
              <div className="journey-slots">
                {state.slots.map((s) => (
                  <span
                    key={s}
                    className={Date.parse(s) <= Date.now() ? "expired" : ""}
                  >
                    {new Date(s).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    <button
                      aria-label={"Remove " + s}
                      onClick={() =>
                        patch({ slots: state.slots.filter((t) => t !== s) })
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <Button
                className="journey-text-button"
                variant="ghost"
                data-guide="availability"
                onClick={demoSlots}
              >
                Use demo availability
              </Button>
            </section>
          </div>
          <div className={ready ? "journey-ready" : "journey-info"}>
            {ready ? <CheckCircle2 size={20} /> : <Clock3 size={20} />}
            <span>
              {ready
                ? "Your setup is ready. Continue to Invite candidates."
                : "Add an HR email and at least one future slot to activate interview invitations."}
            </span>
          </div>
        </>
      )}
      {stage === 1 && (
        <section className="journey-panel">
          <div className="journey-section-heading">
            <div>
              <h3>A personal invitation starts the journey.</h3>
              <p>
                Create a candidate invitation, then open it to see their
                experience.
              </p>
            </div>
            <Button data-guide="invite" onClick={onInvite}>
              <Mail size={17} /> Invite candidate
            </Button>
          </div>
          {!people.length ? (
            <div className="journey-empty">
              <Mail />
              <h3>Your first candidate starts here.</h3>
              <p>
                Use fictional details for the walkthrough. You can open the
                candidate journey in another tab.
              </p>
              <Button onClick={onInvite}>
                Create first invitation
                <ArrowRight size={16} />
              </Button>
            </div>
          ) : (
            <div className="journey-people">
              {people.map((c) => (
                <div className="journey-person-row" key={c.id}>
                  <span className="journey-avatar">
                    {c.name
                      .split(" ")
                      .map((v) => v[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div>
                    <strong>{c.name}</strong>
                    <small>{c.email}</small>
                  </div>
                  <span className="journey-tag">{c.status}</span>
                  {c.accessToken ? (
                    <Button asChild variant="outline">
                      <a
                        href={pageUrl("/assess/" + c.accessToken)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open candidate journey
                        <ArrowRight size={15} />
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => onProfile(c.id)}>
                      View sample profile
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      {stage === 2 && (
        <>
          <div className="journey-metrics">
            {[
              ["Completed assessments", completed.length],
              ["Passed", passed.length],
              ["Needs HR review", exceptions.length],
              ["Invited to interview", invited.length],
            ].map(([label, n]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{n}</strong>
              </div>
            ))}
          </div>
          <section className="journey-panel">
            <div className="journey-filter-tabs">
              {[
                ["all", "All pending", pending.length],
                ["passed", "Passed", passed.length],
                ["review", "Exceptions", exceptions.length],
                ["held", "HR updates", held.length],
              ].map(([id, label, count]) => (
                <button
                  key={id}
                  aria-pressed={filter === id}
                  className={filter === id ? "selected" : ""}
                  onClick={() => {
                    setFilter(String(id));
                    setSelected([]);
                  }}
                >
                  {label}
                  <span>{count}</span>
                </button>
              ))}
            </div>
            <div className="journey-table-actions">
              <label className="journey-search">
                <Search size={17} />
                <input
                  aria-label="Search results"
                  placeholder="Search candidates…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <Button
                disabled={!visible.length}
                variant="outline"
                onClick={() =>
                  setSelected(
                    visible.every((c) => selected.includes(c.id))
                      ? []
                      : visible.map((c) => c.id),
                  )
                }
              >
                {visible.length > 0 &&
                visible.every((c) => selected.includes(c.id))
                  ? "Clear selection"
                  : "Select all"}
              </Button>
              <Button
                disabled={!selected.length}
                onClick={() => openAction("invite", selected)}
              >
                Invite selected ({selected.length})
              </Button>
            </div>
            {!visible.length ? (
              <div className="journey-empty">
                <CheckCircle2 />
                <h3>
                  {!completed.length
                    ? "Waiting for completed assessments."
                    : "You’re up to date."}
                </h3>
                <p>
                  {invited.length
                    ? "Your interview invitations are in Schedule interview."
                    : "Completed profiles will appear here for review."}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setStage(invited.length ? 3 : 1)}
                >
                  {invited.length ? "View invitations" : "View candidates"}
                </Button>
              </div>
            ) : (
              visible.map((c) => {
                const o = approvalOutcome(c, state.rules),
                  review = state.reviews[c.id];
                return (
                  <div className="journey-result-row" key={c.id}>
                    <div className="journey-result-top">
                      <input
                        type="checkbox"
                        aria-label={"Select " + c.name}
                        checked={selected.includes(c.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, c.id]
                              : selected.filter((id) => id !== c.id),
                          )
                        }
                      />
                      <button
                        className="journey-name"
                        onClick={() => onProfile(c.id)}
                      >
                        {c.name}
                        <small>{c.email}</small>
                      </button>
                      <strong>
                        {Math.round(o.average)}
                        <small>/100</small>
                      </strong>
                      <span
                        className={
                          "journey-tag " +
                          (o.route === "review" ? "warning" : "")
                        }
                      >
                        {review
                          ? review.action === "hold"
                            ? "On hold"
                            : "Not progressing"
                          : o.route === "review"
                            ? "HR review"
                            : "Passed"}
                      </span>
                      {c.journeyPreview && (
                        <span className="journey-tag">Walkthrough</span>
                      )}
                    </div>
                    <p>{review ? review.reason : o.reason}</p>
                    <div className="journey-score-grid">
                      {c.scores.map((score, i) => (
                        <div key={i}>
                          <span>{CAPS[i]}</span>
                          <strong>{score}</strong>
                          <div>
                            <i
                              style={{
                                width: score + "%",
                                background:
                                  score < state.rules.minimum
                                    ? "#F78F3D"
                                    : "#324B71",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="journey-row-actions">
                      <Button variant="ghost" onClick={() => onProfile(c.id)}>
                        View full evidence
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => openAction("hold", [c.id])}
                      >
                        Hold
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => openAction("decline", [c.id])}
                      >
                        Decline progression
                      </Button>
                      <Button onClick={() => openAction("invite", [c.id])}>
                        {o.route === "review" || review
                          ? "Review & approve"
                          : "Invite to interview"}
                        <ArrowRight size={15} />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </>
      )}
      {stage === 3 && (
        <>
          <div className="journey-metrics">
            {[
              ["Invitations", invited.length],
              ["Awaiting booking", invited.length - booked.length],
              ["Booked", booked.length],
              [
                "Attendance confirmed",
                booked.filter((c) => state.invites[c.id].confirmedAt).length,
              ],
            ].map(([label, n]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{n}</strong>
              </div>
            ))}
          </div>
          <div className="journey-interview-grid">
            {invited.map((c) => {
              const i = state.invites[c.id];
              return (
                <section className="journey-panel" key={c.id}>
                  <div className="journey-section-heading">
                    <h3>{c.name}</h3>
                    <span className="journey-tag">
                      {i.booked
                        ? i.confirmedAt
                          ? "Confirmed"
                          : "Booked"
                        : "Awaiting booking"}
                    </span>
                  </div>
                  <p>
                    {i.source} invitation · {i.duration} minutes
                  </p>
                  {i.booked ? (
                    <div className="journey-ticket">
                      <CalendarDays />
                      <div>
                        <strong>
                          {new Date(i.booked).toLocaleDateString([], {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </strong>
                        <span>
                          {new Date(i.booked).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {i.location}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="journey-info">
                      <Clock3 />
                      <span>
                        {i.availabilityRequested
                          ? "Candidate requested more interview times."
                          : `${i.slots.filter((s) => Date.parse(s) > Date.now()).length} future slots offered. The candidate chooses their preferred time.`}
                      </span>
                    </div>
                  )}
                  <div className="journey-actions">
                    <Button variant="outline" onClick={() => setPreview(c)}>
                      Open candidate view
                    </Button>
                    {!i.booked && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (!ready) {
                            setStage(0);
                            toast.error("Add future slots first.");
                            return;
                          }
                          mutate((s) => ({
                            ...s,
                            invites: {
                              ...s.invites,
                              [c.id]: {
                                ...s.invites[c.id],
                                slots: s.slots.filter(
                                  (v) => Date.parse(v) > Date.now(),
                                ),
                                availabilityRequested: undefined,
                              },
                            },
                          }));
                          toast.success(
                            "Available slots updated for the candidate.",
                          );
                        }}
                      >
                        Refresh offered slots
                      </Button>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
          {!invited.length && (
            <div className="journey-empty journey-panel">
              <CalendarDays />
              <h3>No interview invitations yet.</h3>
              <p>Approve a candidate in Review results to start scheduling.</p>
              <Button onClick={() => setStage(2)}>
                Review results
                <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}
      {stage === 4 && (
        <>
          <div className="journey-info">
            <ShieldCheck />
            <span>
              Use the capability profile and communication evidence to guide the
              conversation. The final decision belongs to HR.
            </span>
          </div>
          <div className="journey-interview-grid">
            {booked.map((c) => {
              const i = state.invites[c.id],
                d = state.decisions[c.id];
              return (
                <section className="journey-panel" key={c.id}>
                  <div className="journey-section-heading">
                    <h3>{c.name}</h3>
                    <span className="journey-tag">
                      {d
                        ? d.decision
                        : i.attendedAt
                          ? "Interview complete"
                          : "Upcoming interview"}
                    </span>
                  </div>
                  <p>
                    {new Date(i.booked!).toLocaleString()} · {i.duration}{" "}
                    minutes
                  </p>
                  <div className="journey-interview-prompts">
                    <strong>Explore in the conversation</strong>
                    <ul>
                      <li>A customer challenge and how they responded.</li>
                      <li>
                        Their strongest capability and a development area.
                      </li>
                      <li>A practical example of taking ownership.</li>
                    </ul>
                  </div>
                  {d && (
                    <div className="journey-info">
                      <CheckCircle2 />
                      <span>
                        <strong>{d.decision} · Recorded decision</strong>
                        <br />
                        {d.reason}
                      </span>
                    </div>
                  )}
                  <div className="journey-actions">
                    <Button variant="outline" onClick={() => onProfile(c.id)}>
                      View evidence
                    </Button>
                    {!i.attendedAt ? (
                      <Button
                        onClick={() => {
                          mutate((s) => ({
                            ...s,
                            invites: {
                              ...s.invites,
                              [c.id]: {
                                ...s.invites[c.id],
                                attendedAt: new Date().toISOString(),
                              },
                            },
                          }));
                          toast.success(
                            "Interview marked complete in the demo.",
                          );
                        }}
                      >
                        Mark interview complete
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setFinal(d?.decision ?? "Hire");
                          openAction("decision", [c.id]);
                        }}
                      >
                        {d ? "Update decision" : "Record HR decision"}
                      </Button>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
          {!booked.length && (
            <div className="journey-empty journey-panel">
              <Users />
              <h3>Your interviews will appear here.</h3>
              <p>First, have a candidate choose an interview time.</p>
              <Button onClick={() => setStage(3)}>
                Go to scheduling
                <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}
      {bottom}
      {action && (
        <Dialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setAction(null);
          }}
        >
          <DialogContent className="journey-dialog">
            <DialogHeader>
              <DialogTitle>
                {action === "invite"
                  ? "Approve & invite to interview"
                  : action === "hold"
                    ? "Hold for further review"
                    : action === "decline"
                      ? "Decline interview progression"
                      : "Record the interview decision"}
              </DialogTitle>
              <DialogDescription>
                {targets.map((c) => c.name).join(", ")} · This update appears in
                the candidate’s demo journey.
              </DialogDescription>
            </DialogHeader>
            {action === "decision" && (
              <label className="journey-label">
                HR decision
                <select
                  value={final}
                  onChange={(e) => setFinal(e.target.value as typeof final)}
                >
                  <option>Hire</option>
                  <option>Hold</option>
                  <option>Reject</option>
                </select>
              </label>
            )}
            {action === "invite" && (
              <div className="journey-info">
                <CalendarDays />
                <span>
                  {state.slots.filter((s) => Date.parse(s) > Date.now()).length}{" "}
                  future slots · {state.duration} minutes
                  <br />
                  {ready
                    ? "Candidate chooses their preferred time."
                    : "Complete interview availability in Set the rules first."}
                </span>
              </div>
            )}
            <label className="journey-label">
              {needsReason
                ? "Reason for this decision"
                : "Review notes (optional)"}
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Record the evidence and the next step."
              />
            </label>
            <div className="journey-actions">
              <Button variant="outline" onClick={() => setAction(null)}>
                Cancel
              </Button>
              <Button
                disabled={
                  (needsReason && reason.trim().length < 10) ||
                  (action === "invite" && !ready)
                }
                onClick={applyAction}
              >
                {action === "invite" ? "Confirm invitation" : "Save HR update"}
              </Button>
            </div>
            <p className="journey-muted">Demo only · no email is sent.</p>
          </DialogContent>
        </Dialog>
      )}
      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="journey-candidate-dialog">
          <DialogHeader>
            <DialogTitle>Candidate journey preview</DialogTitle>
            <DialogDescription>
              Try the candidate’s next step. Your actions are saved to this
              demo.
            </DialogDescription>
          </DialogHeader>
          {preview && <CandidateOutcome candidate={preview} sample={sample} />}
        </DialogContent>
      </Dialog>
      <Dialog open={calendar} onOpenChange={setCalendar}>
        <DialogContent className="journey-dialog">
          <DialogHeader>
            <DialogTitle>Google Calendar · frontend preview</DialogTitle>
            <DialogDescription>
              Explore how connected availability will look. No Google account is
              connected.
            </DialogDescription>
          </DialogHeader>
          <div className="journey-info">
            <CalendarDays />
            <span>
              HR’s availability supplies interview slots. Candidates choose a
              time that works for them.
            </span>
          </div>
          <p>
            Use sample availability to demonstrate the booking journey, or enter
            interview times manually.
          </p>
          <Button
            onClick={() => {
              demoSlots();
              patch({ calendarPreview: true });
              setCalendar(false);
            }}
          >
            Preview with sample availability
            <ArrowRight size={16} />
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
