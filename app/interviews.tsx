import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Copy,
  MoreHorizontal,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { approvalOutcome, calendarFile } from "@/lib/approval";
import {
  approveCandidates,
  hasAvailability,
  type JourneyCandidate,
  type JourneyState,
} from "@/lib/journey";
import { JOB_ROLES, weightedScore } from "@/lib/client-config";
import { assessmentUrl } from "@/lib/navigation";
import { useJourney } from "./journey-state";
import { Picker } from "./panels";

type Action =
  | { kind: "invite" | "hold" | "decline"; ids: string[] }
  | { kind: "decision"; ids: string[] };

const DAY = 86400000;
const when = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.round(
    (new Date(d.toDateString()).getTime() - new Date(today.toDateString()).getTime()) / DAY,
  );
  const day =
    diff === 0
      ? "Today"
      : diff === 1
        ? "Tomorrow"
        : d.toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" });
  return { day, time, today: diff === 0, past: d.getTime() < Date.now() };
};
const ago = (iso: string) => {
  const days = Math.floor((Date.now() - Date.parse(iso)) / DAY);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
};

/**
 * Interviews board: one column per thing that needs someone to act, left to right in the order it happens.
 * Every card has exactly one main action for its column, so nobody has to look for the next step.
 */
export function Interviews({
  candidates,
  role,
  onProfile,
  onSettings,
}: {
  candidates: JourneyCandidate[];
  role: string;
  onProfile: (id: string) => void;
  onSettings: () => void;
}) {
  const [state, update] = useJourney(false, candidates);
  const [jobRole, setJobRole] = useState("all");
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [final, setFinal] = useState<"Hire" | "Hold" | "Reject">("Hire");
  const hr = role !== "manager";

  const mutate = (edit: (s: JourneyState) => JourneyState, ok: string) => {
    try {
      update(edit);
      toast.success(ok);
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    }
  };

  const people = candidates.filter(
    (c: any) => c.kind !== "employee" && (jobRole === "all" || c.role === jobRole),
  );
  const cols = useMemo(() => {
    const review: any[] = [], waiting: any[] = [], scheduled: any[] = [], decide: any[] = [];
    const closed = { Hire: 0, Hold: 0, Reject: 0, Declined: 0 };
    for (const c of people as any[]) {
      if (c.status !== "Completed") continue;
      const d = state.decisions[c.id];
      if (d) { closed[d.decision]++; continue; }
      const inv = state.invites[c.id];
      const rev = state.reviews[c.id];
      if (!inv && rev?.action === "decline") { closed.Declined++; continue; }
      if (!inv) review.push(c);
      else if (!inv.booked) waiting.push(c);
      else if (!inv.attendedAt) scheduled.push(c);
      else decide.push(c);
    }
    scheduled.sort((a, b) => Date.parse(state.invites[a.id].booked!) - Date.parse(state.invites[b.id].booked!));
    // Clear passes first (quick wins), then exceptions, then holds.
    const rank = (c: any) =>
      state.reviews[c.id] ? 2 : approvalOutcome(c, state.rules).route === "passed" ? 0 : 1;
    review.sort((a, b) => rank(a) - rank(b));
    return { review, waiting, scheduled, decide, closed };
  }, [people, state]);

  const ready = hasAvailability(state);
  const openSlots = state.slots.filter((s) => Date.parse(s) > Date.now()).length;
  const clearPasses = cols.review.filter(
    (c) => !state.reviews[c.id] && approvalOutcome(c, state.rules).route === "passed",
  );

  function why(c: any) {
    if (state.reviews[c.id]) return { text: "On hold", tone: "warn" };
    if (c.flags?.length) return { text: "Integrity flag", tone: "bad" };
    const o = approvalOutcome(c, state.rules);
    if (o.route === "passed") return { text: "Clear pass", tone: "good" };
    return o.reason.startsWith("Uneven")
      ? { text: "Uneven profile", tone: "warn" }
      : { text: "Below benchmark", tone: "warn" };
  }
  function invite(ids: string[]) {
    const targets = candidates.filter((c) => ids.includes(c.id));
    const needsReason = targets.some(
      (c) => approvalOutcome(c, state.rules).route === "review" || state.reviews[c.id],
    );
    if (!ready) {
      toast.error("Add future interview slots in Settings first.");
      return;
    }
    if (needsReason) {
      setReason("");
      setAction({ kind: "invite", ids });
    } else
      mutate((s) => approveCandidates(s, targets, ""), `${targets.length} invited to book an interview`);
  }
  function apply() {
    if (!action) return;
    const targets = candidates.filter((c) => action.ids.includes(c.id));
    const r = reason.trim();
    const done = mutate((s) => {
      if (r.length < 10) throw Error("Write a reason of at least 10 characters.");
      if (action.kind === "invite") return approveCandidates(s, targets, r);
      if (action.kind === "decision")
        return {
          ...s,
          decisions: {
            ...s.decisions,
            [targets[0].id]: { decision: final, reason: r, at: new Date().toISOString() },
          },
        };
      const reviews = { ...s.reviews };
      for (const c of targets)
        reviews[c.id] = { action: action.kind, reason: r, at: new Date().toISOString() } as any;
      return { ...s, reviews };
    }, action.kind === "decision" ? `Decision recorded: ${final}` : "Saved");
    if (done) setAction(null);
  }
  const refreshSlots = (id: string) =>
    mutate(
      (s) => ({
        ...s,
        invites: {
          ...s.invites,
          [id]: {
            ...s.invites[id],
            slots: s.slots.filter((t) => Date.parse(t) > Date.now()),
            availabilityRequested: undefined,
          },
        },
      }),
      "New times sent to the candidate",
    );
  const markDone = (id: string) =>
    mutate(
      (s) => ({
        ...s,
        invites: { ...s.invites, [id]: { ...s.invites[id], attendedAt: new Date().toISOString() } },
      }),
      "Interview marked as done",
    );
  async function copyLink(c: any) {
    if (!c.accessToken) return toast.error("No personal link for this candidate.");
    await navigator.clipboard.writeText(assessmentUrl("/assess/" + c.accessToken));
    toast.success("Candidate link copied. Send it as a reminder.");
  }
  function ics(c: any) {
    const url = URL.createObjectURL(calendarFile(c, state.invites[c.id]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-${c.name.replace(/\s+/g, "-").toLowerCase()}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  const Person = ({ c, children }: any) => (
    <article className="iv-card">
      <button className="iv-person" onClick={() => onProfile(c.id)} title="Open profile">
        <strong>{c.name}</strong>
        <small>{c.roleTitle?.split(" (")[0] ?? "Candidate"}</small>
        {c.scores?.length ? (
          <span className="iv-score">{Math.round(weightedScore(c.scores, c.level))}</span>
        ) : null}
      </button>
      {children}
    </article>
  );

  const columns = [
    {
      id: "review",
      title: "To review",
      hint: "Completed assessments waiting for HR",
      items: cols.review,
      head:
        hr && clearPasses.length > 1 && !state.rules.automatic ? (
          <button className="iv-bulk" onClick={() => invite(clearPasses.map((c) => c.id))}>
            Invite all {clearPasses.length} clear passes
          </button>
        ) : null,
      card: (c: any) => {
        const w = why(c);
        return (
          <Person c={c} key={c.id}>
            <span className={"iv-chip " + w.tone}>{w.text}</span>
            {hr ? (
              <div className="iv-actions">
                <Button size="sm" onClick={() => invite([c.id])}>Invite to interview</Button>
                <Menu
                  items={[
                    !state.reviews[c.id] && ["Put on hold", () => { setReason(""); setAction({ kind: "hold", ids: [c.id] }); }],
                    ["Decline", () => { setReason(""); setAction({ kind: "decline", ids: [c.id] }); }],
                  ]}
                />
              </div>
            ) : (
              <small className="iv-note">Waiting for HR review</small>
            )}
          </Person>
        );
      },
    },
    {
      id: "waiting",
      title: "Waiting to book",
      hint: "Invited, no time chosen yet",
      items: cols.waiting,
      card: (c: any) => {
        const i = state.invites[c.id];
        const stale = !i.slots.some((t) => Date.parse(t) > Date.now());
        return (
          <Person c={c} key={c.id}>
            <small className="iv-note">
              Invited {ago(i.created)} ·{" "}
              {i.availabilityRequested ? (
                <b className="warn-text">asked for other times</b>
              ) : stale ? (
                <b className="warn-text">offered times have passed</b>
              ) : (
                `${i.slots.filter((t) => Date.parse(t) > Date.now()).length} times offered`
              )}
            </small>
            {hr && (
              <div className="iv-actions">
                {i.availabilityRequested || stale ? (
                  <Button size="sm" onClick={() => refreshSlots(c.id)} disabled={!openSlots}>
                    Send new times
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => copyLink(c)}>
                    <Copy size={13} /> Copy reminder link
                  </Button>
                )}
              </div>
            )}
          </Person>
        );
      },
    },
    {
      id: "scheduled",
      title: "Scheduled",
      hint: "Booked, soonest first",
      items: cols.scheduled,
      card: (c: any) => {
        const i = state.invites[c.id];
        const t = when(i.booked!);
        return (
          <Person c={c} key={c.id}>
            <div className={"iv-when" + (t.today ? " today" : "")}>
              <CalendarClock size={14} /> {t.day} · {t.time}
              <span className={i.confirmedAt ? "ok" : "pending"}>
                {i.confirmedAt ? "Confirmed" : "Not confirmed"}
              </span>
            </div>
            <div className="iv-actions">
              {t.past ? (
                <Button size="sm" onClick={() => markDone(c.id)}>Mark as done</Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => ics(c)}>Add to Outlook</Button>
              )}
            </div>
          </Person>
        );
      },
    },
    {
      id: "decide",
      title: "Decide",
      hint: "Interviewed, outcome not recorded",
      items: cols.decide,
      card: (c: any) => (
        <Person c={c} key={c.id}>
          <small className="iv-note">
            Interviewed {ago(state.invites[c.id].attendedAt!)}
          </small>
          <div className="iv-actions">
            <Button size="sm" onClick={() => { setReason(""); setFinal("Hire"); setAction({ kind: "decision", ids: [c.id] }); }}>
              Record decision
            </Button>
          </div>
        </Person>
      ),
    },
  ];

  const title = {
    invite: "Invite to interview",
    hold: "Put on hold",
    decline: "Decline",
    decision: "Record decision",
  };
  const target = action ? candidates.find((c) => c.id === action.ids[0]) : null;

  return (
    <div className="iv">
      <div className="iv-bar">
        <div className={"iv-status" + (ready ? "" : " warn")}>
          {ready ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {ready
            ? `${openSlots} open interview slot${openSlots === 1 ? "" : "s"} · ${state.rules.automatic ? "clear passes are invited automatically" : "HR approves each invitation"}`
            : "No open interview slots. Candidates can’t book until you add some."}
          {hr && (
            <button className="text-link" onClick={onSettings}>
              <Settings2 size={13} /> {ready ? "Change" : "Add slots"}
            </button>
          )}
        </div>
        <Picker
          label="Filter by job role"
          value={jobRole}
          onChange={setJobRole}
          items={[["all", "All job roles"], ...JOB_ROLES.map((r) => [r.id, r.title.split(" (")[0]])]}
        />
      </div>

      <div className="iv-board">
        {columns.map((col) => (
          <section key={col.id} className="iv-col">
            <header>
              <div>
                <h2>
                  {col.title} <span>{col.items.length}</span>
                </h2>
                <small>{col.hint}</small>
              </div>
              {col.head}
            </header>
            <div className="iv-list">
              {col.items.length ? col.items.map(col.card) : <p className="iv-empty">Nothing here</p>}
            </div>
          </section>
        ))}
      </div>

      <p className="iv-closed">
        Closed: {cols.closed.Hire} hired · {cols.closed.Hold} on hold after interview ·{" "}
        {cols.closed.Reject} rejected · {cols.closed.Declined} declined at review. Full history is in
        Candidates.
      </p>

      <Dialog open={!!action} onOpenChange={(v) => !v && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action && title[action.kind]}</DialogTitle>
            <DialogDescription>
              {action && action.ids.length > 1
                ? `${action.ids.length} candidates`
                : target?.name}
              {action?.kind === "invite" && " · This result needs a reason because it didn’t clear the rules on its own."}
            </DialogDescription>
          </DialogHeader>
          {action?.kind === "decision" && (
            <div className="iv-decision">
              {(["Hire", "Hold", "Reject"] as const).map((d) => (
                <button key={d} className={final === d ? "active " + d : d} onClick={() => setFinal(d)}>
                  {d}
                </button>
              ))}
            </div>
          )}
          <label className="form-label" htmlFor="iv-reason">
            Reason (kept in the audit record)
          </label>
          <textarea
            id="iv-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What did you see that supports this?"
          />
          <Button onClick={apply} disabled={reason.trim().length < 10}>
            {action?.kind === "decision" ? `Save: ${final}` : action && title[action.kind]}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Menu({ items }: { items: (false | [string, () => void])[] }) {
  const [open, setOpen] = useState(false);
  const list = items.filter(Boolean) as [string, () => void][];
  return (
    <div className="iv-menu" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <button aria-label="More actions" onClick={() => setOpen(!open)}>
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div role="menu">
          {list.map(([label, fn]) => (
            <button key={label} role="menuitem" onClick={() => { setOpen(false); fn(); }}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
