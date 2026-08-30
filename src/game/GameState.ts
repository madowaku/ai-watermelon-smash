import type { GameState } from "./types";

export function createInitialGameState(nowMs = performance.now()): GameState {
  return {
    phase: "playing",
    player: {
      x: 0,
      z: 5.4,
      headingDeg: 0,
    },
    watermelon: {
      x: 3.9,
      z: -4.8,
      radius: 0.48,
      broken: false,
    },
    obstacles: [
      { id: "rock-1", kind: "rock", x: 1.4, z: 1.8, radius: 0.75 },
      { id: "bucket-1", kind: "bucket", x: 4.5, z: -0.7, radius: 0.55 },
      { id: "palm-1", kind: "palm", x: -3.8, z: -3.1, radius: 0.8 },
    ],
    round: {
      moveCount: 0,
      swingCount: 0,
      collisionCount: 0,
      startedAtMs: nowMs,
    },
    lastEvent: {
      type: "restart",
      message: "Which way?",
    },
  };
}
