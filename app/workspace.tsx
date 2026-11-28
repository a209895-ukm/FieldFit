import { Approvals } from "./approvals";
import { apiFetch } from "@/lib/client-api";
import { pageUrl, assessmentUrl, STATIC_DEMO } from "@/lib/navigation";
import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  Users,
  ClipboardList,
  BarChart3,
  Settings2,
  ShieldCheck,
  Plus,
  Search,
  Download,
  ArrowRight,
  Layers3,
  CircleHelp,
  CheckCircle2,
  Copy,
  RefreshCw,
  CalendarDays,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CAPS, LANGS, DEFAULT_RULES, csvCell } from "@/lib/assessment";
import {
  BLUEPRINTS,
  BRAND,
  JOB_ROLES,
  LEVELS,
  STAFF_ROLES,
  WEIGHTS,
  weightedScore,
} from "@/lib/client-config";
import { setSessionEmail } from "@/lib/session";
import { UsersPanel } from "./users";
import { BrandMark } from "./login";
import { Dashboard } from "./dashboard";
import { Settings } from "./settings";
import { Interviews } from "./interviews";
import { QuestionBank } from "./question-bank";
import { CandidatesPage } from "./staff-pages";
import { BulkInvite } from "./bulk-invite";
import { api, Picker, Detail, Benchmarks, Admin, RadarProfile } from "./panels";
import {
  communicationScore,
  communicationCells,
  COMMUNICATION_COLUMNS,
} from "@/lib/communication";
// Illustrative listening key for sample profiles (three questions, 10 marks each).
const sampleListening = {
  questions: ["L1", "L2", "L3"].map((id) => ({ id, points: [100, 0, 0, 0] })),
};
const voice = (answers: number[], metrics: Record<string, number>) => ({
  mode: "voice",
  listening: {
    answers: { L1: answers[0], L2: answers[1], L3: answers[2] },
    plays: 1,
  },
  metrics: { attempts: 1, transcribed: 1, ...metrics },
});
const samples = [
  {
    id: "demo-1",
    name: "Aina Rahman",
    email: "aina@example.test",
    language: "en",
    status: "Completed",
    scores: [88, 74, 91, 80, 85, 92],
    assessment: { listening: sampleListening },
    communication: voice([0, 0, 0], {
      durationSec: 72,
      units: 158,
      pace: 132,
      longPauses: 0,
    }),
    conversation:
      "I'm really sorry the last delivery was late, that must have caused problems for your shop. Can I ask what quantity you need this time and when it must arrive? I'll check stock and the delivery slot with our warehouse today and call you back by 4 p.m. to confirm. On price, let me show you what's included so you can compare like for like.",
    review: {
      ratings: [4, 3, 4, 3],
      delivery: { clarity: 4, pace: 10, fluency: 10 },
    },
  },
  {
    id: "demo-2",
    name: "Marcus Tan",
    email: "marcus@example.test",
    language: "zh",
    status: "Completed",
    scores: [92, 82, 75, 86, 58, 90],
    assessment: { listening: sampleListening },
    communication: voice([0, 0, 2], {
      durationSec: 58,
      units: 190,
      pace: 197,
      longPauses: 2,
      attempts: 2,
    }),
    conversation:
      "明白，上次迟到确实不好。我们的价格包含送货和售后。我今天会和仓库确认，再回复您送货时间。",
    review: {
      ratings: [3, 2, 3, 3],
      delivery: { clarity: 3, pace: 10, fluency: 6 },
    },
  },
  {
    id: "demo-3",
    name: "Siti Nur Izzah",
    email: "siti@example.test",
    language: "ms",
    status: "Completed",
    scores: [76, 80, 88, 72, 90, 79],
    assessment: { listening: sampleListening },
    communication: voice([0, 0, 0], {
      durationSec: 81,
      units: 176,
      pace: 130,
      longPauses: 1,
    }),
    conversation:
      "Saya faham, penghantaran lewat memang menyusahkan. Boleh saya tahu berapa kuantiti dan bila puan perlukan barang ini? Saya akan semak stok hari ini dan hubungi puan semula sebelum jam lima untuk sahkan masa penghantaran.",
  },
  {
    id: "demo-exception",
    name: "Mei Wong",
    email: "mei@example.test",
    language: "en",
    status: "Completed",
    scores: [98, 94, 92, 95, 25, 96],
  },
  {
    id: "demo-4",
    name: "Daniel Lim",
    email: "daniel@example.test",
    language: "en",
    status: "In progress",
    scores: [],
  },
  {
    id: "demo-5",
    name: "Arun Kumar",
    email: "arun@example.test",
    language: "en",
    status: "Invited",
    scores: [],
  },
];
import { advanceGuide, useGuide } from "./demo-guide-state";
export default function Workspace() {
  const guide = useGuide();
  const [view, setView] = useState("Dashboard"),
    [settingsTab, setSettingsTab] = useState("hiring"),
    [method, setMethod] = useState("manual"),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("All statuses"),
    [workspace, setWorkspace] = useState<any>(null),
    [mode, setMode] = useState("live"),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [invite, setInvite] = useState(false),
    [kind, setKind] = useState("candidate"),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [language, setLanguage] = useState("en"),
    [performance, setPerformance] = useState("high"),
    [jobRole, setJobRole] = useState(JOB_ROLES[0].id),
    [manager, setManager] = useState(""),
    [link, setLink] = useState(""),
    [busy, setBusy] = useState(false),
    [detailId, setDetailId] = useState<string | null>(null),
    [selected, setSelected] = useState<string[]>([]),
    [compare, setCompare] = useState(false),
    [inviteError, setInviteError] = useState("");
  useEffect(() => {
    if (!guide) return;
    if (
      ["rules", "availability", "automatic", "invite", "form", "open"].includes(
        guide.step,
      )
    ) {
      setView("Settings");
      setMode("live");
    }
    if (guide.step === "rules") setInvite(false);
    if (guide.step === "form") {
      setKind("candidate");
      setName("Alex Morgan");
      setEmail("alex@example.test");
      setLanguage("en");
      setLink("");
      setInvite(true);
    }
    if (guide.step === "open" && guide.path) {
      setLink(assessmentUrl(guide.path));
      setInvite(true);
    }
  }, [guide]);
  async function load(initial = false) {
    try {
      setError("");
      const w = await api("workspace");
      setWorkspace(w);
      if (initial && w.candidates.length) setMode("live");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load(true);
    const sync = (event: StorageEvent) => {
      if (STATIC_DEMO && event.key === "fieldfit-pages-demo-v1") load();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const role: string = workspace?.user?.role ?? "hr";
  const isManager = role === "manager";
  const managers: any[] = (workspace?.users ?? []).filter(
    (u: any) => u.role === "manager",
  );
  const candidates: any[] =
    mode === "sample" ? samples : (workspace?.candidates ?? []);
  const filtered = candidates.filter(
    (c) =>
      (c.name + " " + c.email).toLowerCase().includes(query.toLowerCase()) &&
      (status === "All statuses" || c.status === status),
  );
  const completed = candidates.filter((c) => c.status === "Completed");
  const detail = candidates.find((c) => c.id === detailId);
  const rules = workspace?.settings?.rules ?? DEFAULT_RULES;
  const high = (workspace?.candidates ?? []).filter(
    (c: any) =>
      c.kind === "employee" &&
      c.performance === "high" &&
      c.status === "Completed",
  );
  const benchmark =
    mode === "sample"
      ? [80, 76, 82, 78, 84, 85]
      : high.length
        ? CAPS.map((_, i) => {
            const n = high
              .map((c: any) => c.scores[i])
              .sort((a: number, b: number) => a - b);
            return (
              (n[Math.floor((n.length - 1) / 2)] +
                n[Math.ceil((n.length - 1) / 2)]) /
              2
            );
          })
        : null;
  function openInvite(type = "candidate") {
    setKind(type);
    setLink("");
    setInviteError("");
    setInvite(true);
    advanceGuide("invite");
  }
  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setInviteError("");
    try {
      const r = await api("candidates", {
        name,
        email,
        language,
        kind,
        role: jobRole,
        manager: kind === "candidate" ? manager || null : null,
        performance: kind === "employee" ? performance : null,
      });
      setLink(assessmentUrl(r.path));
      advanceGuide("form", r.path);
      setMode("live");
      await load();
      toast.success("Invitation link created");
    } catch (e: any) {
      setInviteError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function exportCsv() {
    setBusy(true);
    try {
      const sample = mode === "sample";
      let file: Blob;
      if (sample) {
        const rows = [
          [
            "Name",
            "Email",
            "Type",
            "Language",
            "Status",
            ...CAPS,
            "Conversation review",
            ...COMMUNICATION_COLUMNS,
            "Decision",
            "Reason",
            "Data source",
          ],
          ...samples.map((c) => [
            c.name,
            c.email,
            "candidate",
            LANGS[c.language as keyof typeof LANGS],
            c.status,
            ...(c.scores.length ? c.scores : Array(6).fill("")),
            c.review
              ? Math.round(
                  (c.review.ratings.reduce((a, b) => a + b, 0) / 16) * 100,
                )
              : "Pending",
            ...communicationCells(c),
            "",
            "",
            "Illustrative sample",
          ]),
        ];
        file = new Blob(
          [
            "\uFEFF" +
              rows.map((row) => row.map(csvCell).join(",")).join("\r\n"),
          ],
          { type: "text/csv;charset=utf-8" },
        );
      } else {
        const r = await apiFetch("/api/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        if (!r.ok) throw Error(((await r.json()) as any).error);
        file = await r.blob();
      }
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = sample
        ? "fieldfit-sample-candidates.csv"
        : "fieldfit-candidates.csv";
      a.hidden = true;
      document.body.appendChild(a);
      try {
        a.click();
      } finally {
        a.remove();
        // Keep the object URL alive while the browser starts the download.
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
      toast.success(
        sample ? "Sample CSV download started" : "CSV download started",
      );
      if (!sample) await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied");
    } catch {
      toast.error("Select the link and copy it manually.");
    }
  }
  const titles: Record<string, string> = {
    Dashboard: "Dashboard",
    Candidates: "Potential, with evidence to back it.",
    "HR journey": "Your hiring journey, step by step.",
    Assessments: "Built for the realities of the field.",
    Benchmarks: "Your team sets the reference.",
    Administration: "One standard. Clearly defined.",
    "Users & access": "The right access for every role.",
  };
  const nav = [
    [BarChart3, "Dashboard"],
    [Users, "Candidates"],
    [CalendarDays, "Interviews"],
    [ClipboardList, "Question bank"],
    [Settings2, "Settings"],
  ].filter(([, label]: any) =>
    isManager ? ["Dashboard", "Candidates", "Interviews"].includes(label) : true,
  );
  useEffect(() => {
    if (!nav.some(([, label]: any) => label === view)) setView("Dashboard");
  }, [role]);
  return (
    <SidebarProvider>
      <Sidebar className="ff-sidebar">
        <SidebarHeader>
          <BrandMark />
          <div className="workspace-label">
            {BRAND.company.toUpperCase()} <span>PILOT</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="nav-label">WORKSPACE</div>
          <SidebarMenu>
            {nav.map(([Icon, label]: any) => (
              <SidebarMenuItem key={label}>
                <SidebarMenuButton
                  isActive={view === label}
                  onClick={() => {
                    setSettingsTab("hiring");
                    setView(label);
                  }}
                >
                  <Icon />
                  <span>{label}</span>
                  {label === "Candidates" && <small>{candidates.length}</small>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

        </SidebarContent>
        <SidebarFooter>
          <button
            className="help-link"
            onClick={() => {
              setSessionEmail(null);
              window.location.assign(pageUrl("/login"));
            }}
          >
            <Users size={17} /> Sign out
          </button>

          <div className="account">
            <span className="avatar">
              {role === "admin" ? "MA" : role === "manager" ? "HM" : "HR"}
            </span>
            <div>
              <strong>{workspace?.user?.name ?? "Hiring team"}</strong>
              <small>
                {STAFF_ROLES[role as keyof typeof STAFF_ROLES]?.label ??
                  "Hiring workspace"}
              </small>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <div className="app-area">
        <header className="topbar">
          <div className="crumb">
            <SidebarTrigger />
            <span>Workspace</span>
            <span>/</span>
            <strong>{view}</strong>
          </div>
          <div className="top-actions">
            <span className="pilot-dot" />{" "}
            {STAFF_ROLES[role as keyof typeof STAFF_ROLES]?.label ?? "Pilot"}{" "}
            · {workspace?.user?.email ?? ""}
          </div>
        </header>
        <main className="main">
          <div className="page-bar">
            <h1>{view}</h1>
            {/* Settings holds configuration only, so no invite action there. */}
            {!isManager && view !== "Settings" && (
              <Button className="primary-button" onClick={() => openInvite()}>
                <Plus size={16} /> Invite candidates
              </Button>
            )}
          </div>
          {error && (
            <div className="error" role="alert">
              {error}{" "}
              <Button variant="outline" onClick={() => load()}>
                Retry
              </Button>
            </div>
          )}
          {view === "Dashboard" && (
            <Dashboard
              candidates={workspace?.candidates ?? []}
              users={workspace?.users ?? []}
              canInvite={!isManager}
              onInvite={() => openInvite()}
              onViewAll={() => {
                setMode("live");
                setView("Candidates");
              }}
              onOpen={(id: string) => {
                setMode("live");
                setView("Candidates");
                setDetailId(id);
              }}
            />
          )}
          {view === "Interviews" && (
            <Interviews
              candidates={workspace?.candidates ?? []}
              role={role}
              onProfile={setDetailId}
              onSettings={() => {
                setSettingsTab("availability");
                setView("Settings");
              }}
            />
          )}
          {view === "Candidates" && (
            <CandidatesPage
              candidates={workspace?.candidates ?? []}
              onOpen={setDetailId}
              selected={selected}
              setSelected={setSelected}
              onCompare={() => setCompare(true)}
              onExport={exportCsv}
              busy={busy}
            />
          )}
          {view === "Question bank" &&
            (workspace ? (
              <QuestionBank workspace={workspace} onUpdate={load} />
            ) : (
              <p className="muted">Loading…</p>
            ))}
          {view === "Settings" &&
            (workspace ? (
              <Settings
                key={settingsTab}
                initialTab={settingsTab}
                workspace={workspace}
                candidates={workspace.candidates ?? []}
                onUpdate={load}
                onInvite={openInvite}
                onProfile={setDetailId}
              />
            ) : (
              <p className="muted">Loading…</p>
            ))}

        </main>
      </div>
      <Dialog open={invite} onOpenChange={setInvite}>
        <DialogContent
          className={
            (guide ? "demo-guide-dialog " : "") +
            (method === "upload" && !link ? "invite-wide" : "")
          }
        >
          <DialogHeader>
            <DialogTitle>
              {link
                ? "Your invitation is ready."
                : kind === "employee"
                  ? "Invite a benchmark employee"
                  : "Invite candidates"}
            </DialogTitle>
            <DialogDescription>
              {link
                ? "Copy this link and send it through your preferred channel. It expires in 7 days and opens one assessment session."
                : "Each candidate gets a personal assessment link. Emails are not sent automatically."}
            </DialogDescription>
          </DialogHeader>
          {inviteError && (
            <div className="error" role="alert">
              {inviteError}
            </div>
          )}
          {!link && kind === "candidate" && (
            <>
              <label className="form-label">How do you want to add candidates?</label>
              <Picker
                label="Invite method"
                value={method}
                onChange={setMethod}
                items={[
                  ["manual", "Enter one candidate manually"],
                  ["upload", "Upload a file (CSV or TXT)"],
                ]}
              />
            </>
          )}
          {!link && kind === "candidate" && method === "upload" ? (
            <BulkInvite
              managers={managers}
              defaults={{ role: jobRole, language: "en", manager: "" }}
              onDone={() => {
                setMode("live");
                return load();
              }}
            />
          ) : link ? (
            <>
              <label className="form-label">
                Assessment link
                <input
                  readOnly
                  value={link}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <div className="button-row">
                <Button onClick={copy}>
                  <Copy size={15} />
                  Copy link
                </Button>
                <Button variant="outline" asChild>
                  <a
                    data-guide="open-assessment"
                    href={link}
                    target={guide ? "_self" : "_blank"}
                    rel="noreferrer"
                    onClick={() => advanceGuide("open")}
                  >
                    Open assessment <ArrowUpRight size={15} />
                  </a>
                </Button>
              </div>
              <div className="notice">
                {STATIC_DEMO
                  ? "This demo invitation works only in this browser. Open it here, finish the assessment, then return to Employer to review the results."
                  : "No account is needed. Starting the assessment claims this invitation in that browser. Keep the link private until you share it with the candidate."}
              </div>
            </>
          ) : (
            <form data-guide="invite-form" onSubmit={createInvite}>
              <label className="form-label">
                Full name
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aina Rahman"
                />
              </label>
              <label className="form-label">
                Email address
                <input
                  required
                  type="email"
                  maxLength={200}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@example.com"
                />
              </label>
              <label className="form-label">Job role</label>
              <Picker
                value={jobRole}
                onChange={setJobRole}
                items={JOB_ROLES.map((r) => [r.id, `${r.title} · ${r.level}`])}
                label="Job role"
              />
              <p className="muted small">
                {
                  BLUEPRINTS[
                    JOB_ROLES.find((r) => r.id === jobRole)?.level ?? "Entry"
                  ].note
                }
              </p>
              {kind === "candidate" && (
                <>
                  <label className="form-label">Assign hiring manager</label>
                  <Picker
                    value={manager || "none"}
                    onChange={(v: string) => setManager(v === "none" ? "" : v)}
                    items={[
                      ["none", "Not assigned yet"],
                      ...managers.map((m) => [m.email, m.name]),
                    ]}
                    label="Hiring manager"
                  />
                </>
              )}
              <label className="form-label">Preferred language</label>
              <Picker
                value={language}
                onChange={setLanguage}
                items={Object.entries(LANGS)}
                label="Preferred language"
              />
              {kind === "employee" && (
                <>
                  <label className="form-label">
                    Current performance group
                  </label>
                  <Picker
                    value={performance}
                    onChange={setPerformance}
                    items={[
                      ["high", "High performer"],
                      ["typical", "Typical performer"],
                    ]}
                    label="Performance group"
                  />
                </>
              )}
              <Button className="wide" disabled={!workspace || busy}>
                {busy ? "Creating…" : "Create invitation link"}
                <ArrowRight size={16} />
              </Button>
              {!workspace && (
                <p className="muted">
                  Please wait for your workspace to load, then try again.
                </p>
              )}
            </form>
          )}
          {guide && <div data-guide-host />}
        </DialogContent>
      </Dialog>
      <Sheet open={!!detailId} onOpenChange={(v) => !v && setDetailId(null)}>
        <SheetContent className="detail-sheet">
          <SheetHeader>
            <SheetTitle>Candidate profile</SheetTitle>
            <SheetDescription className="sr-only">
              Assessment results, evidence and decision
            </SheetDescription>
          </SheetHeader>
          {detail && (
            <Detail
              key={detail.id}
              candidate={detail}
              benchmark={benchmark}
              onUpdate={load}
              onLink={(path: string) => {
                setLink(assessmentUrl(path));
                setDetailId(null);
                setInvite(true);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
      <Dialog open={compare} onOpenChange={setCompare}>
        <DialogContent className="compare-dialog">
          <DialogHeader>
            <DialogTitle>Compare candidate profiles</DialogTitle>
            <DialogDescription>
              Review individual capability evidence. Scores are not a hiring
              recommendation.
            </DialogDescription>
          </DialogHeader>
          <RadarProfile
            candidates={candidates.filter((c) => selected.includes(c.id))}
            benchmark={benchmark}
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capability</TableHead>
                {candidates
                  .filter((c) => selected.includes(c.id))
                  .map((c) => (
                    <TableHead key={c.id}>{c.name}</TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {CAPS.map((cap, i) => (
                <TableRow key={cap}>
                  <TableCell>{cap}</TableCell>
                  {candidates
                    .filter((c) => selected.includes(c.id))
                    .map((c) => (
                      <TableCell key={c.id}>{c.scores[i]} / 100</TableCell>
                    ))}
                </TableRow>
              ))}
              <TableRow className="comm-row">
                <TableCell>Customer communication</TableCell>
                {candidates
                  .filter((c) => selected.includes(c.id))
                  .map((c) => {
                    const s = communicationScore(c);
                    return (
                      <TableCell key={c.id}>
                        {!s
                          ? "—"
                          : s.pending
                            ? "Awaiting review"
                            : `${s.total} / ${s.max}`}
                      </TableCell>
                    );
                  })}
              </TableRow>
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
function Stat({ label, value, note, icon: Icon }: any) {
  return (
    <section className="stat">
      <div>
        {label}
        <Icon size={18} />
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </section>
  );
}
