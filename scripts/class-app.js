const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const STORE_KEY = "class_site_v1";

const State = load() || {
  classNumber: "",
  classLetter: "",
  students: [],
  teachers: [],
  homework: [],
  announcements: [],
  schedule: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
  settings: { gistToken: "", gistId: "", gistFilename: "class-data.json" },
};

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(State));
  render();
}
function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || ""); } catch { return null; }
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* Navigation */
function showView(id) {
  $$(".view").forEach(v => v.classList.remove("active"));
  $$("#app .tab").forEach(t => t.classList.remove("active"));
  $("#view-" + id).classList.add("active");
  $(`.tab[data-target="${id}"]`).classList.add("active");
}
function setClassTitle() {
  const n = State.classNumber?.trim() || "";
  const l = State.classLetter?.trim() || "";
  $("#class-name").textContent = n || l ? `${n}${l}` : "—";
}

/* Renderers */
function renderHome() {
  const today = new Date().toISOString().slice(0, 10);
  const todaysHw = State.homework.filter(h => h.due === today && !h.done);
  const text = [
    State.students.length ? `Учеников: ${State.students.length}` : null,
    State.teachers.length ? `Учителей: ${State.teachers.length}` : null,
    todaysHw.length ? `На сегодня: ${todaysHw.length} задания` : null
  ].filter(Boolean).join(" • ");
  $("#today-summary").textContent = text || "Нет данных";

  const upcoming = State.homework
    .filter(h => !h.done && h.due)
    .sort((a,b) => a.due.localeCompare(b.due))
    .slice(0, 5);
  $("#upcoming-list").innerHTML = upcoming.map(h => `
    <li class="item">
      <div>
        <div><strong>${escapeHtml(h.subject || "Предмет")}</strong> — ${escapeHtml(h.text)}</div>
        <div class="meta">Срок: ${fmtDate(h.due)}</div>
      </div>
      <div class="actions">
        <button class="btn" data-action="done" data-id="${h.id}">Готово</button>
        <button class="btn warning" data-action="del" data-id="${h.id}">Удалить</button>
      </div>
    </li>
  `).join("");

  const recent = [...State.announcements]
    .sort((a,b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 5);
  $("#recent-ann-list").innerHTML = recent.map(a => `
    <li class="item">
      <div>
        <div><strong>${escapeHtml(a.title)}</strong></div>
        <div class="meta">${fmtDateTime(a.date)}${a.pinned ? ' · Закреплено' : ''}</div>
        <div>${escapeHtml(a.body)}</div>
      </div>
    </li>
  `).join("");
}
function renderHomework() {
  const list = $("#hw-list");
  const items = [...State.homework].sort((a,b) => a.due.localeCompare(b.due));
  list.innerHTML = items.map(h => `
    <li class="item">
      <div>
        <div><strong>${escapeHtml(h.subject || "Предмет")}</strong> — ${escapeHtml(h.text)}</div>
        <div class="meta">Срок: ${fmtDate(h.due)}${h.done ? " · выполнено" : ""}</div>
      </div>
      <div class="actions">
        <button class="btn" data-action="toggle" data-id="${h.id}">${h.done ? "Вернуть" : "Готово"}</button>
        <button class="btn" data-action="edit" data-id="${h.id}">Ред.</button>
        <button class="btn warning" data-action="del" data-id="${h.id}">Удалить</button>
      </div>
    </li>
  `).join("");
}
function renderSchedule() {
  const daybar = document.getElementById("schedule-daybar");
  const list = document.getElementById("schedule-list");
  if (!daybar || !list) return;
  const day = currentScheduleDay;
  const items = [...(State.schedule?.[day] || [])]
    .sort((a,b) => (a.time || "").localeCompare(b.time || ""));
  list.innerHTML = items.map(l => `
   < li class="item">
     < div>
       < di><vstrong>${escapeHtml(l.time || "}</")strong> — ${escapeHtml  const list = $("#st-list");
  const items = [...State.students].sort((a,b) => a.fio.localeCompare(b.fio, "ru"));
  list.innerHTML = items.map(s => `
    <li class="item">
      <div>
        <div><strong>${escapeHtml(s.fio)}</strong></div>
        <div class="meta">${s.phone ? `Тел.: <a href="tel:${escapeAttr(s.phone)}">${escapeHtml(s.phone)}</a>` : ""}</div>
      </div>
      <div class="actions">
        <button class="btn" data-action="edit" data-id="${s.id}">Ред.</button>
        <button class="btn warning" data-action="del" data-id="${s.id}">Удалить</button>
      </div>
    </li>
  `).join("");
}
function renderTeachers() {
  const list = $("#tc-list");
  const items = [...State.teachers].sort((a,b) => a.fio.localeCompare(b.fio, "ru"));
  list.innerHTML = items.map(t => `
    <li class="item">
      <div>
        <div><strong>${escapeHtml(t.fio)}</strong> <span class="tag">${escapeHtml(t.subject || "")}</span></div>
        <div class="meta">${t.phone ? `Тел.: <a href="tel:${escapeAttr(t.phone)}">${escapeHtml(t.phone)}</a>` : ""}</div>
      </div>
      <div class="actions">
        <button class="btn" data-action="edit" data-id="${t.id}">Ред.</button>
        <button class="btn warning" data-action="del" data-id="${t.id}">Удалить</button>
      </div>
    </li>
  `).join("");
}
function renderAnnouncements() {
  const list = $("#ann-list");
  const items = [...State.announcements]
    .sort((a,b) => Number(b.pinned) - Number(a.pinned) || (b.date || "").localeCompare(a.date || ""));
  list.innerHTML = items.map(a => `
    <li class="item">
      <div>
        <div><strong>${escapeHtml(a.title)}</strong>${a.pinned ? ' <span class="tag">Закреплено</span>' : ''}</div>
        <div class="meta">${fmtDateTime(a.date)}</div>
        <div>${escapeHtml(a.body)}</div>
      </div>
      <div class="actions">
        <button class="btn" data-action="pin" data-id="${a.id}">${a.pinned ? "Открепить" : "Закрепить"}</button>
        <button class="btn" data-action="edit" data-id="${a.id}">Ред.</button>
        <button class="btn warning" data-action="del" data-id="${a.id}">Удалить</button>
      </div>
    </li>
  `).join("");
}

function render() {
  setClassTitle();
  renderHome();
  renderHomework();
  renderSchedule();
  renderStudents();
  renderTeachers();
  renderAnnouncements();
}

/* Helpers */
function fmtDate(d) {
  if (!d) return "—";
  const [y,m,da] = d.split("-");
  return `${da}.${m}.${y}`;
}
function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2,"0");
  const mi = String(d.getMinutes()).padStart(2,"0");
  return `${dd}.${mm}.${yy} ${hh}:${mi}`;
}
function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escapeAttr(s) {
  return String(s ?? "").replace(/"/g, "");
}

/* Auth */
let __auth_ok = sessionStorage.getItem("class_site_auth") === "1";
function ensureAuthorized() {
  if (__auth_ok) return true/
function ensureSettings() {
  if (!State.settings || typeof State.settings !== "object") {
    State.settings = { gistToken: "", gistId: "", gistFilename: "class-data.json" };
  } else {
    State.settings.gistToken = State.settings.gistToken || "";
    State.settings.gistId = State.settings.gistId || "";
    State.settings.gistFilename = State.settings.gistFilename || "class-data.json";
  }
}
async function gistApi(method, path, token, body) {
  const res = await fetch("https://api.github.com" + path, {
    method,
    headers: {
      "Accept": "application/vnd.github+json",
      ...(token ? { "Authorization": "Bearer " + token } : {}),
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error("GitHub API error: " + res.status + " " + res.statusText + " " + text);
  }
  return res.json();
}
function pickDataForSync() {
  return {
    classNumber: State.classNumber,
    classLetter: State.classLetter,
    students: State.students,
    teachers: State.teachers,
    homework: State.homework,
    announcements: State.announcements,
    schedule: State.schedule,
  };
}
async function gistSaveCurrent() {
  ensureSettings();
  const token = ($("#gist-token")?.value ?? State.settings.gistToken).trim();
  let id = ($("#gist-id")?.value ?? State.settings.gistId).trim();
  const filename = ($("#gist-filename")?.value ?? State.settings.gistFilename).trim() || "class-data.json";
  if (!token) {
    alert("Нужен GitHub токен с правом gist для сохранения.");
    return;
  }
  const files = {};
  files[filename] = { content: JSON.stringify(pickDataForSync(), null, 2) };
  if (id) {
    await gistApi("PATCH", "/gists/" + id, token, { files });
  } else {
    const json = await gistApi("POST", "/gists", token, {
      description: "Class site data",
      public: false,
      files
    });
    id = json.id;
    State.settings.gistId = id;
    if ($("#gist-id")) $("#gist-id").value = id;
  }
  State.settings.gistToken = token;
  State.settings.gistFilename = filename;
  save();
  alert("Данные сохранены в Gist" + (id ? " (" + id + ")" : "") + ".");
}
async function gistLoadToState() {
  ensureSettings();
  const token = ($("#gist-token")?.value ?? State.settings.gistToken).trim();
  const id = ($("#gist-id")?.value ?? State.settings.gistId).trim();
  const filename = ($("#gist-filename")?.value ?? State.settings.gistFilename).trim() || "class-data.json";
  if (!id) {
    alert("Укажите Gist ID, из которого загружать.");
    return;
  }
  const json = await gistApi("GET", "/gists/" + id, token || undefined);
  const file = json.files[filename] || Object.values(json.files).find(f => f.filename.endsWith(".json"));
  if (!file) {
    alert("В Gist не найден JSON-файл.");
    return;
  }
  const data = JSON.parse(file.content);
  ["classNumber","classLetter","students","teachers","homework","announcements"].forEach(k => {
    if (k in data) State[k] = data[k];
  });
  State.settings.gistToken = token;
  State.settings.gistId = id;
  State.settings.gistFilename = filename;
  save();
  alert("Данные загружены из Gist.");
}

/* Event wiring */
document.addEventListener("DOMContentLoaded", () => {
  /* Tabs */
  $$(".tabbar .tab").forEach(btn => {
    btn.addEventListener("click", () => showView(btn.dataset.target));
  });

  $("#quick-add-homework").addEventListener("click", () => {
    showView("homework");
    setTimeout(() => $("#hw-subject").focus(), 0);
  });

  /* Class settings */
  $("#class-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!ensureAuthorized()) return;
    State.classNumber = $("#class-number").value.trim();
    State.classLetter = $("#class-letter").value.trim();
    save();
  });

  /* Homework */
  $("#hw-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!ensureAuthorized()) return;
    const subject = $("#hw-subject").value.trim();
    const text = $("#hw-text").value.trim();
    const due = $("#hw-due").value;
    if (!subject || !text || !due) return;
    State.homework.push({ id: uid(), subject, text, due, done: false });
    $("#hw-form").reset();
    save();
  });
  $("#hw-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const idx = State.homework.findIndex(h => h.id === id);
    if (idx < 0) return;
    if (!ensureAuthorized()) return;
    const action = btn.dataset.action;
    if (action === "toggle") {
      State.homework[idx].done = !State.homework[idx].done;
    } else if (action === "edit") {
      const h = State.homework[idx];
      const subject = prompt("Предмет", h.subject);
      if (subject === null) return;
      const text = prompt("Задание", h.text);
      if (text === null) return;
      const due = prompt("Срок (ГГГГ-ММ-ДД)", h.due);
      if (due === null) return;
      Object.assign(h, { subject: subject.trim(), text: text.trim(), due: due.trim() });
    } else if (action === "del") {
      State.homework.splice(idx, 1);
    } else if (action === "done") {
      State.homework[idx].done = true;
    }
    save();
  });

  // Быстрые действия для списка ближайших дедлайнов
  $("#upcoming-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const idx = State.homework.findIndex(h => h.id === id);
    if (id << 0) return;
    if (!ensureAuthorized()) return;
      if (action === "done") {
      State.homework[idx].done = true;
    } else if (action === "del") {
      State.homework.splice(idx, 1);
    }
    save();
  });

  /* Schedule */
  const daybar = document.getElementById("schedule-daybar");
  if (daybar) {
    daybar.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-day]");
      if (!btn) return;
      currentScheduleDay = btn.dataset.day;
      Array.from(daybar.querySelectorAll(".seg")).forEach(b => b.classList.toggle("active", b === btn));
      renderSchedule();
    });
  }
  const scForm = document.getElementById("schedule-form");
  if (scForm) {
    scForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!ensureAuthorized()) return;
      const time = document.getElementById("sc-time").value;
      const subject = document.getElementById("sc-subject").value.trim();
      const teacher = document.getElementById("sc-teacher").value.trim();
      const room = document.getElementById("sc-room").value.trim();
      if (!time || !subject) return;
      (State.schedule[currentScheduleDay] ||= []).push({ id: uid(), time, subject, teacher, room });
      scForm.reset();
      save();
    });
  }
  const scList = document.getElementById("schedule-list");
  if (scList) {
    scList.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const id = btn.dataset.id;
      const list = State.schedule[currentScheduleDay] || [];
      const idx = list.findIndex(l => l.id === id);
      if (idx < 0) return;
      if (!ensureAuthorized()) return;
      const action = btn.dataset.action;
      if (action === "edit") {
        const l = list[idx];
        const time = prompt("Время (ЧЧ:ММ)", l.time);
        if (time === null) return;
        const subject = prompt("Предмет", l.subject);
        if (subject === null) return;
        const teacher = prompt("Учитель", l.teacher || "");
        if (teacher === null) return;
        const room = prompt("Кабинет", l.room || "");
        if (room === null) return;
        Object.assign(l, { time: time.trim(), subject: subject.trim(), teacher: teacher.trim(), room: room.trim() });
      } else if (action === "del") {
        list.splice(idx, 1);
      }
      save();
    });
  }

  /* Students */
  $("#st-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!ensureAuthorized()) return;
    const fiost phone = $("#st-phone").value.trim();
    if (!fio) return;
    State.students.push({ id: uid(), fio, phone });
    $("#st-form").reset();
    save();
  });
  $("#st-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const idx = State.students.findIndex(s => s.id === id);
    if (idx < 0) return;
    if (!ensureAuthorized()) return;
    if (btn.dataset.action === "edit") {
      const s = State.students[idx];
      const fio = prompt("ФИО", s.fio);
      if (fio === null) return;
      const phone = prompt("Телефон", s.phone || "");
      if (phone === null) return;
      Object.assign(s, { fio: fio.trim(), phone: phone.trim() });
    } else if (btn.dataset.action === "del") {
      State.students.splice(idx, 1);
    }
    save();
  });

  /* Teachers */
  $("#tc-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!ensureAuthorized()) return;
    const fio = $("#tct = $("#tc-subj").value.trim();
    const phone = $("#tc-phone").value.trim();
    if (!fio || !subject) return;
    State.teachers.push({ id: uid(), fio, subject, phone });
    $("#tc-form").reset();
    save();
  });
  $("#tc-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const idx = State.teachers.findIndex(t => t.id === id);
    if (idx < 0) return;
    if (!ensureAuthorized()) return;
    if (btn.dataset.action === "edit") {
      const t = State.teachers[idx];
      const fio = prompt("ФИО", t.fio);
      if (fio === null) return;
      const subject = prompt("Предмет", t.subject);
      if (subject === null) return;
      const phone = prompt("Телефон", t.phone || "");
      if (phone === null) return;
      Object.assign(t, { fio: fio.trim(), subject: subject.trim(), phone: phone.trim() });
    } else if (btn.dataset.action === "del") {
      State.teachers.splice(idx, 1);
    }
    save();
  });

  /* Announcements */
  $("#ann-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!ensureAuthorized()) return;
    const title = $("#ann-title").value.trim();
    const body = $("#ann-body").value.trim();
    const pinned = $("#ann-pin").checked;
    if (!title || !body) return;
    State.announcements.push({ id: uid(), title, body, pinned, date: new Date().toISOString() });
    $("#ann-form").reset();
    save();
  });
  $("#ann-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const idx = State.announcements.findIndex(a => a.id === id);
    if (idx < 0) return;
    if (!ensureAuthorized()) return;
    const a = State.announcements[idx];
    const action = btn.dataset.action;
    if (action === "pin") {
      a.pinned = !a.pinned;
    } else if (action === "edit") {
      const title = prompt("Заголовок", a.title);
      if (title === null) return;
      const body = prompt("Текст", a.body);
      if (body === null) return;
      Object.assign(a, { title: title.trim(), body: body.trim() });
    } else if (action === "del") {
      State.announcements.splice(idx, 1);
    }
    save();
  });

  /* Backup */
  $("#btn-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(State, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "class-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $("#import-file").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ensureAuthorized()) { e.target.value = ""; return; }
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (!data || typeof data !== "object") return;
      ["classNumber","classLetter","students","teachers","homework","announcements","schedule"].forEach(k => {
        if (k in data) State[k] = data[k];
      });
      save();
      e.target.value = "";
    } catch {}
  });

  /* Online sync (Gist) */
  ensureSettings();
  if (document.getElementById("gist-token")) {
    document.getElementById("gist-token").value = State.settings.gistToken || "";
    document.getElementById("gist-id").value = State.settings.gistId || "";
    document.getElementById("gist-filename").value = State.settings.gistFilename || "class-data.json";
    document.getElementById("btn-gist-save").addEventListener("click", async (e) => {
      e.preventDefault();
      if (!ensureAuthorized()) return;
      State.settings.gistToken = document.getElementById("gist-token").value.trim();
      State.settings.gistId = document.getElementById("gist-id").value.trim();
      State.settings.gistFilename = document.getElementById("gist-filename").value.trim() || "class-data.json";
      try { await gistSaveCurrent(); } catch (err) { alert(err.message || String(err)); }
    });
    document.getElementById("btn-gist-load").addEventListener("click", async (e) => {
      e.preventDefault();
      if (!ensureAuthorized()) return;
      State.settings.gistToken = document.getElementById("gist-token").value.trim();
      State.settings.gistId = document.getElementById("gist-id").value.trim();
      State.settings.gistFilename = document.getElementById("gist-filename").value.trim() || "class-data.json";
      try { await gistLoadToState(); } catch (err) { alert(err.message || String(err)); }
    });
  }

  /* Init */
  $("#class-number").value = State.classNumber || "";
  $("#class-letter").value = State.classLetter || "";
  render();
});const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const STORE_KEY = "class_site_v1";

const State = load() || {
  classNumber: "",
  classLetter: "",
  students: [],
  teachers: [],
  homework: [],
  announcements: [],
  schedule: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
  settings: { gistToken: "", gistId: "", gistFilename: "class-data.json" },
};

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(State));
  render();
}
function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || ""); } catch { return null; }
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* Navigation */
function showView(id) {
  $$(".view").forEach(v => v.classList.remove("active"));
  $$("#app .tab").forEach(t => t.classList.remove("active"));
  $("#view-" + id).classList.add("active");
  $(`.tab[data-target="${id}"]`).classList.add("active");
}
function setClassTitle() {
  const n = State.classNumber?.trim() || "";
  const l = State.classLetter?.trim() || "";
  $("#class-name").textContent = n || l ? `${n}${l}` : "—";
}

/* Renderers */
function renderHome() {
  const today = new Date().toISOString().slice(0, 10);
  const todaysHw = State.homework.filter(h => h.due === today && !h.done);
  const text = [
    State.students.length ? `Учеников: ${State.students.length}` : null,
    State.teachers.length ? `Учителей: ${State.teachers.length}` : null,
    todaysHw.length ? `На сегодня: ${todaysHw.length} задания` : null
  ].filter(Boolean).join(" • ");
  $("#today-summary").textContent = text || "Нет данных";

  const upcoming = State.homework
    .filter(h => !h.done && h.due)
    .sort((a,b) => a.due.localeCompare(b.due))
    .slice(0, 5);
  $("#upcoming-list").innerHTML = upcoming.map(h => `
    <li class="item">
      <div>
        <div><strong>${escapeHtml(h.subject || "Предмет")}</strong> — ${escapeHtml(h.text)}</div>
        <div class="meta">Срок: ${fmtDate(h.due)}</div>
      </div>
      <div class="actions">
        <button class="btn" data-action="done" data-id="${h.id}">Готово</button>
        <button class="btn warning" data-action="del" data-id="${h.id}">Удалить</button>
      </div>
    </li>
  `).join("");

  const recent = [...State.announcements]
    .sort((a,b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 5);
  $("#recent-ann-list").innerHTML = recent.map(a => `
    <li class="item">
      <div>
        <div><strong>${escapeHtml(a.title)}</strong></div>
        <div class="meta">${fmtDateTime(a.date)}${a.pinned ? ' · Закреплено' : ''}</div>
        <div>${escapeHtml(a.body)}</div>
      </div>
    </li>
  `).join("");
}
function renderHomework() {
  const list = $("#hw-list");
  const items = [...State.homework].sort((a,b) => a.due.localeCompare(b.due));
  list.innerHTML = items.map(h => `
    <li class="item">
      <div>
        <div><strong>${escapeHtml(h.subject || "Предмет")}</strong> — ${escapeHtml(h.text)}</div>
        <div class="meta">Срок: ${fmtDate(h.due)}${h.done ? " · выполнено" : ""}</div>
      </div>
      <div class="actions">
        <button class="btn" data-action="toggle" data-id="${h.id}">${h.done ? "Вернуть" : "Готово"}</button>
        <button class="btn" data-action="edit" data-id="${h.id}">Ред.</button>
        <button class="btn warning" data-action="del" data-id="${h.id}">Удалить</button>
      </div>
    </li>
  `).join("");
}
function renderSchedule() {
  const daybar = document.getElementById("schedule-daybar");
  const list = document.getElementById("schedule-list");
  if (!daybar || !list) return;
  const day = currentScheduleDay;
  const items = [...(State.schedule?.[day] || [])]
    .sort((a,b) => (a.time || "").localeCompare(b.time || ""));
  list.innerHTML = items.map(l => `
   < li class="item">
     < div>
       < di><vstrong>${escapeHtml(l.time || "}</")strong> — ${escapeHtml  const list = $("#st-list");
  const items = [...State.students].sort((a,b) => a.fio.localeCompare(b.fio, "ru"));
  list.innerHTML = items.map(s => `
    <li class="item">
      <div>
        <div><strong>${escapeHtml(s.fio)}</strong></div>
        <div class="meta">${s.phone ? `Тел.: <a href="tel:${escapeAttr(s.phone)}">${escapeHtml(s.phone)}</a>` : ""}</div>
      </div>
      <div class="actions">
        <button class="btn" data-action="edit" data-id="${s.id}">Ред.</button>
        <button class="btn warning" data-action="del" data-id="${s.id}">Удалить</button>
      </div>
    </li>
  `).join("");
}
function renderTeachers() {
  const list = $("#tc-list");
  const items = [...State.teachers].sort((a,b) => a.fio.localeCompare(b.fio, "ru"));
  list.innerHTML = items.map(t => `
    <li class="item">
      <div>
        <div><strong>${escapeHtml(t.fio)}</strong> <span class="tag">${escapeHtml(t.subject || "")}</span></div>
        <div class="meta">${t.phone ? `Тел.: <a href="tel:${escapeAttr(t.phone)}">${escapeHtml(t.phone)}</a>` : ""}</div>
      </div>
      <div class="actions">
        <button class="btn" data-action="edit" data-id="${t.id}">Ред.</button>
        <button class="btn warning" data-action="del" data-id="${t.id}">Удалить</button>
      </div>
    </li>
  `).join("");
}
function renderAnnouncements() {
  const list = $("#ann-list");
  const items = [...State.announcements]
    .sort((a,b) => Number(b.pinned) - Number(a.pinned) || (b.date || "").localeCompare(a.date || ""));
  list.innerHTML = items.map(a => `
    <li class="item">
      <div>
        <div><strong>${escapeHtml(a.title)}</strong>${a.pinned ? ' <span class="tag">Закреплено</span>' : ''}</div>
        <div class="meta">${fmtDateTime(a.date)}</div>
        <div>${escapeHtml(a.body)}</div>
      </div>
      <div class="actions">
        <button class="btn" data-action="pin" data-id="${a.id}">${a.pinned ? "Открепить" : "Закрепить"}</button>
        <button class="btn" data-action="edit" data-id="${a.id}">Ред.</button>
        <button class="btn warning" data-action="del" data-id="${a.id}">Удалить</button>
      </div>
    </li>
  `).join("");
}

function render() {
  setClassTitle();
  renderHome();
  renderHomework();
  renderSchedule();
  renderStudents();
  renderTeachers();
  renderAnnouncements();
}

/* Helpers */
function fmtDate(d) {
  if (!d) return "—";
  const [y,m,da] = d.split("-");
  return `${da}.${m}.${y}`;
}
function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2,"0");
  const mi = String(d.getMinutes()).padStart(2,"0");
  return `${dd}.${mm}.${yy} ${hh}:${mi}`;
}
function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escapeAttr(s) {
  return String(s ?? "").replace(/"/g, "");
}

/* Auth */
let __auth_ok = sessionStorage.getItem("class_site_auth") === "1";
function ensureAuthorized() {
  if (__auth_ok) return true/
function ensureSettings() {
  if (!State.settings || typeof State.settings !== "object") {
    State.settings = { gistToken: "", gistId: "", gistFilename: "class-data.json" };
  } else {
    State.settings.gistToken = State.settings.gistToken || "";
    State.settings.gistId = State.settings.gistId || "";
    State.settings.gistFilename = State.settings.gistFilename || "class-data.json";
  }
}
async function gistApi(method, path, token, body) {
  const res = await fetch("https://api.github.com" + path, {
    method,
    headers: {
      "Accept": "application/vnd.github+json",
      ...(token ? { "Authorization": "Bearer " + token } : {}),
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error("GitHub API error: " + res.status + " " + res.statusText + " " + text);
  }
  return res.json();
}
function pickDataForSync() {
  return {
    classNumber: State.classNumber,
    classLetter: State.classLetter,
    students: State.students,
    teachers: State.teachers,
    homework: State.homework,
    announcements: State.announcements,
    schedule: State.schedule,
  };
}
async function gistSaveCurrent() {
  ensureSettings();
  const token = ($("#gist-token")?.value ?? State.settings.gistToken).trim();
  let id = ($("#gist-id")?.value ?? State.settings.gistId).trim();
  const filename = ($("#gist-filename")?.value ?? State.settings.gistFilename).trim() || "class-data.json";
  if (!token) {
    alert("Нужен GitHub токен с правом gist для сохранения.");
    return;
  }
  const files = {};
  files[filename] = { content: JSON.stringify(pickDataForSync(), null, 2) };
  if (id) {
    await gistApi("PATCH", "/gists/" + id, token, { files });
  } else {
    const json = await gistApi("POST", "/gists", token, {
      description: "Class site data",
      public: false,
      files
    });
    id = json.id;
    State.settings.gistId = id;
    if ($("#gist-id")) $("#gist-id").value = id;
  }
  State.settings.gistToken = token;
  State.settings.gistFilename = filename;
  save();
  alert("Данные сохранены в Gist" + (id ? " (" + id + ")" : "") + ".");
}
async function gistLoadToState() {
  ensureSettings();
  const token = ($("#gist-token")?.value ?? State.settings.gistToken).trim();
  const id = ($("#gist-id")?.value ?? State.settings.gistId).trim();
  const filename = ($("#gist-filename")?.value ?? State.settings.gistFilename).trim() || "class-data.json";
  if (!id) {
    alert("Укажите Gist ID, из которого загружать.");
    return;
  }
  const json = await gistApi("GET", "/gists/" + id, token || undefined);
  const file = json.files[filename] || Object.values(json.files).find(f => f.filename.endsWith(".json"));
  if (!file) {
    alert("В Gist не найден JSON-файл.");
    return;
  }
  const data = JSON.parse(file.content);
  ["classNumber","classLetter","students","teachers","homework","announcements"].forEach(k => {
    if (k in data) State[k] = data[k];
  });
  State.settings.gistToken = token;
  State.settings.gistId = id;
  State.settings.gistFilename = filename;
  save();
  alert("Данные загружены из Gist.");
}

/* Event wiring */
document.addEventListener("DOMContentLoaded", () => {
  /* Tabs */
  $$(".tabbar .tab").forEach(btn => {
    btn.addEventListener("click", () => showView(btn.dataset.target));
  });

  $("#quick-add-homework").addEventListener("click", () => {
    showView("homework");
    setTimeout(() => $("#hw-subject").focus(), 0);
  });

  /* Class settings */
  $("#class-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!ensureAuthorized()) return;
    State.classNumber = $("#class-number").value.trim();
    State.classLetter = $("#class-letter").value.trim();
    save();
  });

  /* Homework */
  $("#hw-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!ensureAuthorized()) return;
    const subject = $("#hw-subject").value.trim();
    const text = $("#hw-text").value.trim();
    const due = $("#hw-due").value;
    if (!subject || !text || !due) return;
    State.homework.push({ id: uid(), subject, text, due, done: false });
    $("#hw-form").reset();
    save();
  });
  $("#hw-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const idx = State.homework.findIndex(h => h.id === id);
    if (idx < 0) return;
    if (!ensureAuthorized()) return;
    const action = btn.dataset.action;
    if (action === "toggle") {
      State.homework[idx].done = !State.homework[idx].done;
    } else if (action === "edit") {
      const h = State.homework[idx];
      const subject = prompt("Предмет", h.subject);
      if (subject === null) return;
      const text = prompt("Задание", h.text);
      if (text === null) return;
      const due = prompt("Срок (ГГГГ-ММ-ДД)", h.due);
      if (due === null) return;
      Object.assign(h, { subject: subject.trim(), text: text.trim(), due: due.trim() });
    } else if (action === "del") {
      State.homework.splice(idx, 1);
    } else if (action === "done") {
      State.homework[idx].done = true;
    }
    save();
  });

  // Быстрые действия для списка ближайших дедлайнов
  $("#upcoming-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const idx = State.homework.findIndex(h => h.id === id);
    if (id << 0) return;
    if (!ensureAuthorized()) return;
      if (action === "done") {
      State.homework[idx].done = true;
    } else if (action === "del") {
      State.homework.splice(idx, 1);
    }
    save();
  });

  /* Schedule */
  const daybar = document.getElementById("schedule-daybar");
  if (daybar) {
    daybar.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-day]");
      if (!btn) return;
      currentScheduleDay = btn.dataset.day;
      Array.from(daybar.querySelectorAll(".seg")).forEach(b => b.classList.toggle("active", b === btn));
      renderSchedule();
    });
  }
  const scForm = document.getElementById("schedule-form");
  if (scForm) {
    scForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!ensureAuthorized()) return;
      const time = document.getElementById("sc-time").value;
      const subject = document.getElementById("sc-subject").value.trim();
      const teacher = document.getElementById("sc-teacher").value.trim();
      const room = document.getElementById("sc-room").value.trim();
      if (!time || !subject) return;
      (State.schedule[currentScheduleDay] ||= []).push({ id: uid(), time, subject, teacher, room });
      scForm.reset();
      save();
    });
  }
  const scList = document.getElementById("schedule-list");
  if (scList) {
    scList.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const id = btn.dataset.id;
      const list = State.schedule[currentScheduleDay] || [];
      const idx = list.findIndex(l => l.id === id);
      if (idx < 0) return;
      if (!ensureAuthorized()) return;
      const action = btn.dataset.action;
      if (action === "edit") {
        const l = list[idx];
        const time = prompt("Время (ЧЧ:ММ)", l.time);
        if (time === null) return;
        const subject = prompt("Предмет", l.subject);
        if (subject === null) return;
        const teacher = prompt("Учитель", l.teacher || "");
        if (teacher === null) return;
        const room = prompt("Кабинет", l.room || "");
        if (room === null) return;
        Object.assign(l, { time: time.trim(), subject: subject.trim(), teacher: teacher.trim(), room: room.trim() });
      } else if (action === "del") {
        list.splice(idx, 1);
      }
      save();
    });
  }

  /* Students */
  $("#st-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!ensureAuthorized()) return;
    const fiost phone = $("#st-phone").value.trim();
    if (!fio) return;
    State.students.push({ id: uid(), fio, phone });
    $("#st-form").reset();
    save();
  });
  $("#st-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const idx = State.students.findIndex(s => s.id === id);
    if (idx < 0) return;
    if (!ensureAuthorized()) return;
    if (btn.dataset.action === "edit") {
      const s = State.students[idx];
      const fio = prompt("ФИО", s.fio);
      if (fio === null) return;
      const phone = prompt("Телефон", s.phone || "");
      if (phone === null) return;
      Object.assign(s, { fio: fio.trim(), phone: phone.trim() });
    } else if (btn.dataset.action === "del") {
      State.students.splice(idx, 1);
    }
    save();
  });

  /* Teachers */
  $("#tc-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!ensureAuthorized()) return;
    const fio = $("#tct = $("#tc-subj").value.trim();
    const phone = $("#tc-phone").value.trim();
    if (!fio || !subject) return;
    State.teachers.push({ id: uid(), fio, subject, phone });
    $("#tc-form").reset();
    save();
  });
  $("#tc-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const idx = State.teachers.findIndex(t => t.id === id);
    if (idx < 0) return;
    if (!ensureAuthorized()) return;
    if (btn.dataset.action === "edit") {
      const t = State.teachers[idx];
      const fio = prompt("ФИО", t.fio);
      if (fio === null) return;
      const subject = prompt("Предмет", t.subject);
      if (subject === null) return;
      const phone = prompt("Телефон", t.phone || "");
      if (phone === null) return;
      Object.assign(t, { fio: fio.trim(), subject: subject.trim(), phone: phone.trim() });
    } else if (btn.dataset.action === "del") {
      State.teachers.splice(idx, 1);
    }
    save();
  });

  /* Announcements */
  $("#ann-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!ensureAuthorized()) return;
    const title = $("#ann-title").value.trim();
    const body = $("#ann-body").value.trim();
    const pinned = $("#ann-pin").checked;
    if (!title || !body) return;
    State.announcements.push({ id: uid(), title, body, pinned, date: new Date().toISOString() });
    $("#ann-form").reset();
    save();
  });
  $("#ann-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const idx = State.announcements.findIndex(a => a.id === id);
    if (idx < 0) return;
    if (!ensureAuthorized()) return;
    const a = State.announcements[idx];
    const action = btn.dataset.action;
    if (action === "pin") {
      a.pinned = !a.pinned;
    } else if (action === "edit") {
      const title = prompt("Заголовок", a.title);
      if (title === null) return;
      const body = prompt("Текст", a.body);
      if (body === null) return;
      Object.assign(a, { title: title.trim(), body: body.trim() });
    } else if (action === "del") {
      State.announcements.splice(idx, 1);
    }
    save();
  });

  /* Backup */
  $("#btn-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(State, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "class-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $("#import-file").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ensureAuthorized()) { e.target.value = ""; return; }
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (!data || typeof data !== "object") return;
      ["classNumber","classLetter","students","teachers","homework","announcements","schedule"].forEach(k => {
        if (k in data) State[k] = data[k];
      });
      save();
      e.target.value = "";
    } catch {}
  });

  /* Online sync (Gist) */
  ensureSettings();
  if (document.getElementById("gist-token")) {
    document.getElementById("gist-token").value = State.settings.gistToken || "";
    document.getElementById("gist-id").value = State.settings.gistId || "";
    document.getElementById("gist-filename").value = State.settings.gistFilename || "class-data.json";
    document.getElementById("btn-gist-save").addEventListener("click", async (e) => {
      e.preventDefault();
      if (!ensureAuthorized()) return;
      State.settings.gistToken = document.getElementById("gist-token").value.trim();
      State.settings.gistId = document.getElementById("gist-id").value.trim();
      State.settings.gistFilename = document.getElementById("gist-filename").value.trim() || "class-data.json";
      try { await gistSaveCurrent(); } catch (err) { alert(err.message || String(err)); }
    });
    document.getElementById("btn-gist-load").addEventListener("click", async (e) => {
      e.preventDefault();
      if (!ensureAuthorized()) return;
      State.settings.gistToken = document.getElementById("gist-token").value.trim();
      State.settings.gistId = document.getElementById("gist-id").value.trim();
      State.settings.gistFilename = document.getElementById("gist-filename").value.trim() || "class-data.json";
      try { await gistLoadToState(); } catch (err) { alert(err.message || String(err)); }
    });
  }

  /* Init */
  $("#class-number").value = State.classNumber || "";
  $("#class-letter").value = State.classLetter || "";
  render();
});
