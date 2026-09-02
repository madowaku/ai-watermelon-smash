# Demo Video Script — target 2:10–2:30

Goal: show the product, the WebMCP mechanism, one social mistake/recovery, and the shared success. Keep the whole video under 3:00.

## 0:00–0:12 — Hook

Visual: polished beach, blindfolded character, watermelon visible to the viewer.

Voiceover:

> Most AI interfaces are conversations. I wanted to know what happens when the AI has a body and you have to play together.

On-screen text, optional:

> Human has the eyes. AI has the body.

## 0:12–0:28 — Explain the asymmetry

Visual: show the human-visible world, then the WebMCP status / Site tools.

Voiceover:

> This is AI Watermelon Smash. I can see the beach, obstacles, and watermelon. The AI is blindfolded, but WebMCP lets it turn, walk, swing, inspect its body state, and listen to human guides.

Briefly show the five tools:

- turn
- walk
- swing
- get_self_status
- listen_to_guides

Do not spend time opening every schema.

## 0:28–0:45 — WebMCP is the body

Visual: real Site-tool call `turn`, then `walk`; character visibly rotates and moves.

Voiceover:

> These are not solution APIs. WebMCP is the AI player's body in the browser. The tools never return the watermelon position, route, or which guide is correct.

## 0:45–1:18 — Social ambiguity

Before recording, put three short conflicting messages into Guide Chorus. Keep them legible and quick.

Suggested setup:

A: `Straight ahead!`
B: `A is right. Keep going!`
C: `Stop — something is in front of you.`

Prompt ChatGPT to read Guide Chorus and act.

Ideal footage:

1. `listen_to_guides()` is invoked.
2. AI chooses A/B or otherwise makes a concrete judgment.
3. `walk()` leads to a collision.
4. The assistant comments that C's warning may have been useful / updates its judgment.

Voiceover:

> The interesting part is that guide messages are unverified testimony. The AI has to decide who to trust. If bad advice causes a collision, that physical consequence becomes evidence for the next decision.

If a clean collision/recovery take is difficult, use a prerecorded successful take rather than repeatedly forcing live behavior.

## 1:18–1:38 — Humans and AI share information

Visual: AI checks `get_self_status()` or states its current heading; show humans providing clearer guide messages relative to that heading.

Voiceover:

> Humans have visual information. The AI knows its own body state. Neither side has everything, so they have to build a shared frame of reference.

Optional on-screen phrase:

> Physical clarity. Social ambiguity.

## 1:38–1:58 — Final approach and smash

Guide Chorus suggestion:

C: `Back up 0.5m and swing!`

Visual: `walk` adjustment, then real `swing()` Site-tool invocation.

Do not cut away at impact. Let the ~780 ms smash reveal breathe before the result card appears.

Voiceover:

> And when the group finally agrees on something useful…

Impact.

> …we get to share the result.

Show `WE GOT IT!`.

## 1:58–2:18 — Why it matters

Visual: hero shot / short montage: Guide Chorus, character walking, broken watermelon.

Voiceover:

> I am not using AI to generate a game. I am designing a game for a human and an AI to play together. WebMCP turns browser tools into movement, perception, consequences, and eventually trust.

## 2:18–2:28 — Close

Visual: project title + live app / GitHub name, not tiny raw URLs if hard to read.

Voiceover:

> This is AI Watermelon Smash. One human, one embodied AI, several questionable friends, and one very unlucky watermelon.

## Recording rules

- Final runtime: preferably 2:10–2:30, never 3:00 or longer.
- Audio must clearly explain both what was built and how WebMCP is used.
- Use the real ChatGPT in-app browser for the key Site-tool moments.
- Use the production URL for final recording after the submission PR is merged.
- Keep browser chrome / unrelated tabs / private account data out of frame.
- Do not use copyrighted music. Voice + game audio/silence is enough.
- Avoid showing model-specific claims as permanent compatibility statements.
- The watermelon smash should be clearly visible before the success overlay.
- Favor one understandable mistake and recovery over a long optimal route.
