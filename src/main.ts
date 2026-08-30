import "./style.css";
import { Game } from "./game/Game";
import { DebugControls } from "./input/DebugControls";
import { SceneView } from "./render/SceneView";
import type { GameActionResult } from "./game/types";

const app = document.querySelector<HTMLElement>("#app");
if (!app) {
  throw new Error("Missing #app root element.");
}

app.innerHTML = `
  <section class="game-shell" aria-label="AI Watermelon Smash game">
    <div class="scene-host" id="scene-host" aria-hidden="true"></div>

    <div class="hud">
      <div class="top-row">
        <div class="brand">AI WATERMELON SMASH 🍉</div>
        <div class="status" id="ai-status">Day 1 · AI control next</div>
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
          <div class="stat"><strong id="moves-stat">0</strong><span>Moves</span></div>
          <div class="stat"><strong id="swings-stat">0</strong><span>Swings</span></div>
          <div class="stat"><strong id="bumps-stat">0</strong><span>Bumps</span></div>
        </div>
        <button class="restart" id="restart-button" type="button">PLAY AGAIN</button>
      </div>
    </div>
  </section>
`;

const sceneHost = document.querySelector<HTMLElement>("#scene-host");
const prompt = document.querySelector<HTMLElement>("#prompt");
const debugHelp = document.querySelector<HTMLElement>("#debug-help");
const resultWrap = document.querySelector<HTMLElement>("#result-wrap");
const movesStat = document.querySelector<HTMLElement>("#moves-stat");
const swingsStat = document.querySelector<HTMLElement>("#swings-stat");
const bumpsStat = document.querySelector<HTMLElement>("#bumps-stat");
const restartButton = document.querySelector<HTMLButtonElement>("#restart-button");

if (!sceneHost || !prompt || !debugHelp || !resultWrap || !movesStat || !swingsStat || !bumpsStat || !restartButton) {
  throw new Error("Game UI failed to initialize.");
}

const game = new Game();
const view = new SceneView(sceneHost, () => game.getState());
const debugEnabled = new URLSearchParams(window.location.search).get("debug") === "1";

debugHelp.hidden = !debugEnabled;

function showActionResult(result: GameActionResult): void {
  prompt.innerHTML = `<strong>Blindfolded partner</strong>${escapeHtml(result.message)}`;
}

function refreshUi(): void {
  const state = game.getState();
  movesStat.textContent = String(state.round.moveCount);
  swingsStat.textContent = String(state.round.swingCount);
  bumpsStat.textContent = String(state.round.collisionCount);
  resultWrap.dataset.visible = String(state.phase === "success");
}

if (debugEnabled) {
  new DebugControls(game, (result) => {
    showActionResult(result);
    refreshUi();
  });
}

restartButton.addEventListener("click", () => {
  showActionResult(game.restart());
  refreshUi();
});

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
