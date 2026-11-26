#!/usr/bin/env node
/**
 * Run migration verification gates and print a structured result.
 *
 * Usage:
 *   node validate-migration.mjs --base main --target src/modules/orders \
 *     --stale 'components/orders' --json
 *
 * Exit codes: 0 = no failed gates, 1 = at least one failed gate, 2 = usage error.
 * Commands run with fixed argument lists. No shell is invoked.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HELP = [
  "Usage: node validate-migration.mjs --base <branch> --target <dir> [options]",
  "",
  "Options:",
  "  --base <branch>       Base branch for the rename audit. Required.",
  "  --target <dir>        Migrated module directory. Required.",
  "  --scope <dir>         Root for stale-path search. Default: src.",
  "  --stale <fragment>    Old path fragment to search for. May be repeated.",
  "  --build <command>     Build command. Default: npm run build.",
  "  --typecheck <command> Optional typecheck command.",
  "  --json                Print a structured JSON report.",
  "  --root <dir>          Repository root. Default: cwd.",
  "  -h, --help            Show this help.",
  "",
  "Exit codes: 0 = no failed gates, 1 = failed gate, 2 = usage error."
].join("\n");

const SKIP_DIRECTORIES = new Set(["node_modules", "dist", "build", ".git", "coverage"]);
const TEXT_EXTENSIONS = new Set([
  ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".json", ".css", ".scss", ".md", ".html", ".txt"
]);

function parseArgs(argv) {
  const options = {
    base: null,
    target: null,
    scope: "src",
    stale: [],
    build: "npm run build",
    typecheck: null,
    json: false,
    root: process.cwd()
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      console.log(HELP);
      process.exit(0);
    }
    if (argument === "--json") {
      options.json = true;
      continue;
    }
    if (argument === "--base" || argument === "--target" || argument === "--scope" || argument === "--stale" || argument === "--build" || argument === "--typecheck" || argument === "--root") {
      const value = argv[index + 1];
      if (!value || (argument !== "--build" && argument !== "--typecheck" && value.startsWith("-"))) {
        throw new Error(argument + " requires a value");
      }
      if (argument === "--stale") {
        options.stale.push(value);
      } else if (argument === "--base") {
        options.base = value;
      } else if (argument === "--target") {
        options.target = value;
      } else if (argument === "--scope") {
        options.scope = value;
      } else if (argument === "--build") {
        options.build = value;
      } else if (argument === "--typecheck") {
        options.typecheck = value;
      } else {
        options.root = path.resolve(value);
      }
      index += 1;
      continue;
    }
    throw new Error("Unknown option: " + argument);
  }

  if (!options.base || !options.target) {
    throw new Error("--base and --target are required");
  }
  return options;
}

function splitCommand(command) {
  const tokens = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match = pattern.exec(command);
  while (match !== null) {
    tokens.push(match[1] || match[2] || match[3]);
    match = pattern.exec(command);
  }
  if (tokens.length === 0) {
    throw new Error("Empty command");
  }
  return tokens;
}

function runCommand(command, root) {
  const tokens = splitCommand(command);
  const result = spawnSync(tokens[0], tokens.slice(1), {
    cwd: root,
    encoding: "utf8"
  });
  if (result.error) {
    return {
      status: "fail",
      command: command,
      detail: result.error.message
    };
  }
  const output = ((result.stdout || "") + (result.stderr || "")).trim();
  return {
    status: result.status === 0 ? "pass" : "fail",
    command: command,
    detail: output.slice(0, 4000) || "Exit code " + result.status
  };
}

function walkFiles(root) {
  const files = [];
  if (!fs.existsSync(root)) {
    return files;
  }
  const stack = [root];
  while (stack.length > 0 && files.length < 5000) {
    const directory = stack.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRECTORIES.has(entry.name)) {
          stack.push(path.join(directory, entry.name));
        }
      } else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        files.push(path.join(directory, entry.name));
      }
    }
  }
  return files;
}

function staleAudit(options) {
  if (options.stale.length === 0) {
    return {
      status: "skipped",
      command: "stale-path search",
      detail: "No --stale fragments were provided."
    };
  }
  const scope = path.resolve(options.root, options.scope);
  const files = walkFiles(scope);
  const matches = [];
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8").toLowerCase();
    const lines = source.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const hit = options.stale.find(function (fragment) {
        return lines[index].includes(fragment.toLowerCase());
      });
      if (hit && matches.length < 100) {
        matches.push({
          path: path.relative(options.root, file).split(path.sep).join("/"),
          line: index + 1,
          fragment: hit
        });
      }
    }
  }
  return {
    status: matches.length === 0 ? "pass" : "fail",
    command: "stale-path search",
    detail: matches.length === 0 ? "No stale path fragments found." : matches
  };
}

function importAudit(options) {
  const checker = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "check-relative-imports.mjs"
  );
  const result = spawnSync(process.execPath, [checker, "--json", options.target], {
    cwd: options.root,
    encoding: "utf8"
  });
  if (result.error || !result.stdout) {
    return {
      status: "fail",
      command: "check-relative-imports.mjs",
      detail: result.error ? result.error.message : "No checker output"
    };
  }
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch (error) {
    return {
      status: "fail",
      command: "check-relative-imports.mjs",
      detail: "Invalid checker JSON: " + error.message
    };
  }
  return {
    status: report.ok ? "pass" : "fail",
    command: "check-relative-imports.mjs",
    detail: report
  };
}

function renameAudit(options) {
  return runCommand(
    "git diff --find-renames " + options.base + "...HEAD --stat",
    options.root
  );
}

let options;
try {
  options = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error("Error: " + error.message);
  console.error(HELP);
  process.exit(2);
}

try {
  const gates = [
    { name: "rename-audit", result: renameAudit(options) },
    { name: "build", result: runCommand(options.build, options.root) },
    {
      name: "typecheck",
      result: options.typecheck
        ? runCommand(options.typecheck, options.root)
        : { status: "skipped", command: "typecheck", detail: "No --typecheck command configured." }
    },
    { name: "stale-paths", result: staleAudit(options) },
    { name: "relative-imports", result: importAudit(options) }
  ];

  const failed = gates.filter(function (gate) {
    return gate.result.status === "fail";
  });
  const report = {
    ok: failed.length === 0,
    base: options.base,
    target: options.target,
    gates: gates.map(function (gate) {
      return { name: gate.name, status: gate.result.status, command: gate.result.command, detail: gate.result.detail };
    })
  };

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    for (const gate of report.gates) {
      console.log(gate.status.toUpperCase() + "  " + gate.name + "  " + gate.command);
    }
    console.log(report.ok ? "All required gates passed." : failed.length + " gate(s) failed.");
  }
  process.exitCode = report.ok ? 0 : 1;
} catch (error) {
  console.error("Error: " + error.message);
  process.exitCode = 2;
}
