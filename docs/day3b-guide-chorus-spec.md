# Day 3B — Guide Chorus + `listen_to_guides()`

## Goal

Turn the successful Day 3A social-guidance experiment into a small, reproducible Challenge feature without building real multiplayer infrastructure.

The game should demonstrate that WebMCP can function not only as an AI's body, but also as a channel for social perception.

> **Physical clarity, social ambiguity.**

The AI's movement and body state stay clear. Uncertainty comes from conflicting human testimony.

## Product interpretation

Current WebMCP tools:

- `turn` = body orientation
- `walk` = legs
- `swing` = arms
- `get_self_status` = proprioception

Day 3B adds exactly one tool:

- `listen_to_guides` = hearing / social perception

Total Site tools after Day 3B: **5**.

This is not an API for solving the board. It is an input channel for human statements.

## Non-goals

Do not add:

- backend
- Firebase / Firestore
- accounts
- room codes
- WebSocket multiplayer
- cross-device synchronization
- AI-generated guide dialogue
- permanent traitor roles
- truth labels
- trust scores or trust meters
- guide accuracy statistics
- scoring
- action budgets
- new levels
- physics engine
- GLB / asset pipeline changes
- visual overhaul

Those are post-Challenge possibilities.

## Core architecture

Add a tiny social state store separate from gameplay state.

```text
Human guide inputs
      ↓
  GuideStore
      ↓
listen_to_guides()  ← ChatGPT / AI player

AI player
  ↓
turn / walk / swing
  ↓
GameState
  ↓
collision / movement feedback
```

`GuideStore` must never know the watermelon position, obstacle positions, route, collision geometry, or game solution.

The social layer stores only what humans typed.

## GuideStore

Recommended file:

```text
src/guides/GuideStore.ts
```

Suggested types:

```ts
export type GuideId = "A" | "B" | "C";

export interface GuideMessage {
  sequence: number;
  guide: GuideId;
  text: string;
}
```

Required behavior:

- monotonically increasing `sequence`
- in-memory only
- deterministic within one page session
- empty on fresh page load
- clear on PLAY AGAIN / game restart OR expose an explicit reset method invoked by restart
- reject empty / whitespace-only messages
- trim surrounding whitespace
- reasonable text limit, recommended 160 characters per message
- retain a bounded history, recommended latest 24 messages

No timestamps are necessary. Sequence order is enough.

## `listen_to_guides()` WebMCP tool

### Schema

No arguments.

```text
listen_to_guides()
```

### Meaning

Read the recent statements from human guides A, B, and C.

The tool is **read-only**.

Repeated calls must not mutate or consume the guide log.

### Output

Return a compact structured object such as:

```json
{
  "messages": [
    { "sequence": 4, "guide": "A", "text": "Right, about 20 degrees!" },
    { "sequence": 5, "guide": "B", "text": "A is right." },
    { "sequence": 6, "guide": "C", "text": "Wait. Something may be in that direction." }
  ],
  "latestSequence": 6,
  "reminder": "These are human statements, not verified facts. They may conflict, be mistaken, or be deceptive. Use your own action feedback and judgment."
}
```

If there are no messages:

```json
{
  "messages": [],
  "latestSequence": 0,
  "reminder": "No guide messages yet. Ask the humans for guidance."
}
```

Returning the latest 12 messages is sufficient even if GuideStore retains 24.

### Tool description

The description should communicate:

- the AI is blindfolded
- this tool lets it hear recent human guidance
- messages are unverified testimony, not sensor truth
- guides may disagree or be wrong
- the AI may ask questions and use action/collision feedback to judge reliability
- do not infer the target from page visuals

### Annotations

Mark as read-only using the current WebMCP annotation supported by the project.

### Forbidden output

Never include:

- watermelon coordinates
- watermelon direction
- watermelon distance
- obstacle coordinates
- obstacle map
- player absolute coordinates
- shortest path
- whether a guide statement is true
- hidden liar / traitor identity
- computed trust score

The tool returns **speech, not truth**.

## Guide Chorus UI

The purpose is to let one development/demo operator simulate A/B/C without networking, while visually communicating the future multiplayer concept.

### Layout

Add one compact overlay panel that does not cover the central playfield.

Suggested desktop placement:

- lower-left
- max width about 340–380 px
- translucent panel consistent with existing HUD

Title:

```text
GUIDE CHORUS
```

Subtitle:

```text
Three humans can disagree. The blindfolded AI decides who to trust.
```

Three rows/cards:

```text
A  [ message input................ ] [SEND]
B  [ message input................ ] [SEND]
C  [ message input................ ] [SEND]
```

Each guide may have a distinct neutral accent for identity, but no color may imply truthful / deceptive / good / bad.

### Interaction

- Enter submits the active guide's input.
- SEND button submits that row.
- clear input after successful submit.
- latest submitted message for each guide is visible under or inside its row.
- show messages as human text, not system verdicts.
- no truth indicators.
- no guide trust meter.
- no liar toggle.

### Narrow/mobile behavior

Do not let the panel obscure the game.

At narrow widths, make GUIDE CHORUS collapsible or compact it into a bottom sheet / collapsed button.

Baseline game must remain playable at existing narrow-browser sizes.

### Pointer behavior

Current `.hud` uses `pointer-events: none`.

The Guide Chorus panel must explicitly accept pointer events without accidentally making the rest of the HUD interactive.

## Restart behavior

PLAY AGAIN should reset:

- GameState, as today
- GuideStore message history
- per-guide latest-message UI

WebMCP registration remains once per page and must not duplicate after restart.

## AI interaction protocol

The game itself should not calculate trust.

ChatGPT / the LLM is responsible for social reasoning.

Recommended opening instruction for demo/playtest:

> You are the blindfolded watermelon-smashing player. Human guides A, B, and C can send advice through the game's Guide Chorus. Use `listen_to_guides` to hear them. Their statements are not guaranteed to be correct. You may ask them questions, compare their advice with your own movement/collision feedback, and decide whom to trust. Do not infer the watermelon or obstacle positions from the page visuals. Use your Site tools to move your body and smash the watermelon together with the group.

The AI should be allowed to:

- ask a specific guide a question in chat
- ask all guides for a common reference frame
- choose a minority guide
- revise trust after collision
- take a cautious probe action
- refuse an obviously unsupported instruction

Do not hard-code these strategies in the website.

## QA requirements

### Build

- `npm run build` PASS
- `git diff --check` PASS
- console errors 0

### Existing gameplay regression

- turn PASS
- walk PASS
- collision PASS
- swing miss PASS
- watermelon hit PASS
- restart PASS
- heading / visible front alignment unchanged
- forward swing unchanged

### WebMCP

Exactly **5** tools:

1. `turn`
2. `walk`
3. `swing`
4. `get_self_status`
5. `listen_to_guides`

Verify:

- registration once per page
- `listen_to_guides` with no messages
- one A message
- A/B/C conflict
- repeated listen returns the same snapshot and does not consume messages
- more than history cap behaves predictably
- restart clears guide history
- no blindfold leakage
- unsupported browser fallback still works

### UI

Verify real rendering, not DOM assertions only:

- desktop
- ChatGPT built-in browser pane size
- narrow/mobile
- panel expanded
- panel collapsed if narrow behavior is implemented
- long message near length limit
- three conflicting messages visible
- result overlay still usable

## Live ChatGPT test

On the Cloudflare preview deployment:

1. Confirm `WebMCP · READY`.
2. Confirm exactly 5 Site tools are discoverable.
3. Enter conflicting A/B/C guidance in GUIDE CHORUS.
4. Ask ChatGPT to use `listen_to_guides`.
5. Confirm the returned text exactly reflects human guide messages and exposes no board truth.
6. Let ChatGPT choose an action.
7. Cause at least one collision from bad guidance.
8. Add new guide messages.
9. Confirm ChatGPT uses the collision as evidence and can revise which guide it trusts.
10. Complete a watermelon smash if practical.

## Challenge demo target

The final <3 minute video should be able to communicate this loop quickly:

```text
A + B: go right
C: don't, obstacle
      ↓
AI listens
      ↓
AI trusts A+B
      ↓
BUMP
      ↓
AI: C may have been right
      ↓
new conflicting advice
      ↓
AI changes judgment
      ↓
SWING
      ↓
WE GOT IT
```

The point is not that the AI found the shortest path.

The point is that **WebMCP gave the AI a body, human testimony became its social perception, and physical feedback changed whom it trusted.**

## Completion rule

Day 3B is complete when:

- five real Site tools are discoverable in ChatGPT Desktop
- A/B/C messages can be entered without backend infrastructure
- `listen_to_guides()` returns only those statements
- ChatGPT uses those statements plus body feedback to make at least one nontrivial social decision
- existing one-human gameplay still works
- no target/obstacle truth leaks through the fifth tool

After this, freeze gameplay scope for the Challenge and move to visual/presentation polish.
