import { STORAGE_KEYS, load, save } from "./shared.js";

/* =========================
   EXPORT / IMPORT CORE
========================= */

export function exportProject() {
  const data = {
    characters: load(STORAGE_KEYS.characters),
    chapters: load(STORAGE_KEYS.chapters),
    locations: load(STORAGE_KEYS.locations),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "story-project.json";
  a.click();

  URL.revokeObjectURL(url);
}

export function importProject(file) {
  const reader = new FileReader();

  reader.onload = ({ target }) => {
    try {
      const data = JSON.parse(target.result);

      const allowed = ["characters", "chapters", "locations"];

      allowed.forEach((key) => {
        if (data[key]) {
          save(STORAGE_KEYS[key], data[key]);
        }
      });

      location.reload();
    } catch {
      alert("Invalid project file");
    }
  };

  reader.readAsText(file);
}

export function deleteProjectData() {
  const confirmed = window.confirm(
    "This will permanently delete all project data. Continue?"
  );

  if (!confirmed) return;

  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });

  location.reload();
}

/* =========================
   UI BINDING
========================= */

export function bindStorageUI() {
  const bind = () => {
    const exportBtn = document.getElementById("export-data");
    const importInput = document.getElementById("import-file");
    const deleteBtn = document.getElementById("delete-data");

    if (exportBtn) {
      exportBtn.addEventListener("click", exportProject);
    }

    if (importInput) {
      importInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) importProject(file);
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", deleteProjectData);
    }
  };

  bind();
}
