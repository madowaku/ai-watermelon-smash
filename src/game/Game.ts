import { createInitialGameState } from "./GameState";
import type { GameActionResult, GameState, ObstacleState } from "./types";

const WORLD_HALF_EXTENT = 9.2;
const PLAYER_RADIUS = 0.45;
const WALK_STEP = 0.05;
const SWING_DISTANCE = 1.6;
const SWING_HALF_ANGLE_DEG = 35;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeHeading(degrees: number): number {
  return ((degrees + 180) % 360 + 360) % 360 - 180;
}

function distance(aX: number, aZ: number, bX: number, bZ: number): number {
  return Math.hypot(aX - bX, aZ - bZ);
}

function angleDeltaDeg(a: number, b: number): number {
  return Math.abs(normalizeHeading(a - b));
}

export class Game {
  private state: GameState = createInitialGameState();

  getState(): Readonly<GameState> {
    return this.state;
  }

  restart(): GameActionResult {
    this.state = createInitialGameState();
    return { ok: true, message: "New round. Which way?" };
  }

  turn(degrees: number): GameActionResult {
    if (this.state.phase !== "playing") {
      return this.finishedResult();
    }

    if (!Number.isFinite(degrees)) {
      return { ok: false, message: "Turn angle must be a finite number." };
    }

    const applied = clamp(degrees, -180, 180);
    this.state.player.headingDeg = normalizeHeading(this.state.player.headingDeg + applied);
    this.state.round.moveCount += 1;

    const direction = applied < 0 ? "left" : "right";
    const magnitude = Math.abs(applied).toFixed(0);
    const message = `Turned ${direction} ${magnitude}°. Heading is now ${this.state.player.headingDeg.toFixed(0)}° from the start direction.`;
    this.state.lastEvent = { type: "turn", message };
    return { ok: true, message };
  }

  walk(requestedDistance: number): GameActionResult {
    if (this.state.phase !== "playing") {
      return this.finishedResult();
    }

    if (!Number.isFinite(requestedDistance) || requestedDistance <= 0) {
      return { ok: false, message: "Walk distance must be greater than zero." };
    }

    const requested = clamp(requestedDistance, 0.25, 3);
    const headingRad = (this.state.player.headingDeg * Math.PI) / 180;
    const dx = Math.sin(headingRad);
    const dz = -Math.cos(headingRad);

    let travelled = 0;
    let collided = false;

    while (travelled + 0.0001 < requested) {
      const step = Math.min(WALK_STEP, requested - travelled);
      const nextX = this.state.player.x + dx * step;
      const nextZ = this.state.player.z + dz * step;

      if (this.isBlocked(nextX, nextZ)) {
        collided = true;
        break;
      }

      this.state.player.x = nextX;
      this.state.player.z = nextZ;
      travelled += step;
    }

    this.state.round.moveCount += 1;

    if (collided) {
      this.state.round.collisionCount += 1;
      const message = `Tried to walk ${requested.toFixed(2)} m but stopped after ${travelled.toFixed(2)} m because something blocked the path.`;
      this.state.lastEvent = { type: "collision", message };
      return { ok: true, message };
    }

    const message = `Walked ${travelled.toFixed(2)} m. No collision.`;
    this.state.lastEvent = { type: "walk", message };
    return { ok: true, message };
  }

  swing(): GameActionResult {
    if (this.state.phase !== "playing") {
      return this.finishedResult();
    }

    this.state.round.swingCount += 1;

    if (this.isTargetInSwingCone(this.state.watermelon.x, this.state.watermelon.z, SWING_DISTANCE)) {
      this.state.watermelon.broken = true;
      this.state.phase = "success";
      const message = "Direct hit! We smashed the watermelon together.";
      this.state.lastEvent = { type: "success", message };
      return { ok: true, message };
    }

    const obstacle = this.state.obstacles.find((candidate) =>
      this.isTargetInSwingCone(candidate.x, candidate.z, 1.45 + candidate.radius * 0.25),
    );

    if (obstacle) {
      const message = `Swing complete. You hit a ${this.obstacleLabel(obstacle)}.`;
      this.state.lastEvent = { type: "swing", message };
      return { ok: true, message };
    }

    const message = "Swing complete. You hit only sand and air.";
    this.state.lastEvent = { type: "swing", message };
    return { ok: true, message };
  }

  private isBlocked(x: number, z: number): boolean {
    if (Math.abs(x) > WORLD_HALF_EXTENT || Math.abs(z) > WORLD_HALF_EXTENT) {
      return true;
    }

    const blockedByObstacle = this.state.obstacles.some(
      (obstacle) => distance(x, z, obstacle.x, obstacle.z) < PLAYER_RADIUS + obstacle.radius,
    );

    if (blockedByObstacle) {
      return true;
    }

    if (!this.state.watermelon.broken) {
      return (
        distance(x, z, this.state.watermelon.x, this.state.watermelon.z) <
        PLAYER_RADIUS + this.state.watermelon.radius
      );
    }

    return false;
  }

  private isTargetInSwingCone(targetX: number, targetZ: number, maxDistance: number): boolean {
    const dx = targetX - this.state.player.x;
    const dz = targetZ - this.state.player.z;
    const targetDistance = Math.hypot(dx, dz);

    if (targetDistance > maxDistance) {
      return false;
    }

    const targetHeading = (Math.atan2(dx, -dz) * 180) / Math.PI;
    return angleDeltaDeg(targetHeading, this.state.player.headingDeg) <= SWING_HALF_ANGLE_DEG;
  }

  private obstacleLabel(obstacle: ObstacleState): string {
    switch (obstacle.kind) {
      case "rock":
        return "rock";
      case "bucket":
        return "bucket";
      case "palm":
        return "palm tree";
    }
  }

  private finishedResult(): GameActionResult {
    return {
      ok: false,
      message: "The watermelon is already smashed. Start a new round before taking another action.",
    };
  }
}
