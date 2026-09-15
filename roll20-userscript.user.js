// ==UserScript==
// @name         Stat Tracker - Roll20 Relay
// @namespace    stat-tracker-roll20-relay
// @version      0.9.0
// @description  Watches Roll20 chat for dice rolls and relays them to a local Stat Tracker relay server.
// @match        https://app.roll20.net/*
// @match        https://*.roll20.net/*
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @connect      localhost
// @run-at       document-idle
// ==/UserScript==

/*
 * HOW THIS WORKS
 * --------------
 * 1. Watches Roll20's chat log (#textchat) for new messages.
 * 2. For each new message, decides whether it's a dice roll, pulls out
 *    who rolled + the value(s), and classifies what KIND of roll it was
 *    (attack / save / ability / etc.).
 * 3. POSTs that to your local relay server (roll20-relay-server.js) via
 *    GM_xmlhttpRequest, which the tracker page polls and turns into a
 *    pre-filled (never auto-confirmed) queue card.
 *
 * The parsing below was calibrated against real chat HTML pulled from an
 * actual game (character-sheet roll templates AND plain /roll results),
 * not guessed — see the PARSING section for the two message shapes it
 * specifically handles. Custom macros/labels it hasn't seen land in
 * "unknown" (routed to the tracker's Unmatched tray) rather than being
 * guessed at; if you hit one of those a lot, TEXT_KEYWORD_HINTS below is
 * the place to teach it.
 */

(function () {
  "use strict";

  // Unmistakable version banner — if you don't see this exact line in the
  // console right after a reload, Tampermonkey is running a stale/cached
  // copy of this script (or a second, older copy is also enabled — check
  // the Tampermonkey dashboard for duplicate "Stat Tracker - Roll20
  // Relay" entries and disable/delete all but one). Every fix so far has
  // relied on being able to tell these apart, so please quote this exact
  // line back if something still looks wrong.
  console.log("[roll20-relay] SCRIPT VERSION 0.9.0 loaded");

  // -------------------- CONFIG --------------------

  const RELAY_URL = "https://127.0.0.1:8787/ingest";

  // Start here. While true, every parsed chat message is logged to the
  // console (F12 -> Console) instead of being sent to the relay — use
  // this to check the parsing is picking up the right name/value/type
  // before you start relaying for real. Flip to false once it looks right.
  const DEBUG_LOG_ONLY = true;

  const CHAT_CONTAINER_SELECTOR = "#textchat";

  // -------------------- ADJUST ME --------------------
  // Custom macros or labels Roll20 doesn't structure the way its own
  // character sheet does fall back to this keyword scan. Checked in
  // order, first match wins.
  const TEXT_KEYWORD_HINTS = [
    [/\battack\b/i, "attack"],
    [/\bsav(e|ing throw)\b/i, "save"],
    [/\binitiative\b/i, "initiative"],
    [/\bconcentration\b/i, "concentration"],
    [/\b(ability|skill) check\b/i, "ability"],
    [/\bcheck\b/i, "ability"]
  ];

  // -------------------- PARSING --------------------
  //
  // Roll20 chat messages come in two shapes that matter here (confirmed
  // against real chat HTML, not guessed):
  //
  // 1. Character-sheet roll templates (attacks, ability/skill checks,
  //    saves, tool checks) — a `.sheet-rolltemplate-simple` containing a
  //    `.sheet-result .sheet-solo` (one or more `.inlinerollresult`
  //    spans holding the shown total(s)), a `.sheet-label` (e.g.
  //    "PERCEPTION (8)", "Shortsword (+12)"), and a `.sheet-charname`
  //    with the character's name — always present and reliable,
  //    including on whispers (whose `.by` line reads "(From X):" but
  //    whose `.sheet-charname` is just "X").
  // 2. Plain `/roll` results — `.message.rollresult` with `.formula`
  //    (what was typed), `.diceroll .didroll` (each individual die), and
  //    `.rolled` (the final total). There's no label at all here, so
  //    there's no way to guess what the roll was FOR — these always come
  //    back as actionTypeGuess "unknown" and land in the tracker's
  //    Unmatched tray rather than being guessed at.
  //
  // Other template types (`sheet-rolltemplate-spell`, `-spelloutput`,
  // `-default` — spell reference cards, DM session-question/AoE macros)
  // don't have a `.sheet-result .sheet-solo`, so they're skipped outright
  // even when they happen to contain a decorative `.inlinerollresult`.

  // Roll20 always shows an ability/skill/save modifier as a bare number
  // ("(8)", "(-1)") but an attack's to-hit bonus with an explicit leading
  // "+" even when positive ("(+12)", "(+7)") — confirmed against every
  // attack/check/tool-roll example seen so far. That leading "+" is what
  // actually distinguishes a weapon attack from a same-shaped tool/item
  // check like "Alchemy tools (7)" — casing alone isn't enough, since
  // tool/item roll labels are mixed-case too.
  function classifyLabel(labelText) {
    const match = labelText.match(/^(.+?)\s*\(([^)]*)\)\s*$/);
    if (!match) return classifyByKeyword(labelText);

    const label = match[1].trim();
    const paren = match[2].trim();
    const isAllCaps = label === label.toUpperCase() && /[A-Z]/.test(label);
    if (isAllCaps) return /\bSAVE\b/.test(label) ? "save" : "ability";
    if (/^\+\d+$/.test(paren)) return "attack";

    return classifyByKeyword(labelText);
  }

  function classifyByKeyword(text) {
    for (const [pattern, label] of TEXT_KEYWORD_HINTS) {
      if (pattern.test(text)) return label;
    }
    return "unknown";
  }

  // Roll20 HTML-encodes the tooltip `title` attribute; only the handful
  // of entities that actually show up in it need decoding.
  function decodeHtmlEntities(str) {
    return str
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'");
  }

  // The visible text on an `.inlinerollresult` is the roll's TOTAL
  // (already including every modifier) — the natural die value is only
  // available in its `title` tooltip, as a `basicdiceroll` span, e.g.
  // `title="...= (<span class="basicdiceroll">11</span>)+3+5"`. Reading
  // it directly here is more reliable than total-minus-label-modifier,
  // which breaks the moment a roll has more than one modifier source
  // (see extractTemplateRoll below).
  //
  // The Tipsy tooltip library (the "tipsy-n-right" class these spans
  // carry) renames `title` to `original-title` once it activates on an
  // element, to stop the browser's own native tooltip from showing
  // alongside its own — confirmed against a real message where the
  // ATTACK roll's span had `original-title` instead of `title` while
  // the DAMAGE roll right next to it in the same message still had
  // plain `title`. Whether that's happened yet is a timing accident, not
  // something tied to any particular roll type, so both are checked.
  // A roll with advantage/disadvantage (or an "Elven Accuracy"-style
  // triple-advantage macro rolling 3d20 and keeping the highest) shows
  // EVERY die rolled in the tooltip, with the ones NOT counted marked
  // with an extra "dropped" class — confirmed against a real
  // `(3d20kh1)+4+5` macro where two of the three basicdiceroll spans
  // carried "dropped" and only the third (the one actually kept) didn't.
  // Blindly taking the first match would grab a dropped die instead of
  // the one that actually counted, so every match is checked in order
  // and the first WITHOUT "dropped" wins.
  function extractBasicDiceRoll(inlineEl) {
    const title = inlineEl.getAttribute("title") || inlineEl.getAttribute("original-title") || "";
    const decoded = decodeHtmlEntities(title);
    const re = /class="basicdiceroll([^"]*)">(-?\d+)</g;
    let match;
    while ((match = re.exec(decoded))) {
      if (!match[1].includes("dropped")) return parseInt(match[2], 10);
    }
    return null;
  }

  // Rounds to 2dp only when there's actually a fractional part, to wipe
  // out floating-point noise (e.g. 18.12 - 17 = 1.1199999999999992)
  // without touching the overwhelming majority of plain-integer values.
  function roundIfFractional(n) {
    return Number.isInteger(n) ? n : Math.round(n * 100) / 100;
  }

  // Reads a roll's visible total. Almost always a plain integer, but 5e
  // sheets append a small fractional DEX-based tiebreaker to Initiative
  // specifically (e.g. "18.12") so ties sort deterministically — plain
  // parseInt would silently truncate that and lose the tiebreak, so this
  // preserves it instead.
  function parseRollTotal(text) {
    const n = parseFloat((text || "").trim());
    return isNaN(n) ? NaN : roundIfFractional(n);
  }

  // `.sheet-charname` is always present and clean for template rolls,
  // including whispers — falls back to `.by` only if a future template
  // type omits it.
  function extractTemplateCharName(msgEl) {
    const charnameEl = msgEl.querySelector(".sheet-charname");
    const nameSpan = charnameEl ? charnameEl.querySelector("span") : null;
    const name = (nameSpan ? nameSpan.textContent : charnameEl ? charnameEl.textContent : "").trim();
    if (name) return name;
    const byEl = msgEl.querySelector(".by");
    return byEl ? extractByName(byEl.textContent) : null;
  }

  // Cleans a plain `.by` span's text for the rollresult shape: strips the
  // trailing ":", unwraps "(From X):" whispers to just "X", and treats a
  // "(To ...)" whisper-target wrapper (no real name inside it at all) as
  // unresolvable rather than using the literal text as a name.
  function extractByName(rawBy) {
    if (!rawBy) return null;
    const name = rawBy.trim().replace(/:\s*$/, "");
    const fromMatch = name.match(/^\(From (.+)\)$/i);
    if (fromMatch) return fromMatch[1].trim();
    if (/^\(To .+\)$/i.test(name)) return null;
    return name || null;
  }

  // Shape 1: character-sheet roll templates (attack/ability/save/tool
  // checks) — see the block comment above.
  function extractTemplateRoll(msgEl) {
    const resultEl = msgEl.querySelector(".sheet-result");
    const soloEl = resultEl ? resultEl.querySelector(".sheet-solo") : null;
    if (!soloEl) return null;

    const inlineRolls = soloEl.querySelectorAll(".inlinerollresult");
    if (inlineRolls.length === 0) return null;

    // The displayed total can be split across more than one
    // `.inlinerollresult` (e.g. a d20 check "19" plus a separate flat
    // item bonus "+ 2") — summing all of them and reading the natural die
    // straight from the first one's tooltip handles that correctly
    // without needing to know how many bonus terms there are.
    let total = 0;
    for (const el of inlineRolls) {
      const n = parseRollTotal(el.textContent);
      if (!isNaN(n)) total += n;
    }
    total = roundIfFractional(total);

    const naturalRoll = extractBasicDiceRoll(inlineRolls[0]);
    const roll = naturalRoll !== null ? naturalRoll : total;
    const modifier = roundIfFractional(total - roll);

    const labelEl = msgEl.querySelector(".sheet-label");
    const labelText = labelEl ? (labelEl.textContent || "").replace(/\s+/g, " ").trim() : "";
    const characterName = extractTemplateCharName(msgEl);

    return {
      characterName,
      actionTypeGuess: classifyLabel(labelText),
      roll, modifier, total,
      rawText: (labelText ? `${labelText} — ` : "") + (characterName || "?")
    };
  }

  // Shape 2: plain `/roll` results — no label, so actionTypeGuess is
  // always "unknown" (there's no way to guess what a bare `/roll 1d20`
  // was FOR) and it always lands in the tracker's Unmatched tray.
  function extractRollResultMessage(msgEl) {
    const rolledEl = msgEl.querySelector(".rolled");
    if (!rolledEl) return null;
    const total = parseRollTotal(rolledEl.textContent);
    if (isNaN(total)) return null;

    const diceGroups = msgEl.querySelectorAll(".diceroll");
    const diceEls = [...diceGroups].map(g => g.querySelector(".didroll")).filter(Boolean);

    let roll = total;
    let modifier = 0;
    if (diceEls.length === 1) {
      const natural = parseInt((diceEls[0].textContent || "").trim(), 10);
      if (!isNaN(natural)) {
        roll = natural;
        modifier = roundIfFractional(total - natural);
      }
    }

    const byEl = msgEl.querySelector(".by");
    const characterName = byEl ? extractByName(byEl.textContent) : null;

    const formulaEl = msgEl.querySelector(".formula");
    const formulaText = formulaEl ? (formulaEl.textContent || "").trim() : "";

    return {
      characterName,
      actionTypeGuess: "unknown",
      roll, modifier, total,
      rawText: (formulaText ? `${formulaText} = ` : "") + total
    };
  }

  // Shapes 3-5: NPC roll templates — confirmed against real HTML from an
  // NPC's stat block sheet, structurally different from the PC "simple"
  // template above (no `.sheet-charname`/`.sheet-label`; the NPC's name
  // and the roll's label instead sit in a `.sheet-subheader`/
  // `.sheet-header` pair shared by all three of these NPC shapes).
  //
  // 3. `sheet-rolltemplate-npcfullatk` — a weapon attack AND its damage
  //    together in ONE message: an "ATTACK:"-labeled roll in the first
  //    `.sheet-container`, and a "DAMAGE:"-labeled roll in a second,
  //    separate `.sheet-container.sheet-dmgcontainer`. Since both values
  //    are right there, this reports `damage` directly on the parsed
  //    attack event instead of needing the same-character/short-window
  //    heuristic the bridge otherwise uses to guess which later roll a
  //    damage number belongs to.
  // 4. `sheet-rolltemplate-dmgaction` — a damage-only roll with no
  //    attack alongside it (e.g. a separate "bonus damage" button) — all
  //    in one `.sheet-container.sheet-dmgcontainer`, no plain container.
  //    Reported as actionTypeGuess "unknown" (same as any other
  //    unlabeled damage roll) so the bridge's same-character heuristic
  //    can still attach it to a pending attack if one's waiting.
  // 5. `sheet-rolltemplate-npc` — a single Save/Skill/Ability/Initiative
  //    roll, no `.sheet-container` wrapper at all. The roll's own row
  //    carries a plain-text prefix ("Save: ", "Skill: ", "Ability: ",
  //    "Initiative: ") that identifies the category directly — read
  //    that first rather than guessing from the header label text (which
  //    is Title Case here, not ALL CAPS like the PC template, so the
  //    PC-side caps-based classifier wouldn't apply to it anyway).

  function npcHeaderName(containerEl) {
    const headerEl = containerEl.querySelector(".sheet-header");
    const headerSpan = headerEl ? headerEl.querySelector("span") : null;
    return headerSpan ? headerSpan.textContent.trim() : "";
  }

  function npcSubheaderName(containerEl) {
    const subheaderEl = containerEl.querySelector(".sheet-subheader");
    const nameEl = subheaderEl ? subheaderEl.querySelector(".sheet-italics") : null;
    return nameEl ? nameEl.textContent.trim() : null;
  }

  function classifyNpcRowPrefix(prefixText) {
    const t = (prefixText || "").trim().toLowerCase();
    if (t.startsWith("save")) return "save";
    if (t.startsWith("skill")) return "ability";
    if (t.startsWith("ability")) return "ability";
    if (t.startsWith("initiative")) return "initiative";
    if (t.startsWith("attack")) return "attack";
    return null;
  }

  // Shape 5.
  function extractNpcSimpleRoll(msgEl) {
    const inline = msgEl.querySelector(".inlinerollresult");
    if (!inline) return null;
    const total = parseRollTotal(inline.textContent);
    if (isNaN(total)) return null;

    const natural = extractBasicDiceRoll(inline);
    const roll = natural !== null ? natural : total;
    const modifier = roundIfFractional(total - roll);

    const labelText = npcHeaderName(msgEl);
    const characterName = npcSubheaderName(msgEl);

    // The roll's own row is the LAST `.sheet-row` — header and subheader
    // are `.sheet-row` too, and both come before it in document order.
    const rollRow = [...msgEl.querySelectorAll(".sheet-row")].pop();
    const prefixEl = rollRow ? rollRow.querySelector(".sheet-italics") : null;
    const actionTypeGuess = classifyNpcRowPrefix(prefixEl && prefixEl.textContent) || classifyByKeyword(labelText);

    return {
      characterName,
      actionTypeGuess,
      roll, modifier, total,
      rawText: `${labelText} — ${characterName || "?"}`
    };
  }

  // Shape 3.
  function extractNpcFullAttackRoll(msgEl) {
    const containers = [...msgEl.querySelectorAll(".sheet-container")];
    const dmgContainer = containers.find(c => c.classList.contains("sheet-dmgcontainer"));
    const atkContainer = containers.find(c => c !== dmgContainer);
    if (!atkContainer) return null;

    const atkRow = [...atkContainer.querySelectorAll(".sheet-row")].pop();
    const atkInline = atkRow ? atkRow.querySelector(".inlinerollresult") : null;
    if (!atkInline) return null;
    const total = parseRollTotal(atkInline.textContent);
    if (isNaN(total)) return null;

    const natural = extractBasicDiceRoll(atkInline);
    const roll = natural !== null ? natural : total;
    const modifier = roundIfFractional(total - roll);

    let damage;
    const dmgInline = dmgContainer ? dmgContainer.querySelector(".inlinerollresult") : null;
    if (dmgInline) {
      const dmgTotal = parseRollTotal(dmgInline.textContent);
      if (!isNaN(dmgTotal)) damage = dmgTotal;
    }

    const labelText = npcHeaderName(atkContainer);
    const characterName = npcSubheaderName(atkContainer);

    return {
      characterName,
      actionTypeGuess: "attack",
      roll, modifier, total, damage,
      rawText: `${labelText} — ${characterName || "?"}${damage !== undefined ? ` (dmg ${damage})` : ""}`
    };
  }

  // Shape 4.
  function extractNpcDamageOnlyRoll(msgEl) {
    const container = msgEl.querySelector(".sheet-container");
    if (!container) return null;
    const inline = container.querySelector(".inlinerollresult");
    if (!inline) return null;
    const total = parseRollTotal(inline.textContent);
    if (isNaN(total)) return null;

    const natural = extractBasicDiceRoll(inline);
    const roll = natural !== null ? natural : total;
    const modifier = roundIfFractional(total - roll);

    const labelText = npcHeaderName(container);
    const characterName = npcSubheaderName(container);

    return {
      characterName,
      // No attack roll lives in this same message to attach the damage
      // to directly — "unknown" routes it through the bridge's
      // same-character/short-window heuristic instead (or, failing
      // that, the Unmatched tray).
      actionTypeGuess: "unknown",
      roll, modifier, total,
      rawText: `${labelText} — ${characterName || "?"}`
    };
  }

  // Whichever character's `.by` header was most recently seen — Roll20
  // groups consecutive same-sender messages under ONE header, omitting
  // `.by`/`.tstamp` on the follow-ups (confirmed throughout this whole
  // integration for the other template shapes, which all carry their own
  // repeated name marker regardless — but a custom `sheet-rolltemplate-
  // default` macro (see extractDefaultTemplateRoll) has no such marker
  // at all, so a grouped follow-up needs this fallback. Updated for
  // EVERY message that has a `.by`, not just rolls, since a plain chat
  // line can be what establishes the header a later roll gets grouped
  // under.
  let lastKnownSpeakerName = null;

  // Shape 6: `sheet-rolltemplate-default` — Roll20's official templates
  // (simple/npc/npcfullatk/dmgaction) all have dedicated structure this
  // script relies on, but a custom macro (confirmed against a real
  // "Elven Accuracy" triple-advantage attack button) falls back to this
  // generic one: a plain `<table>` of label/value rows, no dedicated
  // name element anywhere. This same template class is ALSO used for
  // genuinely non-roll content (a DM's session-question picker, an AoE
  // range-button macro) — distinguished here simply by whether any row's
  // value actually contains a real NUMERIC roll; if none does, this
  // returns null and the message is correctly skipped, same as those
  // other cases always have been.
  function extractDefaultTemplateRoll(msgEl) {
    const rows = [...msgEl.querySelectorAll("tr")];
    for (const row of rows) {
      const cells = [...row.querySelectorAll("td")];
      if (cells.length < 2) continue;
      const inline = cells[1].querySelector(".inlinerollresult");
      if (!inline) continue;
      const total = parseRollTotal(inline.textContent);
      if (isNaN(total)) continue; // e.g. the session-question picker's non-numeric "roll"

      const natural = extractBasicDiceRoll(inline);
      const roll = natural !== null ? natural : total;
      const modifier = roundIfFractional(total - roll);
      const labelText = (cells[0].textContent || "").trim();

      return {
        characterName: extractDefaultTemplateCharName(msgEl),
        actionTypeGuess: classifyByKeyword(labelText),
        roll, modifier, total,
        rawText: `${labelText} — ${total}`
      };
    }
    return null;
  }

  // Roll20 renders a "click to roll" link for any follow-up ability
  // (e.g. this macro's own "Roll if hit" damage button) as
  // `href="~<CharacterName>|<AbilityName>"` — a reliable, structural
  // name source that doesn't depend on message-grouping timing at all.
  // Falls back to `.by` (when this specific message isn't grouped away),
  // then to whichever speaker was last seen at all.
  function extractDefaultTemplateCharName(msgEl) {
    for (const link of msgEl.querySelectorAll("a")) {
      const href = link.getAttribute("href") || "";
      const match = href.match(/^~([^|]+)\|/);
      if (match) return match[1].trim();
    }
    const byEl = msgEl.querySelector(".by");
    if (byEl) {
      const name = extractByName(byEl.textContent);
      if (name) return name;
    }
    return lastKnownSpeakerName;
  }

  function parseMessage(msgEl) {
    let parsed = null;
    if (msgEl.querySelector(".sheet-result")) {
      parsed = extractTemplateRoll(msgEl);
    } else if (msgEl.querySelector(".sheet-container.sheet-dmgcontainer")) {
      const hasPlainContainer = [...msgEl.querySelectorAll(".sheet-container")]
        .some(c => !c.classList.contains("sheet-dmgcontainer"));
      parsed = hasPlainContainer ? extractNpcFullAttackRoll(msgEl) : extractNpcDamageOnlyRoll(msgEl);
    } else if (msgEl.querySelector(".sheet-row.sheet-header") && msgEl.querySelector(".sheet-row.sheet-subheader")) {
      parsed = extractNpcSimpleRoll(msgEl);
    } else if (msgEl.querySelector(".sheet-rolltemplate-default")) {
      parsed = extractDefaultTemplateRoll(msgEl);
    } else if (msgEl.classList && msgEl.classList.contains("rollresult")) {
      parsed = extractRollResultMessage(msgEl);
    }
    if (!parsed || !parsed.characterName) return null;

    return {
      characterName: parsed.characterName,
      // The tracker's roster-matching (resolveRoll20CharacterFromEvent in
      // roll20-bridge.js) tries every entry in this list — kept as an
      // array for that same interface, even though there's now exactly
      // one confident candidate per message instead of several guesses.
      nameCandidates: [parsed.characterName],
      actionTypeGuess: parsed.actionTypeGuess,
      roll: parsed.roll,
      modifier: parsed.modifier,
      total: parsed.total,
      // Only ever populated by the combined NPC attack+damage template,
      // where both values genuinely come from the same message —
      // undefined everywhere else.
      damage: parsed.damage,
      rawText: parsed.rawText.slice(0, 300)
    };
  }

  // -------------------- SEND --------------------

  function sendToRelay(payload) {
    if (DEBUG_LOG_ONLY) {
      // Logged as a single JSON string, not a live object reference —
      // devtools' expandable-object view is easy to mis-transcribe when
      // copy-pasting (fields from adjacent log entries can get
      // interleaved). This copies as one unambiguous block instead.
      console.log("[roll20-relay][DEBUG] parsed roll (not sent):\n" + JSON.stringify(payload, null, 2));
      return;
    }
    GM_xmlhttpRequest({
      method: "POST",
      url: RELAY_URL,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(payload),
      onerror: err => console.error("[roll20-relay] failed to reach relay server — is it running? (node roll20-relay-server.js)", err),
      ontimeout: () => console.error("[roll20-relay] relay server request timed out"),
      timeout: 5000
    });
  }

  // -------------------- WATCH CHAT --------------------

  function watchChat() {
    const chat = document.querySelector(CHAT_CONTAINER_SELECTOR);
    if (!chat) {
      console.warn(`[roll20-relay] couldn't find ${CHAT_CONTAINER_SELECTOR} — is this the game page? Retrying in 2s.`);
      setTimeout(watchChat, 2000);
      return;
    }

    console.log(`[roll20-relay] watching ${CHAT_CONTAINER_SELECTOR} for rolls. DEBUG_LOG_ONLY=${DEBUG_LOG_ONLY}`);

    // parseMessage expects an actual `.message` element (it checks
    // classList directly for the rollresult shape) — a mutation's added
    // node is usually one already, but on initial chat load Roll20 can
    // add the whole `.content` wrapper in one shot with many `.message`
    // children inside it, so both cases are handled here.
    function collectMessageElements(node) {
      const found = [];
      if (node.classList && node.classList.contains("message")) found.push(node);
      if (node.querySelectorAll) found.push(...node.querySelectorAll(".message"));
      return found;
    }

    // Roll20 can re-add a `.message` element that's already been seen
    // (e.g. when it regroups consecutive same-sender messages under a
    // shared header) — every message carries a unique `data-messageid`,
    // so that's used to skip anything already sent instead of relying on
    // the DOM only ever telling us about each message once.
    const seenMessageIds = new Set();

    // Anything already sitting in the chat log when we start watching is
    // scrollback from a previous session, not a new roll — mark it seen
    // up front so it's never (re)sent.
    collectMessageElements(chat).forEach(msgEl => {
      const id = msgEl.getAttribute && msgEl.getAttribute("data-messageid");
      if (id) seenMessageIds.add(id);
    });

    // Roll20's data-messageid values are Firebase push ids — a
    // well-documented format whose first 8 characters directly encode
    // the millisecond timestamp the id was created at (that's what makes
    // push ids sort chronologically). That's a far more reliable way to
    // tell "existing chat history" apart from "a roll that just happened"
    // than watching for a quiet gap in the DOM: Roll20 delivers
    // scrollback over a Firebase connection that itself can take several
    // seconds to establish, then renders potentially thousands of
    // messages via client-side templating — confirmed against a real
    // console log to have gaps in that render large enough to fool a
    // quiet-period timer no matter how it's tuned. A message's own
    // creation timestamp isn't affected by any of that rendering timing.
    const PUSH_ID_CHARS = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
    function decodeMessageTimestamp(messageId) {
      if (!messageId || messageId.length < 8) return null;
      let ts = 0;
      for (let i = 0; i < 8; i++) {
        const idx = PUSH_ID_CHARS.indexOf(messageId[i]);
        if (idx === -1) return null;
        ts = ts * 64 + idx;
      }
      return ts;
    }

    const watchStartedAtMs = Date.now();
    // A little slack for clock skew between this browser and whatever
    // clock stamped the message id — pushed FORWARD in time (a message
    // must be created more than this long AFTER watch-start to count as
    // live) rather than back. A roll made in the exact instant of a
    // reload is a vanishingly rare edge case; treating a moment of
    // already-old chat as "live" because of skew is the far worse
    // failure mode, so this deliberately errs toward calling borderline
    // messages historical.
    const CLOCK_SKEW_BUFFER_MS = 3000;
    const historyCutoffMs = watchStartedAtMs + CLOCK_SKEW_BUFFER_MS;

    console.log(`[roll20-relay] treating messages created before ${new Date(historyCutoffMs).toISOString()} as existing history (not relayed).`);

    // Fallback ONLY for the rare/hypothetical case a message id doesn't
    // decode as a Firebase push id at all (unexpected id format) — the
    // timestamp check above is the primary gate and doesn't depend on
    // this. Same quiet-period logic as before: don't start the countdown
    // until a message actually shows up, so a pre-connection idle period
    // isn't mistaken for "the burst finished". Both timers are armed
    // lazily, on first actual use, rather than unconditionally at
    // watch-start — otherwise the 15s safety cap fires (and logs) on a
    // fixed schedule every single session regardless of whether this
    // path is ever relevant, which is exactly what happened before this
    // comment existed: confirmed via a real console log where the
    // fallback's "reached" line printed on schedule despite every real
    // message that session decoding fine via the primary path above.
    let fallbackHistoryLoaded = false;
    let fallbackEverUsed = false;
    let quietTimer = null;
    let maxWaitTimer = null;
    const HISTORY_QUIET_MS = 1200;
    const HISTORY_MAX_WAIT_MS = 15000;

    function markFallbackHistoryLoaded() {
      if (fallbackHistoryLoaded) return;
      fallbackHistoryLoaded = true;
      if (quietTimer) clearTimeout(quietTimer);
      if (maxWaitTimer) clearTimeout(maxWaitTimer);
      if (fallbackEverUsed) {
        console.log("[roll20-relay] fallback history-quiet-period reached (used only for messages with a non-decodable id).");
      }
    }

    function pushBackHistoryQuietDeadline() {
      if (fallbackHistoryLoaded) return;
      fallbackEverUsed = true;
      if (quietTimer) clearTimeout(quietTimer);
      quietTimer = setTimeout(markFallbackHistoryLoaded, HISTORY_QUIET_MS);
      if (!maxWaitTimer) maxWaitTimer = setTimeout(markFallbackHistoryLoaded, HISTORY_MAX_WAIT_MS);
    }

    const observer = new MutationObserver(mutations => {
      // Only tracks messages that actually NEEDED the fallback (a
      // non-decodable id) — a normal message decoding fine via the
      // primary path above has nothing to do with this timer at all, and
      // must never arm or extend it.
      let sawUndecodableMessageThisBatch = false;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue; // element nodes only
          for (const msgEl of collectMessageElements(node)) {
            const messageId = msgEl.getAttribute && msgEl.getAttribute("data-messageid");
            if (messageId) {
              if (seenMessageIds.has(messageId)) continue;
              seenMessageIds.add(messageId);
            }

            // Tracked for EVERY message (not just rolls, and regardless
            // of historical-vs-live below) — a plain chat line can be
            // what establishes the header a later grouped roll needs
            // (see extractDefaultTemplateCharName).
            const byEl = msgEl.querySelector(".by");
            if (byEl) {
              const name = extractByName(byEl.textContent);
              if (name) lastKnownSpeakerName = name;
            }

            const createdAtMs = decodeMessageTimestamp(messageId);
            if (createdAtMs === null) sawUndecodableMessageThisBatch = true;
            const isHistorical = createdAtMs !== null
              ? createdAtMs < historyCutoffMs
              : !fallbackHistoryLoaded;
            if (isHistorical) continue;

            const parsed = parseMessage(msgEl);
            if (parsed) {
              sendToRelay(parsed);
              // Also updates from a resolved roll directly, not just a
              // raw `.by` header — a PC's normal roll carries its own
              // name via `.sheet-charname` and never touches `.by` at
              // all, but still establishes who the running speaker is
              // for a LATER grouped default-template macro that has
              // neither.
              lastKnownSpeakerName = parsed.characterName;
            }
          }
        }
      }
      // Only a batch that actually contained an undecodable-id message
      // starts/extends the fallback quiet countdown — idle time, or a
      // batch full of normal decodable messages, must never be mistaken
      // for "the fallback-relevant burst just finished".
      if (!fallbackHistoryLoaded && sawUndecodableMessageThisBatch) pushBackHistoryQuietDeadline();
    });

    observer.observe(chat, { childList: true, subtree: true });
  }

  watchChat();
})();
