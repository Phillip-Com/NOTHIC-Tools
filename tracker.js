if (typeof window.CodePen === "undefined") window.CodePen = {};

// -------------------- GLOBAL STATE --------------------
let gameData = null;
let trackerStarted = false;
let selectedCharacter = null;
let initiativeOrder = [];
let currentTurnIndex = 0;
let combatStarted = false;
let npcCount = 0;
let selectedTag = null;
let reactionMode = false;
let reactionCharacter = null;
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyhNcQCF2OZWlhH1o6nIgoyBLxV0ZOCZ43AQGUeYz6AAeHKrI3II4f0KLIIfwComAt8XQ/exec";
const ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"];
const ABILITY_LABELS = { str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA" };

// -------------------- DND 5E SKILLS --------------------
const DND5E_SKILLS = [
  { name: "Acrobatics", ability: "dex" },
  { name: "Animal Handling", ability: "wis" },
  { name: "Arcana", ability: "int" },
  { name: "Athletics", ability: "str" },
  { name: "Deception", ability: "cha" },
  { name: "History", ability: "int" },
  { name: "Insight", ability: "wis" },
  { name: "Intimidation", ability: "cha" },
  { name: "Investigation", ability: "int" },
  { name: "Medicine", ability: "wis" },
  { name: "Nature", ability: "int" },
  { name: "Perception", ability: "wis" },
  { name: "Performance", ability: "cha" },
  { name: "Persuasion", ability: "cha" },
  { name: "Religion", ability: "int" },
  { name: "Sleight of Hand", ability: "dex" },
  { name: "Stealth", ability: "dex" },
  { name: "Survival", ability: "wis" },
];

// Proficiency types: "none" | "proficient" | "expertise"
// Each skill/save also has a miscBonus (number)

document.addEventListener("visibilitychange", () => {
  if (document.hidden) saveGameData("tab hidden");
});

window.addEventListener("beforeunload", () => {
  saveGameData("before unload");
});


// -------------------- INITIALIZATION --------------------
function saveGameData(reason = "auto") {
  console.log("SAVE CALLED", reason);
  if (!trackerStarted || !gameData) return;

  gameData.__lastSaved = {
    reason,
    time: new Date().toISOString()
  };

  window.userData.tracker.gameData = gameData;

  saveUserData();
}

function createDefaultGameData() {
  return {
    trackerStarted: false,
    sessionNumber: 1,

    characters: [],

    activeCharacter: null,

    scriptUrl: "",
    deploymentID: "",
    sheetId: "",

    settings: {
      theme: "dark"
    }
  };
}

function init() {
  loadSpellDatabase();

  gameData =
    window.userData?.tracker?.gameData ??
    createDefaultGameData();

  window.gameData = gameData;

  gameData.characters ??= [];
  gameData.characterStats ??= {};
  gameData.characterSheets ??= {};
  gameData.settings ??= { theme: "dark" };

  trackerStarted = true;

  setupTabs();

  const combatToggleBtn = document.getElementById("combat-toggle-btn");
  if (combatToggleBtn) {
    combatToggleBtn.addEventListener("click", () => {
      if (combatStarted) {
        endCombat();
      } else {
        startCombat();
      }
    });
  }

  updateCombatTabVisibility();

  // Google sync
  const syncBtn = document.getElementById("sync-google-btn");
  if (syncBtn) {
    syncBtn.addEventListener("click", openSyncModal);
  }

  selectedCharacter =
    getCompatibleActiveCharacters()[0]
    || gameData.characters[0]
    || null;

  renderCharacterButtons();
  populateStatsSelects();

  if (selectedCharacter) {
    renderStatsActions(selectedCharacter);
  }

  console.log("✅ Tracker initialized");
}

document.addEventListener("editionChanged", (e) => {

    if (!gameData) return;

    const compatible = getCompatibleActiveCharacters();

    if (!compatible.includes(selectedCharacter)) {
        selectedCharacter = compatible[0] || null;
    }

    renderCharacterButtons();
    populateStatsSelects();

    if (selectedCharacter) {
        renderStatsActions(selectedCharacter);
    } else {
        clearStatsActions();
    }

    if (document.getElementById("character-sheet-tab")) {
        renderSheetTab();
    }

    renderStatsSummary();

    saveGameData("edition changed");
});

// -------------------- EDITION --------------------
function getCurrentEdition() {
    return window.userData.settings.edition || "5e";
}

function toggleEdition() {
  if (!gameData) return;
  window.userData.settings.edition = getCurrentEdition() === "pathfinder" ? "5e" : "pathfinder";
  updateEditionToggleLabel();
  renderCharacterButtons();
  populateStatsSelects();
  renderStatsActions(selectedCharacter);
  if (document.getElementById("character-sheet-tab")) renderSheetTab();
  saveGameData("edition toggle");
  showTrackerMessage(`Edition switched to ${getCurrentEdition() === "pathfinder" ? "Pathfinder" : "D&D 5e"}`);
}

function getSpellAttackBonus(sheet) {
  const ability = sheet.spellcastingAbility;
  if (!ability || !sheet.abilities?.[ability]) return 0;
  return (sheet.proficiencyBonus ?? 2) + abilityMod(sheet.abilities[ability]);
}

// Characters active in stat tracker
function getActiveCharacters() {
  if (!gameData) return [];
  return gameData.characters.filter(name => {
    const sheet = gameData.characterSheets?.[name];
    // Active if: no sheet (legacy), or sheet.active !== false
    if (!sheet) return true;
    return sheet.active !== false;
  });
}

// Characters whose edition matches the tracker edition
function getCompatibleActiveCharacters() {
  if (!gameData) return [];
  const trackerEdition = getCurrentEdition() || "5e";
  return getActiveCharacters().filter(name => {
    const sheet = gameData.characterSheets?.[name];
    if (!sheet) return true;
    if (!sheet.edition) return true;
    return sheet.edition === trackerEdition;
  });
}

function buildBlankStats() {
  return {
    rolls: [],
    attackRolls: [],
    abilityRolls: [],
    saveRolls: [],
    concentrationRolls: [],
    initiativeRolls: [],
    attacksMade: 0,
    abilityChecks: 0,
    savingThrows: 0,
    concentrationChecks: 0,
    initiative: 0,
    totalD20Rolls: [],
    totalModD20Rolls: [],
    spellsCast: 0,
    timesKilled: 0,
    natural1s: 0,
    natural20s: 0,
    moneySpent: 0,
    totalDamage: 0,
    attackDamage: 0,
    healingDone: 0,
    totalHealing: 0,
    spellHistory: [],
    spellResistanceRolls: [],
    totalSpellResistance: 0
  };
}

async function sendGameDataToGoogleSheet() {
  const activeCharacters = getCompatibleActiveCharacters();

  const syncData = {
    ...gameData,
    characters: activeCharacters
  };

  if (!gameData.sheetId) {
    return alert("Please enter a Google Sheet URL before syncing.");
  }

  if (!gameData.sessionNumber) {
    return alert("Please enter a session number before syncing.");
  }

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "data=" + encodeURIComponent(JSON.stringify(syncData))
    });

    alert("✅ Sync request sent");
  } catch (err) {
    console.error(err);
    alert("❌ Failed to send data");
  }
}

function openSyncModal() {
  const modal = document.getElementById("sync-modal");
  modal.classList.remove("hidden");

  const confirmBtn = document.getElementById("sync-confirm");
  const cancelBtn = document.getElementById("sync-cancel");

  confirmBtn.onclick = () => {
    const sheetInput = document.getElementById("syncSheetUrl").value.trim();
    const sessionNum = parseInt(document.getElementById("sessionNumber").value, 10) || 0;
    let sheetId = "";
    if (sheetInput) {
      const match = sheetInput.match(/\/d\/([A-Za-z0-9\-_]+)/);
      sheetId = match?.[1] || sheetInput.replace(/[^A-Za-z0-9\-_]/g, "");
    }
    gameData.sheetId = sheetId;
    gameData.sessionNumber = sessionNum;
    modal.classList.add("hidden");
    sendGameDataToGoogleSheet();

    console.log("scriptUrl =", gameData.scriptUrl);

    if (!APPS_SCRIPT_URL) {
      alert("Apps Script URL not set!");
      return;
    }
  };

  cancelBtn.onclick = () => { modal.classList.add("hidden"); };
}

function generatePCInputs() {
  const num = parseInt(document.getElementById("numPCs").value) || 0;
  const pcNamesDiv = document.getElementById("pc-names");
  pcNamesDiv.innerHTML = "";

  for (let i = 1; i <= num; i++) {
    const label = document.createElement("label");
    label.htmlFor = `pcName${i}`;
    label.textContent = `PC ${i} Name:`;

    const input = document.createElement("input");
    input.type = "text";
    input.id = `pcName${i}`;
    input.name = `pcName${i}`;

    pcNamesDiv.appendChild(label);
    pcNamesDiv.appendChild(input);
    pcNamesDiv.appendChild(document.createElement("br"));
  }
}

function resetSessionStats(characterName) {
  const stats = gameData.characterStats[characterName];
  if (!stats) return;

  stats.rolls = [];
  stats.attackRolls = [];
  stats.abilityRolls = [];
  stats.saveRolls = [];
  stats.concentrationRolls = [];
  stats.initiativeRolls = [];
  stats.spellResistanceRolls = [];
  stats.spellHistory = [];
  stats.savesFromSpells = [];

  stats.attacksMade = 0;
  stats.abilityChecks = 0;
  stats.savingThrows = 0;
  stats.concentrationChecks = 0;
  stats.totalSpellResistance = 0;
  stats.spellsCast = 0;
  stats.initiative = 0;
  stats.timesKilled = 0;
  stats.natural1s = 0;
  stats.natural20s = 0;
  stats.moneySpent = 0;
  stats.totalDamage = 0;
  stats.attackDamage = 0;
  stats.healingDone = 0;
  stats.totalHealing = 0;
  stats.totalD20Rolls = [];
  stats.totalModD20Rolls = [];
}

function resetAllSessionStats() {
  const activeChars = getCompatibleActiveCharacters();

  if (!confirm(`Reset session stats for ${activeChars.length} active character(s)?\n\n${activeChars.join(", ")}\n\nThis cannot be undone.`)) return;

  activeChars.forEach(name => resetSessionStats(name));

  saveGameData("session reset");
  renderEditorStats(selectedCharacter);
  updateSideStats();
  showTrackerMessage("✅ Session stats reset for all active characters.");
}

// -------------------- TABS --------------------

function setupTabs() {

  // Hide all tabs first
  document.querySelectorAll("#tab-tracker .tab-content")
    .forEach(tab => {
      tab.classList.remove("active");
      tab.style.display = "none";
    });

  // Open default tab
  switchTab("stats");
}

window.switchTab = function (tabId) {

  const centerPanel = document.getElementById("tracker-center");
  const sideStats = document.getElementById("side-stats");
  const trackerLayout = document.querySelector(".tracker-layout");
  const fullWidthTabs = ["summary", "character-sheets"];

  // Hide ALL tracker tabs
  document.querySelectorAll("#tab-tracker .tab-content")
    .forEach(tab => {
      tab.classList.remove("active");
      tab.style.display = "none";
    });

  // Show selected tab
  const selectedTab = document.getElementById(tabId);

  if (selectedTab) {
    selectedTab.classList.add("active");
    selectedTab.style.display = "flex";
    selectedTab.style.flexDirection = "column";
  }

  // Remove active state from buttons
  document.querySelectorAll("#tab-tracker .tracker-tabs button")
    .forEach(btn => {
      btn.classList.remove("active");
    });

  // Add active state to clicked button
  const activeBtn = document.querySelector(
    `#tab-tracker .tracker-tabs button[onclick="switchTab('${tabId}')"]`
  );

  if (activeBtn) {
    activeBtn.classList.add("active");
  }

  // Toggle side stats panel
  if (sideStats) {
    sideStats.style.display =
      (tabId === "summary" || tabId === "character-sheets")
        ? "none"
        : "block";
  }

  // Toggle center panel — add this right after the sideStats block


  if (fullWidthTabs.includes(tabId)) {
    if (centerPanel) centerPanel.style.display = "none";
    if (sideStats) sideStats.style.display = "none";
    if (trackerLayout) trackerLayout.style.gridTemplateColumns = "1fr";
  } else {
    if (sideStats) sideStats.style.display = "block";
    // Center only shows when a modal is open, handled by modal-active class
    if (centerPanel && !centerPanel.classList.contains("modal-active")) {
      centerPanel.style.display = "none";
    }
    if (trackerLayout) trackerLayout.style.gridTemplateColumns = "";
  }

  // Render logic
  if (tabId === "combat") {

    renderStatsActions(selectedCharacter, "combat");
    renderInitiativeControls();
    renderInitiative();

  } else if (tabId === "stats") {

    renderCharacterButtons();
    renderStatsActions(selectedCharacter, "stats");

  } else if (tabId === "stats-editor") {

    renderEditorStats(selectedCharacter);
    renderCharacterButtons();

  } else if (tabId === "character-sheets") {

    renderSheetTab();

  } else if (tabId === "summary") {

    renderStatsSummary();
  }
};

function playSoundFromUrl(url, vol) {
  const audio = new Audio(url);
  audio.volume = vol;
  audio.play().catch(err => console.log("Playback failed:", err));
}

function renderStatsSummary() {
  const grid = document.getElementById("summary-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const edition = getCurrentEdition();
  const summaries = [];

  getCompatibleActiveCharacters().forEach(name => {
    const s = gameData.characterStats[name];
    if (!s) return;

    let spellHealing = 0;
    if (Array.isArray(s.spellHistory)) {
      s.spellHistory.forEach(spell => {
        if (spell.extra) spellHealing += parseFloat(spell.extra.healing) || 0;
      });
    }

    const combinedDamage = (s.totalDamage || 0) + (s.attackDamage || 0);
    const combinedHealing = (s.healingDone || 0) + spellHealing;

    const summaryText = [
      `=== ${name} ===`,
      `Attacks Made: ${s.attacksMade}`,
      `Ability Checks: ${s.abilityChecks}`,
      `Saving Throws: ${s.savingThrows}`,
      edition === "pathfinder" ? `Concentration Checks: ${s.concentrationChecks}` : "",
      edition === "pathfinder" ? `Spell Resistances: ${s.totalSpellResistance}` : "",
      `Spells Cast: ${s.spellsCast}`,
      `Initiative: ${s.initiativeRolls.length > 0 ? formatD20RollsDisplay(s.initiativeRolls) : "No rolls yet."}`,
      `Total D20 Rolls: ${s.totalD20Rolls.length > 0 ? formatRolls(s.totalD20Rolls) : "No rolls yet."}`,
      `Total Modded D20 Rolls: ${s.totalModD20Rolls.length > 0 ? formatD20RollsDisplay(s.totalModD20Rolls) : "No rolls yet."}`,
      `Times Killed: ${s.timesKilled}`,
      `Natural 1s: ${s.natural1s}`,
      `Natural 20s: ${s.natural20s}`,
      `Total Damage: ${combinedDamage}`,
      `Total Healing: ${combinedHealing}`,
      `Money Spent: ${s.moneySpent.toFixed(2)}`
    ].filter(Boolean).join("\n");

    summaries.push(summaryText);

    const card = document.createElement("div");
    card.className = "summary-card";

    const pre = document.createElement("pre");
    pre.textContent = summaryText;

    const copyBtn = document.createElement("button");
    copyBtn.textContent = `Copy ${name}'s Summary`;
    copyBtn.style.cssText = `margin-top:10px;align-self:flex-end;background-color:var(--primary-accent);color:#fff;border:none;border-radius:6px;padding:5px 10px;cursor:pointer;transition:background 0.2s;`;
    copyBtn.addEventListener("mouseenter", () => (copyBtn.style.backgroundColor = "var(--elevated)"));
    copyBtn.addEventListener("mouseleave", () => (copyBtn.style.backgroundColor = "var(--primary-accent)"));
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(summaryText);
        const prevText = copyBtn.textContent;
        copyBtn.textContent = "✅ Copied!";
        copyBtn.style.backgroundColor = "#2b662b";
        setTimeout(() => { copyBtn.textContent = prevText; copyBtn.style.backgroundColor = "var(--primary-accent)"; }, 1500);
      } catch (err) {
        const textarea = document.createElement("textarea");
        textarea.value = summaryText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        copyBtn.textContent = "✅ Copied (Fallback)";
        copyBtn.style.backgroundColor = "#2b662b";
        setTimeout(() => { copyBtn.textContent = `Copy ${name}'s Summary`; copyBtn.style.backgroundColor = "var(--primary-accent)"; }, 1500);
      }
    };

    card.appendChild(pre);
    card.appendChild(copyBtn);
    grid.appendChild(card);
  });

  const copyAllBtn = document.getElementById("copy-summary-btn");
  if (copyAllBtn) {
    copyAllBtn.onclick = async () => {
      const combined = summaries.join("\n\n");
      try {
        await navigator.clipboard.writeText(combined);
        copyAllBtn.textContent = "Copied!";
        setTimeout(() => (copyAllBtn.textContent = "Copy All Summaries"), 1200);
      } catch (err) {
        const textarea = document.createElement("textarea");
        textarea.value = combined;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        alert("All character summaries copied! (fallback)");
      }
    };
  }

  saveGameData();
}

function triggerEasterEgg() {
  const img = document.getElementById("mystery-image");
  if (!img) return;
  if (Math.random() < 0.001) {
    if (Math.random() < 0.5) playSoundFromUrl("https://www.myinstants.com/media/sounds/cave21.mp3", 0.5);
    else playSoundFromUrl("https://www.myinstants.com/media/sounds/cave1_gqB8CwT.mp3", 0.5);
    const current = parseFloat(img.style.opacity) || 0;
    img.style.opacity = Math.min(current + 0.05, 1);
  }
}

// -------------------- HELPERS --------------------
function clearStatsActions() {
  const actionsDiv = document.getElementById("stats-actions");
  if (actionsDiv) actionsDiv.innerHTML = "";
}

function showTrackerMessage(msg, duration = 4000) {
  const messageDiv = document.getElementById("tracker-message");
  if (!messageDiv) return;
  messageDiv.textContent = msg;
  messageDiv.style.display = "block";
  setTimeout(() => (messageDiv.style.display = "none"), duration);
}

function highlightSelectedButton(name) {
  document.querySelectorAll("#combat-character-buttons button, #stats-character-buttons button, #editor-character-buttons button")
    .forEach(btn => btn.classList.toggle("active", btn.textContent === name));
}

function resolveEntryByTag(tag) {
  if (!tag) return null;
  for (const stats of Object.values(gameData.characterStats)) {
    if (!stats?.initiativeRolls) continue;
    const found = stats.initiativeRolls.find(r => r.tag === tag);
    if (found) return found;
  }
  return null;
}

function resolveToStatName(idOrTagOrName) {
  if (!idOrTagOrName) return null;
  if (gameData.characterStats[idOrTagOrName]) return idOrTagOrName;
  const byTag = resolveEntryByTag(idOrTagOrName);
  if (byTag) return byTag.source || null;
  for (const stats of Object.values(gameData.characterStats)) {
    if (!stats?.initiativeRolls) continue;
    const found = stats.initiativeRolls.find(r => r.displayName === idOrTagOrName);
    if (found) return found.source || null;
  }
  return null;
}

// -------------------- CHARACTER SHEETS --------------------
function abilityMod(score) {
  return Math.floor((score - 10) / 2);
}

function modStr(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Compute a skill's total modifier for a given sheet.
 * Applies proficiency, expertise, Jack of All Trades, and miscBonus.
 */
function computeSkillTotal(sheet, skillKey, abilityKey) {
  const abilScore = sheet.abilities?.[abilityKey] ?? 10;
  const abilMod = abilityMod(abilScore);
  const prof = sheet.proficiencyBonus ?? 2;

  const profType =
    sheet.skillProficiencies?.[skillKey]?.type ?? "none";

  const miscBonus =
    sheet.skillProficiencies?.[skillKey]?.miscBonus ?? 0;

  let profBonus = 0;

  if (profType === "proficient") {
    profBonus = prof;
  } else if (profType === "expertise") {
    profBonus = prof * 2;
  } else if (sheet.jackOfAllTrades) {
    profBonus = Math.floor(prof / 2);
  }

  return abilMod + profBonus + miscBonus;
}

/**
 * Compute a saving throw's total modifier for a given sheet.
 * Applies proficiency, expertise, Aura of Protection, and miscBonus.
 */
function computeSaveTotal(sheet, abilityKey) {
  const abilScore = sheet.abilities?.[abilityKey] ?? 10;
  const abilMod = abilityMod(abilScore);
  const prof = sheet.proficiencyBonus ?? 2;
  const saveData = sheet.savingThrowProficiencies?.[abilityKey] ?? {};
  const profType = saveData.type ?? "none";
  const miscBonus = saveData.miscBonus ?? 0;

  let profBonus = 0;
  if (profType === "proficient") profBonus = prof;
  else if (profType === "expertise") profBonus = prof * 2;

  // Aura of Protection: add CHA modifier to all saves
  let auraBonus = 0;
  if (sheet.auraOfProtection) {
    const chaMod = abilityMod(sheet.abilities?.cha ?? 10);
    if (chaMod > 0) auraBonus = chaMod;
  }

  return abilMod + profBonus + auraBonus + miscBonus;
}

function blankSheet(name, edition) {
  const abilities = {};
  ABILITY_KEYS.forEach(key => { abilities[key] = 10; });

  const skillProficiencies = {};
  DND5E_SKILLS.forEach(sk => {
    skillProficiencies[sk.name] = { type: "none", miscBonus: 0 };
  });

  const savingThrowProficiencies = {};
  ABILITY_KEYS.forEach(key => {
    savingThrowProficiencies[key] = { type: "none", miscBonus: 0 };
  });

  return {
    edition: edition || "5e",
    name,
    level: 1,
    proficiencyBonus: 2,
    jackOfAllTrades: false,
    auraOfProtection: false,
    initiativeBonus: 0,
    initiative: 0,
    abilities,
    savingThrowProficiencies,
    skillProficiencies,
    skills: [],
    attacks: [],
    spellAttackBonus: 0,
    spells: [],
    active: true,
    createdAt: Date.now()
  };
}

function ensureCharacterSheets() {
  if (!gameData.characterSheets) gameData.characterSheets = {};
}

function createSheetForCharacter(name) {
  ensureCharacterSheets();
  if (!gameData.characterSheets[name]) {
    gameData.characterSheets[name] = blankSheet(name, getCurrentEdition());
  }
  saveGameData("Created sheet for " + name);
}

function addNewCharacter(name) {
  if (!name || !name.trim()) return alert("Character name cannot be empty.");
  name = name.trim();
  if (gameData.characters.includes(name)) {
    showTrackerMessage(`Character "${name}" already exists!`);
    return;
  }
  gameData.characters.push(name);
  ensureCharacterSheets();
  gameData.characterSheets[name] = blankSheet(name, getCurrentEdition());
  if (!gameData.characterStats[name]) gameData.characterStats[name] = buildBlankStats();
  saveGameData("Added new character: " + name);
  renderCharacterButtons();
  renderSheetTab();
  // Auto-open editor for new character
  openSheetEditor(name);
  showTrackerMessage(`Character "${name}" added!`);
}

function removeCharacter(name) {
  if (!confirm(`Remove "${name}"? This cannot be undone.`)) return;
  gameData.characters = gameData.characters.filter(c => c !== name);
  delete gameData.characterStats[name];
  delete gameData.characterSheets[name];
  if (selectedCharacter === name) selectedCharacter = gameData.characters[0] || null;
  saveGameData("Removed character: " + name);
  renderCharacterButtons();
  renderSheetTab();
  updateSideStats();
  showTrackerMessage(`Character "${name}" removed.`);
}

function toggleCharacterActive(name) {
  ensureCharacterSheets();
  if (!gameData.characterSheets[name]) createSheetForCharacter(name);
  const sheet = gameData.characterSheets[name];
  sheet.active = !sheet.active;
  saveGameData("Toggled active: " + name);
  renderSheetTab();
  renderCharacterButtons();
  populateStatsSelects();
}

function profBonusForLevel(level) {
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}

// -------------------- SHEET TAB RENDER --------------------
// Layout:
//   LEFT: Add/Remove character buttons (top), then sheet editor area (bottom)
//   RIGHT: Active/Inactive character panel (replaces side stats for this tab)

let sheetTabSelectedCharacter = null; // which character is selected in the sheet tab

function renderSheetTab() {
  const container = document.getElementById("character-sheet-tab");
  if (!container) return;
  ensureCharacterSheets();

  // If there are no characters yet, still build the layout
if (!sheetTabSelectedCharacter && gameData.characters.length > 0) {
    sheetTabSelectedCharacter = gameData.characters[0];
}
  
  container.innerHTML = "";

  // ── Two-column layout ──────────────────────────────────────────
  const layout = document.createElement("div");
  layout.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 260px;
    gap: 16px;
    height: 100%;
    min-height: 0;
  `;

  // ── LEFT COLUMN ────────────────────────────────────────────────
  const leftCol = document.createElement("div");
  leftCol.style.cssText = `display:flex;flex-direction:column;gap:12px;min-height:0;overflow-y:auto;`;

  // Top bar: Add / Remove buttons
  const topBar = document.createElement("div");
  topBar.style.cssText = `display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-bottom:8px;border-bottom:1px solid var(--surfaces);`;

  const addBtn = document.createElement("button");
  addBtn.className = "sheet-add-btn";
  addBtn.textContent = "+ Add Character";
  addBtn.onclick = openAddCharacterModal;
  topBar.appendChild(addBtn);

  if (sheetTabSelectedCharacter && gameData.characters.includes(sheetTabSelectedCharacter)) {
    const removeBtn = document.createElement("button");
    removeBtn.className = "sheet-btn-danger";
    removeBtn.textContent = `Remove "${sheetTabSelectedCharacter}"`;
    removeBtn.onclick = () => {
      removeCharacter(sheetTabSelectedCharacter);
      sheetTabSelectedCharacter = null;
    };
    topBar.appendChild(removeBtn);
  }

  leftCol.appendChild(topBar);

  // Editor area
  const editorArea = document.createElement("div");
  editorArea.id = "sheet-editor-area";
  editorArea.style.cssText = `flex:1;min-height:0;overflow-y:auto;`;

  if (sheetTabSelectedCharacter && gameData.characters.includes(sheetTabSelectedCharacter)) {
    const sheet = gameData.characterSheets[sheetTabSelectedCharacter];
    if (sheet) {
      editorArea.appendChild(buildInlineSheetEditor(sheetTabSelectedCharacter, sheet));
    } else {
      const noSheet = document.createElement("div");
      noSheet.style.cssText = `padding:20px;opacity:0.6;`;
      noSheet.textContent = "No sheet found. Create one from the right panel.";
      editorArea.appendChild(noSheet);
    }
  } else {
    const hint = document.createElement("div");
    hint.style.cssText = `padding:24px;opacity:0.5;font-size:0.95rem;`;
    hint.textContent = "Select a character from the right panel to edit their sheet.";
    editorArea.appendChild(hint);
  }

  leftCol.appendChild(editorArea);

  // ── RIGHT COLUMN ────────────────────────────────────────────────
  const rightCol = document.createElement("div");
  rightCol.style.cssText = `
    display:flex;
    flex-direction:column;
    gap:0;
    border-left:1px solid var(--surfaces);
    padding-left:12px;
    min-height:0;
    overflow-y:auto;
  `;

  const rightTitle = document.createElement("div");
  rightTitle.style.cssText = `font-weight:bold;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--secondary-text);padding-bottom:8px;margin-bottom:4px;border-bottom:1px solid var(--surfaces);`;
  rightTitle.textContent = "Characters";
  rightCol.appendChild(rightTitle);

  // Active section
  const activeHeader = document.createElement("div");
  activeHeader.style.cssText = `font-size:0.8rem;color:var(--secondary-text);margin:8px 0 4px;font-weight:bold;`;
  activeHeader.textContent = "✅ Active (in tracker)";
  rightCol.appendChild(activeHeader);

  const activeList = document.createElement("div");
  activeList.style.cssText = `display:flex;flex-direction:column;gap:4px;margin-bottom:12px;`;

  // Inactive section
  const inactiveHeader = document.createElement("div");
  inactiveHeader.style.cssText = `font-size:0.8rem;color:var(--secondary-text);margin:8px 0 4px;font-weight:bold;`;
  inactiveHeader.textContent = "⬜ Inactive";
  rightCol.appendChild(inactiveHeader); // will be inserted after active list

  const inactiveList = document.createElement("div");
  inactiveList.style.cssText = `display:flex;flex-direction:column;gap:4px;`;

  function buildCharRow(name) {
    const sheet = gameData.characterSheets[name];
    const isActive = sheet ? sheet.active !== false : true;
    const isSelected = sheetTabSelectedCharacter === name;

    const row = document.createElement("div");
    row.style.cssText = `
      display:flex;
      align-items:center;
      gap:6px;
      padding:5px 7px;
      border-radius:6px;
      cursor:pointer;
      background:${isSelected ? "var(--primary-accent)" : "transparent"};
      transition:background 0.15s;
    `;
    row.onmouseenter = () => { if (!isSelected) row.style.background = "var(--surfaces)"; };
    row.onmouseleave = () => { if (!isSelected) row.style.background = "transparent"; };

    const nameSpan = document.createElement("span");
    nameSpan.textContent = name;
    nameSpan.style.cssText = `flex:1;font-size:0.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;
    row.appendChild(nameSpan);

    // Toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.title = isActive ? "Set Inactive" : "Set Active";
    toggleBtn.textContent = isActive ? "→" : "←";
    toggleBtn.style.cssText = `
      padding:2px 7px;
      font-size:0.75rem;
      border-radius:4px;
      background:var(--elevated);
      border:1px solid var(--surfaces);
      color:var(--primary-text);
      cursor:pointer;
      flex-shrink:0;
    `;
    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      toggleCharacterActive(name);
    };
    row.appendChild(toggleBtn);

    // If no sheet, show create button
    if (!sheet) {
      const createBtn = document.createElement("button");
      createBtn.textContent = "＋";
      createBtn.title = "Create Sheet";
      createBtn.style.cssText = `padding:2px 6px;font-size:0.75rem;border-radius:4px;background:var(--primary-accent);border:none;color:#fff;cursor:pointer;flex-shrink:0;`;
      createBtn.onclick = (e) => {
        e.stopPropagation();
        createSheetForCharacter(name);
        sheetTabSelectedCharacter = name;
        renderSheetTab();
      };
      row.appendChild(createBtn);
    }

    // Click row to select character
    row.addEventListener("click", () => {
      sheetTabSelectedCharacter = name;
      renderSheetTab();
    });

    return row;
  }

  gameData.characters.forEach(name => {
    const sheet = gameData.characterSheets[name];
    const isActive = sheet ? sheet.active !== false : true;
    if (isActive) activeList.appendChild(buildCharRow(name));
    else inactiveList.appendChild(buildCharRow(name));
  });

  rightCol.appendChild(activeList);
  rightCol.appendChild(inactiveHeader);
  rightCol.appendChild(inactiveList);

  layout.appendChild(leftCol);
  layout.appendChild(rightCol);
  container.appendChild(layout);
}

function getSpellDefinition(sp) {
  if (sp.custom) {
    return sp;
  }

  return SPELL_DATABASE?.[sp.level]?.[sp.spellId] ?? sp;
}

// ── Inline Sheet Editor (replaces modal-based editor) ───────────────────────
function buildInlineSheetEditor(name, sheet) {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `display:flex;flex-direction:column;gap:16px;padding:4px 2px;`;

  // ── Helper builders ────────────────────────────────────────────
  function row(label, input) {
    const d = document.createElement("div");
    d.style.cssText = `display:flex;align-items:center;gap:10px;margin-bottom:8px;`;
    const l = document.createElement("label");
    l.textContent = label;
    l.style.cssText = `min-width:140px;font-size:0.85rem;opacity:0.8;`;
    d.appendChild(l);
    d.appendChild(input);
    return d;
  }

  function textInput(val, onChange) {
    const i = document.createElement("input");
    i.type = "text";
    i.value = val ?? "";
    i.style.cssText = `
    width:100%;
    padding:6px 8px;
    background:var(--background);
    border:1px solid var(--primary-accent);
    color:var(--primary-text);
    border-radius:6px;`;
    i.addEventListener("input", () => { onChange(i.value); saveGameData("sheet edit"); });
    return i;
  }

  function numInput(val, onChange, min = 0, max = 9999) {
    const i = document.createElement("input");
    i.type = "number";
    i.value = val ?? 0;
    i.min = min;
    i.max = max;
    i.style.cssText = `
    width:100%;
    padding:6px 8px;
    background:var(--background);
    border:1px solid var(--primary-accent);
    color:var(--primary-text);
    border-radius:6px;`;
    i.addEventListener("input", () => { onChange(parseInt(i.value) || 0); saveGameData("sheet edit"); });
    return i;
  }

  function selectInput(options, val, onChange) {
    const s = document.createElement("select");
    s.style.cssText = `
    width:100%;
    padding:6px 8px;
    background:var(--background);
    border:1px solid var(--primary-accent);
    color:var(--primary-text);
    border-radius:6px;`;
    options.forEach(opt => {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
      if (opt === val) o.selected = true;
      s.appendChild(o);
    });
    s.addEventListener("change", () => { onChange(s.value); saveGameData("sheet edit"); });
    return s;
  }

  function checkbox(val, onChange) {
    const i = document.createElement("input");
    i.type = "checkbox";
    i.checked = !!val;
    i.style.cssText = `
    width:18px;
    height:18px;
    cursor:pointer;`;
    i.addEventListener("change", () => { onChange(i.checked); saveGameData("sheet edit"); });
    return i;
  }

  function sectionHeader(text) {
    const h = document.createElement("h3");
    h.textContent = text;
    h.style.cssText = `
    margin:16px 0 8px;
    padding-bottom:5px;
    border-bottom:1px solid var(--primary-accent);
    color:var(--secondary-text);
    font-size:0.95rem;
    text-transform:uppercase;
    letter-spacing:0.06em;`;
    return h;
  }

  function getAllSpells(db) {

    const all = [];

    Object.entries(db).forEach(([level, spells]) => {

      Object.entries(spells).forEach(([id, spell]) => {

        all.push({
          id,
          level: Number(level),
          ...spell
        });
      });
    });

    return all.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  // ── Identity ──
  const header1 = document.getElementById("character-sheets-header");

  if (header1) {
    header1.textContent = `${sheet.name}'s Character Sheet`;
  }

  const topGrid = document.createElement("div");
  topGrid.style.cssText = `
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(120px,1fr));
  gap:10px;`;

  function topField(labelText, input) {
    const wrap = document.createElement("div");
    wrap.style.cssText = `
    display:flex;
    flex-direction:column;
    gap:5px;`;
    const label = document.createElement("label");
    label.textContent = labelText;
    label.style.cssText = `
    font-size:0.75rem;
    color:var(--secondary-text);
    font-weight:bold;
    text-transform:uppercase;
    letter-spacing:0.05em;`;
    wrap.appendChild(label);
    wrap.appendChild(input);
    return wrap;
  }

  // ── Edition Select ──
  const editionSelect = selectInput(
    ["5e", "pathfinder"],
    sheet.edition || "5e",
    v => {
      sheet.edition = v;
      renderSheetTab();
    }
  );

  topGrid.appendChild(
    topField("Edition", editionSelect)
  );

  const levelInp = numInput(sheet.level, v => {
    sheet.level = v;
    sheet.proficiencyBonus = profBonusForLevel(v);
    profInp.value = sheet.proficiencyBonus;

    // Re-render skill/save totals
    renderSkillSection();
    renderSaveSection();
    sheet.initiative = computeInitiative(sheet);
    initModInp.value = sheet.initiative;
    refreshSpellAttackBonus();
  }, 1, 20);
  topGrid.appendChild(topField("Level", levelInp));

  const profInp = numInput(sheet.proficiencyBonus, v => {
    sheet.proficiencyBonus = v;

    renderSkillSection();
    renderSaveSection();
    sheet.initiative = computeInitiative(sheet);
    initModInp.value = sheet.initiative;
    refreshSpellAttackBonus();
  }, 0, 10);
  topGrid.appendChild(topField("Prof Bonus", profInp));

  function computeInitiative(sheet) {
    const dexMod = abilityMod(sheet.abilities?.dex ?? 10);

    let total = dexMod;

    if (sheet.jackOfAllTrades) {
      total += Math.floor((sheet.proficiencyBonus ?? 2) / 2);
    }

    return total;
  }

  sheet.initiative = computeInitiative(sheet);

  const initModInp = numInput(
    sheet.initiative,
    v => sheet.initiative = v,
    -10,
    20
  );

  topGrid.appendChild(topField("Initiative Mod", initModInp));

  // ── Spellcasting ──
  const castingAbilitySelect = selectInput(
    ABILITY_KEYS,
    sheet.spellcastingAbility,
    v => {
      sheet.spellcastingAbility = v;
      if (v && sheet.abilities[v] !== undefined) {
        const mod = abilityMod(sheet.abilities[v]);
        refreshSpellAttackBonus();
        spellAtkInp.value = getSpellAttackBonus(sheet);
      }
    }
  );
  topGrid.appendChild(topField("Casting Ability", castingAbilitySelect));

  const spellAtkInp = numInput(sheet.spellAttackBonus, v => sheet.spellAttackBonus = v, -10, 20);
  topGrid.appendChild(topField("Spell Attack Bonus", spellAtkInp));

  function refreshSpellAttackBonus() {
    const ability = sheet.spellcastingAbility;
    if (!ability) return;
    const bonus = (sheet.proficiencyBonus ?? 2) + abilityMod(sheet.abilities[ability] ?? 10);
    sheet.spellAttackBonus = bonus;
    spellAtkInp.value = bonus;
  }

  wrapper.appendChild(topGrid);

  // ── Class Features / Toggles ──
  const featuresGrid = document.createElement("div");
  featuresGrid.style.cssText = `display:flex;flex-direction:row;gap:8px;`;

  function toggleRow(labelText, val, onChangeFn) {
    const r = document.createElement("div");
    r.style.cssText = `display:flex;align-items:center;gap:10px;`;
    const cb = checkbox(val, v => { onChangeFn(v); renderSkillSection(); renderSaveSection(); sheet.initiative = computeInitiative(sheet); initModInp.value = sheet.initiative; });
    const lbl = document.createElement("label");
    lbl.textContent = labelText;
    lbl.style.cssText = `font-size:0.9rem;cursor:pointer;`;
    lbl.onclick = () => { cb.checked = !cb.checked; cb.dispatchEvent(new Event("change")); };
    r.appendChild(cb);
    r.appendChild(lbl);
    return r;
  }

  featuresGrid.appendChild(toggleRow(
    "Jack of All Trades (half prof to unproficient checks/skills/initiative)",
    sheet.jackOfAllTrades,
    v => sheet.jackOfAllTrades = v
  ));
  featuresGrid.appendChild(toggleRow(
    "Aura of Protection (CHA mod to all saves)",
    sheet.auraOfProtection,
    v => sheet.auraOfProtection = v
  ));

  wrapper.appendChild(featuresGrid);

  // ── Ability Scores ──
  const abilGrid = document.createElement("div");
  abilGrid.style.cssText = `
  display:grid;
  grid-template-columns:repeat(6,1fr);
  gap:1px;
  margin-bottom:1px;`;

  ABILITY_KEYS.forEach(key => {
    const cell = document.createElement("div");
    cell.style.cssText = `
    background:var(--background);
    border:1px solid var(--surfaces);
    border-radius:8px;
    padding:8px;
    text-align:center;`;

    const label = document.createElement("div");
    label.textContent = key.toUpperCase();
    label.style.cssText = `
    font-size:0.85rem;
    opacity:0.8;
    margin-bottom:3px;
    text-transform:uppercase;`;

    const scoreInp = document.createElement("input");
    scoreInp.type = "number";
    scoreInp.value = sheet.abilities[key] ?? 10;
    scoreInp.min = 1;
    scoreInp.max = 30;
    scoreInp.style.cssText = `
    width:100%;
    text-align:center;
    font-size:1.4rem;
    font-weight:bold;
    background:transparent;
    border:none;
    border-bottom:2px solid var(--secondary-accent);
    color:var(--primary-text);
    outline:none;`;

    const modDisplay = document.createElement("div");
    modDisplay.style.cssText = `
    font-size:0.9rem;
    color:var(--secondary-text);
    margin-top:2px;`;
    modDisplay.textContent = modStr(abilityMod(sheet.abilities[key] ?? 10));

    scoreInp.addEventListener("input", () => {
      const val = parseInt(scoreInp.value) || 10;
      sheet.abilities[key] = val;
      modDisplay.textContent = modStr(abilityMod(val));
      renderSkillSection();
      renderSaveSection();
      sheet.initiative = computeInitiative(sheet);
      initModInp.value = sheet.initiative;
      saveGameData("ability score edit");
      refreshSpellAttackBonus();
    });

    cell.appendChild(label);
    cell.appendChild(scoreInp);
    cell.appendChild(modDisplay);
    abilGrid.appendChild(cell);
  });

  wrapper.appendChild(abilGrid);

  // ── Saving Throws ──
  const saveContainer = document.createElement("div");
  saveContainer.id = `save-section-${name.replace(/\s+/g, "-")}`;
  wrapper.appendChild(saveContainer);

  function renderSaveSection() {
    saveContainer.innerHTML = "";
    if (!sheet.savingThrowProficiencies) sheet.savingThrowProficiencies = {};

    const saveGrid = document.createElement("div");
    saveGrid.style.cssText = `
display:grid;
grid-template-columns:repeat(6,minmax(30px,1fr));
gap:8px;
align-items:stretch;
`;

    ABILITY_KEYS.forEach(key => {
      if (!sheet.savingThrowProficiencies[key]) {
        sheet.savingThrowProficiencies[key] = { type: "none", miscBonus: 0 };
      }
      const saveData = sheet.savingThrowProficiencies[key];
      const total = computeSaveTotal(sheet, key);

      const card = document.createElement("div");
      card.style.cssText = `
background:var(--background);
border:1px solid var(--surfaces);
border-radius:8px;
padding:8px;
display:flex;
flex-direction:column;
gap:6px;
min-width:0;
`;

      const header = document.createElement("div");
      header.style.cssText = `display:flex;align-items:center;justify-content:space-between;`;

      const keyLabel = document.createElement("span");
      keyLabel.textContent = ABILITY_LABELS[key] + " SAVE";
      keyLabel.style.cssText = `font-weight:bold;font-size:0.9rem;`;

      const totalSpan = document.createElement("span");
      totalSpan.textContent = modStr(total);
      totalSpan.style.cssText = `font-size:1.1rem;font-weight:bold;color:var(--secondary-accent);`;

      header.appendChild(keyLabel);
      header.appendChild(totalSpan);
      card.appendChild(header);

      // Proficiency type select
      const profRow = document.createElement("div");
      profRow.style.cssText = `
display:flex;
align-items:center;
gap:6px;
min-width:0;
`;
      const profLabel = document.createElement("label");
      profLabel.textContent = "Prof:";
      profLabel.style.cssText = `font-size:0.8rem;min-width:36px;`;
      const profSel = document.createElement("select");
      profSel.style.cssText = `
flex:1 1 auto;
min-width:0;
width:100%;
font-size:0.8rem;
padding:3px 5px;
background:var(--background);
border:1px solid var(--surfaces);
color:var(--primary-text);
border-radius:4px;
`;
      ["Unproficient", "proficient", "expertise"].forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
        if (opt === saveData.type) o.selected = true;
        profSel.appendChild(o);
      });
      profSel.addEventListener("change", () => {
        saveData.type = profSel.value;
        renderSaveSection();
        saveGameData("save proficiency edit");
      });
      profRow.appendChild(profLabel);
      profRow.appendChild(profSel);
      card.appendChild(profRow);

      // Misc bonus
      const miscRow = document.createElement("div");
      miscRow.style.cssText = `display:flex;align-items:center;gap:6px;`;
      const miscLabel = document.createElement("label");
      miscLabel.textContent = "Misc:";
      miscLabel.style.cssText = `font-size:0.8rem;min-width:36px;`;
      const miscInp = document.createElement("input");
      miscInp.type = "number";
      miscInp.value = saveData.miscBonus ?? 0;
      miscInp.style.cssText = `flex:1;font-size:0.8rem;padding:3px 5px;background:var(--background);border:1px solid var(--surfaces);color:var(--primary-text);border-radius:4px;`;
      miscInp.addEventListener("input", () => {
        saveData.miscBonus = parseInt(miscInp.value) || 0;
        renderSaveSection();
        saveGameData("save misc edit");
      });
      miscRow.appendChild(miscLabel);
      miscRow.appendChild(miscInp);
      card.appendChild(miscRow);

      saveGrid.appendChild(card);
    });

    saveContainer.appendChild(saveGrid);

    // Aura note
    if (sheet.auraOfProtection) {
      const note = document.createElement("div");
      note.style.cssText = `font-size:0.8rem;color:var(--secondary-text);margin-top:4px;opacity:0.7;`;
      const chaMod = abilityMod(sheet.abilities?.cha ?? 10);
      note.textContent = `Aura of Protection active: +${Math.max(0, chaMod)} CHA mod applied to all saves.`;
      saveContainer.appendChild(note);
    }
  }

  renderSaveSection();

  // ── Skills ──
  const skillsContainer = document.createElement("div");
  skillsContainer.id = `skills-section-${name.replace(/\s+/g, "-")}`;
  wrapper.appendChild(skillsContainer);

  function renderSkillSection() {
    skillsContainer.innerHTML = "";
    if (!sheet.customSkills) sheet.customSkills = [];
    if (!sheet.skillProficiencies) sheet.skillProficiencies = {};
    const allSkills = [
      ...DND5E_SKILLS,
      ...sheet.customSkills
    ];
    allSkills.forEach(sk => {

      const skillKey = sk.custom ? sk.id : sk.name;

      if (!sheet.skillProficiencies[skillKey]) {

        sheet.skillProficiencies[skillKey] = {
          type: "none",
          miscBonus: 0
        };
      }
    });

    const grid = document.createElement("div");
    grid.style.cssText = `
display:grid;
grid-template-columns:repeat(6,minmax(180px,1fr));
gap:8px;
align-items:stretch;
`;

    allSkills.forEach(sk => {
      const skillKey = sk.custom ? sk.id : sk.name;

      const skData = sheet.skillProficiencies[skillKey];
      const total = computeSkillTotal(sheet, skillKey, sk.ability);

      const card = document.createElement("div");
      card.style.cssText = `
display:grid;
grid-template-columns:auto 1fr;
gap:6px;
padding:8px;
background:var(--background);
border:1px solid var(--surfaces);
border-radius:8px;
min-width:0;
align-items:start;
`;

      // Total modifier badge
      const badge = document.createElement("span");
      badge.textContent = modStr(total);
      badge.style.cssText = `
        min-width:32px;
        text-align:center;
        font-weight:bold;
        font-size:0.95rem;
        padding:2px 4px;
        border-radius:4px;
        background:${skData.type === "expertise" ? "var(--secondary-accent)" : skData.type === "proficient" ? "var(--primary-accent)" : "var(--surfaces)"};
        color:${skData.type !== "none" ? "#fff" : "var(--primary-text)"};
        flex-shrink:0;
      `;

      // Skill name + ability
      const skillWrap = document.createElement("div");
      skillWrap.style.cssText = `
display:flex;
flex-direction:column;
min-width:0;
width:100%;
gap:4px;
`;

      if (sk.custom) {

        const nameInput = document.createElement("input");

        nameInput.type = "text";

        nameInput.value = sk.name;

        nameInput.style.cssText = `
    width:100%;
    padding:2px 4px;
    font-size:0.8rem;
    background:var(--background);
    border:1px solid var(--surfaces);
    color:var(--primary-text);
    border-radius:4px;
  `;

        nameInput.addEventListener("input", () => {

          sk.name = nameInput.value;

          saveGameData("custom skill rename");
        });

        const abilitySelect = document.createElement("select");

        abilitySelect.style.cssText = `
    padding:2px 4px;
    font-size:0.75rem;
    background:var(--background);
    border:1px solid var(--surfaces);
    color:var(--primary-text);
    border-radius:4px;
  `;

        ABILITY_KEYS.forEach(ab => {

          const opt = document.createElement("option");

          opt.value = ab;
          opt.textContent = ab.toUpperCase();

          if (ab === sk.ability) {
            opt.selected = true;
          }

          abilitySelect.appendChild(opt);
        });

        abilitySelect.addEventListener("change", () => {

          sk.ability = abilitySelect.value;

          renderSkillSection();

          saveGameData("custom skill ability");
        });

        skillWrap.appendChild(nameInput);
        skillWrap.appendChild(abilitySelect);

      } else {

        const skillLabel = document.createElement("span");

        skillLabel.style.cssText = `
    flex:1;
    font-size:0.85rem;
  `;

        skillLabel.innerHTML = `
    <strong>${sk.name}</strong>
    <span style="opacity:0.6;font-size:0.8rem;">
      (${sk.ability.toUpperCase()})
    </span>
  `;

        skillWrap.appendChild(skillLabel);
      }

      // Prof type select
      const profSel = document.createElement("select");
      profSel.style.cssText = `
width:100%;
font-size:0.78rem;
padding:2px 4px;
background:var(--background);
border:1px solid var(--surfaces);
color:var(--primary-text);
border-radius:4px;
min-width:0;
`;
      ["none", "proficient", "expertise"].forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt === "none" ? "Unproficient" : opt.charAt(0).toUpperCase() + opt.slice(1);
        if (opt === skData.type) o.selected = true;
        profSel.appendChild(o);
      });
      profSel.addEventListener("change", () => {
        skData.type = profSel.value;
        renderSkillSection();
        sheet.initiative = computeInitiative(sheet);
        initModInp.value = sheet.initiative;
        saveGameData("skill proficiency edit");
      });

      // Misc bonus
      const miscInp = document.createElement("input");
      miscInp.type = "number";
      miscInp.value = skData.miscBonus ?? 0;
      miscInp.title = "Misc bonus";
      miscInp.style.cssText = `
width:100%;
min-width:0;
font-size:0.78rem;
padding:2px 4px;
background:var(--background);
border:1px solid var(--surfaces);
color:var(--primary-text);
border-radius:4px;
text-align:center;
`;
      miscInp.addEventListener("input", () => {
        skData.miscBonus = parseInt(miscInp.value) || 0;
        renderSkillSection();
        sheet.initiative = computeInitiative(sheet);
        initModInp.value = sheet.initiative;
        saveGameData("skill misc edit");
      });


      const deleteBtn = document.createElement("button");

      if (sk.custom) {

        deleteBtn.textContent = "✕";

        deleteBtn.className = "sheet-btn-danger";
        deleteBtn.style.flexShrink = "0";

        deleteBtn.onclick = () => {

          sheet.customSkills =
            sheet.customSkills.filter(s => s.id !== sk.id);

          delete sheet.skillProficiencies[sk.id];

          renderSkillSection();

          saveGameData("custom skill removed");
        };
      }

      card.appendChild(badge);
      card.appendChild(skillWrap);
      card.appendChild(profSel);
      card.appendChild(miscInp);
      if (sk.custom) {
        card.appendChild(deleteBtn);
      }
      grid.appendChild(card);
    });

    const addSkillBtn = document.createElement("button");

    addSkillBtn.textContent = "+ Add Custom Skill";
    addSkillBtn.className = "sheet-add-btn";

    addSkillBtn.style.marginTop = "10px";

    addSkillBtn.onclick = () => {

      if (!sheet.customSkills) {
        sheet.customSkills = [];
      }

      const newSkill = {
        id: crypto.randomUUID(),
        name: "New Skill",
        ability: "dex",
        custom: true
      };

      sheet.customSkills.push(newSkill);

      sheet.skillProficiencies[newSkill.id] = {
        type: "none",
        miscBonus: 0
      };

      renderSkillSection();

      saveGameData("custom skill added");
    };

    skillsContainer.appendChild(addSkillBtn);

    skillsContainer.appendChild(grid);

    // Jack of All Trades note
    if (sheet.jackOfAllTrades) {
      const note = document.createElement("div");
      note.style.cssText = `font-size:0.8rem;color:var(--secondary-text);margin-top:4px;opacity:0.7;`;
      note.textContent = `Jack of All Trades: +${Math.floor((sheet.proficiencyBonus ?? 2) / 2)} half-prof applied to unproficient skills.`;
      skillsContainer.appendChild(note);
    }
  }

  // ── Attacks ──
  const attacksContainer = document.createElement("div");
  wrapper.appendChild(attacksContainer);

  function renderAttacksSection() {
    attacksContainer.innerHTML = "";

    const section = document.createElement("div");
    section.style.cssText = `
      display:flex;
      flex-direction:column;
      gap:8px;
      margin-top:12px;
    `;

    // Header row
    const header = document.createElement("div");
    header.style.cssText = `
      display:flex;
      justify-content:space-between;
      align-items:center;
    `;

    const title = document.createElement("h3");
    title.textContent = "Attacks";
    title.style.cssText = `
      margin:0;
      padding-bottom:5px;
      border-bottom:1px solid var(--primary-accent);
      color:var(--secondary-text);
      font-size:0.95rem;
      text-transform:uppercase;
      letter-spacing:0.06em;
      flex:1;
    `;

    const addBtn = document.createElement("button");
    addBtn.textContent = "+ Add Attack";
    addBtn.className = "sheet-add-btn";

    addBtn.onclick = () => {
      if (!sheet.attacks) sheet.attacks = [];

      sheet.attacks.push({
        name: "New Attack",
        modifier: 0
      });

      renderAttacksSection();
      saveGameData("attack added");
    };

    header.appendChild(title);
    header.appendChild(addBtn);

    section.appendChild(header);

    // Empty state
    if (!sheet.attacks || sheet.attacks.length === 0) {
      const empty = document.createElement("div");
      empty.textContent = "No attacks added.";
      empty.style.cssText = `
        opacity:0.6;
        font-size:0.9rem;
        padding:4px;
      `;
      section.appendChild(empty);
    }

    // Attack rows
    const grid = document.createElement("div");

    grid.className = "attacks-grid";

    grid.style.cssText = `
  display:grid;
  grid-template-columns:repeat(3, minmax(0, 1fr));
  gap:8px;
`;

    section.appendChild(grid);

    (sheet.attacks || []).forEach((atk, index) => {
      const row = document.createElement("div");

      row.style.cssText = `
        display:grid;
  grid-template-columns:1fr 100px auto;
  gap:8px;
  align-items:center;
  padding:8px;
  border:1px solid var(--surfaces);
  border-radius:6px;
  background:var(--background);
      `;

      // Name input
      const nameInput = textInput(
        atk.name,
        v => atk.name = v
      );

      // Modifier input
      const modInput = numInput(
        atk.modifier,
        v => atk.modifier = v,
        -20,
        99
      );

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "✕";
      deleteBtn.className = "sheet-btn-danger";

      deleteBtn.onclick = () => {
        sheet.attacks.splice(index, 1);
        renderAttacksSection();
        saveGameData("attack removed");
      };

      row.appendChild(nameInput);
      row.appendChild(modInput);
      row.appendChild(deleteBtn);

      grid.appendChild(row);
    });

    attacksContainer.appendChild(section);
  }

  // ── Spells ──
  const spellsContainer = document.createElement("div");
  wrapper.appendChild(spellsContainer);

  function renderSpellsSection() {

    spellsContainer.innerHTML = "";

    if (!sheet.spells) {
      sheet.spells = [];
    }

    const section = document.createElement("div");

    section.style.cssText = `
    display:flex;
    flex-direction:column;
    gap:10px;
    margin-top:12px;
  `;

    // ── Header ──
    const header = document.createElement("div");

    header.style.cssText = `
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:10px;
    flex-wrap:wrap;
  `;

    const title = document.createElement("h3");

    title.textContent = "Spells";

    title.style.cssText = `
    margin:0;
    padding-bottom:5px;
    border-bottom:1px solid var(--primary-accent);
    color:var(--secondary-text);
    font-size:0.95rem;
    text-transform:uppercase;
    letter-spacing:0.06em;
    flex:1;
  `;

    header.appendChild(title);

    // ── Add Custom Spell ──
    const addBtn = document.createElement("button");

    addBtn.textContent = "+ Custom Spell";

    addBtn.className = "sheet-add-btn";

    addBtn.onclick = () => {

      sheet.spells.push({
        custom: true,
        name: "New Spell",
        level: 0,
        scaling: {
          type: "None",
          every: 0,
          add: 0
        },
        attacks: 0,
        saves: {
          count: 0,
          type: "dex"
        }
      });

      renderSpellsSection();

      saveGameData("custom spell added");
    };

    header.appendChild(addBtn);

    section.appendChild(header);

    // ── Import Existing Spell ──
    const importRow = document.createElement("div");

    importRow.style.cssText = `
    display:flex;
    gap:8px;
    flex-wrap:wrap;
    align-items:center;
  `;

    const spellSelect = document.createElement("select");

    spellSelect.style.cssText = `
    flex:1;
    min-width:240px;
    padding:6px 8px;
    background:var(--background);
    border:1px solid var(--surfaces);
    color:var(--primary-text);
    border-radius:6px;
  `;

    const placeholder = document.createElement("option");

    placeholder.value = "";
    placeholder.textContent = "Select spell...";

    spellSelect.appendChild(placeholder);

    loadSpellDatabase().then(db => {

      const allSpells = getAllSpells(db);

      const spellsByLevel = {};

      allSpells.forEach(spell => {

        if (!spellsByLevel[spell.level]) {
          spellsByLevel[spell.level] = [];
        }

        spellsByLevel[spell.level].push(spell);
      });

      // SORT LEVELS NUMERICALLY
      Object.keys(spellsByLevel)
        .map(Number)
        .sort((a, b) => a - b)
        .forEach(level => {

          const group = document.createElement("optgroup");

          group.label =
            level === 0
              ? "Cantrips"
              : `Level ${level}`;

          // SORT SPELLS ALPHABETICALLY
          spellsByLevel[level]
            .sort((a, b) =>
              a.name.localeCompare(b.name)
            )
            .forEach(spell => {

              const opt = document.createElement("option");

              opt.value = spell.id;

              opt.textContent = spell.name;

              group.appendChild(opt);
            });

          spellSelect.appendChild(group);
        });
    });

    const importBtn = document.createElement("button");

    importBtn.textContent = "+ Add Existing Spell";

    importBtn.className = "sheet-add-btn";

    importBtn.onclick = async () => {

      const spellId = spellSelect.value;

      if (!spellId) {
        return;
      }

      const db = await loadSpellDatabase();

      let foundSpell = null;

      Object.entries(db).forEach(([level, spells]) => {

        if (spells[spellId]) {

          foundSpell = {
            id: spellId,
            level: Number(level),
            ...spells[spellId]
          };
        }
      });

      if (!foundSpell) {
        return;
      }

      sheet.spells.push({
        source: "database",
        spellId: foundSpell.id,
        name: foundSpell.name,
        level: foundSpell.level,
        custom: false
      });

      renderSpellsSection();

      saveGameData("spell imported");
    };

    importRow.appendChild(spellSelect);
    importRow.appendChild(importBtn);

    section.appendChild(importRow);

    // ── Empty State ──
    if (sheet.spells.length === 0) {

      const empty = document.createElement("div");

      empty.textContent = "No spells added.";

      empty.style.cssText = `
      opacity:0.6;
      font-size:0.9rem;
      padding:4px;
    `;

      section.appendChild(empty);
    }

    // ── Spell Grid ──
    const spellGrid = document.createElement("div");

    spellGrid.style.cssText = `
  display:grid;
  grid-template-columns:
    repeat(auto-fill, minmax(170px, 1fr));
  gap:8px;
  align-items:start;
`;

    section.appendChild(spellGrid);

    // ── Sort Spells ──
    // Level ascending, then alphabetically
    const sortedSpells = [...sheet.spells].sort((a, b) => {

      // Sort by level first
      if ((a.level ?? 0) !== (b.level ?? 0)) {
        return (a.level ?? 0) - (b.level ?? 0);
      }

      // Then alphabetically
      return (a.name ?? "").localeCompare(b.name ?? "");
    });

    // Spell Cards
    sortedSpells.forEach((spell) => {

      // Find original index for deletion
      const index = sheet.spells.indexOf(spell);

      const card = document.createElement("div");

      card.style.cssText = `
      display:flex;
      flex-direction:column;
      gap:5px;
      padding:8px;
      border:1px solid var(--surfaces);
      border-radius:8px;
      background:var(--background);
    `;

      // Top Row
      const top = document.createElement("div");

      top.style.cssText = `
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:10px;
      flex-wrap:wrap;
    `;

      // Left Side
      const info = document.createElement("div");

      info.style.cssText = `
      display:flex;
      flex-direction:column;
      gap:4px;
    `;

      if (spell.custom) {

        const nameInput = textInput(
          spell.name,
          v => spell.name = v
        );

        info.appendChild(nameInput);

      } else {

        const title = document.createElement("div");

        title.innerHTML = `
        <strong>${spell.name}</strong>
        <span style="opacity:0.6;">
          • Level ${spell.level}
        </span>
      `;

        info.appendChild(title);
      }

      // Only show summary meta for imported spells
      if (!spell.custom) {

        const meta = document.createElement("div");

        meta.style.cssText = `
    display:flex;
    gap:8px;
    flex-wrap:wrap;
    font-size:0.72rem;
    opacity:0.75;
  `;

        meta.innerHTML = `
    <span>ATK ${spell.attacks}</span>
    <span>
      SAVE ${spell.saves?.count ?? 0}
      ${(spell.saves?.type ?? "dex").toUpperCase()}
    </span>
  `;

        info.appendChild(meta);
      }

      top.appendChild(info);

      // Delete Button
      const deleteBtn = document.createElement("button");

      deleteBtn.textContent = "✕";

      deleteBtn.className = "sheet-btn-danger";

      deleteBtn.onclick = () => {

        sheet.spells.splice(index, 1);

        renderSpellsSection();

        saveGameData("spell removed");
      };

      top.appendChild(deleteBtn);

      card.appendChild(top);

      // Editable Custom Fields
      if (spell.custom) {

        // Ensure scaling exists
        if (!spell.scaling) {

          spell.scaling = {
            type: "spellSlot",
            every: 1,
            add: 1
          };
        }

        const grid = document.createElement("div");

        grid.style.cssText = `
    display:grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap:6px;
  `;

        function labeledField(labelText, input) {

          const wrap = document.createElement("div");

          wrap.style.cssText = `
      display:flex;
      flex-direction:column;
      gap:3px;
    `;

          const label = document.createElement("label");

          label.textContent = labelText;

          label.style.cssText = `
      font-size:0.68rem;
      opacity:0.7;
      text-transform:uppercase;
      letter-spacing:0.04em;
    `;

          wrap.appendChild(label);
          wrap.appendChild(input);

          return wrap;
        }

        // Level
        grid.appendChild(
          labeledField(
            "Level",
            numInput(
              spell.level,
              v => spell.level = v,
              0,
              9
            )
          )
        );

        // Attacks
        grid.appendChild(
          labeledField(
            "Attacks",
            numInput(
              spell.attacks,
              v => spell.attacks = v,
              0,
              20
            )
          )
        );

        // Save Count
        grid.appendChild(
          labeledField(
            "Save Count",
            numInput(
              spell.saves?.count ?? 0,
              v => spell.saves.count = v,
              0,
              20
            )
          )
        );

        // Save Type
        grid.appendChild(
          labeledField(
            "Save Type",
            selectInput(
              ABILITY_KEYS,
              spell.saves?.type ?? "dex",
              v => spell.saves.type = v
            )
          )
        );

        // Scaling Type
        grid.appendChild(
          labeledField(
            "Scaling Type",
            selectInput(
              ["spellSlot", "characterLevel", "none"],
              spell.scaling?.type ?? "spellSlot",
              v => spell.scaling.type = v
            )
          )
        );

        // Scaling Every
        grid.appendChild(
          labeledField(
            "Scale Every",
            numInput(
              spell.scaling?.every ?? 1,
              v => spell.scaling.every = v,
              1,
              20
            )
          )
        );

        // Scaling Add
        grid.appendChild(
          labeledField(
            "Scale Add",
            numInput(
              spell.scaling?.add ?? 1,
              v => spell.scaling.add = v,
              0,
              20
            )
          )
        );

        card.appendChild(grid);
      }

      spellGrid.appendChild(card);
    });

    spellsContainer.appendChild(section);
  }

  renderAttacksSection();
  renderSpellsSection();
  renderSkillSection();
  sheet.initiative = computeInitiative(sheet);
  initModInp.value = sheet.initiative;

  return wrapper;
}

// ── Add Character Modal ──────────────────────────────────────
function openAddCharacterModal() {
  const modal = document.getElementById("character-sheet-modal");

  modal.innerHTML = `
    <div class="sheet-popup">
      <h3>Add Character</h3>
      <input id="new-character-name" placeholder="Character Name">
      <button id="confirm-add-character">Add</button>
      <button id="cancel-add-character">Cancel</button>
    </div>
  `;

  modal.classList.remove("hidden");

  document.getElementById("confirm-add-character").onclick = () => {
    addNewCharacter(
      document.getElementById("new-character-name").value
    );
    modal.classList.add("hidden");
  };

  document.getElementById("cancel-add-character").onclick = () => {
    modal.classList.add("hidden");
  };
}

// Keep openSheetEditor for backward compatibility / can also be called from other places
function openSheetEditor(name) {
  sheetTabSelectedCharacter = name;
  renderSheetTab();
  // Scroll to editor
  const editorArea = document.getElementById("sheet-editor-area");
  if (editorArea) editorArea.scrollIntoView({ behavior: "smooth", block: "start" });
}

window.renderSheetTab = renderSheetTab;
window.openAddCharacterModal = openAddCharacterModal;
window.openSheetEditor = openSheetEditor;
window.addNewCharacter = addNewCharacter;
window.removeCharacter = removeCharacter;
window.createSheetForCharacter = createSheetForCharacter;
window.toggleCharacterActive = toggleCharacterActive;

// -------------------- D20 & INPUT --------------------
function openUnifiedActionModal(characterName, type, includeDamage = false) {
  return new Promise(resolve => {
    const container = document.createElement("div");

    const rollLabel = document.createElement("p");
    rollLabel.textContent = "Select D20 Roll:";
    playSoundFromUrl("https://cdn.pixabay.com/audio/2022/03/20/audio_88eba5c9da.mp3", 0.3);
    container.appendChild(rollLabel);

    const rollButtons = document.createElement("div");
    rollButtons.style.cssText = `display:flex;flex-wrap:wrap;gap:4px;`;

    let selectedRoll = null;
    for (let i = 1; i <= 20; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.style.cssText = `width:36px;height:36px;border-radius:6px;border:1px solid #666;background:#222;color:#fff;cursor:pointer;display:flex;justify-content:center;align-items:center;transition:all 0.15s ease;`;

      btn.onclick = () => {
        selectedRoll = i;
        if (i === 1) playSoundFromUrl("https://cdn.pixabay.com/audio/2022/03/10/audio_e4e7943871.mp3", 0.3);
        if (i === 20) playSoundFromUrl("https://cdn.pixabay.com/audio/2021/08/09/audio_2e957962fc.mp3", 1.0);
        [...rollButtons.children].forEach(b => { b.style.background = "#222"; b.style.color = "#fff"; b.style.transform = "scale(1)"; });
        btn.style.background = "red";
        btn.style.color = "#fff";
        btn.style.transform = "scale(1.1)";
      };
      rollButtons.appendChild(btn);
    }
    container.appendChild(rollButtons);

    const modLabel = document.createElement("label");
    modLabel.textContent = "Modifier:";
    const modInput = document.createElement("input");
    modInput.type = "number";
    modInput.style.width = "60px";
    modInput.classList.add("roll-mod-input");
    let defaultModifier = 0;

    if (type.startsWith("Initiative")) {
      defaultModifier =
        gameData.characterSheets?.[
          characterName
        ]?.initiative ?? 0;
    }

    modInput.value = defaultModifier;
    modInput.style.cssText = `margin-left:6px;width:100px;`;
    container.appendChild(document.createElement("br"));
    container.appendChild(modLabel);
    container.appendChild(modInput);

    let dmgInput = null;
    if (includeDamage) {
      const dmgLabel = document.createElement("label");
      dmgLabel.textContent = "Damage:";
      dmgInput = document.createElement("input");
      dmgInput.type = "number";
      dmgInput.value = "0";
      dmgInput.style.cssText = `margin-left:6px;width:100px;`;
      container.appendChild(document.createElement("br"));
      container.appendChild(dmgLabel);
      container.appendChild(dmgInput);
    }

    showModal(`Perform ${type} Roll`, container, () => {
      if (selectedRoll === null) { alert("Please select a D20 roll before confirming."); return; }
      const modifier = parseInt(modInput.value) || 0;
      const damage = dmgInput ? parseInt(dmgInput.value) || 0 : 0;
      resolve({ roll: selectedRoll, modifier, damage });
    });

    const cancelBtn = document.getElementById("modal-cancel");
    cancelBtn.onclick = () => { hideModal(); resolve(null); };
    triggerEasterEgg();
  });
}

async function openMultiRollModal(characterName, type, includeDamage = false) {
  return new Promise(resolve => {
    const modButtonContainer = document.createElement("div");

    modButtonContainer.style.cssText = `
  display:grid;
  grid-auto-flow:column;
  grid-template-rows:repeat(6, auto);
  gap:6px;
  margin-bottom:12px;
  width:100%;
  align-items:start;
`;

    const container = document.createElement("div");

    const typeLabel = document.createElement("p");
    typeLabel.textContent = `Enter number of ${type} rolls and set values:`;
    container.appendChild(typeLabel);
    container.appendChild(modButtonContainer);
    const countLabel = document.createElement("label");
    countLabel.textContent = "Number of Rolls:";
    const countInput = document.createElement("input");
    countInput.type = "number";
    countInput.min = 1;
    countInput.max = 90;
    countInput.value = 1;
    countInput.style.width = "60px";
    container.appendChild(countLabel);
    container.appendChild(countInput);
    container.appendChild(document.createElement("hr"));

    const rollsContainer = document.createElement("div");
    rollsContainer.style.cssText = `
    display:grid;
    grid-gap:10px;
    justify-content:center`;
    container.appendChild(rollsContainer);

    const maxPerColumn = 10;
    const rowHeight = 36;

    function buildHeaderRow() {
      const headerRow = document.createElement("div");
      headerRow.style.cssText = `display:grid;grid-template-columns:60px 60px${includeDamage ? " 60px" : ""};font-weight:bold;margin-bottom:4px;height:${rowHeight}px;align-items:center;`;
      ["D20", "Mod", ...(includeDamage ? ["Dmg"] : [])].forEach(text => {
        const d = document.createElement("div");
        d.textContent = text;
        d.style.textAlign = "center";
        headerRow.appendChild(d);
      });
      return headerRow;
    }

    function buildModifierGroups() {
      const sheet = gameData.characterSheets?.[characterName];
      if (!sheet) return {};

      const groups = {};

      function addMod(label, value) {
        if (value === undefined || value === null) return;

        const key = Number(value);

        if (!groups[key]) {
          groups[key] = [];
        }

        groups[key].push(label);
      }

      switch (type) {

        case "Attack":
          (sheet.attacks || []).forEach(atk => {
            addMod(atk.name, atk.modifier);
          });
          break;

        case "Save":
          ABILITY_KEYS.forEach(key => {
            addMod(
              `${ABILITY_LABELS[key]} Save`,
              computeSaveTotal(sheet, key)
            );
          });
          break;

        case "Ability":
          const allSkills = [
            ...DND5E_SKILLS,
            ...(sheet.customSkills || [])
          ];

          allSkills.forEach(sk => {
            addMod(
              sk.name,
              computeSkillTotal(sheet, sk.name, sk.ability)
            );
          });
          break;
      }

      return groups;
    }

    function renderModifierButtons() {

      modButtonContainer.innerHTML = "";

      const groups = buildModifierGroups();

      Object.entries(groups).forEach(([mod, labels]) => {

        const btn = document.createElement("button");

        btn.type = "button";

        btn.textContent =
          `${mod >= 0 ? "+" : ""}${mod} (${labels.join(", ")})`;

        btn.style.cssText = `
  width:100%;
  text-align:left;
  padding:8px 10px;
  border-radius:6px;
  cursor:pointer;
  border:1px solid var(--primary-accent);
  background:var(--surface-color);
  color:var(--primary-text);
  font-size:0.85rem;
  overflow-wrap:anywhere;
`;

        btn.addEventListener("click", () => {

          rollsContainer.querySelectorAll(".roll-mod-input")
            .forEach(input => {
              input.value = Number(mod);
            });

        });

        modButtonContainer.appendChild(btn);
      });
    }



    function rebuildRows() {
      const currentValues = [];
      rollsContainer.querySelectorAll("div").forEach(colDiv => {
        [...colDiv.children].slice(1).forEach(row => {
          const inputs = [...row.querySelectorAll("input")];
          currentValues.push(inputs.map(input => input.value));
        });
      });

      rollsContainer.innerHTML = "";
      const numRolls = parseInt(countInput.value) || 1;
      const numColumns = Math.ceil(numRolls / maxPerColumn);
      rollsContainer.style.gridTemplateColumns = `repeat(${numColumns}, auto)`;

      for (let col = 0; col < numColumns; col++) {
        const columnDiv = document.createElement("div");
        columnDiv.style.cssText = `display:grid;row-gap:6px;align-content:start;`;
        columnDiv.appendChild(buildHeaderRow());

        for (let i = col * maxPerColumn; i < Math.min((col + 1) * maxPerColumn, numRolls); i++) {
          const inputRow = document.createElement("div");
          inputRow.style.cssText = `display:grid;grid-template-columns:60px 60px${includeDamage ? " 60px" : ""};gap:6px;height:${rowHeight}px;align-items:center;`;

          const d20Input = document.createElement("input");
          d20Input.type = "number"; d20Input.min = 1; d20Input.max = 20; d20Input.style.width = "60px";
          const modInput = document.createElement("input");
          modInput.type = "number";
          modInput.style.width = "60px";
          modInput.classList.add("roll-mod-input");
          const dmgInput = includeDamage ? document.createElement("input") : null;
          if (dmgInput) { dmgInput.type = "number"; dmgInput.style.width = "60px"; }

          let sheetMod = 0;
          if (type === "Initiative") {
            sheetMod = gameData.characterSheets?.[characterName]?.initiative ?? 0;
          }

          const saved = currentValues[i] || [];
          d20Input.value = saved[0] ?? 1;
          modInput.value = saved[1] ?? sheetMod;
          if (dmgInput) dmgInput.value = saved[2] ?? 0;

          inputRow.append(d20Input, modInput);
          if (dmgInput) inputRow.appendChild(dmgInput);
          columnDiv.appendChild(inputRow);
        }
        rollsContainer.appendChild(columnDiv);
      }
    }

    renderModifierButtons();
    rebuildRows();
    countInput.addEventListener("input", rebuildRows);

    showModal(`Perform ${type} Rolls — ${characterName}`, container, () => {
      const results = [];
      [...rollsContainer.children].forEach(colDiv => {
        [...colDiv.children].slice(1).forEach(row => {
          const inputs = [...row.querySelectorAll("input")];
          const roll = parseInt(inputs[0].value) || 1;
          const modifier = parseInt(inputs[1].value) || 0;
          const damage = includeDamage ? parseInt(inputs[2].value) || 0 : 0;
          results.push({ roll, modifier, damage });
        });
      });
      return resolve(results);
    });
  });
}

async function inputAction(characterName, type, label) {
  if (!characterName) return;
  const stats = gameData.characterStats[characterName];
  if (!stats) return;

  if (type === "money") {
    const coins = await openMoneyModal(`${characterName} — ${label}`, `Enter coins spent:`);
    if (!coins) return;
    const goldValue = (coins.cp / 100) + (coins.sp / 10) + (coins.ep / 2) + coins.gp + (coins.pp * 10);
    const total = parseFloat(goldValue.toFixed(2));
    stats.moneySpent = parseFloat((stats.moneySpent + total).toFixed(2));
    showTrackerMessage(`${characterName} ${label}: ${total} gp`);
    updateStatsAndRender(characterName);
    return;
  }

  const step = type === "money" ? 0.01 : 1;
  const num = await openNumberModal(`${characterName} — ${label}`, `Enter amount of ${label}:`, step);
  if (num === null) return;

  switch (type) {
    case "damage": stats.attackDamage += Math.round(num); break;
    case "healing": stats.healingDone += Math.round(num); break;
  }

  showTrackerMessage(`${characterName} ${label}: ${num}`);
  updateStatsAndRender(characterName);
}

function openMoneyModal(title, prompt) {
  return new Promise(resolve => {
    const container = document.createElement("div");
    const label = document.createElement("label");
    label.textContent = prompt;
    container.appendChild(label);
    container.appendChild(document.createElement("br"));

    const coins = [
      { key: "cp", label: "Copper (cp)" },
      { key: "sp", label: "Silver (sp)" },
      { key: "ep", label: "Electrum (ep)" },
      { key: "gp", label: "Gold (gp)" },
      { key: "pp", label: "Platinum (pp)" }
    ];

    const inputs = {};
    coins.forEach(c => {
      const row = document.createElement("div");
      row.style.marginTop = "6px";
      const l = document.createElement("label");
      l.textContent = c.label + ": ";
      const input = document.createElement("input");
      input.type = "number"; input.step = 1; input.min = 0; input.value = "";
      input.style.width = "80px";
      input.addEventListener("input", () => { input.value = Math.max(0, Math.round(input.value || 0)); });
      inputs[c.key] = input;
      row.appendChild(l);
      row.appendChild(input);
      container.appendChild(row);
    });

    showModal(title, container, () => {
      const result = {};
      for (const key in inputs) { const val = parseInt(inputs[key].value); result[key] = isNaN(val) ? 0 : val; }
      hideModal();
      resolve(result);
    });

    document.getElementById("modal-cancel").onclick = () => { hideModal(); resolve(null); };
  });
}

function openNumberModal(title, prompt, step = 0) {
  return new Promise(resolve => {
    const container = document.createElement("div");
    const label = document.createElement("label");
    label.textContent = prompt;
    container.appendChild(label);

    const input = document.createElement("input");
    input.type = "number"; input.step = step; input.value = step;
    input.style.marginLeft = "6px";
    if (step === 1) input.addEventListener("input", () => { input.value = Math.round(input.value); });

    container.appendChild(document.createElement("br"));
    container.appendChild(input);

    showModal(title, container, () => {
      const value = parseFloat(input.value);
      if (isNaN(value)) { alert("Please enter a valid number."); return; }
      hideModal();
      resolve(value);
    });

    document.getElementById("modal-cancel").onclick = () => { hideModal(); resolve(null); };
  });
}

function openCastSpellModal(characterName, SPELL_DATABASE) {
  return new Promise(resolve => {

    const spell = {
      name: "",
      selectedSpell: null,
      attacks: [],
      saves: [],
      spellResistance: [],
      saveType: "dex",
      scaling: null,
      baseLevel: 0,
      slotLevel: 0,
      extra: { damage: 0, healing: 0 }
    };

    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      display:grid;
      grid-template-columns:320px 1fr 300px;
      gap:16px;
      align-items:start;
      max-height:75vh;
    `;

    const left = document.createElement("div");
    const right = document.createElement("div");
    const spellLibrary = document.createElement("div");
    spellLibrary.style.cssText = `border-left:1px solid var(--surfaces);padding-left:12px;overflow:auto;max-height:70vh;`;
    wrapper.append(left, right, spellLibrary);

    const attackSection = document.createElement("div");
    const saveSection = document.createElement("div");
    const srSection = document.createElement("div");
    right.append(attackSection, saveSection, srSection);

    // ── HELPERS ──────────────────────────────────────────────────

    function createBoundInput(obj, key, min = null, max = null, onChange = null) {
      const input = document.createElement("input");
      input.type = "number";
      if (min !== null) input.min = min;
      if (max !== null) input.max = max;
      input.value = obj[key] ?? 0;
      input.addEventListener("input", () => {
        obj[key] = parseInt(input.value) || 0;
        if (onChange) onChange();
      });
      return input;
    }

    // Shared input style matching the rest of the modal
    const inputStyle = `
      width:60px;
      padding:4px 6px;
      background:var(--background);
      border:1px solid var(--surfaces);
      color:var(--primary-text);
      border-radius:4px;
      font-size:0.9rem;
    `;

    function createCountInput(labelText, onChange) {
      const row = document.createElement("div");
      row.style.cssText = `display:flex;align-items:center;gap:8px;margin-bottom:8px;`;
      const l = document.createElement("label");
      l.textContent = labelText + ":";
      l.style.cssText = `font-size:0.9rem;min-width:120px;`;
      const i = document.createElement("input");
      i.type = "number";
      i.min = 0;
      i.value = 0;
      i.style.cssText = inputStyle;
      i.addEventListener("input", () => onChange(parseInt(i.value) || 0));
      row.append(l, i);
      return { row, input: i };
    }

    function createNumberInput(labelText, onChange) {
      const row = document.createElement("div");
      row.style.cssText = `display:flex;align-items:center;gap:8px;margin-bottom:8px;`;
      const l = document.createElement("label");
      l.textContent = labelText + ":";
      l.style.cssText = `font-size:0.9rem;min-width:120px;`;
      const i = document.createElement("input");
      i.type = "number";
      i.value = 0;
      i.style.cssText = inputStyle;
      i.addEventListener("input", () => onChange(parseFloat(i.value) || 0));
      row.append(l, i);
      return row;
    }

    function buildColumnHeader(labels) {
      const row = document.createElement("div");
      row.style.cssText = `display:grid;grid-template-columns:120px repeat(${labels.length},1fr);font-weight:bold;margin-bottom:4px;`;
      row.appendChild(document.createElement("div"));
      labels.forEach(text => {
        const cell = document.createElement("div");
        cell.textContent = text;
        cell.style.textAlign = "center";
        row.appendChild(cell);
      });
      return row;
    }

    // ── SCALING CALCULATOR ───────────────────────────────────────

    function getScaledCounts(baseAttacks, baseSaves, scaling, slotLevel, charLevel, baseLevel) {
      if (!scaling || scaling.type === "none") {
        return { attacks: baseAttacks, saves: baseSaves };
      }
      let increments = 0;
      if (scaling.type === "spellSlot") {
        increments = Math.floor(Math.max(0, slotLevel - baseLevel) / (scaling.every || 1));
      } else if (scaling.type === "characterLevel") {
        // characterLevel scaling: every N levels above 0
        console.log("HIT: LEVEL")
        if (charLevel > 16) {
          increments = 3;
          console.log("HIT: 17")
        }
        else if (charLevel > 10) {
          increments = 2;
          console.log("HIT: 11")
        }
        else if (charLevel > 4) {
          increments = 1;
          console.log("HIT: 5")
        }
        else {
          increments = 0;
          console.log("HIT: 0")
        }
      }
      console.log(baseLevel, slotLevel, increments)
      return {
        attacks: baseAttacks > 0 ? baseAttacks + increments * (scaling.add || 1) : 0,
        saves: baseSaves > 0 ? baseSaves + increments * (scaling.add || 1) : 0
      };
    }

    // ── ATTACK / SAVE / SR ROWS ──────────────────────────────────

    function buildAttackRow(atk, index) {
      const row = document.createElement("div");
      row.style.cssText = `display:grid;grid-template-columns:120px 1fr 1fr 1fr;gap:6px;align-items:center;`;
      const label = document.createElement("div");
      label.textContent = `Atk ${index + 1}`;
      row.append(label, createBoundInput(atk, "roll", 1, 20), createBoundInput(atk, "modifier"), createBoundInput(atk, "damage"));
      return row;
    }

    function buildSaveRow(sv, index, casterName) {
      const row = document.createElement("div");
      row.style.cssText = `display:grid;grid-template-columns:120px 1.5fr 1fr 1fr;gap:6px;align-items:center;`;
      const label = document.createElement("div");
      label.textContent = `Save ${index + 1}`;

      const targetSelect = document.createElement("select");
      const emptyOpt = document.createElement("option");
      emptyOpt.value = ""; emptyOpt.textContent = "-- Select Target --";
      targetSelect.appendChild(emptyOpt);
      getActiveCharacters().forEach(char => {
        const opt = document.createElement("option"); opt.value = char; opt.textContent = char;
        targetSelect.appendChild(opt);
      });

      function updateTarget(newTarget) {
        const oldTarget = sv.target;
        if (oldTarget && oldTarget !== newTarget) {
          const oldStats = gameData.characterStats?.[oldTarget];
          if (oldStats?.savesFromSpells) {
            oldStats.savesFromSpells = oldStats.savesFromSpells.filter(s => s !== sv);
            recalcCharacterStats(oldTarget);
          }
        }
        if (newTarget && newTarget !== casterName) {
          const tStats = gameData.characterStats?.[newTarget];
          if (!tStats.savesFromSpells) tStats.savesFromSpells = [];
          if (!tStats.savesFromSpells.includes(sv)) tStats.savesFromSpells.push(sv);
        }
        sv.target = newTarget;
        if (casterName) recalcCharacterStats(casterName);
        if (newTarget) recalcCharacterStats(newTarget);
        updateSideStats();
      }

      const roll = createBoundInput(sv, "roll", 1, 20, () => { if (sv.target) recalcCharacterStats(sv.target); updateSideStats(); });
      const mod = createBoundInput(sv, "modifier", null, null, () => { if (sv.target) recalcCharacterStats(sv.target); updateSideStats(); });

      function updateSaveModifier() {
        if (!sv.target) return;
        const targetSheet = gameData.characterSheets?.[sv.target];
        if (!targetSheet) { sv.modifier = 0; mod.value = 0; return; }
        const total = computeSaveTotal(targetSheet, sv.saveType || "dex");
        sv.modifier = total; mod.value = total;
      }

      targetSelect.addEventListener("change", () => {
        updateTarget(targetSelect.value || null);
        updateSaveModifier();
        if (sv.target) { recalcCharacterStats(sv.target); updateSideStats(); }
      });
      if (sv.target) { targetSelect.value = sv.target; updateSaveModifier(); }

      row.append(label, targetSelect, roll, mod);
      return row;
    }

    function buildSRRow(sr, index) {
      const row = document.createElement("div");
      row.style.cssText = `display:grid;grid-template-columns:120px 1fr 1fr;gap:6px;align-items:center;`;
      const label = document.createElement("div"); label.textContent = `SR ${index + 1}`;
      const roll = createBoundInput(sr, "roll", 1, 20);
      const mod = createBoundInput(sr, "modifier");
      mod.addEventListener("input", () => { sr.casterLevel = sr.modifier; });
      row.append(label, roll, mod);
      return row;
    }

    // ── SYNC FUNCTIONS ───────────────────────────────────────────

    function syncAttacks(count) {
      while (spell.attacks.length < count) {
        const casterSheet = gameData.characterSheets?.[characterName];
        spell.attacks.push({ roll: 1, modifier: casterSheet?.spellAttackBonus || 0, damage: 0 });
      }
      spell.attacks.length = count;
      attackSection.innerHTML = "";
      if (count > 0) {
        attackSection.appendChild(document.createElement("h4")).textContent = "Attacks";
        attackSection.appendChild(buildColumnHeader(["D20", "Mod", "Dmg"]));
        spell.attacks.forEach((atk, i) => attackSection.appendChild(buildAttackRow(atk, i)));
      }
    }

    function syncSaves(count) {
      while (spell.saves.length < count) {
        spell.saves.push({ target: null, roll: 1, modifier: 0, saveType: spell.saveType || "dex" });
      }
      spell.saves.length = count;
      saveSection.innerHTML = "";
      if (count > 0) {
        saveSection.appendChild(document.createElement("h4")).textContent = "Saving Throws";
        saveSection.appendChild(buildColumnHeader(["Target", "D20", "Mod"]));
        spell.saves.forEach((sv, i) => { sv.saveType = spell.saveType; saveSection.appendChild(buildSaveRow(sv, i, characterName)); });
      }
    }

    function syncSR(count) {
      while (spell.spellResistance.length < count) spell.spellResistance.push({ roll: 1, modifier: 0, casterLevel: 0 });
      spell.spellResistance.length = count;
      srSection.innerHTML = "";
      if (count > 0) {
        srSection.appendChild(document.createElement("h4")).textContent = "Spell Resistance";
        srSection.appendChild(buildColumnHeader(["D20", "CL"]));
        spell.spellResistance.forEach((sr, i) => srSection.appendChild(buildSRRow(sr, i)));
      }
    }

    // ── SCALING APPLY (called on spell select AND slot change) ───

    function applyScaling() {
      if (!spell.selectedSpell) return;
      const sp = spell.selectedSpell;
      const charLevel = gameData.characterSheets?.[characterName]?.level ?? 1;
      const baseAttacks = sp.attacks ?? 0;
      const baseSaves = sp.saves?.count ?? 0;

      console.log({
        spellName: sp.name,
        scaling: spell.scaling,
        baseLevel: spell.baseLevel,
        slotLevel: spell.slotLevel
      });

      const scaled = getScaledCounts(
        baseAttacks, baseSaves,
        spell.scaling,
        spell.slotLevel,
        charLevel,
        spell.baseLevel
      );

      // Update display label
      scaledLabel.textContent = `Scaled → Attacks: ${scaled.attacks}, Saves: ${scaled.saves}`;

      // Update count inputs
      attackCountInput.input.value = scaled.attacks;
      saveCountInput.input.value = scaled.saves;

      // Rebuild attack/save rows
      syncAttacks(scaled.attacks);
      syncSaves(scaled.saves);
    }

    // ── SPELL LIBRARY ────────────────────────────────────────────

    function getCharacterSpells() {
      return gameData.characterSheets?.[characterName]?.spells || [];
    }

    function applySpellData(sp) {
      const data = getSpellDefinition(sp);

      spell.selectedSpell = data;

      spell.name = data.name;
      nameInput.value = data.name;

      spell.saveType = data.saves?.type || "dex";
      saveTypeSelect.value = spell.saveType;

      spell.scaling = data.scaling || null;
      spell.baseLevel = data.level ?? sp.level ?? 0;

      // Set slot input bounds and default to base level
      slotLevelInput.min = spell.baseLevel;
      slotLevelInput.max = 9;
      slotLevelInput.value = spell.baseLevel;
      spell.slotLevel = spell.baseLevel;

      // Show/hide slot row: only relevant for spellSlot scaling
      // (still show for characterLevel — slot level doesn't affect it but keep UI consistent)
      slotLevelRow.style.display = "flex";

      if (getCurrentEdition() === "pathfinder") {
        syncSR(data.spellResistance || 0);

        if (srCountInput) {
          srCountInput.input.value =
            data.spellResistance || 0;
        }
      }

      applyScaling();
    }

    function renderSpellLibrary() {
      spellLibrary.innerHTML = "";
      const title = document.createElement("h4");
      title.textContent = "Character Spells";
      spellLibrary.appendChild(title);

      const spells = getCharacterSpells();
      if (!spells.length) {
        const empty = document.createElement("div");
        empty.textContent = "No spells available.";
        empty.style.opacity = "0.6";
        spellLibrary.appendChild(empty);
        return;
      }

      spells.sort((a, b) => (a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name)));

      spells.forEach(sp => {
        console.log("Library spell:", sp);
        const btn = document.createElement("button");
        btn.className = "sheet-add-btn";
        btn.style.cssText = `width:100%;text-align:left;margin-bottom:6px;display:flex;flex-direction:column;gap:2px;`;
        btn.innerHTML = `<strong>${sp.name}</strong><span style="opacity:0.7;font-size:0.75rem;">Level ${sp.level}</span>`;
        btn.onclick = () => applySpellData(sp);
        spellLibrary.appendChild(btn);
      });
    }

    // ── LEFT COLUMN ──────────────────────────────────────────────

    const nameInput = document.createElement("input");
    nameInput.placeholder = "Spell Name";
    nameInput.style.cssText = `width:100%;padding:6px 8px;background:var(--background);border:1px solid var(--surfaces);color:var(--primary-text);border-radius:4px;margin-bottom:8px;`;
    nameInput.addEventListener("input", () => { spell.name = nameInput.value; });
    left.appendChild(nameInput);
    left.appendChild(document.createElement("hr"));

    // Spell Slot Level row (matches style of count inputs)
    const slotLevelRow = document.createElement("div");
    slotLevelRow.style.cssText = `display:flex;align-items:center;gap:8px;margin-bottom:8px;display:none;`;

    const slotLevelLabel = document.createElement("label");
    slotLevelLabel.textContent = "Slot Level:";
    slotLevelLabel.style.cssText = `font-size:0.9rem;min-width:120px;`;

    const slotLevelInput = document.createElement("input");
    slotLevelInput.type = "number";
    slotLevelInput.min = 0;
    slotLevelInput.max = 9;
    slotLevelInput.value = 0;
    slotLevelInput.style.cssText = inputStyle;
    slotLevelInput.addEventListener("input", () => {
      spell.slotLevel = parseInt(slotLevelInput.value) || 0;
      applyScaling();
    });

    slotLevelRow.append(slotLevelLabel, slotLevelInput);
    left.appendChild(slotLevelRow);

    // Scaled counts display
    const scaledLabel = document.createElement("div");
    scaledLabel.style.cssText = `font-size:0.78rem;opacity:0.65;margin-bottom:8px;min-height:1em;`;
    left.appendChild(scaledLabel);

    // Attack / Save count inputs
    const attackCountInput = createCountInput("Attack Rolls", v => {
      syncAttacks(v);
      // Clear scaling display if user manually overrides
      scaledLabel.textContent = "";
    });
    left.appendChild(attackCountInput.row);

    const saveCountInput = createCountInput("Saving Throws", v => {
      syncSaves(v);
      scaledLabel.textContent = "";
    });
    left.appendChild(saveCountInput.row);

    // Save Type
    const saveTypeRow = document.createElement("div");
    saveTypeRow.style.cssText = `display:flex;align-items:center;gap:8px;margin-top:6px;margin-bottom:10px;`;
    const saveTypeLabel = document.createElement("label");
    saveTypeLabel.textContent = "Save Type:";
    saveTypeLabel.style.cssText = `font-size:0.9rem;min-width:120px;`;
    const saveTypeSelect = document.createElement("select");
    saveTypeSelect.style.cssText = inputStyle;
    ABILITY_KEYS.forEach(ab => {
      const opt = document.createElement("option"); opt.value = ab; opt.textContent = ab.toUpperCase();
      if (ab === spell.saveType) opt.selected = true;
      saveTypeSelect.appendChild(opt);
    });
    saveTypeSelect.addEventListener("change", () => {
      spell.saveType = saveTypeSelect.value;
      spell.saves.forEach(save => {
        save.saveType = spell.saveType;
        if (save.target) {
          const targetSheet = gameData.characterSheets?.[save.target];
          if (targetSheet) save.modifier = computeSaveTotal(targetSheet, save.saveType);
          recalcCharacterStats(save.target);
        }
      });
      syncSaves(spell.saves.length);
      updateSideStats();
    });
    saveTypeRow.append(saveTypeLabel, saveTypeSelect);
    left.appendChild(saveTypeRow);

    // SR Count (Pathfinder only)
    let srCountInput = null;
    if (getCurrentEdition() === "pathfinder") {
      srCountInput = createCountInput("Spell Resistance", v => syncSR(v));
      left.appendChild(srCountInput.row);
    }

    left.appendChild(document.createElement("hr"));
    left.appendChild(createNumberInput("Extra Damage", v => { spell.extra.damage = v; }));
    left.appendChild(createNumberInput("Extra Healing", v => { spell.extra.healing = v; }));

    // ── INIT ─────────────────────────────────────────────────────

    renderSpellLibrary();

    showModal(`Cast Spell — ${characterName}`, wrapper, () => {
      spell.name = spell.name || "New Spell";
      resolve(spell);
    });

    document.getElementById("modal-cancel").onclick = () => { hideModal(); resolve(null); };
  });
}

function openCharacterSelectModal(title) {
  return new Promise(resolve => {
    const container = document.createElement("div");
    const select = document.createElement("select");
    gameData.characters.forEach(name => {
      const opt = document.createElement("option"); opt.value = name; opt.textContent = name; select.appendChild(opt);
    });
    container.appendChild(document.createTextNode(title));
    container.appendChild(document.createElement("br"));
    container.appendChild(select);
    showModal(title, container, () => { resolve(select.value); });
    document.getElementById("modal-cancel").onclick = () => { hideModal(); resolve(null); };
  });
}

function updateStatsAndRender(characterName) {
  renderEditorStats(characterName);
  updateSideStats();
  renderStatsActions(characterName);
}

// -------------------- CHARACTER HANDLING --------------------
function selectCharacter(nameOrTag) {
  const statName = resolveToStatName(nameOrTag) || nameOrTag;
  if (!statName || !gameData.characterStats[statName]) {
    console.warn("selectCharacter: could not resolve", nameOrTag);
    return;
  }
  selectedCharacter = statName;
  if (typeof nameOrTag === "string") {
    const entry = resolveEntryByTag(nameOrTag) || initiativeOrder.find(e => e.displayName === nameOrTag);
    selectedTag = entry?.tag || null;
  } else {
    selectedTag = null;
  }
  updateSideStats();
  renderStatsActions(selectedCharacter);
  renderSpellEditor(selectedCharacter);
  renderEditorStats(selectedCharacter);
  highlightSelectedButton(selectedCharacter);
}

// -------------------- INITIATIVE --------------------
function renderInitiativeControls() {
  const controlsDiv = document.getElementById("initiative-controls");
  if (!controlsDiv) return;

  controlsDiv.innerHTML = `
    <button id="add-init-btn">Add Initiative</button>
    <button id="clear-init-btn">Clear All</button>
    <button id="next-turn-btn" disabled>Next Turn</button>
    <button id="prev-turn-btn" disabled>Previous Turn</button>
  `;

  const nextBtn = document.getElementById("next-turn-btn");
  const prevBtn = document.getElementById("prev-turn-btn");

  const updateTurnButtons = () => {
    const hasInit = initiativeOrder.length > 0;
    nextBtn.disabled = !hasInit;
    prevBtn.disabled = !hasInit;
    nextBtn.style.display = hasInit ? "inline-block" : "none";
    prevBtn.style.display = hasInit ? "inline-block" : "none";
  };
  updateTurnButtons();

  document.getElementById("add-init-btn").onclick = async () => {
    const name = await openCharacterSelectModal("Select a character for initiative");
    if (!name || !gameData.characterStats[name]) return;
    const stats = gameData.characterStats[name];
    if (!stats.initiativeRolls) stats.initiativeRolls = [];
    stats.isActiveInCombat = true;
    const result = await openUnifiedActionModal(name, "Initiative", false);
    if (!result) return;
    const { roll, modifier } = result;
    const total = roll + modifier;
    const tag = crypto.randomUUID();
    let displayName = name;
    let source = name;
    if (name === "NPC") {
      const npcPool = gameData.characterStats["NPC"];
      if (!npcPool.initiativeRolls) npcPool.initiativeRolls = [];
      const nextNpcNumber = npcPool.initiativeRolls.filter(r => r.isVisibleInOrder !== false).length + 1;
      displayName = `NPC ${nextNpcNumber}`;
      source = "NPC";
    }
    const entry = { roll, modifier, total, isVisibleInOrder: true, tag, displayName, source };
    stats.initiativeRolls.push(entry);
    initiativeOrder.push({ tag, displayName, initiative: total, source });
    initiativeOrder.sort((a, b) => b.initiative - a.initiative);
    critChecker(name, roll);
    renderInitiative();
    updateSideStats();
    updateTurnButtons();
  };

  document.getElementById("next-turn-btn").onclick = () => {
    if (initiativeOrder.length > 0) {
      currentTurnIndex = (currentTurnIndex + 1) % initiativeOrder.length;
      const activeName = getCurrentTurnCharacter();
      if (activeName) selectCharacter(activeName);
      renderInitiative();
    }
  };

  document.getElementById("prev-turn-btn").onclick = () => {
    if (initiativeOrder.length > 0) {
      currentTurnIndex = (currentTurnIndex - 1 + initiativeOrder.length) % initiativeOrder.length;
      const activeName = getCurrentTurnCharacter();
      if (activeName) selectCharacter(activeName);
      renderInitiative();
    }
  };

  document.getElementById("clear-init-btn").onclick = () => {
    if (confirm("Clear all initiative entries?")) {
      initiativeOrder = [];
      currentTurnIndex = 0;
      npcCount = 0;
      Object.values(gameData.characterStats).forEach(stats => {
        stats.isActiveInCombat = false;
        if (Array.isArray(stats.initiativeRolls)) {
          stats.initiativeRolls.forEach(entry => { entry.isVisibleInOrder = false; });
        }
      });
      renderInitiative();
      updateSideStats();
      updateTurnButtons();
    }
  };
}

function updateTurnButtons() {
  const prevBtn = document.getElementById("prev-turn-btn");
  const nextBtn = document.getElementById("next-turn-btn");
  const reactionBtn = document.getElementById("reaction-btn");
  const show = combatStarted;

  [prevBtn, nextBtn].forEach(btn => { if (btn) btn.style.display = show ? "inline-block" : "none"; });

  if (reactionBtn) {
    reactionBtn.style.display = show ? "inline-block" : "none";
  } else {
    const container = document.getElementById("initiative-controls");
    if (container && show) {
      const btn = document.createElement("button");
      btn.id = "reaction-btn";
      btn.textContent = "Reaction";
      btn.onclick = handleReactionMode;
      container.appendChild(btn);
    }
  }
}

function updateCombatTabVisibility() {
  const combatTabBtn = document.getElementById("combat-tab-btn");
  const statsTabBtn = document.getElementById("stats-tab-btn");
  const combatToggleBtn = document.getElementById("combat-toggle-btn");

  if (combatTabBtn) combatTabBtn.style.display = combatStarted ? "inline-block" : "none";
  if (statsTabBtn) statsTabBtn.style.display = combatStarted ? "none" : "inline-block";
  if (combatToggleBtn) {
    combatToggleBtn.textContent = combatStarted ? "🏳️ End Combat" : "⚔️ Start Combat";
    combatToggleBtn.style.background = combatStarted ? "var(--secondary-accent)" : "";
  }
}

function addToInitiative(name) {
  const value = parseInt(prompt(`Enter initiative for ${name}:`));
  if (!isNaN(value)) {
    initiativeOrder.push({ name, initiative: value });
    initiativeOrder.sort((a, b) => b.initiative - a.initiative);
    renderInitiative();
    updateTurnButtons();
  }
}

async function openNpcInitiativeModal(count) {
  return new Promise(resolve => {
    const container = document.createElement("div");

    const typeLabel = document.createElement("p");
    typeLabel.textContent = `Enter initiative rolls for ${count} NPC(s):`;
    container.appendChild(typeLabel);

    const rollsContainer = document.createElement("div");
    rollsContainer.style.cssText = `display:grid;gap:10px;`;
    container.appendChild(rollsContainer);

    const maxPerColumn = 10;
    const rowHeight = 36;
    const numColumns = Math.ceil(count / maxPerColumn);
    rollsContainer.style.gridTemplateColumns = `repeat(${numColumns}, auto)`;

    function buildHeaderRow() {
      const headerRow = document.createElement("div");
      headerRow.style.cssText = `display:grid;grid-template-columns:60px 60px;font-weight:bold;margin-bottom:4px;height:${rowHeight}px;align-items:center;`;
      ["D20", "Mod"].forEach(text => {
        const d = document.createElement("div");
        d.textContent = text;
        d.style.textAlign = "center";
        headerRow.appendChild(d);
      });
      return headerRow;
    }

    for (let col = 0; col < numColumns; col++) {
      const columnDiv = document.createElement("div");
      columnDiv.style.cssText = `display:grid;row-gap:6px;align-content:start;`;
      columnDiv.appendChild(buildHeaderRow());

      for (let i = col * maxPerColumn; i < Math.min((col + 1) * maxPerColumn, count); i++) {
        const inputRow = document.createElement("div");
        inputRow.style.cssText = `display:grid;grid-template-columns:60px 60px;gap:6px;height:${rowHeight}px;align-items:center;`;

        const d20Input = document.createElement("input");
        d20Input.type = "number"; d20Input.min = 1; d20Input.max = 20; d20Input.value = 1;
        d20Input.style.width = "60px";

        const modInput = document.createElement("input");
        modInput.type = "number"; modInput.value = 0;
        modInput.style.width = "60px";
        modInput.classList.add("roll-mod-input");

        inputRow.append(d20Input, modInput);
        columnDiv.appendChild(inputRow);
      }
      rollsContainer.appendChild(columnDiv);
    }

    showModal(`NPC Initiative Rolls`, container, () => {
      const results = [];
      [...rollsContainer.children].forEach(colDiv => {
        [...colDiv.children].slice(1).forEach(row => {
          const inputs = [...row.querySelectorAll("input")];
          const roll = parseInt(inputs[0].value) || 1;
          const modifier = parseInt(inputs[1].value) || 0;
          results.push({ roll, modifier });
        });
      });
      resolve(results);
    });

    document.getElementById("modal-cancel").onclick = () => { hideModal(); resolve(null); };
  });
}

function renderInitiative() {
  const trackerDiv = document.getElementById("combat-tracker");
  if (!trackerDiv) return;
  const listEl = document.getElementById("initiative-list");
  if (!listEl) return;

  let combinedOrder = [];

  gameData.characters.forEach(pc => {
    if (pc === "NPC") return;
    const stats = gameData.characterStats[pc];
    if (stats?.isActiveInCombat && stats.initiativeRolls?.length > 0) {
      stats.initiativeRolls.forEach(rollObj => {
        if (rollObj && Boolean(rollObj.isVisibleInOrder)) {
          if (!rollObj.tag) rollObj.tag = crypto.randomUUID();
          rollObj.source = rollObj.source || pc;
          rollObj.displayName = rollObj.displayName || pc;
          combinedOrder.push({ tag: rollObj.tag, displayName: rollObj.displayName, initiative: rollObj.total, source: rollObj.source });
        }
      });
    }
  });

  const npcPool = gameData.characterStats["NPC"];
  if (npcPool?.isActiveInCombat && npcPool.initiativeRolls?.length > 0) {
    npcPool.initiativeRolls.forEach((rollObj, i) => {
      if (rollObj && Boolean(rollObj.isVisibleInOrder)) {
        if (!rollObj.tag) rollObj.tag = crypto.randomUUID();
        rollObj.source = rollObj.source || "NPC";
        rollObj.displayName = rollObj.displayName || `NPC ${i + 1}`;
        combinedOrder.push({ tag: rollObj.tag, displayName: rollObj.displayName, initiative: rollObj.total, source: rollObj.source, npcIndex: rollObj.npcIndex });
      }
    });
  }

  combinedOrder.sort((a, b) => b.initiative - a.initiative);
  initiativeOrder = combinedOrder;

  if (initiativeOrder.length === 0) {
    listEl.innerHTML = "<p>No initiative yet</p>";
    document.getElementById("next-turn-btn").disabled = true;
    document.getElementById("prev-turn-btn").disabled = true;
    return;
  } else {
    document.getElementById("next-turn-btn").disabled = false;
    document.getElementById("prev-turn-btn").disabled = false;
  }

  listEl.innerHTML = initiativeOrder.map((entry, index) => `
    <li class="${index === currentTurnIndex ? "active-turn" : ""}" data-tag="${entry.tag}">
      <input type="text" class="initiative-name-input" data-tag="${entry.tag}" value="${entry.displayName}" title="Click to edit name" />
      (Init: ${entry.initiative})
      <button class="remove-btn" data-tag="${entry.tag}">Remove</button>
    </li>
  `).join("");

  listEl.querySelectorAll("li").forEach(li => {
    li.addEventListener("click", e => { selectCharacter(li.dataset.tag); });
  });

  const activeName = initiativeOrder[currentTurnIndex]?.source;
  if (activeName) selectCharacter(activeName);

  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.onclick = () => {
      const found = resolveEntryByTag(btn.dataset.tag);
      if (found) found.isVisibleInOrder = false;
      renderInitiative();
      updateSideStats();
    };
  });

  document.querySelectorAll(".initiative-name-input").forEach(input => {
    input.addEventListener("change", e => {
      const newName = e.target.value.trim() || "Unknown";
      const entry = resolveEntryByTag(e.target.dataset.tag);
      if (entry) entry.displayName = newName;
      renderInitiative();
    });
  });
}

async function startCombat() {
  playSoundFromUrl("https://cdn.pixabay.com/audio/2024/08/07/audio_b41cb4e0ac.mp3", 0.2);
  initiativeOrder = [];
  combatStarted = true;
  updateCombatTabVisibility();

  for (const pc of getCompatibleActiveCharacters()) {
    const stats = gameData.characterStats[pc];
    if (!stats) continue;
    stats.isActiveInCombat = true;
    if (!stats.initiativeRolls) stats.initiativeRolls = [];

    const results = await openMultiRollModal(pc, "Initiative", false);
    if (!results?.length) continue;
    results.forEach(({ roll, modifier }, i) => {
      const total = roll + modifier;
      const tag = crypto.randomUUID();
      const npcNum = stats.initiativeRolls.filter(r => r.isVisibleInOrder).length + 1;
      stats.initiativeRolls.push({ roll, modifier, total, isVisibleInOrder: true, tag, displayName: `${pc} ${npcNum}`, source: `${pc}`, npcIndex: npcNum });
      critChecker(pc, roll);
    });
  }

  currentTurnIndex = 0;
  renderInitiative();
  updateSideStats();
  updateTurnButtons();
  showTrackerMessage("Combat started!");
  updateCombatTabVisibility();
  switchTab("combat");
}

function endCombat() {
  if (!confirm("End combat? This will clear all initiative and return to the Stats tab.")) return;

  // Reset all combat state
  initiativeOrder = [];
  combatStarted = false;
  currentTurnIndex = 0;
  npcCount = 0;
  reactionMode = false;
  reactionCharacter = null;

  // Clear isActiveInCombat and initiative roll visibility for all characters
  Object.values(gameData.characterStats).forEach(stats => {
    stats.isActiveInCombat = false;
    if (Array.isArray(stats.initiativeRolls)) {
      stats.initiativeRolls.forEach(entry => { entry.isVisibleInOrder = false; });
    }
  });

  saveGameData("combat ended");
  renderInitiative();
  updateSideStats();
  updateTurnButtons();
  updateCombatTabVisibility();
  switchTab("stats");
  showTrackerMessage("Combat ended.");
}

// -------------------- CHARACTER BUTTONS --------------------
function renderCharacterButtons() {
  const combatDiv = document.getElementById("combat-character-buttons");
  const statsDiv = document.getElementById("stats-character-buttons");
  const editorDiv = document.getElementById("editor-character-buttons");

  // Only show compatible active characters in stat tracker buttons
  const visibleChars = getCompatibleActiveCharacters();

  [combatDiv, statsDiv, editorDiv].forEach(container => {
    if (!container) return;
    container.innerHTML = "";
    visibleChars.forEach(name => {
      const btn = document.createElement("button");
      btn.textContent = name;
      btn.onclick = () => {
        selectedCharacter = name;
        selectCharacter(name);
        updateSideStats();
        renderStatsActions(selectedCharacter, "stats");
      };
      container.appendChild(btn);

      if (container.id === "combat-character-buttons") {
        const initBtn = document.createElement("button");
        initBtn.textContent = "Add to Initiative";
        initBtn.onclick = () => addToInitiative(name);
        container.appendChild(initBtn);
      }
    });

    // ── Add reset button inline in the editor bar only ──
    if (container.id === "editor-character-buttons") {
      const resetBtn = document.createElement("button");
      resetBtn.textContent = "🔄 Reset Session Stats";
      resetBtn.style.cssText = `
        margin-left:auto;
        background-color:var(--secondary-accent);
        color:#fff;
        border:none;
      `;
      resetBtn.onmouseenter = () => resetBtn.style.filter = "brightness(1.2)";
      resetBtn.onmouseleave = () => resetBtn.style.filter = "";
      resetBtn.onclick = resetAllSessionStats;
      container.appendChild(resetBtn);
    }
  });

  highlightSelectedButton(selectedCharacter);
}

function exitReactionMode() {
  if (!reactionMode) return;
  reactionMode = false;
  showTrackerMessage(`Reaction complete. Returning to ${getCurrentTurnCharacter()}'s turn.`);
  reactionCharacter = null;
  renderStatsActions(getCurrentTurnCharacter());
}

// -------------------- MODAL HELPERS --------------------
function showModal(title, bodyContent, onConfirm = null) {
  const modal = document.getElementById("action-modal");
  const center = document.getElementById("tracker-center");
  const placeholder = document.getElementById("center-placeholder");
  const trackerLayout = document.querySelector(".tracker-layout");

  document.getElementById("modal-title").textContent = title;
  const modalBody = document.getElementById("modal-body");
  modalBody.innerHTML = "";
  if (bodyContent instanceof HTMLElement) modalBody.appendChild(bodyContent);
  else modalBody.textContent = bodyContent;

  document.getElementById("modal-confirm").onclick = () => {
    if (onConfirm) onConfirm();
    hideModal();
  };
  document.getElementById("modal-cancel").onclick = hideModal;

  modal.classList.remove("hidden");
  if (center) {
    center.classList.add("modal-active");
    center.style.display = "block";
  }
  if (trackerLayout) trackerLayout.style.gridTemplateColumns = "400px 1.5fr 413px";
  if (placeholder) placeholder.style.display = "none";
}

function hideModal() {
  const modal = document.getElementById("action-modal");
  const center = document.getElementById("tracker-center");
  const placeholder = document.getElementById("center-placeholder");
  const trackerLayout = document.querySelector(".tracker-layout");

  modal.classList.add("hidden");
  if (center) {
    center.classList.remove("modal-active");
    center.style.display = "none";
  }
  if (trackerLayout) trackerLayout.style.gridTemplateColumns = "3.5fr 1fr";
  if (placeholder) placeholder.style.display = "block";
}

function getCurrentTurnCharacter() {
  if (reactionMode && reactionCharacter) return reactionCharacter;
  if (initiativeOrder.length === 0) return null;
  const entry = initiativeOrder[currentTurnIndex];
  if (!entry) return null;
  return entry.source || resolveToStatName(entry.tag) || entry.displayName || null;
}

function getStatName(name) {
  if (name && name.startsWith("NPC ")) return "NPC";
  return name;
}

let SPELL_DATABASE = null;

async function loadSpellDatabase() {

  if (SPELL_DATABASE) {
    return SPELL_DATABASE;
  }

  const response =
    await fetch("./data/5.5eSpells.json");

  if (!response.ok) {
    throw new Error(
      "Failed to load 5.5eSpells.json"
    );
  }

  SPELL_DATABASE = await response.json();

  return SPELL_DATABASE;
}

async function performSingleAttack(name, options = { logGlobal: false }) {
  const stats = gameData.characterStats[name];
  if (!stats) return null;
  const result = await openUnifiedActionModal(name, "attack", true);
  if (!result) return null;
  const { roll, modifier, damage } = result;
  const moddedRoll = roll + modifier;
  critChecker(name, roll);
  if (options.logGlobal) {
    const attackEntry = { roll, modifier, damage, moddedRoll };
    stats.totalD20Rolls.push(roll);
    stats.totalModD20Rolls.push({ roll, modifier });
    stats.attackRolls.push(attackEntry);
    stats.attacksMade++;
    recalcCharacterStats(name);
    updateStatsAndRender(name);
  }
  showTrackerMessage(buildDisplayString(name, "attack", { roll, modifier, moddedRoll, damage }));
  return { roll, modifier, moddedRoll, damage };
}

function critChecker(characterName, roll) {
  const stats = gameData.characterStats[characterName];
  if (!stats) return;
  if (roll === 1) stats.natural1s++;
  else if (roll === 20) stats.natural20s++;
}

function buildDisplayString(characterName, type, result) {
  if (!result) return "";
  let msg = `${characterName} `;
  switch (type) {
    case "attack": msg += result.hit ? `HIT! Damage: ${result.damage}` : `ATTACK MISSED (roll: ${result.moddedRoll})`; break;
    case "ability": msg += `ability check → Roll: ${result.roll} (mod: ${result.modifier})`; break;
    case "save": msg += `saving throw → Roll: ${result.roll} (mod: ${result.modifier})`; break;
    case "initiative": msg += `initiative → Total: ${result.moddedRoll}`; break;
    default: msg += `${type} → Roll: ${result.roll} (mod: ${result.modifier})`;
  }
  return msg;
}

// -------------------- ACTION HANDLERS --------------------
async function handleAttack(characterName) {
  const stats = gameData.characterStats[characterName];
  if (!stats) return;
  const rolls = await openMultiRollModal(characterName, "Attack", true);
  if (!rolls) return;
  for (const { roll, modifier, damage } of rolls) {
    const moddedRoll = roll + modifier;
    critChecker(characterName, roll);
    stats.totalD20Rolls.push(roll);
    stats.totalModD20Rolls.push({ roll, modifier });
    stats.attackRolls.push({ roll, modifier, damage, moddedRoll });
    stats.attacksMade++;
    showTrackerMessage(buildDisplayString(characterName, "attack", { roll, modifier, moddedRoll, damage }));
  }
  recalcCharacterStats(characterName);
  updateStatsAndRender(characterName);
}

async function handleAbility(characterName) {
  const stats = gameData.characterStats[characterName];
  if (!stats) return;
  const rolls = await openMultiRollModal(characterName, "Ability", false);
  if (!rolls) return;
  for (const { roll, modifier } of rolls) {
    const moddedRoll = roll + modifier;
    stats.totalD20Rolls.push(roll);
    stats.totalModD20Rolls.push({ roll, modifier });
    stats.abilityChecks++;
    stats.abilityRolls.push({ roll, modifier, moddedRoll });
    showTrackerMessage(buildDisplayString(characterName, "ability", { roll, modifier, moddedRoll }));
  }
  recalcCharacterStats(characterName);
  updateStatsAndRender(characterName);
}

async function handleSave(characterName) {
  const stats = gameData.characterStats[characterName];
  if (!stats) return;
  const rolls = await openMultiRollModal(characterName, "Save", false);
  if (!rolls) return;
  for (const { roll, modifier } of rolls) {
    const moddedRoll = roll + modifier;
    stats.totalD20Rolls.push(roll);
    stats.totalModD20Rolls.push({ roll, modifier });
    stats.savingThrows++;
    stats.saveRolls.push({ roll, modifier, moddedRoll });
    showTrackerMessage(buildDisplayString(characterName, "save", { roll, modifier, moddedRoll }));
  }
  recalcCharacterStats(characterName);
  updateStatsAndRender(characterName);
}

async function handleConcentration(characterName) {
  const stats = gameData.characterStats[characterName];
  if (!stats) return;
  const rolls = await openMultiRollModal(characterName, "Concentration", false);
  if (!rolls) return;
  for (const { roll, modifier } of rolls) {
    const moddedRoll = roll + modifier;
    stats.totalD20Rolls.push(roll);
    stats.totalModD20Rolls.push({ roll, modifier });
    stats.concentrationChecks++;
    stats.concentrationRolls.push({ roll, modifier, moddedRoll });
    showTrackerMessage(buildDisplayString(characterName, "concentration", { roll, modifier, moddedRoll }));
  }
  recalcCharacterStats(characterName);
  updateStatsAndRender(characterName);
}

async function handleInitiative(characterName) {
  const stats = gameData.characterStats[characterName];
  if (!stats) return;
  const rolls = await openMultiRollModal(characterName, "Initiative", false);
  if (!rolls) return;
  for (const { roll, modifier } of rolls) {
    const moddedRoll = roll + modifier;
    stats.totalD20Rolls.push(roll);
    stats.totalModD20Rolls.push({ roll, modifier });
    stats.initiativeRolls.push({ roll, modifier, total: moddedRoll });
    stats.initiative = moddedRoll;
    showTrackerMessage(buildDisplayString(characterName, "initiative", { roll, modifier, moddedRoll }));
  }
  recalcCharacterStats(characterName);
  updateStatsAndRender(characterName);
}

async function handleSpellsCast(name) {
  name = getStatName(name);
  const stats = gameData.characterStats[name];
  if (!stats) return;
  const spell = await openCastSpellModal(name, SPELL_DATABASE);
  if (!spell) return;
  playSoundFromUrl("https://cdn.pixabay.com/audio/2021/08/02/audio_4527d82a75.mp3", 0.3);
  stats.spellHistory.push(spell);
  stats.spellsCast = stats.spellHistory.length;
  recalcCharacterStats(name);
  renderSpellEditor(name);
  updateSideStats();
  updateStatsAndRender(name);
}

function handleMoneySpent(name) {
  playSoundFromUrl("https://cdn.pixabay.com/audio/2022/12/17/audio_43e9af63f3.mp3", 0.2);
  name = getStatName(name);
  if (!gameData.characterStats[name]) return;
  inputAction(name, "money", "money spent");
}

function handleDamageTaken(name) {
  playSoundFromUrl("https://cdn.pixabay.com/audio/2025/08/03/audio_639437072a.mp3", 0.3);
  name = getStatName(name);
  if (!gameData.characterStats[name]) return;
  inputAction(name, "damage", "damage");
}

function handleHealingDone(name) {
  playSoundFromUrl("https://cdn.pixabay.com/download/audio/2021/08/09/audio_07e661df12.mp3?filename=health-pickup-6860.mp3", 0.4);
  name = getStatName(name);
  if (!gameData.characterStats[name]) return;
  inputAction(name, "healing", "healing");
}

function handleTimesKilled(name) {
  playSoundFromUrl("https://us-tuna-sounds-files.voicemod.net/d23c1e88-eb51-448e-8ad1-9abde6e2cad7-1659635683462.mp3", 0.5);
  name = getStatName(name);
  const stats = gameData.characterStats[name];
  if (!stats) { console.warn(`Stats not found for character: ${name}`); return; }
  stats.timesKilled = (stats.timesKilled || 0) + 1;
  showTrackerMessage(`${name} added to Times Killed! Total: ${stats.timesKilled}`);
  renderEditorStats(name);
  updateSideStats();
}

async function handleReactionMode() {
  reactionMode = true;

  const container = document.createElement("div");
  container.style.cssText = `display:flex;flex-direction:column;gap:8px;`;

  const title = document.createElement("div");
  title.textContent = "Select a character to react";
  title.style.fontWeight = "bold";
  container.appendChild(title);

  const select = document.createElement("select");
  getCompatibleActiveCharacters().forEach(name => {
    const opt = document.createElement("option"); opt.value = name; opt.textContent = name; select.appendChild(opt);
  });
  container.appendChild(select);

  const actionsDiv = document.createElement("div");
  actionsDiv.id = "reaction-actions";
  container.appendChild(actionsDiv);

  const renderActionsFor = (name) => {
    actionsDiv.innerHTML = "";
    const heading = document.createElement("div");
    heading.textContent = `Actions for ${name}:`;
    heading.style.marginBottom = "6px";
    actionsDiv.appendChild(heading);

    const actions = [
      { label: "Attack", handler: handleAttack },
      { label: "Ability", handler: handleAbility },
      { label: "Save", handler: handleSave },
      { label: "Spell", handler: handleSpellsCast },
      { label: "Killed", handler: handleTimesKilled },
      { label: "Spend", handler: handleMoneySpent },
      { label: "Damage", handler: handleDamageTaken },
      { label: "Heal", handler: handleHealingDone }
    ];

    if (getCurrentEdition() === "pathfinder") {
      actions.splice(3, 0, { label: "Concentration", handler: handleConcentration });
    }

    actions.forEach(({ label, handler }) => {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.onclick = () => handler(name);
      btn.onmouseenter = () => { btn.style.backgroundColor = "red"; btn.style.transform = "scale(1.05)"; };
      btn.onmouseleave = () => { btn.style.backgroundColor = ""; btn.style.transform = ""; };
      actionsDiv.appendChild(btn);
    });
  };

  renderActionsFor(select.value);
  select.onchange = () => renderActionsFor(select.value);

  showModal("Reaction Mode", container, () => {
    reactionCharacter = select.value;
    showTrackerMessage(`${reactionCharacter} is reacting!`);
    renderActionsFor(reactionCharacter);
  });

  const cancelBtn = document.getElementById("modal-cancel");
  if (cancelBtn) {
    cancelBtn.onclick = () => { hideModal(); reactionMode = false; };
  }
}

// -------------------- STATS UI --------------------
const handlerMap = {
  Attack: handleAttack,
  Ability: handleAbility,
  Save: handleSave,
  Concentration: handleConcentration,
  Initiative: handleInitiative,
  Spell: handleSpellsCast,
  "Times Killed": handleTimesKilled,
  "Money Spent": handleMoneySpent,
  Damage: handleDamageTaken,
  Heal: handleHealingDone
};

function renderStatsActions(characterName, context = "combat") {
  if (!gameData) return;
  let containerId;
  if (context === "combat") containerId = "combat-actions";
  else if (context === "stats") containerId = "stats-actions";
  else { console.warn("Unknown context for renderStatsActions:", context); return; }

  const statsButtons = document.getElementById(containerId);
  if (!statsButtons) { console.warn("No container found for", containerId); return; }
  statsButtons.innerHTML = "";

  function createBtn(label, handler) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.onclick = () => {
      const activeChar = getCurrentTurnCharacter() || characterName;
      handler(activeChar);
    };
    btn.style.margin = "5px";
    return btn;
  }

  let labels = getCurrentEdition() === "pathfinder"
    ? ["Attack", "Ability", "Save", "Concentration", "Initiative", "Spell", "Times Killed", "Money Spent", "Damage", "Heal"]
    : ["Attack", "Ability", "Save", "Initiative", "Spell", "Times Killed", "Money Spent", "Damage", "Heal"];

  if (context === "combat") {
    labels = labels.filter(label => label !== "Initiative" && label !== "Money Spent");
  }

  labels.forEach(label => { statsButtons.appendChild(createBtn(label, handlerMap[label])); });
}

function renderSpellEditor(characterName) {
  const stats = gameData.characterStats[characterName];
  if (!stats) return;
  if (!Array.isArray(stats.spellHistory)) stats.spellHistory = [];

  const editorContainer = document.getElementById("editor-container");
  if (!editorContainer) return;

  let oldSection = editorContainer.querySelector(".spell-section");
  if (oldSection) oldSection.remove();

  const spellSection = document.createElement("div");
  spellSection.classList.add("spell-section");

  const header = document.createElement("h3");
  header.textContent = "Spell History";
  spellSection.appendChild(header);

  stats.spellHistory.forEach((spell, i) => {
    const spellDiv = document.createElement("div");
    spellDiv.classList.add("spell-entry");

    const spellHeader = document.createElement("div");
    spellHeader.classList.add("spell-header");
    spellHeader.style.cssText = `display:inline-flex;align-items:center;gap:10px;`;

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = spell.name || "New Spell";
    nameInput.addEventListener("input", () => { spell.name = nameInput.value; });
    spellHeader.appendChild(nameInput);

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove Spell";
    removeBtn.addEventListener("click", () => {
      const removedSpell = stats.spellHistory.splice(i, 1)[0];
      if (removedSpell && removedSpell.saves) {
        removedSpell.saves.forEach(sv => {
          const target = sv.target;
          if (target && target !== characterName) {
            const tStats = gameData.characterStats[target];
            if (tStats?.savesFromSpells) {
              tStats.savesFromSpells = tStats.savesFromSpells.filter(s => s !== sv);
              recalcCharacterStats(target);
            }
          }
        });
      }
      stats.spellsCast = stats.spellHistory.length;
      recalcCharacterStats(characterName);
      renderSpellEditor(characterName);
      updateSideStats();
    });
    spellHeader.appendChild(removeBtn);
    spellDiv.appendChild(spellHeader);

    const dmgHealDiv = document.createElement("div");
    dmgHealDiv.style.cssText = `display:flex;align-items:center;font-weight:bold;gap:10px;`;
    spell.extra = spell.extra || { damage: 0, healing: 0 };

    const damageLabel = document.createElement("label"); damageLabel.textContent = "Damage:";
    dmgHealDiv.appendChild(damageLabel);
    const damageInput = document.createElement("input");
    damageInput.type = "number"; damageInput.value = spell.extra.damage ?? "";
    damageInput.addEventListener("input", () => { spell.extra.damage = parseFloat(damageInput.value) || 0; recalcCharacterStats(characterName); updateSideStats(); });
    dmgHealDiv.appendChild(damageInput);

    const healLabel = document.createElement("label"); healLabel.textContent = "Healing:";
    dmgHealDiv.appendChild(healLabel);
    const healInput = document.createElement("input");
    healInput.type = "number"; healInput.value = spell.extra.healing ?? "";
    healInput.addEventListener("input", () => { spell.extra.healing = parseFloat(healInput.value) || 0; recalcCharacterStats(characterName); updateSideStats(); });
    dmgHealDiv.appendChild(healInput);
    spellDiv.appendChild(dmgHealDiv);

    if (getCurrentEdition() === "pathfinder") {
      const srHeader = document.createElement("h4"); srHeader.textContent = "Spell Resistance Checks";
      spellDiv.appendChild(srHeader);
      spell.spellResistance = spell.spellResistance || [];
      spell.spellResistance.forEach((sr, srIndex) => {
        const srDiv = document.createElement("div");
        srDiv.style.cssText = `display:inline-flex;align-items:center;gap:10px;`;
        const rollLabel = document.createElement("label"); rollLabel.textContent = "D20:"; srDiv.appendChild(rollLabel);
        const rollInput = document.createElement("input"); rollInput.type = "number"; rollInput.min = 1; rollInput.max = 20; rollInput.value = sr.roll ?? 0;
        rollInput.addEventListener("input", () => { sr.roll = parseInt(rollInput.value) || 0; recalcCharacterStats(characterName); updateSideStats(); });
        srDiv.appendChild(rollInput);
        const clLabel = document.createElement("label"); clLabel.textContent = "Mod:"; srDiv.appendChild(clLabel);
        const clInput = document.createElement("input"); clInput.type = "number"; clInput.value = sr.modifier ?? sr.casterLevel ?? 0;
        clInput.addEventListener("input", () => { const v = parseInt(clInput.value) || 0; sr.modifier = v; sr.casterLevel = v; recalcCharacterStats(characterName); updateSideStats(); });
        srDiv.appendChild(clInput);
        const removeSRBtn = document.createElement("button"); removeSRBtn.textContent = "Remove";
        removeSRBtn.addEventListener("click", () => { spell.spellResistance.splice(srIndex, 1); recalcCharacterStats(characterName); renderSpellEditor(characterName); updateSideStats(); });
        srDiv.appendChild(removeSRBtn);
        spellDiv.appendChild(srDiv);
      });
      const addSRBtn = document.createElement("button"); addSRBtn.textContent = "Add Spell Resistance";
      addSRBtn.addEventListener("click", () => { spell.spellResistance.push({ roll: 0, modifier: 0, casterLevel: 0 }); renderSpellEditor(characterName); });
      spellDiv.appendChild(addSRBtn);
    }

    const attackHeader = document.createElement("h4"); attackHeader.textContent = "Attacks";
    spellDiv.appendChild(attackHeader);
    spell.attacks = spell.attacks || [];
    spell.attacks.forEach((atk, atkIndex) => {
      const atkDiv = document.createElement("div");
      atkDiv.style.cssText = `display:inline-flex;align-items:center;gap:10px;`;
      const rollLabel = document.createElement("label"); rollLabel.textContent = "D20:"; atkDiv.appendChild(rollLabel);
      const rollInput = document.createElement("input"); rollInput.type = "number"; rollInput.min = 1; rollInput.max = 20; rollInput.value = atk.roll ?? 0;
      rollInput.addEventListener("input", () => { atk.roll = parseInt(rollInput.value) || 0; recalcCharacterStats(characterName); updateSideStats(); });
      atkDiv.appendChild(rollInput);
      const modLabel = document.createElement("label"); modLabel.textContent = "Mod:"; atkDiv.appendChild(modLabel);
      const modInput = document.createElement("input"); modInput.type = "number"; modInput.value = atk.modifier ?? 0;
      modInput.addEventListener("input", () => { atk.modifier = parseInt(modInput.value) || 0; recalcCharacterStats(characterName); updateSideStats(); });
      atkDiv.appendChild(modInput);
      const dmgLabel = document.createElement("label"); dmgLabel.textContent = "Damage:"; atkDiv.appendChild(dmgLabel);
      const dmgInput = document.createElement("input"); dmgInput.type = "number"; dmgInput.value = atk.damage ?? 0;
      dmgInput.addEventListener("input", () => { atk.damage = parseFloat(dmgInput.value) || 0; recalcCharacterStats(characterName); updateSideStats(); });
      atkDiv.appendChild(dmgInput);
      const removeAtkBtn = document.createElement("button"); removeAtkBtn.textContent = "Remove";
      removeAtkBtn.addEventListener("click", () => { spell.attacks.splice(atkIndex, 1); recalcCharacterStats(characterName); renderSpellEditor(characterName); updateSideStats(); });
      atkDiv.appendChild(removeAtkBtn);
      spellDiv.appendChild(atkDiv);
    });
    const addAttackBtn = document.createElement("button"); addAttackBtn.textContent = "Add Attack";
    addAttackBtn.addEventListener("click", () => { spell.attacks.push({ roll: 0, hit: 0, damage: 0 }); renderSpellEditor(characterName); });
    spellDiv.appendChild(addAttackBtn);

    const saveHeader = document.createElement("h4"); saveHeader.textContent = "Saving Throws";
    spellDiv.appendChild(saveHeader);
    spell.saves = spell.saves || [];
    spell.saves.forEach((sv, svIndex) => {
      const saveDiv = document.createElement("div");
      saveDiv.style.cssText = `display:inline-flex;align-items:center;gap:10px;`;
      const targetLabel = document.createElement("label"); targetLabel.textContent = "Target:"; saveDiv.appendChild(targetLabel);
      const targetSelect = document.createElement("select");
      Object.keys(gameData.characterStats).forEach(char => {
        const opt = document.createElement("option"); opt.value = char; opt.textContent = char;
        if (sv.target === char) opt.selected = true;
        targetSelect.appendChild(opt);
      });
      targetSelect.addEventListener("change", () => { linkSaveToTarget(sv, characterName, spell.name, targetSelect.value); });
      saveDiv.appendChild(targetSelect);
      const rollLabel = document.createElement("label"); rollLabel.textContent = "D20:"; saveDiv.appendChild(rollLabel);
      const rollInput = document.createElement("input"); rollInput.type = "number"; rollInput.min = 1; rollInput.max = 20; rollInput.value = sv.roll ?? 0;
      rollInput.addEventListener("input", () => {
        sv.roll = parseInt(rollInput.value) || 0;
        if (sv.target && gameData.characterStats[sv.target]) recalcCharacterStats(sv.target);
        recalcCharacterStats(characterName); updateSideStats();
      });
      saveDiv.appendChild(rollInput);
      const modLabel = document.createElement("label"); modLabel.textContent = "Mod:"; saveDiv.appendChild(modLabel);
      const modInput = document.createElement("input"); modInput.type = "number"; modInput.value = sv.modifier ?? 0;
      modInput.addEventListener("input", () => {
        sv.modifier = parseInt(modInput.value) || 0;
        if (sv.target && gameData.characterStats[sv.target]) recalcCharacterStats(sv.target);
        recalcCharacterStats(characterName); updateSideStats();
      });
      saveDiv.appendChild(modInput);
      const removeSaveBtn = document.createElement("button"); removeSaveBtn.textContent = "Remove";
      removeSaveBtn.addEventListener("click", () => { removeSaveFromSpell(characterName, spell, svIndex); });
      saveDiv.appendChild(removeSaveBtn);
      spellDiv.appendChild(saveDiv);
    });
    const addSaveBtn = document.createElement("button"); addSaveBtn.textContent = "Add Save";
    addSaveBtn.addEventListener("click", () => { spell.saves.push({ roll: 0, modifier: 0 }); renderSpellEditor(characterName); });
    spellDiv.appendChild(addSaveBtn);

    spellSection.appendChild(spellDiv);
  });

  const addSpellBtn = document.createElement("button");
  addSpellBtn.textContent = "Add Spell";
  addSpellBtn.addEventListener("click", () => {
    stats.spellHistory.push({ name: "", damage: 0, healing: 0, attacks: [], saves: [] });
    stats.spellsCast = stats.spellHistory.length;
    recalcCharacterStats(characterName);
    renderSpellEditor(characterName);
    updateSideStats();
  });
  spellSection.appendChild(addSpellBtn);
  editorContainer.appendChild(spellSection);
}

function linkSaveToTarget(sv, casterName, spellName, newTarget) {
  if (sv.target && sv.target !== newTarget) {
    const oldStats = gameData.characterStats[sv.target];
    if (oldStats?.savesFromSpells) { oldStats.savesFromSpells = oldStats.savesFromSpells.filter(s => s !== sv); }
  }
  sv.target = newTarget;
  const targetStats = gameData.characterStats[newTarget];
  if (!targetStats) return;
  if (!Array.isArray(targetStats.savesFromSpells)) targetStats.savesFromSpells = [];
  if (newTarget !== casterName && !targetStats.savesFromSpells.includes(sv)) targetStats.savesFromSpells.push(sv);
  sv.caster = casterName;
  sv.spellName = spellName;
  recalcCharacterStats(newTarget);
  updateSideStats();
}

function updateSideStats() {
  const panel = document.getElementById("stats-display-content");
  if (!panel) return;

  let nameToUse = selectedCharacter;

  const header2 = document.getElementById("side-stats-header");

  if (header2) {
    header2.textContent = `${nameToUse}'s Character Stats`;
  }

  if (selectedTag) {
    for (const [charName, stats] of Object.entries(gameData.characterStats)) {
      const match = stats.initiativeRolls?.some(r => r.tag === selectedTag);
      if (match) { nameToUse = charName; break; }
    }
  }
  if (nameToUse && nameToUse.startsWith("NPC ") && !gameData.characterStats[nameToUse]) nameToUse = "NPC";
  if (!nameToUse || !gameData.characterStats[nameToUse]) { panel.innerHTML = "<p>No character selected</p>"; return; }

  const s = gameData.characterStats[nameToUse];
  let spellHealing = 0;
  if (Array.isArray(s.spellHistory)) {
    s.spellHistory.forEach(spell => { if (spell.extra) spellHealing += parseFloat(spell.extra.healing) || 0; });
  }
  const combinedDamage = (s.totalDamage || 0) + s.attackDamage;
  const combinedHealing = (s.healingDone || 0) + spellHealing;


  if (getCurrentEdition() === "pathfinder") {
    panel.innerHTML = `
      <p>Attacks Made: ${s.attacksMade}</p>
      <p>Ability Checks: ${s.abilityChecks}</p>
      <p>Saving Throws: ${s.savingThrows}</p>
      <p>Concentration Checks: ${s.concentrationChecks}</p>
      <p>Spell Resistances: ${s.totalSpellResistance}</p>
      <p>Spells Cast: ${s.spellsCast}</p>
      <p>Initiative: ${s.initiativeRolls.length > 0 ? formatD20RollsDisplay(s.initiativeRolls) : "No rolls yet."}</p>
      <p>Total D20 Rolls: ${formatRolls(s.totalD20Rolls)}</p>
      <p>Total Modded D20 Rolls: ${s.totalModD20Rolls.length > 0 ? formatD20RollsDisplay(s.totalModD20Rolls) : "No rolls yet."}</p>
      <p>Times Killed: ${s.timesKilled}</p>
      <p>Natural 1s: ${s.natural1s}</p>
      <p>Natural 20s: ${s.natural20s}</p>
      <p>Total Damage: ${combinedDamage}</p>
      <p>Total Healing: ${combinedHealing}</p>
      <p>Money Spent: ${s.moneySpent.toFixed(2)}</p>
    `;
  } else {
    panel.innerHTML = `
      <p>Attacks Made: ${s.attacksMade}</p>
      <p>Ability Checks: ${s.abilityChecks}</p>
      <p>Saving Throws: ${s.savingThrows}</p>
      <p>Spells Cast: ${s.spellsCast}</p>
      <p>Initiative: ${s.initiativeRolls.length > 0 ? formatD20RollsDisplay(s.initiativeRolls) : "No rolls yet."}</p>
      <p>Total D20 Rolls: ${formatRolls(s.totalD20Rolls)}</p>
      <p>Total Modded D20 Rolls: ${s.totalModD20Rolls.length > 0 ? formatD20RollsDisplay(s.totalModD20Rolls) : "No rolls yet."}</p>
      <p>Times Killed: ${s.timesKilled}</p>
      <p>Natural 1s: ${s.natural1s}</p>
      <p>Natural 20s: ${s.natural20s}</p>
      <p>Total Damage: ${combinedDamage}</p>
      <p>Total Healing: ${combinedHealing}</p>
      <p>Money Spent: ${s.moneySpent.toFixed(2)}</p>
    `;
  }

  saveGameData();
}

function recalcCharacterStats(characterName) {
  const stats = gameData.characterStats[characterName];
  if (!stats) return;

  stats.natural1s = 0;
  stats.natural20s = 0;
  stats.attacksMade = stats.attackRolls.length;
  stats.abilityChecks = stats.abilityRolls.length;
  stats.savingThrows = stats.saveRolls.length;
  stats.concentrationChecks = stats.concentrationRolls.length;
  stats.totalSpellResistances = stats.spellResistanceRolls.length;
  stats.spellsCast = Array.isArray(stats.spellHistory) ? stats.spellHistory.length : 0;

  stats.totalD20Rolls = [];
  stats.totalModD20Rolls = [];
  stats.totalNonSpellDamage = 0;
  stats.totalSpellDamage = 0;
  stats.totalNonSpellHealing = 0;
  stats.totalSpellHealing = 0;

  const processRolls = (arr, includeMod = false, isDamage = false) => {
    arr.forEach(r => {
      if (!r) return;
      const roll = parseInt(r.roll) || 0;
      const mod = parseInt(r.modifier) || 0;
      const dmg = parseFloat(r.damage) || 0;
      if (roll === 1) stats.natural1s++;
      if (roll === 20) stats.natural20s++;
      stats.totalD20Rolls.push(roll);
      if (includeMod) stats.totalModD20Rolls.push({ roll, modifier: mod });
      if (isDamage) stats.totalNonSpellDamage += dmg;
    });
  };

  processRolls(stats.attackRolls, true, true);
  processRolls(stats.abilityRolls, true);
  processRolls(stats.saveRolls, true);
  processRolls(stats.concentrationRolls, true);
  processRolls(stats.spellResistanceRolls, true);

  if (Array.isArray(stats.healingRolls)) {
    stats.healingRolls.forEach(h => { stats.totalNonSpellHealing += parseFloat(h.healing) || 0; });
  }

  if (Array.isArray(stats.initiativeRolls)) {
    stats.initiativeRolls.forEach(r => {
      if (!r) return;
      if (r.roll === 1) stats.natural1s++;
      if (r.roll === 20) stats.natural20s++;
    });
  }

  if (Array.isArray(stats.spellHistory)) {
    let totalSR = 0;
    stats.spellHistory.forEach(spell => {
      if (Array.isArray(spell.spellResistance)) {
        spell.spellResistance.forEach(a => {
          const roll = parseInt(a.roll) || 0; const mod = parseInt(a.modifier ?? a.casterLevel) || 0;
          if (roll === 1) stats.natural1s++; if (roll === 20) stats.natural20s++;
          stats.totalD20Rolls.push(roll); stats.totalModD20Rolls.push({ roll, modifier: mod });
        });
        totalSR += spell.spellResistance.length;
      }
      if (Array.isArray(spell.attacks)) {
        spell.attacks.forEach(a => {
          const roll = parseInt(a.roll) || 0; const mod = parseInt(a.modifier) || 0; const dmg = parseFloat(a.damage) || 0;
          if (roll === 1) stats.natural1s++; if (roll === 20) stats.natural20s++;
          stats.totalD20Rolls.push(roll); stats.totalModD20Rolls.push({ roll, modifier: mod });
          stats.totalSpellDamage += dmg;
        });
        stats.attacksMade += spell.attacks.length;
      }
      if (Array.isArray(spell.saves)) {
        spell.saves.forEach(sv => {
          if (sv.target !== characterName) return;
          const roll = parseInt(sv.roll) || 0; const mod = parseInt(sv.modifier) || 0;
          if (roll === 1) stats.natural1s++; if (roll === 20) stats.natural20s++;
          stats.totalD20Rolls.push(roll); stats.totalModD20Rolls.push({ roll, modifier: mod });
          stats.savingThrows++;
        });
      }
      if (spell.extra) {
        stats.totalSpellDamage += parseFloat(spell.extra.damage) || 0;
        stats.totalSpellHealing += parseFloat(spell.extra.healing) || 0;
      }
    });
    stats.totalSpellResistance = totalSR;
  }

  if (!Array.isArray(stats.savesFromSpells)) stats.savesFromSpells = [];
  stats.savesFromSpells.forEach(sv => {
    const roll = parseInt(sv.roll) || 0; const mod = parseInt(sv.modifier) || 0;
    if (roll === 1) stats.natural1s++; if (roll === 20) stats.natural20s++;
    stats.totalD20Rolls.push(roll); stats.totalModD20Rolls.push({ roll, modifier: mod });
    stats.savingThrows++;
  });

  stats.totalDamage = stats.totalNonSpellDamage + stats.totalSpellDamage;
  stats.totalHealing = stats.totalNonSpellHealing + stats.totalSpellHealing;
}

function formatRolls(rolls) {
  if (!Array.isArray(rolls) || rolls.length === 0) return "—";
  if (typeof rolls[0] === "number") {
    const total = rolls.reduce((sum, r) => sum + r, 0);
    return `${total} = ${rolls.join(" + ")}`;
  }
  return "Invalid rolls";
}

function formatD20RollsDisplay(rolls) {
  if (!rolls || rolls.length === 0) return "No rolls yet.";
  const parts = rolls.map(r => `(${r.roll} + ${r.modifier})`);
  const sum = rolls.reduce((acc, r) => acc + (r.roll + r.modifier), 0);
  return `${sum} = ${parts.join(" + ")}`;
}

function renderEditorStats(characterName) {
  const stats = gameData.characterStats[characterName];
  if (!stats) return;

  const editorContainer = document.getElementById("editor-container");
  if (!editorContainer) return;
  editorContainer.innerHTML = "";

  const sections = [
    { label: "Attack Rolls", key: "attack" },
    { label: "Ability Checks", key: "ability" },
    { label: "Saving Throws", key: "save" },
    { label: "Initiative Rolls", key: "initiative" }
  ];

  if (getCurrentEdition() === "pathfinder") {
    sections.splice(3, 0, { label: "Concentration Checks", key: "concentration" });
  }

  sections.forEach(section => {
    const sectionDiv = document.createElement("div");
    sectionDiv.classList.add("roll-section");

    const header = document.createElement("h3");
    header.textContent = section.label;
    sectionDiv.appendChild(header);

    const rolls = stats[`${section.key}Rolls`];
    rolls.forEach((rollObj, i) => {
      const rollDiv = document.createElement("div");
      rollDiv.classList.add("roll-entry");

      const rollLabel = document.createElement("label"); rollLabel.textContent = "D20:"; rollDiv.appendChild(rollLabel);
      const rollInput = document.createElement("input");
      rollInput.type = "number"; rollInput.value = rollObj.roll; rollInput.min = 1; rollInput.max = 20;
      rollInput.addEventListener("change", () => {
        rollObj.roll = parseInt(rollInput.value) || 0;
        if (section.key === "initiative") {
          rollObj.modifier = rollObj.modifier || 0;
          rollObj.total = rollObj.roll + rollObj.modifier;
          if (characterName.startsWith("NPC ")) renderInitiative();
          else { stats.initiative = rollObj.total; renderInitiative(); }
        }
        recalcCharacterStats(characterName);
        updateSideStats();
      });
      rollDiv.appendChild(rollInput);

      const modLabel = document.createElement("label"); modLabel.textContent = "Mod:"; rollDiv.appendChild(modLabel);
      const modInput = document.createElement("input");
      modInput.type = "number"; modInput.value = rollObj.modifier || 0;
      modInput.addEventListener("change", () => {
        rollObj.modifier = parseInt(modInput.value) || 0;
        if (section.key === "initiative") {
          rollObj.total = (rollObj.roll || 0) + rollObj.modifier;
          if (characterName.startsWith("NPC ")) renderInitiative();
          else { stats.initiative = rollObj.total; renderInitiative(); }
        }
        recalcCharacterStats(characterName);
        updateSideStats();
      });
      rollDiv.appendChild(modInput);

      if (section.key === "attack") {
        const dmgLabel = document.createElement("label"); dmgLabel.textContent = "Damage:"; rollDiv.appendChild(dmgLabel);
        const damageInput = document.createElement("input");
        damageInput.type = "number"; damageInput.value = rollObj.damage || 0;
        damageInput.addEventListener("change", () => { rollObj.damage = parseFloat(damageInput.value) || 0; recalcCharacterStats(characterName); updateSideStats(); });
        rollDiv.appendChild(damageInput);
      }

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => {
        stats[`${section.key}Rolls`].splice(i, 1);
        recalcCharacterStats(characterName);
        renderEditorStats(characterName);
        updateSideStats();
      });
      rollDiv.appendChild(removeBtn);

      if (section.key === "initiative") {
        const addToOrderBtn = document.createElement("button");
        addToOrderBtn.textContent = "Add to Order";
        if (rollObj.isVisibleInOrder) addToOrderBtn.style.display = "none";
        addToOrderBtn.addEventListener("click", () => {
          rollObj.isVisibleInOrder = true;
          renderInitiative();
          renderEditorStats(characterName);
        });
        rollDiv.appendChild(addToOrderBtn);
      }

      sectionDiv.appendChild(rollDiv);
    });

    const addBtn = document.createElement("button");
    addBtn.textContent = "Add Roll";
    addBtn.addEventListener("click", () => {
      const newRoll = { roll: 1, modifier: 0 };
      if (section.key === "initiative") { newRoll.total = newRoll.roll + newRoll.modifier; newRoll.isVisibleInOrder = false; }
      if (section.key === "attack") newRoll.damage = 0;
      stats[`${section.key}Rolls`].push(newRoll);
      recalcCharacterStats(characterName);
      renderEditorStats(characterName);
      updateSideStats();
    });
    sectionDiv.appendChild(addBtn);
    editorContainer.appendChild(sectionDiv);
  });

  // ── Other Stats ──
  const otherStatsDiv = document.createElement("div");
  otherStatsDiv.classList.add("other-stats-section");

  function statField(labelText, inputEl) {
    const h = document.createElement("h3"); h.textContent = labelText;
    otherStatsDiv.appendChild(h);
    otherStatsDiv.appendChild(inputEl);
  }

  const moneyInput = document.createElement("input"); moneyInput.type = "number"; moneyInput.step = "0.01"; moneyInput.value = stats.moneySpent?.toFixed(2) ?? 0;
  moneyInput.addEventListener("input", () => { stats.moneySpent = parseFloat(moneyInput.value) || 0; updateSideStats(); });
  statField("Money Spent:", moneyInput);

  const dmgInput = document.createElement("input"); dmgInput.type = "number"; dmgInput.value = stats.attackDamage ?? 0;
  dmgInput.addEventListener("input", () => { stats.attackDamage = parseFloat(dmgInput.value) || 0; updateSideStats(); });
  statField("MISC Damage:", dmgInput);

  const healInput = document.createElement("input"); healInput.type = "number"; healInput.value = stats.healingDone ?? 0;
  healInput.addEventListener("input", () => { stats.healingDone = parseFloat(healInput.value) || 0; updateSideStats(); });
  statField("MISC Healing:", healInput);

  const killedInput = document.createElement("input"); killedInput.type = "number"; killedInput.value = stats.timesKilled ?? 0;
  killedInput.addEventListener("input", () => { stats.timesKilled = parseInt(killedInput.value) || 0; updateSideStats(); });
  statField("Times Killed:", killedInput);

  editorContainer.appendChild(otherStatsDiv);
  renderSpellEditor(characterName);
}

function removeSaveFromSpell(casterName, spell, svIndex) {
  const sv = spell.saves[svIndex];
  if (!sv) return;
  const target = sv.target;
  spell.saves.splice(svIndex, 1);
  if (target && target !== casterName) {
    const targetStats = gameData.characterStats[target];
    if (targetStats?.savesFromSpells) {
      targetStats.savesFromSpells = targetStats.savesFromSpells.filter(s => s !== sv);
      recalcCharacterStats(target);
    }
  }
  recalcCharacterStats(casterName);
  updateSideStats();
  renderSpellEditor(casterName);
}

function removeRollEntry(characterName, type, index) {
  const stats = gameData.characterStats[characterName];
  if (!stats) return;
  let list;
  switch (type) {
    case "attack": list = stats.attackRolls; break;
    case "ability": list = stats.abilityRolls; break;
    case "save": list = stats.saveRolls; break;
    case "initiative": list = stats.initiativeRolls; break;
    default: return;
  }
  list.splice(index, 1);
  stats.natural1s = 0; stats.natural20s = 0;
  ["attackRolls", "abilityRolls", "saveRolls", "initiativeRolls"].forEach(typeKey => {
    if (Array.isArray(stats[typeKey])) {
      stats[typeKey].forEach(r => { if (r.roll === 1) stats.natural1s++; if (r.roll === 20) stats.natural20s++; });
    }
  });
  renderEditorStats(characterName);
  updateSideStats();
}

// -------------------- STATS DROPDOWNS --------------------
function populateStatsSelects() {
  const statsSelect = document.getElementById("stats-character-select");
  const editorSelect = document.getElementById("editor-character-select");
  const visibleChars = getCompatibleActiveCharacters();

  [statsSelect, editorSelect].forEach(select => {
    if (!select) return;
    select.innerHTML = "";
    visibleChars.forEach(name => {
      const opt = document.createElement("option"); opt.value = name; opt.textContent = name; select.appendChild(opt);
    });
  });

  if (statsSelect) {
    statsSelect.onchange = () => {
      selectedCharacter = statsSelect.value;
      updateSideStats();
      renderStatsActions(selectedCharacter);
      highlightSelectedButton(selectedCharacter);
    };
  }

  if (editorSelect) {
    editorSelect.onchange = () => {
      selectedCharacter = editorSelect.value;
      renderEditorStats(editorSelect.value);
      updateSideStats();
      highlightSelectedButton(selectedCharacter);
    };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  init();
});
