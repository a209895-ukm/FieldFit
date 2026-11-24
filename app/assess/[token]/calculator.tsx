import { useState } from "react";

/** Basic calculator for numerical items (the client allows one: reps use phone calculators in the field). */
export function Calculator() {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState<string>("");
  function evaluate(text: string) {
    // Only digits, operators, brackets and decimal points are evaluated.
    if (!/^[\d+\-*/().\s%]*$/.test(text) || !text.trim()) return "";
    try {
      const value = Function(`"use strict"; return (${text.replace(/%/g, "/100")})`)();
      return Number.isFinite(value)
        ? String(Math.round(value * 1e6) / 1e6)
        : "";
    } catch {
      return "";
    }
  }
  const keys = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "(", ")", "C", "%", "=", "+"];
  return (
    <div className="calculator" role="group" aria-label="Calculator">
      <input
        aria-label="Calculation"
        value={expr}
        onChange={(e) => {
          setExpr(e.target.value);
          setResult(evaluate(e.target.value));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const r = evaluate(expr);
            if (r) setExpr(r);
          }
        }}
        inputMode="decimal"
      />
      <output>{result ? "= " + result : " "}</output>
      <div className="calc-keys">
        {keys.map((k) => (
          <button
            type="button"
            key={k}
            onClick={() => {
              if (k === "C") {
                setExpr("");
                setResult("");
              } else if (k === "=") {
                const r = evaluate(expr);
                if (r) {
                  setExpr(r);
                  setResult(r);
                }
              } else {
                const next = expr + k;
                setExpr(next);
                setResult(evaluate(next));
              }
            }}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
