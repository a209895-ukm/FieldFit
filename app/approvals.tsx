import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ArrowRight,
  Zap,
  ShieldCheck,
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
import {
  APPROVAL_DEFAULTS,
  approvalOutcome,
  googleCalendarUrl,
  type ApprovalRules,
  type ApprovalCandidate,
  type InterviewInvite,
} from "@/lib/approval";
import { toast } from "sonner";

type State = {
  rules: ApprovalRules;
  invites: Record<string, InterviewInvite>;
  host: string;
  location: string;
  duration: number;
  slots: string[];
};
const blank: State = {
  rules: APPROVAL_DEFAULTS,
  invites: {},
  host: "",
  location: "Google Meet · link to be added by HR",
  duration: 30,
  slots: [],
};
export function Approvals({
  candidates,
  sample,
  onProfile,
}: {
  candidates: ApprovalCandidate[];
  sample: boolean;
  onProfile: (id: string) => void;
}) {
  const key = "fieldfit-approvals-v1-" + (sample ? "sample" : "live");
  const [state, setState] = useState<State>(blank);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [tab, setTab] = useState("passed");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [send, setSend] = useState(false);
  const [reason, setReason] = useState("");
  const [slot, setSlot] = useState("");
  const [chosen, setChosen] = useState("");
  useEffect(() => {
    setReady(false);
    try {
      const saved = localStorage.getItem(key);
      setState(saved ? JSON.parse(saved) : structuredClone(blank));
    } catch {
      setState(structuredClone(blank));
    }
    setSelected([]);
    setReady(true);
  }, [key]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== key || !event.newValue) return;
      try {
        setState(JSON.parse(event.newValue));
      } catch {
        toast.error("Could not refresh interview bookings. Reload this page.");
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      toast.error("Browser storage is unavailable. Changes cannot be saved.");
    }
  }, [state, key, ready]);
  const eligible = candidates.filter(
    (c) => c.kind !== "employee" && c.status === "Completed",
  );
  const outcome = (c: ApprovalCandidate) => approvalOutcome(c, state.rules);
  const validSetup =
    /^\S+@\S+\.\S+$/.test(state.host) &&
    state.slots.some((s) => Date.parse(s) > Date.now());
  const makeInvite = (
    c: ApprovalCandidate,
    source: "Automatic" | "HR",
  ): InterviewInvite => ({
    candidateId: c.id,
    slots: state.slots.filter((s) => Date.parse(s) > Date.now()),
    duration: state.duration,
    host: state.host,
    location: state.location,
    source,
    created: new Date().toISOString(),
  });
  // This browser demo processes eligible profiles whenever results or routing settings change.
  useEffect(() => {
    if (!ready || !state.rules.automatic || !validSetup) return;
    const next = { ...state.invites };
    let changed = false;
    for (const c of eligible)
      if (outcome(c).route === "passed" && !next[c.id]) {
        next[c.id] = makeInvite(c, "Automatic");
        changed = true;
      }
    if (changed) setState((s) => ({ ...s, invites: next }));
  }, [
    ready,
    state.rules,
    state.slots,
    state.host,
    state.duration,
    state.location,
    candidates,
  ]);
  const counts = {
    passed: eligible.filter(
      (c) => outcome(c).route === "passed" && !state.invites[c.id],
    ).length,
    review: eligible.filter(
      (c) => outcome(c).route === "review" && !state.invites[c.id],
    ).length,
    invited: eligible.filter((c) => state.invites[c.id]).length,
  };
  const visible = eligible.filter(
    (c) =>
      (c.name + c.email).toLowerCase().includes(search.toLowerCase()) &&
      (tab === "invited"
        ? !!state.invites[c.id]
        : !state.invites[c.id] && outcome(c).route === tab),
  );
  const previewCandidate = candidates.find((c) => c.id === preview);
  const previewInvite = preview ? state.invites[preview] : undefined;
  const update = (patch: Partial<State>) =>
    setState((s) => ({ ...s, ...patch }));
  const updateRules = (patch: Partial<ApprovalRules>) =>
    update({ rules: { ...state.rules, ...patch } });
  const selectedCandidates = eligible.filter(
    (c) => selected.includes(c.id) && !state.invites[c.id],
  );
  const needsReason = selectedCandidates.some(
    (c) => outcome(c).route === "review",
  );
  function prepare() {
    if (!validSetup) {
      toast.error(
        "Add an HR email and at least one future interview slot first.",
      );
      return;
    }
    const invites = { ...state.invites };
    for (const c of selectedCandidates)
      invites[c.id] = {
        ...makeInvite(c, "HR"),
        reason: needsReason ? reason.trim() : undefined,
      };
    update({ invites });
    setSend(false);
    setSelected([]);
    setReason("");
    setTab("invited");
    toast.success(
      `${selectedCandidates.length} demo invitation(s) prepared. Preview the candidate experience below.`,
    );
  }
  return (
    <div className="approval-page">
      <div className="approval-intro">
        <div>
          <div className="eyebrow">
            ASSESSMENT → APPROVAL → SECOND INTERVIEW
          </div>
          <h2>Keep great candidates moving.</h2>
          <p>
            Approve in a few clicks. Let clear passes move forward. Give
            exceptions a closer look.
          </p>
        </div>
        <span className="approval-pill">
          <ShieldCheck size={16} /> HR stays in control
        </span>
      </div>
      <div className="approval-notice">
        <strong>Client prototype</strong> · Invitations and bookings are saved
        in this browser. Email delivery, shared calendar availability and Google
        account connections are not connected. Google Calendar opens a real
        event draft for you to review and save.
      </div>
      <div className="approval-config">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>
                <Zap size={18} /> Approval rules
              </h2>
              <p>Choose how candidates reach the second interview.</p>
            </div>
          </div>
          <div className="approval-modes">
            {[false, true].map((auto) => (
              <button
                key={String(auto)}
                className={!auto === !state.rules.automatic ? "active" : ""}
                onClick={() => {
                  if (auto && !validSetup) {
                    toast.error(
                      "Set your HR email and future interview slots before enabling automation.",
                    );
                    return;
                  }
                  updateRules({ automatic: auto });
                }}
              >
                <strong>{auto ? "02 · Automatic" : "01 · HR approval"}</strong>
                <span>
                  {auto
                    ? "Clear passes get a booking invitation"
                    : "Select candidates and prepare invitations"}
                </span>
              </button>
            ))}
          </div>
          <div className="approval-fields">
            {(
              [
                [
                  "benchmark",
                  "Pass benchmark",
                  "Average across the six capabilities",
                ],
                [
                  "minimum",
                  "Minimum section score",
                  "Any section below this goes to HR",
                ],
                [
                  "spread",
                  "Maximum score gap",
                  "A larger high–low gap goes to HR",
                ],
              ] as const
            ).map(([field, label, help]) => (
              <label key={field}>
                {label}
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={state.rules[field]}
                  onChange={(e) => {
                    if (e.target.value !== "")
                      updateRules({
                        [field]: Math.max(
                          0,
                          Math.min(100, Number(e.target.value)),
                        ),
                      });
                  }}
                />
                <small>{help}</small>
              </label>
            ))}
          </div>
          <p className="approval-caption">
            Exceptions are checked first, even when the average passes.
            Below-benchmark candidates stay with HR; no automatic rejection.
            Customer communication remains a separate human review.
          </p>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>
                <CalendarDays size={18} /> Interview availability
              </h2>
              <p>Offer slots for candidates to choose from.</p>
            </div>
            <span className="approval-pill">30–60 min</span>
          </div>
          <div className="approval-fields">
            <label>
              HR Google email
              <input
                type="email"
                placeholder="hr@company.com"
                value={state.host}
                onChange={(e) => update({ host: e.target.value })}
              />
            </label>
            <label>
              Duration
              <select
                value={state.duration}
                onChange={(e) => update({ duration: Number(e.target.value) })}
              >
                {[30, 45, 60].map((n) => (
                  <option key={n} value={n}>
                    {n} minutes
                  </option>
                ))}
              </select>
            </label>
            <label>
              Location or meeting link
              <input
                value={state.location}
                onChange={(e) => update({ location: e.target.value })}
              />
            </label>
          </div>
          <form
            className="approval-slot-form"
            onSubmit={(e) => {
              e.preventDefault();
              const submittedSlot = String(
                new FormData(e.currentTarget).get("interviewSlot") ?? "",
              );
              if (
                !submittedSlot ||
                !Number.isFinite(Date.parse(submittedSlot)) ||
                Date.parse(submittedSlot) <= Date.now()
              ) {
                toast.error("Choose a future time.");
                return;
              }
              const iso = new Date(submittedSlot).toISOString();
              if (!state.slots.includes(iso))
                update({ slots: [...state.slots, iso].sort() });
              setSlot("");
            }}
          >
            <label>
              New slot · {Intl.DateTimeFormat().resolvedOptions().timeZone}
              <input
                aria-label="New interview slot"
                type="datetime-local"
                name="interviewSlot"
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                required
              />
            </label>
            <Button variant="outline" type="submit">
              Add slot
            </Button>
          </form>
          <div className="approval-slots">
            {state.slots.length ? (
              state.slots.map((s) => (
                <span key={s}>
                  {new Date(s).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  <button
                    aria-label={`Remove slot ${s}`}
                    onClick={() =>
                      update({ slots: state.slots.filter((v) => v !== s) })
                    }
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <p className="approval-caption">
                Add at least one slot to enable invitations. Existing
                invitations keep their original slots.
              </p>
            )}
          </div>
        </section>
      </div>
      <section className="panel approval-queue">
        <div className="panel-heading">
          <div>
            <h2>Approval queue</h2>
            <p>
              {state.rules.automatic
                ? "Automation is on · eligible passes receive demo invitations while this workspace is open."
                : "Review passes, select candidates, and invite them together."}
            </p>
          </div>
        </div>
        <div className="approval-tabs" role="tablist">
          {[
            ["passed", "Passed"],
            ["review", "Needs HR review"],
            ["invited", "Interview invitations"],
          ].map(([id, label]) => (
            <button
              role="tab"
              aria-selected={tab === id}
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => {
                setTab(id);
                setSelected([]);
              }}
            >
              {label}
              <span>{counts[id as keyof typeof counts]}</span>
            </button>
          ))}
        </div>
        <div className="approval-toolbar">
          <input
            aria-label="Search approval queue"
            placeholder="Search candidates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {tab !== "invited" && (
            <>
              <Button
                variant="outline"
                disabled={!visible.length}
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
                className="primary-button"
                disabled={!selectedCandidates.length}
                onClick={() => setSend(true)}
              >
                Invite selected ({selectedCandidates.length}){" "}
                <ArrowRight size={15} />
              </Button>
            </>
          )}
        </div>
        <div className="approval-list">
          {visible.length === 0 && (
            <div className="approval-empty">
              <CheckCircle2 size={28} />
              <h3>
                {tab === "review"
                  ? "No candidates waiting for review"
                  : tab === "invited"
                    ? "Your interview invitations will appear here"
                    : "No passes waiting for approval"}
              </h3>
              <p>
                {tab === "invited"
                  ? "Set availability, then invite passes manually or enable automation."
                  : "Completed candidate results are routed here using your rules."}
              </p>
            </div>
          )}
          {visible.map((c) => {
            const o = outcome(c),
              invitation = state.invites[c.id];
            return (
              <div className="approval-row" key={c.id}>
                {!invitation && (
                  <input
                    type="checkbox"
                    aria-label={`Select ${c.name}`}
                    checked={selected.includes(c.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, c.id]
                          : selected.filter((id) => id !== c.id),
                      )
                    }
                  />
                )}
                <div className="approval-person">
                  <button onClick={() => onProfile(c.id)}>{c.name}</button>
                  <small>{c.email}</small>
                </div>
                <div className="approval-evidence">
                  <strong>
                    {Math.round(o.average)}/100{" "}
                    <span
                      className={
                        o.route === "review"
                          ? "approval-warning"
                          : "approval-pill"
                      }
                    >
                      {invitation
                        ? invitation.booked
                          ? "Booked"
                          : "Awaiting booking"
                        : o.route === "review"
                          ? "HR review"
                          : "Passed"}
                    </span>
                  </strong>
                  <p>
                    {invitation
                      ? `${invitation.source} invitation${invitation.booked ? " · " + new Date(invitation.booked).toLocaleString() : " · Candidate chooses a slot"}`
                      : o.reason}
                  </p>
                  <div className="approval-bars">
                    {c.scores.map((n, i) => (
                      <span
                        key={i}
                        title={`${CAPS[i]}: ${n}`}
                        className={n < state.rules.minimum ? "low" : ""}
                      >
                        {CAPS[i].split(" ")[0]} <b>{n}</b>
                      </span>
                    ))}
                  </div>
                  {invitation?.reason && (
                    <p>HR rationale: {invitation.reason}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (invitation) {
                      setPreview(c.id);
                      setChosen(invitation.booked ?? "");
                    } else {
                      setSelected([c.id]);
                      setSend(true);
                    }
                  }}
                >
                  {invitation
                    ? "Candidate preview"
                    : o.route === "review"
                      ? "Review & invite"
                      : "Invite to interview"}
                </Button>
              </div>
            );
          })}
        </div>
      </section>
      <Dialog open={send} onOpenChange={setSend}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {needsReason
                ? "Review exception & invite"
                : "Invite to second interview"}
            </DialogTitle>
            <DialogDescription>
              Prepare a booking invitation for {selectedCandidates.length}{" "}
              candidate(s). No email is sent in this prototype.
            </DialogDescription>
          </DialogHeader>
          <p>{selectedCandidates.map((c) => c.name).join(", ")}</p>
          <p>
            {state.slots.filter((s) => Date.parse(s) > Date.now()).length}{" "}
            future slot(s) · {state.duration} minutes ·{" "}
            {state.host || "HR email required"}
          </p>
          {needsReason && (
            <label className="approval-label">
              Why should these candidates progress?
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Record the strengths and gaps to explore at interview."
              />
            </label>
          )}
          {!validSetup && (
            <p role="alert">
              Add an HR email and future slots in Interview availability first.
            </p>
          )}
          <Button
            disabled={
              !validSetup ||
              !selectedCandidates.length ||
              (needsReason && reason.trim().length < 10)
            }
            onClick={prepare}
          >
            Prepare demo invitations
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {previewInvite?.booked
                ? "Your second interview is booked"
                : "You’re through to the second interview"}
            </DialogTitle>
            <DialogDescription>
              Candidate preview · {previewCandidate?.name}. Choose an interview
              time, then add it to Google Calendar.
            </DialogDescription>
          </DialogHeader>
          {previewInvite && previewCandidate && (
            <>
              <p>
                {previewInvite.duration} minutes · {previewInvite.location}
              </p>
              {!previewInvite.booked ? (
                <>
                  <div className="approval-booking-slots">
                    {previewInvite.slots
                      .filter((s) => Date.parse(s) > Date.now())
                      .map((s) => {
                        const taken = Object.values(state.invites).some(
                          (inv) =>
                            inv.candidateId !== preview &&
                            inv.booked &&
                            Date.parse(s) <
                              Date.parse(inv.booked) + inv.duration * 60000 &&
                            Date.parse(s) + previewInvite.duration * 60000 >
                              Date.parse(inv.booked),
                        );
                        return (
                          <button
                            key={s}
                            disabled={taken}
                            className={chosen === s ? "active" : ""}
                            onClick={() => setChosen(s)}
                          >
                            {new Date(s).toLocaleString([], {
                              dateStyle: "full",
                              timeStyle: "short",
                            })}
                            {taken ? " · Unavailable" : ""}
                          </button>
                        );
                      })}
                  </div>
                  <p className="approval-caption">
                    Times shown in{" "}
                    {Intl.DateTimeFormat().resolvedOptions().timeZone}.
                    Availability is simulated; personal Google calendars are not
                    checked.
                  </p>
                  <Button
                    disabled={!chosen || Date.parse(chosen) <= Date.now()}
                    onClick={() => {
                      const conflict = Object.values(state.invites).some(
                        (inv) =>
                          inv.candidateId !== preview &&
                          inv.booked &&
                          Date.parse(chosen) <
                            Date.parse(inv.booked) + inv.duration * 60000 &&
                          Date.parse(chosen) + previewInvite.duration * 60000 >
                            Date.parse(inv.booked),
                      );
                      if (conflict) {
                        toast.error(
                          "This slot has been booked. Choose another time.",
                        );
                        return;
                      }
                      update({
                        invites: {
                          ...state.invites,
                          [preview!]: { ...previewInvite, booked: chosen },
                        },
                      });
                    }}
                  >
                    Confirm interview time
                  </Button>
                </>
              ) : (
                <>
                  <div className="approval-booked">
                    <CheckCircle2 size={30} />
                    <strong>
                      {new Date(previewInvite.booked).toLocaleString([], {
                        dateStyle: "full",
                        timeStyle: "short",
                      })}
                    </strong>
                    <p>
                      Demo booking saved. HR: {previewInvite.host}
                      <br />
                      Candidate: {previewCandidate.email}
                    </p>
                  </div>
                  <a
                    className="approval-calendar-link"
                    href={googleCalendarUrl(previewCandidate, previewInvite)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <CalendarDays size={18} /> Open Google Calendar draft
                  </a>
                  <p className="approval-caption">
                    Both parties are included as guests. Save the event in
                    Google Calendar and send invitations there; the other party
                    accepts to add it to their calendar. No event has been
                    created automatically.
                  </p>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Same-browser Pages demo: shows the next step immediately after submission. */
export function CandidateNextStep({ token }: { token: string }) {
  const [candidate, setCandidate] = useState<ApprovalCandidate | null>(null);
  const [invite, setInvite] = useState<InterviewInvite | null>(null);
  const [chosen, setChosen] = useState("");
  const [review, setReview] = useState(false);
  const key = "fieldfit-approvals-v1-live";
  useEffect(() => {
    function refresh() {
      try {
        const demo = JSON.parse(
          localStorage.getItem("fieldfit-pages-demo-v1") ?? "null",
        );
        const c = demo?.candidates?.find((c: any) => c.accessToken === token);
        const state: State | null = JSON.parse(
          localStorage.getItem(key) ?? "null",
        );
        if (!c || !state || c.status !== "Completed") return;
        setCandidate(c);
        const o = approvalOutcome(c, state.rules);
        setReview(o.route === "review");
        let invitation = state.invites[c.id];
        if (
          !invitation &&
          state.rules.automatic &&
          o.route === "passed" &&
          /^\S+@\S+\.\S+$/.test(state.host)
        ) {
          const slots = state.slots.filter((s) => Date.parse(s) > Date.now());
          if (slots.length) {
            invitation = {
              candidateId: c.id,
              slots,
              duration: state.duration,
              host: state.host,
              location: state.location,
              source: "Automatic",
              created: new Date().toISOString(),
            };
            state.invites[c.id] = invitation;
            localStorage.setItem(key, JSON.stringify(state));
          }
        }
        setInvite(invitation ?? null);
      } catch {
        /* An assessment can be completed without browser demo storage. */
      }
    }
    refresh();
    const timer = window.setInterval(refresh, 3000);
    return () => window.clearInterval(timer);
  }, [token]);
  if (!candidate) return null;
  if (!invite)
    return (
      <p className="next-steps">
        {review
          ? "Your assessment is with HR for an individual review. The team will contact you about the next step."
          : "HR will review your assessment and confirm your interview invitation."}
      </p>
    );
  return (
    <div className="candidate-next-step">
      <div className="eyebrow">SECOND INTERVIEW · BROWSER DEMO</div>
      <h2>
        {invite.booked
          ? "Your interview is booked"
          : "You’re through! Choose an interview time."}
      </h2>
      <p>
        {invite.duration} minutes · {invite.location}
      </p>
      {invite.booked ? (
        <>
          <strong>{new Date(invite.booked).toLocaleString()}</strong>
          <a
            className="approval-calendar-link"
            href={googleCalendarUrl(candidate, invite)}
            target="_blank"
            rel="noreferrer"
          >
            Open Google Calendar draft
          </a>
          <p className="approval-caption">
            Review and save the event in Google Calendar to send the invitation
            to both parties.
          </p>
        </>
      ) : (
        <>
          <select
            aria-label="Choose interview time"
            value={chosen}
            onChange={(e) => setChosen(e.target.value)}
          >
            <option value="">Choose a time</option>
            {invite.slots
              .filter((s) => Date.parse(s) > Date.now())
              .map((s) => (
                <option key={s} value={s}>
                  {new Date(s).toLocaleString()}
                </option>
              ))}
          </select>
          <Button
            disabled={!chosen || Date.parse(chosen) <= Date.now()}
            onClick={() => {
              try {
                const state: State = JSON.parse(localStorage.getItem(key)!);
                const conflict = Object.values(state.invites).some(
                  (i) =>
                    i.candidateId !== candidate.id &&
                    i.booked &&
                    Date.parse(chosen) <
                      Date.parse(i.booked) + i.duration * 60000 &&
                    Date.parse(chosen) + invite.duration * 60000 >
                      Date.parse(i.booked),
                );
                if (conflict) {
                  toast.error(
                    "This slot has been booked. Choose another time.",
                  );
                  return;
                }
                const booked = { ...invite, booked: chosen };
                state.invites[candidate.id] = booked;
                localStorage.setItem(key, JSON.stringify(state));
                setInvite(booked);
              } catch {
                toast.error("Could not save your booking. Please retry.");
              }
            }}
          >
            Confirm interview time
          </Button>
          <p className="approval-caption">
            Times use {Intl.DateTimeFormat().resolvedOptions().timeZone}. No
            email is sent and Google availability is not checked in this
            prototype.
          </p>
        </>
      )}
    </div>
  );
}
