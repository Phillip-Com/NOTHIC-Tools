// -------------------- ROLL20 RELAY SERVER --------------------
// A tiny local bridge between the Roll20 userscript (roll20-userscript.user.js)
// and the tracker's browser tab (roll20-bridge.js). Runs entirely on your own
// machine — nothing here talks to the internet or any third party.
//
// Flow:
//   Roll20 tab --(GM_xmlhttpRequest POST /ingest)--> this server
//                                                        |
//   tracker tab <--(fetch GET /pending, polled)---------+
//
// Zero npm dependencies — only Node's built-in `https`/`fs` modules. Run with:
//   node roll20-relay-server.js
//
// Serves HTTPS with a self-signed cert (see ROLL20-SETUP.md for the
// one-time `openssl` command that generates roll20-relay-cert.pem/
// roll20-relay-key.pem — not committed to the repo, generate your own).
// Plain HTTP isn't enough: when the tracker itself is loaded over HTTPS
// from a public origin (e.g. a GitHub Pages deployment, as opposed to a
// same-machine Live Server), Chrome refuses to fetch an HTTP endpoint at
// all — confirmed against a real report where the exact same relay/
// headers worked fine from Live Server (loopback-to-loopback, exempt
// from that restriction) but failed on every attempt from GitHub Pages,
// including a raw fetch() typed directly into the console with none of
// this script's own code involved. HTTPS-to-HTTPS has no such
// restriction, hence this server being HTTPS too, even though it only
// ever talks to your own machine.
//
// No npm install needed, no config file — see PORT below if 8787 is
// already in use on your machine.

const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = 8787;
const HOST = "127.0.0.1"; // localhost only — never exposed beyond this machine

const CERT_PATH = path.join(__dirname, "roll20-relay-cert.pem");
const KEY_PATH = path.join(__dirname, "roll20-relay-key.pem");

if (!fs.existsSync(CERT_PATH) || !fs.existsSync(KEY_PATH)) {
  console.error("[roll20-relay] Missing roll20-relay-cert.pem / roll20-relay-key.pem.");
  console.error("[roll20-relay] Generate them once — see the \"Generating the HTTPS certificate\" section in ROLL20-SETUP.md.");
  process.exit(1);
}

let pendingRolls = [];

// A wildcard `Access-Control-Allow-Origin: *` is what CORS normally
// recommends for a permissive, no-credentials endpoint like this one —
// but Chrome's Private Network Access check (needed the moment the
// tracker is loaded over HTTPS from a public origin, e.g. GitHub Pages,
// rather than loopback-to-loopback via Live Server) appears not to honor
// a wildcard the same way it does an exact origin match, mirroring the
// same restriction credentialed CORS requests already have. Echoing the
// REQUESTING origin back explicitly is a strict improvement over `*`
// regardless — every real request actually has one.
function corsHeaders(req) {
  return {
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Private-Network": "true",
    // Required alongside a non-wildcard Allow-Origin so caches/proxies
    // don't serve one origin's CORS response to a different origin.
    "Vary": "Origin"
  };
}

function sendJson(req, res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
    ...corsHeaders(req)
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (data.length > 1_000_000) { // 1MB guard against a runaway request
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = https.createServer({
  cert: fs.readFileSync(CERT_PATH),
  key: fs.readFileSync(KEY_PATH)
}, async (req, res) => {
  // Preflight — GM_xmlhttpRequest itself doesn't trigger CORS preflight
  // (it's a privileged API, not subject to the same-origin policy), but
  // a plain browser fetch() from the tracker page might for some request
  // shapes, so this is handled defensively either way.
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(req));
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(req, res, 200, { status: "ok", pending: pendingRolls.length });
    return;
  }

  if (req.method === "GET" && req.url === "/pending") {
    // Drain semantics: whatever's returned here is considered delivered
    // and won't be sent again on the next poll.
    const drained = pendingRolls;
    pendingRolls = [];
    sendJson(req, res, 200, { rolls: drained });
    return;
  }

  if (req.method === "POST" && req.url === "/ingest") {
    try {
      const raw = await readBody(req);
      const evt = JSON.parse(raw);

      if (!evt || typeof evt.characterName !== "string" || !evt.characterName.trim()) {
        sendJson(req, res, 400, { status: "error", message: "characterName is required" });
        return;
      }

      const stored = {
        characterName: evt.characterName.trim(),
        actionTypeGuess: typeof evt.actionTypeGuess === "string" ? evt.actionTypeGuess : "unknown",
        roll: Number.isFinite(evt.roll) ? evt.roll : null,
        modifier: Number.isFinite(evt.modifier) ? evt.modifier : 0,
        total: Number.isFinite(evt.total) ? evt.total : null,
        // Only ever sent by the userscript for a combined NPC
        // attack+damage roll — omitted (not just 0) for everything else,
        // so the tracker can tell "no damage on this roll" apart from
        // "this roll doesn't carry a damage value at all".
        damage: Number.isFinite(evt.damage) ? evt.damage : undefined,
        // Every plausible name candidate the userscript found (not just
        // the primary one), so the tracker can still match a real
        // character if the FIRST candidate isn't the right one.
        nameCandidates: Array.isArray(evt.nameCandidates) ? evt.nameCandidates.filter(n => typeof n === "string") : undefined,
        rawText: typeof evt.rawText === "string" ? evt.rawText.slice(0, 500) : "",
        receivedAt: Date.now()
      };

      pendingRolls.push(stored);
      console.log(`[roll20-relay] ingested: ${stored.characterName} — ${stored.actionTypeGuess} — roll=${stored.roll} mod=${stored.modifier}` +
        (stored.damage !== undefined ? ` dmg=${stored.damage}` : ""));
      sendJson(req, res, 200, { status: "ok" });
    } catch (err) {
      console.error("[roll20-relay] failed to parse /ingest body:", err.message);
      sendJson(req, res, 400, { status: "error", message: "Invalid JSON body" });
    }
    return;
  }

  sendJson(req, res, 404, { status: "error", message: "Not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`[roll20-relay] listening on https://${HOST}:${PORT}`);
  console.log(`[roll20-relay] Roll20 userscript should POST to https://${HOST}:${PORT}/ingest`);
  console.log(`[roll20-relay] tracker page should poll GET https://${HOST}:${PORT}/pending`);
  console.log(`[roll20-relay] Ctrl+C to stop.`);
});
