/* =========================
   Imports
========================= */

import { bindStorageUI } from "./storage.js";
import { load, STORAGE_KEYS } from "./shared.js";
import { exportProject, importProject, deleteProjectData } from "./storage.js";

/* =========================
   INIT STORAGE UI
========================= */

bindStorageUI();

/* =========================
   DOM
========================= */

const el = {
  charCount: document.getElementById("char-count"),
  sceneCount: document.getElementById("scene-count"),
  locationCount: document.getElementById("location-count"),
  wordCount: document.getElementById("word-count"),
  sceneTotal: document.getElementById("scene-total"),
  progressFill: document.getElementById("progress-fill"),
  recentList: document.getElementById("recent-scenes")
};

/* =========================
   DATA
========================= */

function getData() {
  return {
    characters: load(STORAGE_KEYS.characters),
    chapters: load(STORAGE_KEYS.chapters),
    locations: load(STORAGE_KEYS.locations)
  };
}

/* =========================
   STATS
========================= */

function updateStats() {
  const { characters, chapters, locations } = getData();

  setText(el.charCount, characters.length);
  setText(el.sceneCount, chapters.length);
  setText(el.locationCount, locations.length);

  updateProgress(chapters);
  renderRecentScenes(chapters);
}

/* =========================
   PROGRESS
========================= */

const WORD_GOAL = 50000;

function countWords(text = "") {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function updateProgress(chapters) {
  const totalWords = chapters.reduce(
    (sum, ch) =>
      sum +
      ch.scenes.reduce(
        (s, sc) => s + countWords(sc.content),
        0
      ),
    0
  );

  setText(el.wordCount, `${totalWords} words`);
  setText(el.sceneTotal, `${chapters.reduce((s, c) => s + c.scenes.length, 0)} scenes`);

  const progress = Math.min((totalWords / WORD_GOAL) * 100, 100);
  el.progressFill.style.width = `${progress}%`;
}

/* =========================
   RECENT SCENES
========================= */

function renderRecentScenes(chapters) {
  el.recentList.innerHTML = "";

  const scenes = chapters.flatMap(c => c.scenes);

  const recent = [...scenes]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);

  if (!recent.length) {
    return appendTextItem(el.recentList, "No scenes yet.");
  }

  recent.forEach(scene => {
    const link = createLink(
      `chapters.html`,
      scene.title || "Untitled scene"
    );

    el.recentList.appendChild(wrap("li", link));
  });
}

/* =========================
   HELPERS
========================= */

function setText(node, value) {
  if (node) node.textContent = value;
}

function createLink(href, text) {
  const a = document.createElement("a");
  a.href = href;
  a.textContent = text;
  return a;
}

function wrap(tag, child) {
  const el = document.createElement(tag);
  el.appendChild(child);
  return el;
}

function appendTextItem(parent, text) {
  const li = document.createElement("li");
  li.textContent = text;
  parent.appendChild(li);
}

/* =========================
   INIT
========================= */

updateStats();
