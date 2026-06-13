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
    avatar: "",
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

/* =========================
  EDITOR VIEW
========================= */

function renderEditor() {
  const loc = getCurrent();
  if (!loc) return setView("list");

  const title = create("input", "scene-title");
  const content = create("textarea", "scene-content");

  title.value = loc.name;
  content.value = loc.description;

  /* AVATAR CREATION */

  const avatarWrapper = create("div", "avatar-wrapper");

  const avatarPreview = create("img", "avatar-preview");
  avatarPreview.src = loc.avatar || "";
  avatarPreview.alt = "Location image";

  if (!loc.avatar) {
    avatarPreview.classList.add("hidden");
  }

  const avatarPlaceholder = create("label", "avatar-placeholder");
  avatarPlaceholder.textContent = "Upload Location Image";

  const avatarInput = document.createElement("input");
  avatarInput.type = "file";
  avatarInput.accept = "image/*";
  avatarInput.classList.add("hidden");

  if (loc.avatar) {
    avatarPlaceholder.classList.add("hidden");
  }

  avatarPlaceholder.appendChild(avatarInput);

  const avatarActions = create("div", "avatar-actions");

  const changeBtn = createButton("Change", () => {
    avatarInput.click();
  });

  const removeBtn = createButton("Remove", () => {
    loc.avatar = "";
    
    avatarPreview.src = "";
    avatarPreview.classList.add("hidden");
    
    avatarPlaceholder.classList.remove("hidden");
    
    avatarActions.classList.add("hidden");
    
    persist();
  }, "danger");

  avatarActions.append(changeBtn, removeBtn);

  if (!loc.avatar) {
    avatarActions.classList.add("hidden");
  }

  avatarInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      loc.avatar = reader.result;
      
      avatarPreview.src = loc.avatar;
      
      avatarPreview.classList.remove("hidden");
      avatarPlaceholder.classList.add("hidden");
      avatarActions.classList.remove("hidden");
      
      persist();
    };

    reader.readAsDataURL(file);
  });

  avatarWrapper.append(
    avatarPlaceholder, 
    avatarPreview, 
    avatarActions
  );

  /* --------------- */

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

  app.append(
    topBar,
    title,
    avatarWrapper,
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
