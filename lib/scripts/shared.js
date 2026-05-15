/* =========================
   Storage Keys
========================= */

export const STORAGE_KEYS = {
  characters: "sb_characters",
  chapters: "sb_chapters",
  locations: "sb_locations"
};

/* =========================
   Storage Helpers
========================= */

export function load(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
