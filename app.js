const STORAGE_KEY = "guitar-practice-records";
const GP_STORAGE_KEY = "guitar-pro-links";
const DIRE_STRAITS_SONGS = [
  "Tunnel of Love",
  "Lady Writer",
  "Sultans of Swing",
  "Down to the Waterline",
  "Water of Love",
  "Six Blade Knife",
  "Once Upon a Time in the West",
  "Single-Handed Sailor",
  "Romeo and Juliet",
  "Skateaway",
  "Expresso Love",
  "Telegraph Road",
  "Private Investigations",
  "Industrial Disease",
  "Money for Nothing",
  "Walk of Life",
  "So Far Away",
  "Brothers in Arms",
];
const SONG_TARGET_BPM = {
  "Tunnel of Love": 120,
  "Lady Writer": 120,
  "Sultans of Swing": 140,
  "Walk of Life": 172,
  "Brothers in Arms": 80,
};
const DEFAULT_CURRENT_RECORD = {
  song: "Tunnel of Love",
  bpm: 95,
  progress: 70,
  date: "2026-06-09",
};

const form = document.querySelector("#practiceForm");
const entryId = document.querySelector("#entryId");
const songInput = document.querySelector("#songInput");
const bpmInput = document.querySelector("#bpmInput");
const dateInput = document.querySelector("#dateInput");
const durationInput = document.querySelector("#durationInput");
const progressInput = document.querySelector("#progressInput");
const progressOutput = document.querySelector("#progressOutput");
const submitButton = document.querySelector("#submitButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const recordsBody = document.querySelector("#recordsBody");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const sortSelect = document.querySelector("#sortSelect");
const songPresetButtons = document.querySelectorAll("[data-song]");

const totalCount = document.querySelector("#totalCount");
const averageBpm = document.querySelector("#averageBpm");
const averageProgress = document.querySelector("#averageProgress");
const latestDate = document.querySelector("#latestDate");
const totalDuration = document.querySelector("#totalDuration");
const streakDays = document.querySelector("#streakDays");
const currentSong = document.querySelector("#currentSong");
const currentDate = document.querySelector("#currentDate");
const currentBpm = document.querySelector("#currentBpm");
const currentTargetBpm = document.querySelector("#currentTargetBpm");
const currentProgressBar = document.querySelector("#currentProgressBar");
const currentProgressText = document.querySelector("#currentProgressText");

const bpmChart = document.querySelector("#bpmChart");
const durationChart = document.querySelector("#durationChart");
const bpmChartEmpty = document.querySelector("#bpmChartEmpty");
const durationChartEmpty = document.querySelector("#durationChartEmpty");

const gpForm = document.querySelector("#gpForm");
const gpId = document.querySelector("#gpId");
const gpSongInput = document.querySelector("#gpSongInput");
const gpNameInput = document.querySelector("#gpNameInput");
const gpUrlInput = document.querySelector("#gpUrlInput");
const gpSubmitButton = document.querySelector("#gpSubmitButton");
const gpCancelButton = document.querySelector("#gpCancelButton");
const gpList = document.querySelector("#gpList");
const gpEmptyState = document.querySelector("#gpEmptyState");

let records = migrateRecords(loadItems(STORAGE_KEY));
let gpLinks = loadItems(GP_STORAGE_KEY);

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function today() {
  const offset = new Date().getTimezoneOffset();
  const local = new Date(Date.now() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function loadItems(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveItems(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function migrateRecords(items) {
  const migrated = items.map((record) => ({
    ...record,
    duration: Number(record.duration) || 30,
  }));
  if (JSON.stringify(items) !== JSON.stringify(migrated)) saveItems(STORAGE_KEY, migrated);
  return migrated;
}

function formatDate(value) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${value}T00:00:00`));
}

function formatMinutes(minutes) {
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`;
}

function addDays(dateValue, offset) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function calculateStreak() {
  const uniqueDates = new Set(records.map((record) => record.date).filter(Boolean));
  if (uniqueDates.size === 0) return 0;

  let streak = 0;
  let cursor = [...uniqueDates].sort().at(-1);
  while (uniqueDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function setDefaultDate() {
  dateInput.value = today();
}

function setSong(value) {
  songInput.value = value;
  gpSongInput.value = value;
}

function resetForm() {
  form.reset();
  entryId.value = "";
  progressInput.value = 50;
  progressOutput.value = "50%";
  durationInput.value = 30;
  submitButton.textContent = "保存记录";
  cancelEditButton.hidden = true;
  setDefaultDate();
  songInput.focus();
}

function resetGpForm() {
  gpForm.reset();
  gpId.value = "";
  gpSubmitButton.textContent = "保存链接";
  gpCancelButton.hidden = true;
}

function getFilteredRecords() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = records.filter((record) => record.song.toLowerCase().includes(query));

  return filtered.sort((a, b) => {
    if (sortSelect.value === "dateAsc") return a.date.localeCompare(b.date);
    if (sortSelect.value === "progressDesc") return b.progress - a.progress;
    if (sortSelect.value === "bpmDesc") return b.bpm - a.bpm;
    if (sortSelect.value === "durationDesc") return b.duration - a.duration;
    return b.date.localeCompare(a.date);
  });
}

function getSongStats(song) {
  const songRecords = records.filter((record) => record.song === song);
  const latest = songRecords.map((record) => record.date).sort().at(-1);
  const maxBpm = Math.max(0, ...songRecords.map((record) => record.bpm));
  const minutes = songRecords.reduce((sum, record) => sum + record.duration, 0);

  return {
    count: songRecords.length,
    latest: latest ? formatDate(latest) : "--",
    maxBpm,
    minutes,
  };
}

function renderSummary() {
  const minutes = records.reduce((sum, record) => sum + record.duration, 0);
  totalCount.textContent = records.length;
  totalDuration.textContent = formatMinutes(minutes);
  streakDays.textContent = `${calculateStreak()} 天`;

  if (records.length === 0) {
    averageBpm.textContent = "0";
    averageProgress.textContent = "0%";
    latestDate.textContent = "--";
    return;
  }

  const bpmTotal = records.reduce((sum, record) => sum + record.bpm, 0);
  const progressTotal = records.reduce((sum, record) => sum + record.progress, 0);
  const latest = records.map((record) => record.date).sort().at(-1);

  averageBpm.textContent = Math.round(bpmTotal / records.length);
  averageProgress.textContent = `${Math.round(progressTotal / records.length)}%`;
  latestDate.textContent = formatDate(latest);
}

function renderSongPresets() {
  for (const button of songPresetButtons) {
    const stats = getSongStats(button.dataset.song);
    button.innerHTML = `
      <strong>${button.dataset.song}</strong>
      <span>${stats.count} 次 · 最高 ${stats.maxBpm || "--"} BPM · ${formatMinutes(stats.minutes)}</span>
    `;
  }
}

function getCurrentRecord() {
  return [...records].sort((a, b) => b.date.localeCompare(a.date))[0] || DEFAULT_CURRENT_RECORD;
}

function renderCurrentPractice() {
  const record = getCurrentRecord();
  const target = SONG_TARGET_BPM[record.song] || Math.max(120, record.bpm);

  currentSong.textContent = record.song;
  currentDate.textContent = formatDate(record.date);
  currentBpm.textContent = record.bpm;
  currentTargetBpm.textContent = target;
  currentProgressBar.style.width = `${record.progress}%`;
  currentProgressText.textContent = `完成度 ${record.progress}%`;
}

function renderRecords() {
  const rows = getFilteredRecords();
  recordsBody.innerHTML = "";
  emptyState.hidden = rows.length > 0;

  for (const record of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="song-cell"></td>
      <td>${record.bpm}</td>
      <td>
        <span class="progress-pill">
          <span class="progress-bar"><span style="width: ${record.progress}%"></span></span>
          <strong>${record.progress}%</strong>
        </span>
      </td>
      <td>${formatMinutes(record.duration)}</td>
      <td>${formatDate(record.date)}</td>
      <td>
        <span class="row-actions">
          <button type="button" data-action="edit" data-id="${record.id}">编辑</button>
          <button class="danger" type="button" data-action="delete" data-id="${record.id}">删除</button>
        </span>
      </td>
    `;
    tr.querySelector(".song-cell").textContent = record.song;
    recordsBody.append(tr);
  }

  renderSummary();
  renderCurrentPractice();
  renderSongPresets();
  renderCharts();
}

function upsertRecord(event) {
  event.preventDefault();

  const payload = {
    id: entryId.value || createId(),
    song: songInput.value.trim(),
    bpm: Number(bpmInput.value),
    progress: Number(progressInput.value),
    duration: Number(durationInput.value),
    date: dateInput.value,
  };

  if (!payload.song || Number.isNaN(payload.bpm) || Number.isNaN(payload.duration) || !payload.date) return;

  const index = records.findIndex((record) => record.id === payload.id);
  if (index >= 0) {
    records[index] = payload;
  } else {
    records.unshift(payload);
  }

  saveItems(STORAGE_KEY, records);
  renderRecords();
  resetForm();
}

function editRecord(id) {
  const record = records.find((item) => item.id === id);
  if (!record) return;

  entryId.value = record.id;
  songInput.value = record.song;
  bpmInput.value = record.bpm;
  durationInput.value = record.duration;
  progressInput.value = record.progress;
  progressOutput.value = `${record.progress}%`;
  dateInput.value = record.date;
  submitButton.textContent = "更新记录";
  cancelEditButton.hidden = false;
  songInput.focus();
}

function deleteRecord(id) {
  records = records.filter((record) => record.id !== id);
  saveItems(STORAGE_KEY, records);
  renderRecords();
  if (entryId.value === id) resetForm();
}

function getChartContext(canvas) {
  const scale = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(320, Math.floor(rect.width * scale));
  canvas.height = Math.floor(280 * scale);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  return { ctx, width: rect.width, height: 280 };
}

function drawAxes(ctx, width, height, maxValue, unit) {
  const padding = { top: 18, right: 18, bottom: 38, left: 46 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(160, 168, 179, 0.22)";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#a0a8b3";
  ctx.font = "12px system-ui, sans-serif";

  for (let index = 0; index <= 4; index += 1) {
    const y = padding.top + (chartHeight / 4) * index;
    const value = Math.round(maxValue - (maxValue / 4) * index);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.fillText(`${value}${unit}`, 6, y + 4);
  }

  return { padding, chartWidth, chartHeight };
}

function drawBpmChart() {
  const rows = [...records].sort((a, b) => `${a.date}-${a.song}`.localeCompare(`${b.date}-${b.song}`));
  bpmChartEmpty.hidden = rows.length > 0;
  if (rows.length === 0) {
    bpmChart.getContext("2d").clearRect(0, 0, bpmChart.width, bpmChart.height);
    return;
  }

  const { ctx, width, height } = getChartContext(bpmChart);
  const maxBpm = Math.max(120, ...rows.map((record) => record.bpm));
  const { padding, chartWidth, chartHeight } = drawAxes(ctx, width, height, maxBpm, "");
  const colors = ["#d4af37", "#f5f5f5", "#7f8a96", "#a0a8b3"];
  const songs = [...new Set(rows.map((record) => record.song))];

  songs.forEach((song, songIndex) => {
    const songRows = rows.filter((record) => record.song === song);
    const color = DIRE_STRAITS_SONGS.includes(song) ? colors[DIRE_STRAITS_SONGS.indexOf(song) % colors.length] : colors[(songIndex + 2) % colors.length];

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    songRows.forEach((record, index) => {
      const x = padding.left + (chartWidth / Math.max(1, songRows.length - 1)) * index;
      const y = padding.top + chartHeight - (record.bpm / maxBpm) * chartHeight;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    songRows.forEach((record, index) => {
      const x = padding.left + (chartWidth / Math.max(1, songRows.length - 1)) * index;
      const y = padding.top + chartHeight - (record.bpm / maxBpm) * chartHeight;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      if (index === songRows.length - 1) {
        ctx.fillText(song, Math.min(width - padding.right - 92, x + 8), y - 8);
      }
    });
  });

  ctx.fillStyle = "#a0a8b3";
  ctx.fillText(formatDate(rows[0].date), padding.left, height - 12);
  ctx.fillText(formatDate(rows.at(-1).date), width - padding.right - 92, height - 12);
}

function drawDurationChart() {
  const byDate = records.reduce((map, record) => {
    map.set(record.date, (map.get(record.date) || 0) + record.duration);
    return map;
  }, new Map());
  const rows = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));

  durationChartEmpty.hidden = rows.length > 0;
  if (rows.length === 0) {
    durationChart.getContext("2d").clearRect(0, 0, durationChart.width, durationChart.height);
    return;
  }

  const { ctx, width, height } = getChartContext(durationChart);
  const maxMinutes = Math.max(60, ...rows.map(([, minutes]) => minutes));
  const { padding, chartWidth, chartHeight } = drawAxes(ctx, width, height, maxMinutes, "m");
  const barGap = 8;
  const barWidth = Math.max(12, chartWidth / rows.length - barGap);

  ctx.fillStyle = "#d4af37";
  rows.forEach(([date, minutes], index) => {
    const x = padding.left + (chartWidth / rows.length) * index + barGap / 2;
    const barHeight = (minutes / maxMinutes) * chartHeight;
    const y = padding.top + chartHeight - barHeight;
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = "#f5f5f5";
    ctx.fillText(`${minutes}m`, x, Math.max(14, y - 6));
    ctx.fillStyle = "#d4af37";
  });

  ctx.fillStyle = "#a0a8b3";
  ctx.fillText(formatDate(rows[0][0]), padding.left, height - 12);
  ctx.fillText(formatDate(rows.at(-1)[0]), width - padding.right - 92, height - 12);
}

function renderCharts() {
  drawBpmChart();
  drawDurationChart();
}

function renderGpLinks() {
  gpList.innerHTML = "";
  gpEmptyState.hidden = gpLinks.length > 0;

  for (const link of gpLinks) {
    const item = document.createElement("article");
    item.className = "gp-item";

    const copy = document.createElement("div");
    const song = document.createElement("strong");
    const name = document.createElement("span");
    song.textContent = link.song;
    name.textContent = link.name;
    copy.append(song, name);

    const actions = document.createElement("div");
    actions.className = "row-actions";

    const open = document.createElement("a");
    open.href = link.url;
    open.target = "_blank";
    open.rel = "noreferrer";
    open.textContent = "打开";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.dataset.action = "edit-gp";
    edit.dataset.id = link.id;
    edit.textContent = "编辑";

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "danger";
    remove.dataset.action = "delete-gp";
    remove.dataset.id = link.id;
    remove.textContent = "删除";

    actions.append(open, edit, remove);
    item.append(copy, actions);
    gpList.append(item);
  }
}

function upsertGpLink(event) {
  event.preventDefault();

  const payload = {
    id: gpId.value || createId(),
    song: gpSongInput.value.trim(),
    name: gpNameInput.value.trim(),
    url: gpUrlInput.value.trim(),
  };
  if (!payload.song || !payload.name || !payload.url) return;

  const index = gpLinks.findIndex((link) => link.id === payload.id);
  if (index >= 0) {
    gpLinks[index] = payload;
  } else {
    gpLinks.unshift(payload);
  }

  saveItems(GP_STORAGE_KEY, gpLinks);
  renderGpLinks();
  resetGpForm();
}

function editGpLink(id) {
  const link = gpLinks.find((item) => item.id === id);
  if (!link) return;

  gpId.value = link.id;
  gpSongInput.value = link.song;
  gpNameInput.value = link.name;
  gpUrlInput.value = link.url;
  gpSubmitButton.textContent = "更新链接";
  gpCancelButton.hidden = false;
  gpSongInput.focus();
}

function deleteGpLink(id) {
  gpLinks = gpLinks.filter((link) => link.id !== id);
  saveItems(GP_STORAGE_KEY, gpLinks);
  renderGpLinks();
  if (gpId.value === id) resetGpForm();
}

progressInput.addEventListener("input", () => {
  progressOutput.value = `${progressInput.value}%`;
});

songPresetButtons.forEach((button) => {
  button.addEventListener("click", () => setSong(button.dataset.song));
});

form.addEventListener("submit", upsertRecord);
cancelEditButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", renderRecords);
sortSelect.addEventListener("change", renderRecords);
window.addEventListener("resize", renderCharts);

recordsBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  if (button.dataset.action === "edit") editRecord(button.dataset.id);
  if (button.dataset.action === "delete") deleteRecord(button.dataset.id);
});

gpForm.addEventListener("submit", upsertGpLink);
gpCancelButton.addEventListener("click", resetGpForm);
gpList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  if (button.dataset.action === "edit-gp") editGpLink(button.dataset.id);
  if (button.dataset.action === "delete-gp") deleteGpLink(button.dataset.id);
});

setDefaultDate();
renderRecords();
renderGpLinks();
