import { useState } from "react";
import { ArrowLeft, LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageUrl, STATIC_DEMO } from "@/lib/navigation";
import { BRAND, STAFF_ROLES } from "@/lib/client-config";
import { DEFAULT_USERS, setSessionEmail, type StaffUser } from "@/lib/session";

const DEMO_KEY = "fieldfit-pages-demo-v1";
/** Accounts saved in this browser (added by the Master Admin) plus the three demo accounts. */
function knownUsers(): StaffUser[] {
  let saved: StaffUser[] = [];
  try {
    const raw = window.localStorage.getItem(DEMO_KEY);
    const users = raw ? JSON.parse(raw).users : null;
    if (Array.isArray(users)) saved = users;
  } catch {
    /* storage unavailable */
  }
  return [
    ...saved,
    ...DEFAULT_USERS.filter((d) => !saved.some((u) => u.email === d.email)),
  ];
}

export function BrandMark() {
  return (
    <a className="brand" href={pageUrl("/")}>
      <span className="brand-mark">ff</span>FieldFit
      <span className="brand-dot">.</span>
      <span className="brand-client">for {BRAND.company}</span>
    </a>
  );
}

export function StaffLogin() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  function signIn(address: string) {
    const user = knownUsers().find(
      (u) => u.email.toLowerCase() === address.trim().toLowerCase(),
    );
    if (!user) {
      setError("No account for this email. Ask your Master Admin to add you.");
      return;
    }
    setSessionEmail(user.email);
    window.location.assign(pageUrl("/employer"));
  }
  return (
    <div className="login-page">
      <header className="login-header">
        <BrandMark />
        <a className="portal-switch" href={pageUrl("/")}>
          <ArrowLeft size={15} /> Back
        </a>
      </header>
      <main className="login-layout">
        <section className="login-card">
          <div className="eyebrow">STAFF SIGN-IN</div>
          <h1>Sign in to your hiring workspace</h1>
          <p className="login-lead">
            Use your company email. Your role decides what you can see.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              signIn(email);
            }}
          >
            <label htmlFor="staff-email">Company email</label>
            <input
              id="staff-email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="name@company.com"
            />
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="login-submit">
              <LogIn size={16} /> Sign in
            </Button>
          </form>
          <p className="login-footnote">
            <ShieldCheck size={14} />
            Candidates don’t sign in. They use the personal link sent by HR.
          </p>
        </section>

        <aside className="login-note" aria-label="Demo accounts">
          <div className="login-note-head">
            <strong>Demo accounts</strong>
            <span>No password needed</span>
          </div>
          <ul>
            {DEFAULT_USERS.map((u) => (
              <li key={u.email}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(u.email);
                    setError("");
                  }}
                  title="Fill in this email"
                >
                  <span className={"role-pill role-" + u.role}>
                    {STAFF_ROLES[u.role].label}
                  </span>
                  <code>{u.email}</code>
                  <small>{STAFF_ROLES[u.role].note}</small>
                </button>
              </li>
            ))}
          </ul>
          <p>
            Click an account to fill it in, then sign in.
            {STATIC_DEMO &&
              " Microsoft 365 sign-in replaces this once the client’s IT team confirms hosting."}
          </p>
        </aside>
      </main>
    </div>
  );
}
