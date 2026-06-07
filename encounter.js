let encounter = {};
fetch("data/encounters.json")
  .then(response => response.json())
  .then(data => encounter = data)
  .catch(error => console.error("Error loading encounters:", error));

function randomItem(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) {
    console.warn("randomItem received invalid array:", arr);
    return null; // or some default value
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

function rollDiceExpression(expr) {
  expr = expr.replace(/\s+/g, ""); // remove internal spaces like "1d6 + 3" -> "1d6+3"
  // plain number
  if (!expr.includes("d")) return parseInt(expr) || 0;

  const match = expr.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!match) return 0;

  const numDice = parseInt(match[1]) || 1;
  const dieSides = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;

  let total = 0;
  for (let i = 0; i < numDice; i++) {
    total += Math.floor(Math.random() * dieSides) + 1;
  }
  return total + modifier;
}

function resolveEncounterQuantities(text) {
  if (!text || typeof text !== "string") return text;

  // Normalize separators so we can split into groups cleanly.
  // Keep parentheses or other punctuation intact.
  const normalized = text
    .replace(/\s*,\s*/g, " | ")     // commas -> |
    .replace(/\s+and\s+/gi, " | ")  // and -> |
    .replace(/\s+with\s+/gi, " | "); // with -> |

  const segments = normalized.split("|").map(s => s.trim()).filter(Boolean);

  const resolvedSegments = segments.map(segment => {
    // Replace all dice expressions (allow optional spaces around +/-)
    const replaced = segment.replace(/(\d*d\d+\s*(?:[+-]\s*\d+)?|\b\d+\b)/gi, (match) => {
      // If it's just a plain number we want to keep it as-is after parse
      const cleaned = match.replace(/\s+/g, "");
      // If cleaned is a pure number (not dice), return that number
      if (!/d/i.test(cleaned)) {
        return (parseInt(cleaned) || 0).toString();
      }
      // Otherwise roll the dice expression
      const total = rollDiceExpression(cleaned);
      return total.toString();
    });

    // Ensure there is a space between a number and a following letter or '(' if missing:
    // "6kobolds" -> "6 kobolds", "1winged kobold" -> "1 winged kobold"
    const withNumberSpacing = replaced.replace(/(\d)(?=[A-Za-z\(])/g, "$1 ");

    // Collapse multiple spaces
    return withNumberSpacing.replace(/\s+/g, " ").trim();
  });

  // Join multiple groups with " with " per your desired format.
  if (resolvedSegments.length <= 1) return resolvedSegments[0] || "";
  return resolvedSegments.join(" with ");
}

function getEncounterType() {
  const sel = document.getElementById('encounter-type-select');
  if (sel) return sel.value;

  // fallback to old radio-group (if still present)
  const radio = document.querySelector('input[name="encounter-type"]:checked');
  if (radio) return radio.value;

  console.warn('Encounter type control missing — defaulting to roleplay');
  return 'social';
}

document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("generate-btn").addEventListener("click", () => {
    const region = document.getElementById("region-select").value;
    const type = getEncounterType();

    for (let i = 1; i <= 4; i++) {
      const tierKey = `tier${i}`;
      const tierData = encounter[region][tierKey];

      if (!tierData) {
        document.getElementById(`tier-${i}-results`).textContent = "— No data available —";
        continue;
      }

      let baseEncounter = "";

      if (type === "any") {
        const encounterTypes = [
          "combat",
          "social",
          "exploration",
          "camping"
        ];

        const chosenType = randomItem(encounterTypes);
        baseEncounter = randomItem(tierData[chosenType]);
      } else {
        baseEncounter = randomItem(tierData[type]);
      }

      // Roll and replace quantities
      const resolvedEncounter = resolveEncounterQuantities(baseEncounter);

      document.getElementById(`tier-${i}-results`).textContent = resolvedEncounter;
    }
  });
})