import { createGraph } from "./graphRenderer.js";

/* =========================
   LINK MANAGER MODULE
========================= */

export function createLinkManager({
  item,
  state,
  persist,
  openItem,
  graph // 👈 pass graph instance
}) {

  const wrapper = document.createElement("div");
  wrapper.className = "links";

  const TYPE_LABELS = {
    characters: "Characters",
    locations: "Locations"
  };

  /* =========================
     GRAPH UPDATE HOOK
  ========================= */

  function updateGraph() {
    if (!graph) return;

    graph.render({
      characters: state.characters,
      locations: state.locations
    });
  }

  /* =========================
     ENSURE LINKS STRUCTURE
  ========================= */

  function ensureLinks() {
    if (!item.links) {
      item.links = {
        characters: [],
        locations: []
      };
    }
  }

  /* =========================
     SELECTORS
  ========================= */

  const types = [
    { key: "characters", label: "Characters" },
    { key: "locations", label: "Locations" }
  ];

  const typeSelect = document.createElement("select");

  types.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.key;
    opt.textContent = t.label;
    typeSelect.appendChild(opt);
  });

  const targetSelect = document.createElement("select");

  function refreshTargets() {
    const type = typeSelect.value;
    targetSelect.innerHTML = "";

    (state[type] || [])
      .filter(entity => entity.id !== item.id) // prevent self-link
      .forEach(entity => {
        const opt = document.createElement("option");
        opt.value = entity.id;
        opt.textContent = entity.name;
        targetSelect.appendChild(opt);
      });
  }

  typeSelect.addEventListener("change", refreshTargets);
  refreshTargets();

  /* =========================
     ADD LINK
  ========================= */

  const addBtn = document.createElement("button");
  addBtn.textContent = "Link";

  addBtn.addEventListener("click", () => {
    const type = typeSelect.value;
    const id = Number(targetSelect.value);

    ensureLinks();

    if (!item.links[type].includes(id)) {
      item.links[type].push(id);
      persist();
      renderLinks();
      updateGraph(); // 👈 LIVE UPDATE
    }
  });

  /* =========================
     LINK LIST
  ========================= */

  const list = document.createElement("div");
  list.className = "link-list";

  function renderLinks() {
    list.innerHTML = "";

    ensureLinks();

    Object.entries(item.links).forEach(([type, ids]) => {
      ids.forEach(id => {
        const target = (state[type] || []).find(x => x.id === id);
        if (!target) return;

        const tag = document.createElement("div");
        tag.className = "link-tag";

        const label = TYPE_LABELS[type] || type;

        const text = document.createElement("span");
        text.textContent = `${label} → ${target.name}`;

        const remove = document.createElement("button");
        remove.textContent = "×";

        /* =========================
           OPEN ITEM
        ========================= */

        tag.addEventListener("click", () => {
          openItem(type, id);
        });

        /* =========================
           DELETE LINK
        ========================= */

        remove.addEventListener("click", (e) => {
          e.stopPropagation();

          item.links[type] = item.links[type].filter(i => i !== id);

          persist();
          renderLinks();
          updateGraph(); // 👈 LIVE UPDATE
        });

        tag.append(text, remove);
        list.appendChild(tag);
      });
    });
  }

  renderLinks();

  /* =========================
     UI LAYOUT
  ========================= */

  const addRow = document.createElement("div");
  addRow.className = "links-add";

  addRow.append(typeSelect, targetSelect, addBtn);

  wrapper.append(addRow, list);

  return wrapper;
}
