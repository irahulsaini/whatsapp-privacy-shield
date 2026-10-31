// Editable runtime shared by console and extension builds. No network or storage APIs.
(() => {
  if (location.hostname !== "web.whatsapp.com" || location.protocol !== "https:") return;
  const ID = "rs-whatsapp-privacy";
  const TARGET = '[data-testid="drawer-title-body"]';

  document.getElementById(`${ID}-toolbar`)
    ?.dispatchEvent(new Event(`${ID}-remove`));
  document.getElementById(`${ID}-style`)?.remove();
  document.getElementById(`${ID}-toolbar`)?.remove();
  document.getElementById(`${ID}-popup`)?.remove();
  document.getElementById(`${ID}-layers`)?.remove();

  // All blur surfaces live outside WhatsApp's virtualized message layout.
  const layerHost = document.createElement("div");
  layerHost.id = `${ID}-layers`;
  layerHost.setAttribute("aria-hidden", "true");
  layerHost.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483645;overflow:hidden";
  const layerRoot = layerHost.attachShadow({ mode: "open" });
  document.body.appendChild(layerHost);
  const masks = new Map();
  const watched = new Set();
  // Archived chat grids can be mounted outside #side in a separate drawer.
  const rowSelector = '#side div[role="row"], #main div[role="row"], #pane-side [role="row"], [role="grid"] [role="row"], [data-testid="chat-list"] [role="row"]';

  const host = document.createElement("span");
  host.id = `${ID}-toolbar`;
  host.style.cssText = `
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    margin-inline-start: 6px;
    flex: 0 0 auto;
    position: relative;
    z-index: 100;
  `;

  const shadow = host.attachShadow({ mode: "open" });
  const iconCSS = document.createElement("style");
  iconCSS.textContent = `
    :host { font-family: system-ui, sans-serif; }
    .shield {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      color: #94a3b8;
      background: transparent;
      cursor: pointer;
    }
    .shield:hover { background: rgba(127, 127, 127, .12); }
    .shield[data-enabled="true"] { color: #00a884; }
    .shield svg { width: 20px; height: 20px; pointer-events: none; }
    .shield:focus-visible {
      outline: 2px solid #67e8f9;
      outline-offset: 2px;
    }
  `;

  const shield = document.createElement("button");
  shield.type = "button";
  shield.className = "shield";
  shield.title = "Privacy settings (1.0.4)";
  shield.setAttribute("aria-label", "Privacy settings");
  shield.setAttribute("aria-expanded", "false");
  const shieldIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  shieldIcon.setAttribute("viewBox", "0 0 24 24");
  shieldIcon.setAttribute("fill", "none");
  shieldIcon.setAttribute("aria-hidden", "true");
  const shieldShape0 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  shieldShape0.setAttribute("d", "M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z");
  shieldShape0.setAttribute("stroke", "currentColor");
  shieldShape0.setAttribute("stroke-width", "2");
  shieldShape0.setAttribute("stroke-linejoin", "round");
  shieldIcon.appendChild(shieldShape0);
  const shieldShape1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  shieldShape1.setAttribute("d", "m8 12 3 3 5-6");
  shieldShape1.setAttribute("stroke", "currentColor");
  shieldShape1.setAttribute("stroke-width", "2");
  shieldShape1.setAttribute("stroke-linecap", "round");
  shieldShape1.setAttribute("stroke-linejoin", "round");
  shieldIcon.appendChild(shieldShape1);
  shield.appendChild(shieldIcon);
  shadow.append(iconCSS, shield);

  const popupHost = document.createElement("div");
  popupHost.id = `${ID}-popup`;
  popupHost.style.cssText = `
    position: fixed;
    inset: 0 auto auto 0;
    z-index: 2147483647;
    pointer-events: none;
  `;
  const popupShadow = popupHost.attachShadow({ mode: "open" });
  const popupCSS = document.createElement("style");
  popupCSS.textContent = `
    :host { font-family: system-ui, sans-serif; }
    .controls {
      position: fixed;
      top: 0;
      left: 0;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 5px;
      border: 1px solid #475569;
      border-radius: 8px;
      background: #17212b;
      box-shadow: 0 4px 15px #0005;
      white-space: nowrap;
      flex-wrap: wrap;
      max-width: calc(100vw - 16px);
      box-sizing: border-box;
      pointer-events: auto;
    }
    .controls[hidden] { display: none; }
    button, select {
      box-sizing: border-box;
      height: 28px;
      padding: 4px 7px;
      border: 0;
      border-radius: 5px;
      background: #263544;
      color: #f8fafc;
      font: 12px system-ui, sans-serif;
      cursor: pointer;
    }
    button[aria-pressed="true"] { background: #007f92; }
    .remove { width: 26px; padding: 0; font-size: 18px; }
    .controls a {
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border-radius: 5px;
      color: #f8fafc;
      background: #263544;
      text-decoration: none;
      box-sizing: border-box;
    }
    .controls a:hover { background: #007f92; }
    button:focus-visible, select:focus-visible, .controls a:focus-visible {
      outline: 2px solid #67e8f9;
      outline-offset: 2px;
    }
  `;

  const controls = document.createElement("div");
  controls.className = "controls";
  controls.hidden = true;
  controls.setAttribute("role", "group");
  controls.setAttribute("aria-label", "Privacy controls");

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Privacy blur");

  const strength = document.createElement("select");
  strength.setAttribute("aria-label", "Blur strength");
  strength.title = "Blur strength";
  for (const [label, value] of [
    ["Light", "2"], ["Medium", "4"], ["Strong", "7"]
  ]) {
    const option = document.createElement("option");
    option.textContent = label;
    option.value = value;
    strength.appendChild(option);
  }
  strength.value = "4";

  const mode = document.createElement("select");
  mode.setAttribute("aria-label", "Chat blur mode");
  mode.title = "Chat blur mode";
  for (const [label, value] of [["Messages", "messages"], ["Entire chat", "chat"]]) {
    const option = document.createElement("option");
    option.textContent = label;
    option.value = value;
    mode.appendChild(option);
  }
  mode.value = "chat";

  const website = document.createElement("a");
  website.href = "https://irahulsaini.com";
  website.target = "_blank";
  website.rel = "noopener noreferrer";
  website.title = "Visit irahulsaini.com";
  website.setAttribute("aria-label", "Visit irahulsaini.com");
  const websiteIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  websiteIcon.setAttribute("viewBox", "0 0 24 24");
  websiteIcon.setAttribute("fill", "none");
  websiteIcon.setAttribute("stroke", "currentColor");
  websiteIcon.setAttribute("stroke-width", "1.8");
  websiteIcon.setAttribute("stroke-linecap", "round");
  websiteIcon.setAttribute("stroke-linejoin", "round");
  websiteIcon.setAttribute("width", "16");
  websiteIcon.setAttribute("height", "16");
  websiteIcon.setAttribute("aria-hidden", "true");
  const websiteShape0 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  websiteShape0.setAttribute("cx", "12");
  websiteShape0.setAttribute("cy", "12");
  websiteShape0.setAttribute("r", "9");
  websiteIcon.appendChild(websiteShape0);
  const websiteShape1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  websiteShape1.setAttribute("d", "M3 12h18");
  websiteIcon.appendChild(websiteShape1);
  const websiteShape2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  websiteShape2.setAttribute("d", "M12 3a15 15 0 0 1 0 18");
  websiteIcon.appendChild(websiteShape2);
  const websiteShape3 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  websiteShape3.setAttribute("d", "M12 3a15 15 0 0 0 0 18");
  websiteIcon.appendChild(websiteShape3);
  website.appendChild(websiteIcon);

  const close = document.createElement("button");
  close.type = "button";
  close.className = "remove";
  close.textContent = "×";
  close.title = "Close popup";
  close.setAttribute("aria-label", "Close privacy settings");

  controls.append(toggle, strength, mode, website, close);
  popupShadow.append(popupCSS, controls);
  document.body.appendChild(popupHost);

  let enabled = true;
  let disposed = false;

  function update() {
    toggle.textContent = enabled ? "ON" : "OFF";
    toggle.title = enabled ? "Turn privacy off" : "Turn privacy on";
    toggle.setAttribute("aria-pressed", String(enabled));
    shield.dataset.enabled = String(enabled);

    scheduleRender();
  }

  // Read geometry only. Never write styles, attributes, scrollTop or children on rows.
  function visibleRect(row, cache, checkHit = true) {
    const r = row.getBoundingClientRect();
    let left = Math.max(0, r.left), top = Math.max(0, r.top);
    let right = Math.min(window.innerWidth, r.right), bottom = Math.min(window.innerHeight, r.bottom);
    for (let parent = row.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      let clip = cache.get(parent);
      if (!clip) {
        const css = getComputedStyle(parent), bounds = parent.getBoundingClientRect();
        clip = {bounds, x: /auto|scroll|hidden|clip/.test(css.overflowX), y: /auto|scroll|hidden|clip/.test(css.overflowY)};
        cache.set(parent, clip);
      }
      if (clip.x) { left = Math.max(left, clip.bounds.left); right = Math.min(right, clip.bounds.right); }
      if (clip.y) { top = Math.max(top, clip.bounds.top); bottom = Math.min(bottom, clip.bounds.bottom); }
    }
    if (right <= left || bottom <= top) return null;
    // Do not blur an unrelated dialog or menu drawn over this row.
    const hit = document.elementFromPoint((left + right) / 2, (top + bottom) / 2);
    if (checkHit && (!hit || !row.contains(hit))) return null;
    return {left, top, width: right - left, height: bottom - top};
  }

  let renderFrame = 0;
  function scheduleRender() {
    if (disposed || renderFrame) return;
    renderFrame = requestAnimationFrame(() => { renderFrame = 0; render(); });
  }
  const resizeObserver = new ResizeObserver(scheduleRender);
  function render() {
    if (disposed) return;
    const rows = enabled ? [...document.querySelectorAll(rowSelector)].filter(row =>
      !row.closest('[data-testid="conversation-header"], footer') &&
      !row.querySelector('[data-testid="conversation-header"]') &&
      !row.querySelector('div[role="row"]') // Only innermost rows: no compounded blur.
    ) : [];
    const current = new Set(rows), clips = new Map();
    // A row's center can remain visible while a menu covers its right edge.
    // Cut overlay rectangles out of each mask instead of blurring the menu.
    const overlays = [...document.querySelectorAll('[role="menu"], [role="dialog"], [aria-modal="true"], [data-testid="context-menu"], [role="menuitem"]')]
      .filter(el => !el.parentElement?.closest('[role="menu"], [role="dialog"], [aria-modal="true"], [data-testid="context-menu"]'))
      .map(el => visibleRect(el, clips, false)).filter(Boolean);
    for (const row of watched) if (!current.has(row)) { resizeObserver.unobserve(row); watched.delete(row); }
    for (const row of rows) if (!watched.has(row)) { resizeObserver.observe(row); watched.add(row); }
    for (const [row, mask] of masks) if (!current.has(row)) { mask.remove(); masks.delete(row); }
    for (const row of rows) {
      const main = row.closest('#main');
      const reveal = mode.value === "chat" && main ? main.matches(':hover, :focus-within') : row.matches(':hover, :focus-within');
      const rect = reveal ? null : visibleRect(row, clips);
      let mask = masks.get(row);
      if (!rect) { if (mask) mask.hidden = true; continue; }
      if (!mask) { mask = document.createElement('div'); layerRoot.appendChild(mask); masks.set(row, mask); }
      mask.hidden = false;
      let cutout = `M0 0H${rect.width}V${rect.height}H0Z`;
      for (const overlay of overlays) {
        const x = Math.max(0, overlay.left - rect.left), y = Math.max(0, overlay.top - rect.top);
        const right = Math.min(rect.width, overlay.left + overlay.width - rect.left);
        const bottom = Math.min(rect.height, overlay.top + overlay.height - rect.top);
        if (right > x && bottom > y) cutout += `M${x} ${y}V${bottom}H${right}V${y}Z`;
      }
      mask.style.cssText = `clip-path:path(nonzero, "${cutout}");position:absolute;pointer-events:none;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;backdrop-filter:blur(${Number(strength.value)}px);-webkit-backdrop-filter:blur(${Number(strength.value)}px)`;
    }
    positionShield();
    positionControls();
  }

  // Measure rendered title text, not the flex container that includes menu space.
  // Keep the shield outside WhatsApp's layout to preserve scroll stability.
  function positionShield() {
    const target = document.querySelector(TARGET) || document.querySelector('#side header h1, #side header h2, #side header [role="heading"], header h1');
    let title = null;
    if (target) {
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.parentElement?.closest('button, [role="button"], a')) continue;
        range.selectNodeContents(node);
        for (const rect of range.getClientRects()) {
          if (!rect.width || !rect.height) continue;
          title = title ? { left: Math.min(title.left, rect.left), right: Math.max(title.right, rect.right), top: Math.min(title.top, rect.top), bottom: Math.max(title.bottom, rect.bottom) } : {left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom};
        }
      }
    }
    const size = 32, gap = 8;
    const clips = new Map();
    const controls = [...document.querySelectorAll('button, [role="button"], a, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter(el => el !== host && !host.contains(el) && !popupHost.contains(el))
      .map(el => visibleRect(el, clips, false)).filter(Boolean)
      .map(r => ({...r, right: r.left + r.width, bottom: r.top + r.height}));
    const fits = ({left, top}) => left >= gap && top >= gap && left + size <= window.innerWidth - gap && top + size <= window.innerHeight - gap &&
      !controls.some(r => left < r.right + 4 && left + size > r.left - 4 && top < r.bottom + 4 && top + size > r.top - 4);
    const candidates = [];
    if (title) {
      const top = Math.max(gap, (title.top + title.bottom - size) / 2);
      candidates.push({left: title.right + gap, top}, {left: title.left - size - gap, top});
    }
    // A floating fallback never changes WhatsApp's DOM layout.
    candidates.push({left: 12, top: window.innerHeight - 44}, {left: window.innerWidth - 44, top: 12});
    for (let top = gap; top <= Math.min(160, window.innerHeight - size - gap); top += 40) {
      for (let left = gap; left <= window.innerWidth - size - gap; left += 40) candidates.push({left, top});
    }
    const placement = candidates.find(fits);
    // Do not cover an existing action if no safe position is available.
    host.hidden = !placement;
    if (!placement) { closeControls(); return; }
    host.style.cssText = `position:fixed;left:${placement.left}px;top:${placement.top}px;z-index:2147483646;background:var(--background-default,#17212b);border-radius:50%`;
  }

  function positionControls() {
    if (controls.hidden) return;
    const rect = shield.getBoundingClientRect();
    const width = controls.offsetWidth;
    const height = controls.offsetHeight;
    const margin = 8;
    const left = Math.max(margin, Math.min(
      rect.left, window.innerWidth - width - margin
    ));
    const below = rect.bottom + margin;
    const above = rect.top - height - margin;
    const top = below + height <= window.innerHeight - margin
      ? below : Math.max(margin, above);
    controls.style.left = `${left}px`;
    controls.style.top = `${top}px`;
  }

  function closeControls(returnFocus = false) {
    controls.hidden = true;
    shield.setAttribute("aria-expanded", "false");
    if (returnFocus) shield.focus({ preventScroll: true });
  }

  shield.addEventListener("click", () => {
    controls.hidden = !controls.hidden;
    shield.setAttribute("aria-expanded", String(!controls.hidden));
    if (!controls.hidden) {
      positionControls();
      toggle.focus({ preventScroll: true });
    }
  });

  popupShadow.addEventListener("keydown", event => {
    if (event.key === "Escape" && !controls.hidden) {
      event.preventDefault();
      event.stopPropagation();
      closeControls(true);
    }
  });

  toggle.addEventListener("click", () => {
    enabled = !enabled;
    update();
  });
  strength.addEventListener("change", update);
  mode.addEventListener("change", () => { update(); positionControls(); });
  close.addEventListener("click", () => closeControls(true));

  function onOutsideClick(event) {
    const path = event.composedPath();
    if (!path.includes(host) && !path.includes(popupHost)) {
      closeControls();
    }
  }

  // Observe layout changes without feeding back our own UI changes.
  const observer = new MutationObserver(records => {
    if (records.some(record => ![host, popupHost, layerHost].some(own => own === record.target || own.contains(record.target)))) scheduleRender();
  });
  const renderEvents = ["scroll", "resize", "pointerover", "pointerout", "focusin", "focusout", "load"];

  function cleanup() {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    resizeObserver.disconnect();
    cancelAnimationFrame(renderFrame);
    for (const event of renderEvents) window.removeEventListener(event, scheduleRender, true);
    document.removeEventListener("pointerdown", onOutsideClick);
    layerHost.remove();
    masks.clear();
    watched.clear();
    host.remove();
    popupHost.remove();
  }

  host.addEventListener(`${ID}-remove`, cleanup, { once: true });
  document.addEventListener("pointerdown", onOutsideClick);
  for (const event of renderEvents) window.addEventListener(event, scheduleRender, { capture: true, passive: true });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class", "hidden"] });
  document.body.appendChild(host);
  resizeObserver.observe(document.body);
  positionShield();
  update();
})();
