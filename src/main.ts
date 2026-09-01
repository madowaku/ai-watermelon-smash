import "./style.css";
import { Game } from "./game/Game";
import { DebugControls } from "./input/DebugControls";
import { SceneView } from "./render/SceneView";
import type { GameActionResult } from "./game/types";
import { registerWebMcpTools, type WebMcpStatus } from "./webmcp/WebMcpAdapter";
import { GuideStore, type GuideId } from "./guides/GuideStore";

const app = document.querySelector<HTMLElement>("#app");
if (!app) {
  throw new Error("Missing #app root element.");
}

app.innerHTML = `
  <section class="game-shell" aria-label="AI Watermelon Smash game">
    <div class="scene-host" id="scene-host" aria-hidden="true"></div>

    <aside class="guide-chorus" id="guide-chorus" data-collapsed="false" aria-label="Guide Chorus">
      <button class="guide-toggle" id="guide-toggle" type="button" aria-expanded="true" aria-controls="guide-content">
        <span>GUIDE CHORUS</span>
        <span class="guide-toggle-icon" aria-hidden="true">⌄</span>
      </button>
      <div class="guide-content" id="guide-content">
        <div class="guide-title">GUIDE CHORUS</div>
        <p class="guide-subtitle">Three humans can disagree. The blindfolded AI decides who to trust.</p>
        <div class="guide-rows">
          <form class="guide-row" data-guide="A">
            <div class="guide-row-controls">
              <span class="guide-label" aria-hidden="true">A</span>
              <input id="guide-input-A" name="guide-A" type="text" autocomplete="off" placeholder="Message from guide A" aria-label="Message from guide A">
              <button class="guide-send" type="submit">SEND</button>
            </div>
            <p class="guide-latest" data-guide-latest="A" data-has-message="false">No message yet.</p>
          </form>
          <form class="guide-row" data-guide="B">
            <div class="guide-row-controls">
              <span class="guide-label" aria-hidden="true">B</span>
              <input id="guide-input-B" name="guide-B" type="text" autocomplete="off" placeholder="Message from guide B" aria-label="Message from guide B">
              <button class="guide-send" type="submit">SEND</button>
            </div>
            <p class="guide-latest" data-guide-latest="B" data-has-message="false">No message yet.</p>
          </form>
          <form class="guide-row" data-guide="C">
            <div class="guide-row-controls">
              <span class="guide-label" aria-hidden="true">C</span>
              <input id="guide-input-C" name="guide-C" type="text" autocomplete="off" placeholder="Message from guide C" aria-label="Message from guide C">
              <button class="guide-send" type="submit">SEND</button>
            </div>
            <p class="guide-latest" data-guide-latest="C" data-has-message="false">No message yet.</p>
          </form>
        </div>
        <p class="guide-feedback" id="guide-feedback" role="status" aria-live="polite"></p>
      </div>
    </aside>

    <div class="hud">
      <div class="top-row">
        <div class="brand">AI WATERMELON SMASH 🍉</div>
        <div class="status" id="ai-status" data-state="connecting">WebMCP · CONNECTING</div>
      </div>

      <div class="bottom-row">
        <div class="debug-help" id="debug-help" hidden>
          DEBUG · ←/→ turn · ↑ walk · Space swing · R restart
        </div>
        <div class="prompt" id="prompt" role="status" aria-live="polite">
          <strong>Blindfolded partner</strong>
          Which way?
        </div>
      </div>
    </div>

    <div class="result-wrap" id="result-wrap" data-visible="false">
      <div class="result-card">
        <h1>WE GOT IT! 🍉</h1>
        <p>Human + AI. One very unlucky watermelon.</p>
        <div class="stats">
          <div class="stat"><strong id="moves-stat">0</strong><span>Actions</span></div>
          <div class="stat"><strong id="swings-stat">0</strong><span>Swings</span></div>
          <div class="stat"><strong id="bumps-stat">0</strong><span>Bumps</span></div>
        </div>
        <button class="restart" id="restart-button" type="button">PLAY AGAIN</button>
      </div>
    </div>
  </section>
`;

function getRequiredElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Game UI failed to initialize: missing ${selector}.`);
  }
  return element;
}

const sceneHost = getRequiredElement<HTMLElement>("#scene-host");
const prompt = getRequiredElement<HTMLElement>("#prompt");
const debugHelp = getRequiredElement<HTMLElement>("#debug-help");
const resultWrap = getRequiredElement<HTMLElement>("#result-wrap");
const movesStat = getRequiredElement<HTMLElement>("#moves-stat");
const swingsStat = getRequiredElement<HTMLElement>("#swings-stat");
const bumpsStat = getRequiredElement<HTMLElement>("#bumps-stat");
const restartButton = getRequiredElement<HTMLButtonElement>("#restart-button");
const aiStatus = getRequiredElement<HTMLElement>("#ai-status");

const guideChorus = getRequiredElement<HTMLElement>("#guide-chorus");
const guideToggle = getRequiredElement<HTMLButtonElement>("#guide-toggle");
const guideFeedback = getRequiredElement<HTMLElement>("#guide-feedback");
const guideIds: readonly GuideId[] = ["A", "B", "C"];
const guideInputs = new Map<GuideId, HTMLInputElement>();
const guideLatest = new Map<GuideId, HTMLElement>();
for (const guide of guideIds) {
  guideInputs.set(guide, getRequiredElement<HTMLInputElement>(`#guide-input-${guide}`));
  guideLatest.set(guide, getRequiredElement<HTMLElement>(`[data-guide-latest="${guide}"]`));
}

const game = new Game();
const guideStore = new GuideStore();
const view = new SceneView(sceneHost, () => game.getState());
const debugEnabled = new URLSearchParams(window.location.search).get("debug") === "1";

debugHelp.hidden = !debugEnabled;

function clearGuideMessages(): void {
  guideStore.clear();
  for (const guide of guideIds) {
    const input = guideInputs.get(guide);
    const latest = guideLatest.get(guide);
    if (input && latest) {
      input.value = "";
      latest.textContent = "No message yet.";
      latest.dataset.hasMessage = "false";
    }
  }
  guideFeedback.textContent = "";
  setGuideCollapsed(window.matchMedia("(max-width: 640px)").matches);
}

function submitGuideMessage(guide: GuideId): void {
  const input = guideInputs.get(guide);
  const latest = guideLatest.get(guide);
  if (!input || !latest) {
    return;
  }

  const message = guideStore.addMessage(guide, input.value);
  if (!message) {
    guideFeedback.textContent = "Messages must contain 1–160 characters.";
    return;
  }

  input.value = "";
  latest.textContent = message.text;
  latest.dataset.hasMessage = "true";
  guideFeedback.textContent = "";
}

for (const guide of guideIds) {
  const form = getRequiredElement<HTMLFormElement>(`form[data-guide="${guide}"]`);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitGuideMessage(guide);
  });
}

const setGuideCollapsed = (collapsed: boolean): void => {
  guideChorus.dataset.collapsed = String(collapsed);
  guideToggle.setAttribute("aria-expanded", String(!collapsed));
};
setGuideCollapsed(window.matchMedia("(max-width: 640px)").matches);
guideToggle.addEventListener("click", () => {
  setGuideCollapsed(guideChorus.dataset.collapsed !== "true");
});

function showActionResult(result: GameActionResult): void {
  prompt.innerHTML = `<strong>Blindfolded partner</strong>${escapeHtml(result.message)}`;
}

function showWebMcpStatus(status: WebMcpStatus): void {
  aiStatus.dataset.state = status;
  aiStatus.textContent = `WebMCP · ${status.toUpperCase()}`;
}

function refreshUi(): void {
  const state = game.getState();
  movesStat.textContent = String(state.round.moveCount);
  swingsStat.textContent = String(state.round.swingCount);
  bumpsStat.textContent = String(state.round.collisionCount);
  resultWrap.dataset.visible = String(state.phase === "success");
  if (state.phase === "success") setGuideCollapsed(true);
}

if (debugEnabled) {
  new DebugControls(game, (result) => {
    showActionResult(result);
    refreshUi();
  }, clearGuideMessages);
}

restartButton.addEventListener("click", () => {
  clearGuideMessages();
  showActionResult(game.restart());
  refreshUi();
});

void registerWebMcpTools(game, {
  onActionResult: (result) => {
    showActionResult(result);
    refreshUi();
  },
  onStatusChange: showWebMcpStatus,
}, guideStore);

function frame(nowMs: number): void {
  view.render(nowMs);
  refreshUi();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}
