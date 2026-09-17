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
// Zero dependencies — only Node's built-in `http` module. Run with:
//   node roll20-relay-server.js
//
// No npm install needed, no config file — see PORT below if 8787 is
// already in use on your machine.

const http = require("http");

const PORT = 8787;
const HOST = "127.0.0.1"; // localhost only — never exposed beyond this machine

let pendingRolls = [];

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
    // Permissive CORS: the tracker page's own fetch() is cross-origin
    // relative to this server (different port), so it needs these
    // headers to be allowed to read the response at all.
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
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

const server = http.createServer(async (req, res) => {
  // Preflight — GM_xmlhttpRequest itself doesn't trigger CORS preflight
  // (it's a privileged API, not subject to the same-origin policy), but
  // a plain browser fetch() from the tracker page might for some request
  // shapes, so this is handled defensively either way.
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { status: "ok", pending: pendingRolls.length });
    return;
  }

  if (req.method === "GET" && req.url === "/pending") {
    // Drain semantics: whatever's returned here is considered delivered
    // and won't be sent again on the next poll.
    const drained = pendingRolls;
    pendingRolls = [];
    sendJson(res, 200, { rolls: drained });
    return;
  }

  if (req.method === "POST" && req.url === "/ingest") {
    try {
      const raw = await readBody(req);
      const evt = JSON.parse(raw);

      if (!evt || typeof evt.characterName !== "string" || !evt.characterName.trim()) {
        sendJson(res, 400, { status: "error", message: "characterName is required" });
        return;
      }

      const stored = {
        characterName: evt.characterName.trim(),
        actionTypeGuess: typeof evt.actionTypeGuess === "string" ? evt.actionTypeGuess : "unknown",
        roll: Number.isFinite(evt.roll) ? evt.roll : null,
        modifier: Number.isFinite(evt.modifier) ? evt.modifier : 0,
        total: Number.isFinite(evt.total) ? evt.total : null,
        rawText: typeof evt.rawText === "string" ? evt.rawText.slice(0, 500) : "",
        receivedAt: Date.now()
      };

      pendingRolls.push(stored);
      console.log(`[roll20-relay] ingested: ${stored.characterName} — ${stored.actionTypeGuess} — roll=${stored.roll} mod=${stored.modifier}`);
      sendJson(res, 200, { status: "ok" });
    } catch (err) {
      console.error("[roll20-relay] failed to parse /ingest body:", err.message);
      sendJson(res, 400, { status: "error", message: "Invalid JSON body" });
    }
    return;
  }

  sendJson(res, 404, { status: "error", message: "Not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`[roll20-relay] listening on http://${HOST}:${PORT}`);
  console.log(`[roll20-relay] Roll20 userscript should POST to http://${HOST}:${PORT}/ingest`);
  console.log(`[roll20-relay] tracker page should poll GET http://${HOST}:${PORT}/pending`);
  console.log(`[roll20-relay] Ctrl+C to stop.`);
});
