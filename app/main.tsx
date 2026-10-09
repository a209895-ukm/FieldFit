import { createRoot } from "react-dom/client";
import Workspace from "./workspace";
import Assessment from "./assess/[token]/runner";
import "./globals.css";

const path = window.location.pathname;
const assessment = path.match(/^\/assess\/(demo|[a-f0-9]{64})\/?$/);
createRoot(document.getElementById("root")!).render(
  assessment ? (
    <Assessment token={assessment[1]} />
  ) : path === "/" ? (
    <Workspace />
  ) : (
    <main className="assessment-main">
      <h1>Page not found</h1>
      <a href="/">Return to FieldFit</a>
    </main>
  ),
);
