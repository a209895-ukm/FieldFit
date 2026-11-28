import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  Download,
  ArchiveRestore,
  FileUp,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CAPS, LANGS, type Lang, type Question } from "@/lib/assessment";
import { BLUEPRINTS, LEVELS } from "@/lib/client-config";
import { questionsFromRows } from "@/lib/bank-import";
import { api } from "./panels";

const SHORT = ["NUM", "LOG", "SJT", "PS", "SLR", "DDL"];
const FORMAT_LABEL = { single: "One correct answer", weighted: "Judgement", open: "Open-ended" };
const WEIGHTS = [
  [100, "Best", "+1"],
  [0, "Acceptable", "0"],
  [-50, "Weak", "−0.5"],
  [-100, "Breach", "−1"],
  [-200, "Fraud", "−2"],
] as const;
const formatOf = (q: Question) => q.format ?? "single";

/** Browse, edit, retire and import questions. Every change is confirmed and can be undone. */
export function QuestionBank({ workspace, onUpdate }: any) {
  const bank: Question[] = workspace.settings.questions;
  const canEdit = ["admin", "hr"].includes(workspace.user?.role);
  const [level, setLevel] = useState("All");
  const [cap, setCap] = useState(-1);
  const [query, setQuery] = useState("");
  const [showRetired, setShowRetired] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Question | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirm, setConfirm] = useState<null | { title: string; body: string; lines?: string[]; cta: string; run: () => void; danger?: boolean }>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const list = useMemo(
    () =>
      bank.filter(
        (q) =>
          (showRetired || q.enabled) &&
          (level === "All" || (level === "General" ? !q.level : q.level === level)) &&
          (cap < 0 || q.cap === cap) &&
          (q.id + " " + q.prompt.en).toLowerCase().includes(query.toLowerCase()),
      ),
    [bank, level, cap, query, showRetired],
  );
  const retiredCount = bank.filter((q) => !q.enabled).length;
  const current = bank.find((q) => q.id === openId) ?? null;

  /** Saves the whole bank, then offers Undo with the previous version. */
  async function commit(next: Question[], message: string, highlight?: string) {
    const previous = bank;
    try {
      await api("settings", { ...workspace.settings, questions: next });
      await onUpdate();
      if (highlight) {
        setFlash(highlight);
        setTimeout(() => setFlash(null), 1600);
      }
      toast.success(message, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await api("settings", { ...workspace.settings, questions: previous });
              await onUpdate();
              toast("Change undone");
            } catch (e: any) {
              toast.error(e.message);
            }
          },
        },
      });
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    }
  }

  function toggleRetire(q: Question) {
    const retiring = q.enabled;
    setConfirm({
      title: retiring ? `Retire ${q.id}?` : `Bring back ${q.id}?`,
      body: retiring
        ? "It won’t be picked for new assessments. Invitations already sent keep their questions."
        : "It will be picked for new assessments again.",
      cta: retiring ? "Retire question" : "Make active",
      danger: retiring,
      run: () =>
        commit(
          bank.map((x) => (x.id === q.id ? { ...x, enabled: !retiring } : x)),
          retiring ? `${q.id} retired` : `${q.id} is active again`,
          q.id,
        ),
    });
  }

  function startNew() {
    setIsNew(true);
    setOpenId(null);
    setEditing({
      id: "",
      cap: cap >= 0 ? cap : 0,
      level: (["Entry", "Junior", "Senior"].includes(level) ? level : "Entry") as any,
      format: "single",
      prompt: { en: "", ms: "", zh: "" },
      options: { en: ["", "", "", ""], ms: ["", "", "", ""], zh: ["", "", "", ""] },
      points: [100, 0, 0, 0],
      explanation: "",
      enabled: true,
      translated: false,
      client: true,
    });
  }
  function nextId(q: Question) {
    const prefix = `TRB-${SHORT[q.cap]}-${(q.level ?? "Entry")[0]}`;
    const n = Math.max(0, ...bank.map((x) => (x.id.startsWith(prefix) ? Number(x.id.slice(prefix.length)) || 0 : 0))) + 1;
    return prefix + n;
  }
  function changesOf(before: Question | null, after: Question) {
    if (!before) return [`New ${FORMAT_LABEL[formatOf(after)].toLowerCase()} question · ${CAPS[after.cap]} · ${after.level}`];
    const out: string[] = [];
    if (before.cap !== after.cap) out.push(`Capability: ${CAPS[before.cap]} → ${CAPS[after.cap]}`);
    if (before.level !== after.level) out.push(`Level: ${before.level ?? "General"} → ${after.level ?? "General"}`);
    if (before.format !== after.format) out.push(`Format: ${FORMAT_LABEL[formatOf(before)]} → ${FORMAT_LABEL[formatOf(after)]}`);
    (Object.keys(LANGS) as Lang[]).forEach((l) => {
      if (before.prompt[l] !== after.prompt[l]) out.push(`Question text (${LANGS[l]})`);
      if (JSON.stringify(before.options[l]) !== JSON.stringify(after.options[l])) out.push(`Answer options (${LANGS[l]})`);
    });
    if (JSON.stringify(before.points) !== JSON.stringify(after.points)) {
      const L = (i: number) => String.fromCharCode(65 + i);
      if (formatOf(after) === "single" && before.points.length === after.points.length)
        out.push(`Correct answer: ${L(before.points.indexOf(100))} → ${L(after.points.indexOf(100))}`);
      else if (before.points.length === after.points.length)
        after.points.forEach((p, i) => {
          if (p !== before.points[i])
            out.push(`Option ${L(i)} score: ${before.points[i] / 100} → ${p / 100}`);
        });
      else out.push(`Answer options: ${before.points.length} → ${after.points.length}`);
    }
    if ((before.rubric ?? "") !== (after.rubric ?? "")) out.push("Marking guide");
    return out;
  }
  function problemOf(q: Question) {
    if (q.prompt.en.trim().length < 10) return "Write the question in English (at least 10 characters).";
    if (formatOf(q) === "open") return (q.rubric ?? "").trim().length < 10 ? "Describe what a strong answer must include." : null;
    const filled = q.options.en.filter((o) => o.trim()).length;
    if (filled < 2 || filled !== q.options.en.length) return "Fill in every answer option (2 to 4).";
    if (!q.points.some((p) => p === 100)) return formatOf(q) === "single" ? "Mark the correct answer." : "Mark at least one option as Best (+1).";
    return null;
  }
  function requestSave() {
    if (!editing) return;
    const before = isNew ? null : current;
    const q = { ...editing, id: isNew ? nextId(editing) : editing.id, rev: (editing.rev ?? 1) + (isNew ? 0 : 1) };
    const lines = changesOf(before, q);
    if (!lines.length) {
      setEditing(null);
      return;
    }
    setConfirm({
      title: isNew ? `Add ${q.id}?` : `Save changes to ${q.id}?`,
      body: "Applies to new invitations only. Assessments already sent keep their version.",
      lines,
      cta: isNew ? "Add question" : "Save changes",
      run: async () => {
        const next = isNew ? [...bank, q] : bank.map((x) => (x.id === q.id ? q : x));
        if (await commit(next, isNew ? `${q.id} added` : `${q.id} updated`, q.id)) {
          setEditing(null);
          setIsNew(false);
          setOpenId(q.id);
        }
      },
    });
  }

  return (
    <div className="qb">
      <Coverage bank={bank} />
      <div className="qb-bar">
        <label className="qb-search">
          <Search size={15} />
          <input placeholder="Search questions or IDs" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="seg" role="tablist" aria-label="Job level">
          {["All", ...LEVELS, "General"].map((l) => (
            <button key={l} role="tab" aria-selected={level === l} className={level === l ? "on" : ""} onClick={() => setLevel(l)}>
              {l}
            </button>
          ))}
        </div>
        <select className="qb-select" value={cap} onChange={(e) => setCap(Number(e.target.value))} aria-label="Capability">
          <option value={-1}>All capabilities</option>
          {CAPS.map((c, i) => (
            <option key={c} value={i}>{c}</option>
          ))}
        </select>
        {canEdit && (
          <div className="qb-actions">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileUp size={15} /> Import Excel
            </Button>
            <Button onClick={startNew}>
              <Plus size={15} /> Add question
            </Button>
          </div>
        )}
      </div>

      <div className="qb-list">
        <div className="qb-row qb-headrow">
          <span>ID</span>
          <span>Question</span>
          <span>Capability</span>
          <span>Level</span>
          <span>Format</span>
          <span />
        </div>
        {list.map((q) => (
          <div
            key={q.id}
            className={"qb-row" + (q.enabled ? "" : " retired") + (flash === q.id ? " flash" : "")}
            onClick={() => {
              setOpenId(q.id);
              setEditing(null);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setOpenId(q.id)}
          >
            <code>{q.id}</code>
            <span className="qb-text">
              {q.prompt.en.split("\n\n").at(-1)}
              {q.translated === false && <em>EN only</em>}
            </span>
            <span>{SHORT[q.cap]}</span>
            <span>{q.level ?? "General"}</span>
            <span className={"fmt fmt-" + formatOf(q)}>{FORMAT_LABEL[formatOf(q)]}</span>
            <span onClick={(e) => e.stopPropagation()}>
              {canEdit && (
                <button
                  className={"switch" + (q.enabled ? " on" : "")}
                  role="switch"
                  aria-checked={q.enabled}
                  aria-label={(q.enabled ? "Retire " : "Activate ") + q.id}
                  title={q.enabled ? "Active · click to retire" : "Retired · click to activate"}
                  onClick={() => toggleRetire(q)}
                >
                  <i />
                </button>
              )}
            </span>
          </div>
        ))}
        {!list.length && <p className="qb-empty">No questions match these filters.</p>}
      </div>
      <div className="qb-foot">
        <span>
          {list.length} shown · {bank.filter((q) => q.enabled).length} active
        </span>
        {retiredCount > 0 && (
          <label className="consent">
            <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} /> Show {retiredCount} retired
          </label>
        )}
      </div>

      <Sheet
        open={!!current || !!editing}
        onOpenChange={(v) => {
          if (!v) {
            setOpenId(null);
            setEditing(null);
            setIsNew(false);
          }
        }}
      >
        <SheetContent className="qb-sheet">
          {editing ? (
            <Editor
              q={editing}
              isNew={isNew}
              onChange={setEditing}
              problem={problemOf(editing)}
              onCancel={() => {
                setEditing(null);
                if (isNew) setIsNew(false);
              }}
              onSave={requestSave}
            />
          ) : current ? (
            <Viewer
              q={current}
              canEdit={canEdit}
              onEdit={() => setEditing(structuredClone(current))}
              onRetire={() => toggleRetire(current)}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm?.title}</DialogTitle>
            <DialogDescription>{confirm?.body}</DialogDescription>
          </DialogHeader>
          {confirm?.lines && (
            <ul className="confirm-list">
              {confirm.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          )}
          <div className="confirm-actions">
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button
              variant={confirm?.danger ? "destructive" : "default"}
              onClick={() => {
                const run = confirm!.run;
                setConfirm(null);
                run();
              }}
            >
              {confirm?.cta}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        bank={bank}
        onConfirm={async (added: Question[]) => {
          if (await commit([...bank, ...added], `${added.length} questions imported`)) setImportOpen(false);
        }}
      />
    </div>
  );
}

function Coverage({ bank }: { bank: Question[] }) {
  return (
    <div className="qb-coverage">
      {LEVELS.map((level) => {
        const bp = BLUEPRINTS[level];
        const want = bp.perCap.reduce((a, b) => a + b, 0);
        const have = bp.perCap.reduce(
          (n, w, cap) => n + Math.min(w, bank.filter((q) => q.enabled && q.cap === cap && q.level === level && q.format !== "open").length),
          0,
        );
        const pct = Math.round((have / want) * 100);
        return (
          <div key={level} className="cov">
            <div>
              <strong>{level}</strong>
              <span>{have}/{want} questions{bp.open ? ` · ${bank.filter((q) => q.enabled && q.level === level && q.format === "open").length}/${bp.open} open-ended` : ""}</span>
            </div>
            <div className="cov-track"><i style={{ width: pct + "%" }} /></div>
          </div>
        );
      })}
    </div>
  );
}

function Viewer({ q, canEdit, onEdit, onRetire }: { q: Question; canEdit: boolean; onEdit: () => void; onRetire: () => void }) {
  const [lang, setLang] = useState<Lang>("en");
  const f = formatOf(q);
  return (
    <div className="qb-panel">
      <SheetHeader>
        <SheetTitle>
          <code>{q.id}</code> {!q.enabled && <span className="stage stage-muted">Retired</span>}
        </SheetTitle>
        <SheetDescription>
          {CAPS[q.cap]} · {q.level ?? "General"} · {FORMAT_LABEL[f]}
        </SheetDescription>
      </SheetHeader>
      <LangTabs lang={lang} setLang={setLang} q={q} />
      <p className="qb-prompt">{q.prompt[lang] || <em className="muted">Not written yet</em>}</p>
      {f === "open" ? (
        <div className="qb-rubric">
          <strong>Marking guide</strong>
          <p>{q.rubric}</p>
        </div>
      ) : (
        <ol className="qb-options">
          {q.options[lang].map((o, i) => (
            <li key={i} className={q.points[i] === 100 ? "best" : q.points[i] < 0 ? "neg" : ""}>
              <span>{o}</span>
              <b>{f === "single" ? (q.points[i] === 100 ? "Correct" : "") : WEIGHTS.find((w) => w[0] === q.points[i])?.[2] ?? q.points[i] / 100}</b>
            </li>
          ))}
        </ol>
      )}
      {q.source && <p className="muted small">Based on: {q.source}</p>}
      {canEdit && (
        <div className="qb-panel-actions">
          <Button onClick={onEdit}><Pencil size={14} /> Edit</Button>
          <Button variant="outline" onClick={onRetire}>
            {q.enabled ? <><Archive size={14} /> Retire</> : <><ArchiveRestore size={14} /> Make active</>}
          </Button>
        </div>
      )}
    </div>
  );
}

function LangTabs({ lang, setLang, q }: { lang: Lang; setLang: (l: Lang) => void; q: Question }) {
  return (
    <div className="seg small" role="tablist">
      {(Object.keys(LANGS) as Lang[]).map((l) => {
        const missing = l !== "en" && (q.translated === false || !q.prompt[l]?.trim() || q.prompt[l] === q.prompt.en);
        return (
          <button key={l} role="tab" aria-selected={lang === l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>
            {l === "en" ? "EN" : l === "ms" ? "BM" : "中文"}
            {missing && <i className="dot-missing" title="Translation pending" />}
          </button>
        );
      })}
    </div>
  );
}

function Editor({ q, isNew, onChange, problem, onCancel, onSave }: any) {
  const [lang, setLang] = useState<Lang>("en");
  const f = formatOf(q);
  const set = (patch: Partial<Question>) => onChange({ ...q, ...patch });
  const setOption = (i: number, text: string) =>
    set({ options: { ...q.options, [lang]: q.options[lang].map((o: string, j: number) => (i === j ? text : o)) } });
  const resize = (n: number) => {
    const fit = (arr: string[]) => (n > arr.length ? [...arr, ...Array(n - arr.length).fill("")] : arr.slice(0, n));
    set({
      options: { en: fit(q.options.en), ms: fit(q.options.ms), zh: fit(q.options.zh) },
      points: n > q.points.length ? [...q.points, ...Array(n - q.points.length).fill(0)] : q.points.slice(0, n),
    });
  };
  const setFormat = (format: string) => {
    if (format === "open") set({ format: "open", options: { en: [], ms: [], zh: [] }, points: [] } as any);
    else {
      const n = q.options.en.length || 4;
      const blank = Array(n).fill("");
      set({
        format: format as any,
        options: q.options.en.length ? q.options : { en: blank, ms: [...blank], zh: [...blank] },
        points: format === "single" ? Array.from({ length: n }, (_, i) => (i === 0 ? 100 : 0)) : Array(n).fill(0).map((_, i) => (i === 0 ? 100 : 0)),
      });
    }
  };
  return (
    <div className="qb-panel">
      <SheetHeader>
        <SheetTitle>{isNew ? "New question" : <>Edit <code>{q.id}</code></>}</SheetTitle>
        <SheetDescription>Changes apply to new invitations only.</SheetDescription>
      </SheetHeader>
      <div className="qb-chips">
        <span>Capability</span>
        <div className="chip-row">
          {CAPS.map((c, i) => (
            <button key={c} className={q.cap === i ? "on" : ""} onClick={() => set({ cap: i })} title={c}>{SHORT[i]}</button>
          ))}
        </div>
        <span>Level</span>
        <div className="chip-row">
          {LEVELS.map((l) => (
            <button key={l} className={q.level === l ? "on" : ""} onClick={() => set({ level: l })}>{l}</button>
          ))}
        </div>
        <span>Format</span>
        <div className="chip-row">
          {(["single", "weighted", "open"] as const).map((x) => (
            <button key={x} className={f === x ? "on" : ""} onClick={() => setFormat(x)}>{FORMAT_LABEL[x]}</button>
          ))}
        </div>
      </div>
      <LangTabs lang={lang} setLang={setLang} q={q} />
      <textarea
        className="qb-input"
        rows={4}
        value={q.prompt[lang]}
        placeholder={lang === "en" ? "Scenario and question" : "Translation (optional for now)"}
        onChange={(e) => set({ prompt: { ...q.prompt, [lang]: e.target.value }, ...(lang !== "en" && e.target.value.trim() ? { translated: true } : {}) })}
      />
      {f === "open" ? (
        <textarea
          className="qb-input"
          rows={4}
          value={q.rubric ?? ""}
          placeholder="What a strong answer must include (Full / Partial / No credit)"
          onChange={(e) => set({ rubric: e.target.value, explanation: "Rubric: " + e.target.value })}
        />
      ) : (
        <div className="qb-edit-options">
          {q.options[lang].map((o: string, i: number) => (
            <div key={i} className="qb-opt">
              <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
              <input value={o} placeholder={`Option ${String.fromCharCode(65 + i)}`} onChange={(e) => setOption(i, e.target.value)} />
              {f === "single" ? (
                <button
                  className={"correct" + (q.points[i] === 100 ? " on" : "")}
                  onClick={() => set({ points: q.points.map((_: number, j: number) => (j === i ? 100 : 0)) })}
                  title="Mark as correct"
                >
                  {q.points[i] === 100 ? "Correct" : "Set correct"}
                </button>
              ) : (
                <select
                  className={"weight w" + q.points[i]}
                  value={q.points[i]}
                  aria-label={`Score for option ${String.fromCharCode(65 + i)}`}
                  onChange={(e) => set({ points: q.points.map((p: number, j: number) => (j === i ? Number(e.target.value) : p)) })}
                >
                  {WEIGHTS.map(([v, label, s]) => (
                    <option key={v} value={v}>{s} {label}</option>
                  ))}
                </select>
              )}
              {q.options.en.length > 2 && lang === "en" && (
                <button className="icon" aria-label="Remove option" onClick={() => {
                  const keep = (arr: any[]) => arr.filter((_: any, j: number) => j !== i);
                  set({ options: { en: keep(q.options.en), ms: keep(q.options.ms), zh: keep(q.options.zh) }, points: keep(q.points) });
                }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          {q.options.en.length < 4 && lang === "en" && (
            <button className="text-link" onClick={() => resize(q.options.en.length + 1)}>
              <Plus size={13} /> Add option
            </button>
          )}
        </div>
      )}
      <div className="qb-panel-actions sticky">
        {problem ? <small className="warn-text">{problem}</small> : <small className="muted">Ready to save</small>}
        <div>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button disabled={!!problem} onClick={onSave}>{isNew ? "Add question" : "Save changes"}</Button>
        </div>
      </div>
    </div>
  );
}

function ImportDialog({ open, onOpenChange, bank, onConfirm }: any) {
  const [file, setFile] = useState("");
  const [result, setResult] = useState<{ questions: Question[]; skipped: string[] } | null>(null);
  const [error, setError] = useState("");
  async function read(f: File) {
    setError("");
    try {
      const { default: readXlsxFile } = await import("read-excel-file");
      let rows: any[][];
      try {
        rows = await readXlsxFile(f, { sheet: "4. Your Questions" });
      } catch {
        rows = await readXlsxFile(f);
      }
      setFile(f.name);
      setResult(questionsFromRows(rows, bank));
    } catch (e: any) {
      setError(e.message);
    }
  }
  const byLevel = (l: string) => result?.questions.filter((q) => q.level === l).length ?? 0;
  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setResult(null); setFile(""); setError(""); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import questions from Excel</DialogTitle>
          <DialogDescription>Use the template below or the client’s Question Bank form (tab “4. Your Questions”).</DialogDescription>
        </DialogHeader>
        {!result ? (
          <>
          <label className="drop">
            <FileUp size={22} />
            <strong>Choose an .xlsx file</strong>
            <span>Nothing is added until you confirm.</span>
            <input type="file" accept=".xlsx" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) read(f); e.target.value = ""; }} />
          </label>
          <a className="template-link" href={import.meta.env.BASE_URL + "question-bank-template.xlsx"} download>
            <Download size={14} /> Download the template (.xlsx)
            <small>Same columns as the client form, with examples and dropdowns</small>
          </a>
          </>
        ) : (
          <>
            <p className="muted small">{file}</p>
            <div className="import-sum">
              {LEVELS.map((l) => (
                <div key={l}><strong>{byLevel(l)}</strong><span>{l}</span></div>
              ))}
              <div><strong>{result.questions.filter((q) => q.format === "open").length}</strong><span>open-ended</span></div>
            </div>
            {result.skipped.length > 0 && (
              <details className="import-skip">
                <summary>{result.skipped.length} rows skipped</summary>
                <ul>{result.skipped.map((s) => <li key={s}>{s}</li>)}</ul>
              </details>
            )}
            <div className="confirm-actions">
              <Button variant="outline" onClick={() => setResult(null)}>Choose another file</Button>
              <Button disabled={!result.questions.length} onClick={() => onConfirm(result.questions)}>
                Add {result.questions.length} question{result.questions.length === 1 ? "" : "s"}
              </Button>
            </div>
          </>
        )}
        {error && <p className="error">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
