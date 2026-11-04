import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Compass,
  ArrowRight,
  X,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { pageUrl } from "@/lib/navigation";
import {
  advanceGuide,
  endGuide,
  GUIDE_STEPS,
  startGuide,
  useGuide,
  type GuideStep,
} from "./demo-guide-state";

const COPY: Record<
  GuideStep,
  { title: string; text: string; hint?: string; target?: string; next?: string }
> = {
  rules: {
    title: "Start with HR’s rules",
    text: "Two connected journeys, one short demo. Explain manual approval versus automatic progression. Use 75 for the benchmark, 40 for the minimum section score and 40 for the maximum gap. Exceptions still go to HR.",
    target: "rules",
    next: "Show availability",
  },
  availability: {
    title: "Offer interview times",
    text: "HR provides available times before inviting candidates. Load six sample slots for this walkthrough.",
    hint: "Click Use demo availability.",
    target: "availability",
  },
  automatic: {
    title: "Let clear passes progress",
    text: "Candidates who meet all the criteria can move straight to interview scheduling. Uneven scores still need an individual review.",
    hint: "Select Automatic progression.",
    target: "automatic",
  },
  invite: {
    title: "Invite your candidate",
    text: "Each candidate receives a personal assessment link. HR can track their progress from invitation to completion.",
    hint: "Click Invite candidate.",
    target: "invite",
  },
  form: {
    title: "Meet Alex Morgan",
    text: "Use Alex Morgan and alex@example.test, then create the invitation. These fictional details stay in this browser; no email is sent.",
    hint: "Click Create invitation link.",
    target: "invite-form",
  },
  open: {
    title: "Switch to the candidate",
    text: "Open Alex’s personal link to follow the candidate journey. The guide continues in this tab.",
    hint: "Click Open assessment.",
    target: "open-assessment",
  },
  accept: {
    title: "A clear starting point",
    text: "The candidate sees the invitation and six steps: open, prepare, assess, receive the next step, book and attend.",
    hint: "Click Accept invitation & get ready.",
    target: "accept",
  },
  prepare: {
    title: "Get ready for the assessment",
    text: "Choose English, Bahasa Malaysia or Mandarin, review what to expect and give consent before starting.",
    hint: "Select consent, then start the assessment.",
    target: "prepare",
  },
  question: {
    title: "Show one practical question",
    text: "The assessment explores six capabilities through realistic sales situations. A separate customer communication task gives HR more evidence to discuss.",
    target: "question",
    next: "Use a sample result",
  },
  result: {
    title: "Keep the demo moving",
    text: "Expand Demo controls and choose Strong profile. This is a clearly labelled sample result, so you can demonstrate the next steps without completing every question.",
    hint: "Expand Demo controls → Strong profile.",
    target: "demo-result",
  },
  progression: {
    title: "Straight to the second interview",
    text: "Alex meets the benchmark without an exception. Automatic progression makes the interview invitation available immediately.",
    hint: "Click Choose my interview time.",
    target: "progression",
  },
  slots: {
    title: "Choose a time together",
    text: "Select one of HR’s offered slots and confirm. Once booked, the time is unavailable to another candidate in this demo.",
    hint: "Select a time, then Confirm interview time.",
    target: "slots",
  },
  attendance: {
    title: "Confirm attendance",
    text: "The candidate reviews the interview details and confirms they’ll attend. HR can see the booking and confirmation.",
    hint: "Click Confirm I’ll attend.",
    target: "attendance",
  },
  calendar: {
    title: "Show the calendar handoff",
    text: "Add to Google Calendar opens a prepared event for review and saving. Account connection is only a preview in this prototype; emails are not sent automatically.",
    hint: "You can open the draft, or finish the walkthrough here.",
    target: "calendar",
    next: "Finish walkthrough",
  },
  done: {
    title: "That’s the main journey",
    text: "From HR’s setup to a candidate booking an interview. Mention bulk invitations, exception review and final decisions, then let the client explore those at their own pace.",
    next: "Explore the demo",
  },
};

export function DemoGuide({ path }: { path: string }) {
  const guide = useGuide();
  const [collapsed, setCollapsed] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  }>({ bottom: 20, right: 20 });
  const card = useRef<HTMLDivElement>(null);
  const step = guide?.step;
  const copy = step ? COPY[step] : null;
  const candidateStep =
    step && GUIDE_STEPS.indexOf(step) >= GUIDE_STEPS.indexOf("accept");
  const expectedPath = candidateStep ? guide?.path : "/employer";
  const wrongPage = !!guide && !!expectedPath && path !== expectedPath;

  useEffect(() => {
    if (!step) return;
    setCollapsed(false);
    document.body.classList.add("demo-guide-running");
    let active: HTMLElement | null = null;
    let frame = 0;
    const find = () => {
      const dialogHost =
        document.querySelector<HTMLElement>("[data-guide-host]");
      setHost(dialogHost);
      const el = wrongPage
        ? null
        : document.querySelector<HTMLElement>(
            `[data-guide="${COPY[step].target}"]`,
          );
      if (el !== active) {
        active?.classList.remove("demo-guide-highlight");
        active = el;
        active?.classList.add("demo-guide-highlight");
        setTarget(el);
        if (el) el.scrollIntoView({ block: "center", behavior: "instant" });
      }
      if (!el || dialogHost) return;
      const r = el.getBoundingClientRect();
      const width = Math.min(360, window.innerWidth - 32);
      const height = card.current?.offsetHeight || 300;
      const gap = 20;
      if (
        window.innerWidth >= 850 &&
        r.right + width + gap < window.innerWidth
      ) {
        setPosition({
          left: r.right + gap,
          top: Math.max(16, Math.min(r.top, window.innerHeight - height - 16)),
        });
      } else if (window.innerWidth >= 850 && r.left > width + gap) {
        setPosition({
          left: r.left - width - gap,
          top: Math.max(16, Math.min(r.top, window.innerHeight - height - 16)),
        });
      } else {
        setPosition(
          r.top > height + 32
            ? { top: 16, right: 16 }
            : { bottom: 16, right: 16 },
        );
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(find);
    };
    const observer = new MutationObserver((records) => {
      if (
        records.some(
          (r) =>
            !(
              r.target instanceof Element &&
              r.target.closest(".demo-guide-card")
            ),
        )
      )
        schedule();
    });
    // Include Radix portals so the tour follows a successful invitation submission.
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        endGuide();
      }
    };
    window.addEventListener("keydown", escape, true);
    schedule();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      active?.classList.remove("demo-guide-highlight");
      document.body.classList.remove("demo-guide-running");
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("keydown", escape, true);
    };
  }, [step, path, wrongPage]);

  function begin() {
    startGuide();
    window.location.assign(pageUrl("/employer"));
  }
  if (!guide || !copy)
    return (
      <button className="demo-guide-launch" onClick={begin}>
        <Compass size={18} /> Start guide <span>4–5 min</span>
      </button>
    );
  const index = GUIDE_STEPS.indexOf(guide.step);
  const missing = !target && !!copy.target && !wrongPage;
  return createPortal(
    <aside
      ref={card}
      className={`demo-guide-card ${host ? "demo-guide-inline" : ""}`}
      style={host ? undefined : position}
      aria-label="Client demo guide"
    >
      <div className="demo-guide-top">
        <span>
          <Compass size={16} /> CLIENT DEMO · {index < 6 ? "HR" : "CANDIDATE"}
        </span>
        <div className="demo-guide-window-controls">
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand guide" : "Minimize guide"}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <button onClick={endGuide} aria-label="Exit guide">
            <X size={18} />
          </button>
        </div>
      </div>
      <div
        className="demo-guide-progress"
        role="progressbar"
        aria-label="Guide progress"
        aria-valuemin={1}
        aria-valuemax={GUIDE_STEPS.length}
        aria-valuenow={index + 1}
      >
        <span
          style={{ width: `${((index + 1) / GUIDE_STEPS.length) * 100}%` }}
        />
      </div>
      <div aria-live="polite" aria-atomic="true" hidden={collapsed}>
        <h2>
          {guide.step === "done" && <CheckCircle2 size={21} />}
          {copy.title}
        </h2>
        <p>{copy.text}</p>
        {copy.hint && !wrongPage && (
          <div className="demo-guide-hint">{copy.hint}</div>
        )}
        {wrongPage && (
          <p className="demo-guide-hint">
            Return to the walkthrough to continue this step.
          </p>
        )}
        {missing && (
          <p className="demo-guide-missing">
            Open the relevant screen to continue. If you’ve changed the flow,
            restart the guide below.
          </p>
        )}
      </div>
      <div className="demo-guide-footer" hidden={collapsed}>
        <span>
          {index + 1} / {GUIDE_STEPS.length}
        </span>
        <div>
          <button
            className="demo-guide-restart"
            aria-label="Restart guide"
            onClick={begin}
          >
            <RotateCcw size={15} />
          </button>
          {wrongPage ? (
            <button
              className="demo-guide-next"
              onClick={() => window.location.assign(pageUrl(expectedPath!))}
            >
              Return to step <ArrowRight size={15} />
            </button>
          ) : copy.next ? (
            <button
              className="demo-guide-next"
              disabled={missing}
              onClick={() =>
                guide.step === "done" ? endGuide() : advanceGuide(guide.step)
              }
            >
              {copy.next}
              <ArrowRight size={15} />
            </button>
          ) : (
            <span className="demo-guide-wait">Follow the highlighted step</span>
          )}
        </div>
      </div>
    </aside>,
    host || document.body,
  );
}
