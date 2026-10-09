import ts from "typescript";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const files = [
  "server/database.ts",
  "server/access.ts",
  "server/api.ts",
  "server/http.ts",
  "server/index.ts",
  "lib/assessment.ts",
  "lib/question-bank.ts",
];
for (const file of files) {
  const target = ".server/" + file.replace(/\.ts$/, ".js");
  mkdirSync(dirname(target), { recursive: true });
  const result = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
    fileName: file,
  });
  writeFileSync(target, result.outputText);
}
