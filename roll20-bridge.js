// -------------------- ROLL20 BRIDGE (opt-in, not loaded by default) --------------------
// Polls roll20-relay-server.js for rolls the Roll20 userscript captured, and
// feeds them into the existing action queue exactly as if you'd clicked the
// action button and typed the roll in yourself — pre-filled, never
// auto-confirmed. You still click Confirm.
//
// To enable: add this line to index.html, AFTER tracker.js:
//   <script src="roll20-bridge.js"></script>
// Requires roll20-relay-server.js running (`node roll20-relay-server.js`)
// and the Roll20 userscript installed and active in your Roll20 tab.
//
// Depends on globals defined in tracker.js: gameData, actionQueue,
// findQueueItem, enqueueOrFocusAction, focusQueueItem, buildMultiRollCard,
// applyAttackRolls/applyAbilityRolls/applySaveRolls/applyConcentrationRolls/
// applyInitiativeRolls, handlerMap, showTrackerMessage. Load this file after
// tracker.js so all of those already exist.

const ROLL20_RELAY_URL = "http://127.0.0.1:8787";
const ROLL20_POLL_INTERVAL_MS = 1500;

// Unmistakable version banner, printed on THIS page (the tracker tab) —
// every previous debugging round only ever checked the Roll20 tab's
// console, where the userscript's own version banner shows up, but
// roll20-bridge.js runs here instead and had no equivalent of its own.
// If you don't see this exact line in the tracker tab's console after a
// reload, this file is stale/not loaded — check for it here, not on the
// Roll20 tab.
console.log("[roll20-bridge] SCRIPT VERSION 0.9.0 loaded");

// Roll20-side classification guesses that map onto the queue's five
// multi-roll action types — these are the only ones that support
// pre-filling AND merging into an already-open card, since they're the
// only card type with addExternalRoll (see buildMultiRollCardBody in
// tracker.js). Anything else (a bare /roll, a damage roll, an
// unrecognized label) lands in the Unmatched tray below instead of being
// silently guessed at.
const ROLL20_ACTION_MAP = {
  attack: "Attack",
  ability: "Ability",
  check: "Ability",
  skill: "Ability",
  save: "Save",
  saving_throw: "Save",
  concentration: "Concentration",
  initiative: "Initiative"
};

const ROLL20_BUILDERS = {
  Attack: name => buildMultiRollCard("Attack", name, "Attack", true, applyAttackRolls),
  Ability: name => buildMultiRollCard("Ability", name, "Ability", false, applyAbilityRolls),
  Save: name => buildMultiRollCard("Save", name, "Save", false, applySaveRolls),
  Concentration: name => buildMultiRollCard("Concentration", name, "Concentration", false, applyConcentrationRolls),
  Initiative: name => buildMultiRollCard("Initiative", name, "Initiative", false, applyInitiativeRolls)
};

let roll20UnmatchedRolls = [];
let roll20PollTimer = null;
let roll20RelayOnline = null; // null = unknown yet, true/false once checked

// -------------------- NAME MATCHING --------------------

// Exact (case/whitespace-insensitive) match against ACTIVE characters
// ONLY, deliberately on both counts: a wrong fuzzy match would silently
// attribute a roll to the wrong character (worse than not matching at
// all), and a name that happens to match a character who's been
// benched/marked inactive shouldn't get silently attributed to them
// either — see resolveRoll20Target below for what happens to a roll
// that doesn't match anyone currently active.
function resolveRoll20Character(rawName) {
  if (!rawName) return null;
  const normalized = rawName.trim().toLowerCase();
  return getActiveCharacters().find(c => c.trim().toLowerCase() === normalized) || null;
}

// The userscript can't tell which line of a roll message is the actual
// character name (its position varies by roll-template type) — it sends
// every plausible line as a candidate instead, and this tries each one
// against the real roster until one matches. Falls back to the single
// legacy characterName field if nameCandidates wasn't sent.
function resolveRoll20CharacterFromEvent(evt) {
  const candidates = Array.isArray(evt.nameCandidates) && evt.nameCandidates.length
    ? evt.nameCandidates
    : [evt.characterName];
  for (const candidate of candidates) {
    const match = resolveRoll20Character(candidate);
    if (match) return match;
  }
  return null;
}

// What the Unmatched tray's character dropdown should default to for a
// roll that couldn't be silently applied (no active exact-name match at
// all — including a name that matches someone who's since been marked
// inactive, which must NEVER auto-apply — or an unclassifiable action
// type): the real active match if there is one, else the "NPC" pool if
// THAT'S active (this app's existing convention for pooling
// unidentified combatants, already used for Initiative), else null if
// there's nothing sensible to even suggest. This is purely a starting
// point for the dropdown — Route still has to be clicked, same as any
// other entry (see renderRoll20UnmatchedTray). ingestRoll20Event
// discards the roll outright when this returns null, rather than
// surfacing it in the tray with no sensible default at all.
function resolveRoll20TrayDefault(characterName) {
  if (characterName) return characterName;
  return getActiveCharacters().includes("NPC") ? "NPC" : null;
}

// -------------------- INGEST --------------------

// Roll20 posts a damage roll as its own separate chat message — there's
// no structural link back to the attack roll it belongs to, and its
// label is whatever the player's damage macro is named (often nothing
// like the weapon name, e.g. a "Crit Sword" bonus-damage button), so it
// almost always comes through as actionTypeGuess "unknown". This tracks
// the most recent Attack roll per character so the NEXT unknown roll
// from that same character, within a short window, is treated as that
// attack's damage instead of being routed to the Unmatched tray. It's a
// same-character/short-time-window heuristic, not a certainty — an
// unrelated tool/item check rolled right after an attack could get
// mistaken for its damage, which is exactly why this only ever pre-fills
// the Dmg field rather than confirming anything automatically.
let pendingAttackDamageTarget = null; // { characterName, expiresAt }
const ATTACK_DAMAGE_WINDOW_MS = 20000;

function ingestRoll20Event(evt) {
  // Active-only exact-name match (see resolveRoll20Character) — a name
  // matching someone who's since been marked inactive comes back null
  // here, same as a name matching nobody at all, so it can never be
  // silently applied to them.
  const characterName = resolveRoll20CharacterFromEvent(evt);
  const actionType = ROLL20_ACTION_MAP[(evt.actionTypeGuess || "").toLowerCase()];

  if (characterName && (evt.actionTypeGuess || "").toLowerCase() === "unknown" &&
      pendingAttackDamageTarget &&
      pendingAttackDamageTarget.characterName === characterName &&
      Date.now() < pendingAttackDamageTarget.expiresAt) {
    pendingAttackDamageTarget = null;
    const attackItem = findQueueItem("Attack", characterName);
    if (attackItem && attackItem.setLastRowDamage) {
      attackItem.setLastRowDamage(evt.total ?? evt.roll ?? 0);
      focusQueueItem(attackItem.id);
      showTrackerMessage(`Roll20: added a damage roll to ${characterName}'s pending Attack card.`);
      return;
    }
    // The Attack card this would have belonged to is already gone
    // (confirmed/canceled) — fall through and handle it as a normal,
    // unrelated unknown roll instead.
  }

  if (characterName && actionType) {
    applyRoll20Roll(characterName, actionType, evt);

    // Some NPC attack rolls arrive with their damage already known (the
    // combined attack+damage template — see the userscript's
    // extractNpcFullAttackRoll) — no need for the same-character
    // guessing heuristic in that case, and leaving it armed would risk a
    // LATER, genuinely unrelated roll overwriting an already-correct
    // value.
    if (actionType === "Attack" && evt.damage === undefined) {
      pendingAttackDamageTarget = { characterName, expiresAt: Date.now() + ATTACK_DAMAGE_WINDOW_MS };
    }
    return;
  }

  // Either the name didn't match anyone currently active, or we don't
  // know what kind of roll this was — either way a human needs to
  // confirm before anything gets applied. Goes to the Unmatched tray
  // with a sensible default pre-selected if there is one (a real match,
  // or the NPC pool); if there's genuinely nothing to suggest, it's
  // discarded rather than left cluttering the tray with a character
  // question nobody can answer.
  const trayDefault = resolveRoll20TrayDefault(characterName);
  if (!trayDefault) return;

  roll20UnmatchedRolls.push({ ...evt, _resolvedCharacterName: trayDefault, _id: `unmatched-${Date.now()}-${Math.random().toString(36).slice(2)}` });
  renderRoll20UnmatchedTray();
}

function applyRoll20Roll(characterName, actionType, evt) {
  const rollValue = { roll: evt.roll ?? 1, modifier: evt.modifier ?? 0, damage: evt.damage };
  const existing = findQueueItem(actionType, characterName);

  if (existing && existing.addExternalRoll) {
    existing.addExternalRoll(rollValue);
    focusQueueItem(existing.id);
    showTrackerMessage(`Roll20: added a ${actionType} roll to ${characterName}'s pending card.`);
    return;
  }

  const builder = ROLL20_BUILDERS[actionType];
  if (!builder) return; // Damage/Heal/Money/Spell/Times Killed aren't wired for pre-fill yet — see README note.

  enqueueOrFocusAction(actionType, characterName, builder);

  const created = findQueueItem(actionType, characterName);
  if (created) {
    if (actionType === "Attack") {
      // enqueueOrFocusAction just built a brand-new Attack card defaulted
      // to the character sheet's Attacks/Turn count (e.g. 2 or 3 rows) —
      // this incoming roll is ONE specific attack that already happened,
      // not a request to pre-fill that many rows, so it's collapsed down
      // to exactly 1 row first. Dispatching "input" re-triggers the
      // card's own rebuildRows() the same way typing in the field would.
      const countInput = [...created.bodyEl.querySelectorAll("input")].filter(i => i.type === "number")[0];
      if (countInput) {
        countInput.value = 1;
        countInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    // Re-query — rebuildRows() above may have replaced the row elements.
    const numberInputs = [...created.bodyEl.querySelectorAll("input")].filter(i => i.type === "number");
    // numberInputs[0] is the "Number of Rolls" count input; [1]/[2]/[3]
    // are the first row's D20/Modifier/Damage fields (Damage only exists
    // for Attack cards).
    if (numberInputs[1]) numberInputs[1].value = rollValue.roll;
    if (numberInputs[2]) numberInputs[2].value = rollValue.modifier;
    if (actionType === "Attack" && rollValue.damage !== undefined && numberInputs[3]) {
      numberInputs[3].value = rollValue.damage;
    }
  }
  showTrackerMessage(`Roll20: queued a new ${actionType} card for ${characterName}, pre-filled — confirm when ready.`);
}

// -------------------- UNMATCHED ROLLS TRAY --------------------
// Rolls the bridge couldn't confidently place (unknown character name,
// or a roll type with no clear mapping — bare /roll commands land here
// too, since there's no way to guess their purpose). You pick the
// character + action manually; it's then routed through the same path
// as an auto-matched roll.

function removeRoll20UnmatchedEntry(id) {
  roll20UnmatchedRolls = roll20UnmatchedRolls.filter(r => r._id !== id);
  renderRoll20UnmatchedTray();
}

function routeRoll20UnmatchedEntry(id, characterName, actionType) {
  const entry = roll20UnmatchedRolls.find(r => r._id === id);
  if (!entry || !characterName || !actionType) return;

  if (ROLL20_BUILDERS[actionType]) {
    applyRoll20Roll(characterName, actionType, entry);
  } else if (handlerMap[actionType]) {
    // Damage/Heal/Money Spent/Spell/Times Killed: open the right card,
    // but it won't be pre-filled — still saves you the click to find it.
    handlerMap[actionType](characterName);
    showTrackerMessage(`Roll20: opened a ${actionType} card for ${characterName} — this type isn't pre-filled yet, enter the value manually.`);
  }

  removeRoll20UnmatchedEntry(id);
}

function ensureRoll20TrayContainer() {
  let tray = document.getElementById("roll20-unmatched-tray");
  if (tray) return tray;

  tray = document.createElement("div");
  tray.id = "roll20-unmatched-tray";
  tray.className = "panel";
  // Plain document flow, not a floating overlay — an earlier version
  // used `position:fixed`, which sat on top of other buttons/modals
  // instead of alongside them. And deliberately NOT nested inside
  // .tracker-left / #tracker-center / #side-stats — a CSS rule
  // force-hides #tracker-center (and switchTab() explicitly hides
  // #side-stats) while the Character Sheets or Summary tab is active
  // (reasonable for those two, but wrong here: confirmed as the actual
  // cause of a real report — Roll20 rolls, especially NPC ones you
  // might be looking up on the Character Sheets tab while the DM runs
  // that NPC's turn, kept building up correctly in memory the whole
  // time but stayed completely invisible until switching back to
  // Combat/Stats revealed the entire backlog at once).
  //
  // Inserted instead as a sibling immediately BEFORE .tracker-layout —
  // that grid (holding all three of the above) is itself never hidden
  // by switchTab(), only its individual children are, so a sibling of
  // it stays visible across every tracker sub-tab without needing any
  // fixed/floating positioning at all.
  tray.style.cssText = "margin:0 0 16px;max-height:40vh;overflow-y:auto;display:none;";

  const layout = document.querySelector(".tracker-layout");
  if (layout && layout.parentNode) {
    layout.parentNode.insertBefore(tray, layout);
  } else {
    // Layout not found (shouldn't normally happen) — still show it
    // somewhere rather than silently failing to render at all.
    document.body.appendChild(tray);
  }
  return tray;
}

function renderRoll20UnmatchedTray() {
  const tray = ensureRoll20TrayContainer();
  if (!tray) return;

  if (roll20UnmatchedRolls.length === 0) {
    tray.style.display = "none";
    tray.innerHTML = "";
    return;
  }
  tray.style.display = "block";
  tray.innerHTML = "";

  const title = document.createElement("h3");
  title.textContent = `Unmatched Roll20 Rolls (${roll20UnmatchedRolls.length})`;
  title.style.cssText = "margin:0 0 10px;color:var(--secondary-text);font-size:0.95rem;text-transform:uppercase;letter-spacing:0.05em;";
  tray.appendChild(title);

  roll20UnmatchedRolls.forEach(entry => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 0;border-top:1px solid var(--surfaces);";

    const label = document.createElement("span");
    label.style.cssText = "flex:1 1 200px;font-size:0.85rem;overflow-wrap:anywhere;";
    label.textContent = `"${entry.characterName}" — ${entry.rawText || `roll: ${entry.roll ?? entry.total ?? "?"}`}`;
    row.appendChild(label);

    const charSelect = document.createElement("select");
    charSelect.style.cssText = "min-width:0;";
    const blankChar = document.createElement("option");
    blankChar.value = "";
    blankChar.textContent = "-- Character --";
    charSelect.appendChild(blankChar);
    // An entry only ever reaches this tray once its character question
    // is already answered (see ingestRoll20Event / resolveRoll20Target —
    // a name matching nobody active gets resolved to the NPC pool or
    // discarded outright before this point), so _resolvedCharacterName
    // is always a valid active character here — just pre-select it.
    // Only characters currently marked active (the same "Set Active" /
    // "Set Inactive" toggle already used everywhere else in the app) are
    // offered at all — a retired/benched character shouldn't be a
    // routing target for a roll that just happened live.
    const activeCharacters = getActiveCharacters();
    activeCharacters.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      if (entry._resolvedCharacterName === name) opt.selected = true;
      charSelect.appendChild(opt);
    });
    row.appendChild(charSelect);

    const actionSelect = document.createElement("select");
    actionSelect.style.cssText = "min-width:0;";
    const blankAction = document.createElement("option");
    blankAction.value = "";
    blankAction.textContent = "-- Action --";
    actionSelect.appendChild(blankAction);
    Object.keys(handlerMap).forEach(label => {
      const opt = document.createElement("option");
      opt.value = label;
      opt.textContent = label;
      const guessed = ROLL20_ACTION_MAP[(entry.actionTypeGuess || "").toLowerCase()];
      if (guessed === label) opt.selected = true;
      actionSelect.appendChild(opt);
    });
    row.appendChild(actionSelect);

    const routeBtn = document.createElement("button");
    routeBtn.textContent = "Route";
    routeBtn.onclick = () => routeRoll20UnmatchedEntry(entry._id, charSelect.value, actionSelect.value);
    row.appendChild(routeBtn);

    const dismissBtn = document.createElement("button");
    dismissBtn.textContent = "Dismiss";
    dismissBtn.className = "queue-cancel-btn";
    dismissBtn.onclick = () => removeRoll20UnmatchedEntry(entry._id);
    row.appendChild(dismissBtn);

    tray.appendChild(row);
  });
}

// -------------------- POLLING --------------------

// Shared by both the Worker-based path and the main-thread fallback
// below — whichever one actually did the fetch, the resulting rolls get
// ingested the exact same way.
function handlePolledRolls(rolls) {
  roll20RelayOnline = true;
  // A bug while ingesting one roll must not get silently swallowed as
  // "relay offline" (indistinguishable, otherwise) — log it and keep
  // processing the rest of the batch.
  (rolls || []).forEach(evt => {
    try {
      ingestRoll20Event(evt);
    } catch (err) {
      console.error("[roll20-bridge] failed to ingest a roll:", err, evt);
    }
  });
}

async function pollRoll20Relay() {
  let data;
  try {
    const res = await fetch(`${ROLL20_RELAY_URL}/pending`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    // Relay not running yet, or not running at all — quietly stay
    // offline rather than spamming errors every 1.5s. See
    // isRoll20RelayOnline() if you want to surface this in the UI.
    if (roll20RelayOnline !== false) console.log(`[roll20-bridge] poll failed @ ${new Date().toISOString()} — relay unreachable:`, err.message);
    roll20RelayOnline = false;
    return;
  }
  handlePolledRolls(data.rolls);
}

let roll20Worker = null;

// A plain main-thread setInterval gets THROTTLED by the browser the
// moment this tab isn't the visible one — e.g. you're actively looking
// at the Roll20 tab in the same window instead. Confirmed against a real
// report: rolls sat ingested on the relay server but didn't reach the
// tracker until switching back to this tab, which "woke up" the stalled
// interval and flushed the backlog all at once. A dedicated Worker's own
// timers are NOT subject to that same background-tab throttling (it's
// tied to page visibility, and a worker isn't "a page"), so the actual
// fetch-on-an-interval loop runs there instead — this thread only
// receives the already-fetched rolls via postMessage and ingests them
// exactly as pollRoll20Relay always has.
function startWorkerPolling() {
  const workerSrc = `
    self.onmessage = (e) => {
      if (e.data.type !== "start") return;
      const { url, intervalMs } = e.data;
      const poll = () => {
        fetch(url + "/pending")
          .then(res => { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
          .then(data => self.postMessage({ type: "rolls", rolls: data.rolls || [] }))
          .catch(() => self.postMessage({ type: "offline" }));
      };
      poll();
      setInterval(poll, intervalMs);
    };
  `;
  const worker = new Worker(URL.createObjectURL(new Blob([workerSrc], { type: "application/javascript" })));
  worker.onmessage = e => {
    if (e.data.type === "rolls") handlePolledRolls(e.data.rolls);
    else if (e.data.type === "offline") {
      if (roll20RelayOnline !== false) console.log(`[roll20-bridge] poll failed @ ${new Date().toISOString()} — relay unreachable from worker.`);
      roll20RelayOnline = false;
    }
  };
  worker.onerror = err => {
    console.error("[roll20-bridge] polling worker failed, falling back to main-thread polling (subject to background-tab throttling):", err);
    worker.terminate();
    roll20Worker = null;
    startMainThreadPolling();
  };
  worker.postMessage({ type: "start", url: ROLL20_RELAY_URL, intervalMs: ROLL20_POLL_INTERVAL_MS });
  console.log("[roll20-bridge] polling via a Web Worker (not subject to background-tab throttling).");
  return worker;
}

function startMainThreadPolling() {
  if (roll20PollTimer) return; // already running
  roll20PollTimer = setInterval(pollRoll20Relay, ROLL20_POLL_INTERVAL_MS);
  pollRoll20Relay(); // don't wait for the first interval tick
}

function startRoll20Bridge() {
  if (roll20PollTimer || roll20Worker) return; // already running

  // A one-time priming request made directly by THIS page, before
  // polling gets handed off to the Worker below — confirmed against a
  // real report where the tracker's own script loaded and the Worker
  // started fine on the GitHub Pages deployment, but every poll failed
  // with "relay unreachable" there specifically (Live Server, loopback
  // talking to loopback, never hit this at all). When the tracker is
  // served over HTTPS from a public origin, Chrome gates a fetch to a
  // local address (127.0.0.1) behind a "wants to access devices on your
  // local network" permission — and that prompt is page UI, which a
  // Worker has no way to show at all. Making this first request from the
  // page itself gives the browser a chance to ask; its own result here
  // doesn't matter; the goal is just prompting.
  fetch(`${ROLL20_RELAY_URL}/health`).catch(() => {});

  if (typeof Worker !== "undefined") {
    roll20Worker = startWorkerPolling();
  } else {
    // Some embedding context without Worker support — still works,
    // just not immune to background-tab throttling.
    console.log("[roll20-bridge] Worker unavailable — polling on the main thread (subject to background-tab throttling).");
    startMainThreadPolling();
  }
}

function stopRoll20Bridge() {
  if (roll20PollTimer) clearInterval(roll20PollTimer);
  roll20PollTimer = null;
  if (roll20Worker) {
    roll20Worker.terminate();
    roll20Worker = null;
  }
}

document.addEventListener("DOMContentLoaded", startRoll20Bridge);
