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

// Exact (case/whitespace-insensitive) match only, deliberately — a wrong
// fuzzy match would silently attribute a roll to the wrong character,
// which is worse than routing it to the Unmatched tray for a human to
// resolve in two clicks.
function resolveRoll20Character(rawName) {
  if (!rawName || !gameData?.characters) return null;
  const normalized = rawName.trim().toLowerCase();
  return gameData.characters.find(c => c.trim().toLowerCase() === normalized) || null;
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

  if (!characterName || !actionType) {
    roll20UnmatchedRolls.push({ ...evt, _id: `unmatched-${Date.now()}-${Math.random().toString(36).slice(2)}` });
    renderRoll20UnmatchedTray();
    return;
  }

  applyRoll20Roll(characterName, actionType, evt);

  if (actionType === "Attack") {
    pendingAttackDamageTarget = { characterName, expiresAt: Date.now() + ATTACK_DAMAGE_WINDOW_MS };
  }
}

function applyRoll20Roll(characterName, actionType, evt) {
  const rollValue = { roll: evt.roll ?? 1, modifier: evt.modifier ?? 0 };
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
    // numberInputs[0] is the "Number of Rolls" count input; [1]/[2] are
    // the first row's D20/Modifier fields.
    if (numberInputs[1]) numberInputs[1].value = rollValue.roll;
    if (numberInputs[2]) numberInputs[2].value = rollValue.modifier;
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

  const center = document.getElementById("tracker-center");
  if (!center) return null;

  tray = document.createElement("div");
  tray.id = "roll20-unmatched-tray";
  tray.className = "panel";
  tray.style.cssText = "margin-bottom:15px;display:none;";
  // Insert above the action queue so it's the first thing you see.
  center.insertBefore(tray, center.firstChild);
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
    const matchedCharacter = resolveRoll20CharacterFromEvent(entry);
    // No confident match against the real roster — if you've set up an
    // "NPC" character (this app's existing convention for pooling
    // unidentified combatants' stats together, already used for
    // Initiative), default the dropdown to it instead of leaving the
    // selection blank. This only changes what's pre-selected — Route
    // still has to be clicked, same as any other entry, so a name that
    // was actually meant for a real player character (e.g. a typo) can
    // still be caught and corrected before anything is applied.
    const defaultToNpc = !matchedCharacter && (gameData?.characters || []).includes("NPC");
    (gameData?.characters || []).forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      if (matchedCharacter === name || (defaultToNpc && name === "NPC")) opt.selected = true;
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

async function pollRoll20Relay() {
  let data;
  try {
    const res = await fetch(`${ROLL20_RELAY_URL}/pending`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
    roll20RelayOnline = true;
  } catch (err) {
    // Relay not running yet, or not running at all — quietly stay
    // offline rather than spamming errors every 1.5s. See
    // isRoll20RelayOnline() if you want to surface this in the UI.
    roll20RelayOnline = false;
    return;
  }

  // Deliberately OUTSIDE the network try/catch above: a bug while
  // ingesting one roll must not get silently swallowed as "relay
  // offline" (indistinguishable, otherwise) — log it and keep
  // processing the rest of the batch.
  (data.rolls || []).forEach(evt => {
    try {
      ingestRoll20Event(evt);
    } catch (err) {
      console.error("[roll20-bridge] failed to ingest a roll:", err, evt);
    }
  });
}

function startRoll20Bridge() {
  if (roll20PollTimer) return; // already running
  roll20PollTimer = setInterval(pollRoll20Relay, ROLL20_POLL_INTERVAL_MS);
  pollRoll20Relay(); // don't wait for the first interval tick
}

function stopRoll20Bridge() {
  if (roll20PollTimer) clearInterval(roll20PollTimer);
  roll20PollTimer = null;
}

document.addEventListener("DOMContentLoaded", startRoll20Bridge);
