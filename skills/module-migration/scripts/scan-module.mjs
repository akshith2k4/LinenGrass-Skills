#!/usr/bin/env node
/**
 * Read-only inventory for a feature area being prepared for module migration.
 *
 * Usage:
 *   node scan-module.mjs --area orders --json
 *   node scan-module.mjs --area orders --root /path/to/repo --json
 *
 * Exit codes: 0 = scan complete, 2 = usage error.
 * The output is deterministic and safe to run repeatedly.
 */

import fs from "node:fs";
import path from "node:path";

const HELP = [
  "Usage: node scan-module.mjs --area <name> [options]",
  "",
  "Options:",
  "  --area <name>       Feature or area name to scan. Required.",
  "  --root <dir>        Repository root. Default: cwd.",
  "  --max-files <n>     Maximum files to scan. Default: 2000.",
  "  --json              Print JSON. JSON is also the default output.",
  "  -h, --help          Show this help.",
  "",
  "Exit codes: 0 = scan complete, 2 = usage error."
].join("\n");

const SCRIPT_EXTENSIONS = [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"];
const TEXT_EXTENSIONS = new Set([
  ...SCRIPT_EXTENSIONS,
  ".json",
  ".css",
  ".scss",
  ".md",
  ".html",
  ".txt"
]);
const SKIP_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  "build",
  ".git",
  "coverage",
  ".next",
  ".cache"
]);
const IMPORT_PATTERN = /(?:from\s*|import\s*\()\s*["']([^"']+)["']/g;

function parseArgs(argv) {
  const options = {
    area: null,
    root: process.cwd(),
    maxFiles: 2000,
    json: true
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
    if (argument === "--area" || argument === "--root" || argument === "--max-files") {
      const value = argv[index + 1];
      if (!value || value.startsWith("-")) {
        throw new Error(argument + " requires a value");
      }
      if (argument === "--area") {
        options.area = value;
      } else if (argument === "--root") {
        options.root = path.resolve(value);
      } else {
        options.maxFiles = Number(value);
      }
      index += 1;
      continue;
    }
    throw new Error("Unknown option: " + argument);
  }

  if (!options.area) {
    throw new Error("--area is required");
  }
  if (!Number.isInteger(options.maxFiles) || options.maxFiles < 1) {
    throw new Error("--max-files must be a positive integer");
  }
  return options;
}

function walkFiles(root, maxFiles) {
  const files = [];
  const stack = [root];
  while (stack.length > 0 && files.length < maxFiles) {
    const directory = stack.pop();
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRECTORIES.has(entry.name)) {
          stack.push(path.join(directory, entry.name));
        }
      } else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        files.push(path.join(directory, entry.name));
        if (files.length >= maxFiles) {
          break;
        }
      }
    }
  }
  return files;
}

function classify(relativePath, moduleName) {
  const value = relativePath.toLowerCase();
  const base = value.slice(value.lastIndexOf("/") + 1);
  const destinationRoot = "src/modules/" + moduleName;

  if (/service|api|endpoint/.test(base)) {
    return { kind: "api", destination: destinationRoot + "/api" };
  }
  if (/^use[a-z]|\.hook\./.test(base) || value.includes("/hooks/")) {
    return { kind: "hook", destination: destinationRoot + "/hooks" };
  }
  if (/constant|options|config/.test(base)) {
    return { kind: "constants", destination: destinationRoot + "/constants" };
  }
  if (/model|mapper|schema|type/.test(base)) {
    return { kind: "model", destination: destinationRoot + "/models" };
  }
  if (/tab/.test(base) || value.includes("/tabs/")) {
    return { kind: "tab", destination: destinationRoot + "/tabs" };
  }
  if (/page|screen/.test(base) || value.includes("/pages/")) {
    return { kind: "page", destination: destinationRoot + "/pages" };
  }
  if (/util|helper|format|transform/.test(base)) {
    return { kind: "util", destination: destinationRoot + "/utils" };
  }
  if (/\.(css|scss)$/.test(base)) {
    return { kind: "style", destination: destinationRoot + "/components" };
  }
  if (/\.md$/.test(base)) {
    return { kind: "doc", destination: null };
  }
  return { kind: "component", destination: destinationRoot + "/components" };
}

function identifiersFor(relativePath) {
  const base = path.basename(relativePath, path.extname(relativePath));
  const identifiers = [base];
  const camel = base.replace(/[^a-zA-Z0-9]+(.)/g, function (_, character) {
    return character.toUpperCase();
  });
  identifiers.push(camel);
  if (camel.startsWith("use") && camel.length > 3) {
    identifiers.push(camel.charAt(3).toLowerCase() + camel.slice(4));
  }
  return Array.from(new Set(identifiers.filter(Boolean)));
}

function scanModule(options) {
  const area = options.area.toLowerCase();
  const moduleName = options.area;
  const files = walkFiles(options.root, options.maxFiles);
  const candidates = [];
  const candidateSet = new Set();
  const identifiers = new Set([area]);

  for (const file of files) {
    const relativePath = path.relative(options.root, file).split(path.sep).join("/");
    if (relativePath.toLowerCase().includes(area)) {
      const classification = classify(relativePath, moduleName);
      candidates.push({
        path: relativePath,
        kind: classification.kind,
        destination: classification.destination
      });
      candidateSet.add(relativePath);
      for (const identifier of identifiersFor(relativePath)) {
        identifiers.add(identifier.toLowerCase());
      }
    }
  }

  const consumers = [];
  const routes = [];
  const sharedDependencies = new Set();

  for (const file of files) {
    const relativePath = path.relative(options.root, file).split(path.sep).join("/");
    const source = fs.readFileSync(file, "utf8");
    const lowerSource = source.toLowerCase();
    const lines = source.split(/\r?\n/);

    if (!candidateSet.has(relativePath)) {
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const lowerLine = lines[lineIndex].toLowerCase();
        const matched = Array.from(identifiers).find(function (identifier) {
          return identifier.length > 2 && lowerLine.includes(identifier);
        });
        if (matched && consumers.length < 200) {
          consumers.push({
            path: relativePath,
            line: lineIndex + 1,
            symbol: matched,
            text: lines[lineIndex].trim().slice(0, 200)
          });
        }
      }
    }

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      if (/lazy|import\(|path\s*:/.test(line) && lowerSource.includes(area)) {
        if (routes.length < 100) {
          routes.push({
            path: relativePath,
            line: lineIndex + 1,
            text: line.trim().slice(0, 200)
          });
        }
      }
    }

    if (candidateSet.has(relativePath)) {
      let match = IMPORT_PATTERN.exec(source);
      while (match !== null) {
        const specifier = match[1];
        if (specifier.startsWith(".")) {
          const resolved = path.resolve(path.dirname(file), specifier);
          const resolvedRelative = path
            .relative(options.root, resolved)
            .split(path.sep)
            .join("/");
          const candidateAreaPrefix = "src/" + area + "/";
          const moduleAreaPrefix = "src/modules/" + moduleName + "/";
          const insideArea =
            resolvedRelative.toLowerCase().includes(candidateAreaPrefix.toLowerCase()) ||
            resolvedRelative.toLowerCase().includes(moduleAreaPrefix.toLowerCase());
          if (!insideArea && !candidateSet.has(resolvedRelative)) {
            sharedDependencies.add(resolvedRelative);
          }
        }
        match = IMPORT_PATTERN.exec(source);
      }
    }
  }

  const destinations = Array.from(
    new Set(
      candidates
        .map(function (candidate) {
          return candidate.destination;
        })
        .filter(Boolean)
    )
  ).sort();

  return {
    area: options.area,
    root: options.root,
    moduleRoot: "src/modules/" + moduleName,
    summary: {
      filesScanned: files.length,
      candidateFiles: candidates.length,
      consumers: consumers.length,
      routes: routes.length,
      sharedDependencies: sharedDependencies.size
    },
    files: candidates,
    consumers: consumers,
    routes: routes,
    sharedDependencies: Array.from(sharedDependencies).sort(),
    proposedDestinations: destinations
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

try {
  const report = scanModule(options);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 0;
} catch (error) {
  console.error("Error: " + error.message);
  process.exitCode = 2;
}
