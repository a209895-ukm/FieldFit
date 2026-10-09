import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Users,
  Compass,
  ShieldCheck,
  Globe2,
  Clock3,
  CheckCircle2,
} from "lucide-react";
import { pageUrl, STATIC_DEMO } from "@/lib/navigation";
import { Button } from "@/components/ui/button";

export function Welcome() {
  return (
    <div className="welcome-page">
      <header className="portal-header">
        <a className="brand" href={pageUrl("/")}>
          <span className="brand-mark">ff</span>FieldFit
          <span className="brand-dot">.</span>
        </a>
        <span className="portal-badge">
          <span className="pilot-dot" />
          No login needed
        </span>
      </header>
      <main className="portal-main">
        <div className="portal-intro">
          <div className="eyebrow">A CLEARER PICTURE OF POTENTIAL</div>
          <h1>
            Find your fit.
            <br />
            <span>Build your team.</span>
          </h1>
          <p>
            A fairer start for every candidate. A clearer decision for every
            employer.
            <br />
            Choose how you’d like to explore FieldFit.
          </p>
        </div>
        <div className="role-cards">
          <a className="role-card employee-card" href={pageUrl("/employee")}>
            <span className="role-icon">
              <Compass size={27} />
            </span>
            <span className="eyebrow">FOR CANDIDATES & TEAM MEMBERS</span>
            <h2>Employee</h2>
            <p>
              Show how you think, solve problems and connect with customers.
            </p>
            <ul>
              <li>
                <CheckCircle2 size={16} />
                Try the sales readiness assessment
              </li>
              <li>
                <Globe2 size={16} />
                English, Bahasa Malaysia or 中文
              </li>
              <li>
                <Clock3 size={16} />
                Work through realistic sales situations
              </li>
            </ul>
            <span className="role-cta">
              Enter as Employee <ArrowRight size={18} />
            </span>
          </a>
          <a className="role-card employer-card" href={pageUrl("/employer")}>
            <span className="role-icon">
              <Users size={27} />
            </span>
            <span className="eyebrow">FOR HIRING MANAGERS & HR</span>
            <h2>Employer</h2>
            <p>
              See beyond experience. Find the strengths your field team needs.
            </p>
            <ul>
              <li>
                <CheckCircle2 size={16} />
                Explore candidate profiles and evidence
              </li>
              <li>
                <Users size={16} />
                Compare candidates and invite assessments
              </li>
              <li>
                <ShieldCheck size={16} />
                Make and record informed decisions
              </li>
            </ul>
            <span className="role-cta">
              Enter as Employer <ArrowRight size={18} />
            </span>
          </a>
        </div>
        <div className="portal-footnote">
          <ShieldCheck size={18} />
          <p>One assessment. Six capabilities. Always a human decision.</p>
        </div>
      </main>
      <footer className="portal-footer">
        <span>FieldFit · Every candidate, measured the same way.</span>
        <span>
          {STATIC_DEMO
            ? "Interactive demo · No account required"
            : "Employee & employer workspace"}
        </span>
      </footer>
    </div>
  );
}

export function EmployeePortal() {
  const [invitation, setInvitation] = useState("");
  const [error, setError] = useState("");
  function open(e: React.FormEvent) {
    e.preventDefault();
    const value = invitation.trim();
    const token = /^[a-f0-9]{64}$/.test(value)
      ? value
      : value.match(/(?:#)?\/assess\/([a-f0-9]{64})(?:[/?#]|$)/)?.[1];
    if (!token) {
      setError(
        "Paste a FieldFit assessment link or its 64-character invitation code.",
      );
      return;
    }
    window.location.assign(pageUrl("/assess/" + token));
  }
  return (
    <div className="welcome-page">
      <header className="portal-header">
        <a className="brand" href={pageUrl("/")}>
          <span className="brand-mark">ff</span>FieldFit
          <span className="brand-dot">.</span>
        </a>
        <a className="portal-switch" href={pageUrl("/")}>
          <ArrowLeft size={15} /> Switch role
        </a>
      </header>
      <main className="employee-main">
        <div className="eyebrow">EMPLOYEE PORTAL</div>
        <h1>
          Your potential.
          <br />
          Your next opportunity.
        </h1>
        <p>
          Explore a few real-world sales situations and show how you work.
          Choose English, Bahasa Malaysia or Mandarin when you begin.
        </p>
        <section className="employee-start">
          <span className="role-icon">
            <Compass size={26} />
          </span>
          <h2>Try the assessment</h2>
          <p>
            Get familiar with the questions, timing and customer conversation.
            This practice run does not create a candidate record.
          </p>
          <Button asChild>
            <a href={pageUrl("/assess/demo")}>
              Start practice assessment <ArrowRight size={16} />
            </a>
          </Button>
        </section>
        <section className="employee-invitation">
          <h2>Have an invitation?</h2>
          <p>
            {STATIC_DEMO
              ? "Demo invitations open in the browser where they were created. To explore from any device, use the practice assessment above."
              : "Paste the link from your hiring team to open your assigned assessment."}
          </p>
          <form onSubmit={open}>
            <label htmlFor="invitation">
              Assessment link or invitation code
            </label>
            <div>
              <input
                id="invitation"
                value={invitation}
                onChange={(e) => {
                  setInvitation(e.target.value);
                  setError("");
                }}
                placeholder="Paste your invitation here"
                required
              />
              <Button type="submit" variant="outline">
                Open invitation <ArrowRight size={15} />
              </Button>
            </div>
          </form>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>
        <a className="portal-switch" href={pageUrl("/employer")}>
          Looking for the hiring dashboard? Enter as Employer{" "}
          <ArrowRight size={15} />
        </a>
      </main>
    </div>
  );
}
