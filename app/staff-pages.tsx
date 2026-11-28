import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarPlus, CheckCircle2, RotateCcw, Download, GitCompare, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CAPS, LANGS } from "@/lib/assessment";
import { hasAvailability } from "@/lib/journey";
import { BLUEPRINTS, JOB_ROLES, LEVELS, WEIGHTS, weightedScore } from "@/lib/client-config";
import { stage, StageBadge } from "./dashboard";
import { useJourney } from "./journey-state";
import { api } from "./panels";

/* ------------------------------------------------------------------ Candidates */

const STAGES = ["Invited", "In progress", "Needs review", "Ready for interview", "Interview invited", "Interview booked", "Hire", "Hold", "Reject"];

export function CandidatesPage({ candidates, onOpen, selected, setSelected, onCompare, onExport, busy }: any) {
  const [journey] = useJourney(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [role, setRole] = useState("all");
  const [kind, setKind] = useState<"candidate" | "employee">("candidate");
  const rows = useMemo(
    () =>
      candidates
        .filter((c: any) => (kind === "employee" ? c.kind === "employee" : c.kind !== "employee"))
        .map((c: any) => ({ ...c, _stage: c.kind === "employee" ? c.status : stage(c, journey) }))
        .sort((a: any, b: any) => Date.parse(b.created ?? 0) - Date.parse(a.created ?? 0)),
    [candidates, journey, kind],
  );
  const shown = rows.filter(
    (c: any) =>
      (status === "All" || c._stage === status) &&
      (role === "all" || c.role === role) &&
      (c.name + " " + c.email).toLowerCase().includes(query.toLowerCase()),
  );
  const counts = STAGES.map((s) => [s, rows.filter((c: any) => c._stage === s).length] as const).filter(([, n]) => n > 0);
  const toggle = (id: string, on: boolean) =>
    setSelected(on ? [...selected, id] : selected.filter((x: string) => x !== id));
  return (
    <div className="cp">
      <div className="cp-bar">
        <label className="qb-search">
          <Search size={15} />
          <input placeholder="Search name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <select className="qb-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="All">All statuses ({rows.length})</option>
          {counts.map(([s, n]) => (
            <option key={s} value={s}>{s} ({n})</option>
          ))}
        </select>
        <select className="qb-select" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Job role">
          <option value="all">All job roles</option>
          {JOB_ROLES.map((r) => (
            <option key={r.id} value={r.id}>{r.title.split(" (")[0]}</option>
          ))}
        </select>
        <div className="seg" role="tablist">
          <button className={kind === "candidate" ? "on" : ""} onClick={() => { setKind("candidate"); setSelected([]); }}>Candidates</button>
          <button className={kind === "employee" ? "on" : ""} onClick={() => { setKind("employee"); setSelected([]); }}>Benchmark staff</button>
        </div>
        <div className="cp-actions">
          <Button variant="outline" disabled={selected.length < 2} onClick={onCompare}>
            <GitCompare size={15} /> Compare{selected.length ? ` (${selected.length})` : ""}
          </Button>
          <Button variant="outline" disabled={busy || !rows.length} onClick={onExport}>
            <Download size={15} /> Export
          </Button>
        </div>
      </div>
      <div className="cp-table">
        <div className="cp-row cp-head">
          <span />
          <span>Name</span>
          <span>Job role</span>
          <span>Hiring manager</span>
          <span>Score</span>
          <span>Status</span>
          <span>Language</span>
          <span>Invited</span>
        </div>
        {shown.map((c: any) => (
          <div key={c.id} className={"cp-row" + (selected.includes(c.id) ? " sel" : "")} onClick={() => onOpen(c.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen(c.id)}>
            <span onClick={(e) => e.stopPropagation()}>
              <Checkbox
                aria-label={"Select " + c.name}
                disabled={!c.scores?.length || (!selected.includes(c.id) && selected.length >= 3)}
                checked={selected.includes(c.id)}
                onCheckedChange={(v) => toggle(c.id, v === true)}
              />
            </span>
            <span className="cp-name">
              <strong>{c.name}</strong>
              <small>{c.email}</small>
            </span>
            <span>{c.roleTitle?.split(" (")[0] ?? "—"}</span>
            <span>{c.managerName ?? "—"}</span>
            <span className="cp-score">
              {c.scores?.length ? Math.round(weightedScore(c.scores, c.level)) : "—"}
              {c.flags?.length ? <i className="flag-dot" title="Integrity flag" /> : null}
            </span>
            <span><StageBadge value={c._stage} /></span>
            <span className="muted">{LANGS[c.language as keyof typeof LANGS] ?? "—"}</span>
            <span className="muted">{c.created ? new Date(c.created).toLocaleDateString("en-MY", { day: "numeric", month: "short" }) : "—"}</span>
          </div>
        ))}
        {!shown.length && <p className="qb-empty">{rows.length ? "No one matches these filters." : "No candidates yet."}</p>}
      </div>
      <div className="qb-foot">
        <span>{shown.length} of {rows.length}</span>
        {selected.length > 0 && (
          <button className="text-link" onClick={() => setSelected([])}>Clear selection</button>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Interview availability */

const DURATIONS = [15, 30, 45, 60];

export function Availability({ candidates }: any) {
  const [state, update] = useJourney(false, candidates);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const future = state.slots.filter((s) => Date.parse(s) > Date.now()).sort();
  const ready = hasAvailability(state);
  const save = (patch: any, msg?: string, undo?: any) => {
    const before = { host: state.host, location: state.location, duration: state.duration, slots: state.slots };
    update((s) => ({ ...s, ...patch }));
    if (msg)
      toast.success(msg, {
        action: { label: "Undo", onClick: () => update((s) => ({ ...s, ...(undo ?? before) })) },
      });
  };
  function add() {
    const iso = new Date(`${date}T${time}`).toISOString();
    if (!date || Date.parse(iso) <= Date.now()) return toast.error("Choose a future date and time.");
    if (state.slots.includes(iso)) return toast.error("That slot already exists.");
    save({ slots: [...state.slots, iso].sort() }, "Slot added");
  }
  function sampleWeek() {
    const slots = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + 1 + Math.floor(i / 2));
      d.setHours(i % 2 ? 14 : 10, 0, 0, 0);
      return d.toISOString();
    });
    save({ slots: [...new Set([...state.slots, ...slots])].sort(), host: state.host || "hr@company.example" }, "6 sample slots added");
  }
  const days = future.reduce((m: Record<string, string[]>, s) => {
    const k = new Date(s).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" });
    (m[k] ??= []).push(s);
    return m;
  }, {});
  return (
    <div className="av">
      <div className={"iv-status" + (ready ? "" : " warn")}>
        <CheckCircle2 size={16} />
        {ready ? `${future.length} open slots · candidates who pass can book` : "Add an organiser email and at least one future slot so candidates can book."}
      </div>
      <section className="settings-card av-grid">
        <label>
          <span>Organiser email</span>
          <input type="email" defaultValue={state.host} placeholder="hr@company.com"
            onBlur={(e) => e.target.value !== state.host && save({ host: e.target.value.trim() }, "Organiser updated")} />
        </label>
        <label>
          <span>Location or meeting link</span>
          <input defaultValue={state.location} placeholder="Microsoft Teams link or office address"
            onBlur={(e) => e.target.value !== state.location && save({ location: e.target.value.trim() }, "Location updated")} />
        </label>
        <div>
          <span>Duration</span>
          <div className="chip-row">
            {DURATIONS.map((d) => (
              <button key={d} className={state.duration === d ? "on" : ""} onClick={() => save({ duration: d }, `Duration set to ${d} min`)}>{d} min</button>
            ))}
          </div>
        </div>
      </section>
      <section className="settings-card">
        <div className="hr-rules-head">
          <h2>Interview slots</h2>
          <button className="text-link" onClick={sampleWeek}><CalendarPlus size={14} /> Add sample week</button>
        </div>
        <div className="av-add">
          <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
          <input type="time" value={time} step={900} onChange={(e) => setTime(e.target.value)} aria-label="Time" />
          <Button onClick={add} disabled={!date}><Plus size={15} /> Add slot</Button>
        </div>
        {future.length ? (
          <div className="av-days">
            {Object.entries(days).map(([day, list]) => (
              <div key={day} className="av-day">
                <strong>{day}</strong>
                <div>
                  {list.map((s) => (
                    <span key={s} className="av-slot">
                      {new Date(s).toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" })}
                      <button aria-label="Remove slot" onClick={() => save({ slots: state.slots.filter((x) => x !== s) }, "Slot removed")}><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="qb-empty">No upcoming slots.</p>
        )}
      </section>
    </div>
  );
}

/* --------------------------------------------------------------- Benchmark staff */

export function BenchmarkStaff({ candidates, onInvite }: any) {
  const staff = candidates.filter((c: any) => c.kind === "employee");
  const done = staff.filter((c: any) => c.status === "Completed");
  const high = done.filter((c: any) => c.performance === "high");
  const rows = CAPS.map((name, i) => {
    const v = high.map((c: any) => c.scores[i]).sort((a: number, b: number) => a - b);
    return {
      name,
      low: v.length ? v[0] : null,
      high: v.length ? v[v.length - 1] : null,
      median: v.length ? (v[Math.floor((v.length - 1) / 2)] + v[Math.ceil((v.length - 1) / 2)]) / 2 : null,
    };
  });
  return (
    <div className="bm">
      <div className="bm-bar">
        <span><b>{staff.length}</b> invited</span>
        <span><b>{done.length}</b> completed</span>
        <span><b>{high.length}</b> high performers</span>
        <Button onClick={() => onInvite("employee")}><Plus size={15} /> Invite staff</Button>
      </div>
      <section className="settings-card">
        <div className="hr-rules-head">
          <h2>High-performer range</h2>
          <small className="muted">{high.length < 5 ? `Needs at least 5 high performers (${high.length} so far)` : "Shown as a reference line on candidate profiles"}</small>
        </div>
        <div className="bm-rows">
          {rows.map((r) => (
            <div className="bm-row" key={r.name}>
              <span>{r.name}</span>
              <div className="bm-track">
                {r.median !== null && (
                  <>
                    <i className="range" style={{ left: r.low + "%", width: r.high! - r.low! + "%" }} />
                    <i className="median" style={{ left: r.median + "%" }} />
                  </>
                )}
              </div>
              <b>{r.median === null ? "—" : `${r.low}–${r.high} · ${r.median}`}</b>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- Data & audit */

export function DataAudit({ workspace, onUpdate }: any) {
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState(false);
  const cutoff = Date.now() - 180 * 86400000;
  const expired = (workspace.candidates ?? []).filter((c: any) => Date.parse(c.created) <= cutoff).length;
  const log = workspace.audit.filter((a: any) => (a.action + " " + a.actor).toLowerCase().includes(q.toLowerCase()));
  async function purge() {
    setConfirm(false);
    try {
      const r = await api("purge", {});
      await onUpdate();
      toast.success(`${r.count ?? 0} expired records deleted`);
    } catch (e: any) {
      toast.error(e.message);
    }
  }
  return (
    <div className="da">
      <section className="settings-card da-retention">
        <div>
          <h2>Retention</h2>
          <span>Candidate records are kept for 180 days (PDPA). {expired ? `${expired} past the limit.` : "None past the limit."}</span>
        </div>
        <Button variant="outline" disabled={!expired} onClick={() => setConfirm(true)}><Trash2 size={14} /> Delete expired</Button>
      </section>
      <section className="settings-card">
        <div className="hr-rules-head">
          <h2>Audit trail</h2>
          <label className="qb-search da-search">
            <Search size={14} />
            <input placeholder="Filter" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
        <div className="da-log">
          {log.map((a: any) => (
            <div key={a.id} className="da-row">
              <span className="da-action">{a.action.replaceAll(".", " ").replace(/^\w/, (c: string) => c.toUpperCase())}</span>
              <span>{a.actor}</span>
              <time>{new Date(a.created).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</time>
            </div>
          ))}
          {!log.length && <p className="qb-empty">No events.</p>}
        </div>
      </section>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="users-dialog">
          <DialogHeader>
            <DialogTitle>Delete {expired} expired records?</DialogTitle>
            <DialogDescription>This permanently removes candidate records and audit entries older than 180 days. It can’t be undone.</DialogDescription>
          </DialogHeader>
          <div className="confirm-actions">
            <Button variant="outline" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={purge}>Delete permanently</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ Assessment */


const SHORT = ["NUM", "LOG", "SJT", "PS", "SLR", "DDL"];

export function AssessmentSettings({ workspace, onUpdate }: any) {
  const saved = workspace.settings.rules;
  const [draft, setDraft] = useState({ ...saved, maxWarnings: saved.maxWarnings ?? 2 });
  const [confirm, setConfirm] = useState(false);
  const keys = ["proficient", "strong", "maxWarnings"] as const;
  const dirty = keys.some((k) => (saved[k] ?? 2) !== draft[k]) || saved.core.join() !== [...draft.core].sort().join();
  const invalid = draft.strong <= draft.proficient ? "“Strong” must be higher than “Proficient”." : null;
  const questions = workspace.settings.questions;
  async function save() {
    setConfirm(false);
    const previous = workspace.settings;
    try {
      await api("settings", { ...workspace.settings, rules: { ...draft, core: [...draft.core].sort() } });
      await onUpdate();
      toast.success("Assessment settings saved", {
        action: { label: "Undo", onClick: async () => { await api("settings", previous); await onUpdate(); toast("Change undone"); } },
      });
    } catch (e: any) {
      toast.error(e.message);
    }
  }
  const lines = [
    saved.proficient !== draft.proficient && `Proficient from ${saved.proficient} → ${draft.proficient}`,
    saved.strong !== draft.strong && `Strong from ${saved.strong} → ${draft.strong}`,
    (saved.maxWarnings ?? 2) !== draft.maxWarnings && `Tab-switch warnings ${saved.maxWarnings ?? 2} → ${draft.maxWarnings}`,
    saved.core.join() !== [...draft.core].sort().join() && `Core capabilities: ${draft.core.map((i: number) => SHORT[i]).join(", ") || "none"}`,
  ].filter(Boolean) as string[];
  const num = (k: (typeof keys)[number], label: string, max: number) => (
    <label className="as-num">
      <span>{label}</span>
      <input type="number" min={0} max={max} value={draft[k]} onChange={(e) => e.target.value !== "" && setDraft({ ...draft, [k]: Math.max(0, Math.min(max, Number(e.target.value))) })} />
    </label>
  );
  return (
    <div className="hr-rules">
      <section className="settings-card">
        <div className="hr-rules-head"><h2>Job roles</h2></div>
        <div className="as-table">
          <div className="as-row as-head"><span>Level</span><span>Roles</span><span>Test</span><span>Weights {SHORT.join(" / ")}</span><span>Bank</span></div>
          {LEVELS.map((level) => {
            const bp = BLUEPRINTS[level];
            const want = bp.perCap.reduce((a, b) => a + b, 0);
            const have = bp.perCap.reduce((n, w, cap) => n + Math.min(w, questions.filter((q: any) => q.enabled && q.cap === cap && q.level === level && q.format !== "open").length), 0);
            return (
              <div className="as-row" key={level}>
                <strong>{level}</strong>
                <span>{JOB_ROLES.filter((r) => r.level === level).map((r) => r.title.match(/\((\w+)\)/)?.[1] ?? r.title.split(" ")[0]).join(", ")}</span>
                <span>{bp.minutes} min · {want} Q{bp.open ? ` + ${bp.open} open` : ""} · {bp.spoken} spoken</span>
                <span className="mono">{WEIGHTS[level].map((w) => Math.round(w * 100)).join(" / ")}</span>
                <span className={"stage " + (have < want ? "stage-warn" : "stage-good")}>{have}/{want}</span>
              </div>
            );
          })}
        </div>
      </section>
      <section className="settings-card">
        <div className="hr-rules-head"><h2>Scoring and test rules</h2></div>
        <div className="as-grid">
          {num("proficient", "Proficient from", 100)}
          {num("strong", "Strong from", 100)}
          {num("maxWarnings", "Tab-switch warnings", 5)}
        </div>
        <div className="as-core">
          <span>Core capabilities <small>(a low score is flagged as a risk, not a trainable gap)</small></span>
          <div className="chip-row">
            {CAPS.map((c, i) => (
              <button key={c} title={c} className={draft.core.includes(i) ? "on" : ""}
                onClick={() => setDraft({ ...draft, core: draft.core.includes(i) ? draft.core.filter((x: number) => x !== i) : [...draft.core, i] })}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>
      <div className={"save-bar" + (dirty ? " show" : "")}>
        <span>{invalid ? <b className="warn-text">{invalid}</b> : dirty ? "Unsaved changes · applies to new invitations" : <><CheckCircle2 size={14} /> All changes saved</>}</span>
        <div>
          <Button variant="ghost" disabled={!dirty} onClick={() => setDraft({ ...saved, maxWarnings: saved.maxWarnings ?? 2 })}><RotateCcw size={14} /> Discard</Button>
          <Button disabled={!dirty || !!invalid} onClick={() => setConfirm(true)}>Review and save</Button>
        </div>
      </div>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="users-dialog">
          <DialogHeader>
            <DialogTitle>Save assessment settings?</DialogTitle>
            <DialogDescription>Applies to new invitations. Assessments already sent keep their settings.</DialogDescription>
          </DialogHeader>
          <ul className="confirm-list">{lines.map((l) => <li key={l}>{l}</li>)}</ul>
          <div className="confirm-actions">
            <Button variant="outline" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button onClick={save}>Confirm and save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
