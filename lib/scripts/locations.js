/* =========================
   IMPORTS
========================= */

import { bindStorageUI } from "./storage.js";
import { load, save, STORAGE_KEYS } from "./shared.js";

/* =========================
   INIT
========================= */

bindStorageUI();

const app = document.getElementById("view");
if (!app) throw new Error("Missing #view");

/* =========================
   STATE
========================= */

const state = {
  locations: load(STORAGE_KEYS.locations) || [],
  currentId: null,
  view: "list"
};

function persist() {
  save(STORAGE_KEYS.locations, state.locations);
}

const getCurrent = () =>
  state.locations.find(l => l.id === state.currentId);

/* =========================
   ACTIONS
========================= */

function setView(view, payload = {}) {
  Object.assign(state, payload, { view });
  render();
}

function addLocation() {
  state.locations.push({
    id: Date.now(),
    name: "Unnamed Location",
    description: "",
    updatedAt: Date.now()
  });

  persist();
  render();
}

function removeLocation(id) {
  state.locations = state.locations.filter(l => l.id !== id);
  persist();

  setView("list", { currentId: null });
}

/* =========================
   RENDER
========================= */

function render() {
  app.innerHTML = "";

  if (state.view === "list") renderList();
  if (state.view === "editor") renderEditor();
}

function renderList() {
  const grid = create("div", "card-grid");

  app.append(
    createButton("+ New Location", addLocation),
    grid
  );

  state.locations
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(loc => {
      grid.appendChild(
        createCard(
          loc.name,
          preview(loc.description),
          () => setView("editor", { currentId: loc.id })
        )
      );
    });
}

function renderEditor() {
  const loc = getCurrent();
  if (!loc) return setView("list");

  const title = create("input", "scene-title");
  const content = create("textarea", "scene-content");

  title.value = loc.name;
  content.value = loc.description;

  const saveChanges = debounce(() => {
    loc.name = title.value;
    loc.description = content.value;
    loc.updatedAt = Date.now();
    persist();
  }, 300);

  title.addEventListener("input", saveChanges);
  content.addEventListener("input", saveChanges);

  const topBar = createTopBar([
    ["← Back", () => setView("list")],
    ["Delete", () => removeLocation(loc.id), "danger"]
  ]);

  const currentItem = getCurrent();

  app.append(
    topBar,
    title,
    content,
  );
}

/* =========================
   COMPONENTS
========================= */

function create(tag, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}

function createButton(text, handler, type) {
  const btn = create("button");
  btn.textContent = text;

  if (type === "danger") {
    btn.classList.add("danger");
  }

  btn.onclick = handler;
  return btn;
}

function createTopBar(buttons) {
  const bar = create("div", "top-actions");

  buttons.forEach(([text, handler, type]) => {
    bar.appendChild(createButton(text, handler, type));
  });

  return bar;
}

function createCard(title, subtitle, onClick) {
  const card = create("div", "card");

  const h3 = create("h3");
  const p = create("p");

  h3.textContent = title;
  p.textContent = subtitle;

  card.append(h3, p);
  card.onclick = onClick;

  return card;
}

/* =========================
   UTILITIES
========================= */

function preview(text = "") {
  return text.length > 80
    ? text.slice(0, 80).trim() + "..."
    : text || "No description...";
}

function debounce(fn, delay = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

/* =========================
   START
========================= */

render();
