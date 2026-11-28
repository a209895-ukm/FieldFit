import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approvalOutcome } from "@/lib/approval";
import { JOB_ROLES, weightedScore } from "@/lib/client-config";
import { useJourney } from "./journey-state";

/** Status a person would use to describe where a candidate is. */
export function stage(c: any, journey: any) {
  if (c.status !== "Completed") return c.status;
  const decided = journey.decisions?.[c.id]?.decision ?? c.decision?.decision;
  if (decided && decided !== "Interview") return decided === "Do not proceed" ? "Reject" : decided;
  const invite = journey.invites?.[c.id];
  if (invite?.booked) return "Interview booked";
  if (invite) return "Interview invited";
  const review = journey.reviews?.[c.id];
  if (review?.action === "hold") return "On hold";
  if (review?.action === "decline") return "Declined";
  return approvalOutcome(c, journey.rules).route === "passed"
    ? "Ready for interview"
    : "Needs review";
}
const tone: Record<string, string> = {
  Invited: "muted",
  "In progress": "info",
  "Needs review": "warn",
  "Ready for interview": "good",
  "Interview invited": "good",
  "Interview booked": "good",
  Hire: "good",
  Hold: "warn",
  "On hold": "warn",
  Reject: "muted",
  Declined: "muted",
};
export function StageBadge({ value }: { value: string }) {
  return <span className={"stage stage-" + (tone[value] ?? "muted")}>{value}</span>;
}

export function Dashboard({
  candidates,
  users,
  canInvite,
  onInvite,
  onOpen,
  onViewAll,
}: any) {
  const [journey] = useJourney(false);
  const people = candidates.filter((c: any) => c.kind !== "employee");
  const stages = people.map((c: any) => stage(c, journey));
  const count = (...s: string[]) => stages.filter((x: string) => s.includes(x)).length;
  const completed = people.filter((c: any) => c.status === "Completed").length;
  const flagged = people.filter((c: any) => c.flags?.length).length;
  const stats = [
    { label: "Candidates", value: people.length, note: `${count("Invited")} not started` },
    {
      label: "Completed",
      value: completed,
      note: people.length
        ? `${Math.round((completed / people.length) * 100)}% completion`
        : "—",
    },
    { label: "Needs review", value: count("Needs review"), note: `${flagged} with integrity flags`, warn: count("Needs review") > 0 },
    { label: "Interviews", value: count("Interview invited", "Interview booked"), note: `${count("Interview booked")} booked` },
    { label: "Hired", value: count("Hire"), note: `${count("Reject", "Declined")} not progressed` },
  ];
  const latest = [...candidates]
    .sort((a: any, b: any) => Date.parse(b.created ?? 0) - Date.parse(a.created ?? 0))
    .slice(0, 8);
  const byRole = JOB_ROLES.map((r) => ({
    ...r,
    n: people.filter((c: any) => c.role === r.id).length,
  }));
  const max = Math.max(1, ...byRole.map((r) => r.n));
  const managers = (users ?? []).filter((u: any) => u.role === "manager");
  return (
    <div className="dash">
      <div className="dash-stats">
        {stats.map((s) => (
          <div key={s.label} className={"dash-stat" + (s.warn ? " warn" : "")}>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
            <small>{s.note}</small>
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <section className="dash-card">
          <div className="dash-card-head">
            <h2>Latest candidates</h2>
            <button className="text-link" onClick={onViewAll}>
              View all <ArrowRight size={14} />
            </button>
          </div>
          {latest.length ? (
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Job role</th>
                  <th>Hiring manager</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Invited</th>
                </tr>
              </thead>
              <tbody>
                {latest.map((c: any) => (
                  <tr key={c.id} onClick={() => onOpen(c.id)} tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && onOpen(c.id)}>
                    <td>
                      <strong>{c.name}</strong>
                      <small>{c.email}</small>
                    </td>
                    <td>{c.kind === "employee" ? "Benchmark staff" : (c.roleTitle?.split(" (")[0] ?? "—")}</td>
                    <td>{c.managerName ?? "—"}</td>
                    <td>
                      {c.scores?.length ? Math.round(weightedScore(c.scores, c.level)) : "—"}
                      {c.flags?.length ? <span className="flag-dot" title="Integrity flag" /> : null}
                    </td>
                    <td>
                      <StageBadge value={c.kind === "employee" ? (c.status === "Completed" ? "Benchmark" : c.status) : stage(c, journey)} />
                    </td>
                    <td className="muted">
                      {c.created
                        ? new Date(c.created).toLocaleDateString("en-MY", { day: "numeric", month: "short" })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="dash-empty">
              <p>No candidates yet.</p>
              {canInvite && (
                <Button onClick={onInvite}>
                  <Plus size={15} /> Invite candidates
                </Button>
              )}
            </div>
          )}
        </section>
        <aside className="dash-side">
          <section className="dash-card">
            <div className="dash-card-head">
              <h2>By job role</h2>
            </div>
            <ul className="dash-bars">
              {byRole.map((r) => (
                <li key={r.id}>
                  <span>
                    {r.title.split(" (")[0]}
                    <small>{r.level}</small>
                  </span>
                  <div><i style={{ width: (r.n / max) * 100 + "%" }} /></div>
                  <b>{r.n}</b>
                </li>
              ))}
            </ul>
          </section>
          <section className="dash-card">
            <div className="dash-card-head">
              <h2>Hiring managers</h2>
            </div>
            <ul className="dash-managers">
              {managers.map((m: any) => {
                const mine = people.filter((c: any) => c.manager === m.email);
                return (
                  <li key={m.email}>
                    <span>{m.name}</span>
                    <small>
                      {mine.length} assigned ·{" "}
                      {mine.filter((c: any) => c.status === "Completed").length} completed
                    </small>
                  </li>
                );
              })}
              {!managers.length && <li className="muted">No hiring managers yet.</li>}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
