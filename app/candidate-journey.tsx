import { advanceGuide, useGuide } from "./demo-guide-state";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  ShieldCheck,
  CircleHelp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageUrl, STATIC_DEMO } from "@/lib/navigation";
import { approvalOutcome, googleCalendarUrl } from "@/lib/approval";
import {
  CANDIDATE_STEPS,
  bookInterview,
  slotAvailable,
  type JourneyCandidate,
} from "@/lib/journey";
import { useDemoCandidates, useJourney, previewResult } from "./journey-state";
import { JourneySteps } from "./journey-steps";
import { api } from "./panels";
import { toast } from "sonner";
export function CandidateOutcome({
  candidate: c,
  sample = false,
}: {
  candidate: JourneyCandidate;
  sample?: boolean;
}) {
  const guide = useGuide();
  const candidates = useDemoCandidates();
  const [state, update] = useJourney(sample, sample ? undefined : candidates);
  const [chosen, setChosen] = useState("");
  const invite = state.invites[c.id],
    review = state.reviews[c.id],
    decision = state.decisions[c.id];
  const [booking, setBooking] = useState(guide?.step === "slots");
  const stage = invite?.booked ? 5 : invite && booking ? 4 : 3;
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stage]);
  const booked = invite?.booked;
  const activeSlots =
    invite?.slots.filter((s) => slotAvailable(state, c.id, s)) ?? [];
  const mutate = (action: Parameters<typeof update>[0]) => {
    try {
      update(action);
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    }
  };
  return (
    <div className="candidate-outcome">
      <JourneySteps
        steps={CANDIDATE_STEPS}
        active={stage}
        complete={Array.from({ length: stage }, (_, i) => i)}
      />
      <div className="journey-person">
        <span className="journey-avatar">
          {c.name
            .split(" ")
            .map((v) => v[0])
            .slice(0, 2)
            .join("")}
        </span>
        <div>
          <strong>{c.name}</strong>
          <span>Sales representative · FieldFit</span>
        </div>
        {c.journeyPreview && (
          <span className="journey-tag">Walkthrough result</span>
        )}
      </div>
      {decision ? (
        <section className="journey-result">
          <CheckCircle2 />
          <span className="eyebrow">YOUR APPLICATION UPDATE</span>
          <h1>
            {decision.decision === "Hire"
              ? "Your next chapter is taking shape."
              : decision.decision === "Hold"
                ? "Your application is still under consideration."
                : "Thank you for your time."}
          </h1>
          <p>
            {decision.decision === "Hire"
              ? "The hiring team would like to move forward and will discuss the next steps with you."
              : decision.decision === "Hold"
                ? "HR is taking a little more time to review the interview. You will receive an update here."
                : "The team has decided not to progress your application for this role."}
          </p>
          <a href={pageUrl("/employee")}>
            Return to your candidate home <ArrowRight size={16} />
          </a>
        </section>
      ) : !invite ? (
        <section className="journey-result">
          {review?.action === "decline" ? <Mail /> : <Clock3 />}
          <span className="eyebrow">ASSESSMENT SUBMITTED</span>
          <h1>
            {review?.action === "decline"
              ? "An update from the hiring team."
              : "Your next step is with HR."}
          </h1>
          <p>
            {review?.action === "decline"
              ? "Thank you for completing the assessment. HR has decided not to progress this application to the interview stage."
              : review?.action === "hold"
                ? "Your application is on hold while HR reviews it. There is nothing else you need to submit right now."
                : approvalOutcome(c, state.rules).route === "review"
                  ? "Your assessment is receiving an individual review. The hiring team will consider your strengths and areas to explore before confirming the next step."
                  : "Your assessment is complete. HR will review your profile and confirm your interview invitation."}
          </p>
          <div className="journey-info">
            <ShieldCheck size={19} />
            <span>
              Every completed assessment receives a clear next step. Your status
              updates here when HR reviews your application.
            </span>
          </div>
          <a href={pageUrl("/employee")}>
            Back to candidate home <ArrowRight size={16} />
          </a>
        </section>
      ) : !booked && !booking ? (
        <section className="journey-result journey-success">
          <CheckCircle2 />
          <span className="eyebrow">SECOND INTERVIEW INVITATION</span>
          <h1>You’re through to the next conversation.</h1>
          <p>
            {invite.source === "Automatic"
              ? "Your assessment meets the progression criteria. Choose a time to meet the hiring team."
              : "The hiring team has reviewed your profile and would like to invite you to a second interview."}
          </p>
          <div className="journey-facts">
            <span>
              <Clock3 size={18} />
              {invite.duration} minutes
            </span>
            <span>
              <CalendarDays size={18} />
              {invite.location}
            </span>
          </div>
          <Button
            data-guide="progression"
            className="primary-button"
            onClick={() => {
              setBooking(true);
              advanceGuide("progression");
            }}
          >
            Choose my interview time <ArrowRight size={17} />
          </Button>
        </section>
      ) : !booked ? (
        <section data-guide="slots" className="journey-booking">
          <div>
            <span className="eyebrow">STEP 05 · BOOK INTERVIEW</span>
            <h1>A time that works for you.</h1>
            <p>Choose one of the interview slots offered by HR.</p>
            <div className="journey-facts">
              <span>{invite.duration} minutes</span>
              <span>{invite.location}</span>
            </div>
            <p className="journey-muted">
              All times in {Intl.DateTimeFormat().resolvedOptions().timeZone}.
            </p>
          </div>
          <div className="journey-slot-grid">
            {activeSlots.map((slot) => (
              <button
                key={slot}
                aria-pressed={chosen === slot}
                className={chosen === slot ? "selected" : ""}
                onClick={() => setChosen(slot)}
              >
                <strong>
                  {new Date(slot).toLocaleDateString([], {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </strong>
                <span>
                  {new Date(slot).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {chosen === slot && <CheckCircle2 size={18} />}
              </button>
            ))}
          </div>
          {!activeSlots.length && (
            <div className="journey-info">
              <Clock3 />
              <span>
                No interview slots are available right now. HR needs to offer
                another time.
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  mutate((s) => ({
                    ...s,
                    invites: {
                      ...s.invites,
                      [c.id]: {
                        ...s.invites[c.id],
                        availabilityRequested: new Date().toISOString(),
                      },
                    },
                  }));
                  toast.success(
                    "Your request for more times is visible to HR in the demo.",
                  );
                }}
              >
                Request more times
              </Button>
            </div>
          )}
          <div className="journey-actions">
            <Button variant="outline" onClick={() => setBooking(false)}>
              Back to invitation
            </Button>
            <Button
              disabled={!chosen || !slotAvailable(state, c.id, chosen)}
              onClick={() => {
                if (mutate((s) => bookInterview(s, c.id, chosen)))
                  advanceGuide("slots");
              }}
            >
              Confirm interview time <ArrowRight size={16} />
            </Button>
          </div>
        </section>
      ) : (
        <section className="journey-result journey-success">
          <CheckCircle2 />
          <span className="eyebrow">STEP 06 · ATTEND INTERVIEW</span>
          <h1>
            {invite.attendedAt
              ? "Thank you for meeting with us."
              : "Your interview is booked."}
          </h1>
          <p>
            {invite.attendedAt
              ? "Your interview is complete. HR will review the conversation and share the next step here."
              : "You’re all set for your next conversation. Review the details and confirm you’ll attend."}
          </p>
          <div className="journey-ticket">
            <CalendarDays size={30} />
            <div>
              <strong>
                {new Date(booked).toLocaleDateString([], {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </strong>
              <span>
                {new Date(booked).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {invite.duration} minutes ·{" "}
                {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </span>
              <span>{invite.location}</span>
            </div>
            <span className="journey-tag">
              {invite.attendedAt
                ? "Interview completed"
                : invite.confirmedAt
                  ? "Attendance confirmed"
                  : "Booked"}
            </span>
          </div>
          {!invite.attendedAt && (
            <div className="journey-actions">
              <Button
                data-guide="attendance"
                disabled={!!invite.confirmedAt}
                onClick={() => {
                  if (
                    mutate((s) => ({
                      ...s,
                      invites: {
                        ...s.invites,
                        [c.id]: {
                          ...s.invites[c.id],
                          confirmedAt: new Date().toISOString(),
                        },
                      },
                    }))
                  )
                    advanceGuide("attendance");
                }}
              >
                {invite.confirmedAt
                  ? "Attendance confirmed"
                  : "Confirm I’ll attend"}
              </Button>
              <Button asChild variant="outline">
                <a
                  data-guide="calendar"
                  href={googleCalendarUrl(c, invite)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Add to Google Calendar
                </a>
              </Button>
            </div>
          )}
          <p className="journey-muted">
            Calendar opens a draft to review and save. Attendance confirmation
            is recorded in this demo.
          </p>
          <div className="journey-info">
            <CircleHelp size={19} />
            <span>
              Be ready to discuss a customer situation, your approach to
              problem-solving, and examples from your experience.
            </span>
          </div>
        </section>
      )}
    </div>
  );
}
export function CandidateNextStep({ token }: { token: string }) {
  const candidates = useDemoCandidates();
  const c = candidates.find((c) => c.accessToken === token);
  return c ? (
    <CandidateOutcome candidate={c} />
  ) : (
    <div className="journey-result">
      <CheckCircle2 />
      <h1>Assessment complete.</h1>
      <p>
        The hiring team will review your assessment and contact you about the
        next step.
      </p>
    </div>
  );
}
export function WalkthroughResults({
  token,
  onComplete,
}: {
  token: string;
  onComplete: () => void;
}) {
  if (!STATIC_DEMO || token === "demo") return null;
  return (
    <details data-guide="demo-result" className="journey-demo-tools">
      <summary>Demo controls · preview an assessment outcome</summary>
      <p>
        Skip to a labelled sample result to walk through the next steps. This
        does not score your answers.
      </p>
      <div className="journey-actions">
        {(
          [
            ["pass", "Strong profile"],
            ["exception", "Uneven scores"],
            ["below", "Below benchmark"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            variant="outline"
            onClick={() => {
              try {
                previewResult(token, id);
                onComplete();
                if (id === "pass") advanceGuide("result");
              } catch (e: any) {
                toast.error(e.message);
              }
            }}
          >
            {label}
          </Button>
        ))}
      </div>
    </details>
  );
}
export function CandidateInbox() {
  const candidates = useDemoCandidates().filter((c) => c.kind !== "employee");
  const [name, setName] = useState("Alex Morgan"),
    [email, setEmail] = useState("alex@example.test"),
    [busy, setBusy] = useState(false);
  if (!STATIC_DEMO) return null;
  return (
    <>
      <section className="journey-start panel">
        <div>
          <span className="eyebrow">WALK THROUGH THE FULL JOURNEY</span>
          <h2>From invitation to interview.</h2>
          <p>
            Create a fictional application, take the assessment and follow its
            progress. You can switch to HR at any stage.
          </p>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const r = await api("candidates", {
                name,
                email,
                language: "en",
                kind: "candidate",
              });
              window.location.assign(pageUrl(r.path));
            } catch (e: any) {
              toast.error(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Candidate name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Email for this demo
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <Button disabled={busy} type="submit">
            {busy ? "Creating invitation…" : "Create my demo invitation"}
            <ArrowRight size={16} />
          </Button>
        </form>
      </section>
      {candidates.length > 0 && (
        <section className="journey-inbox">
          <h2>Your invitations & applications</h2>
          <p>Continue an assessment or see your latest interview update.</p>
          {candidates.map((c) => (
            <a
              key={c.id}
              className="journey-inbox-card"
              href={pageUrl("/assess/" + c.accessToken)}
            >
              <span className="journey-avatar">
                <Mail size={21} />
              </span>
              <div>
                <strong>{c.name}</strong>
                <span>
                  Sales representative ·{" "}
                  {c.status === "Completed"
                    ? "Assessment submitted"
                    : c.status === "In progress"
                      ? "Assessment in progress"
                      : "Invitation received"}
                </span>
              </div>
              <span>
                {c.status === "Completed"
                  ? "View next step"
                  : "Open invitation"}
              </span>
              <ArrowRight size={18} />
            </a>
          ))}
        </section>
      )}
    </>
  );
}
