import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import Workspace from "./workspace";
import Assessment from "./assess/[token]/runner";
import { Welcome, EmployeePortal } from "./welcome";
import { currentRoute, pageUrl, STATIC_DEMO } from "@/lib/navigation";
import "./globals.css";
import { DemoGuide } from "./demo-guide";

function App() {
  const [path, setPath] = useState(currentRoute);
  useEffect(() => {
    const navigate = () => {
      setPath(currentRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  const assessment = path.match(/^\/assess\/(demo|[a-f0-9]{64})\/?$/);
  return (
    <>
      <Toaster theme="light" />
      {STATIC_DEMO && <DemoGuide path={path} />}
      {STATIC_DEMO && path !== "/" && (
        <div className="demo-banner">
          Interactive demo · Records stay in this browser. Use fictional
          details.
        </div>
      )}
      {assessment ? (
        <Assessment key={path} token={assessment[1]} />
      ) : path === "/" ? (
        <Welcome />
      ) : path === "/employee" ? (
        <EmployeePortal />
      ) : path === "/employer" ? (
        <Workspace />
      ) : (
        <main className="assessment-main">
          <h1>Page not found</h1>
          <a href={pageUrl("/")}>Return to FieldFit</a>
        </main>
      )}
    </>
  );
}
// Reuse the root during Vite updates so portal-based guides aren't left behind.
const root =
  import.meta.hot?.data.root ?? createRoot(document.getElementById("root")!);
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(<App />);
