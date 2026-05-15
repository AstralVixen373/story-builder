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
  chapters: load(STORAGE_KEYS.chapters) || [],
  currentChapterId: null,
  currentSceneId: null,
  view: "chapters" // chapters | chapter | scene
};

function persist() {
  save(STORAGE_KEYS.chapters, state.chapters);
}

/* =========================
   HELPERS
========================= */

const getChapter = id =>
  state.chapters.find(c => c.id === id);

const getCurrentChapter = () =>
  getChapter(state.currentChapterId);

const getCurrentScene = () =>
  getCurrentChapter()?.scenes.find(s => s.id === state.currentSceneId);

/* =========================
   STATE ACTIONS
========================= */

function setView(view, payload = {}) {
  Object.assign(state, payload, { view });
  render();
}

/* ---- CHAPTERS ---- */

function addChapter() {
  state.chapters.push({
    id: Date.now(),
    title: "Untitled Chapter",
    scenes: []
  });

  persist();
  render();
}

function removeChapter(id) {
  state.chapters = state.chapters.filter(c => c.id !== id);
  persist();
  setView("chapters", {
    currentChapterId: null,
    currentSceneId: null
  });
}

/* ---- SCENES ---- */

function addScene() {
  const chapter = getCurrentChapter();
  if (!chapter) return;

  chapter.scenes.push({
    id: Date.now(),
    title: "Untitled Scene",
    content: "",
    updatedAt: Date.now()
  });

  persist();
  render();
}

function removeScene(id) {
  const chapter = getCurrentChapter();
  if (!chapter) return;

  chapter.scenes = chapter.scenes.filter(s => s.id !== id);
  persist();

  setView("chapter", { currentSceneId: null });
}

/* =========================
   RENDER ROOT
========================= */

function render() {
  app.innerHTML = "";

  switch (state.view) {
    case "chapters":
      renderChapters();
      break;
    case "chapter":
      renderChapter();
      break;
    case "scene":
      renderScene();
      break;
  }
}

/* =========================
   VIEWS
========================= */

/* ---- CHAPTER LIST ---- */

function renderChapters() {
  const grid = create("div", "card-grid");

  app.append(
    createButton("+ New Chapter", addChapter),
    grid
  );

  state.chapters.forEach(ch => {
    grid.appendChild(
      createCard(
        ch.title,
        `${ch.scenes.length} scenes`,
        () => setView("chapter", { currentChapterId: ch.id })
      )
    );
  });
}

/* ---- SINGLE CHAPTER ---- */

function renderChapter() {
  const chapter = getCurrentChapter();
  if (!chapter) return setView("chapters");

  const grid = create("div", "card-grid");

  const topBar = createTopBar([
    ["← Back", () => setView("chapters")],
    ["+ Scene", addScene],
    ["Delete", () => removeChapter(chapter.id), "danger"]
  ]);

  app.append(
    topBar,
    createEditableTitle(chapter),
    grid
  );

  chapter.scenes.forEach(scene => {
    grid.appendChild(
      createCard(
        scene.title,
        preview(scene.content),
        () => setView("scene", { currentSceneId: scene.id })
      )
    );
  });
}

/* ---- SCENE VIEW ---- */

function renderScene() {
  const chapter = getCurrentChapter();
  const scene = getCurrentScene();

  if (!chapter || !scene) return setView("chapters");

  const title = create("input", "scene-title");
  const content = create("textarea", "scene-content");

  title.value = scene.title;
  content.value = scene.content;

  const save = debounce(() => {
    scene.title = title.value;
    scene.content = content.value;
    scene.updatedAt = Date.now();
    persist();
  }, 300);

  title.addEventListener("input", save);
  content.addEventListener("input", save);

  const topBar = createTopBar([
    ["← Back", () => setView("chapter", { currentSceneId: null })],
    ["Delete", () => removeScene(scene.id), "danger"]
  ]);

  app.append(topBar, title, content);
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

function createEditableTitle(chapter) {
  const wrapper = create("div", "title-wrapper");

  const title = create("h2");
  const input = create("input", "title-input");
  const editBtn = create("button", "edit-btn");

  title.textContent = chapter.title;
  input.value = chapter.title;
  input.classList.add("hidden");

  editBtn.textContent = "✍️";

  function save() {
    const val = input.value.trim();
    if (!val) return;

    chapter.title = val;
    persist();
    render();
  }

  editBtn.onclick = () => {
    title.classList.add("hidden");
    editBtn.classList.add("hidden");
    input.classList.remove("hidden");
    input.focus();
  };

  input.onblur = () => {
    title.classList.remove("hidden");
    editBtn.classList.remove("hidden");
    input.classList.add("hidden");
    save();
  };

  input.onkeydown = e => {
    if (e.key === "Enter") input.blur();
  };

  wrapper.append(title, input, editBtn);
  return wrapper;
}

/* =========================
   UTILITIES
========================= */

function preview(text = "") {
  return text.length > 80
    ? text.slice(0, 80).trim() + "..."
    : text || "Empty scene...";
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
