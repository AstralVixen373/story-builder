export function createGraph(container) {
  let activeNodeId = null;

  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  let isDragging = false;
  let startX = 0;
  let startY = 0;

  const world = document.createElement("div");

  world.className = "graph-world";
  const controls = document.createElement("div");
  controls.className = "graph-zoom-controls";

  const zoomOut = document.createElement("button");
  zoomOut.textContent = "−";

  const zoomIn = document.createElement("button");
  zoomIn.textContent = "+";

  zoomIn.addEventListener("click", () => {
    scale = Math.min(scale + 0.2, 3);
    updateTransform();
  });

  zoomOut.addEventListener("click", () => {
    scale = Math.max(scale - 0.2, 0.4);
    updateTransform();
  });

  controls.append(zoomOut, zoomIn);

  container.innerHTML = "";
  container.appendChild(world);
  container.appendChild(controls);

  const api = { render };
  setupPanZoom();

  return api;

  /* =========================
     RENDER
  ========================= */

  function render(state) {
    world.innerHTML = "";

    if (!state) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const characters = state.characters || [];
    const locations = state.locations || [];

    const BASE_ZONE_SIZE = 280;
    const TITLE_PADDING = 60;

    const zones = [];
    const positions = {};

    const cols = Math.ceil(Math.sqrt(locations.length || 1));
    const rows = Math.ceil(locations.length / cols);

    const spacingX = BASE_ZONE_SIZE;
    const spacingY = BASE_ZONE_SIZE;

    /* =========================
       BUILD ZONES
    ========================= */

    locations.forEach((location, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const linked = characters.filter(c =>
        c.links?.locations?.includes(location.id)
      );

      zones.push({
        id: location.id,
        name: location.name,
        x: col * spacingX + 300,
        y: row * spacingY + 300,
        radius: Math.max(110, linked.length * 18)
      });
    });

    const worldWidth = cols * spacingX + 400;
    const worldHeight = rows * spacingY + 400;

    world.style.width = worldWidth + "px";
    world.style.height = worldHeight + "px";

    /* =========================
       AUTO FIT
    ========================= */

    if (offsetX === 0 && offsetY === 0) {
      const fitScaleX = width / worldWidth;
      const fitScaleY = height / worldHeight;

      scale = Math.min(fitScaleX, fitScaleY, 1);

      offsetX = (width - worldWidth * scale) / 2;
      offsetY = (height - worldHeight * scale) / 2;
    }

    /* =========================
       DRAW ZONES
    ========================= */

    zones.forEach(zone => {
      const el = document.createElement("div");
      el.className = "location-zone";

      el.style.width = zone.radius * 2 + "px";
      el.style.height = zone.radius * 2 + "px";

      el.style.left = zone.x - zone.radius + "px";
      el.style.top = zone.y - zone.radius + "px";

      const title = document.createElement("div");
      title.className = "location-title";
      title.textContent = zone.name;

      el.appendChild(title);
      world.appendChild(el);
    });

    /* =========================
       BUILD CHARACTER INSTANCES
    ========================= */

    const nodeByCharacter = {};

    const characterNodes = [];

    characters.forEach(character => {
      const locs = character.links?.locations || [];

      if (locs.length) {
        locs.forEach(locationId => {
          const zone = zones.find(z => z.id === locationId);
          if (!zone) return;

          const group = characters.filter(c =>
            c.links?.locations?.includes(locationId)
          );

          const seed = (character.id * 99991 + locationId * 12345) % 360;
          const angle = (seed / 360) * Math.PI * 2;
          const safeRadius = zone.radius - TITLE_PADDING;
          const orbit = Math.max(25, safeRadius);

          const node = {
            instanceId: `${character.id}-${locationId}`,
            characterId: character.id,
            name: character.name,
            x: zone.x + Math.cos(angle) * orbit,
            y: zone.y + Math.sin(angle) * orbit
          };

          characterNodes.push(node);

          nodeByCharacter[character.id] ||= [];
          nodeByCharacter[character.id].push(node);
        });
      } else {
        const node = {
          instanceId: `${character.id}-none`,
          characterId: character.id,
          name: character.name,
          x: 100,
          y: 100
        };

        characterNodes.push(node);

        nodeByCharacter[character.id] = [node];
      }
    });

    /* =========================
       DRAW LINKS
    ========================= */

    const drawn = new Set();

    characters.forEach(character => {
      const relations = character.links?.characters || [];

      relations.forEach(targetId => {

        const key =
          character.id < targetId
            ? `${character.id}-${targetId}`
            : `${targetId}-${character.id}`;

        if (drawn.has(key)) return;
        drawn.add(key);

        const a = nodeByCharacter[character.id]?.[0];
        const b = nodeByCharacter[targetId]?.[0];

        if (!a || !b) return;

        const line = document.createElement("div");
        line.className = "line";

        if (activeNodeId && (character.id === activeNodeId || targetId === activeNodeId)) {
          line.classList.add("active-line");
        }

        const dx = b.x - a.x;
        const dy = b.y - a.y;

        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        line.style.width = length + "px";
        line.style.left = a.x + "px";
        line.style.top = a.y + "px";
        line.style.transform = `rotate(${angle}deg)`;

        world.appendChild(line);
      });
    });

    /* =========================
       DRAW NODES
    ========================= */

    characterNodes.forEach(node => {
      const el = document.createElement("div");
      el.className = "node";

      if (node.characterId === activeNodeId) {
        el.classList.add("active");
      }

      el.textContent = node.name;

      el.style.left = node.x + "px";
      el.style.top = node.y + "px";

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        activeNodeId = node.characterId;
        render(state);
      });

      world.appendChild(el);
    });

    updateTransform();
  }

  /* =========================
     PAN + ZOOM
  ========================= */

  function setupPanZoom() {
    container.addEventListener("wheel", (e) => {
      e.preventDefault();

      scale += e.deltaY < 0 ? 0.1 : -0.1;
      scale = Math.min(Math.max(scale, 0.4), 3);

      updateTransform();
    });

    container.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX - offsetX;
      startY = e.clientY - offsetY;
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;

      offsetX = e.clientX - startX;
      offsetY = e.clientY - startY;

      updateTransform();
    });
  }

  /* =========================
  APPLY TRANSFORM
  ========================= */

  function updateTransform() {
    world.style.transform =
      `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  }
}
