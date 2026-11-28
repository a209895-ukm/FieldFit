import { JOB_ROLES } from "./client-config.ts";

export type Row = {
  name: string;
  email: string;
  role: string;
  language: string;
  manager: string;
  error?: string;
  link?: string;
};
const LANG: Record<string, string> = {
  en: "en", english: "en", bi: "en",
  ms: "ms", bm: "ms", malay: "ms", "bahasa malaysia": "ms", melayu: "ms",
  zh: "zh", mandarin: "zh", chinese: "zh", "中文": "zh",
};
function roleId(text: string) {
  const t = text.trim().toLowerCase();
  if (!t) return "";
  // Exact short code first (DSR, ME, SE, RTS, ASM, SM), then the code in brackets, then the title.
  const exact = JOB_ROLES.find(
    (r) =>
      r.id === t ||
      r.title.toLowerCase() === t ||
      r.title.toLowerCase().includes("(" + t + ")") ||
      (t === "rts" && r.id === "rts"),
  );
  if (exact) return exact.id;
  return (
    (t.length > 3
      ? JOB_ROLES.find((r) => r.title.toLowerCase().startsWith(t))?.id
      : undefined) ?? "?"
  );
}
/** Reads CSV, TSV or plain text: one candidate per line, columns name, email, job role, language, hiring manager email. */
export function parseCandidates(text: string, defaults: { role: string; language: string; manager: string }, managers: string[]) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const split = (line: string) => {
    const sep = line.includes("\t") ? "\t" : line.includes(";") && !line.includes(",") ? ";" : ",";
    const cells: string[] = [];
    let cell = "", quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === sep) { cells.push(cell.trim()); cell = ""; }
      else cell += ch;
    }
    cells.push(cell.trim());
    // Plain text such as "aina@example.com Aina Rahman": split on spaces around the email.
    if (cells.length === 1 && /\S+@\S+/.test(cells[0])) {
      const email = cells[0].match(/\S+@\S+\.\S+/)?.[0] ?? "";
      return [cells[0].replace(email, "").trim(), email];
    }
    return cells;
  };
  let rows = lines.map(split);
  let idx = { name: 0, email: 1, role: 2, language: 3, manager: 4 };
  const head = rows[0].map((c) => c.toLowerCase());
  if (head.some((c) => c.includes("email"))) {
    const find = (...keys: string[]) => head.findIndex((h) => keys.some((k) => h.includes(k)));
    idx = {
      name: find("name"),
      email: find("email"),
      role: find("role", "position", "job"),
      language: find("lang"),
      manager: find("manager"),
    };
    rows = rows.slice(1);
  }
  return rows.map((r): Row => {
    // A line with just an email, or "email name", is accepted too.
    let name = idx.name >= 0 ? r[idx.name] ?? "" : "";
    let email = idx.email >= 0 ? r[idx.email] ?? "" : "";
    if (email && !/@/.test(email) && r.some((c) => /^\S+@\S+\.\S+$/.test(c))) {
      const found = r.find((c) => /^\S+@\S+\.\S+$/.test(c)) ?? "";
      email = found;
      name = r.filter((c) => c !== found).join(" ");
    }
    const role = roleId(idx.role >= 0 ? r[idx.role] ?? "" : "") || defaults.role;
    const language = LANG[(idx.language >= 0 ? r[idx.language] ?? "" : "").toLowerCase()] ?? defaults.language;
    const manager = (idx.manager >= 0 ? r[idx.manager] ?? "" : "").toLowerCase() || defaults.manager;
    const error = !name || name.length < 2
      ? "Name missing"
      : !/^\S+@\S+\.\S+$/.test(email)
        ? "Invalid email"
        : role === "?"
          ? "Unknown job role"
          : manager && !managers.includes(manager)
            ? "Unknown hiring manager"
            : undefined;
    return { name, email, role, language, manager, error };
  });
}

