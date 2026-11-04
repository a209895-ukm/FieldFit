import { Check } from "lucide-react";
export function JourneySteps({
  steps,
  active,
  onStep,
  complete = [],
}: {
  steps: string[];
  active: number;
  onStep?: (step: number) => void;
  complete?: number[];
}) {
  return (
    <nav aria-label="Journey progress" className="journey-steps">
      {steps.map((label, i) => {
        const done = complete.includes(i);
        const body = (
          <>
            <span className="journey-step-number">
              {done ? <Check size={16} /> : String(i + 1).padStart(2, "0")}
            </span>
            <span>{label}</span>
          </>
        );
        return onStep ? (
          <button
            key={label}
            aria-current={active === i ? "step" : undefined}
            className={`${active === i ? "current" : ""} ${done ? "done" : ""}`}
            onClick={() => onStep(i)}
          >
            {body}
          </button>
        ) : (
          <div
            key={label}
            aria-current={active === i ? "step" : undefined}
            className={`${active === i ? "current" : ""} ${done ? "done" : ""}`}
          >
            {body}
          </div>
        );
      })}
    </nav>
  );
}
