// List app router page.tsx routes not clearly referenced in GO_96_16_d5_d6_d7 evidence JSON.
// Heuristic: extract path-like strings from scope + actions; mark covered if route matches or is under a hint.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, "..");

function walkPages(dir, out) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walkPages(p, out);
    else if (name.isFile() && name.name === "page.tsx") out.push(p);
  }
}

function appPathToRoute(abs) {
  const rel = path.relative(path.join(frontendRoot, "app"), abs).replace(/\\/g, "/");
  const noPage = rel.replace(/\/page\.tsx$/, "");
  if (noPage === "(home)") return "/";
  return "/" + noPage;
}

function loadEvidencePathHints() {
  const evDir = path.join(frontendRoot, "evidence");
  const files = fs
    .readdirSync(evDir)
    .filter(
      (f) =>
        f.startsWith("GO_96_16_d5_d6_d7") &&
        f.endsWith(".json") &&
        !f.includes("uncovered_routes_snapshot"),
    );
  const hints = new Set();
  for (const f of files) {
    let j;
    try {
      j = JSON.parse(fs.readFileSync(path.join(evDir, f), "utf8"));
    } catch {
      continue;
    }
    const parts = [j.scope, ...(Array.isArray(j.d5_d6_d7_actions) ? j.d5_d6_d7_actions : []), JSON.stringify(j.commands || {})];
    const blob = parts.join("\n");
    if (/Home|LandingHeroForm|\(home\)/i.test(blob)) hints.add("/");
    // /foo/bar, /foo/[id]/b, /admin/foo (no trailing page.tsx required)
    for (const m of blob.matchAll(/\/[a-zA-Z0-9_\-.[\]]+(?:\/[a-zA-Z0-9_\-.[\]]+)*/g)) {
      hints.add(m[0].replace(/\/$/, "") || "/");
    }
    // "app/foo/bar/page.tsx" in actions
    for (const m of blob.matchAll(/app\/[a-zA-Z0-9_\-./\[\]]+page\.tsx/g)) {
      const route = m[0].replace(/^app\//, "").replace(/\/page\.tsx$/, "");
      hints.add("/" + route);
    }
  }
  // Root coverage from landing
  hints.add("/(home)");
  return hints;
}

function normalizeRoute(r) {
  if (r === "/") return r;
  return r.replace(/\/$/, "");
}

/** True if this route is clearly mentioned or is a subpath of a hint */
function isCovered(route, hints) {
  const r = normalizeRoute(route);
  if (hints.has(r)) return true;
  for (const h of hints) {
    if (h === "/") continue;
    if (r === h || r.startsWith(h + "/")) return true;
  }
  // also: hint may be /guides/[id] while route is /guides/foo — not in hints; [id] pattern
  for (const h of hints) {
    if (!h.includes("[")) continue;
    const re = new RegExp("^" + h.replace(/\[id\]/g, "[^/]+").replace(/[[\]]/g, "\\$&") + "(?:/|$)");
    if (re.test(r)) return true;
  }
  return false;
}

const pages = [];
walkPages(path.join(frontendRoot, "app"), pages);
const routes = pages.map((p) => appPathToRoute(p)).sort();
const hints = loadEvidencePathHints();
const uncovered = routes.filter((r) => !isCovered(r, hints));

const out = {
  generated_by: "scripts/list-d5d6d7-uncovered-routes.mjs",
  total_page_routes: routes.length,
  evidence_hint_count: hints.size,
  uncovered_count: uncovered.length,
  uncovered_routes: uncovered,
  evidence_files_scanned: fs
    .readdirSync(path.join(frontendRoot, "evidence"))
    .filter(
      (f) =>
        f.startsWith("GO_96_16_d5_d6_d7") &&
        f.endsWith(".json") &&
        !f.includes("uncovered_routes_snapshot"),
    ),
};

console.log(JSON.stringify(out, null, 2));
