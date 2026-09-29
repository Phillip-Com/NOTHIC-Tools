# Roll20 → Stat Tracker Bridge — Setup

Watches your Roll20 chat for dice rolls and pre-fills the matching action-queue
card in the tracker (Attack, Ability, Save, Concentration, or Initiative) —
you still click Confirm. Everything happens inside your own browser via
Tampermonkey; there's no server to run, no hosting, and no certificates.

## How it works

**One userscript, installed once, covers both tabs.** Tampermonkey's storage
(`GM_setValue`/`GM_getValue`) syncs across different websites for the same
script — so when it's running on your Roll20 game tab it watches the chat log
and writes parsed rolls into that shared storage, and when it's running on
your tracker tab (whether that's the GitHub Pages copy or a local one) it
notices the new data and pre-fills the matching queue card. No fetch, no
polling, no local process — Tampermonkey itself is the transport.

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

That's the whole install — this single script runs on both `*.roll20.net`
and the tracker's own domain (GitHub Pages, or `127.0.0.1`/`localhost` for
local testing), and behaves differently depending on which one it finds
itself on.

### 3. The tracker-side bridge is already wired in

`roll20-bridge.js` is already included by `index.html` — nothing to add
there. It's inert (does nothing, no errors) if the userscript isn't
installed, so it's safe to leave in permanently.

## Every time you play

1. Open the tracker in your browser as usual (GitHub Pages, or however you
   normally host it).
2. Open your Roll20 game in another tab.
3. Roll dice as normal in Roll20. Matched rolls should appear in the
   tracker's action queue, pre-filled, within a second or two.

No terminal, no server window to leave open — just the two tabs.

## Calibrating the userscript against your actual game (do this first)

The chat-parsing has been calibrated against real HTML pulled from an actual
game — character-sheet roll templates, NPC stat-block templates, a custom
"Elven Accuracy" triple-advantage macro, and plain `/roll` results — so it
should already match your game's structure. It's still worth a quick check
before you turn off debug mode, since character sheets and custom macros
vary:

1. Open `roll20-userscript.user.js` in Tampermonkey's editor and find
   `DEBUG_LOG_ONLY` inside the `runRoll20Watcher()` function near the top.
   Set it to `true` temporarily.
2. Play normally in Roll20 for a bit — make a few different kinds of rolls
   (an attack, a save, an ability check, an NPC attack, a bare `/roll 1d20`).
3. Open your browser's console (F12 → Console) **on the Roll20 tab**. You'll
   see a log line for every roll it detected, like:
   ```
   [roll20-bridge][DEBUG] parsed roll (not sent): {characterName: "Oravin", actionTypeGuess: "attack", roll: 17, modifier: 5, total: 22, rawText: "..."}
   ```
4. Check each one: is `characterName` right? Is `roll`/`modifier` split
   correctly? Is `actionTypeGuess` reasonable?
5. If something's off, the section marked `// ADJUST ME` in the script has
   `TEXT_KEYWORD_HINTS` — a keyword → roll type fallback used only for
   custom macros/labels that don't match Roll20's own sheet formatting
   (which is otherwise read directly from the message's structure, not
   guessed from text).
   - Right-click an actual roll result in Roll20's chat → Inspect, to see
     the real element structure and compare against what the script expects.
6. Once it looks right, set `DEBUG_LOG_ONLY` back to `false` and save. Rolls
   will now actually be sent to the tracker.

## What gets auto-filled vs. what needs manual routing

- **Attack, Ability, Save, Concentration, Initiative** — these can be fully
  auto-matched, but only against an **active** character on your roster
  (Set Active/Set Inactive, same toggle used elsewhere in the app): pre-filled
  into a new card, or merged as an extra row into one you already have open
  for that character. A roll from a name that matches a benched/inactive
  character is never silently applied to them.
- **Everything else** — a name that doesn't match any active character
  (including an inactive one), Damage, Heal, Money Spent, Spell, or a bare
  `/roll` with no identifiable purpose — lands in an **"Unmatched Roll20
  Rolls"** tray above the action queue instead of being guessed at. Pick the
  character and action from the dropdowns there and click **Route** — for the
  five types above this still pre-fills the value; for the others it opens
  the right card for you to fill in by hand (still saves you finding the
  right button). If the roll's character couldn't be matched to anyone
  active, the tray defaults the dropdown to your "NPC" pool character (if you
  have one and it's active) as a starting point — you still have to pick and
  click Route, nothing is applied automatically.

This is deliberate: a `/roll 1d20+5` typed with no label carries no
information about what it's *for* — there's no way to guess that reliably, so
it's surfaced for you to decide instead of silently filed somewhere wrong.

## Troubleshooting

- **Nothing shows up in the tracker at all**: open the console (F12) on
  BOTH tabs.
  - On the Roll20 tab, confirm you see
    `[roll20-bridge] SCRIPT VERSION 1.0.0 loaded on ... (Roll20 watcher mode)`
    and, when you roll, a `queued for tracker: ...` line. If you don't see
    the roll logged at all, the parsing didn't recognize that message shape —
    see the calibration section above.
  - On the tracker tab, confirm you see
    `[roll20-bridge] SCRIPT VERSION 1.0.0 loaded on ... (tracker drainer mode)`.
    If you don't see this line at all, the userscript either isn't installed/
    enabled, or its `@match` doesn't cover this exact URL — check the
    Tampermonkey dashboard's script list and the address bar's URL against
    the `@match` lines at the top of `roll20-userscript.user.js`.
- **Roll20 tab shows "queued for tracker" but the tracker never picks it
  up**: confirm `roll20-bridge.js` is actually loaded (check the tracker
  page's console for `[roll20-bridge] SCRIPT VERSION 0.9.0 loaded` from that
  file, a separate line from the userscript's own banner) and that
  `index.html` still has its `<script src="roll20-bridge.js"></script>` line.
- **Two copies of the same script running**: Tampermonkey dashboard →
  confirm there's exactly one "Stat Tracker - Roll20 Bridge" entry enabled.
  A duplicate (e.g. from re-pasting instead of editing) can cause
  double-counted rolls.
- **A roll from an active character still isn't matching**: the name match
  is exact (case/whitespace-insensitive) against your character roster —
  check for a typo in either the Roll20 sheet's character name or the
  tracker's roster entry. It'll land in the Unmatched tray either way, so
  nothing is lost — just route it manually and fix the name for next time.
