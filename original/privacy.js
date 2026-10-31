(() => {
  const ID = "rs-whatsapp-privacy";
  const TARGET = '[data-testid="drawer-title-body"]';

  document.getElementById(`${ID}-toolbar`)
    ?.dispatchEvent(new Event(`${ID}-remove`));
  document.getElementById(`${ID}-style`)?.remove();
  document.getElementById(`${ID}-toolbar`)?.remove();
  document.getElementById(`${ID}-popup`)?.remove();

  const style = document.createElement("style");
  style.id = `${ID}-style`;
  document.head.appendChild(style);

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
  shield.title = "Privacy settings";
  shield.setAttribute("aria-label", "Privacy settings");
  shield.setAttribute("aria-expanded", "false");
  shield.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"
        stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <path d="m8 12 3 3 5-6"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
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

  const website = document.createElement("a");
  website.href = "https://irahulsaini.com";
  website.target = "_blank";
  website.rel = "noopener noreferrer";
  website.title = "Visit irahulsaini.com";
  website.setAttribute("aria-label", "Visit irahulsaini.com");
  website.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round"
      width="16" height="16" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/>
      <path d="M3 12h18"/>
      <path d="M12 3a15 15 0 0 1 0 18"/>
      <path d="M12 3a15 15 0 0 0 0 18"/>
    </svg>
  `;

  const close = document.createElement("button");
  close.type = "button";
  close.className = "remove";
  close.textContent = "×";
  close.title = "Close popup";
  close.setAttribute("aria-label", "Close privacy settings");

  controls.append(toggle, strength, website, close);
  popupShadow.append(popupCSS, controls);
  document.body.appendChild(popupHost);

  let enabled = true;
  let disposed = false;

  function update() {
    toggle.textContent = enabled ? "ON" : "OFF";
    toggle.title = enabled ? "Turn privacy off" : "Turn privacy on";
    toggle.setAttribute("aria-pressed", String(enabled));
    shield.dataset.enabled = String(enabled);

    style.textContent = enabled ? `
      :is(
        #side div[role="row"],
        #main div[role="row"],
        #main > header
      ) {
        filter: blur(${Number(strength.value)}px) !important;
        transition: filter 160ms ease !important;
      }
      :is(
        #side div[role="row"],
        #main div[role="row"],
        #main > header
      ):is(:hover, :focus-within) {
        filter: none !important;
      }
      @media (prefers-reduced-motion: reduce) {
        :is(
          #side div[role="row"],
          #main div[role="row"],
          #main > header
        ) {
          transition: none !important;
        }
      }
    ` : "";
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
    if (returnFocus) shield.focus();
  }

  shield.addEventListener("click", () => {
    controls.hidden = !controls.hidden;
    shield.setAttribute("aria-expanded", String(!controls.hidden));
    if (!controls.hidden) {
      positionControls();
      toggle.focus();
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
  close.addEventListener("click", () => closeControls(true));

  function onOutsideClick(event) {
    const path = event.composedPath();
    if (!path.includes(host) && !path.includes(popupHost)) {
      closeControls();
    }
  }

  function mount() {
    if (disposed) return;
    const target = document.querySelector(TARGET);
    if (!target) return;
    if (target.nextElementSibling !== host) {
      target.insertAdjacentElement("afterend", host);
    }
  }

  let mounting = false;
  const observer = new MutationObserver(() => {
    if (disposed || mounting) return;
    const target = document.querySelector(TARGET);
    if (!target || target.nextElementSibling === host) return;
    mounting = true;
    mount();
    mounting = false;
  });

  function cleanup() {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    document.removeEventListener("pointerdown", onOutsideClick);
    window.removeEventListener("resize", positionControls);
    style.remove();
    host.remove();
    popupHost.remove();
  }

  host.addEventListener(`${ID}-remove`, cleanup, { once: true });
  document.addEventListener("pointerdown", onOutsideClick);
  window.addEventListener("resize", positionControls);
  observer.observe(document.body, { childList: true, subtree: true });
  update();
  mount();
  if (!host.isConnected) {
    console.info("Privacy tool: waiting for WhatsApp header...");
  }
})();
