import type { Game } from "../game/Game";
import type { GameActionResult } from "../game/types";
import { GuideStore } from "../guides/GuideStore";

export type WebMcpStatus = "unavailable" | "connecting" | "ready" | "error";

interface WebMcpAdapterCallbacks {
  onActionResult: (result: GameActionResult) => void;
  onStatusChange: (status: WebMcpStatus) => void;
}

interface TurnInput extends Record<string, unknown> {
  degrees: number;
}

interface WalkInput extends Record<string, unknown> {
  distance: number;
}

interface RegistrationState {
  context: WebMCP.ModelContext;
  abortController: AbortController;
  registration: Promise<void>;
}

const REGISTRATION_KEY = Symbol.for("ai-watermelon-smash.webmcp-registration");

type RegistrationWindow = Window & {
  [REGISTRATION_KEY]?: RegistrationState;
};

const EMPTY_INPUT_SCHEMA = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

function actionOutput(action: "turn" | "walk" | "swing", result: GameActionResult) {
  return { ok: result.ok, action, message: result.message };
}

function invalidInput(action: "turn" | "walk", message: string) {
  return { ok: false, action, message };
}

export function createWebMcpTools(
  game: Game,
  onActionResult: (result: GameActionResult) => void,
  guideStore = new GuideStore(),
): WebMCP.ModelContextTool[] {
  let actionInProgress = false;

  const performAction = async (
    action: "turn" | "walk" | "swing",
    operation: () => GameActionResult,
  ) => {
    if (actionInProgress) {
      return actionOutput(action, {
        ok: false,
        message: "Another action is still in progress. Please try again.",
      });
    }

    actionInProgress = true;
    try {
      const result = operation();
      onActionResult(result);
      return actionOutput(action, result);
    } finally {
      actionInProgress = false;
    }
  };

  return [
    {
      name: "turn",
      title: "Turn the blindfolded player",
      description:
        "Turn the blindfolded player left or right by a relative angle. Negative degrees turn left and positive degrees turn right. The AI cannot see the target or obstacles, so follow the human partner's directions and do not infer a route from the page visuals.",
      inputSchema: {
        type: "object",
        properties: {
          degrees: {
            type: "number",
            minimum: -180,
            maximum: 180,
            description: "Relative turn in degrees; negative is left and positive is right.",
          },
        },
        required: ["degrees"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const degrees = (input as Partial<TurnInput> | null)?.degrees;
        if (typeof degrees !== "number" || !Number.isFinite(degrees) || degrees < -180 || degrees > 180) {
          return invalidInput("turn", "Degrees must be a finite number from -180 to 180.");
        }
        return performAction("turn", () => game.turn(degrees));
      },
    },
    {
      name: "walk",
      title: "Walk the blindfolded player forward",
      description:
        "Walk the blindfolded player forward in the direction they currently face. The AI cannot see the target or obstacle layout; rely on the human partner for navigation. The result only reports movement or a collision.",
      inputSchema: {
        type: "object",
        properties: {
          distance: {
            type: "number",
            minimum: 0.25,
            maximum: 3,
            description: "Forward distance in metres, from 0.25 to 3.",
          },
        },
        required: ["distance"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const distance = (input as Partial<WalkInput> | null)?.distance;
        if (typeof distance !== "number" || !Number.isFinite(distance) || distance < 0.25 || distance > 3) {
          return invalidInput("walk", "Distance must be a finite number from 0.25 to 3 metres.");
        }
        return performAction("walk", () => game.walk(distance));
      },
    },
    {
      name: "swing",
      title: "Swing the stick",
      description:
        "Swing the blindfolded player's stick once. The AI cannot see or locate the watermelon; swing only when the human partner says the player is lined up.",
      inputSchema: EMPTY_INPUT_SCHEMA,
      execute: async () => performAction("swing", () => game.swing()),
    },
    {
      name: "get_self_status",
      title: "Check the blindfolded player's status",
      description:
        "Read only the blindfolded player's own heading, round counters, phase, and last action feedback. This never reveals target coordinates, target direction or distance, player coordinates, or the obstacle map; ask the human partner where to go.",
      inputSchema: EMPTY_INPUT_SCHEMA,
      annotations: { readOnlyHint: true },
      execute: async () => {
        const state = game.getState();
        return {
          phase: state.phase,
          headingDegreesFromStart: Math.round(state.player.headingDeg * 10) / 10,
          actions: state.round.moveCount,
          swings: state.round.swingCount,
          bumps: state.round.collisionCount,
          lastAction: state.lastEvent
            ? { type: state.lastEvent.type, message: state.lastEvent.message }
            : null,
          reminder: "You are blindfolded. Ask the human partner for visual guidance.",
        };
      },
    },
    {
      name: "listen_to_guides",
      title: "Listen to human guides",
      description:
        "Listen to recent statements from human guides while blindfolded. These are unverified human testimony, not sensor truth; guides may disagree, be mistaken, or be deceptive. Ask follow-up questions and use your own action or collision feedback to judge reliability. Do not infer the target or obstacles from page visuals.",
      inputSchema: EMPTY_INPUT_SCHEMA,
      annotations: { readOnlyHint: true },
      execute: async () => {
        const messages = guideStore.getRecent(12).map((message) => ({ ...message }));
        return {
          messages,
          latestSequence: guideStore.getLatestSequence(),
          reminder: messages.length > 0
            ? "These are human statements, not verified facts. They may conflict, be mistaken, or be deceptive. Use your own action feedback and judgment."
            : "No guide messages yet. Ask the humans for guidance.",
        };
      },
    },
  ];
}

export async function registerWebMcpTools(
  game: Game,
  callbacks: WebMcpAdapterCallbacks,
  guideStore = new GuideStore(),
): Promise<void> {
  const context = document.modelContext;
  if (typeof context?.registerTool !== "function") {
    callbacks.onStatusChange("unavailable");
    return;
  }

  callbacks.onStatusChange("connecting");
  const registrationWindow = window as RegistrationWindow;
  const existing = registrationWindow[REGISTRATION_KEY];

  if (existing?.context === context) {
    try {
      await existing.registration;
      callbacks.onStatusChange("ready");
    } catch {
      callbacks.onStatusChange("error");
    }
    return;
  }

  existing?.abortController.abort();
  const abortController = new AbortController();
  const tools = createWebMcpTools(game, callbacks.onActionResult, guideStore);
  const registration = Promise.all(
    tools.map((tool) => context.registerTool(tool, { signal: abortController.signal })),
  ).then(() => undefined);

  registrationWindow[REGISTRATION_KEY] = { context, abortController, registration };

  try {
    await registration;
    callbacks.onStatusChange("ready");
  } catch (error) {
    abortController.abort();
    delete registrationWindow[REGISTRATION_KEY];
    callbacks.onStatusChange("error");
    console.error("WebMCP tool registration failed.", error);
  }
}
