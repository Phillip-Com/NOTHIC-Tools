# Roll20 → Stat Tracker Bridge — Setup

Watches your Roll20 chat for dice rolls and pre-fills the matching action-queue
card in the tracker (Attack, Ability, Save, Concentration, or Initiative) —
you still click Confirm. Everything runs on your own machine; nothing is sent
anywhere else.

This is a first pass. The two files most likely to need adjusting after you
try it against a real game are called out below.

## Recommended for calibration/testing: VS Code's "Live Server"

If you have the Live Server extension, right-click `index.html` → "Open with
Live Server" instead of using your GitHub-hosted copy while you're setting
this up. Live Server serves over plain `http://127.0.0.1:<port>`, and Chrome's
Local Network Access permission gate (see below) currently only applies to
requests from a *public* origin to a local one — loopback talking to loopback
is exempt. So testing this way means no permission prompts, no mixed-content
questions, nothing to grant — it should just work. Once you've confirmed the
parsing looks right (the `DEBUG_LOG_ONLY` step further down), switch back to
however you normally host it.

## If you host the tracker on GitHub Pages (HTTPS)

The relay server is plain `http://`, not `https://`. If the tracker itself is
loaded over `https://` (as GitHub Pages always serves it), Chrome has a
"Local Network Access" security check that covers this exact situation — a
public HTTPS site talking to something on your local machine — and it will
show a one-time permission prompt like *"[site] wants to access devices on
your local network"* the first time `roll20-bridge.js` tries to reach the
relay. **This is expected — click Allow.** It's not an error, and it's not
optional to skip (the fetch won't work until you grant it). This should only
need to happen once per browser, though I haven't been able to verify the
exact persistence behavior firsthand. Firefox doesn't currently enforce this
the same way, so you likely won't see it there.

If the prompt never appears and requests just silently fail instead, check
your browser's site settings for the tracker's URL — there may be a
"Local network access" permission listed there you can toggle directly.

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
   [roll20-relay] listening on http://127.0.0.1:8787
   ```
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
  console for errors) and that `index.html` has the `<script>` line added.
- **Port 8787 already in use**: change `PORT` at the top of
  `roll20-relay-server.js`, and `ROLL20_RELAY_URL` at the top of both
  `roll20-userscript.user.js` and `roll20-bridge.js` to match.
