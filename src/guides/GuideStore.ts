export type GuideId = "A" | "B" | "C";

export interface GuideMessage {
  sequence: number;
  guide: GuideId;
  text: string;
}

const GUIDE_IDS: readonly GuideId[] = ["A", "B", "C"];
const HISTORY_LIMIT = 24;
const MESSAGE_LIMIT = 160;

export class GuideStore {
  private messages: GuideMessage[] = [];
  private nextSequence = 1;

  addMessage(guide: GuideId, text: string): GuideMessage | null {
    if (typeof guide !== "string" || !GUIDE_IDS.includes(guide)) {
      return null;
    }

    if (typeof text !== "string") {
      return null;
    }
    const normalizedText = text.trim();
    if (normalizedText.length === 0 || normalizedText.length > MESSAGE_LIMIT) {
      return null;
    }

    const message: GuideMessage = {
      sequence: this.nextSequence,
      guide,
      text: normalizedText,
    };
    this.nextSequence += 1;
    this.messages.push(message);
    if (this.messages.length > HISTORY_LIMIT) {
      this.messages.splice(0, this.messages.length - HISTORY_LIMIT);
    }
    return { ...message };
  }

  getRecent(limit = HISTORY_LIMIT): readonly GuideMessage[] {
    if (!Number.isFinite(limit) || limit <= 0) {
      return [];
    }
    const count = Math.floor(limit);
    if (count <= 0) {
      return [];
    }
    return this.messages.slice(-count).map((message) => ({ ...message }));
  }

  getLatestSequence(): number {
    return this.messages.at(-1)?.sequence ?? 0;
  }

  getLatestForGuide(guide: GuideId): GuideMessage | null {
    const message = [...this.messages].reverse().find((candidate) => candidate.guide === guide);
    return message ? { ...message } : null;
  }

  clear(): void {
    this.messages = [];
    this.nextSequence = 1;
  }
}
