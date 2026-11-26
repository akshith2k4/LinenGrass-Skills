#!/usr/bin/env node
/**
 * CI gate for the module-migration skill.
 *
 * Checks frontmatter basics, SKILL.md size, required sections, reference links,
 * and --help behavior for every executable script.
 *
 * Exit codes: 0 = all checks passed, 1 = at least one check failed, 2 = usage error.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HELP = [
  "Usage: node ci-check.mjs [--json] [--help]",
  "",
  "Options:",
  "  --json      Print a structured JSON report.",
  "  -h, --help  Show this help.",
  "",
  "Exit codes: 0 = all checks passed, 1 = check failed, 2 = usage error."
].join("\n");

const REQUIRED_SECTIONS = [
  "## Purpose",
  "## When to Use",
  "## When Not to Use",
  "## Available Scripts",
  "## Verification Loop",
  "## Limitations",
  "## Troubleshooting",
  "## Examples",
  "## References"
];

const EXPECTED_SCRIPTS = [
  "check-relative-imports.mjs",
  "scan-module.mjs",
  "validate-migration.mjs"
];

function parseArgs(argv) {
  const options = { json: false };
  for (const argument of argv) {
    if (argument === "--help" || argument === "-h") {
      console.log(HELP);
      process.exit(0);
    }
    if (argument === "--json") {
      options.json = true;
      continue;
    }
    throw new Error("Unknown option: " + argument);
  }
  return options;
}

function check(condition, message, results) {
  results.push({ check: message, status: condition ? "pass" : "fail" });
  return condition;
}

function runHelp(scriptPath) {
  const result = spawnSync(process.execPath, [scriptPath, "--help"], {
    encoding: "utf8"
  });
  const output = (result.stdout || "") + (result.stderr || "");
  return result.status === 0 && output.includes("Usage:");
}

function ciCheck(root) {
  const results = [];
  const skillPath = path.join(root, "SKILL.md");
  const skill = fs.readFileSync(skillPath, "utf8");
  const lines = skill.split(/\r?\n/);
  const frontmatterMatch = skill.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  const frontmatter = frontmatterMatch ? frontmatterMatch[1] : "";
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descriptionMatch = frontmatter.match(/^description:\s*(.+)$/m);
  const versionMatch = frontmatter.match(/^\s{2}version:\s*(.+)$/m);
  const folderName = path.basename(root);

  check(Boolean(frontmatterMatch), "frontmatter delimiters present", results);
  check(
    Boolean(nameMatch) && nameMatch[1].trim() === folderName,
    "name matches folder (" + folderName + ")",
    results
  );
  if (descriptionMatch) {
    const description = descriptionMatch[1].trim().replace(/^["']|["']$/g, "");
    check(description.length > 0 && description.length <= 1024, "description within 1-1024 chars", results);
    check(description.startsWith("Use when "), "description starts with a trigger", results);
    check(description.includes("Do not use"), "description includes negative triggers", results);
  } else {
    check(false, "description present", results);
  }
  check(Boolean(versionMatch), "metadata.version present", results);
  check(frontmatter.includes("license:"), "license present", results);
  check(frontmatter.includes("compatibility:"), "compatibility present", results);
  check(lines.length <= 500, "SKILL.md within 500 lines (found " + lines.length + ")", results);

  for (const section of REQUIRED_SECTIONS) {
    check(skill.includes(section), section + " present", results);
  }

  const referencesDirectory = path.join(root, "references");
  const referenceFiles = fs
    .readdirSync(referencesDirectory)
    .filter(function (name) {
      return name.endsWith(".md");
    })
    .sort();
  for (const reference of referenceFiles) {
    check(
      skill.includes("references/" + reference),
      "reference linked: " + reference,
      results
    );
  }

  const scriptsDirectory = path.join(root, "scripts");
  for (const script of EXPECTED_SCRIPTS) {
    check(fs.existsSync(path.join(scriptsDirectory, script)), "script exists: " + script, results);
    if (fs.existsSync(path.join(scriptsDirectory, script))) {
      check(runHelp(path.join(scriptsDirectory, script)), "--help works: " + script, results);
    }
  }

  return {
    root: root,
    ok: results.every(function (result) {
      return result.status === "pass";
    }),
    checks: results
  };
}

let options;
try {
  options = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error("Error: " + error.message);
  console.error(HELP);
  process.exit(2);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
try {
  const report = ciCheck(root);
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    for (const result of report.checks) {
      console.log(result.status.toUpperCase() + "  " + result.check);
    }
    console.log(report.ok ? "All CI checks passed." : "CI checks failed.");
  }
  process.exitCode = report.ok ? 0 : 1;
} catch (error) {
  console.error("Error: " + error.message);
  process.exitCode = 2;
}
