#!/usr/bin/env node
/**
 * Check that every relative import in the given files or directories resolves.
 *
 * Usage:
 *   node check-relative-imports.mjs src/modules/orders
 *   node check-relative-imports.mjs --json src/modules/orders src/App.jsx
 *
 * Exit codes: 0 = all resolved, 1 = unresolved imports, 2 = usage error.
 * Package imports and path aliases are ignored by design.
 */

import fs from "node:fs";
import path from "node:path";

const HELP = [
  "Usage: node check-relative-imports.mjs [options] <path> [...]",
  "",
  "Options:",
  "  --json          Print a structured JSON report.",
  "  --root <dir>    Resolve relative paths from <dir>. Default: cwd.",
  "  -h, --help      Show this help.",
  "",
  "Exit codes: 0 = all resolved, 1 = unresolved imports, 2 = usage error."
].join("\n");

const SCRIPT_EXTENSIONS = [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"];
const RESOLVE_EXTENSIONS = ["", ...SCRIPT_EXTENSIONS, ".json"];
const INDEX_FILES = ["index.js", "index.jsx", "index.ts", "index.tsx"];
const SKIP_DIRECTORIES = new Set(["node_modules", "dist", "build", ".git", "coverage"]);
const IMPORT_PATTERN = /(?:from\s*|import\s*\()\s*["'](\.[^"']+)["']/g;

function parseArgs(argv) {
  const options = {
    json: false,
    root: process.cwd(),
    targets: []
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
    if (argument === "--root") {
      const value = argv[index + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("--root requires a directory");
      }
      options.root = path.resolve(value);
      index += 1;
      continue;
    }
    if (argument.startsWith("-")) {
      throw new Error("Unknown option: " + argument);
    }
    options.targets.push(argument);
  }

  if (options.targets.length === 0) {
    throw new Error("At least one file or directory path is required");
  }
  return options;
}

function collectFiles(target, root, files) {
  const absolute = path.resolve(root, target);
  if (!fs.existsSync(absolute)) {
    throw new Error("Path does not exist: " + target);
  }

  const stat = fs.statSync(absolute);
  if (stat.isFile()) {
    if (SCRIPT_EXTENSIONS.includes(path.extname(absolute))) {
      files.push(absolute);
    }
    return;
  }

  const stack = [absolute];
  while (stack.length > 0) {
    const directory = stack.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRECTORIES.has(entry.name)) {
          stack.push(path.join(directory, entry.name));
        }
      } else if (SCRIPT_EXTENSIONS.includes(path.extname(entry.name))) {
        files.push(path.join(directory, entry.name));
      }
    }
  }
}

function resolves(basePath) {
  for (const extension of RESOLVE_EXTENSIONS) {
    if (fs.existsSync(basePath + extension)) {
      return true;
    }
  }
  for (const indexFile of INDEX_FILES) {
    if (fs.existsSync(path.join(basePath, indexFile))) {
      return true;
    }
  }
  return false;
}

function scan(files, root) {
  const failures = [];
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    let match = IMPORT_PATTERN.exec(source);
    while (match !== null) {
      const specifier = match[1].replace(/[?#].*$/, "");
      const basePath = path.resolve(path.dirname(file), specifier);
      if (!resolves(basePath)) {
        failures.push({
          file: path.relative(root, file),
          specifier: specifier
        });
      }
      match = IMPORT_PATTERN.exec(source);
    }
  }
  return failures;
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
  const files = [];
  for (const target of options.targets) {
    collectFiles(target, options.root, files);
  }
  const failures = scan(files, options.root);
  const report = {
    ok: failures.length === 0,
    filesScanned: files.length,
    failures: failures
  };

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else if (report.ok) {
    console.log("All relative imports resolve in " + files.length + " file(s).");
  } else {
    console.error("Unresolved relative imports in " + failures.length + " place(s):");
    for (const failure of failures) {
      console.error("  " + failure.file + " -> " + failure.specifier);
    }
  }
  process.exitCode = report.ok ? 0 : 1;
} catch (error) {
  console.error("Error: " + error.message);
  process.exitCode = 2;
}
