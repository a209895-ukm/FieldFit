import { apiFetch } from "@/lib/client-api";
import { STATIC_DEMO } from "@/lib/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";
import {
  CAPS,
  DEFAULT_RULES,
  profile,
  PROBES,
  TRAINING,
  RUBRIC,
  LANGS,
} from "@/lib/assessment";
import {
  communicationScore,
  PACE_NOTE,
  type CommunicationScore,
} from "@/lib/communication";
import { audioUrl, removeAudio } from "@/lib/audio-store";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Copy,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
export async function api(path: string, data?: any) {
  const res = await apiFetch("/api/" + path, {
    method: data === undefined ? "GET" : "POST",
    headers:
      data === undefined ? undefined : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const value: any = await res.json();
  if (!res.ok) throw Error(value.error ?? "Please retry.");
  return value;
}
export function Picker({ value, onChange, items, label }: any) {
  return (
    <Select value={String(value)} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item: any) => (
          <SelectItem
            key={Array.isArray(item) ? item[0] : item}
            value={String(Array.isArray(item) ? item[0] : item)}
          >
            {Array.isArray(item) ? item[1] : item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function RadarProfile({ candidates, benchmark }: any) {
  const names = [
    "Numerical",
    "Logic",
    "Judgement",
    "Problem-solving",
    "Self-leadership",
    "Digital & data",
  ];
  const data = names.map((name, i) => ({
    name,
    benchmark: benchmark?.[i] ?? 0,
    ...Object.fromEntries(
      candidates.map((c: any) => [c.id, c.scores?.[i] ?? 0]),
    ),
  }));
  return (
    <div className="radar-wrap">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} outerRadius="65%">
          <PolarGrid stroke="#dfe7df" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#688271" }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          {benchmark && (
            <Radar
              name="Staff reference (median)"
              dataKey="benchmark"
              stroke="#c29759"
              strokeDasharray="5 4"
              fill="transparent"
            />
          )}
          {candidates.map((c: any, i: number) => (
            <Radar
              key={c.id}
              name={c.name}
              dataKey={c.id}
              stroke={["#23775e", "#6e83b3", "#b98d60"][i % 3]}
              fill={["#23775e", "#6e83b3", "#b98d60"][i % 3]}
              fillOpacity={0.12}
            />
          ))}
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
      <div className="chart-legend">
        {candidates.map((c: any, i: number) => (
          <span key={c.id}>
            <i
              style={{ background: ["#23775e", "#6e83b3", "#b98d60"][i % 3] }}
            />
            {c.name}
          </span>
        ))}
        {benchmark && (
          <span>
            <i style={{ background: "#c29759" }} />
            Staff reference
          </span>
        )}
      </div>
    </div>
  );
}
function Part({
  label,
  value,
  max,
  empty,
}: {
  label: string;
  value: number | null;
  max: number;
  empty: string;
}) {
  return (
    <div className="comm-part">
      <span>{label}</span>
      <div className="score-track">
        {value !== null && (
          <span style={{ width: (value / max) * 100 + "%" }} />
        )}
      </div>
      <strong>
        {value === null ? (
          <em>{empty}</em>
        ) : (
          <>
            {value}
            <small>/{max}</small>
          </>
        )}
      </strong>
    </div>
  );
}
/** Customer communication, kept separate from the six-capability profile. */
export function CommunicationCard({ score: s }: { score: CommunicationScore }) {
  return (
    <section className="comm-card">
      <header>
        <div>
          <span className="eyebrow">CUSTOMER COMMUNICATION</span>
          <p>Listening · reply content · delivery</p>
        </div>
        <div className="comm-total">
          {s.pending ? (
            <em>Awaiting review</em>
          ) : (
            <>
              <strong>{s.total}</strong>
              <small>/{s.max}</small>
            </>
          )}
          <span className="tag">
            {s.mode === "voice" ? "Spoken reply" : "Typed reply"}
          </span>
        </div>
      </header>
      {s.listening !== null && (
        <Part label="Listening" value={s.listening} max={30} empty="—" />
      )}
      <Part
        label="Reply content"
        value={s.content}
        max={40}
        empty="Awaiting review"
      />
      {s.mode === "voice" ? (
        <Part
          label="Delivery"
          value={s.delivery}
          max={30}
          empty="Awaiting review"
        />
      ) : (
        <div className="comm-part">
          <span>Delivery</span>
          <p className="muted">Not scored for typed replies</p>
        </div>
      )}
    </section>
  );
}
function Recording({ candidate }: { candidate: any }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let url: string | null = null;
    audioUrl(candidate).then((u) => {
      url = u;
      setSrc(u);
    });
    return () => {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [candidate.id, candidate.communication?.audio?.id]);
  if (!candidate.communication?.audio)
    return <p className="muted">No recording was submitted.</p>;
  return src ? (
    <audio controls src={src} className="evidence-audio" />
  ) : (
    <p className="muted">
      The recording is stored in the browser where the assessment was taken.
    </p>
  );
}
export function Detail({ candidate: c, benchmark, onUpdate, onLink }: any) {
  const [tab, setTab] = useState("profile"),
    [decision, setDecision] = useState(c.decision?.decision ?? "Interview"),
    [reason, setReason] = useState(c.decision?.reason ?? ""),
    [ratings, setRatings] = useState<number[]>(
      c.review?.ratings ?? [0, 0, 0, 0],
    ),
    [notes, setNotes] = useState(c.review?.notes ?? ""),
    [delivery, setDelivery] = useState(() => {
      const s = communicationScore(c);
      return (
        c.review?.delivery ?? {
          clarity: 2,
          pace: s?.suggested?.pace ?? 5,
          fluency: s?.suggested?.fluency ?? 5,
        }
      );
    }),
    [month, setMonth] = useState("3"),
    [retained, setRetained] = useState(true),
    [kpi, setKpi] = useState("100"),
    [outcomeNotes, setOutcomeNotes] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const rules = c.assessment?.rules ?? DEFAULT_RULES;
  const summary = profile(c.scores, rules);
  const sample = c.id.startsWith("demo");
  const comm = communicationScore(c);
  const voice = comm?.mode === "voice";
  const metrics = c.communication?.metrics;
  async function save(action: string, data: any) {
    setBusy(true);
    setError("");
    try {
      if (action === "reissue") await removeAudio(c);
      const r = await api(`candidates/${c.id}/${action}`, data);
      await onUpdate();
      toast.success("Saved to the candidate record");
      if (r.path) onLink(r.path);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const elapsed =
    c.started && c.submitted
      ? (Date.parse(c.submitted) - Date.parse(c.started)) / 1000
      : null;
  return (
    <div className="detail">
      <div className="detail-summary">
        <span className="avatar">
          {c.name
            .split(" ")
            .map((s: string) => s[0])
            .slice(0, 2)
            .join("")}
        </span>
        <div>
          <h2>{c.name}</h2>
          <p>{c.email}</p>
        </div>
        <span className={"status " + c.status.toLowerCase().replace(" ", "-")}>
          {c.status}
        </span>
      </div>
      {sample && (
        <div className="notice">
          Illustrative profile. Changes cannot be saved to sample candidates.
        </div>
      )}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="decision">Decision</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          {!c.scores.length ? (
            <div className="empty-state">
              <h3>Assessment {c.status.toLowerCase()}</h3>
              <p>Results appear here after submission.</p>
            </div>
          ) : (
            <>
              <RadarProfile candidates={[c]} benchmark={benchmark} />
              {comm && <CommunicationCard score={comm} />}
              <div className="notice">
                Question scores are provisional. Customer communication is
                reported separately and does not change the profile score.
                Benchmark ranges guide discussion, not pass/fail decisions.
              </div>
              {summary.map((p) => (
                <div className="profile-cap" key={p.cap}>
                  <div>
                    <strong>{CAPS[p.cap]}</strong>
                    <span>
                      {p.score}
                      <small>/100</small> · {p.level}
                    </span>
                  </div>
                  <div className="score-track">
                    <span
                      style={{
                        width: p.score + "%",
                        background:
                          p.type === "Core risk" ? "#bf8c58" : "#6a997f",
                      }}
                    />
                  </div>
                  <p>
                    <span
                      className={
                        "tag " + (p.type === "Core risk" ? "core" : "")
                      }
                    >
                      {p.type}
                    </span>{" "}
                    {p.type === "Strength"
                      ? "Explore how this strength transfers to the role."
                      : p.type === "Core risk"
                        ? PROBES[p.cap]
                        : TRAINING[p.cap]}
                  </p>
                </div>
              ))}
              <div className="notice">
                <ShieldCheck size={18} />
                <div>
                  <strong>Reliability review</strong>
                  <p>
                    {c.switches ?? 0} reported tab changes.{" "}
                    {elapsed !== null && elapsed < 180
                      ? "Fast completion: discuss before interpreting scores."
                      : "Timing and tab changes are context, not proof of misconduct."}{" "}
                    Self-report responses require interview validation.
                  </p>
                </div>
              </div>
            </>
          )}
        </TabsContent>
        <TabsContent value="evidence">
          <h3 className="section-title">Response evidence</h3>
          {c.assessment?.questions?.map((q: any) => (
            <div className="evidence-item" key={q.id}>
              <small>
                {q.id} · {CAPS[q.cap]}
              </small>
              <p>{q.prompt[c.language as keyof typeof LANGS] ?? q.prompt.en}</p>
              <strong>
                {c.answers?.[q.id] === undefined
                  ? "Unanswered"
                  : q.options[c.language as keyof typeof LANGS]?.[
                      c.answers[q.id]
                    ]}
              </strong>
              <p className="muted">
                {q.explanation} · {q.points[c.answers?.[q.id]] ?? 0}/100
              </p>
            </div>
          ))}
          {sample && (
            <p className="muted">
              Item responses are unavailable for illustrative profiles.
            </p>
          )}
          {!sample && c.assessment?.listening && c.communication && (
            <>
              <h3 className="section-title">Listening</h3>
              {c.assessment.listening.questions.map((q: any) => {
                const a = c.communication.listening.answers[q.id];
                const lang = c.language as keyof typeof LANGS;
                return (
                  <div className="evidence-item" key={q.id}>
                    <small>{q.id}</small>
                    <p>{q.prompt[lang] ?? q.prompt.en}</p>
                    <strong>
                      {a === undefined ? "Unanswered" : q.options[lang]?.[a]}
                    </strong>
                    <p className="muted">
                      {(q.points[a] ?? 0) / 10}/10 · voicemail played{" "}
                      {c.communication.listening.plays}×
                    </p>
                  </div>
                );
              })}
            </>
          )}
          <h3 className="section-title">
            {voice ? "Spoken customer reply" : "Customer conversation"}
          </h3>
          {voice && !sample && <Recording candidate={c} />}
          {voice && metrics && (
            <div className="metric-row">
              <span>
                <strong>{Math.round(metrics.durationSec)} s</strong> length
              </span>
              <span>
                <strong>{metrics.pace ?? "—"}</strong>{" "}
                {c.language === "zh" ? "characters" : "words"} / min
              </span>
              <span>
                <strong>{metrics.longPauses}</strong> pauses over 3 s
              </span>
              <span>
                <strong>{metrics.attempts}</strong> of 2 attempts
              </span>
            </div>
          )}
          <blockquote>
            {c.conversation ||
              (voice
                ? "No transcript: the candidate's browser could not convert speech to text. Listen to the recording."
                : "No conversation response submitted.")}
          </blockquote>
          {voice && (
            <p className="muted small">
              Transcript produced by the candidate's browser and may contain
              recognition errors. Mark what was said, not how it was
              transcribed.
            </p>
          )}
          <p className="muted small">
            Reply content · 0 = absent, 1 = weak, 2 = partial, 3 = effective, 4
            = clear and specific.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save(
                "review",
                voice ? { ratings, notes, delivery } : { ratings, notes },
              );
            }}
          >
            {RUBRIC.map((r, i) => (
              <label className="rubric-row" key={r}>
                <span>{r}</span>
                <Picker
                  label={r}
                  value={ratings[i]}
                  onChange={(v: string) =>
                    setRatings(ratings.map((n, j) => (i === j ? Number(v) : n)))
                  }
                  items={["0", "1", "2", "3", "4"]}
                />
              </label>
            ))}
            {voice && (
              <div className="delivery-review">
                <h4>Delivery</h4>
                <p className="muted">
                  Listen to the recording. Pace and fluency are suggested from
                  it (pace band:{" "}
                  {PACE_NOTE[c.language as keyof typeof LANGS] ?? PACE_NOTE.en};
                  2 marks off per silence over 3 s). Never mark accent, voice
                  tone, confidence or minor grammar.
                </p>
                <label className="rubric-row">
                  <span>
                    Clarity: could a customer follow it the first time? (0–4)
                  </span>
                  <Picker
                    label="Clarity"
                    value={delivery.clarity}
                    onChange={(v: string) =>
                      setDelivery({ ...delivery, clarity: Number(v) })
                    }
                    items={["0", "1", "2", "3", "4"]}
                  />
                </label>
                <label className="rubric-row">
                  <span>
                    Pace (0–10)
                    {comm?.suggested?.pace != null &&
                      ` · suggested ${comm.suggested.pace}`}
                  </span>
                  <Picker
                    label="Pace"
                    value={delivery.pace}
                    onChange={(v: string) =>
                      setDelivery({ ...delivery, pace: Number(v) })
                    }
                    items={Array.from({ length: 11 }, (_, i) => String(i))}
                  />
                </label>
                <label className="rubric-row">
                  <span>
                    Fluency (0–10)
                    {comm?.suggested &&
                      ` · suggested ${comm.suggested.fluency}`}
                  </span>
                  <Picker
                    label="Fluency"
                    value={delivery.fluency}
                    onChange={(v: string) =>
                      setDelivery({ ...delivery, fluency: Number(v) })
                    }
                    items={Array.from({ length: 11 }, (_, i) => String(i))}
                  />
                </label>
              </div>
            )}
            <label className="form-label" htmlFor="review-notes">
              Evidence and reviewer notes
            </label>
            <textarea
              id="review-notes"
              required
              minLength={10}
              maxLength={4000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Quote evidence from the response and explain the rating."
            />
            <Button disabled={sample || busy || c.status !== "Completed"}>
              Save review
            </Button>
          </form>
          {c.review && (
            <p className="saved-note">
              Reviewed by {c.review.by ?? "the hiring team"}
              {comm &&
                !comm.pending &&
                ` · communication ${comm.total}/${comm.max}`}
            </p>
          )}
        </TabsContent>
        <TabsContent value="decision">
          <h3 className="section-title">A human decision, with a reason.</h3>
          <p className="muted">
            Use the profile to focus your interview. Assessment scores alone
            should not determine a hiring outcome.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save("decision", { decision, reason });
            }}
          >
            <label className="form-label">Decision</label>
            <Picker
              label="Hiring decision"
              value={decision}
              onChange={setDecision}
              items={["Interview", "Hold", "Hire", "Do not proceed"]}
            />
            <label className="form-label" htmlFor="decision-reason">
              Reason and supporting evidence
            </label>
            <textarea
              id="decision-reason"
              required
              minLength={10}
              maxLength={4000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Record the evidence and interview findings behind your decision."
            />
            <Button disabled={sample || busy || c.status !== "Completed"}>
              Record decision
            </Button>
          </form>
          {c.decision && (
            <div className="notice">
              {c.decision.decision} · recorded by {c.decision.by}
              <br />
              {c.decision.reason}
            </div>
          )}
          {c.decision?.decision === "Hire" && (
            <form
              className="outcome-form"
              onSubmit={(e) => {
                e.preventDefault();
                save("outcome", {
                  month: Number(month),
                  retained,
                  salesKpi: Number(kpi),
                  notes: outcomeNotes,
                });
              }}
            >
              <h3 className="section-title">3- and 6-month follow-up</h3>
              <label className="form-label">Review period</label>
              <Picker
                value={month}
                onChange={setMonth}
                items={[
                  [3, "3 months"],
                  [6, "6 months"],
                ]}
                label="Review period"
              />
              <label className="consent">
                <Checkbox
                  checked={retained}
                  onCheckedChange={(v) => setRetained(v === true)}
                />
                Still employed
              </label>
              <label className="form-label">
                Sales target achieved (%)
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={kpi}
                  onChange={(e) => setKpi(e.target.value)}
                  required
                />
              </label>
              <label className="form-label">
                Follow-up notes
                <textarea
                  value={outcomeNotes}
                  maxLength={2000}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                />
              </label>
              <Button disabled={busy}>Save follow-up</Button>
              {c.outcomes?.map((o: any) => (
                <p key={o.month} className="saved-note">
                  Month {o.month}: {o.retained ? "Retained" : "Left"} ·{" "}
                  {o.salesKpi}% of target
                </p>
              ))}
            </form>
          )}
          {c.status !== "Completed" && !sample && (
            <div className="outcome-form">
              <h3 className="section-title">Invitation support</h3>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    Reset attempt & create new link
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset this assessment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This invalidates the old link and clears the current
                      answers and timer. A new one-use link will be created.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => save("reissue", {})}>
                      Reset and create link
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
export function Benchmarks({ candidates, onInvite }: any) {
  const staff = candidates.filter(
    (c: any) => c.kind === "employee" && c.status === "Completed",
  );
  const high = staff.filter((c: any) => c.performance === "high");
  const rows = CAPS.map((name, i) => {
    const vals = high
      .map((c: any) => c.scores[i])
      .sort((a: number, b: number) => a - b);
    return {
      name,
      low: vals.length ? Math.min(...vals) : null,
      high: vals.length ? Math.max(...vals) : null,
      median: vals.length
        ? (vals[Math.floor((vals.length - 1) / 2)] +
            vals[Math.ceil((vals.length - 1) / 2)]) /
          2
        : null,
    };
  });
  return (
    <section className="panel padded">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">BUILD YOUR OWN EVIDENCE</div>
          <h2>What success looks like in your team.</h2>
          <p>Invite current sales staff to take the same assessment.</p>
        </div>
        <Button onClick={() => onInvite("employee")}>
          <Plus size={16} />
          Invite employee
        </Button>
      </div>
      <div className="benchmark-stats">
        <div>
          <strong>{staff.length}</strong>
          <span>Employee assessments</span>
        </div>
        <div>
          <strong>{high.length}</strong>
          <span>High performers</span>
        </div>
        <div>
          <strong>{staff.length - high.length}</strong>
          <span>Typical performers</span>
        </div>
      </div>
      <div className="notice">
        Small samples are directional only. Ranges below come from completed
        high-performer assessments; they are never pass/fail cut-offs. Typical
        performers provide a comparison group.
      </div>
      {rows.map((r, i) => (
        <div className="benchmark-row" key={r.name}>
          <strong>{r.name}</strong>
          <div className="score-track">
            <span
              style={{
                marginLeft: (r.low ?? 0) + "%",
                width: (r.high ?? 0) - (r.low ?? 0) + "%",
              }}
            />
            {r.median !== null && <i style={{ left: r.median + "%" }} />}
          </div>
          <span>
            {r.median === null
              ? "Awaiting data"
              : `${r.low}–${r.high} · median ${r.median}`}
          </span>
        </div>
      ))}
      <p className="muted">
        Validate draft items and language parity before relying on these
        comparisons. Pilot reliability and predictive-validity statistics
        require a larger, reviewed dataset.
      </p>
    </section>
  );
}
export function Admin({ workspace: w, onUpdate }: any) {
  const [settings, setSettings] = useState(() => structuredClone(w.settings)),
    [selected, setSelected] = useState(0),
    [lang, setLang] = useState("en"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const q = settings.questions[selected];
  const admin = w.user.role === "admin";
  async function action(path: string, body: any) {
    setBusy(true);
    setError("");
    try {
      await api(path, body);
      await onUpdate();
      toast.success("Changes saved");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function updateQuestion(field: string, value: any) {
    setSettings({
      ...settings,
      questions: settings.questions.map((item: any, i: number) =>
        i === selected ? { ...item, [field]: value } : item,
      ),
    });
  }
  return (
    <section className="panel padded">
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Scoring rules</TabsTrigger>
          <TabsTrigger value="questions">Question bank</TabsTrigger>
          <TabsTrigger value="team">Workspace & privacy</TabsTrigger>
          <TabsTrigger value="audit">Audit trail</TabsTrigger>
        </TabsList>
        <TabsContent value="rules">
          <h2 className="section-title">A consistent scoring standard</h2>
          <p className="muted">
            Draft rules · version {w.settings.rules.version}. Changes apply to
            new invitations; existing assessments keep their original version.
          </p>
          <div className="rules-grid">
            {[
              ["proficient", "Proficient from"],
              ["strong", "Strong from"],
              ["minutes", "Time limit (minutes)"],
            ].map(([key, label]) => (
              <label className="form-label" key={key}>
                {label}
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.rules[key]}
                  disabled={!admin}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      rules: {
                        ...settings.rules,
                        [key]: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>
          {CAPS.map((cap, i) => (
            <div className="rule-row" key={cap}>
              <strong>{cap}</strong>
              <Picker
                label={cap + " classification"}
                value={settings.rules.core.includes(i) ? "Core" : "Trainable"}
                items={["Core", "Trainable"]}
                onChange={(v: string) =>
                  setSettings({
                    ...settings,
                    rules: {
                      ...settings.rules,
                      core:
                        v === "Core"
                          ? [...new Set([...settings.rules.core, i])]
                          : settings.rules.core.filter((n: number) => n !== i),
                    },
                  })
                }
              />
            </div>
          ))}
          <Button
            disabled={!admin || busy}
            onClick={() => action("settings", settings)}
          >
            Save scoring rules
          </Button>
        </TabsContent>
        <TabsContent value="questions">
          <h2 className="section-title">One item ID. Three languages.</h2>
          <p className="muted">
            Draft translations require bilingual review and back-translation.
            Keep at least two active items in each capability.
          </p>
          <div className="question-editor-top">
            <Picker
              label="Select question"
              value={String(selected)}
              onChange={(v: string) => setSelected(Number(v))}
              items={settings.questions.map((item: any, i: number) => [
                String(i),
                item.id + " · " + CAPS[item.cap],
              ])}
            />
            <Picker
              label="Editing language"
              value={lang}
              onChange={setLang}
              items={Object.entries(LANGS)}
            />
          </div>
          <label className="form-label">
            Question
            <textarea
              value={q.prompt[lang]}
              disabled={!admin}
              onChange={(e) =>
                updateQuestion("prompt", {
                  ...q.prompt,
                  [lang]: e.target.value,
                })
              }
            />
          </label>
          {q.options[lang].map((opt: string, i: number) => (
            <div className="option-editor" key={i}>
              <label className="form-label">
                Option {String.fromCharCode(65 + i)}
                <input
                  value={opt}
                  disabled={!admin}
                  onChange={(e) =>
                    updateQuestion("options", {
                      ...q.options,
                      [lang]: q.options[lang].map((s: string, j: number) =>
                        i === j ? e.target.value : s,
                      ),
                    })
                  }
                />
              </label>
              <label className="form-label">
                Points
                <input
                  type="number"
                  min="0"
                  max="100"
                  disabled={!admin}
                  value={q.points[i]}
                  onChange={(e) =>
                    updateQuestion(
                      "points",
                      q.points.map((n: number, j: number) =>
                        i === j ? Number(e.target.value) : n,
                      ),
                    )
                  }
                />
              </label>
            </div>
          ))}
          <label className="form-label">
            Scoring explanation
            <textarea
              value={q.explanation}
              disabled={!admin}
              onChange={(e) => updateQuestion("explanation", e.target.value)}
            />
          </label>
          <label className="consent">
            <Checkbox
              checked={q.enabled}
              disabled={!admin}
              onCheckedChange={(v) => updateQuestion("enabled", v === true)}
            />
            Include in the random question pool
          </label>
          <Button
            disabled={!admin || busy}
            onClick={() => action("settings", settings)}
          >
            Save question bank
          </Button>
        </TabsContent>
        <TabsContent value="team">
          <h2 className="section-title">Your browser workspace</h2>
          <p className="muted">
            {STATIC_DEMO
              ? "No account is needed. Demo records are stored only in this browser. Clearing site data removes them; another browser starts fresh. Demo invitations work only in the browser that created them. Use fictional details."
              : "No account or sign-in is needed. This browser keeps a private workspace key in a cookie. Continue in the same browser to access your candidates. Clearing cookies or using another browser creates a separate workspace; export records you need to keep. Candidate links work independently and do not grant access to this workspace."}
          </p>
          <h2 className="section-title">Data retention</h2>
          <p className="muted">
            Candidate records older than 180 days are hidden. Run the purge to
            permanently remove expired records and old audit entries. Automated
            deletion and company privacy wording must be configured for the
            pilot.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={!admin}>
                Purge expired records
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Permanently delete expired records?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This removes candidate records and audit entries older than
                  180 days in your workspace.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => action("purge", {})}>
                  Purge expired data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="notice">
            Spoken replies are recorded and transcribed in the candidate's
            browser; a person marks content and delivery with a fixed rubric. AI
            scoring is not connected. No webcam, demographic attributes, accent
            or voice-quality measures, or automated hiring decisions are used.
          </div>
        </TabsContent>
        <TabsContent value="audit">
          <h2 className="section-title">Trace every important action.</h2>
          <p className="muted">
            Latest 80 events. Includes invitations, submissions, rule changes,
            reviews, decisions and exports.
          </p>
          {w.audit.length ? (
            w.audit.map((entry: any) => (
              <div className="audit-row" key={entry.id}>
                <span>
                  <strong>{entry.action.replaceAll(".", " · ")}</strong>
                  <small>{entry.actor}</small>
                </span>
                <time>
                  {new Date(entry.created).toLocaleString("en-MY", {
                    timeZone: "Asia/Kuala_Lumpur",
                  })}
                </time>
              </div>
            ))
          ) : (
            <div className="empty-state">
              Your audit trail will appear here.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
