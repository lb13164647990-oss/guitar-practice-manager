const STORAGE_KEY = "guitar-practice-records";

const form = document.querySelector("#practiceForm");
const entryId = document.querySelector("#entryId");
const songInput = document.querySelector("#songInput");
const bpmInput = document.querySelector("#bpmInput");
const dateInput = document.querySelector("#dateInput");
const progressInput = document.querySelector("#progressInput");
const progressOutput = document.querySelector("#progressOutput");
const submitButton = document.querySelector("#submitButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const recordsBody = document.querySelector("#recordsBody");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const sortSelect = document.querySelector("#sortSelect");

const totalCount = document.querySelector("#totalCount");
const averageBpm = document.querySelector("#averageBpm");
const averageProgress = document.querySelector("#averageProgress");
const latestDate = document.querySelector("#latestDate");

let records = loadRecords();

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function today() {
  const offset = new Date().getTimezoneOffset();
  const local = new Date(Date.now() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function formatDate(value) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${value}T00:00:00`));
}

function setDefaultDate() {
  dateInput.value = today();
}

function resetForm() {
  form.reset();
  entryId.value = "";
  progressInput.value = 50;
  progressOutput.value = "50%";
  submitButton.textContent = "保存记录";
  cancelEditButton.hidden = true;
  setDefaultDate();
  songInput.focus();
}

function getFilteredRecords() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = records.filter((record) => record.song.toLowerCase().includes(query));

  return filtered.sort((a, b) => {
    if (sortSelect.value === "dateAsc") return a.date.localeCompare(b.date);
    if (sortSelect.value === "progressDesc") return b.progress - a.progress;
    if (sortSelect.value === "bpmDesc") return b.bpm - a.bpm;
    return b.date.localeCompare(a.date);
  });
}

function renderSummary() {
  totalCount.textContent = records.length;

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
}

function upsertRecord(event) {
  event.preventDefault();

  const payload = {
    id: entryId.value || createId(),
    song: songInput.value.trim(),
    bpm: Number(bpmInput.value),
    progress: Number(progressInput.value),
    date: dateInput.value,
  };

  if (!payload.song || Number.isNaN(payload.bpm) || !payload.date) return;

  const index = records.findIndex((record) => record.id === payload.id);
  if (index >= 0) {
    records[index] = payload;
  } else {
    records.unshift(payload);
  }

  saveRecords();
  renderRecords();
  resetForm();
}

function editRecord(id) {
  const record = records.find((item) => item.id === id);
  if (!record) return;

  entryId.value = record.id;
  songInput.value = record.song;
  bpmInput.value = record.bpm;
  progressInput.value = record.progress;
  progressOutput.value = `${record.progress}%`;
  dateInput.value = record.date;
  submitButton.textContent = "更新记录";
  cancelEditButton.hidden = false;
  songInput.focus();
}

function deleteRecord(id) {
  records = records.filter((record) => record.id !== id);
  saveRecords();
  renderRecords();
  if (entryId.value === id) resetForm();
}

progressInput.addEventListener("input", () => {
  progressOutput.value = `${progressInput.value}%`;
});

form.addEventListener("submit", upsertRecord);
cancelEditButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", renderRecords);
sortSelect.addEventListener("change", renderRecords);

recordsBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  if (button.dataset.action === "edit") editRecord(button.dataset.id);
  if (button.dataset.action === "delete") deleteRecord(button.dataset.id);
});

setDefaultDate();
renderRecords();
