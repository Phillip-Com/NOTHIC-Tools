// Section 1: Global Data Arrays
const racesSummary = {
  phb: ["Dragonborn", "Dwarf", "Elf", "Gnome", "Half-Elf", "Halfling", "Half-Orc", "Human", "Tiefling"],
  mpmm: ["Aasimar", "Aarakocra", "Bugbear", "Centaur", "Firbolg", "Genasi", "Goblin", "Goliath", "Hobgoblin", "Kenku", "Kobold", "Lizardfolk", "Orc", "Pixie", "Satyr", "Sprite", "Tabaxi", "Tortle", "Yuan-ti Pureblood", "Triton"],
  misc: ["Drathunine", "Gnoll", "Half-Cyclops", "Loxodon", "Quickling", "Undead", "Warforged"],
  undead: ["Ghost", "Ghoul", "Skeleton", "Specter", "Vampire", "Zombie"]
}

const REGION_DISPLAY_NAMES = {
    Random: "Random",
    Empire: "Empire",
    SummerIsle: "Summer Isle",
    Neshiustein: "Neshiustein",
    CarponIsles: "Carpon Isles",
    Sherus: "Sherus",
    Drustein: "Drustein",
    Whiteberg: "Whiteberg",
    Sundermark: "Sundermark"
};



const regionRaceData = {
  Random: {
    phb: {
      dragonborn: 0.0,
      dwarf: 0.0,
      elf: 0.0,
      gnome: 0.0,
      halfelf: 0.0,
      halfling: 0.0,
      halforc: 0.0,
      human: 0.0,
      tiefling: 0.0
    },
    mpmm: {
      aarakocra: 0.0,
      aasimar: 0.0,
      bugbear: 0.0,
      centaur: 0.0,
      firbolg: 0.0,
      genasi: 0.0,
      goblin: 0.0,
      goliath: 0.0,
      hobgoblin: 0.0,
      kenku: 0.0,
      kobold: 0.0,
      lizardfolk: 0.0,
      orc: 0.0,
      pixie: 0.0,
      satyr: 0.0,
      sprite: 0.0,
      tabaxi: 0.0,
      tortle: 0.0,
      triton: 0.0,
      yuanti: 0.0
    },
    misc: {
      drathunine: 0.0,
      gnoll: 0.0,
      halfcyclops: 0.0,
      loxodon: 0.0,
      quickling: 0.0,
      warforged: 0.0
    },
    undead: {
      ghost: 0.0,
      ghoul: 0.0,
      skeleton: 0.0,
      specter: 0.0,
      vampire: 0.0,
      zombie: 0.0
    }
  },
  Empire: {
    phb: {
      dragonborn: 3.0,
      dwarf: 12.0,
      elf: 10.0,
      gnome: 3.0,
      halfelf: 3.0,
      halfling: 5.0,
      halforc: 0.2,
      human: 37.0,
      tiefling: 1.1
    },
    mpmm: {
      aarakocra: 0.2,
      aasimar: 0.4,
      bugbear: 0.2,
      centaur: 2.3,
      firbolg: 3.0,
      genasi: 1.0,
      goblin: 0.6,
      goliath: 3.0,
      hobgoblin: 0.4,
      kenku: 1.0,
      kobold: 0.7,
      lizardfolk: 0.1,
      orc: 1.34,
      pixie: 0.1,
      satyr: 0.1,
      sprite: 0.1,
      tabaxi: 3.0,
      tortle: 2.0,
      triton: 0.8,
      yuantipureblood: 0.3
    },
    misc: {
      drathunine: 2.0,
      Gnoll: 0.3,
      halfcyclops: 0.1,
      loxodon: 1.0,
      quickling: 0.1,
      warforged: 1.5
    },
    undead: {
      ghost: 0.01,
      ghoul: 0.01,
      skeleton: 0.01,
      specter: 0.01,
      vampire: 0.01,
      zombie: 0.01,
    }
  },
  SummerIsle: {
    phb: {
      dragonborn: 6.0,
      dwarf: 8.0,
      elf: 5.0,
      gnome: 3.0,
      halfelf: 3.0,
      halfling: 3.0,
      halforc: 4.0,
      human: 15.0,
      tiefling: 6.0
    },
    mpmm: {
      aarakocra: 3.0,
      aasimar: 0.02,
      bugbear: 0.6,
      centaur: 0.6,
      firbolg: 1.0,
      genasi: 1.0,
      goblin: 2.0,
      goliath: 2.0,
      hobgoblin: 1.0,
      kenku: 1.0,
      kobold: 8.0,
      lizardfolk: 2.0,
      orc: 6.0,
      pixie: 0.01,
      satyr: 0.01,
      sprite: 0.01,
      tabaxi: 8.0,
      tortle: 2.0,
      triton: 0.01,
      yuantipureblood: 2.0
    },
    misc: {
      drathunine: 0.2,
      gnoll: 0.4,
      halfcyclops: 0.06,
      loxodon: 6.0,
      quickling: 0.01,
      warforged: 0.01
    },
    undead: {
      ghost: 0.01,
      ghoul: 0.01,
      skeleton: 0.01,
      specter: 0.01,
      vampire: 0.01,
      zombie: 0.01,
    }
  },
  Neshiustein: {
    phb: {
      dragonborn: 1.0,
      dwarf: 10.0,
      elf: 5.0,
      gnome: 5.0,
      halfelf: 7.0,
      halfling: 10.0,
      halforc: 5.0,
      human: 30.0,
      tiefling: 2.67
    },
    mpmm: {
      aarakocra: 2.0,
      aasimar: 0.01,
      bugbear: 0.01,
      centaur: 0.01,
      firbolg: 5.0,
      genasi: 1.0,
      goblin: 0.04,
      goliath: 2.0,
      hobgoblin: 0.4,
      kenku: 1.0,
      kobold: 2.0,
      lizardfolk: 0.1,
      orc: 1.5,
      pixie: 0.01,
      satyr: 0.03,
      sprite: 0.01,
      tabaxi: 3.0,
      tortle: 2.0,
      triton: 0.2,
      yuantipureblood: 0.2
    },
    misc: {
      drathunine: 0.08,
      Gnoll: 0.01,
      halfcyclops: 0.01,
      loxodon: 0.2,
      quickling: 0.01,
      warforged: 0.5
    },
    undead: {
      ghost: 0.5,
      ghoul: 0.5,
      skeleton: 0.5,
      specter: 0.5,
      vampire: 0.5,
      zombie: 0.5
    }
  },
  CarponIsles: {
    phb: {
      dragonborn: 3.0,
      dwarf: 4.0,
      elf: 8.0,
      gnome: 2.0,
      halfelf: 7.0,
      halfling: 5.0,
      halforc: 3.0,
      human: 20.0,
      tiefling: 6.0
    },
    mpmm: {
      aarakocra: 5.0,
      aasimar: 0.01,
      bugbear: 0.0,
      centaur: 0.0,
      firbolg: 3.0,
      genasi: 2.8,
      goblin: 2.6,
      goliath: 4.4,
      hobgoblin: 1.3,
      kenku: 2.0,
      kobold: 0.3,
      lizardfolk: 3.0,
      orc: 2.0,
      pixie: 0.0,
      satyr: 0.0,
      sprite: 0.0,
      tabaxi: 3.0,
      tortle: 3.0,
      triton: 6.0,
      yuantipureblood: 1.0
    },
    misc: {
      drathunine: 0.4,
      gnoll: 0.1,
      halfcyclops: 0.01,
      loxodon: 0.02,
      quickling: 0.0,
      warforged: 2.0
    },
    undead: {
      ghost: 0.01,
      ghoul: 0.01,
      skeleton: 0.01,
      specter: 0.01,
      vampire: 0.01,
      zombie: 0.01,
    }
  },
  Sherus: {
    phb: {
      dragonborn: 4.0,
      dwarf: 20.0,
      elf: 12.0,
      gnome: 1.0,
      halfelf: 8.0,
      halfling: 2.0,
      halforc: 1.0,
      human: 18.0,
      tiefling: 2.0
    },
    mpmm: {
      aarakocra: 6.0,
      aasimar: 0.04,
      bugbear: 0.03,
      centaur: 0.0,
      firbolg: 3.0,
      genasi: 2.6,
      goblin: 0.6,
      goliath: 6.0,
      hobgoblin: 0.4,
      kenku: 1.0,
      kobold: 0.4,
      lizardfolk: 1.0,
      orc: 1.5,
      pixie: 0.02,
      satyr: 0.02,
      sprite: 0.02,
      tabaxi: 3.0,
      tortle: 1.0,
      triton: 1.0,
      yuantipureblood: 1.0
    },
    misc: {
      drathunine: 1.0,
      gnoll: 0.1,
      halfcyclops: 0.1,
      loxodon: 0.1,
      quickling: 0.01,
      warforged: 2.0
    },
    undead: {
      ghost: 0.01,
      ghoul: 0.01,
      skeleton: 0.01,
      specter: 0.01,
      vampire: 0.01,
      zombie: 0.01,
    }
  },
  Drustein: {
    phb: {
      dragonborn: 2.0,
      dwarf: 5.0,
      elf: 5.0,
      gnome: 12.0,
      halfelf: 2.0,
      halfling: 10.0,
      halforc: 1.0,
      human: 20.0,
      tiefling: 6.0
    },
    mpmm: {
      aarakocra: 2.0,
      aasimar: 0.04,
      bugbear: 0.0,
      centaur: 0.0,
      firbolg: 6.0,
      genasi: 4.0,
      goblin: 2.0,
      goliath: 1.0,
      hobgoblin: 0.4,
      kenku: 3.0,
      kobold: 0.1,
      lizardfolk: 0.01,
      orc: 1.0,
      pixie: 0.01,
      satyr: 0.1,
      sprite: 0.01,
      tabaxi: 4.0,
      tortle: 4.0,
      triton: 4.0,
      yuantipureblood: 0.1
    },
    misc: {
      drathunine: 2.0,
      gnoll: 0.1,
      halfcyclops: 0.0,
      loxodon: 0.0,
      quickling: 0.1,
      warforged: 3.0
    },
    undead: {
      ghost: 0.01,
      ghoul: 0.0,
      skeleton: 0.0,
      specter: 0.01,
      vampire: 0.01,
      zombie: 0.0
    }
  },
  Whiteberg: {
    phb: {
      dragonborn: 6.0,
      dwarf: 20.0,
      elf: 2.0,
      gnome: 2.0,
      halfelf: 1.0,
      halfling: 4.0,
      halforc: 5.0,
      human: 20.0,
      tiefling: 1.0
    },
    mpmm: {
      aarakocra: 2.0,
      aasimar: 0.0,
      bugbear: 0.0,
      centaur: 0.0,
      firbolg: 1.0,
      genasi: 4.0,
      goblin: 3.0,
      goliath: 5.0,
      hobgoblin: 4.0,
      kenku: 0.0,
      kobold: 0.1,
      lizardfolk: 2.6,
      orc: 4.0,
      pixie: 0.0,
      satyr: 0.0,
      sprite: 0.0,
      tabaxi: 1.0,
      tortle: 1.0,
      triton: 1.0,
      yuantipureblood: 0.2
    },
    misc: {
      drathunine: 2.0,
      gnoll: 0.1,
      halfcyclops: 2.0,
      loxodon: 4.0,
      quickling: 0.0,
      warforged: 2.0
    },
    undead: {
      ghost: 0.0,
      ghoul: 0.0,
      skeleton: 0.0,
      specter: 0.0,
      vampire: 0.0,
      zombie: 0.0,
    }
  },
  Sundermark: {
    phb: {
      dragonborn: 1.0,
      dwarf: 5.0,
      elf: 20.0,
      gnome: 4.0,
      halfelf: 10.0,
      halfling: 2.0,
      halforc: 1.0,
      human: 20.0,
      tiefling: 5.0
    },
    mpmm: {
      aarakocra: 4.0,
      aasimar: 0.1,
      bugbear: 0.0,
      centaur: 0.0,
      firbolg: 4.0,
      genasi: 2.0,
      goblin: 0.2,
      goliath: 2.0,
      hobgoblin: 0.1,
      kenku: 2.0,
      kobold: 0.1,
      lizardfolk: 0.1,
      orc: 0.2,
      pixie: 0.4,
      satyr: 0.5,
      sprite: 0.5,
      tabaxi: 5.0,
      tortle: 2.0,
      triton: 1.0,
      yuantipureblood: 1.0
    },
    misc: {
      drathunine: 0.2,
      gnoll: 0.1,
      halfcyclops: 0.0,
      loxodon: 0.0,
      quickling: 0.5,
      warforged: 6.0
    },
    undead: {
      ghost: 0.0,
      ghoul: 0.0,
      skeleton: 0.0,
      specter: 0.0,
      vampire: 0.0,
      zombie: 0.0
    }
  }
}

const BUILTIN_REGIONS = Object.keys(regionRaceData);

let nameData = {};

fetch("data/names.json")
  .then(r => r.json())
  .then(data => {
    nameData = data;
    populateNameTypeDropdown();
  });

async function loadNames() {
  try {
    const files = [
      "imperial",
      "sherus",
      "drustein",
      "whiteberg",
      "sundermark"
    ];

    for (const file of files) {
      const data = await fetch(`data/names/${file}.json`).then(res => res.json());

      nameData[file] = data;
    }

    console.log("All names loaded.");
  } catch (error) {
    console.error("Error loading name data:", error);
  }
}

async function getCulture(culture) {
  culture = culture.toLowerCase();

  const response = await fetch(`data/names.json`);

  if (!response.ok) {
    throw new Error(`Error fetching names.json`);
  }

  const data = await response.json();

  if (!data[culture]) {
    throw new Error(`Culture not found: ${culture}`);
  }

  return data[culture];
}

function prettyName(key) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
}

function populateNameTypeDropdown() {
  const select = document.getElementById("customNameType");
  if (!select) return;

  select.innerHTML = "";

  select.appendChild(
    new Option("Region Default", "Any")
  );

  Object.keys(nameData).forEach(region => {
  select.appendChild(
    new Option(prettyName(region), region)
  );
});
}

function populateRegionDropdown() {
    const select = document.getElementById("region");

    if (!select) return;

    select.innerHTML = "";

    const allRegions = getAllRegions();

    Object.keys(allRegions).forEach(regionName => {
        const option = document.createElement("option");

        option.value = regionName;

        option.textContent =
            REGION_DISPLAY_NAMES[regionName] ||
            regionName;

        select.appendChild(option);
    });
}

function getAllRegions() {
    return {
        ...regionRaceData,
        ...(window.userData.npcGenerator.customRegions || {})
    };
}

function saveCustomRegion(regionName) {
  if (BUILTIN_REGIONS.includes(regionName)) {
    alert("Cannot overwrite built-in regions.");
    return;
  }

  if (!regionName) return;

  if (!window.userData.npcGenerator.customRegions) {
    window.userData.npcGenerator.customRegions = {};
  }

  window.userData.npcGenerator.customRegions[regionName] =
    collectCurrentRegionData();

  saveUserData();

  populateRegionDropdown();
}

function cloneRegion(regionName) {
    const source = structuredClone(
        getAllRegions()[regionName]
    );

    return source;
}

function deleteCustomRegion(regionName) {
  if (!regionName) return;

  if (!window.userData.npcGenerator.customRegions?.[regionName]) {
    alert("Only custom regions can be deleted.");
    return;
  }

  if (
      !window.confirm(
        `Delete custom region "${regionName}"?`
      )
    ) {
      return;
    }

  delete window.userData.npcGenerator.customRegions[regionName];

  saveUserData();

  populateRegionDropdown();

  regionSelect.value = "Random";
  applyRegionData("Random");
  recalculateRaceChances();
}

// ---------------------------
// Weighted Random Function
// ---------------------------
function weightedRandom(items, weights) {
  // Filter out zero-weight items
  const valid = items.map((item, i) => ({ item, weight: weights[i] }))
    .filter(entry => entry.weight > 0);

  if (valid.length === 0) {
    // Fallback: pick any item randomly if all weights are 0
    return items[Math.floor(Math.random() * items.length)];
  }

  const total = valid.reduce((sum, entry) => sum + entry.weight, 0);
  let rand = Math.random() * total;

  for (let entry of valid) {
    if (rand < entry.weight) return entry.item;
    rand -= entry.weight;
  }

  // Safety fallback
  return valid[valid.length - 1].item;
}

function getRegionWeights(region) {
  let weights;

  switch (region) {
    case "Empire":
      weights = racesEmpire;
      break;
    case "SummerIsle":
      weights = racesSummerIsle;
      break;
    case "Neshiustein":
      weights = racesNeshiustein;
      break;
    case "CarponIsles":
      weights = racesCarponIsles;
      break;
    case "Sherus":
      weights = racesSherus;
      break;
    case "Drustein":
      weights = racesDrustein;
      break;
    case "Whiteberg":
      weights = racesWhiteberg;
      break;
    case "Sundermark":
      weights = racesSundermark;
      break;
    default:
      weights = races1.map(_ => 1); // equal chance for all races
  }

  // convert array to object: race name → weight
  const racePercentages = {};
  races1.forEach((race, i) => racePercentages[race] = weights[i]);
  return racePercentages;
}

// Stats generator
function abilities(background) {
  let rolledStats = [];

  for (let i = 0; i < 6; i++) {
    let rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);

    let ones = 0;
    for (let r of rolls) {
      if (r === 1) ones++;
    }

    if (ones >= 2) {
      let idx = rolls.findIndex(r => r === 1);
      rolls[idx] = Math.floor(Math.random() * 6) + 1;
    }

    rolls.sort((a, b) => a - b);
    rolls.shift();


    rolledStats.push(rolls[0] + rolls[1] + rolls[2]);
  }
  const backgroundMods = {
    acolyte: [3, 4, 5],
    artisan: [0, 1, 3],
    charlatan: [1, 2, 5],
    criminal: [1, 2, 3],
    entertainer: [0, 1, 5],
    farmer: [0, 2, 4],
    guard: [0, 3, 4],
    guide: [1, 2, 4],
    hermit: [2, 4, 5],
    merchant: [2, 3, 5],
    noble: [0, 3, 5],
    sage: [2, 3, 4],
    sailor: [0, 1, 4],
    scribe: [1, 3, 4],
    soldier: [0, 1, 2],
    wayfarer: [1, 4, 5]
  };
  console.log("Background:", background);
  const mods = backgroundMods[background.toLowerCase()];

  let spread = Math.floor(Math.random() * 2) + 1;

  if (spread == 1) {
    rolledStats[mods[0]] += " + 1";
    rolledStats[mods[1]] += " + 1";
    rolledStats[mods[2]] += " + 1";
  }
  else {
    let first = Math.floor(Math.random() * 3);
    let second = Math.floor(Math.random() * 3);
    do {
      second = Math.floor(Math.random() * 3);
    } while (first == second)
    rolledStats[mods[first]] += " + 1";
    rolledStats[mods[second]] += " + 2";
  }

  return rolledStats;
}

// Name generator
function randomFrom(array) {
  if (!array || array.length === 0) return "";
  return array[Math.floor(Math.random() * array.length)];
}

async function names(region) {
  region = region.replace(/\s/g, ""); 

  const regionMap = {
    Empire: "imperial",
    SummerIsle: "imperial",
    Neshiustein: "imperial",
    CarponIsles: "imperial",
    Sherus: "sherus",
    Drustein: "drustein",
    Whiteberg: "whiteberg",
    Sundermark: "sundermark"
  };

  if (region === "Random") {
    const options = Object.values(regionMap);
    region = randomFrom(options);
  } else {
    region = regionMap[region];
  }

  const data = await getCulture(region);

  return `${randomFrom(data.firstName)} ${randomFrom(data.lastName)}`;
}

// Alignment generator
function alignments() {
  const randomNumber = Math.floor(Math.random() * 9) + 1;
  let alignment = "";

  switch (randomNumber) {
    case 1:
      alignment = "Lawful Good";
      break;
    case 2:
      alignment = "Neutral Good";
      break;
    case 3:
      alignment = "Chaotic Good";
      break;
    case 4:
      alignment = "Lawful Neutral";
      break;
    case 5:
      alignment = "Neutral";
      break;
    case 6:
      alignment = "Chaotic Neutral";
      break;
    case 7:
      alignment = "Lawful Evil";
      break;
    case 8:
      alignment = "Neutral Evil";
      break;
    case 9:
      alignment = "Chaotic Evil";
      break;
  }

  return alignment;
}

// Background Generator
function getCheckedBackgrounds() {
  const all = Array.from(
    document.querySelectorAll('.background-grid input[type="checkbox"][data-bg]')
  );

  const checked = all.filter(cb => cb.checked);

  const source = checked.length ? checked : all;

  return source.map(cb => cb.dataset.bg);
}

function backGround() {
  const backgrounds = getCheckedBackgrounds();
  console.log("TESTING", backgrounds);
  return backgrounds.length
    ? backgrounds[Math.floor(Math.random() * backgrounds.length)]
    : null;
}

function generateBackgroundProfile(background, alignment) {
  const data = backgroundTraits[background.toLowerCase()];

  if (!data) {
    console.error(`Background trait for ${background} not found.`);
    return null;
  }

  const traits = [...data.personalityTraits];

  const trait1 = randomFrom(traits);
  // Remove trait1 from the array to avoid duplicates
  const remainingTraits = traits.filter(trait => trait !== trait1);
  const trait2 = randomFrom(remainingTraits);

  let alignmentKey = "neutral";

  const lowerAlignment = alignment.toLowerCase();

  let idealPool = [];

  if (lowerAlignment.includes("lawful")) {
    idealPool.push(...(data.ideals.lawful || []));
  }

  if (lowerAlignment.includes("chaotic")) {
    idealPool.push(...(data.ideals.chaotic || []));
  }

  if (lowerAlignment.includes("good")) {
    idealPool.push(...(data.ideals.good || []));
  }

  if (lowerAlignment.includes("evil")) {
    idealPool.push(...(data.ideals.evil || []));
  }

  // fallback
  if (idealPool.length === 0) {
    idealPool = data.ideals.neutral || [];
  }

  const ideal = randomFrom(idealPool);

  const bond = randomFrom(data.bonds);
  const flaw = randomFrom(data.flaws);

  return { trait1, trait2, ideal, bond, flaw };
}

const backgroundTraits = {
  acolyte: {
    personalityTraits: [
      "I idolize a particular hero of my faith, and constantly refer to that person's deeds and example.",
      "I can find common ground between the fiercest enemies, empathizing with them and always working toward peace.",
      "I see omens in every event and action.The gods try to speak to us, we just need to listen.",
      "Nothing can shake my optimistic attitude.",
      "I quote(or misquote) sacred texts and proverbs in almost every situation.",
      "I am tolerant(or intolerant) of other faiths and respect(or condemn) the worship of other gods.",
      "I've enjoyed fine food, drink, and high society among my temple's elite.Rough living grates on me.",
      "I've spent so long in the temple that I have little practical experience dealing with people in the outside world."
    ],
    ideals: {
      lawful: ["Tradition. The ancient traditions of worship and sacrifice must be preserved and upheld. (Lawful)",
        "Power. I hope to one day rise to the top of my faith's religious hierarchy. (Lawful)",
        "Faith. I trust that my deity will guide my actions.I have faith that if I work hard, things will go well. (Lawful)",
        "Aspiration. I seek to prove myself worthy of my god's favor by matching my actions against his or her teachings. (Any)"
      ],
      neutral: ["Aspiration. I seek to prove myself worthy of my god's favor by matching my actions against his or her teachings. (Any)",
      ],
      chaotic: ["Change. We must help bring about the changes the gods are constantly working in the world. (Chaotic)",
        "Aspiration. I seek to prove myself worthy of my god's favor by matching my actions against his or her teachings. (Any)",
      ],
      good: ["Charity. I always try to help those in need, no matter what the personal cost. (Good)",
        "Aspiration. I seek to prove myself worthy of my god's favor by matching my actions against his or her teachings. (Any)",
      ],
      evil: ["Aspiration. I seek to prove myself worthy of my god's favor by matching my actions against his or her teachings. (Any)",
      ]
    },
    bonds: ["I would die to recover an ancient relic of my faith that was lost long ago.",
      "I will someday get revenge on the corrupt temple hierarchy who branded me a heretic.",
      "I owe my life to the priest who took me in when my parents died.",
      "Everything I do is for the common people.",
      "I will do anything to protect the temple where I served.",
      "I seek to preserve a sacred text that my enemies consider heretical and seek to destroy.",
    ],
    flaws: ["I judge others harshly, and myself even more severely.",
      "I put too much trust in those who wield power within my temple's hierarchy.",
      "My piety sometimes leads me to blindly trust those that profess faith in my god.",
      "I am inflexible in my thinking.",
      "I am suspicious of strangers and expect the worst of them.",
      "Once I pick a goal, I become obsessed with it to the detriment of everything else in my life.",
    ]
  },
  artisan: {
    personalityTraits: ["I take immense pride in my work and notice craftsmanship everywhere I go.",
      "I cannot resist improving or 'fixing' objects I think are poorly made.",
      "I talk about tools, materials, and technique even when others clearly don't care.",
      "I judge people by the quality of what they create, not their status or words.",
      "I have strong opinions about 'proper' methods and struggle with shortcuts.",
      "I am happiest when I am making something with my hands, even in poor conditions.",
      "I keep scraps, samples, or unfinished projects with me at all times.",
      "I am defensive about criticism, even when it is fair or helpful."
    ],
    ideals: {
      lawful: ["Perfection. True craftsmanship only exists when methods are refined and preserved across generations. (Lawful)",
        "Craft Guilds. The rules and traditions of artisans exist to protect quality and honor. (Lawful)",
      ],
      neutral: ["Mastery. The purpose of life is to refine one's skill to its purest form. (Neutral)",
        "Work. Creation is its own reward, regardless of fame or recognition. (Neutral)",],
      chaotic: ["Innovation. Every object can be improved, and tradition should never limit creativity. (Chaotic)",
        "Expression. A craft is only meaningful if it reflects the freedom of the maker. (Chaotic)",
      ],
      good: ["Service. My craft exists to improve the lives of others, not myself. (Good)",
        "Beauty. The world is better when it is filled with meaningful, well-made things. (Good)",],
      evil: ["Exploitation. Skill is power, and I intend to profit from those who lack it. (Evil)",
        "Control. Whoever controls creation controls society itself. (Evil)",
      ]
    },
    bonds: ["My craft was taught to me by someone I owe everything to, and I will not disgrace their teachings.",
      "A rival artisan once humiliated me, and I will prove their methods inferior.",
      "My greatest work was stolen or destroyed, and I will recover or recreate it.",
      "I am determined to elevate my craft to a level no one has seen before.",
      "I owe a debt to a patron who funded my early work, and I must repay them.",
      "Everything I make is meant to outlast me and preserve my name."
    ],
    flaws: ["I become so focused on perfecting my craft that I ignore everything else around me.",
      "I cannot accept criticism without taking it personally.",
      "I overengineer simple problems because I distrust simple solutions.",
      "I refuse to use or appreciate anything I consider poorly made.",
      "I will go to unreasonable lengths to complete a project, even at personal cost.",
      "I am envious of artisans who are more skilled or recognized than I am."
    ]
  },
  charlatan: {
    personalityTraits: [
      "I fall in and out of love easily, and am always pursuing someone.",
      "I have a joke for every occasion, especially occasions where humor is inappropriate.",
      "Flattery is my preferred trick for getting what I want.",
      "I'm a born gambler who can't resist taking a risk for a potential payoff.",
      "I lie about almost everything, even when there's no good reason to.",
      "Sarcasm and insults are my weapons of choice.",
      "I keep multiple holy symbols on me and invoke whatever deity might come in useful at any given moment.",
      "I pocket anything I see that might have some value."
    ],
    ideals: {
      lawful: ["Fairness. I never target people who can't afford to lose a few coins. (Lawful)",
        "Aspiration. I'm determined to make something of myself. (Any)"],
      neutral: ["Aspiration. I'm determined to make something of myself. (Any)",],
      chaotic: ["Independence. I am a free spirit - no one tells me what to do. (Chaotic)",
        "Creativity. I never run the same con twice. (Chaotic)",
        "Aspiration. I'm determined to make something of myself. (Any)"],
      good: ["Charity. I distribute the money I acquire to the people who really need it. (Good)",
        "Friendship. Material goods come and go. Bonds of friendship last forever. (Good)",
        "Aspiration. I'm determined to make something of myself. (Any)",],
      evil: ["Aspiration. I'm determined to make something of myself. (Any)",
      ]
    },
    bonds: ["I fleeced the wrong person and must work to ensure that this individual never crosses paths with me or those I care about.",
      "I owe everything to my mentor - a horrible person who's probably rotting in jail somewhere.",
      "Somewhere out there, I have a child who doesn't know me. I'm making the world better for him or her.",
      "I come from a noble family, and one day I'll reclaim my lands and title from those who stole them from me.",
      "A powerful person killed someone I love. Some day soon, I'll have my revenge.",
      "I swindled and ruined a person who didn't deserve it. I seek to atone for my misdeeds but might never be able to forgive myself.",
    ],
    flaws: ["I can't resist a pretty face.",
      "I'm always in debt. I spend my ill-gotten gains on decadent luxuries faster than I bring them in.",
      "I'm convinced that no one could ever fool me the way I fool others.",
      "I'm too greedy for my own good. I can't resist taking a risk if there's money involved.",
      "I can't resist swindling people who are more powerful than me.",
      "I hate to admit it and will hate myself for it, but I'll run and preserve my own hide if the going gets tough.",
    ]
  },
  criminal: {
    personalityTraits: ["I always have a plan for what to do when things go wrong.",
      "I am always calm, no matter what the situation.I never raise my voice or let my emotions control me.",
      "The first thing I do in a new place is note the locations of everything valuable - or where such things could be hidden.",
      "I would rather make a new friend than a new enemy.",
      "I am incredibly slow to trust.Those who seem the fairest often have the most to hide.",
      "I don't pay attention to the risks in a situation.Never tell me the odds.",
      "The best way to get me to do something is to tell me I can't do it.",
      "I blow up at the slightest insult."
    ],
    ideals: {
      lawful: ["Honor. I don't steal from others in the trade. (Lawful)"],
      neutral: ["People. I'm loyal to my friends, not to any ideals, and everyone else can take a trip down the Styx for all I care. (Neutral)",
      ],
      chaotic: ["Freedom. Chains are meant to be broken, as are those who would forge them. (Chaotic)",
      ],
      good: ["Charity. I steal from the wealthy so that I can help people in need. (Good)",
        "Redemption. There's a spark of good in everyone. (Good)",
      ],
      evil: ["Greed. I will do whatever it takes to become wealthy. (Evil)",]
    },
    bonds: ["I'm trying to pay off an old debt I owe to a generous benefactor.",
      "My ill-gotten gains go to support my family.",
      "Something important was taken from me, and I aim to steal it back.",
      "I will become the greatest thief that ever lived.",
      "I'm guilty of a terrible crime. I hope I can redeem myself for it.",
      "Someone I loved died because of a mistake I made. That will never happen again.",
    ],
    flaws: ["When I see something valuable, I can't think about anything but how to steal it.",
      "When faced with a choice between money and my friends, I usually choose the money.",
      "If there's a plan, I'll forget it. If I don't forget it, I'll ignore it.",
      "I have a *tell* that reveals when I'm lying.",
      "I turn tail and run when things look bad.",
      "An innocent person is in prison for a crime that I committed. I'm okay with that.",
    ]
  },
  entertainer: {
    personalityTraits: ["I know a story relevant to almost every situation.",
      "Whenever I come to a new place, I collect local rumors and spread gossip.",
      "I'm a hopeless romantic, always searching for that *special someone.*",
      "Nobody stays angry at me or around me for long, since I can defuse any amount of tension.",
      "I love a good insult, even one directed at me.",
      "I get bitter if I'm not the center of attention.",
      "I'll settle for nothing less than perfection.",
      "I change my mood or my mind as quickly as I change key in a song."],
    ideals: {
      lawful: ["Tradition. The stories, legends, and songs of the past must never be forgotten, for they teach us who we are. (Lawful)",
        "Honesty. Art should reflect the soul; it should come from within and reveal who we really are. (Any)",
      ],
      neutral: ["People. I like seeing the smiles on people's faces when I perform. That's all that matters. (Neutral)",
        "Honesty. Art should reflect the soul; it should come from within and reveal who we really are. (Any)",
      ],
      chaotic: ["Creativity. The world is in need of new ideas and bold action. (Chaotic)",
        "Honesty. Art should reflect the soul; it should come from within and reveal who we really are. (Any)",
      ],
      good: ["Beauty. When I perform, I make the world better than it was. (Good)",
        "Honesty. Art should reflect the soul; it should come from within and reveal who we really are. (Any)",
      ],
      evil: ["Greed. I'm only in it for the money and fame. (Evil)",
        "Honesty. Art should reflect the soul; it should come from within and reveal who we really are. (Any)",
      ]
    },
    bonds: ["My instrument is my most treasured possession, and it reminds me of someone I love.",
      "Someone stole my precious instrument, and someday I'll get it back.",
      "I want to be famous, whatever it takes.",
      "I idolize a hero of the old tales and measure my deeds against that person's.",
      "I will do anything to prove myself superior to my hated rival.",
      "I would do anything for the other members of my old troupe.",
    ],
    flaws: ["I'll do anything to win fame and renown.",
      "I'm a sucker for a pretty face.",
      "A scandal prevents me from ever going home again. That kind of trouble seems to follow me around.",
      "I once satirized a noble who still wants my head. It was a mistake that I will likely repeat.",
      "I have trouble keeping my true feelings hidden. My sharp tongue lands me in trouble.",
      "Despite my best efforts, I am unreliable to my friends.",
    ]
  },
  farmer: {
    personalityTraits: ["I notice weather, soil, and seasons more than most people.",
      "I am patient and steady, but slow to trust unfamiliar ideas.",
      "I dislike waste and feel uneasy when resources are not used carefully.",
      "I treat animals with respect and often understand them better than people.",
      "I prefer simple solutions and distrust overly complicated plans.",
      "I can work long hours without complaint, even in harsh conditions.",
      "I carry a quiet pride in surviving honest, difficult work.",
      "I sometimes underestimate dangers outside of rural life."],
    ideals: {
      lawful: ["Tradition. The rhythms of planting and harvest are older than any kingdom. (Lawful)",
        "Stability. Order in nature and society keeps life predictable and safe. (Lawful)",
      ],
      neutral: ["Balance. Life is about taking only what the land can give in return. (Neutral)",
        "Endurance. Survival matters more than ideals or ambition. (Neutral)",
      ],
      chaotic: ["Freedom. The land belongs to no lord or law, only those who work it. (Chaotic)",
        "Change. Seasons shift, and so must we—nothing should remain rigid. (Chaotic)"],
      good: ["Community. No one should go hungry while others have enough. (Good)",
        "Care. The land, animals, and people are all worth protecting. (Good)",],
      evil: ["Possession. The land exists to serve those strong enough to claim it. (Evil)",
        "Survival. Only I and mine matter when resources are scarce. (Evil)",
      ]
    },
    bonds: ["My family’s land is everything to me, and I will protect it at any cost.",
      "A bad harvest or disaster nearly destroyed my home once, and I fear it happening again.",
      "I owe my survival to neighbors who helped me in hard times.",
      "I will ensure my family never has to suffer the hunger I once knew.",
      "Someone powerful tried to take my land, and I will make sure it never happens again.",
      "I believe the land itself is sacred and must be respected and preserved."
    ],
    flaws: ["I am stubborn to a fault and resist change even when it is clearly needed.",
      "I distrust outsiders and assume they do not understand real work.",
      "I refuse to waste anything, even when it would be practical to do so.",
      "I underestimate threats that are not immediate or physical.",
      "I am slow to adapt to unfamiliar situations or environments.",
      "I carry grudges for a very long time."
    ]
  },
  guard: {
    personalityTraits: ["I am always alert to exits, threats, and unusual behavior in a room.",
      "I instinctively place myself between danger and others.",
      "I respect authority structures, even when I disagree with them.",
      "I am slow to trust strangers but quick to assess their intent.",
      "I take rules seriously and expect others to do the same.",
      "I remain calm under pressure and rarely panic.",
      "I have trouble turning off my 'watchful' mindset, even when off duty.",
      "I assume problems will escalate unless actively controlled."],
    ideals: {
      lawful: ["Order. Without rules, society collapses into chaos and suffering. (Lawful)",
        "Duty. I exist to uphold structure, not question it. (Lawful)"],
      neutral: ["Balance. My duty is to protect people, not systems. (Neutral)",
        "Stability. Peace matters more than who enforces it. (Neutral)",
      ],
      chaotic: ["Judgment. Rules mean nothing without context and conscience. (Chaotic)",
        "Reform. Power must be challenged when it becomes unjust. (Chaotic)"],
      good: ["Protection. I exist to shield the innocent, no matter the cost. (Good)",
        "Mercy. Even criminals deserve fairness and restraint. (Good)",],
      evil: ["Control. Fear is the most effective form of order. (Evil)",
        "Power. Authority is only meaningful when it cannot be challenged. (Evil)",
      ]
    },
    bonds: ["I failed to protect someone I was sworn to defend, and I will never let it happen again.",
      "My oath of service means everything to me, even above my personal life.",
      "I am loyal to the people I was assigned to protect, even if I no longer serve them.",
      "A criminal I let escape still haunts me, and I seek to correct my mistake.",
      "I believe order must be maintained, even when it is unpopular or difficult.",
      "Someone I once protected saved my life in return, and I owe them everything."
    ],
    flaws: ["I assume authority is always correct, even when evidence suggests otherwise.",
      "I hesitate to act without explicit orders, even in emergencies.",
      "I see threats where there may be none and sometimes overreact.",
      "I struggle to trust people who do not follow rules or structure.",
      "I prioritize duty over compassion, even when it causes harm.",
      "I take failure personally and have difficulty moving past it."
    ]
  },
  guide: {
    personalityTraits: ["I pay close attention to landmarks, paths, and subtle environmental changes.",
      "I am uncomfortable staying in one place for too long.",
      "I prefer to lead from the front when traveling unfamiliar territory.",
      "I am good at reading people’s moods and physical limits.",
      "I tend to underplay dangers to keep others calm.",
      "I feel responsible for anyone traveling under my care.",
      "I am restless when I do not have a destination in mind.",
      "I remember routes and terrain better than names or faces."],
    ideals: {
      lawful: ["Reliability. A guide must never break trust or abandon responsibility. (Lawful)",
        "Structure. Safe travel depends on rules and preparation. (Lawful)"],
      neutral: ["Survival. Getting through the journey matters more than philosophy. (Neutral)",
        "Pragmatism. The best path is the one that works. (Neutral)",
      ],
      chaotic: ["Freedom. No path should be owned or restricted. (Chaotic)",
        "Discovery. The world is meant to be explored, not controlled. (Chaotic)"],
      good: ["Protection. No traveler under my care will be left behind. (Good)",
        "Guidance. Helping others find their way is a moral duty. (Good)",],
      evil: ["Exploitation. Travelers are resources to be used or abandoned. (Evil)",
        "Dominion. Those who control the route control everything. (Evil)",
      ]
    },
    bonds: ["I once lost travelers under my care, and I will never let it happen again.",
      "There is a route or destination I am determined to reach no matter the danger.",
      "I owe my life to someone who showed me how to survive the wilds.",
      "I am searching for a lost place that only I remember the way to.",
      "I feel responsible for anyone who chooses to travel with me.",
      "I believe every journey has meaning, even if others do not understand it."
    ],
    flaws: ["I become reckless when I think I know the safest path.",
      "I struggle to admit when I am lost or uncertain.",
      "I underestimate dangers that are familiar to me.",
      "I sometimes prioritize reaching a destination over the safety of those with me.",
      "I resist abandoning a route or plan even when it is clearly failing.",
      "I carry guilt for every traveler I could not protect."
    ]
  },
  hermit: {
    personalityTraits: ["I've been isolated for so long that I rarely speak, preferring gestures and the occasional grunt.",
      "I am utterly serene, even in the face of disaster.",
      "The leader of my community had something wise to say on every topic, and I am eager to share that wisdom.",
      "I feel tremendous empathy for all who suffer.",
      "I'm oblivious to etiquette and social expectations.",
      "I connect everything that happens to me to a grand, cosmic plan.",
      "I often get lost in my own thoughts and contemplation, becoming oblivious to my surroundings.",
      "I am working on a grand philosophical theory and love sharing my ideas."],
    ideals: {
      lawful: ["Logic. Emotions must not cloud our sense of what is right and true, or our logical thinking. (Lawful)",
        "Self-Knowledge. If you know yourself, there's nothing left to know. (Any)"],
      neutral: ["Live and Let Live. Meddling in the affairs of others only causes trouble. (Neutral)",
        "Self-Knowledge. If you know yourself, there's nothing left to know. (Any)",
      ],
      chaotic: ["Free Thinking. Inquiry and curiosity are the pillars of progress. (Chaotic)",
        "Self-Knowledge. If you know yourself, there's nothing left to know. (Any)"],
      good: ["Greater Good. My gifts are meant to be shared with all, not used for my own benefit. (Good)",
        "Self-Knowledge. If you know yourself, there's nothing left to know. (Any)",],
      evil: ["Power. Solitude and contemplation are paths toward mystical or magical power. (Evil)",
        "Self-Knowledge. If you know yourself, there's nothing left to know. (Any)",]
    },
    bonds: ["Nothing is more important than the other members of my hermitage, order, or association.",
      "I entered seclusion to hide from the ones who might still be hunting me. I must someday confront them.",
      "I'm still seeking the enlightenment I pursued in my seclusion, and it still eludes me.",
      "I entered seclusion because I loved someone I could not have.",
      "Should my discovery come to light, it could bring ruin to the world.",
      "My isolation gave me great insight into a great evil that only I can destroy.",
    ],
    flaws: ["Now that I've returned to the world, I enjoy its delights a little too much.",
      "I harbor bloodthirsty thoughts that my isolation and meditation failed to quell.",
      "I am dogmatic in my thoughts and philosophy.",
      "I let my need to win arguments overshadow friendships and harmony.",
      "I'd risk too much to uncover a lost bit of knowledge.",
      "I like keeping secrets and won't share them with anyone.",
    ]
  },
  merchant: {
    personalityTraits: ["I am always calculating the value of things, even when I try not to.",
      "I see opportunity in every interaction.",
      "I am friendly and persuasive, but always thinking about leverage.",
      "I hate losing a deal more than I hate losing money.",
      "I collect favors and debts like other people collect coins.",
      "I am suspicious of anything offered without clear cost or expectation.",
      "I can remain calm in negotiations that make others uncomfortable.",
      "I tend to talk too much when trying to convince someone."],
    ideals: {
      lawful: ["Contracts. A deal is sacred and must be honored once struck. (Lawful)",
        "Order. Markets only function when rules are enforced. (Lawful)"],
      neutral: ["Balance. Trade should benefit both sides, or it will fail eventually. (Neutral)",
        "Pragmatism. Value is value, regardless of morality. (Neutral)",
      ],
      chaotic: ["Opportunity. Rules exist to be worked around. (Chaotic)",
        "Risk. Fortune favors those willing to act without permission. (Chaotic)"],
      good: ["Fair Trade. No one should be cheated in a deal. (Good)",
        "Support. Wealth should help lift others out of hardship. (Good)",],
      evil: ["Profit. Everything and everyone has a price. (Evil)",
        "Exploitation. The weak exist to be leveraged. (Evil)",]
    },
    bonds: ["I will restore my family’s fortune and reputation, no matter the cost.",
      "A business rival ruined me, and I intend to surpass and outlast them.",
      "I owe a dangerous creditor a debt I can never fully repay.",
      "I am building something that will secure my legacy for generations.",
      "A deal I made went terribly wrong, and I must fix the consequences.",
      "I believe wealth is the key to protecting the people I care about."
    ],
    flaws: ["I measure everything in terms of profit, even people and relationships.",
      "I cannot resist a deal that seems even slightly advantageous.",
      "I lie easily when it benefits my position.",
      "I am willing to sacrifice long-term trust for short-term gain.",
      "I become anxious when I am not in control of a transaction.",
      "I assume everyone is trying to get the better of me."
    ]
  },
  noble: {
    personalityTraits: ["My eloquent flattery makes everyone I talk to feel like the most wonderful and important person in the world.",
      "The common folk love me for my kindness and generosity.",
      "No one could doubt by looking at my regal bearing that I am a cut above the unwashed masses.",
      "I take great pains to always look my best and follow the latest fashions.",
      "I don't like to get my hands dirty, and I won't be caught dead in unsuitable accommodations.",
      "Despite my noble birth, I do not place myself above other folk.We all have the same blood.",
      "My favor, once lost, is lost forever.",
      "If you do me an injury, I will crush you, ruin your name, and salt your fields."],
    ideals: {
      lawful: ["Responsibility. It is my duty to respect the authority of those above me, just as those below me must respect mine. (Lawful)",
        "Family. Blood runs thicker than water. (Any)"],
      neutral: ["Family. Blood runs thicker than water. (Any)",],
      chaotic: ["Independence. I must prove that I can handle myself without the coddling of my family. (Chaotic)",
        "Family. Blood runs thicker than water. (Any)"],
      good: ["Respect. Respect is due to me because of my position, but all people regardless of station deserve to be treated with dignity. (Good)",
        "Family. Blood runs thicker than water. (Any)",],
      evil: ["Power. If I can attain more power, no one will tell me what to do. (Evil)",
        "Family. Blood runs thicker than water. (Any)",]
    },
    bonds: ["I will face any challenge to win the approval of my family.",
      "My house's alliance with another noble family must be sustained at all costs.",
      "Nothing is more important than the other members of my family.",
      "I am in love with the heir of a family that my family despises.",
      "My loyalty to my sovereign is unwavering.",
      "The common folk must see me as a hero of the people.",
    ],
    flaws: ["I secretly believe that everyone is beneath me.",
      "I hide a truly scandalous secret that could ruin my family forever.",
      "I too often hear veiled insults and threats in every word addressed to me, and I'm quick to anger.",
      "I have an insatiable desire for decadent pleasures.",
      "In fact, the world does revolve around me.",
      "By my words and actions, I often bring shame to my family.",
    ]
  },
  sage: {
    personalityTraits: ["I use polysyllabic words that convey the impression of great erudition",
      "I've read every book in the world's greatest librariess - or I like to boast that I have.",
      "I'm used to helping out those who aren't as smart as I am, and I patiently explain anything and everything to others.",
      "There's nothing I like more than a good mystery.",
      "I'm willing to listen to every side of an argument before I make my own judgment.",
      "I...speak...slowly...when talking...to idiots,...which...almost...everyone...is...compared...to me.",
      "I am horribly, horribly awkward in social situations.",
      "I'm convinced that people are always trying to steal my secrets."],
    ideals: {
      lawful: ["Logic. Emotions must not cloud our logical thinking. (Lawful)",
        "Self-Improvement. The goal of a life of study is the betterment of oneself. (Any)"],
      neutral: ["Knowledge. The path to power and self-improvement is through knowledge. (Neutral)",
        "Self-Improvement. The goal of a life of study is the betterment of oneself. (Any)",
      ],
      chaotic: ["No Limits. Nothing should fetter the infinite possibility inherent in all existence. (Chaotic)",
        "Self-Improvement. The goal of a life of study is the betterment of oneself. (Any)"],
      good: ["Beauty. What is beautiful points us beyond itself toward what is true. (Good)",
        "Self-Improvement. The goal of a life of study is the betterment of oneself. (Any)",],
      evil: ["Power. Knowledge is the path to power and domination. (Evil)",
        "Self-Improvement. The goal of a life of study is the betterment of oneself. (Any)",]
    },
    bonds: ["It is my duty to protect my students.",
      "I have an ancient text that holds terrible secrets that must not fall into the wrong hands.",
      "I work to preserve a library, university, scriptorium, or monastery.",
      "My life's work is a series of tomes related to a specific field of lore.",
      "I've been searching my whole life for the answer to a certain question.",
      "I sold my soul for knowledge. I hope to do great deeds and win it back.",
    ],
    flaws: ["I am easily distracted by the promise of information.",
      "Most people scream and run when they see a demon. I stop and take notes on its anatomy.",
      "Unlocking an ancient mystery is worth the price of a civilization.",
      "I overlook obvious solutions in favor of complicated ones.",
      "I speak without really thinking through my words, invariably insulting others.",
      "I can't keep a secret to save my life, or anyone else's.",
    ]
  },
  sailor: {
    personalityTraits: ["My friends know they can rely on me, no matter what.",
      "I work hard so that I can play hard when the work is done.",
      "I enjoy sailing into new ports and making new friends over a flagon of ale.",
      "I stretch the truth for the sake of a good story.",
      "To me, a tavern brawl is a nice way to get to know a new city.",
      "I never pass up a friendly wager.",
      "My language is as foul as an otyugh nest.",
      "I like a job well done, especially if I can convince someone else to do it."],
    ideals: {
      lawful: ["Fairness. We all do the work, so we all share in the rewards. (Lawful)",
        "Aspiration. Someday I'll own my own ship and chart my own destiny. (Any)",
      ],
      neutral: ["People. I'm committed to my crewmates, not to ideals. (Neutral)",
        "Aspiration. Someday I'll own my own ship and chart my own destiny. (Any)",
      ],
      chaotic: ["Freedom. The sea is freedom - the freedom to go anywhere and do anything. (Chaotic)",
        "Aspiration. Someday I'll own my own ship and chart my own destiny. (Any)"],
      good: ["Respect. The thing that keeps a ship together is mutual respect between captain and crew. (Good)",
        "Aspiration. Someday I'll own my own ship and chart my own destiny. (Any)",],
      evil: ["Mastery. I'm a predator, and the other ships on the sea are my prey. (Evil)",
        "Aspiration. Someday I'll own my own ship and chart my own destiny. (Any)",
      ]
    },
    bonds: ["I'm loyal to my captain first, everything else second.",
      "The ship is most important - crewmates and captains come and go.",
      "I'll always remember my first ship.",
      "In a harbor town, I have a paramour whose eyes nearly stole me from the sea.",
      "I was cheated out of my fair share of the profits, and I want to get my due.",
      "Ruthless pirates murdered my captain and crewmates, plundered our ship, and left me to die. Vengeance will be mine.",
    ],
    flaws: ["I follow orders, even if I think they're wrong.",
      "I'll say anything to avoid having to do extra work.",
      "Once someone questions my courage, I never back down no matter how dangerous the situation.",
      "Once I start drinking, it's hard for me to stop.",
      "I can't help but pocket loose coins and other trinkets I come across.",
      "My pride will probably lead to my destruction.",
    ]
  },
  scribe: {
    personalityTraits: ["I notice inconsistencies, errors, and missing details immediately.",
      "I prefer writing things down rather than relying on memory or speech.",
      "I become frustrated when information is unclear or poorly organized.",
      "I am fascinated by languages, symbols, and codes.",
      "I often correct others' grammar or wording without thinking.",
      "I value accuracy over speed in all things.",
      "I keep meticulous notes on people, places, and events.",
      "I sometimes lose track of the real world while focusing on details."],
    ideals: {
      lawful: ["Truth. Knowledge must be recorded accurately and preserved without distortion. (Lawful)",
        "Order. Information must be organized to be meaningful. (Lawful)",
      ],
      neutral: ["Understanding. Knowledge itself is the highest pursuit. (Neutral)",
        "Preservation. Information should outlast those who record it. (Neutral)",
      ],
      chaotic: ["Revelation. Knowledge should be free from restriction or gatekeeping. (Chaotic)",
        "Discovery. The unknown is more important than any system of rules. (Chaotic)"],
      good: ["Sharing. Knowledge should help others grow and improve. (Good)",
        "Clarity. Truth should be accessible to all, not hidden. (Good)",],
      evil: ["Control. Those who hold knowledge hold power over others. (Evil)",
        "Secrecy. Some truths are best kept hidden—for my benefit. (Evil)",
      ]
    },
    bonds: ["I am protecting a piece of knowledge that others would destroy if they found it.",
      "My mentor entrusted me with unfinished work that I must complete.",
      "I am compiling a record of the world so that nothing is forgotten.",
      "A discovery I made could change everything, and I must decide who deserves to know.",
      "I owe my education to a scholar who sacrificed everything for me.",
      "I am determined to preserve truth in a world full of distortion and lies."
    ],
    flaws: ["I become so focused on details that I miss the bigger picture.",
      "I correct others constantly, even when it is socially inappropriate.",
      "I struggle to act without full information, even when action is urgent.",
      "I assume knowledge is always worth any cost to obtain.",
      "I am socially awkward and often misread tone or intent.",
      "I cannot easily let go of information once I have learned it, even if it is dangerous."
    ]
  },
  soldier: {
    personalityTraits: ["I'm always polite and respectful.",
      "I'm haunted by memories of war.I can't get the images of violence out of my mind.",
      "I've lost too many friends, and I'm slow to make new ones.",
      "I'm full of inspiring and cautionary tales from my military experience relevant to almost every combat situation.",
      "I can stare down a hell hound without flinching.",
      "I enjoy being strong and like breaking things.",
      "I have a crude sense of humor.",
      "I face problems head-on.A simple, direct solution is the best path to success."],
    ideals: {
      lawful: ["Responsibility. I do what I must and obey just authority. (Lawful)",
        "Nation. My city, nation, or people are all that matter. (Any)",
      ],
      neutral: ["Live and Let Live. Ideals aren't worth killing over or going to war for. (Neutral)",
        "Nation. My city, nation, or people are all that matter. (Any)",
      ],
      chaotic: ["Independence. When people follow orders blindly, they embrace a kind of tyranny. (Chaotic)",
        "Nation. My city, nation, or people are all that matter. (Any)"],
      good: ["Greater Good. Our lot is to lay down our lives in defense of others. (Good)",
        "Nation. My city, nation, or people are all that matter. (Any)",],
      evil: ["Might. In life as in war, the stronger force wins. (Evil)",
        "Nation. My city, nation, or people are all that matter. (Any)",
      ]
    },
    bonds: ["I would still lay down my life for the people I served with.",
      "Someone saved my life on the battlefield. To this day, I will never leave a friend behind.",
      "My honor is my life.",
      "I'll never forget the crushing defeat my company suffered or the enemies who dealt it.",
      "Those who fight beside me are those worth dying for.",
      "I fight for those who cannot fight for themselves.",
    ],
    flaws: ["The monstrous enemy we faced in battle still leaves me quivering with fear.",
      "I have little respect for anyone who is not a proven warrior.",
      "I made a terrible mistake in battle that cost many lives, and I would do anything to keep that mistake secret.",
      "My hatred of my enemies is blind and unreasoning.",
      "I obey the law, even if the law causes misery.",
      "I'd rather eat my armor than admit when I'm wrong.",
    ]
  },
  wayfarer: {
    personalityTraits: ["I am comfortable sleeping almost anywhere.",
      "I rarely feel attached to places or possessions.",
      "I trust my instincts when choosing direction over maps or advice.",
      "I am slow to settle and quick to move on.",
      "I collect small keepsakes from places I visit.",
      "I am friendly with strangers, knowing I may never see them again.",
      "I adapt quickly to unfamiliar cultures and customs.",
      "I sometimes struggle to form lasting bonds."],
    ideals: {
      lawful: ["Direction. Even wanderers need paths and boundaries to stay safe. (Lawful)",
        "Respect. The road has rules, even if they are unwritten. (Lawful)",
      ],
      neutral: ["Endurance. Keep moving forward, no matter what. (Neutral)",
        "Acceptance. The world is what it is; I simply pass through it. (Neutral)",
      ],
      chaotic: ["Freedom. No one should be bound to a single place or purpose. (Chaotic)",
        "Change. Life is movement; stillness is stagnation. (Chaotic)",
      ],
      good: ["Compassion. Every stranger on the road deserves kindness. (Good)",
        "Aid. I help those I encounter, knowing I may need help someday. (Good)",],
      evil: ["Survival. The road belongs to those willing to take what they need. (Evil)",
        "Exploitation. Every traveler is either prey or competition. (Evil)",]
    },
    bonds: ["I am searching for someone I lost while traveling long ago.",
      "A place I once knew was destroyed or changed, and I seek it again.",
      "I owe my survival to a stranger I met on the road.",
      "I believe there is a destination meant for me that I have not yet reached.",
      "I collect promises from people I meet, and I intend to keep them all.",
      "I refuse to let any place or person truly tie me down."
    ],
    flaws: ["I avoid staying in one place long enough to form lasting ties.",
      "I underestimate the value of stability and routine.",
      "I sometimes abandon responsibilities when the road calls to me.",
      "I struggle to trust long-term plans or commitments.",
      "I grow restless and impatient when confined or restricted.",
      "I treat relationships as temporary, even when others do not."
    ]
  }
};

function buildPortraitDescription(character) {
  const {
    name, gender, race, subrace, age, skin, hair, eyes,
    height, weight, background, alignment
  } = character;

  const ageNote = typeof age === "string" ? age : `${age} years old`;
  const subraceText = subrace ? ` (${subrace})` : "";
  const alignmentMood = {
    "Lawful Good": "warm and trustworthy",
    "Neutral Good": "kind and open",
    "Chaotic Good": "spirited and free",
    "Lawful Neutral": "disciplined and reserved",
    "Neutral": "calm and unreadable",
    "Chaotic Neutral": "unpredictable and wild",
    "Lawful Evil": "cold and calculating",
    "Neutral Evil": "detached and self-serving",
    "Chaotic Evil": "menacing and erratic"
  }[alignment] || "neutral";

  return `A ${gender.toLowerCase()} ${race}${subraceText}, ${ageNote}, with ${skin.toLowerCase()} skin. ` +
    `${hair !== "N/A" ? `Their ${hair.toLowerCase()} hair frames` : "Their face features"} ` +
    `${eyes !== "N/A" ? `${eyes.toLowerCase()} eyes that carry a ${alignmentMood} expression.` : "a striking expression."} ` +
    `They stand ${height} tall and weigh ${weight}, ` +
    `with the build and bearing of someone who has lived the life of a ${background.toLowerCase()}. ` +
    `Their clothes and manner reflect both their profession and their ${alignment.toLowerCase()} nature. ` +
    `\n\nStyle prompt: fantasy RPG character portrait, ${gender.toLowerCase()} ${race.toLowerCase()}${subraceText.toLowerCase()}, ` +
    `${skin.toLowerCase()} skin, ${hair !== "N/A" ? hair.toLowerCase() + " hair, " : ""}` +
    `${eyes !== "N/A" ? eyes.toLowerCase() + " eyes, " : ""}` +
    `${background.toLowerCase()} background, ${alignment.toLowerCase()} alignment, detailed fantasy illustration, dramatic lighting.`;
}

// Race generator
function races() {
  // Array of possible races
  const races = [
    "Aasimar", "Aarakocra", "Bugbear", "Centaur",
    "Dragonborn", "Drathunine", "Dwarf", "Elf",
    "Firbolg", "Genasi", "Ghost", "Ghoul", "Gnoll", "Gnome",
    "Goblin", "Goliath", "Half-Cyclops", "Half-Elf",
    "Half-Orc", "Halfling", "Hobgoblin", "Human",
    "Kenku", "Kobold", "Lizardfolk", "Loxodon",
    "Orc", "Pixie", "Quickling", "Satyr", "Skeleton",
    "Specter", "Sprite", "Tabaxi", "Tiefling", "Tortle",
    "Yuan-ti Pureblood", "Triton", "Warforged", "Zombie"
  ];

  // Pick a random race
  const randomIndex = Math.floor(Math.random() * races.length);
  return races[randomIndex];
}

// Needed to be global for Dragonborn Subrace
const dragonbornSubraces = ["Black", "Blue", "Green", "Red", "White",
  "Silver", "Gold", "Bronze", "Brass", "Copper", "Amethyst", "Crystal", "Emerald", "Sapphire", "Topaz"];

// Subrace generator
function subraces(race) {
  let subrace = "";
  const randomNumber = Math.floor(Math.random() * 1000); // large number to mimic C++ rand()

  const aasimarSubraces = ["Fallen", "Scourge", "Protector"];
  const drathunineSubraces = ["Parvus", "Magna", "Cursed"];
  const dwarfSubraces = ["Hill", "Mountain"];
  const elfSubraces = ["Dark", "High", "Shadow-touched", "Wood"];
  const genasiSubraces = ["Air", "Earth", "Fire", "Water"];
  const gnomeSubraces = ["Forest", "Rock"];
  const halflingSubraces = ["Stout", "Lightfoot"];

  // Main logic
  if (race === "Aasimar") {
    subrace = aasimarSubraces[randomNumber % aasimarSubraces.length];
  }
  else if (race === "Dragonborn") {
    subrace = dragonbornSubraces[randomNumber % dragonbornSubraces.length]
    subraceNumber = [randomNumber % dragonbornSubraces.length];
  }
  else if (race === "Drathunine") {
    subrace = drathunineSubraces[randomNumber % drathunineSubraces.length];
  }
  else if (race === "Dwarf") {
    subrace = dwarfSubraces[randomNumber % dwarfSubraces.length];
  }
  else if (race === "Elf") {
    subrace = elfSubraces[randomNumber % elfSubraces.length];
  }
  else if (race === "Genasi") {
    subrace = genasiSubraces[randomNumber % genasiSubraces.length];
  }
  else if (race === "Gnome") {
    subrace = gnomeSubraces[randomNumber % gnomeSubraces.length];
  }
  else if (race === "Halfling") {
    subrace = halflingSubraces[randomNumber % halflingSubraces.length];
  }

  return subrace;
}

// Gender generator
function genders(race) {
  const genders = ["Male", "Female", "None"];
  let gender = "";
  const randomNumber = Math.floor(Math.random() * 2); // 0 or 1

  // Main logic
  if (race === "Warforged") {
    gender = genders[2]; // "None"
  } else {
    gender = genders[randomNumber]; // "Male" or "Female"
  }

  return gender;
}

function raceAge(baseRace, undeadRace) {
  let age;
  let deadAge
  let maturity = "";

  if (baseRace === "Gnoll") {
    age = Math.floor(Math.random() * 28) + 3;
    if (age >= 25) {
      maturity = " (Old)";
    }
    else if (age >= 7) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Aarakocra") {
    age = Math.floor(Math.random() * 29) + 2;
    if (age >= 25) {
      maturity = " (Old)";
    }
    else if (age >= 3) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Orc") {
    age = Math.floor(Math.random() * 45) + 6;
    if (age >= 40) {
      maturity = " (Old)";
    }
    else if (age >= 16) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Half-Cyclops") {
    age = Math.floor(Math.random() * 45) + 6;
    if (age >= 40) {
      maturity = " (Old)";
    }
    else if (age >= 13) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Quickling") {
    age = Math.floor(Math.random() * 45) + 6;
    if (age >= 40) {
      maturity = " (Old)";
    }
    else if (age >= 10) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Lizardfolk") {
    age = Math.floor(Math.random() * 60) + 1;
    if (age >= 45) {
      maturity = " (Old)";
    }
    else if (age >= 14) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Goblin") {
    age = Math.floor(Math.random() * 58) + 3;
    if (age >= 40) {
      maturity = " (Old)";
    }
    else if (age >= 8) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Tortle") {
    age = Math.floor(Math.random() * 55) + 6;
    if (age >= 40) {
      maturity = " (Old)";
    }
    else if (age >= 15) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Drathunine") {
    age = Math.floor(Math.random() * 55) + 6;
    if (age >= 40) {
      maturity = " (Old)";
    }
    else if (age >= 15) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Kenku") {
    age = Math.floor(Math.random() * 57) + 4;
    if (age >= 40) {
      maturity = " (Old)";
    }
    else if (age >= 12) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Bugbear") {
    age = Math.floor(Math.random() * 74) + 7;
    if (age >= 60) {
      maturity = " (Old)";
    }
    else if (age >= 16) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Half-Orc") {
    age = Math.floor(Math.random() * 65) + 6;
    if (age >= 55) {
      maturity = " (Old)";
    }
    else if (age >= 14) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Pixie") {
    age = Math.floor(Math.random() * 70) + 1;
    if (age >= 55) {
      maturity = " (Old)";
    }
    else if (age >= 4) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Sprite") {
    age = Math.floor(Math.random() * 70) + 1;
    if (age >= 50) {
      maturity = " (Old)";
    }
    else if (age >= 4) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Human") {
    age = Math.floor(Math.random() * 90) + 6;
    if (age >= 65) {
      maturity = " (Old)";
    }
    else if (age >= 18) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Tiefling") {
    age = Math.floor(Math.random() * 90) + 6;
    if (age >= 65) {
      maturity = " (Old)";
    }
    else if (age >= 18) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Goliath") {
    age = Math.floor(Math.random() * 90) + 6;
    if (age >= 65) {
      maturity = " (Old)";
    }
    else if (age >= 18) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Tabaxi") {
    age = Math.floor(Math.random() * 90) + 6;
    if (age >= 65) {
      maturity = " (Old)";
    }
    else if (age >= 18) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Centaur") {
    age = Math.floor(Math.random() * 92) + 4;
    if (age >= 65) {
      maturity = " (Old)";
    }
    else if (age >= 10) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Hobgoblin") {
    age = Math.floor(Math.random() * 90) + 6;
    if (age >= 65) {
      maturity = " (Old)";
    }
    else if (age >= 18) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Yuan-ti Pureblood") {
    age = Math.floor(Math.random() * 90) + 6;
    if (age >= 65) {
      maturity = " (Old)";
    }
    else if (age >= 18) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Dragonborn") {
    age = Math.floor(Math.random() * 99) + 2;
    if (age >= 65) {
      maturity = " (Old)";
    }
    else if (age >= 15) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Genasi") {
    age = Math.floor(Math.random() * 113) + 8;
    if (age >= 80) {
      maturity = " (Old)";
    }
    else if (age >= 18) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Kobold") {
    age = Math.floor(Math.random() * 119) + 2;
    if (age >= 80) {
      maturity = " (Old)";
    }
    else if (age >= 6) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Satyr") {
    age = Math.floor(Math.random() * 126) + 5;
    if (age >= 90) {
      maturity = " (Old)";
    }
    else if (age >= 13) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Halfling") {
    age = Math.floor(Math.random() * 163) + 8;
    if (age >= 135) {
      maturity = " (Old)";
    }
    else if (age >= 20) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Aasimar") {
    age = Math.floor(Math.random() * 174) + 7;
    if (age >= 130) {
      maturity = " (Old)";
    }
    else if (age >= 18) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Half-Elf") {
    age = Math.floor(Math.random() * 194) + 7;
    if (age >= 155) {
      maturity = " (Old)";
    }
    else if (age >= 20) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Triton") {
    age = Math.floor(Math.random() * 194) + 7;
    if (age >= 160) {
      maturity = " (Old)";
    }
    else if (age >= 15) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Warforged") {
    age = Math.floor(Math.random() * 260) + 1;
  }
  else if (baseRace === "Dwarf") {
    age = Math.floor(Math.random() * 343) + 8;
    if (age >= 300) {
      maturity = " (Old)";
    }
    else if (age >= 50) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Loxodon") {
    age = Math.floor(Math.random() * 444) + 7;
    if (age >= 380) {
      maturity = " (Old)";
    }
    else if (age >= 18) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Gnome") {
    age = Math.floor(Math.random() * 494) + 7;
    if (age >= 350) {
      maturity = " (Old)";
    }
    else if (age >= 18) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Firbolg") {
    age = Math.floor(Math.random() * 493) + 8;
    if (age >= 380) {
      maturity = " (Old)";
    }
    else if (age >= 30) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }
  else if (baseRace === "Elf") {
    age = Math.floor(Math.random() * 743) + 8;
    if (age >= 600) {
      maturity = " (Old)";
    }
    else if (age >= 100) {
      maturity = " (Mature)"
    }
    else if (age >= 0) {
      maturity = " (Young)"
    }
  }

  if (undeadRace !== null) {
    deadAge = Math.floor(Math.random() * 140) + age;

    return "Died At " + age + maturity + " Current Age: " + deadAge;
  }

  return age + maturity;
}

// Height and Weight generator
function heightAndWeight(race, subrace) {
  // Helper random functions
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const randomNumber = rand(0, 1);
  const oneFour = rand(1, 4);
  const twoFour = rand(2, 8);
  const oneSix = rand(1, 6);
  const twoSix = rand(2, 12);
  const twoSix2 = rand(2, 12);
  const oneEight = rand(1, 8);
  const twoEight = rand(2, 16);
  const oneTen = rand(1, 10);
  const twoTen = rand(2, 20);
  const oneTwelve = rand(1, 12);
  const twoTwelve = rand(2, 24);

  let heightFeet = 0;
  let heightInches = 0;
  let weight = 0;

  if (race === "Aasimar" || race === "Human") {
    heightFeet = Math.floor((56 + twoTen) / 12);
    heightInches = (56 + twoTen) % 12;
    weight = 110 + (twoTen * twoFour);
  } else if (race === "Aarakocra") {
    heightFeet = Math.floor((54 + twoSix) / 12);
    heightInches = (54 + twoSix) % 12;
    weight = 65 + (twoSix * oneSix);
  } else if (race === "Bugbear") {
    heightFeet = Math.floor((73 + twoTen) / 12);
    heightInches = (73 + twoTen) % 12;
    weight = 215 + (twoTen * oneTwelve);
  } else if (race === "Centaur") {
    heightFeet = Math.floor((79 + twoSix) / 12);
    heightInches = (79 + twoSix) % 12;
    weight = 620 + (twoSix * twoTen);
  } else if (race === "Dragonborn") {
    heightFeet = Math.floor((66 + twoEight) / 12);
    heightInches = (66 + twoEight) % 12;
    weight = 175 + (twoEight * twoSix);
  } else if (race === "Drathunine") {
    if (subrace === "Magna") {
      heightFeet = Math.floor((44 + twoFour) / 12);
      heightInches = (44 + twoFour) % 12;
      weight = 90 + (twoFour * oneSix);
    } else if (subrace === "Parvus") {
      heightFeet = Math.floor((66 + twoEight) / 12);
      heightInches = (66 + twoEight) % 12;
      weight = 110 + (twoEight * twoSix);
    } else if (subrace === "Cursed") {
      if (randomNumber === 0) {
        heightFeet = Math.floor((44 + twoFour) / 12);
        heightInches = (44 + twoFour) % 12;
        weight = 90 + (twoFour * oneSix);
      } else {
        heightFeet = Math.floor((66 + twoEight) / 12);
        heightInches = (66 + twoEight) % 12;
        weight = 110 + (twoEight * twoSix);
      }
    }
  } else if (race === "Dwarf") {
    if (subrace === "Hill") {
      heightFeet = Math.floor((44 + twoFour) / 12);
      heightInches = (44 + twoFour) % 12;
      weight = 115 + (twoFour * twoSix);
    } else if (subrace === "Mountain") {
      heightFeet = Math.floor((48 + twoFour) / 12);
      heightInches = (48 + twoFour) % 12;
      weight = 130 + (twoFour * twoSix);
    }
  } else if (race === "Elf") {
    if (subrace === "Wood") {
      heightFeet = Math.floor((54 + twoTen) / 12);
      heightInches = (54 + twoTen) % 12;
      weight = 100 + (twoTen * oneFour);
    } else if (subrace === "High") {
      heightFeet = Math.floor((54 + twoTen) / 12);
      heightInches = (54 + twoTen) % 12;
      weight = 90 + (twoTen * oneFour);
    } else if (subrace === "Dark" || subrace === "Shadow-touched") {
      heightFeet = Math.floor((53 + twoTen) / 12);
      heightInches = (53 + twoTen) % 12;
      weight = 75 + (twoTen * oneSix);
    }
  } else if (race === "Firbolg") {
    heightFeet = Math.floor((76 + twoTen) / 12);
    heightInches = (76 + twoTen) % 12;
    weight = 180 + (twoTen * twoEight);
  } else if (race === "Genasi") {
    heightFeet = Math.floor((58 + twoEight) / 12);
    heightInches = (58 + twoEight) % 12;
    weight = 95 + (twoEight * twoSix);
  } else if (race === "Gnoll") {
    heightFeet = Math.floor((66 + twoEight) / 12);
    heightInches = (66 + twoEight) % 12;
    weight = 110 + (twoEight * twoSix);
  } else if (race === "Gnome") {
    heightFeet = Math.floor((35 + twoFour) / 12);
    heightInches = (35 + twoFour) % 12;
    weight = 35 + twoFour;
  } else if (race === "Goblin") {
    heightFeet = Math.floor((40 + twoSix) / 12);
    heightInches = (40 + twoSix) % 12;
    weight = 30 + (twoSix * 2);
  } else if (race === "Goliath") {
    heightFeet = Math.floor((73 + twoTwelve) / 12);
    heightInches = (73 + twoTwelve) % 12;
    weight = 110 + (twoTwelve * oneTwelve);
  } else if (race === "Half-Cyclops" || race === "Orc") {
    heightFeet = Math.floor((65 + twoSix) / 12);
    heightInches = (65 + twoSix) % 12;
    weight = 190 + (twoSix * twoEight);
  } else if (race === "Half-Elf") {
    heightFeet = Math.floor((57 + twoEight) / 12);
    heightInches = (57 + twoEight) % 12;
    weight = 110 + (twoEight * twoFour);
  } else if (race === "Half-Orc") {
    heightFeet = Math.floor((58 + twoTen) / 12);
    heightInches = (58 + twoTen) % 12;
    weight = 140 + (twoTen * twoSix);
  } else if (race === "Halfling") {
    heightFeet = Math.floor((31 + twoFour) / 12);
    heightInches = (31 + twoFour) % 12;
    weight = 35 + twoFour;
  } else if (race === "Hobgoblin") {
    heightFeet = Math.floor((55 + twoTwelve) / 12);
    heightInches = (55 + twoTwelve) % 12;
    weight = 105 + (twoTwelve * oneEight);
  } else if (race === "Kenku") {
    heightFeet = Math.floor((51 + twoTen) / 12);
    heightInches = (51 + twoTen) % 12;
    weight = 45 + (twoTen * oneEight);
  } else if (race === "Kobold") {
    heightFeet = Math.floor((24 + twoSix) / 12);
    heightInches = (24 + twoSix) % 12;
    weight = 20 + (twoSix * 2);
  } else if (race === "Lizardfolk") {
    heightFeet = Math.floor((55 + twoTwelve) / 12);
    heightInches = (55 + twoTwelve) % 12;
    weight = 110 + (twoTwelve * oneTen);
  } else if (race === "Loxodon") {
    heightFeet = Math.floor((77 + twoTwelve) / 12);
    heightInches = (77 + twoTwelve) % 12;
    weight = 270 + (twoTwelve * oneEight);
  } else if (race === "Pixie" || race === "Sprite") {
    heightFeet = 0;
    heightInches = (6 + oneFour) % 12;
    weight = 5 + oneFour;
  } else if (race === "Quickling") {
    heightFeet = Math.floor((20 + oneEight) / 12);
    heightInches = (20 + oneEight) % 12;
    weight = 22 + (oneEight * 2);
  } else if (race === "Satyr") {
    heightFeet = Math.floor((42 + twoSix) / 12);
    heightInches = (42 + twoSix) % 12;
    weight = 66 + (twoSix * 2);
  } else if (race === "Tabaxi") {
    heightFeet = Math.floor((59 + twoEight) / 12);
    heightInches = (59 + twoEight) % 12;
    weight = 80 + (twoEight * twoSix);
  } else if (race === "Tiefling") {
    heightFeet = Math.floor((58 + twoSix) / 12);
    heightInches = (58 + twoSix) % 12;
    weight = 100 + (twoSix * twoSix2);
  } else if (race === "Tortle") {
    heightFeet = Math.floor((55 + twoTwelve) / 12);
    heightInches = (55 + twoTwelve) % 12;
    weight = 370 + (twoTwelve * oneEight);
  } else if (race === "Yuan-ti Pureblood") {
    heightFeet = Math.floor((58 + twoEight) / 12);
    heightInches = (58 + twoEight) % 12;
    weight = 95 + (twoEight * twoSix);
  } else if (race === "Triton") {
    heightFeet = Math.floor((56 + twoEight) / 12);
    heightInches = (56 + twoEight) % 12;
    weight = 85 + (twoEight * twoSix);
  } else if (race === "Warforged") {
    heightFeet = Math.floor((71 + twoFour) / 12);
    heightInches = (71 + twoFour) % 12;
    weight = 280 + (twoFour * oneFour);
  }

  return { heightFeet, heightInches, weight };
}

function skinColors(race, subrace, subraceIndex = null) {
  const randomNumber = Math.floor(Math.random() * 1000); // high number to avoid repeating patterns
  let skinColor = "";

  const humanColor = ["Light Pale White", "White Fair", "Medium White to Olive", "Olive, Moderate Brown", "Brown, Dark Brown", "Black, Very Dark"];
  const divineHumanColor = ["Ghost White", "Pale", "Gray", "Dark Gray", "Inky Black", "Blueish Gray"];
  const dragonbornColor = ["Black", "Blue", "Green", "Red", "White",
    "Silver", "Gold", "Bronze", "Brass", "Copper", "Purple", "Milky-White", "Emerald", "Royal Blue", "Yellow"];
  const aarakocra = ["Eagle", "Hawk", "Owl", "Parrot", "Vulture", "Seagull"];
  const brownFur = ["Dark Brown", "Brown", "Light Brown", "Tanned", "Gray", "Black"];
  const parvus = ["French Bulldog", "Yorkshire Terrier", "Chihuahuas", "Pomeranian", "Pug", "Shih Tzu"];
  const magna = ["Great Dane", "Newfoundland", "Saint Bernard", "Bernese Mountain Dog", "Leonberger", "Mastiff"];
  const cursed = ["French Bulldog", "Yorkshire Terrier", "Chihuahuas", "Pomeranian", "Pug", "Shih Tzu",
    "Great Dane", "Newfoundland", "Saint Bernard", "Bernese Mountain Dog", "Leonberger", "Mastiff"];
  const gobSkin = ["Dark Green", "Green", "Light Green", "Gray", "Light Gray", "Tan"];
  const air = ["Blue-White", "Light Blue", "Blue-Gray"];
  const earth = ["Deep Brown", "Black", "Rusty Iron"];
  const fire = ["Flaming Red", "Coal Black", "Ash Gray"];
  const water = ["Blue", "Teal", "Green"];
  const goliathSkin = ["Stone Grey", "Pale Blue", "Gray with Dark patches", "Gray with Light patches"];
  const kenkuSkin = ["Black", "Dark Blue", "Dark Gray"];
  const koboldSkin = ["Black", "Blue", "Brown", "Gray", "Green", "Orange", "Orange-Brown", "Red", "Red-Brown", "Tan", "White"];
  const lizardfolkSkin = ["Light Green with Black and Red stripes", "Dark Green with mottled Dark Brown", "Black", "White with Light Blue stripes", "Light Golden Brown"];
  const pixieSkin = ["Light Blue", "Blue", "Dark Blue", "Light Green", "Green", "Dark Green", "Light Red", "Red", "Dark Red", "Light Brown", "Brown", "Dark Brown"];
  const tabaxi = ["Siamese", "Persian", "Maine Coon", "Ragdoll", "Bengal", "Abyssinian", "Birman", "Oriental Shorthair", "Sphynx", "Devon Rex", "Himalayan", "American Shorthair"];
  const teiflingColor = ["Light Pale White", "White Fair", "Medium White to Olive", "Olive, Moderate Brown", "Brown, Dark Brown", "Black, Very Dark",
    "Light Blue", "Blue", "Dark Blue", "Light Green", "Green", "Dark Green", "Light Red", "Red", "Dark Red", "Light Purple",
    "Purple", "Dark Purple", "Light Yellow", "Yellow", "Dark Yellow", "Light Pink", "Pink", "Dark Pink"];
  const yuanTiPureblood = ["Light Pale White", "White Fair", "Medium White to Olive", "Olive, Moderate Brown", "Brown, Dark Brown", "Black, Very Dark",
    "Light Pale White with Green Tint", "White Fair with Green Tint", "Medium White to Olive with Green Tint", "Olive, Moderate Brown with Green Tint",
    "Brown, Dark Brown with Green Tint", "Black, Very Dark with Green Tint", "Light Pale White with Brown Tint", "White Fair with Brown Tint",
    "Medium White to Olive with Brown Tint", "Light Pale White with Gray Tint", "White Fair with Gray Tint", "Medium White to Olive with Gray Tint",
    "Olive, Moderate Brown with Gray Tint", "Brown, Dark Brown with Gray Tint", "Black, Very Dark with Gray Tint", "Light Pale White with Blue Tint",
    "White Fair with Blue Tint", "Medium White to Olive with Blue Tint", "Olive, Moderate Brown with Blue Tint", "Brown, Dark Brown with Blue Tint", "Black, Very Dark with Blue Tint"];
  const warforged = ["Polished Steel", "Polished Bronze", "Copper", "Iron", "Steel", "Bronze", "Copper", "Iron", "Rusted Steel", "Rusted Bronze", "Rusted Copper",
    "Rusted Iron", "Polished Granite", "Rugged Flagstone", "Obsidian", "Birch Wood", "Oak Wood", "Rich Darkwood"];

  if (["Aasimar", "Centaur", "Dwarf", "Elf", "Gnome", "Half-Cyclops", "Half-Elf", "Halfling", "Human", "Satyr", "Sprite"].includes(race)) {
    if (race === "Aasimar" || subrace === "Dark" || subrace === "Shadow-Touched") {
      skinColor = divineHumanColor[randomNumber % divineHumanColor.length];
    } else {
      skinColor = humanColor[randomNumber % humanColor.length];
    }
  } else if (race === "Aarakocra") {
    skinColor = aarakocra[randomNumber % aarakocra.length];
  } else if (["Bugbear", "Gnoll"].includes(race)) {
    skinColor = brownFur[randomNumber % brownFur.length];
  } else if (race === "Dragonborn") {
    if (subraceIndex !== null && subraceIndex >= 0) {
      skinColor = dragonbornColor[subraceIndex];
    } else {
      // fallback: random if index not found
      skinColor = dragonbornColor[randomNumber % dragonbornColor.length];
    }
  } else if (race === "Drathunine") {
    if (subrace === "Parvus") skinColor = parvus[randomNumber % parvus.length];
    else if (subrace === "Magna") skinColor = magna[randomNumber % magna.length];
    else if (subrace === "Cursed") skinColor = cursed[randomNumber % cursed.length];
  } else if (["Firbolg", "Goblin", "Orc", "Half-Orc", "Hobgoblin", "Tortle"].includes(race)) {
    skinColor = gobSkin[randomNumber % gobSkin.length];
  } else if (race === "Genasi") {
    if (subrace === "Air") skinColor = air[randomNumber % air.length];
    else if (subrace === "Earth") skinColor = earth[randomNumber % earth.length];
    else if (subrace === "Fire") skinColor = fire[randomNumber % fire.length];
    else if (subrace === "Water") skinColor = water[randomNumber % water.length];
  } else if (["Goliath", "Loxodon"].includes(race)) {
    skinColor = goliathSkin[randomNumber % goliathSkin.length];
  } else if (race === "Kenku") {
    skinColor = kenkuSkin[randomNumber % kenkuSkin.length];
  } else if (race === "Kobold") {
    skinColor = koboldSkin[randomNumber % koboldSkin.length];
  } else if (race === "Lizardfolk") {
    skinColor = lizardfolkSkin[randomNumber % lizardfolkSkin.length];
  } else if (race === "Pixie") {
    skinColor = pixieSkin[randomNumber % pixieSkin.length];
  } else if (race === "Quickling") {
    skinColor = air[randomNumber % air.length];
  } else if (race === "Tabaxi") {
    skinColor = tabaxi[randomNumber % tabaxi.length];
  } else if (race === "Tiefling") {
    skinColor = teiflingColor[randomNumber % teiflingColor.length];
  } else if (race === "Yuan-ti Pureblood") {
    skinColor = yuanTiPureblood[randomNumber % yuanTiPureblood.length];
  } else if (race === "Triton") {
    skinColor = water[randomNumber % water.length];
  } else if (race === "Warforged") {
    skinColor = warforged[randomNumber % warforged.length];
  } else { skinColor = "N/A"; }

  return skinColor;
}

function hairColors(race, subrace) {
  const randomNumber = Math.floor(Math.random() * 1000); // large number to reduce repetition
  let hairColor = "";

  const basicColors = ["Black", "Brown", "Blonde", "Red", "White", "Gray", "Bald"];
  const darkColors = ["Black", "Bald", "Gray", "White"];
  const air = ["Bald", "Wispy White", "Silver", "Pale Blue"];
  const earth = ["Bald", "Red", "Orange", "Flame-Like", "Red Flickering Glow", "Orange Flickering Glow"];
  const fire = ["Bald", "Dark Brown", "Black", "Stony Gray", "Crystalline tings"];
  const water = ["Bald", "Blue", "Green", "Seaweed-Like"];
  const pixie = ["Bald", "Pastel Pink", "Pastel Blues", "Pastel Green", "Pastel Pink with glowing highlights", "Pastel Blues with glowing highlights", "Pastel Green with glowing highlights"];
  const quickling = ["Bald", "Icy Blue-White", "Silvery Streaks", "Translucent"];
  const teifling = ["Bald", "Red", "Purple", "Blue", "White", "Black", "Silver"];
  const triton = ["Bald", "Blue-Green", "Silver", "Seaweed-Toned", "White"];

  const basicRaces = ["Aasimar", "Centaur", "Dwarf", "Elf", "Gnome", "Half-Cyclops", "Half-Elf", "Halfling", "Human", "Satyr", "Sprite", "Firbolg", "Goblin", "Orc", "Half-Orc", "Hobgoblin", "Goliath", "Yuan-ti Pureblood"];

  if (basicRaces.includes(race)) {
    if (subrace === "Dark" || subrace === "Shadow-Touched" || subrace === "Fallen") {
      hairColor = darkColors[randomNumber % darkColors.length];
    } else {
      hairColor = basicColors[randomNumber % basicColors.length];
    }
  } else if (race === "Genasi") {
    if (subrace === "Air") hairColor = air[randomNumber % air.length];
    else if (subrace === "Earth") hairColor = earth[randomNumber % earth.length];
    else if (subrace === "Fire") hairColor = fire[randomNumber % fire.length];
    else if (subrace === "Water") hairColor = water[randomNumber % water.length];
  } else if (race === "Pixie") {
    hairColor = pixie[randomNumber % pixie.length];
  } else if (race === "Quickling") {
    hairColor = quickling[randomNumber % quickling.length];
  } else if (race === "Tiefling") {
    hairColor = teifling[randomNumber % teifling.length];
  } else if (race === "Triton") {
    hairColor = triton[randomNumber % triton.length];
  } else {
    hairColor = "N/A";
  }

  return hairColor;
}

function eyeColors(race, subrace) {
  const randomNumber = Math.floor(Math.random() * 1000);
  let eyeColor = "";

  const basicColors = ["Light Brown", "Brown", "Dark Brown", "Hazel", "Green", "Olive", "Blue", "Deep Blue", "Ice Blue", "Gray", "Amber"];
  const darkColors = ["White", "Gray", "Black", "Red", "Violet", "Milky-White"];
  const air = ["Piercing Blue", "Aqua"];
  const fire = ["Fiery Red", "Fiery Orange", "Glowing Yellow"];
  const fey = ["Emerald Green", "Sapphire Blue", "Amethyst Purple", "Gold", "Silver", "Rose"];
  const beast = ["Yellow/Amber", "Orange", "Red", "Green", "Blue", "Brown/Black"];
  const teiflingColors = ["Fiery Red", "Fiery Orange", "Purple", "Black Sclera"];

  const basicRaces = ["Aasimar", "Centaur", "Dwarf", "Elf", "Gnome", "Half-Cyclops", "Half-Elf", "Halfling", "Human", "Firbolg", "Goblin", "Orc", "Half-Orc", "Hobgoblin"];
  const darkRaces = ["Goliath", "Loxodon", "Kenku", "Kobold", "Lizardfolk"];

  if (basicRaces.includes(race) || darkRaces.includes(race)) {
    if (subrace === "Dark" || subrace === "Shadow-Touched" || subrace === "Fallen" || darkRaces.includes(race)) {
      eyeColor = darkColors[randomNumber % darkColors.length];
    } else {
      eyeColor = basicColors[randomNumber % basicColors.length];
    }
  } else if (race === "Genasi") {
    if (subrace === "Air" || subrace === "Water") eyeColor = air[randomNumber % air.length];
    else if (subrace === "Earth") eyeColor = basicColors[randomNumber % 6];
    else if (subrace === "Fire") eyeColor = fire[randomNumber % fire.length];
  } else if (["Pixie", "Quickling", "Satyr", "Sprite", "Triton"].includes(race)) {
    eyeColor = fey[randomNumber % fey.length];
  } else if (race === "Tiefling") {
    eyeColor = teiflingColors[randomNumber % teiflingColors.length];
  } else if (["Aarakocra", "Tabaxi", "Yuan-Ti Pureblood", "Drathunine", "Tortle"].includes(race)) {
    eyeColor = beast[randomNumber % beast.length];
  } else if (race === "Dragonborn") {
    eyeColor = subrace;
  } else {
    eyeColor = "N/A";
  }

  return eyeColor;
}

// --- Utility: Weighted random selection ---
const regionSelect = document.getElementById("region");
const customContainer = document.getElementById("customRegion"); // match your HTML
const customNameContainer = document.getElementById("customNameContainer");
const customNameType = document.getElementById("customNameType");
const raceInputs = document.querySelectorAll('input[type="number"][data-race]');
const raceCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="bool"]');
const sectionCheckboxes = {
  PHB: document.getElementById("PHB"),
  MPMM: document.getElementById("MPMM"),
  MISC: document.getElementById("MISC"),
  UNDEAD: document.getElementById("UNDEAD")
};
document
  .getElementById("save-region-btn")
  ?.addEventListener("click", () => {

    const regionName =
      document.getElementById("custom-region-name")
      .value
      .trim();

    if (!regionName) {
      alert("Enter a region name.");
      return;
    }

    saveCustomRegion(regionName);

    regionSelect.value = regionName;
  });

  document
  .getElementById("delete-region-btn")
  ?.addEventListener("click", () => {

    const regionName = regionSelect.value;

    deleteCustomRegion(regionName);
  });


Object.entries(sectionCheckboxes).forEach(([sectionKey, sectionCheckbox]) => {
  if (!sectionCheckbox) return;

  sectionCheckbox.addEventListener("change", () => {
    document.querySelectorAll(`input[type="number"][data-section="${sectionKey}"]`).forEach(input => {
      const raceItem = input.closest(".race-item");
      const raceCheckbox = raceItem?.querySelector('input[type="checkbox"]');
      if (raceCheckbox) {
        raceCheckbox.checked = sectionCheckbox.checked;
      }
    });

    recalculateRaceChances();
  });
});

function getRegionWeights(region) {
  const regionData = getAllRegions()[region];
  if (!regionData) return {};
  return flattenRaceData(regionData);
}

function getCheckedRaces() {
  const races = [];

  document.querySelectorAll('input[type="number"][data-race]').forEach(input => {
    const raceItem = input.closest(".race-item");
    const checkbox = raceItem?.querySelector('input[type="checkbox"]');
    if (!checkbox || !checkbox.checked) return;

    races.push({
      name: input.dataset.race,
      weight: parseFloat(input.value) || 0
    });
  });

  return races;
}

function getRaceWeightsFromInputs() {
  const raceWeights = {};

  document.querySelectorAll('input[type="number"][data-race]').forEach(input => {
    const raceItem = input.closest(".race-item");
    const checkbox = raceItem?.querySelector('input[type="checkbox"]');
    if (!checkbox || !checkbox.checked) return;

    const value = parseFloat(input.value) || 0;
    if (value <= 0) return;

    raceWeights[input.dataset.race] = value;
  });

  updateChanceDisplay();
  return raceWeights;
}

function rollRaceSmart() {
  const races = getCheckedRaces();
  if (races.length === 0) return null;

  const hasWeights = races.some(r => r.weight > 0);

  // CASE 1: All weights are zero → uniform roll
  if (!hasWeights) {
    const index = Math.floor(Math.random() * races.length);
    return races[index].name;
  }

  // CASE 2: Weighted roll (ignore zero weights)
  const weighted = races.filter(r => r.weight > 0);
  const total = weighted.reduce((sum, r) => sum + r.weight, 0);

  let roll = Math.random() * total;
  for (const race of weighted) {
    roll -= race.weight;
    if (roll <= 0) return race.name;
  }

  return weighted[weighted.length - 1].name;
}

function weightedRaceSelection(weights) {
  const entries = Object.entries(weights);
  if (entries.length === 0) return null;

  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * totalWeight;

  for (const [race, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return race;
  }

  return entries[entries.length - 1][0];
}

function normalizeRaceKey(str) {
  return str.toLowerCase().replace(/[\s-]/g, "");
}

function flattenRaceData(regionData) {
  const flat = {};
  Object.values(regionData).forEach(group => {
    Object.entries(group).forEach(([race, val]) => {
      flat[normalizeRaceKey(race)] = val;
    });
  });
  return flat;
}

function applyRegionData(regionKey) {
  const regionData = getAllRegions()[regionKey];
  if (!regionData) return;

  const flat = flattenRaceData(regionData);

  document.querySelectorAll("input[data-race]").forEach(input => {
    const key = normalizeRaceKey(input.dataset.race);
    input.value = flat[key] ?? 0;
  });
}

function collectCurrentRegionData() {
  const regionData = {
    phb: {},
    mpmm: {},
    misc: {},
    undead: {}
  };

  document.querySelectorAll("input[data-race]").forEach(input => {
    const race = normalizeRaceKey(input.dataset.race);
    const section = input.dataset.section?.toLowerCase();

    const value = parseFloat(input.value) || 0;

    if (regionData[section]) {
      regionData[section][race] = value;
    }
  });

  return regionData;
}

function isRaceEnabled(input) {
  const section = input.dataset.section;
  const raceCheckbox = input.closest("label").querySelector('input[type="checkbox"]');

  return (
    raceCheckbox?.checked &&
    sectionCheckboxes[section]?.checked
  );
}

function recalculateRaceChances() {
  const rows = document.querySelectorAll(".race-item");
  let totalWeight = 0;
  const activeRaces = [];

  rows.forEach(raceItem => {
    const checkbox = raceItem.querySelector('input[type="checkbox"]');
    const input = raceItem.querySelector('input[type="number"][data-race]');
    const chanceSpan = raceItem.querySelector(".chance-display");

    if (!checkbox || !input || !chanceSpan) return;

    const section = input.dataset.section;
    const sectionCheckbox = section ? sectionCheckboxes[section] : null;

    const enabled =
      checkbox.checked &&
      (!sectionCheckbox || sectionCheckbox.checked);

    const weight = enabled ? (parseFloat(input.value) || 0) : 0;

    if (enabled && weight > 0) {
      totalWeight += weight;
      activeRaces.push({ weight, chanceSpan });
    } else if (chanceSpan) {
      chanceSpan.textContent = "—";
    }
  });

  if (totalWeight === 0) {
    activeRaces.forEach(r => r.chanceSpan.textContent = "0%");
    return;
  }

  activeRaces.forEach(({ weight, chanceSpan }) => {
    const pct = (weight / totalWeight) * 100;
    chanceSpan.textContent = `${pct.toFixed(2)}%`;
  });
}

raceInputs.forEach(input => {
  input.addEventListener("input", recalculateRaceChances);
});

raceCheckboxes.forEach(cb => {
  cb.addEventListener("change", recalculateRaceChances);
});


// Get ALL summary checkboxes (the ones inside <summary>)
const summaryCheckboxes = document.querySelectorAll(
  "summary input[type='checkbox']"
);

summaryCheckboxes.forEach(summaryCheckbox => {
  summaryCheckbox.addEventListener("change", () => {
    const details = summaryCheckbox.closest("details");
    if (!details) return;

    details
      .querySelectorAll(".race-item input[type='checkbox']")
      .forEach(cb => cb.checked = summaryCheckbox.checked);

    recalculateRaceChances();
  });
});


regionSelect.addEventListener("change", e => {
  applyRegionData(e.target.value);
  recalculateRaceChances();
});

// Add scroll-wheel and max total logic
raceInputs.forEach(input => {
  input.addEventListener("input", recalculateRaceChances);

  input.addEventListener("wheel", function (e) {
    e.preventDefault();

    const step = parseFloat(this.step) || 1;
    let value = parseFloat(this.value) || 0;
    value += e.deltaY < 0 ? step : -step;

    this.value = Math.max(value, parseFloat(this.min) || 0);

    recalculateRaceChances();
  });
});

document.getElementById("save-region-btn")?.addEventListener("click", () => {

    const regionName =
      document.getElementById("custom-region-name")
      .value
      .trim();

    if (!regionName) {
      alert("Enter a region name.");
      return;
    }

    saveCustomRegion(regionName);

    regionSelect.value = regionName;
  });

// Generate character
document.getElementById("generate").addEventListener("click", async () => {
  const region = regionSelect.value;
  const undeadRaces = ["Ghost", "Ghoul", "Skeleton", "Specter", "Vampire", "Zombie"];

  let baseRace = rollRaceSmart();
  if (!baseRace) {
    alert("No races selected.");
    return;
  }

  let undeadRace = null;

  if (undeadRaces.includes(baseRace)) {
    undeadRace = baseRace;

    do {
      baseRace = rollRaceSmart();
    } while (undeadRaces.includes(baseRace) || baseRace === "Warforged");
  }


  const subrace = subraces(baseRace);
  // If race is Dragonborn, get its index
  let subraceIndex = null;
  if (baseRace === "Dragonborn") {
    subraceIndex = dragonbornSubraces.indexOf(subrace);
  }
  const background = backGround();
if (!background) {
  alert("No backgrounds selected.");
  return;
}
  stats = abilities(background);
  const alignment = alignments();
  console.log(undeadRace);
  const age = raceAge(baseRace, undeadRace);
  const gender = genders(baseRace);
  let { heightFeet, heightInches, weight } = heightAndWeight(baseRace, subrace);
  let skin = skinColors(baseRace, subrace, subraceIndex);
  let hair = hairColors(baseRace, subrace);
  let eyes = eyeColors(baseRace, subrace);

  // Determine name
  const culture =
    customNameType.value !== "Any"
      ? customNameType.value
      : region;
  const name = await names(culture);

  // Traits
  const profile = generateBackgroundProfile(background, alignment);

  const trait1 = profile.trait1;
  const trait2 = profile.trait2;
  const idealsStr = profile.ideal;
  const bondsStr = profile.bond;
  const flawsStr = profile.flaw;

  let raceDisplay;

  if (undeadRace) {
    raceDisplay = `${undeadRace} (${baseRace})`;
    if (undeadRace === "Ghost" || undeadRace === "Specter") {
      weight = 0;
    }
    if (undeadRace === "Skeleton") {
      weight = (weight * 0.12).toFixed(2);
      skin = "N/A";
      hair = "N/A";
      eyes = "N/A";
    }
  } else {
    raceDisplay = subrace ? `${baseRace} (${subrace})` : baseRace;
  }

  const descBox = document.getElementById("npcDescription");
const copyBtn = document.getElementById("copyDescription");

const description = buildPortraitDescription({
  name, gender, race: raceDisplay, subrace,
  age, skin, hair, eyes,
  height: `${heightFeet}'${heightInches}"`,
  weight: `${weight} lbs`,
  background, alignment
});

descBox.innerHTML = `<p>${description.replace("\n\n", "</p><p>")}</p>`;
copyBtn.style.display = "block";

copyBtn.onclick = () => {
  navigator.clipboard.writeText(description).then(() => {
    copyBtn.textContent = "Copied!";
    setTimeout(() => copyBtn.textContent = "Copy Description", 2000);
  });
};

  //stats = ["1","2","3","4","5","6"];
  // Update card
  document.getElementById("str").textContent = stats[0];
  document.getElementById("dex").textContent = stats[1];
  document.getElementById("con").textContent = stats[2];
  document.getElementById("int").textContent = stats[3];
  document.getElementById("wis").textContent = stats[4];
  document.getElementById("cha").textContent = stats[5];

  document.getElementById("charName").textContent = name;
  document.getElementById("charAlignment").textContent = alignment;
  document.getElementById("charBackground").textContent = background;
  document.getElementById("charRace").textContent = raceDisplay;
  document.getElementById("charAge").textContent = age;
  document.getElementById("charGender").textContent = gender;
  document.getElementById("charHeight").textContent = `${heightFeet}'${heightInches}"`;
  document.getElementById("charWeight").textContent = `${weight} lbs`;
  document.getElementById("charSkin").textContent = skin;
  document.getElementById("charHair").textContent = hair;
  document.getElementById("charEyes").textContent = eyes;
  document.getElementById("charTrait1").textContent = trait1;
  document.getElementById("charTrait2").textContent = trait2;
  document.getElementById("charIdeals").textContent = idealsStr;
  document.getElementById("charBonds").textContent = bondsStr;
  document.getElementById("charFlaws").textContent = flawsStr;

  document.getElementById("characterCard")?.classList.remove("hidden");
});