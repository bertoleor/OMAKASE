import fs from "node:fs";
import { execSync } from "node:child_process";

const FORBIDDEN_WORDS = [
  "data",
  "resp",
  "val",
  "item",
  "temp",
  "handleSomething",
];
const UI_LOGIC_VIOLATION = ["supabase.from", "prisma.", "axios."];

const validateSeniority = (path: string) => {
  const file = fs.readFileSync(path, "utf-8");
  const violations: string[] = [];

  if (file.match(/\/\/ .+/g)) violations.push("Redundant comments detected");

  FORBIDDEN_WORDS.forEach((word) => {
    const regex = new RegExp(String.raw`\b${word}\b`, "g");
    if (file.match(regex)) violations.push(`Generic naming found: ${word}`);
  });

  if (path.includes("/components/")) {
    UI_LOGIC_VIOLATION.forEach((forbidden) => {
      if (file.includes(forbidden))
        violations.push(`Leak of data logic in UI: ${forbidden}`);
    });
  }

  if (violations.length > 0) {
    console.error(`Audit failed: ${path}`);
    violations.forEach((v) => console.error(` - ${v}`));
    process.exit(1);
  }
};

const gitDiff = execSync("git diff --name-only").toString().split("\n");
gitDiff.filter((f) => f.match(/\.(ts|tsx)$/)).forEach(validateSeniority);
