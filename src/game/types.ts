export type GamePhase = "playing" | "success";

export type ObstacleKind = "rock" | "bucket" | "palm";

export interface Vec2 {
  x: number;
  z: number;
}

export interface ObstacleState extends Vec2 {
  id: string;
  kind: ObstacleKind;
  radius: number;
}

export interface GameEvent {
  type: "turn" | "walk" | "collision" | "swing" | "success" | "restart";
  message: string;
}

export interface GameState {
  phase: GamePhase;
  player: Vec2 & {
    headingDeg: number;
  };
  watermelon: Vec2 & {
    radius: number;
    broken: boolean;
  };
  obstacles: ObstacleState[];
  round: {
    moveCount: number;
    swingCount: number;
    collisionCount: number;
    startedAtMs: number;
  };
  lastEvent: GameEvent | null;
}

export interface GameActionResult {
  ok: boolean;
  message: string;
}
