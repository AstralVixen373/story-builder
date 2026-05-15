  /* =========================
    IMPORTS
  ========================= */

  import { bindStorageUI } from "./storage.js";
  import { load, save, STORAGE_KEYS } from "./shared.js";
  import { createLinkManager } from "./linkManager.js";

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
    characters: load(STORAGE_KEYS.characters) || [],
    locations: load(STORAGE_KEYS.locations) || [],   // IMPORTANT FOR THE LINK MANAGER
    currentId: null,
    view: "list"
  };

  function persist() {
    save(STORAGE_KEYS.characters, state.characters);
  }

  /* =========================
    HELPERS
  ========================= */

  const getCurrent = () =>
    state.characters.find(c => c.id === state.currentId);

  /* =========================
    ACTIONS
  ========================= */

  function setView(view, payload = {}) {
    Object.assign(state, payload, { view });
    render();
  }

  function addCharacter() {
    state.characters.push({
      id: Date.now(),
      name: "Unnamed Character",
      avatar: "",
      description: "",
      updatedAt: Date.now()
    });

    persist();
    render();
  }

  function removeCharacter(id) {
    state.characters = state.characters.filter(c => c.id !== id);
    persist();

    setView("list", { currentId: null });
  }

  /* =========================
    RENDER ROOT
  ========================= */

  function render() {
    app.innerHTML = "";

    if (state.view === "list") renderList();
    if (state.view === "editor") renderEditor();
  }

  /* =========================
    LIST VIEW (GRID)
  ========================= */

  function renderList() {
    const grid = create("div", "card-grid");

    app.append(
      createButton("+ New Character", addCharacter),
      grid
    );

    state.characters
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(char => {
        grid.appendChild(
          createCard(
            char.name,
            preview(char.description),
            () => setView("editor", { currentId: char.id })
          )
        );
      });
  }

  /* =========================
    EDITOR VIEW
  ========================= */

  function renderEditor() {
    const char = getCurrent();
    if (!char) return setView("list");

    const title = create("input", "scene-title");
    const content = create("textarea", "scene-content");

    title.value = char.name;
    content.value = char.description;

    /* AVATAR CREATION */

    const avatarWrapper = create("div", "avatar-wrapper");

    const avatarPreview = create("img", "avatar-preview");
    avatarPreview.src = char.avatar || "";
    avatarPreview.alt = "Character avatar";

    if (!char.avatar) {
      avatarPreview.classList.add("hidden");
    }

    const avatarPlaceholder = create("label", "avatar-placeholder");
    avatarPlaceholder.textContent = "Upload Character Image";

    const avatarInput = document.createElement("input");
    avatarInput.type = "file";
    avatarInput.accept = "image/*";
    avatarInput.classList.add("hidden");

    avatarInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = () => {
        char.avatar = reader.result;

        avatarPreview.src = char.avatar;
        avatarPreview.classList.remove("hidden");
        avatarPlaceholder.classList.add("hidden");

        persist();
      };

      reader.readAsDataURL(file);
    });

    if (char.avatar) {
      avatarPlaceholder.classList.add("hidden");
    }

    avatarPlaceholder.appendChild(avatarInput);

    const avatarActions = create("div", "avatar-actions");

    const changeBtn = createButton("Change", () => {
      avatarInput.click();
    });

    const removeBtn = createButton("Remove", () => {
    char.avatar = "";

    avatarPreview.src = "";
    avatarPreview.classList.add("hidden");

    avatarPlaceholder.classList.remove("hidden");

    avatarActions.classList.add("hidden");

    persist();
  }, "danger");

    avatarActions.append(changeBtn, removeBtn);

    if (!char.avatar) {
      avatarActions.classList.add("hidden");
    }

    avatarInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = () => {
        char.avatar = reader.result;

        avatarPreview.src = char.avatar;

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
      char.name = title.value;
      char.description = content.value;
      char.updatedAt = Date.now();
      persist();
    }, 300);

    title.addEventListener("input", saveChanges);
    content.addEventListener("input", saveChanges);

    const topBar = createTopBar([
      ["← Back", () => setView("list")],
      ["Delete", () => removeCharacter(char.id), "danger"]
    ]);

    const currentItem = getCurrent();

    app.append(
      topBar,
      title,
      avatarWrapper,
      content,
      createLinkManager({
        item: currentItem,
        state,
        persist,
        openItem: (type, id) => {
          if (type === "characters") {
            setView("editor", { currentId: id });
          }

          if (type === "locations") {
            setView("editor", { currentId: id });
          }
        }
      })
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
