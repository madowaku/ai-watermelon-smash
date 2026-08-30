import type { Game } from "../game/Game";
import type { GameActionResult } from "../game/types";

export class DebugControls {
  constructor(
    private readonly game: Game,
    private readonly onResult: (result: GameActionResult) => void,
  ) {
    window.addEventListener("keydown", this.onKeyDown);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null;
    if (target?.matches("input, textarea, select, [contenteditable='true']")) {
      return;
    }

    let result: GameActionResult | null = null;

    switch (event.code) {
      case "ArrowLeft":
        result = this.game.turn(-15);
        break;
      case "ArrowRight":
        result = this.game.turn(15);
        break;
      case "ArrowUp":
        result = this.game.walk(0.5);
        break;
      case "Space":
        result = this.game.swing();
        break;
      case "KeyR":
        result = this.game.restart();
        break;
      default:
        return;
    }

    event.preventDefault();
    this.onResult(result);
  };
}
