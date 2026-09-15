# Roll20 → Stat Tracker Bridge — Setup

Watches your Roll20 chat for dice rolls and pre-fills the matching action-queue
card in the tracker (Attack, Ability, Save, Concentration, or Initiative) —
you still click Confirm. Everything runs on your own machine; nothing is sent
anywhere else.

This is a first pass. The two files most likely to need adjusting after you
try it against a real game are called out below.

## Why the relay is HTTPS, not plain HTTP

Confirmed against a real, extensively-debugged report: when the tracker
itself is loaded over `https://` (as GitHub Pages always serves it), Chrome
refuses to `fetch()` a plain `http://` endpoint on your own machine at all —
not a permission prompt you can grant, not a CORS header you can add, a hard
block. Verified this directly: a raw `fetch("http://127.0.0.1:8787/health")`
typed straight into the console, with none of this project's own code
involved, failed identically. The only real fix is for the relay to also be
`https://`, so it's HTTPS-to-HTTPS the whole way — that restriction only
applies to HTTPS pages reaching *non-HTTPS* endpoints.

Live Server (below) never hit this at all, because it serves over plain
`http://127.0.0.1:<port>` too — loopback talking to loopback has never been
restricted this way, HTTPS relay or not.

## Generating the HTTPS certificate (one-time, per machine)

The relay needs a certificate to serve HTTPS. A self-signed one is enough —
it never leaves your machine, so there's no certificate authority to pay for
or verify against. Run this once, in the tracker's folder (Git Bash /
WSL / macOS / Linux terminal — needs `openssl`, which ships with Git for
Windows):

```
openssl req -x509 -newkey rsa:2048 -keyout roll20-relay-key.pem -out roll20-relay-cert.pem -days 3650 -nodes -subj "//CN=127.0.0.1" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
```

(The leading `//` before `CN=` — not a typo — works around a Git-Bash-on-Windows
quirk where a single `/CN=...` gets misread as a file path. On macOS/Linux/WSL
a single `/CN=...` is fine either way.)

This creates `roll20-relay-key.pem` and `roll20-relay-cert.pem` next to
`roll20-relay-server.js`, valid for 10 years. **Never commit these** — each
machine should generate its own (already covered by `.gitignore`). The relay
refuses to start with a clear error if they're missing.

### Trusting the certificate in your browser (one-time)

A self-signed cert isn't backed by a certificate authority, so browsers show
a security warning for it by default. Easiest fix — **Chrome/Edge**: visit
`chrome://flags/#allow-insecure-localhost`, set it to **Enabled**, relaunch
the browser. This tells Chrome to trust any certificate for `localhost`/
`127.0.0.1` specifically, permanently, with no per-session warning.

Without that flag, you'd instead need to open `https://127.0.0.1:8787/health`
directly in a tab once (with the relay running) and click through the "Your
connection is not private" warning (Advanced → Proceed) — this only grants
trust in that one browser profile, and may need repeating if the cert is ever
regenerated.

## Recommended for calibration/testing: VS Code's "Live Server"

If you have the Live Server extension, right-click `index.html` → "Open with
Live Server" instead of using your GitHub-hosted copy while you're setting
this up. Once you've confirmed the parsing looks right (the `DEBUG_LOG_ONLY`
step further down), switch back to however you normally host it — the same
HTTPS relay setup above works identically from either.

## Pieces involved

1. **`roll20-relay-server.js`** — a tiny local server (plain Node, no
   installs) that sits between your Roll20 tab and your tracker tab.
2. **`roll20-userscript.user.js`** — runs inside your Roll20 tab (via
   Tampermonkey), watches the chat log, and sends parsed rolls to the relay.
3. **`roll20-bridge.js`** — runs inside the tracker tab, polls the relay, and
   turns incoming rolls into pre-filled queue cards.

## One-time setup

### 1. Install Tampermonkey

If you don't already have it: install the **Tampermonkey** extension for your
browser (Chrome, Firefox, and Edge all have it in their extension stores —
search "Tampermonkey"). It's free.

### 2. Install the userscript

1. Open the Tampermonkey dashboard (click its icon → Dashboard).
2. Click the **+** (Create a new script) tab.
3. Delete the placeholder content, then paste in the entire contents of
   `roll20-userscript.user.js`.
4. Save (Ctrl+S or File → Save).
5. Confirm it's enabled (toggle should be on) in the dashboard's script list.

### 3. Enable the tracker-side bridge

Add this line to `index.html`, right after the `<script src="tracker.js"></script>`
line:

```html
<script src="roll20-bridge.js"></script>
```

That's it for the tracker side — it's inert (does nothing, no errors) if the
relay server isn't running, so this is safe to leave in permanently.

## Every time you play

1. Open a terminal in the tracker's folder and run:
   ```
   node roll20-relay-server.js
   ```
   Leave this window open for the session. You should see:
   ```
   [roll20-relay] listening on https://127.0.0.1:8787
   ```
   (If it exits immediately with a message about missing `.pem` files
   instead, you haven't generated the certificate yet — see above.)
2. Open the tracker in your browser as usual.
3. Open your Roll20 game in another tab.
4. Roll dice as normal in Roll20. Matched rolls should appear in the tracker's
   action queue, pre-filled, within a couple seconds.

## Calibrating the userscript against your actual game (do this first)

The chat-parsing has since been rewritten against real HTML pulled from an
actual game (both character-sheet roll templates and plain `/roll` results),
so it should already match your game's structure. It's still worth a quick
check before you turn off debug mode, since character sheets and custom
macros vary:

1. Open `roll20-userscript.user.js` in Tampermonkey's editor and confirm
   `DEBUG_LOG_ONLY = true` near the top (it ships that way by default).
2. Play normally in Roll20 for a bit — make a few different kinds of rolls
   (an attack, a save, an ability check, a bare `/roll 1d20`).
3. Open your browser's console (F12 → Console) **on the Roll20 tab**. You'll
   see a log line for every roll it detected, like:
   ```
   [roll20-relay][DEBUG] parsed roll (not sent): {characterName: "Oravin", actionTypeGuess: "attack", roll: 17, modifier: 5, total: 22, rawText: "..."}
   ```
4. Check each one: is `characterName` right? Is `roll`/`modifier` split
   correctly? Is `actionTypeGuess` reasonable?
5. If something's off, the section marked `// ADJUST ME` in the script has
   `TEXT_KEYWORD_HINTS` — a keyword → roll type fallback used only for
   custom macros/labels that don't match Roll20's own sheet formatting
   (which is otherwise read directly from the message's structure, not
   guessed from text). A weapon attack whose to-hit bonus doesn't show
   with a leading "+" (unusual, but some homebrew sheets vary) would be the
   main thing that could still land as "unknown" instead of "attack" — if
   you see that a lot, it's worth flagging so the classifier can account
   for it.
   - Right-click an actual roll result in Roll20's chat → Inspect, to see
     the real element structure and compare against what the script expects.
6. Once it looks right, set `DEBUG_LOG_ONLY = false` and save. Rolls will now
   actually be sent to the relay.

## What gets auto-filled vs. what needs manual routing

- **Attack, Ability, Save, Concentration, Initiative** — these can be fully
  auto-matched: pre-filled into a new card, or merged as an extra row into
  one you already have open for that character.
- **Everything else** (Damage, Heal, Money Spent, Spell, a bare `/roll` with
  no identifiable purpose, or a name that doesn't match an active character)
  — lands in an **"Unmatched Roll20 Rolls"** tray at the top of the action
  queue instead of being guessed at. Pick the character and action from the
  dropdowns there and click **Route** — for the five types above this still
  pre-fills the value; for the others it opens the right card for you to fill
  in by hand (still saves you finding the right button).

This is deliberate: a `/roll 1d20+5` typed with no label carries no
information about what it's *for* — there's no way to guess that reliably, so
it's surfaced for you to decide instead of silently filed somewhere wrong.

## Troubleshooting

- **Nothing shows up in the tracker at all**: check the relay server's
  terminal — do you see `[roll20-relay] ingested: ...` lines when you roll?
  If not, the userscript isn't reaching it (check `DEBUG_LOG_ONLY`, and check
  the Roll20 tab's console for `[roll20-relay]` error lines).
- **Relay terminal shows ingested rolls but the tracker never picks them up**:
  confirm `roll20-bridge.js` is actually loaded (check the tracker page's
  own console — not the Roll20 tab's — for its `SCRIPT VERSION ... loaded`
  line and any errors) and that `index.html` has the `<script>` line added.
- **Tracker console shows a CORS error or "poll failed — relay unreachable"**:
  almost always means the browser doesn't trust the relay's certificate yet —
  see "Trusting the certificate in your browser" above. Test with a raw
  `fetch("https://127.0.0.1:8787/health").then(r=>r.json()).then(console.log)`
  typed into that same tab's console; if that alone fails, it's a certificate
  trust issue, not a bug in this project's code.
- **Relay exits immediately on startup with a message about missing
  `.pem` files**: you haven't generated the certificate yet — see
  "Generating the HTTPS certificate" above.
- **Port 8787 already in use**: change `PORT` at the top of
  `roll20-relay-server.js`, and `ROLL20_RELAY_URL`/`RELAY_URL` at the top of
  `roll20-bridge.js` and `roll20-userscript.user.js` to match (keep the
  `https://` scheme in all three).
