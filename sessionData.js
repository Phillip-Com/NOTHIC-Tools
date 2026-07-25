// -------------------- SAVED SESSION DATA --------------------
// Reads historical session data back out of the same Google Sheet that
// tracker.js's sendGameDataToGoogleSheet() writes to.

// -------------------- CHARACTER COLOR CODING --------------------

const CHARACTER_COLOR_WHEEL = [
  "#ff8000", "#ffde70", "#a1ff4a", "#4affba", "#4ae1ff",
  "#4a86ff", "#6e4aff", "#d24aff", "#ff4ae1", "#ff4a98"
];
const NPC_COLOR = "#ff0000";

// Assigns each name in display order the next color on the wheel,
// wrapping around past 10 characters. Any sheet with "NPC" in its name
// always gets NPC_COLOR instead, and doesn't consume a wheel slot.
function assignCharacterColors(names) {
  const colors = {};
  let wheelIndex = 0;

  names.forEach(name => {
    if (name.toUpperCase().includes("NPC")) {
      colors[name] = NPC_COLOR;
    } else {
      colors[name] = CHARACTER_COLOR_WHEEL[wheelIndex % CHARACTER_COLOR_WHEEL.length];
      wheelIndex++;
    }
  });

  return colors;
}

// Rounds roll-average values (from the sheet's avgRoll/campaignAvgRoll
// columns) to 2 decimal places for display. Leaves non-numeric values
// (blank cells, etc.) untouched instead of showing "NaN".
function formatRollAverage(value) {
  const num = Number(value);
  if (value === "" || value === null || value === undefined || Number.isNaN(num)) {
    return value ?? "";
  }
  return num.toFixed(2);
}

function extractSheetId(input) {
  if (!input) return "";
  const match = input.match(/\/d\/([A-Za-z0-9\-_]+)/);
  return match?.[1] || input.replace(/[^A-Za-z0-9\-_]/g, "");
}

function ensureSessionDataDefaults() {
  if (!window.userData.sessionData) {
    window.userData.sessionData = { campaigns: {}, activeCampaign: "" };
  }
  if (!window.userData.sessionData.campaigns) {
    window.userData.sessionData.campaigns = {};
  }
}

// -------------------- CAMPAIGN MANAGEMENT --------------------

window.saveCampaign = function () {
  ensureSessionDataDefaults();

  const name = prompt("Campaign name?");
  if (!name) return;

  const sheetInput = prompt("Google Sheet URL (or ID):");
  if (!sheetInput) return;

  const sheetId = extractSheetId(sheetInput);
  if (!sheetId) {
    alert("Couldn't read a sheet ID from that URL.");
    return;
  }

  window.userData.sessionData.campaigns[name] = { sheetId };
  window.userData.sessionData.activeCampaign = name;

  saveUserData();

  populateCampaignDropdown();
  loadActiveCampaignData();
};

window.deleteCampaign = function () {
  ensureSessionDataDefaults();

  const name = window.userData.sessionData.activeCampaign;
  if (!name) {
    alert("Select a campaign first.");
    return;
  }

  if (!confirm(`Delete campaign "${name}"?`)) return;

  delete window.userData.sessionData.campaigns[name];
  window.userData.sessionData.activeCampaign = "";

  saveUserData();

  populateCampaignDropdown();

  const output = document.getElementById("session-data-output");
  if (output) output.innerHTML = "<p>Select or create a campaign to view session data.</p>";
};

function populateCampaignDropdown() {
  ensureSessionDataDefaults();

  const select = document.getElementById("campaign-select");
  if (!select) return;

  select.innerHTML = "";

  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = "-- Select Campaign --";
  select.appendChild(blank);

  Object.keys(window.userData.sessionData.campaigns).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });

  select.value = window.userData.sessionData.activeCampaign || "";
}

// -------------------- FETCH --------------------

// Apps Script web apps don't return usable CORS headers on GET, so a plain
// fetch() gets blocked by the browser. We work around it with JSONP: load
// the URL as a <script> tag (never CORS-blocked) and have the server wrap
// its JSON in a call to a one-off callback function instead of returning
// it directly.
function fetchCampaignData(sheetId, sessionCount) {
  return new Promise((resolve, reject) => {
    const edition = getCurrentEdition();
    const callbackName = `sessionDataCallback_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    const script = document.createElement("script");
    let settled = false;

    const cleanup = () => {
      delete window[callbackName];
      script.remove();
      clearTimeout(timer);
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Timed out waiting for a response from Google Sheets."));
    }, 15000);

    window[callbackName] = (data) => {
      if (settled) return;
      settled = true;
      cleanup();

      if (data.status !== "success") {
        reject(new Error(data.message || "Unknown error from Apps Script."));
        return;
      }
      resolve(data.characters || {});
    };

    script.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Failed to load data from Google Sheets (network or script error)."));
    };

    const url =
      `${APPS_SCRIPT_URL}?action=allHistory` +
      `&sheetId=${encodeURIComponent(sheetId)}` +
      `&n=${encodeURIComponent(sessionCount)}` +
      `&edition=${encodeURIComponent(edition)}` +
      `&callback=${callbackName}`;

    script.src = url;
    document.body.appendChild(script);
  });
}

// -------------------- IMAGE EXPORT --------------------

function getThemeColor(varName, fallback) {
  const value = getComputedStyle(document.body).getPropertyValue(varName).trim();
  return value || fallback;
}

// Draws a titled table onto a canvas element, sized to fit its content.
// Used to turn on-screen data into a downloadable/copyable image, since
// there's no built-in way to rasterize arbitrary DOM to an image and this
// project doesn't pull in any external libraries (e.g. html2canvas).
//
// accentColor (if given) colors the title and column-header text, so
// exported images match the on-screen character color coding. subtitle
// (if given) is drawn as a second line under the title, in the normal
// text color — used for the campaign-average-roll line.
function buildTableCanvas({ title, subtitle, accentColor, headers, rows }) {
  const scale = 2; // draw at 2x for crisper text, then display at 1x
  const cellPadding = 10;
  const rowHeight = 28;
  const headerHeight = 32;
  const titleHeight = subtitle ? 54 : 36;
  const font = "14px Arial, sans-serif";
  const headerFont = "bold 14px Arial, sans-serif";
  const titleFont = "bold 18px Arial, sans-serif";
  const subtitleFont = "13px Arial, sans-serif";

  const bg = getThemeColor("--surfaces", "#1e2329");
  const headerBg = getThemeColor("--elevated", "#2a3138");
  const rowAltBg = getThemeColor("--background", "#121417");
  const text = getThemeColor("--primary-text", "#f2ebdd");
  const gridColor = getThemeColor("--primary-accent", "#6d4aff");
  const titleColor = accentColor || text;

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");

  const colWidths = headers.map((h, i) => {
    measureCtx.font = headerFont;
    let max = measureCtx.measureText(String(h)).width;
    measureCtx.font = font;
    rows.forEach(row => {
      const w = measureCtx.measureText(String(row[i] ?? "")).width;
      if (w > max) max = w;
    });
    return Math.ceil(max) + cellPadding * 2;
  });

  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const tableHeight = titleHeight + headerHeight + rows.length * rowHeight;

  const canvas = document.createElement("canvas");
  canvas.width = tableWidth * scale;
  canvas.height = tableHeight * scale;
  canvas.style.width = `${tableWidth}px`;
  canvas.style.height = `${tableHeight}px`;

  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.textBaseline = "middle";

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, tableWidth, tableHeight);

  // Title (+ optional subtitle line)
  ctx.fillStyle = titleColor;
  ctx.font = titleFont;
  ctx.fillText(title, cellPadding, subtitle ? 20 : titleHeight / 2);

  if (subtitle) {
    ctx.fillStyle = text;
    ctx.font = subtitleFont;
    ctx.fillText(subtitle, cellPadding, 42);
  }

  // Header row
  let y = titleHeight;
  ctx.fillStyle = headerBg;
  ctx.fillRect(0, y, tableWidth, headerHeight);

  let x = 0;
  ctx.fillStyle = titleColor;
  ctx.font = headerFont;
  headers.forEach((h, i) => {
    ctx.fillText(String(h), x + cellPadding, y + headerHeight / 2);
    x += colWidths[i];
  });

  // Data rows
  y += headerHeight;
  ctx.font = font;
  rows.forEach((row, rIdx) => {
    ctx.fillStyle = rIdx % 2 === 0 ? bg : rowAltBg;
    ctx.fillRect(0, y, tableWidth, rowHeight);

    x = 0;
    ctx.fillStyle = text;
    row.forEach((cell, cIdx) => {
      ctx.fillText(String(cell ?? ""), x + cellPadding, y + rowHeight / 2);
      x += colWidths[cIdx];
    });

    y += rowHeight;
  });

  // Grid lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;

  let hy = titleHeight;
  ctx.beginPath();
  ctx.moveTo(0, hy);
  ctx.lineTo(tableWidth, hy);
  ctx.stroke();
  hy += headerHeight;
  for (let i = 0; i <= rows.length; i++) {
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

// One button, two effects: copies the image to the clipboard AND
// downloads it as a PNG file.
async function copyAndSaveImage(canvas, filename) {
  const blobPromise = new Promise(resolve => canvas.toBlob(resolve, "image/png"));

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      // Passing the promise (not an already-resolved blob) lets browsers
      // that require it keep the "triggered by a user click" context alive
      // across the async toBlob() call.
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blobPromise })
      ]);
    }
  } catch (err) {
    console.warn("Clipboard copy failed:", err);
  }

  const blob = await blobPromise;
  if (!blob) {
    alert("Failed to generate image.");
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// -------------------- DISPLAY --------------------

// Only show sheet tabs whose name matches an actual character in the
// tracker (gameData.characters) — filters out anything else the sheet
// might contain (old characters, unrelated tabs, typos, etc.).
function filterToTrackerCharacters(charactersData) {
  const trackerNames = new Set(
    (gameData?.characters || []).map(n => n.trim().normalize())
  );

  const filtered = {};
  Object.entries(charactersData).forEach(([name, characterData]) => {
    if (trackerNames.has(name.trim().normalize())) {
      filtered[name] = characterData;
    }
  });
  return filtered;
}

function renderSessionData(charactersData) {
  const output = document.getElementById("session-data-output");
  if (!output) return;

  output.innerHTML = "";

  const names = Object.keys(charactersData);
  if (names.length === 0) {
    output.innerHTML = "<p>No session data found for this campaign.</p>";
    return;
  }

  const characterColors = assignCharacterColors(names);

  names.forEach(name => {
    const { campaignAvgRoll, columnLabels, sessions: rawSessions } = charactersData[name] || {};
    const sessions = [...(rawSessions || [])].reverse();
    if (sessions.length === 0) return;

    const color = characterColors[name];

    const card = document.createElement("div");
    card.className = "panel";
    card.style.marginBottom = "16px";
    card.style.overflowX = "auto";

    const cardHeader = document.createElement("div");
    cardHeader.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:10px;";

    const titleGroup = document.createElement("div");

    const title = document.createElement("h3");
    title.textContent = name;
    title.style.margin = "0";
    title.style.color = color;
    titleGroup.appendChild(title);

    const subtitleText = campaignAvgRoll !== "" && campaignAvgRoll !== undefined && campaignAvgRoll !== null
      ? `Campaign Average Roll: ${formatRollAverage(campaignAvgRoll)}`
      : "";

    if (subtitleText) {
      const subtitleEl = document.createElement("div");
      subtitleEl.textContent = subtitleText;
      subtitleEl.style.cssText = "font-size:0.85rem;opacity:0.8;margin-top:2px;";
      titleGroup.appendChild(subtitleEl);
    }

    cardHeader.appendChild(titleGroup);

    const statKeys = Object.keys(sessions[0]).filter(k => k !== "sessionNumber");
    const dataKeys = ["sessionNumber", ...statKeys];

    // Column labels come from row 3 of the sheet when available (same
    // columns as the data itself), falling back to the raw key name for
    // older cached data or blank label cells.
    const tableHeaders = dataKeys.map(key => columnLabels?.[key] || key);

    const tableRows = sessions.map(session =>
      dataKeys.map(key =>
        key === "avgRoll" ? formatRollAverage(session[key]) : (session[key] ?? "")
      )
    );

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "📋 Copy/Save Image";
    copyBtn.onclick = () => {
      const canvas = buildTableCanvas({
        title: name,
        subtitle: subtitleText,
        accentColor: color,
        headers: tableHeaders,
        rows: tableRows
      });
      copyAndSaveImage(canvas, `${name}-sessions.png`);
    };
    cardHeader.appendChild(copyBtn);

    card.appendChild(cardHeader);

    const table = document.createElement("table");

    const headerRow = document.createElement("tr");
    tableHeaders.forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      th.style.color = color;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    tableRows.forEach(rowValues => {
      const row = document.createElement("tr");
      rowValues.forEach(value => {
        const td = document.createElement("td");
        td.textContent = value;
        row.appendChild(td);
      });
      table.appendChild(row);
    });

    card.appendChild(table);
    output.appendChild(card);
  });
}

async function loadActiveCampaignData() {
  ensureSessionDataDefaults();

  const output = document.getElementById("session-data-output");
  const name = window.userData.sessionData.activeCampaign;

  if (!name) {
    if (output) output.innerHTML = "<p>Select or create a campaign to view session data.</p>";
    return;
  }

  const campaign = window.userData.sessionData.campaigns[name];
  if (!campaign?.sheetId) {
    if (output) output.innerHTML = "<p>This campaign has no linked sheet.</p>";
    return;
  }

  const sessionCount = parseInt(document.getElementById("session-count-input")?.value, 10) || 5;

  if (output) output.innerHTML = "<p>Loading…</p>";

  try {
    const charactersData = await fetchCampaignData(campaign.sheetId, sessionCount);
    const filtered = filterToTrackerCharacters(charactersData);

    if (Object.keys(charactersData).length > 0 && Object.keys(filtered).length === 0) {
      if (output) output.innerHTML = "<p>None of this sheet's tabs match a character in your tracker.</p>";
      return;
    }

    renderSessionData(filtered);
  } catch (err) {
    console.error(err);
    if (output) output.innerHTML = `<p>Failed to load session data: ${err.message}</p>`;
  }
}

function populateSessionDataTab() {
  populateCampaignDropdown();
  loadActiveCampaignData();
}

// -------------------- WIRING --------------------

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("new-campaign-btn")?.addEventListener("click", window.saveCampaign);
  document.getElementById("delete-campaign-btn")?.addEventListener("click", window.deleteCampaign);
  document.getElementById("refresh-session-data-btn")?.addEventListener("click", loadActiveCampaignData);

  document.getElementById("campaign-select")?.addEventListener("change", (e) => {
    ensureSessionDataDefaults();
    window.userData.sessionData.activeCampaign = e.target.value;
    saveUserData();
    loadActiveCampaignData();
  });
});
