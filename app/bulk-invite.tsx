import { useState } from "react";
import { Copy, Download, FileUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { JOB_ROLES } from "@/lib/client-config";
import { assessmentUrl } from "@/lib/navigation";
import { csvCell } from "@/lib/assessment";
import { api } from "./panels";
import { parseCandidates, type Row } from "@/lib/candidate-import";

export function BulkInvite({ managers, defaults, onDone }: any) {
  const [rows, setRows] = useState<Row[]>([]);
  const [file, setFile] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const managerEmails = managers.map((m: any) => m.email);
  async function read(f: File) {
    const text = await f.text();
    setFile(f.name);
    setDone(false);
    setRows(parseCandidates(text, defaults, managerEmails));
  }
  async function create() {
    setBusy(true);
    const next = [...rows];
    for (const r of next) {
      if (r.error || r.link) continue;
      try {
        const res = await api("candidates", {
          name: r.name,
          email: r.email,
          language: r.language,
          kind: "candidate",
          role: r.role,
          manager: r.manager || null,
        });
        r.link = assessmentUrl(res.path);
      } catch (e: any) {
        r.error = e.message;
      }
    }
    setRows(next);
    setBusy(false);
    setDone(true);
    await onDone();
    toast.success(`${next.filter((r) => r.link).length} invitation links created`);
  }
  function template() {
    const csv =
      "name,email,job role,language,hiring manager email\r\n" +
      "Aina Rahman,aina@example.com,DSR,BM,manager@company.example\r\n" +
      "Marcus Tan,marcus@example.com,SE,Mandarin,\r\n";
    save(new Blob([csv], { type: "text/csv" }), "fieldfit-invite-template.csv");
  }
  function exportLinks() {
    const csv = [["Name", "Email", "Job role", "Assessment link"], ...rows.filter((r) => r.link).map((r) => [r.name, r.email, JOB_ROLES.find((j) => j.id === r.role)?.title ?? "", r.link])]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    save(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), "fieldfit-invitation-links.csv");
  }
  const valid = rows.filter((r) => !r.error && !r.link).length;
  return (
    <div className="bulk">
      {!rows.length ? (
        <>
          <label className="drop">
            <FileUp size={22} />
            <strong>Choose a CSV or TXT file</strong>
            <span>One candidate per line: name, email, job role, language, hiring manager email. Only name and email are required.</span>
            <input type="file" accept=".csv,.txt,.tsv,text/csv,text/plain" hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) read(f); e.target.value = ""; }} />
          </label>
          <button type="button" className="text-link" onClick={template}>
            <Download size={13} /> Download template
          </button>
        </>
      ) : (
        <>
          <div className="bulk-head">
            <span><strong>{file}</strong> · {rows.length} rows · {rows.filter((r) => r.error).length} with problems</span>
            {!done && <button type="button" className="text-link" onClick={() => setRows([])}>Choose another file</button>}
          </div>
          <div className="bulk-table">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Job role</th><th>{done ? "Link" : "Check"}</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={r.error ? "bad" : ""}>
                    <td>{r.name || "—"}</td>
                    <td>{r.email || "—"}</td>
                    <td>{JOB_ROLES.find((j) => j.id === r.role)?.title.split(" (")[0] ?? "—"}</td>
                    <td>{r.error ? r.error : r.link ? (
                      <button type="button" className="text-link" onClick={async () => { await navigator.clipboard.writeText(r.link!); toast.success("Link copied"); }}>
                        <Copy size={12} /> Copy
                      </button>) : "OK"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {done ? (
            <Button onClick={exportLinks}><Download size={15} /> Download links (CSV)</Button>
          ) : (
            <Button disabled={busy || !valid} onClick={create}>
              {busy ? "Creating…" : `Create ${valid} invitation link${valid === 1 ? "" : "s"}`}
            </Button>
          )}
          <p className="muted small">Rows with problems are skipped. Emails are not sent automatically; share each link with the candidate.</p>
        </>
      )}
    </div>
  );
}
function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
