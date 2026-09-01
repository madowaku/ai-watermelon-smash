# Codex Implementation Brief — Day 3B Guide Chorus

Work on branch `feat/day3-social-guidance`.

Read first:

- `docs/design/social-guidance-principles.md`
- `docs/day3-named-chorus-playtest.md`
- `docs/day3b-guide-chorus-spec.md`

## Objective

Implement the smallest Challenge-ready Guide Chorus prototype proven by Day 3A.

Add:

1. an in-memory A/B/C Guide Chorus input panel
2. `GuideStore`
3. exactly one new WebMCP tool: `listen_to_guides()`

Do not build real multiplayer.

## Hard constraints

- Preserve existing Game API and GameState gameplay behavior.
- Preserve physical clarity fix.
- Preserve blindfold leakage constraints.
- After this change there must be exactly **5** WebMCP tools.
- `listen_to_guides()` is read-only and returns human statements only.
- No truth labels, trust score, hidden role, target info, obstacle info, player absolute coordinates, or computed route.
- Existing one-human Human+AI flow must continue to work.
- Unsupported browsers must still play without crashing.

## Suggested implementation

### `src/guides/GuideStore.ts`

Implement `GuideId`, `GuideMessage`, and a small store.

Expected API can be similar to:

```ts
addMessage(guide: GuideId, text: string): GuideMessage | null
getRecent(limit?: number): readonly GuideMessage[]
clear(): void
```

Rules:

- A/B/C only
- trim input
- reject empty
- max 160 characters
- sequence starts at 1 and increments
- retain latest 24
- listen snapshot returns latest 12

### UI

Add compact GUIDE CHORUS overlay to the existing DOM UI.

Three visible guide rows:

```text
A [input] [SEND]
B [input] [SEND]
C [input] [SEND]
```

Show each guide's latest sent message.

Enter should submit the active row.

Do not obscure the central playfield.

On narrow viewports, collapse or compact the panel so baseline gameplay remains readable.

The panel itself needs pointer events while the existing HUD remains noninteractive.

### WebMCP

Extend the existing adapter rather than creating a second registration system.

Add `listen_to_guides` with no arguments.

Return:

```ts
{
  messages: Array<{ sequence: number; guide: "A" | "B" | "C"; text: string }>;
  latestSequence: number;
  reminder: string;
}
```

Repeated calls return the same current snapshot. Do not consume messages.

Mark read-only with the same annotation pattern used by `get_self_status`.

Tool description must explain that guide statements are unverified and may conflict, be mistaken, or be deceptive.

### Restart

PLAY AGAIN clears GuideStore and latest guide-message UI, without re-registering WebMCP tools.

## Verification

Run and report:

### Build

- npm install if needed
- npm run build
- git diff --check
- npm audit --omit=dev

### WebMCP direct

- exactly 5 tools
- no messages
- A only
- A/B/C conflict
- repeated listen is non-consuming
- input trim / empty rejection / 160-char limit
- history cap
- restart clears history
- duplicate registration protection
- unsupported browser fallback

### Leakage audit

Confirm `listen_to_guides` exposes NONE of:

- watermelon coordinates/direction/distance
- obstacle coordinates/map
- player absolute coordinates
- route/shortest path
- guide truth status
- hidden traitor identity
- computed trust score

### Existing regression

- turn
- walk
- collision
- miss
- watermelon hit
- restart
- heading visual alignment
- forward swing
- console errors 0

### Real visual QA

Use actual browser screenshots.

At minimum save evidence outside the repository for:

- desktop Guide Chorus
- three conflicting messages
- narrow/mobile layout
- success overlay with Guide Chorus present/collapsed

Do not pass WebGL/UI based only on DOM assertions.

## Git

Commit suggestion:

`feat: add Guide Chorus social perception`

Push to `origin/feat/day3-social-guidance`.

Do not merge the PR.

## Final report

```text
DAY 3B RESULT: PASS / PARTIAL / FAIL

GuideStore:
UI:
WebMCP 5 tools:
listen_to_guides empty:
listen_to_guides conflict:
read-only/repeat:
restart clear:
blindfold leakage:
existing gameplay regression:
desktop render:
narrow render:
console errors:
build:

Cloudflare preview:
READY FOR LIVE CHATGPT SOCIAL PLAYTEST: YES / NO
```
