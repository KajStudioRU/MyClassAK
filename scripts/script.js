/**
 * Simple Visual Novel Engine Demo
 * - Title screen with Continue / Start New Game
 * - Two demo scenes with a choice
 * - Typing dialogue, click or Space/Enter to advance/skip
 * - Scene change wipe-left transition; portrait mounts after wipe
 * - Optional BGM with mute toggle (top-left)
 * - Choices overlay; affects state
 * - Dev console overlay with jump/inspect hooks
 */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* DOM refs */
const titleScreen = $("#title-screen");
const continueBtn = $("#continue-btn");
const newGameBtn = $("#newgame-btn");
const devToggleBtn = $("#devconsole-toggle");

const gameScreen = $("#game-screen");
const bgImage = $("#bg-image");
const portraitImage = $("#portrait-image");
const wipeOverlay = $("#wipe-overlay");
const bgm = $("#bgm");
const muteBtn = $("#mute-btn");

const dialogueLayer = $("#dialogue-layer");
const nameTag = $("#name-tag");
const dialogueBox = $("#dialogue-box");
const dialogueSpeaker = $("#dialogue-speaker");
const dialogueText = $("#dialogue-text");

const choicesOverlay = $("#choices-overlay");
const choicesContainer = $("#choices-container");
const choicesCancelBtn = $("#choices-cancel");

const devConsole = $("#dev-console");
const devConsoleClose = $("#devconsole-close");
const devSkipToEnd = $("#dev-skip-to-end");
const devState = $("#dev-state");

/* Persistence */
const STORAGE_KEY = "vn_save_v1";
const SETTINGS_KEY = "vn_settings_v1";

/* Engine State */
const Engine = {
  sceneId: null,
  lineIndex: 0,
  typing: false,
  typeSpeed: 25,
  textBuffer: "",
  flags: {}, // choice flags or conditions
  seenScenes: new Set(),
};

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    if (typeof s.muted === "boolean") bgm.muted = s.muted;
  } catch {}
  updateMuteIcon();
}
function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ muted: bgm.muted }));
}

function hasSave() {
  return !!localStorage.getItem(STORAGE_KEY);
}
function saveGame() {
  const payload = {
    sceneId: Engine.sceneId,
    lineIndex: Engine.lineIndex,
    flags: Engine.flags,
    seenScenes: Array.from(Engine.seenScenes),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
function loadGame() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (!data.sceneId) return false;
    Engine.sceneId = data.sceneId;
    Engine.lineIndex = data.lineIndex || 0;
    Engine.flags = data.flags || {};
    Engine.seenScenes = new Set(data.seenScenes || []);
    return true;
  } catch {
    return false;
  }
}
function clearSave() {
  localStorage.removeItem(STORAGE_KEY);
}

/* Content model */
const Scenes = {
  scene1: {
    id: "scene1",
    bg: "assets/images/bg/bg_home.png",
    portrait: "assets/images/char/char_a.png",
    music: null, // provide an audio path if available, will loop
    lines: [
      { name: "Narrator", text: "A soft breeze greets the morning. Another day, another story waiting to be written." },
      { name: "Alex", text: "Hah... I really should head out before I'm late again." },
      { name: "Alex", text: "Still, I can't shake this feeling—like something is about to change." },
      { name: "Narrator", text: "On the way, a thought lingers. Do you embrace the unknown, or play it safe?" },
      { type: "choice", prompt: "What do you do?", options: [
        { text: "Take a detour through the park", set: { tookPark: true }, next: "scene2" },
        { text: "Stick to the usual route", set: { tookPark: false }, next: "scene2" },
      ]},
    ],
  },
  scene2: {
    id: "scene2",
    bg: "assets/images/bg/bg_classroom.png",
    portrait: "assets/images/char/char_b.png",
    music: null,
    lines: [
      { name: "Narrator", text: "Later that day, the classroom buzzes with quiet anticipation." },
      { name: "Taylor", text: "You're here! I saved you a seat." },
      { name: "Alex", text: "Thanks. By the way... I took a moment to think this morning." },
      { name: "Taylor", text: (state) => state.flags.tookPark
          ? "Through the park again? You and your scenic routes."
          : "Stuck to the plan, huh? Reliable as always." },
      { name: "Narrator", text: "The bell rings. A new chapter begins." },
      { name: "System", text: "Demo complete. Replay from the title screen?", end: true },
    ],
  }
};

/* Title Screen initialization */
function updateTitleScreen() {
  titleScreen.classList.add("active");
  gameScreen.classList.remove("active");
  continueBtn.disabled = !hasSave();
}
function goToTitle() {
  stopBgm();
  hideOverlay(choicesOverlay);
  hideOverlay(devConsole);
  titleScreen.classList.add("active");
  gameScreen.classList.remove("active");
  continueBtn.disabled = !hasSave();
}

/* Scene rendering */
async function startNewGame() {
  clearSave();
  Engine.sceneId = "scene1";
  Engine.lineIndex = 0;
  Engine.flags = {};
  Engine.seenScenes = new Set();
  await enterGame();
}
async function continueGame() {
  if (!loadGame()) return;
  await enterGame();
}

async function enterGame() {
  titleScreen.classList.remove("active");
  gameScreen.classList.add("active");
  await showScene(Engine.sceneId, { wipe: true, fromStart: Engine.lineIndex === 0 });
  await playLoopIfAny(Scenes[Engine.sceneId].music);
  renderDevState();
}

function setBackground(src) {
  bgImage.src = src || "";
}
function setPortrait(src) {
  if (src) {
    portraitImage.src = src;
    // prepare for fade-in
    portraitImage.classList.remove("show");
    portraitImage.style.display = "block";
    // allow layout to apply before adding show (opacity transition)
    requestAnimationFrame(() => {
      portraitImage.classList.add("show");
    });
  } else {
    portraitImage.classList.remove("show");
    portraitImage.style.display = "none";
    portraitImage.removeAttribute("src");
  }
}

function stopBgm() {
  bgm.pause();
  bgm.removeAttribute("src");
}

async function playLoopIfAny(src) {
  if (!src) return;
  if (bgm.src.endsWith(src)) {
    bgm.play().catch(() => {});
    return;
  }
  bgm.src = src;
  try { await bgm.play(); } catch {}
}

function updateMuteIcon() {
  muteBtn.textContent = bgm.muted ? "🔈" : "🔇";
}

/* Wipe transition: mount bg immediately, delay portrait until after wipe */
async function wipeTransition() {
  gameScreen.classList.add("wiping");
  await new Promise((res) => {
    const handler = () => { wipeOverlay.removeEventListener("animationend", handler); res(); };
    wipeOverlay.addEventListener("animationend", handler, { once: true });
    // trigger by forcing reflow then adding class is done via parent 'wiping'
  });
  gameScreen.classList.remove("wiping");
}

async function showScene(id, { wipe = true, fromStart = true } = {}) {
  const scene = Scenes[id];
  if (!scene) return;
  Engine.sceneId = id;
  Engine.seenScenes.add(id);
  if (fromStart) Engine.lineIndex = 0;

  // Set bg immediately, hide portrait until wipe is done
  setBackground(scene.bg);
  const portraitSrc = scene.portrait;

  // Begin wipe
  if (wipe) {
    setPortrait(null);
    await nextAnimationFrame(); // ensure DOM applied
    await wipeTransition();
  }

  // Mount portrait after the wipe completes
  setPortrait(portraitSrc);

  // Start BGM if any
  await playLoopIfAny(scene.music);

  // Begin dialogue
  await runDialogueLoop(scene);
}

async function runDialogueLoop(scene) {
  while (Engine.sceneId === scene.id && Engine.lineIndex < scene.lines.length) {
    const entry = scene.lines[Engine.lineIndex];

    // Choice entry
    if (entry && entry.type === "choice") {
      await presentChoice(entry);
      Engine.lineIndex++;
      saveGame();
      continue;
    }

    // End entry (show prompt and return to title)
    if (entry && entry.end) {
      await typeLine(entry.name || null, entry.text);
      await waitForAdvance();
      goToTitle();
      return;
    }

    // Standard line
    const name = entry.name || null;
    const text = typeof entry.text === "function" ? entry.text(Engine) : entry.text;
    await typeLine(name, text);
    await waitForAdvance();

    Engine.lineIndex++;
    saveGame();
  }

  // Scene finished; for demo, go to title
  goToTitle();
}

/* Typing system */
function setNameTag(maybe) {
  // external name tag no longer used; keep hidden
  nameTag.style.display = "none";
}

async function typeLine(name, text) {
  // Speaker inside dialogue box (bold, colored)
  dialogueSpeaker.textContent = name ? String(name) : "";
  dialogueSpeaker.style.display = name ? "block" : "none";

  // Prepare state
  const full = String(text);
  dialogueText.textContent = "";
  dialogueBox.classList.remove("ready");
  Engine.typing = true;

  // Ensure skip-to-full works immediately on first click
  const skipHandler = () => {
    if (Engine.typing) {
      Engine.typing = false;
      dialogueText.textContent = full;
    }
  };
  // Use capture to ensure it runs even if descendants stop propagation
  dialogueBox.addEventListener("click", skipHandler, { capture: true, once: true });

  // Type loop
  const chars = [...full];
  for (let i = 0; i < chars.length; i++) {
    if (!Engine.typing) break;
    dialogueText.textContent += chars[i];
    await delay(Engine.typeSpeed);
  }

  // Finalize
  if (!Engine.typing) {
    dialogueText.textContent = full;
  }
  Engine.typing = false;
  dialogueBox.classList.add("ready");
}

function waitForAdvance() {
  return new Promise((resolve) => {
    const finishTyping = () => {
      // force full text to appear immediately
      Engine.typing = false;
      // dialogueText is filled by typeLine loop on next tick, but ensure here too:
      // no-op here; typeLine checks Engine.typing and sets full text.
    };
    const proceed = () => {
      cleanup();
      resolve();
    };
    const handler = () => {
      if (Engine.typing) {
        finishTyping();
        return;
      }
      proceed();
    };
    const keyHandler = (e) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handler();
      }
    };
    // Attach listeners directly on the dialogue box to guarantee clicks register
    const clickHandler = (e) => {
      if (e.target.closest("#dialogue-box")) {
        handler();
      }
    };
    function cleanup() {
      dialogueBox.removeEventListener("click", clickHandler);
      window.removeEventListener("keydown", keyHandler);
    }
    dialogueBox.addEventListener("click", clickHandler);
    window.addEventListener("keydown", keyHandler);
  });
}

/* Choices */
function presentChoice(entry) {
  return new Promise((resolve) => {
    choicesContainer.innerHTML = "";
    entry.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = opt.text;
      btn.addEventListener("click", () => {
        // apply state mutation
        if (opt.set) Object.assign(Engine.flags, opt.set);
        // go to next scene if specified
        if (opt.next && Scenes[opt.next]) {
          Engine.sceneId = opt.next;
          Engine.lineIndex = 0;
          saveGame();
          hideOverlay(choicesOverlay);
          // Show next scene with wipe
          showScene(opt.next, { wipe: true, fromStart: true }).then(resolve);
          return;
        }
        hideOverlay(choicesOverlay);
        resolve();
      });
      choicesContainer.appendChild(btn);
    });

    choicesCancelBtn.classList.add("hidden"); // not used now, but structured
    showOverlay(choicesOverlay);
  });
}

/* Overlays */
function showOverlay(el) {
  el.classList.remove("hidden");
}
function hideOverlay(el) {
  el.classList.add("hidden");
}

/* Utils */
function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function nextAnimationFrame() {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

/* Dev Console */
function toggleDevConsole(show) {
  if (typeof show === "boolean") {
    show ? showOverlay(devConsole) : hideOverlay(devConsole);
  } else {
    devConsole.classList.contains("hidden") ? showOverlay(devConsole) : hideOverlay(devConsole);
  }
  renderDevState();
}
function renderDevState() {
  const snapshot = {
    sceneId: Engine.sceneId,
    lineIndex: Engine.lineIndex,
    flags: Engine.flags,
    seenScenes: Array.from(Engine.seenScenes),
    hasSave: hasSave(),
    muted: bgm.muted,
  };
  devState.textContent = JSON.stringify(snapshot, null, 2);
}

/* Event wiring */
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  updateTitleScreen();

  if (hasSave()) continueBtn.removeAttribute("disabled");

  continueBtn.addEventListener("click", continueGame);
  newGameBtn.addEventListener("click", startNewGame);

  muteBtn.addEventListener("click", () => {
    bgm.muted = !bgm.muted;
    updateMuteIcon();
    saveSettings();
  });

  devToggleBtn.addEventListener("click", () => toggleDevConsole());
  devConsoleClose.addEventListener("click", () => toggleDevConsole(false));
  devSkipToEnd.addEventListener("click", () => {
    // Simple demo hook: jump to end line of current scene
    const s = Scenes[Engine.sceneId || "scene1"];
    Engine.sceneId = s.id;
    Engine.lineIndex = s.lines.length - 1;
    saveGame();
    if (!gameScreen.classList.contains("active")) enterGame();
    toggleDevConsole(false);
    renderDevState();
  });

  // Dev console: jump buttons
  $$("#dev-console .dev-actions button[data-jump]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-jump");
      if (Scenes[target]) {
        Engine.sceneId = target;
        Engine.lineIndex = 0;
        saveGame();
        if (!gameScreen.classList.contains("active")) enterGame();
        else showScene(target, { wipe: true, fromStart: true });
        toggleDevConsole(false);
      }
    });
  });
});
