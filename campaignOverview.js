// -------------------- CAMPAIGN OVERVIEW --------------------
// Sits above the Saved Session Data tables: a "campaign titles" table
// (who holds the highest/lowest campaign total for each tracked stat)
// plus two pie charts breaking down total D20 rolls per character/NPC,
// stacked vertically into one exported image (stackChartsVertically)
// instead of two side-by-side ones, so they don't squeeze the titles
// table into a narrow column.
// Reuses the same fetched Google Sheet session data as sessionData.js
// (assignCharacterColors, getThemeColor, copyAndSaveImage all live there
// and are loaded first, so this file can call them directly).

// -------------------- STAT TITLES CONFIG --------------------

const CAMPAIGN_STAT_ROWS = [
  { key: "attacksMade",      label: "Attack Rolls",      highest: "ORA!",                        lowest: "Pacifist" },
  { key: "abilityChecks",    label: "Ability Checks",    highest: "Skill Monkey",                 lowest: "NO ABILITY?" },
  { key: "savingThrows",     label: "Saving Throws",     highest: "Throw Those Saves",            lowest: "Throw Those Saves... not at me" },
  { key: "spellsCast",       label: "Spells",            highest: "Look at You Magic Man",        lowest: "Normie" },
  { key: "initiativeRolls",  label: "Initiative",        highest: "Fast Reflex",                  lowest: "Not Fast Reflex" },
  { key: "totalD20Rolls",    label: "D20 Rolls",         highest: "High Roller",                  lowest: "Low Roller" },
  { key: "totalModD20Rolls", label: "Modded D20 Rolls",  highest: "All the Dice",                 lowest: "Low Dice" },
  { key: "timesKilled",      label: "Times Killed",      highest: "Oof",                          lowest: "Yah!" },
  { key: "natural1s",        label: "Nat 1",             highest: "That's Rough Buddy",           lowest: "Go Touch Grass" },
  { key: "natural20s",       label: "Nat 20",            highest: "Lucky",                        lowest: "That Sucks" },
  { key: "totalDamage",      label: "Damage",            highest: "Now That's a Lot of Damage!",  lowest: "Pfft, Weak" },
  { key: "totalHealing",     label: "Healing",           highest: "MEDIC!",                       lowest: "What Can I Say Except, I Attack" },
  { key: "moneySpent",       label: "Money Spent",       highest: "Ok Rich",                       lowest: "I'm Not Made of Money" }
];

const CAMPAIGN_STAT_ROWS_PATHFINDER = [
  { key: "concentrationChecks",   label: "Concentration Checks", highest: "Focused",      lowest: "ADHDND" },
  { key: "totalSpellResistance",  label: "Spell Resistance",     highest: "Dodged Magic",  lowest: "Spell Scarce" }
];

// Which stats the two "percentage of rolls" pie charts are built from.
// totalD20Rolls is the SUM of face values rolled (a "=15+8+20+..." sheet
// formula), not a count — so "total rolls" instead adds up every column
// that's an actual roll count. concentrationChecks/totalSpellResistance
// are simply absent from 5e sessions, so they contribute 0 there.
const ROLL_CHART_STAT_KEYS = [
  "attacksMade",
  "abilityChecks",
  "savingThrows",
  "concentrationChecks",
  "totalSpellResistance"
];

// -------------------- DATA AGGREGATION --------------------

// Sums every numeric stat column across all of a character's fetched
// sessions, giving campaign-to-date totals (each sheet row is one
// session's stats, reset at session start via resetAllSessionStats()).
function computeCampaignTotals(charactersData) {
  const totals = {};

  Object.entries(charactersData).forEach(([name, data]) => {
    const sums = {};
    (data.sessions || []).forEach(session => {
      Object.entries(session).forEach(([key, value]) => {
        if (key === "sessionNumber" || key === "avgRoll") return;
        const num = Number(value);
        sums[key] = (sums[key] || 0) + (Number.isNaN(num) ? 0 : num);
      });
    });
    totals[name] = sums;
  });

  return totals;
}

// -------------------- TITLES TABLE --------------------

// A tied record (two or more characters sharing the highest/lowest
// total) has no single title-holder, so it's rendered in this neutral
// color instead of any character's color.
const TIED_RECORD_COLOR = "#ffffff";

// Reduces each stat down to who holds the highest/lowest campaign total
// and what that record's joke title is — shared by the DOM table and
// the exported canvas image so they never drift apart. Ties (multiple
// characters sharing the extreme value) are flagged rather than
// arbitrarily picking a "winner".
function computeCampaignTitleRows(charactersData, characterColors) {
  // NPC sheets never hold a highest/lowest title — only real characters
  // are eligible, same as the "without NPCs" roll chart.
  const names = Object.keys(charactersData).filter(name => !name.toUpperCase().includes("NPC"));
  const totals = computeCampaignTotals(charactersData);
  const statRows = CAMPAIGN_STAT_ROWS.concat(
    getCurrentEdition() === "pathfinder" ? CAMPAIGN_STAT_ROWS_PATHFINDER : []
  );

  return statRows.map(statRow => {
    const valueFor = (name) => totals[name]?.[statRow.key] ?? 0;

    let highestValue = -Infinity;
    let lowestValue = Infinity;

    names.forEach(name => {
      const value = valueFor(name);
      if (value > highestValue) highestValue = value;
      if (value < lowestValue) lowestValue = value;
    });

    const highestNames = names.filter(name => valueFor(name) === highestValue);
    const lowestNames = names.filter(name => valueFor(name) === lowestValue);
    const highestTied = highestNames.length > 1;
    const lowestTied = lowestNames.length > 1;

    return {
      label: statRow.label,
      highest: {
        text: statRow.highest,
        names: highestNames,
        value: highestValue,
        tied: highestTied,
        color: highestTied ? TIED_RECORD_COLOR : characterColors[highestNames[0]]
      },
      lowest: {
        text: statRow.lowest,
        names: lowestNames,
        value: lowestValue,
        tied: lowestTied,
        color: lowestTied ? TIED_RECORD_COLOR : characterColors[lowestNames[0]]
      }
    };
  });
}

function renderCampaignTitlesTable(charactersData, characterColors) {
  const container = document.getElementById("campaign-titles-output");
  if (!container) return;

  const names = Object.keys(charactersData);
  if (names.length === 0) {
    container.innerHTML = "<p>No session data found for this campaign.</p>";
    return;
  }

  const titleRows = computeCampaignTitleRows(charactersData, characterColors);

  const table = document.createElement("table");
  table.className = "compact-table";

  const headerRow = document.createElement("tr");
  ["Stat", "Highest", "Lowest"].forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  titleRows.forEach(row => {
    const tr = document.createElement("tr");

    const statTd = document.createElement("td");
    statTd.textContent = row.label;
    statTd.style.textAlign = "left";
    tr.appendChild(statTd);

    const highestTd = document.createElement("td");
    highestTd.textContent = row.highest.text;
    highestTd.style.color = row.highest.color;
    highestTd.style.fontWeight = "bold";
    highestTd.title = `${row.highest.names.join(", ")}: ${row.highest.value}${row.highest.tied ? " (tied)" : ""}`;
    tr.appendChild(highestTd);

    const lowestTd = document.createElement("td");
    lowestTd.textContent = row.lowest.text;
    lowestTd.style.color = row.lowest.color;
    lowestTd.style.fontWeight = "bold";
    lowestTd.title = `${row.lowest.names.join(", ")}: ${row.lowest.value}${row.lowest.tied ? " (tied)" : ""}`;
    tr.appendChild(lowestTd);

    table.appendChild(tr);
  });

  container.innerHTML = "";

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "📋 Save Image";
  copyBtn.style.display = "block";
  copyBtn.style.marginBottom = "8px";
  copyBtn.onclick = () => {
    const canvas = buildTitlesTableCanvas(titleRows);
    copyAndSaveImage(canvas, "campaign-titles.png");
  };
  container.appendChild(copyBtn);

  container.appendChild(table);
}

// Draws the campaign titles table onto a canvas (same visual language as
// buildTableCanvas in sessionData.js), coloring the Highest/Lowest cells
// with the record-holder's character color instead of a single accent.
function buildTitlesTableCanvas(titleRows) {
  const scale = 2;
  const cellPadding = 8;
  const rowHeight = 24;
  const headerHeight = 26;
  const titleHeight = 32;
  const font = "13px Arial, sans-serif";
  const headerFont = "bold 13px Arial, sans-serif";
  const titleFont = "bold 16px Arial, sans-serif";

  const bg = getThemeColor("--surfaces", "#1e2329");
  const headerBg = getThemeColor("--elevated", "#2a3138");
  const rowAltBg = getThemeColor("--background", "#121417");
  const text = getThemeColor("--primary-text", "#f2ebdd");
  const gridColor = getThemeColor("--primary-accent", "#6d4aff");

  const headers = ["Stat", "Highest", "Lowest"];
  const cellText = (row, colIndex) =>
    colIndex === 0 ? row.label : colIndex === 1 ? row.highest.text : row.lowest.text;

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");

  const colWidths = headers.map((h, i) => {
    measureCtx.font = headerFont;
    let max = measureCtx.measureText(h).width;
    measureCtx.font = font;
    titleRows.forEach(row => {
      const w = measureCtx.measureText(cellText(row, i)).width;
      if (w > max) max = w;
    });
    return Math.ceil(max) + cellPadding * 2;
  });

  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const tableHeight = titleHeight + headerHeight + titleRows.length * rowHeight;

  const canvas = document.createElement("canvas");
  canvas.width = tableWidth * scale;
  canvas.height = tableHeight * scale;
  canvas.style.width = `${tableWidth}px`;
  canvas.style.height = `${tableHeight}px`;

  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.textBaseline = "middle";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, tableWidth, tableHeight);

  ctx.fillStyle = text;
  ctx.font = titleFont;
  ctx.textAlign = "left";
  ctx.fillText("Campaign Titles", cellPadding, titleHeight / 2);

  let y = titleHeight;
  ctx.fillStyle = headerBg;
  ctx.fillRect(0, y, tableWidth, headerHeight);

  let x = 0;
  ctx.fillStyle = text;
  ctx.font = headerFont;
  headers.forEach((h, i) => {
    ctx.fillText(h, x + cellPadding, y + headerHeight / 2);
    x += colWidths[i];
  });

  y += headerHeight;
  ctx.font = font;
  titleRows.forEach((row, rIdx) => {
    ctx.fillStyle = rIdx % 2 === 0 ? bg : rowAltBg;
    ctx.fillRect(0, y, tableWidth, rowHeight);

    x = 0;
    ctx.fillStyle = text;
    ctx.fillText(row.label, x + cellPadding, y + rowHeight / 2);
    x += colWidths[0];

    ctx.fillStyle = row.highest.color || text;
    ctx.fillText(row.highest.text, x + cellPadding, y + rowHeight / 2);
    x += colWidths[1];

    ctx.fillStyle = row.lowest.color || text;
    ctx.fillText(row.lowest.text, x + cellPadding, y + rowHeight / 2);

    y += rowHeight;
  });

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;

  let hy = titleHeight;
  ctx.beginPath();
  ctx.moveTo(0, hy);
  ctx.lineTo(tableWidth, hy);
  ctx.stroke();
  hy += headerHeight;
  for (let i = 0; i <= titleRows.length; i++) {
    ctx.beginPath();
    ctx.moveTo(0, hy);
    ctx.lineTo(tableWidth, hy);
    ctx.stroke();
    hy += rowHeight;
  }

  let vx = 0;
  colWidths.forEach(w => {
    ctx.beginPath();
    ctx.moveTo(vx, titleHeight);
    ctx.lineTo(vx, tableHeight);
    ctx.stroke();
    vx += w;
  });
  ctx.beginPath();
  ctx.moveTo(vx, titleHeight);
  ctx.lineTo(vx, tableHeight);
  ctx.stroke();

  return canvas;
}

// -------------------- ROLL PERCENTAGE PIE CHARTS --------------------

// Draws a titled pie chart onto a canvas: colored slices (matching the
// session-data character color coding) with the raw count inside each
// slice, and a name + percentage label outside, connected by a leader
// line — mirroring the Google Sheets pie charts this feature replicates.
function drawPieChart({ title, entries, colors }) {
  const scale = 2;
  const radius = 100;
  const topPadding = 50;
  const bottomPadding = 30;
  const labelRowHeight = 30;
  const labelZoneWidth = 150;
  const canvasWidth = radius * 2 + labelZoneWidth * 2 + 40;

  const bg = getThemeColor("--surfaces", "#1e2329");
  const text = getThemeColor("--primary-text", "#f2ebdd");
  const secondaryText = getThemeColor("--secondary-text", "#b8b2a7");

  const total = entries.reduce((sum, e) => sum + e.value, 0);

  let angle = -Math.PI / 2;
  const slices = entries.map(e => {
    const sliceAngle = total > 0 ? (e.value / total) * Math.PI * 2 : 0;
    const midAngle = angle + sliceAngle / 2;
    const slice = {
      name: e.name,
      value: e.value,
      percent: total > 0 ? (e.value / total) * 100 : 0,
      startAngle: angle,
      endAngle: angle + sliceAngle,
      midAngle
    };
    angle += sliceAngle;
    return slice;
  });

  const bySin = (a, b) => Math.sin(a.midAngle) - Math.sin(b.midAngle);
  const rightSlices = slices.filter(s => Math.cos(s.midAngle) >= 0).sort(bySin);
  const leftSlices = slices.filter(s => Math.cos(s.midAngle) < 0).sort(bySin);

  // Raw label offsets from center, then pushed apart top-to-bottom so
  // labels for adjacent thin slices don't overlap.
  const assignLabelOffsets = (arr) => {
    arr.forEach(s => { s.labelOffsetY = Math.sin(s.midAngle) * (radius + 40); });
    for (let i = 1; i < arr.length; i++) {
      const minY = arr[i - 1].labelOffsetY + labelRowHeight;
      if (arr[i].labelOffsetY < minY) arr[i].labelOffsetY = minY;
    }
  };
  assignLabelOffsets(rightSlices);
  assignLabelOffsets(leftSlices);

  const allOffsets = [...rightSlices, ...leftSlices].map(s => s.labelOffsetY);
  const minOffset = Math.min(-radius, ...allOffsets, 0);
  const maxOffset = Math.max(radius, ...allOffsets, 0);
  const halfTop = Math.abs(minOffset) + labelRowHeight / 2;
  const halfBottom = maxOffset + labelRowHeight / 2;

  const cx = canvasWidth / 2;
  const cy = topPadding + halfTop;
  const canvasHeight = topPadding + halfTop + halfBottom + bottomPadding;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth * scale;
  canvas.height = canvasHeight * scale;
  // Cap the display size at the chart's natural dimensions, but let it
  // shrink to fit a narrower container (height auto keeps the aspect
  // ratio) instead of overflowing and forcing a horizontal scrollbar.
  canvas.style.width = "100%";
  canvas.style.maxWidth = `${canvasWidth}px`;
  canvas.style.height = "auto";

  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.fillStyle = text;
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(title, 16, 28);

  // Slices
  slices.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, s.startAngle, s.endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[s.name] || "#888888";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = bg;
    ctx.stroke();
  });

  // In-slice value labels
  slices.forEach(s => {
    if (s.percent <= 0) return;
    const labelRadius = radius * 0.62;
    const lx = cx + Math.cos(s.midAngle) * labelRadius;
    const ly = cy + Math.sin(s.midAngle) * labelRadius;
    ctx.fillStyle = "#000000";
    ctx.font = s.percent < 6 ? "bold 11px Arial, sans-serif" : "bold 15px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(s.value), lx, ly);
  });

  // Leader lines + name/percentage labels
  const drawSideLabels = (arr, side) => {
    arr.forEach(s => {
      const edgeX = cx + Math.cos(s.midAngle) * radius;
      const edgeY = cy + Math.sin(s.midAngle) * radius;
      const dotX = cx + side * (radius + 16);
      const dotY = cy + s.labelOffsetY;
      const textX = cx + side * (radius + 26);

      ctx.strokeStyle = secondaryText;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(edgeX, edgeY);
      ctx.lineTo(dotX, dotY);
      ctx.stroke();

      ctx.fillStyle = secondaryText;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = side > 0 ? "left" : "right";
      ctx.textBaseline = "alphabetic";

      ctx.fillStyle = text;
      ctx.font = "bold 15px Arial, sans-serif";
      ctx.fillText(s.name, textX, dotY - 4);

      ctx.fillStyle = secondaryText;
      ctx.font = "13px Arial, sans-serif";
      ctx.fillText(`${s.percent.toFixed(1)}%`, textX, dotY + 13);
    });
  };

  drawSideLabels(rightSlices, 1);
  drawSideLabels(leftSlices, -1);

  // Logical (unscaled) width/height alongside the canvas, so callers can
  // composite this onto a larger canvas without re-deriving the size from
  // a scaled canvas.width/height or an "auto" CSS height.
  return { canvas, width: canvasWidth, height: canvasHeight };
}

// Stacks two already-drawn pie-chart canvases vertically into one new
// canvas — used so both roll-percentage charts export as a single image
// instead of two, and so the on-screen version takes up one column
// instead of two side by side (which was squishing the titles table).
function stackChartsVertically(charts) {
  const scale = 2;
  const gap = 16;

  const width = Math.max(...charts.map(c => c.width));
  const height = charts.reduce((sum, c) => sum + c.height, 0) + gap * (charts.length - 1);

  const bg = getThemeColor("--surfaces", "#1e2329");

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = "100%";
  canvas.style.maxWidth = `${width}px`;
  canvas.style.height = "auto";

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let y = 0;
  charts.forEach(chart => {
    ctx.drawImage(chart.canvas, 0, y * scale, chart.width * scale, chart.height * scale);
    y += chart.height + gap;
  });

  return canvas;
}

function renderRollCharts(charactersData, characterColors) {
  const container = document.getElementById("campaign-rolls-chart-container");
  if (!container) return;

  container.innerHTML = "";

  const totals = computeCampaignTotals(charactersData);
  const names = Object.keys(charactersData);

  const totalRollsFor = (name) =>
    ROLL_CHART_STAT_KEYS.reduce((sum, key) => sum + (totals[name]?.[key] ?? 0), 0);

  const allEntries = names
    .map(name => ({ name, value: totalRollsFor(name) }))
    .filter(e => e.value > 0);

  const pcEntries = allEntries.filter(e => !e.name.toUpperCase().includes("NPC"));

  if (allEntries.length === 0) {
    container.innerHTML = "<p>No roll data to chart.</p>";
    return;
  }

  const withNpcsChart = drawPieChart({ title: "Percentage of Rolls With NPCs", entries: allEntries, colors: characterColors });
  const withoutNpcsChart = drawPieChart({ title: "Percentage of Rolls", entries: pcEntries, colors: characterColors });

  const combined = stackChartsVertically([withNpcsChart, withoutNpcsChart]);

  const btn = document.createElement("button");
  btn.textContent = "📋 Save Image";
  btn.style.display = "block";
  btn.style.marginBottom = "8px";
  btn.onclick = () => copyAndSaveImage(combined, "campaign-rolls.png");
  container.appendChild(btn);

  container.appendChild(combined);
}

// -------------------- ORCHESTRATION --------------------

function renderCampaignOverview(charactersData) {
  const names = Object.keys(charactersData);
  const characterColors = assignCharacterColors(names);

  renderCampaignTitlesTable(charactersData, characterColors);
  renderRollCharts(charactersData, characterColors);
}

function resetCampaignOverview(message) {
  const titles = document.getElementById("campaign-titles-output");
  if (titles) titles.innerHTML = `<p>${message}</p>`;

  const chartContainer = document.getElementById("campaign-rolls-chart-container");
  if (chartContainer) chartContainer.innerHTML = "";
}
