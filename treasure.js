const lootData = {
  gems_and_art: {},
  healing_potions: {},
  hoard_magic: {},
  hoard_coin: {},
  individual: {},
  magic_item: {},
  shop_chances: {},
  shop_setting: {},
  subtypes: {}
}

let lootDataLoaded = false;

const rarityLabels = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  veryRare: "Very Rare",
  legendary: "Legendary",
};

const rarityColors = {
  common: "#9e9e9e",
  uncommon: "#4caf50",
  rare: "#2196f3",
  veryRare: "#9c27b0",
  legendary: "#ff9800",
};

const mundaneCosts = {
  // Armor
  "padded": 5, 
  "leather": 10, 
  "studded leather": 45,
  "hide": 10, 
  "chain shirt": 50, 
  "scale mail": 50,
  "breastplate": 400, 
  "half plate": 750,
  "ring mail": 30, 
  "chain mail": 75, 
  "splint": 200, 
  "plate": 1500,
  "shield": 10,
  // Weapons
  "club": 0.1,
  "dagger": 2, 
  "greatclub": 0.2,
  "handaxe": 5, 
  "javelin": 0.5,
  "light hammer": 2,
  "mace": 5,
  "quarterstaff": 0.2,
  "sickle": 1,
  "spear": 1,
  "dart": 0.05,
  "light crossbow": 25, 
  "shortbow": 25, 
  "sling": 0.1,
  "battleaxe": 10,
  "flail": 10,
  "glaive": 20,
  "greataxe": 30, 
  "greatsword": 50,
  "halberd": 20,
  "lance": 10,
  "longsword": 15,
  "maul": 10, 
  "morningstar": 15,
  "pike": 5,
  "rapier": 25, 
  "scimitar": 25, 
  "shortsword": 10,
  "trident": 5,  
  "warhammer": 15, 
  "war pick": 5,
  "whip": 2,
  "blowgun": 10,
  "hand crossbow": 75,
  "heavy crossbow": 50, 
  "longbow": 50,
  "musket": 500,
  "pistol": 250
};

// === BASIC UTILS ===
async function loadData() {
  try {
    const [
      gems_and_art,
      healing_potions,
      hoard_magic,
      hoard_coin,
      individual,
      magic_item,
      shop_chances,
      shop_setting,
      subtypes

    ] = await Promise.all([
      fetch("data/treasure/gems_and_art.json").then(r => r.json()),
      fetch("data/treasure/healing_potions.json").then(r => r.json()),
      fetch("data/treasure/hoard_magic.json").then(r => r.json()),
      fetch("data/treasure/hoard_coin.json").then(r => r.json()),
      fetch("data/treasure/individual.json").then(r => r.json()),
      fetch("data/treasure/magic_item.json").then(r => r.json()),
      fetch("data/treasure/shop_chances.json").then(r => r.json()),
      fetch("data/treasure/shop_setting.json").then(r => r.json()),
      fetch("data/treasure/subtypes.json").then(r => r.json())
    ]);

    lootData.gems_and_art = gems_and_art;
    lootData.healing_potions = healing_potions;
    lootData.hoard_magic = hoard_magic;
    lootData.hoard_coin = hoard_coin;
    lootData.individual = individual;
    lootData.magic_item = magic_item;
    lootData.shop_chances = shop_chances;
    lootData.shop_setting = shop_setting;
    lootData.subtypes = subtypes;

    lootDataLoaded = true;
  } catch (error) {
    console.error("Error loading treasure data:", error);
  }
}

function rollDice(dice) {
  const match = dice.match(/(\d+)d(\d+)(?:\s*\*\s*(\d+))?/);

  if (!match) return 0;

  const [, count, sides, multiplier] = match.map(Number);

  let total = 0;

  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }

  return total * (multiplier || 1);
}

function resolveMatchItem(match) {
  if (!match) return null;

  if (typeof match.item === "function") {
    return match.item();
  }

  return match.item; // object or string
}

function resolveQuantity(quantity) {
  if (!quantity) return 0;
  if (/\d+d\d+/.test(quantity)) return rollDice(quantity);
  return parseInt(quantity, 10) || 0;
}

function injectQuantity(value, qty) {
  if (!value) return "";

  // replace first dice expression OR insert at front
  if (/\d+d\d+/.test(value)) {
    return value.replace(/\d+d\d+/, qty);
  }

  return `${qty} ${value}`;
}

function combineDuplicates(array) {
  const combined = {};
  for (const item of array) {
    combined[item] = (combined[item] || 0) + 1;
  }
  return combined;
}

function rollPercent() {
  return Math.floor(Math.random() * 100) + 1;
}

function normalize(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

// === COIN FORMATTER ===
function formatCoins({ cp = 0, sp = 0, gp = 0, pp = 0 }) {
  let str = "";
  if (cp) str += `COPPER PIECES: ${rollDice(cp)} <br>`;
  if (sp) str += `SILVER PIECES: ${rollDice(sp)} <br>`;
  if (gp) str += `GOLD PIECES: ${rollDice(gp)} <br>`;
  if (pp) str += `PLATINUM PIECES: ${rollDice(pp)} <br>`;
  return str;
}

// === HOARD GENERATION LOGIC ===
function generateHoard(tier) {
  const percent = rollPercent();
  const GemArtTable = lootData.gems_and_art[tier];
  const row = GemArtTable.find(r => percent >= r.min && percent <= r.max);
  if (!row) return "No hoard result found.";

  const reward = row.reward;
  let output = "";

  // --- Coins ---
  const coins = lootData.hoard_coin[tier];
  output += `<h3>Coins:</h3>${formatCoins(coins)}`;

  // --- Valuables ---
  const qty = resolveQuantity(reward.quantity);
  const valueText = injectQuantity(reward.value, qty);

  output += `<h3>Valuables:</h3>${valueText}`;

  // --- Magic Items ---
  let generatedItems = [];

  const tables = normalize(reward.items);
  const amounts = normalize(reward.amount);

  for (let i = 0; i < tables.length; i++) {
    const tableKey = tables[i];
    const amountExpr = amounts[i] || amounts[0] || "1";

    const count = /\d+d\d+/.test(amountExpr)
      ? rollDice(amountExpr)
      : parseInt(amountExpr, 10) || 1;

    const table = lootData.hoard_magic[tableKey];
    if (!table) continue;

    for (let j = 0; j < count; j++) {
      const roll = rollPercent();
      const match = table.find(r => roll >= r.min && roll <= r.max);

      if (!match?.item) continue;

      const item = typeof match.item === "function"
        ? match.item()
        : match.item;

      generatedItems.push(resolveItemDetails(item, true));
    }
  }

  // --- Combine and Display ---
  if (generatedItems.length > 0) {
    const combined = {};
    for (const item of generatedItems) {
      combined[item] = (combined[item] || 0) + 1;
    }

    const sortedItems = Object.entries(combined).sort((a, b) =>
      a[0].localeCompare(b[0], "en", { sensitivity: "base" })
    );

    output += `<h3>Magic Items</h3>`;
    for (const [item, data] of sortedItems) {
      const qty =
        data.count > 1
          ? `(${data.count}) `
          : "";

      output += `${qty}${item} — Price: ${data.price} gp<br>`;
    }

  } else {
    output += `<h3>Magic Items</h3>None<br>`;
  }

  return output;
}

// === VALUE STRING HANDLER ===
function resolveValueString(str) {
  // Example: "2d4 25 gp art objects"
  const diceMatch = str.match(/(\d+d\d+)/);
  if (!diceMatch) return str;

  const rolled = rollDice(diceMatch[1]);
  return str.replace(diceMatch[1], rolled);
}

// === ITEM STRING HANDLER (returns array of names) ===
function resolveItemString(str) {
  // Examples: "1d4 A" or "1 G"
  const diceMatch = str.match(/(\d+d\d+)/);
  const [countStr, tableKey] = str.trim().split(" ").filter(Boolean);

  let count;
  if (diceMatch) {
    count = rollDice(diceMatch[1]);
  } else {
    count = parseInt(countStr, 10);
  }


  const letter = tableKey.toUpperCase();
  const results = [];

  for (let i = 0; i < count; i++) {
    const roll = rollPercent();
    const magicRow = lootData.hoard_magic[letter].find(r => roll >= r.min && roll <= r.max);
    if (magicRow) {
      const item = resolveMatchItem(magicRow);
      results.push(resolveItemDetails(item, true));
    } else {
      results.push(`(No item found on table ${letter})`);
    }
  }

  return results;
}

function generateMagicShop(level = "mid", type = "magicSeller") {
  const settings = lootData.shop_setting[level];
  let output = "";

  const marketFlux = 0.95 + Math.random() * 0.10;

  for (const rarity of Object.keys(lootData.magic_item[type])) {
    const countRange = settings[rarity];

    if (!Array.isArray(countRange) || countRange.length < 2) {
      console.warn(`Missing countRange for rarity: ${rarity}`);
      continue;
    }

    const healingPotions = Math.floor(Math.random() * (countRange[1] - countRange[0] + 1)) + countRange[0];
    const amount = Math.floor(Math.random() * (countRange[1] - countRange[0] + 1)) + countRange[0];

    // FOR TESTING
    // const amount = 1;
    if (amount <= 0) continue;

    let chance = level;
    let option = rarity;

    const rarityMultiplier =
      lootData.shop_chances[level]?.[rarity] ?? 1;

    // --- Collect items first ---
    const generatedItems = [];
    for (let i = 0; i < amount; i++) {
      const item = lootData.magic_item[type][rarity][Math.floor(Math.random() * lootData.magic_item[type][rarity].length)];
      if (!item) continue;
      const fullItem = resolveItemDetails(item, true);
      generatedItems.push({
        name: fullItem.name ?? fullItem,
        baseCost: item.cost,
        mundaneAdd: fullItem.mundaneAdd ?? 0,
        rarity
      });
    }

    if (type === "potionSeller" || type === "magicSeller") {
      for (let i = 0; i < healingPotions; i++) {
        if (rarity != "legendary") {
          let item = lootData.healing_potions[rarity][Math.floor(Math.random() * lootData.healing_potions[rarity].length)];
          let fullItem = resolveItemDetails(item, true);
          generatedItems.push({
            name: fullItem,
            baseCost: item.cost,
            rarity
          });
        }
      }
    }

    if (generatedItems.length === 0) {
      continue;
    }

    // --- Combine duplicates ---
    const combined = {};
    for (const item of generatedItems) {
      const finalPrice = Number((
        (item.baseCost + (item.mundaneAdd ?? 0)) *
        rarityMultiplier *
        marketFlux
      ));

      if (!combined[item.name]) {
        combined[item.name] = {
          count: 1,
          price: finalPrice
        };
      } else {
        combined[item.name].count++;
      }
    }

    // --- Sort alphabetically by item name ---
    const sortedItems = Object.entries(combined).sort((a, b) =>
      a[0].localeCompare(b[0], "en", { sensitivity: "base" })
    );

    // --- Output display ---
    output += `<h3 style="color: ${rarityColors[rarity] ?? '#ccc'}">${(rarityLabels[rarity] ?? rarity).toUpperCase()} ITEMS (${amount})</h3>`;
    for (const [item, data] of sortedItems) {
      const qty = data.count > 1 ? `(${data.count}) ` : "";
      output += `${qty}${item} — Price: ${data.price.toFixed(2)} gp<br>`;
    }
  }

  return output;
}

// === MAGIC ITEM SUBTYPE GENERATOR ===
function resolveItemDetails(item, includeMundaneCost = false) {
  if (!item) {
    return "Unknown Item";
  }

  const { name, keyword = "", attunement } = item;

  // === Handle Armor of Resistance ===
  if (keyword.includes("armor") && (keyword.includes("resistance") || keyword.includes("bps resistance"))) {
    // --- Pick resistance type ---
    let type = [];
    if (keyword.includes("resistance")) {
      type = lootData.subtypes.potion.resistance;
    }
    else {
      type = lootData.subtypes.potion.bpsresistance;
    }
    const resistPool = type
    const chosenResist = resistPool[Math.floor(Math.random() * resistPool.length)];

    // --- Determine armor type ---
    // Check for a specific armor keyword like "chain mail", "plate", etc.
    const specificArmor = Object.values(lootData.subtypes.armor)
      .flat()
      .find(a => keyword.includes(a.toLowerCase()));

    let chosenArmor;
    if (specificArmor) {
      // Use explicitly defined armor type
      chosenArmor = specificArmor;
    } else {
      // Otherwise pick randomly from available armor subtype pools
      let armorPool = [];
      if (keyword.includes("light")) armorPool.push(...lootData.subtypes.armor.light);
      if (keyword.includes("medium")) armorPool.push(...lootData.subtypes.armor.medium);
      if (keyword.includes("heavy")) armorPool.push(...lootData.subtypes.armor.heavy);
      if (armorPool.length === 0) {
        // fallback to medium armor
        armorPool.push(...lootData.subtypes.armor.medium);
      }
      chosenArmor = armorPool[Math.floor(Math.random() * armorPool.length)];
    }

    // --- Return formatted output ---
    // Example: "Armor of Resistance (chain mail, fire)"
    return `${name} (${chosenArmor}, ${chosenResist})${attunement}`;
  }

  if (keyword.includes("potion")) {
    let typePool = [];

    // === Handle Potions of Resistance ===
    if (keyword.includes("resistance")) {
      const typePool = lootData.subtypes.potion.resistance;
      const chosen = typePool[Math.floor(Math.random() * typePool.length)];
      return `${name} (${chosen})${attunement}`;
    }

    if (keyword.includes("giant strength")) {
      let subtypePool = [];
      if (keyword.includes("uncommon")) subtypePool.push(...lootData.subtypes.potion.giantStrength.uncommon);
      if (keyword.includes("rare")) subtypePool.push(...lootData.subtypes.potion.giantStrength.rare);
      if (keyword.includes("very rare")) subtypePool.push(...lootData.subtypes.potion.giantStrength.veryRare);
      if (keyword.includes("legendary")) subtypePool.push(...lootData.subtypes.potion.giantStrength.legendary);

      if (subtypePool.length > 0) {
        const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
        return `${name} (${chosen})${attunement}`;
      }
    }

    if (keyword.includes("healing")) {
      let subtypePool = [];
      if (keyword.includes("common")) subtypePool.push(...lootData.subtypes.potion.healing.common);
      if (keyword.includes("uncommon")) subtypePool.push(...lootData.subtypes.potion.healing.uncommon);
      if (keyword.includes("rare")) subtypePool.push(...lootData.subtypes.potion.healing.rare);
      if (keyword.includes("very rare")) subtypePool.push(...lootData.subtypes.potion.healing.veryRare);

      if (subtypePool.length > 0) {
        const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
        return `${name} (${chosen})${attunement}`;
      }
    }
  }

  // === Handle Armor ===
  if (keyword.includes("armor")) {
    let subtypePool = [];
    if (keyword.includes("light")) subtypePool.push(...lootData.subtypes.armor.light);
    if (keyword.includes("medium")) subtypePool.push(...lootData.subtypes.armor.medium);
    if (keyword.includes("heavy")) subtypePool.push(...lootData.subtypes.armor.heavy);
    if (keyword.includes("shield")) subtypePool.push(...lootData.subtypes.armor.shield);
    if (keyword.includes("MH not hide")) subtypePool.push(...lootData.subtypes.armor.MHNotHide);
    if (keyword.includes("magic armor")) subtypePool.push(...lootData.subtypes.armor.magicArmor);
    if (keyword.includes("elven chain")) subtypePool.push(...lootData.subtypes.armor.elvenChain);
    if (keyword.includes("plates")) subtypePool.push(...lootData.subtypes.armor.plates);
    if (keyword.includes("heavy plate")) subtypePool.push(...lootData.subtypes.armor.heavyPlate);

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      const mundaneAdd = includeMundaneCost ? (mundaneCosts[chosen.toLowerCase()] ?? 0) : 0;
      const displayName = keyword.includes("magic armor") ? chosen : `${name} (${chosen})${attunement}`;
      if (includeMundaneCost) return { name: displayName, mundaneAdd };
      return displayName;
    }
  }

  // === Handle Weapons ===
  if (keyword.includes("weapon")) {
    let subtypePool = [];
    if (keyword.includes("any")) subtypePool.push(...lootData.subtypes.weapon.any);
    if (keyword.includes("melee")) subtypePool.push(...lootData.subtypes.weapon.melee);
    if (keyword.includes("ranged")) subtypePool.push(...lootData.subtypes.weapon.ranged);
    if (keyword.includes("ammunition")) subtypePool.push(...lootData.subtypes.weapon.ammunition);
    if (keyword.includes("any sword")) subtypePool.push(...lootData.subtypes.weapon.anySword);
    if (keyword.includes("any bow")) subtypePool.push(...lootData.subtypes.weapon.anyBow);
    if (keyword.includes("string")) subtypePool.push(...lootData.subtypes.weapon.strungBow);
    if (keyword.includes("bladed")) subtypePool.push(...lootData.subtypes.weapon.bladed);
    if (keyword.includes("vorpal")) subtypePool.push(...lootData.subtypes.weapon.vorpal);
    if (keyword.includes("pointed")) subtypePool.push(...lootData.subtypes.weapon.pointed);
    if (keyword.includes("long")) subtypePool.push(...lootData.subtypes.weapon.long);
    if (keyword.includes("one-handed melee")) subtypePool.push(...lootData.subtypes.weapon.onehandedMelee);
    if (keyword.includes("hammer")) subtypePool.push(...lootData.subtypes.weapon.hammer);
    if (keyword.includes("axe")) subtypePool.push(...lootData.subtypes.weapon.axe);
    if (keyword.includes("all axe")) subtypePool.push(...lootData.subtypes.weapon.allAxe);
    if (keyword.includes("answering")) subtypePool.push(...lootData.subtypes.weapon.answering);

    if (keyword.includes("slaying")) {
    // this branch returns early, handle it separately
    const roll = Math.floor(Math.random() * 100) + 1;
    const pool = lootData.subtypes.scrollOfProtection;
    const match = pool.find(entry => roll >= entry.min && roll <= entry.max);

    if (match) {
      const chosen1 = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      const chosen2 = resolveMatchItem(match);
      const displayName = `${name} (${chosen1}) (${chosen2.name})${attunement}`;
      const mundaneAdd = includeMundaneCost ? (mundaneCosts[chosen1.toLowerCase()] ?? 0) : 0;
      if (includeMundaneCost) return { name: displayName, mundaneAdd };
      return displayName;
    }
  }

  if (subtypePool.length > 0) {
    const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
    const displayName = `${name} (${chosen})${attunement}`;
    const mundaneAdd = includeMundaneCost ? (mundaneCosts[chosen.toLowerCase()] ?? 0) : 0;
    if (includeMundaneCost) return { name: displayName, mundaneAdd };
    return displayName;
  }
}

  if (keyword.includes("ring")) {
    let subtypePool = [];
    if (keyword.includes("resistance")) subtypePool.push(...lootData.subtypes.ring.resistance);

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${name} (${chosen})${attunement}`;
    }
  }

  if (keyword.includes("scroll")) {
    let subtypePool = [];
    if (keyword.includes("cantrip")) subtypePool.push(...lootData.subtypes.scroll.zero);
    if (keyword.includes("1st level")) subtypePool.push(...lootData.subtypes.scroll.one);
    if (keyword.includes("2nd level")) subtypePool.push(...lootData.subtypes.scroll.two);
    if (keyword.includes("3rd level")) subtypePool.push(...lootData.subtypes.scroll.three);
    if (keyword.includes("4th level")) subtypePool.push(...lootData.subtypes.scroll.four);
    if (keyword.includes("5th level")) subtypePool.push(...lootData.subtypes.scroll.five);
    if (keyword.includes("6th level")) subtypePool.push(...lootData.subtypes.scroll.six);
    if (keyword.includes("7th level")) subtypePool.push(...lootData.subtypes.scroll.seven);
    if (keyword.includes("8th level")) subtypePool.push(...lootData.subtypes.scroll.eight);
    if (keyword.includes("9th level")) subtypePool.push(...lootData.subtypes.scroll.nine);

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${name} (${chosen})${attunement}`;
    }
  }

  if (keyword.includes("wand")) {
    let subtypePool = [];
    if (keyword.includes("wood focus")) subtypePool.push(...lootData.subtypes.wand.woodFocus);

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${name} (${chosen})${attunement}`;
    }
  }

  if (keyword.includes("golem")) {
    const roll = Math.floor(Math.random() * 20) + 1;
    const pool = lootData.subtypes.golem;
    const match = pool.find(entry => roll >= entry.min && roll <= entry.max);

    if (match) {
      const chosen = resolveMatchItem(match);
      return `${name} (${chosen.name})${attunement}`;
    }
  }

  if (keyword.includes("giant strength")) {
    let subtypePool = [];
    subtypePool.push(...lootData.subtypes.giantStrength);

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${chosen}${attunement}`;
    }
  }

  if (keyword.includes("carpet")) {
    let subtypePool = [];
    subtypePool.push(...lootData.subtypes.carpet);

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${name} (${chosen})${attunement}`;
    }
  }

  if (keyword.includes("iron flask")) {
    const roll = Math.floor(Math.random() * 100) + 1;
    const pool = lootData.subtypes.ironFlask;
    const match = pool.find(entry => roll >= entry.min && roll <= entry.max);

    if (match) {
      const chosen = resolveMatchItem(match);

      // Handle if the entry’s name is an array (e.g. multiple possible creatures)
      if (Array.isArray(chosen.name)) {
        const randomPick = chosen.name[Math.floor(Math.random() * chosen.name.length)];
        return `${name} (${randomPick})${attunement}`;
      } else {
        return `${name} (${chosen.name})${attunement}`;
      }
    }
  }

  if (keyword.includes("prayer beads")) {
    const num = Math.floor(Math.random() * 4) + 2; // 2–5 beads
    const beadResults = [];

    // Roll each bead
    for (let i = 0; i < num; i++) {
      const roll = Math.floor(Math.random() * 20) + 1;
      const pool = lootData.subtypes.prayerBeads;
      const match = pool.find(entry => roll >= entry.min && roll <= entry.max);

      if (match) {
        const chosen = resolveMatchItem(match);

        if (Array.isArray(chosen.name)) {
          const randomPick = chosen.name[Math.floor(Math.random() * chosen.name.length)];
          beadResults.push(randomPick);
        } else {
          beadResults.push(chosen.name);
        }
      }
    }

    // --- Combine duplicates ---
    const combined = {};
    for (const bead of beadResults) {
      combined[bead] = (combined[bead] || 0) + 1;
    }

    // --- Sort alphabetically ---
    const sorted = Object.keys(combined).sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" })
    );

    // --- Format output ---
    const formatted = sorted
      .map(name => (combined[name] > 1 ? `(${combined[name]}) ${name}` : name))
      .join(", ");

    return `${name} (${num} Beads: ${formatted})${attunement}`;
  }

  if (keyword.includes("sling bullets")) {
    const num = Math.floor(Math.random() * 5) + 4; // 2–5 beads
    const bulletResults = [];

    // Roll each bead
    for (let i = 0; i < num; i++) {
      const roll = Math.floor(Math.random() * 4) + 1;
      const pool = lootData.subtypes.slingBullets;
      const match = pool.find(entry => roll >= entry.min && roll <= entry.max);

      if (match) {
        const chosen = resolveMatchItem(match);

        if (Array.isArray(chosen.name)) {
          const randomPick = chosen.name[Math.floor(Math.random() * chosen.name.length)];
          bulletResults.push(randomPick);
        } else {
          bulletResults.push(chosen.name);
        }
      }
    }

    // --- Combine duplicates ---
    const combined = {};
    for (const bead of bulletResults) {
      combined[bead] = (combined[bead] || 0) + 1;
    }

    // --- Sort alphabetically ---
    const sorted = Object.keys(combined).sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" })
    );

    // --- Format output ---
    const formatted = sorted
      .map(name => (combined[name] > 1 ? `(${combined[name]}) ${name}` : name))
      .join(", ");

    return `${name} (${num} Bullets: ${formatted})${attunement}`;
  }

  if (keyword.includes("figurine")) {
    let subtypePool = [];
    subtypePool.push(...lootData.subtypes.figurine);

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${name} (${chosen})${attunement}`;
    }
  }

  if (keyword.includes("instrument")) {
    let subtypePool = [];
    subtypePool.push(...lootData.subtypes.instruments);

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${name} (${chosen})${attunement}`;
    }
  }

  if (keyword.includes("instrument of bards")) {
    let subtypePool = [];
    if (keyword.includes("uncommon")) subtypePool.push(...lootData.subtypes.instrumentOfBards.uncommon);
    if (keyword.includes("rare")) subtypePool.push(...lootData.subtypes.instrumentOfBards.rare);
    if (keyword.includes("very rare")) subtypePool.push(...lootData.subtypes.instrumentOfBards.veryRare);
    if (keyword.includes("legendary")) subtypePool.push(...lootData.subtypes.instrumentOfBards.legendary);

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${name} (${chosen})${attunement}`;
    }
  }

  if (keyword.includes("orb shield")) {
    let subtypePool = [];
    subtypePool.push(...lootData.subtypes.orbShield);

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${name} (${chosen})${attunement}`;
    }
  }

  if (keyword.includes("trick bag")) {
    let subtypePool = [];
    subtypePool.push(...lootData.subtypes.trickBag);

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${name} (${chosen})${attunement}`;
    }
  }

  if (keyword.includes("deck")) {
    let subtypePool = [];
    if (keyword.includes("illusion")) {
      const roll = (35 - (Math.floor(Math.random() * 20)));
      subtypePool.push(`${roll} Cards`);
    }

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${name} (${chosen})${attunement}`;
    }
  }

  if (keyword.includes("dust")) {
    let subtypePool = [];
    if (keyword.includes("dryness")) {
      const roll = (Math.floor(Math.random() * 6) + 5);
      subtypePool.push(`${roll} Cards`);
    }

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${name} (${chosen})${attunement}`;
    }
  }

  if (keyword.includes("elemental")) {
    let subtypePool = [];
    subtypePool.push(...lootData.subtypes.elemental);

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${name} (${chosen})${attunement}`;
    }
  }

  if (keyword.includes("dose")) {
    let subtypePool = [];
    if (keyword.includes("keoghtom's")) {
      const roll = ((Math.floor(Math.random() * 4)) + 1);
      subtypePool.push(`${roll} doses`);
    }
    if (keyword.includes("bag of beans")) {
      const roll = ((Math.floor(Math.random() * 10)) + 3);
      subtypePool.push(`${roll} beans`);
    }
    if (keyword.includes("bead of force")) {
      const roll = ((Math.floor(Math.random() * 4)) + 5);
      subtypePool.push(`${roll} beads`);
    }
    if (keyword.includes("necklace of fireball")) {
      const roll = ((Math.floor(Math.random() * 6)) + 4);
      subtypePool.push(`${roll} beads`);
    }

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${name} (${chosen})${attunement}`;
    }
  }

  if (keyword.includes("mind crystal")) {
    let subtypePool = [];
    if (keyword.includes("common")) subtypePool.push(...lootData.subtypes.mindCrystal.common);
    if (keyword.includes("uncommon")) subtypePool.push(...lootData.subtypes.mindCrystal.uncommon);
    if (keyword.includes("rare")) subtypePool.push(...lootData.subtypes.mindCrystal.rare);

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${name} (${chosen})${attunement}`;
    }
  }

  if (keyword.includes("creature")) {
    const roll = Math.floor(Math.random() * 100) + 1;
    const pool = lootData.subtypes.creature;
    const match = pool.find(entry => roll >= entry.min && roll <= entry.max);

    if (match) {
      const chosen = resolveMatchItem(match);

      if (Array.isArray(chosen.name)) {
        const randomPick = chosen.name[Math.floor(Math.random() * chosen.name.length)];
        return `${name} (${randomPick})${attunement}`;
      } else {
        return `${name} (${chosen.name})${attunement}`;
      }
    }
  }

  if (keyword.includes("scroll of protection")) {
    const roll = Math.floor(Math.random() * 100) + 1;
    const pool = lootData.subtypes.scrollOfProtection;
    const match = pool.find(entry => roll >= entry.min && roll <= entry.max);

    if (match) {
      const chosen = resolveMatchItem(match);
      return `${name} (${chosen.name})${attunement}`;
    }
  }

  if (keyword.includes("alignment")) {
    const roll = Math.floor(Math.random() * 20) + 1;
    const pool = lootData.subtypes.alignment;
    const match = pool.find(entry => roll >= entry.min && roll <= entry.max);

    if (match) {
      const chosen = resolveMatchItem(match);

      if (Array.isArray(chosen.name)) {
        const randomPick = chosen.name[Math.floor(Math.random() * chosen.name.length)];
        return `${name} (${randomPick})${attunement}`;
      } else {
        return `${name} (${chosen.name})${attunement}`;
      }
    }
  }

  if (keyword.includes("dragon")) {
    let subtypePool = [];
    subtypePool.push(...lootData.subtypes.dragonScale);

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${name} (${chosen})${attunement}`;
    }
  }

  if (keyword.includes("feather token")) {
    let subtypePool = [];
    if (keyword.includes("uncommon")) subtypePool.push(...lootData.subtypes.featherTokenByRarity.uncommon);
    if (keyword.includes("rare")) subtypePool.push(...lootData.subtypes.featherTokenByRarity.rare);

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${name} (${chosen})${attunement}`;
    }
  }

  if (keyword.includes("useful items")) {
    const totalPatches = rollDice("4d4");
    const patches = [
      "2 daggers",
      "Bullseye lantern (filled and lit)",
      "Steel mirror",
      "10-foot pole",
      "Hempen rope (50 feet, coiled)",
      "Sack"
    ];

    // === Determine extra patches (4d4 rolls) ===
    const extraPatches = rollDice("4d4");

    // === d100 Table for Additional Patches ===
    const robeTable = [
      { min: 1, max: 8, item: "Bag of 100 gp" },
      { min: 9, max: 15, item: "Silver coffer (500 gp)" },
      { min: 16, max: 22, item: "Iron door (up to 10 ft by 10 ft)" },
      { min: 23, max: 30, item: "10 gems worth 100 GP each" },
      { min: 31, max: 44, item: "Ladder (24 ft)" },
      { min: 45, max: 51, item: "Riding Horse with a Riding Saddle" },
      { min: 52, max: 59, item: "Open pit (10-foot cube)" },
      { min: 60, max: 68, item: "4 Potion of Healing" },
      { min: 69, max: 75, item: "Rowboat (12 feet long)" },
      { min: 76, max: 83, item: "Spell Scroll" },
      { min: 84, max: 90, item: "2 Mastiffs" },
      { min: 91, max: 96, item: "Window (2 feet by 4 feet, up to 2 feet deep)" },
      { min: 97, max: 100, item: "Portable Ram" }
    ];

    // === Roll for each additional patch ===
    for (let i = 0; i < extraPatches; i++) {
      const roll = Math.floor(Math.random() * 100) + 1;
      const match = robeTable.find(r => roll >= r.min && roll <= r.max);
      if (!match) continue;

      const item = match.item;

      // === Handle spell scroll generation ===
      if (item.startsWith("Spell Scroll")) {
        const level = Math.floor(Math.random() * 3) + 1;

        // Pick a random spell from the proper scroll pool
        let subtypePool = [];
        if (level === 1) subtypePool = lootData.subtypes.scroll.one;
        if (level === 2) subtypePool = lootData.subtypes.scroll.two;
        if (level === 3) subtypePool = lootData.subtypes.scroll.three;

        if (subtypePool.length > 0) {
          const chosenSpell = subtypePool[Math.floor(Math.random() * subtypePool.length)];
          patches.push(`Spell Scroll (${chosenSpell})`);
        } else {
          patches.push(item);
        }
      } else {
        patches.push(item);
      }
    }

    // === Combine duplicates ===
    const combined = {};
    for (const patch of patches) {
      combined[patch] = (combined[patch] || 0) + 1;
    }

    // === Sort and format output ===
    const sorted = Object.keys(combined).sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" })
    );

    const formatted = sorted
      .map(name => (combined[name] > 1 ? `(${combined[name]}) ${name}` : name))
      .join(", ");

    return `${name} (${patches.length} Patches: ${formatted})${attunement}`;
  }

  if (keyword.includes("belt of giant strength")) {
    let subtypePool = [];
    if (keyword.includes("rare")) subtypePool.push(...lootData.subtypes.beltOfGiantStrength.rare);
    if (keyword.includes("very rare")) subtypePool.push(...lootData.subtypes.beltOfGiantStrength.veryRare);
    if (keyword.includes("legendary")) subtypePool.push(...lootData.subtypes.beltOfGiantStrength.legendary);

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `Belt of ${chosen} Giant Strength${attunement}`;
    }
  }

  if (keyword.includes("horn of valhalla")) {
    let subtypePool = [];
    if (keyword.includes("rare")) subtypePool.push(...lootData.subtypes.hornOfValhalla.rare);
    if (keyword.includes("very rare")) subtypePool.push(...lootData.subtypes.hornOfValhalla.veryRare);
    if (keyword.includes("legendary")) subtypePool.push(...lootData.subtypes.hornOfValhalla.legendary);

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${name} (${chosen})${attunement}`;
    }
  }

  if (keyword.includes("ioun")) {
    let subtypePool = [];
    if (keyword.includes("rare")) subtypePool.push(...lootData.subtypes.ioun.rare);
    if (keyword.includes("very rare")) subtypePool.push(...lootData.subtypes.ioun.veryRare);
    if (keyword.includes("legendary")) subtypePool.push(...lootData.subtypes.ioun.legendary);

    if (subtypePool.length > 0) {
      const chosen = subtypePool[Math.floor(Math.random() * subtypePool.length)];
      return `${name} (${chosen})${attunement}`;
    }
  }

  if (keyword.includes("brilliance")) {
    const roll1 = Math.floor(Math.random() * 10) + 1;
    const roll2 = Math.floor(Math.random() * 19) + 2;
    const roll3 = Math.floor(Math.random() * 28) + 3;
    const roll4 = Math.floor(Math.random() * 37) + 4;

    return `${name}, (${roll1} diamonds, ${roll2} rubies, ${roll3} fire opals, ${roll4} opals)${attunement}`;
  }

  // === Default ===
  return `${name}, (${keyword})${attunement}`;
}

// === MAIN GENERATION ===

function generateTreasure(type, tier) {
  if (type === "individual") {
    const roll = rollPercent();
    const table = lootData.individual[tier];
    const entry = table.find(e => roll >= e.min && roll <= e.max);
    return formatCoins(entry.coins);
  }

  if (type === "hoard") {
    const coins = lootData.hoard_coin[tier];
    // (expand later: gems/art/magic items)
    return generateHoard(tier);
  }

  if (type === "shop") {
    let output = "";
    const marketFlux = 0.95 + Math.random() * 0.10;
    for (const [rarity, { count, cost }] of Object.entries(lootData.shop_chances)) {
      const amount = Math.floor(Math.random() * (count[1] - count[0] + 1)) + count[0];
      if (amount === 0) continue;
      output += `<h3>${rarity.toUpperCase()} ITEMS (${amount})</h3>`;
      for (let i = 0; i < amount; i++) {
        const item = resolveItemDetails(lootData.magic_item[type][rarity][Math.floor(Math.random() * lootData.magic_item[type][rarity].length)]);
        const price = Math.floor(Math.random() * (cost[1] - cost[0])) + cost[0];
        output += `${item} — ${rarity} — ${price} gp<br>`;
      }
    }
    return output;
  }
}

document.addEventListener("DOMContentLoaded", () => {

  const generatorType = document.getElementById("generatorType");
  const shopTypes = document.getElementById("shopTypes");
  const magicLevelContainer = document.getElementById("magicLevelContainer");
  const tierSelector = document.getElementById("tierSelector");

  function updateGeneratorUI() {
    const type = generatorType.value;
    if (type === "shop") {
      shopTypes.style.display = "block";
      magicLevelContainer.style.display = "block";
      tierSelector.style.display = "none";
    } else {
      shopTypes.style.display = "none";
      magicLevelContainer.style.display = "none";
      tierSelector.style.display = "block";
    }
  }

  updateGeneratorUI();
  generatorType.addEventListener("change", updateGeneratorUI);

  loadData().then(() => {
    console.log("Treasure data loaded.");
  });

  // Generate button
  const generateBtn = document.getElementById("generateBtn");
  const output = document.getElementById("output");

  generateBtn.addEventListener("click", () => {
    if (!lootDataLoaded) {
      output.innerHTML = "Data still loading...";
      return;
    }

    const type = generatorType.value;
    let result = "";

    if (type === "shop") {
      const magicLevel = document.getElementById("magicLevel").value;
      const shopType = document.getElementById("types").value;
      result = generateMagicShop(magicLevel, shopType);
    } else {
      const tier = document.getElementById("tier").value;
      result = generateTreasure(type, tier);
    }

    output.innerHTML = result;
  });

  // === ITEM SEARCH ===
  const itemSearchInput = document.getElementById("itemSearch");
  const itemSearchResults = document.getElementById("itemSearchResults");

  function buildSearchIndex() {
    const index = [];
    const allShopTypes = Object.keys(lootData.magic_item);
    const allRarities = ["common", "uncommon", "rare", "veryRare", "legendary"];

    for (const shopType of allShopTypes) {
      for (const rarity of allRarities) {
        const items = lootData.magic_item[shopType]?.[rarity];
        if (!Array.isArray(items)) continue;
        for (const item of items) {
          if (!item?.name) continue;
          const key = `${item.name}__${rarity}`;
          if (!index.find(e => e._key === key)) {
            index.push({
              _key: key,
              name: item.name,
              rarity,
              cost: item.cost ?? 0,
            });
          }
        }
      }
    }

    index.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
    return index;
  }

  let searchIndex = null;

  function runSearch() {
    const query = itemSearchInput.value.trim().toLowerCase();
    const currentLevel = document.getElementById("magicLevel").value || "mid";

    if (!query) {
      itemSearchResults.innerHTML = "";
      return;
    }

    if (!searchIndex) {
      if (!lootData.magic_item || Object.keys(lootData.magic_item).length === 0) {
        itemSearchResults.innerHTML = "<em>Still loading data…</em>";
        return;
      }
      searchIndex = buildSearchIndex();
    }

    const matches = searchIndex.filter(e =>
      e.name.toLowerCase().includes(query)
    );

    if (matches.length === 0) {
      itemSearchResults.innerHTML = `<em style="opacity:0.6;">No items found.</em>`;
      return;
    }

    itemSearchResults.innerHTML = matches.map(e => {
      const color = rarityColors[e.rarity] ?? "#ccc";
      const label = rarityLabels[e.rarity] ?? e.rarity;
      const multiplier = lootData.shop_chances[currentLevel]?.[e.rarity] ?? 1;
      const base = e.cost * multiplier;
      const low = (base * 0.95).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const high = (base * 1.05).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      return `
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 5px 0;
          border-bottom: 1px solid rgba(128,128,128,0.15);
          gap: 8px;
        ">
          <span style="flex: 1; font-size: 0.88em;">${e.name}</span>
          <span style="
            font-size: 0.72em;
            color: ${color};
            white-space: nowrap;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          ">${label}</span>
          <span style="
            white-space: nowrap;
            font-size: 0.88em;
            opacity: 0.6;
          ">BASE: ${e.cost.toLocaleString()} gp</span>
          <span style="
  white-space: nowrap;
  font-size: 0.88em;
  font-weight: 600;
  color: ${color};
">PRICE: ${low} – ${high} gp</span>
        </div>`;
    }).join("");
  }

  itemSearchInput.addEventListener("input", runSearch);

  document.getElementById("magicLevel").addEventListener("change", () => {
    if (itemSearchInput.value.trim()) {
      runSearch();
    }
  });

});