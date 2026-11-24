import { useState } from "react";
import { ArrowLeft, ArrowRight, LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageUrl, STATIC_DEMO } from "@/lib/navigation";
import { BRAND, STAFF_ROLES } from "@/lib/client-config";
import { DEFAULT_USERS, setSessionEmail, type StaffUser } from "@/lib/session";

const DEMO_KEY = "fieldfit-pages-demo-v1";
function knownUsers(): StaffUser[] {
  try {
    const raw = window.localStorage.getItem(DEMO_KEY);
    const users = raw ? JSON.parse(raw).users : null;
    return Array.isArray(users) && users.length ? users : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
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
  const users = knownUsers();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  function signIn(address: string) {
    const user = users.find(
      (u) => u.email.toLowerCase() === address.trim().toLowerCase(),
    );
    if (!user) {
      setError(
        "This email has no FieldFit account. Ask your Master Admin to add you.",
      );
      return;
    }
    setSessionEmail(user.email);
    window.location.assign(pageUrl("/employer"));
  }
  return (
    <div className="welcome-page">
      <header className="portal-header">
        <BrandMark />
        <a className="portal-switch" href={pageUrl("/")}>
          <ArrowLeft size={15} /> Back
        </a>
      </header>
      <main className="employee-main login-main">
        <div className="eyebrow">STAFF SIGN-IN</div>
        <h1>Sign in to your hiring workspace.</h1>
        <p>
          Use your company email. What you can see depends on your role: Master
          Admin, HR or Hiring Manager.
        </p>
        <section className="employee-invitation">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              signIn(email);
            }}
          >
            <label htmlFor="staff-email">Company email</label>
            <div>
              <input
                id="staff-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="name@company.com"
              />
              <Button type="submit">
                <LogIn size={15} /> Sign in
              </Button>
            </div>
          </form>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="notice">
            <ShieldCheck size={17} />
            <span>
              {STATIC_DEMO
                ? "Demo sign-in: no password is checked. Microsoft 365 sign-in replaces this once the client's IT team confirms hosting."
                : "Microsoft 365 sign-in replaces this once hosting is confirmed."}
            </span>
          </div>
        </section>
        <section className="login-accounts">
          <h2>Demo accounts</h2>
          <div className="login-grid">
            {users.map((u) => (
              <button key={u.email} onClick={() => signIn(u.email)}>
                <span className={"role-pill role-" + u.role}>
                  {STAFF_ROLES[u.role]?.label ?? u.role}
                </span>
                <strong>{u.name}</strong>
                <small>{u.email}</small>
                <small className="muted">{STAFF_ROLES[u.role]?.note}</small>
                <span className="role-cta">
                  Sign in <ArrowRight size={14} />
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
