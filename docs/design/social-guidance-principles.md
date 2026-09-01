# AI Watermelon Smash — Interaction Design Principles

## Core rule

> **Physical clarity, social ambiguity.**
>
> The player's body, facing direction, movement, and swing direction must be immediately readable. Difficulty should come from interpreting people, not from fighting the controls or camera.

## What should be clear

- Which side of the blindfolded character is the front.
- Which direction the character is currently facing.
- A swing always travels into the character's forward play space.
- Turn, walk, collision, miss, and hit feedback should match what the human sees.
- If the human gives accurate guidance, the AI should be able to execute it reliably.

Confusion caused by reversed visuals, ambiguous character facing, camera conventions, or a backward swing is a usability bug, not game difficulty.

## What should be uncertain

The long-term game should become difficult because the AI must decide **which humans to trust**.

Possible guide conditions:

- several humans call out from different viewpoints;
- their spatial descriptions differ in precision and vocabulary;
- some are mistaken;
- some may deliberately lie;
- the AI remembers who was reliable before;
- guides can disagree at exactly the moment a decision matters.

The AI's challenge is therefore not only locating a watermelon. It is interpreting a small social environment while blindfolded.

## AI as a player, not a remote-controlled pawn

The AI should retain meaningful decisions:

- who to trust;
- whether to ask for clarification;
- how much to turn or walk from an imprecise instruction;
- whether conflicting guidance is strong enough to act on;
- whether to swing now or request confirmation;
- how to update trust after a collision, miss, or success.

Humans provide vision. WebMCP provides the AI's body. Conversation provides uncertainty.

## Challenge-build scope

The WebMCP Challenge build may remain a one-human / one-AI proof of the body-and-guidance loop. It must nevertheless preserve the architecture needed for richer social guidance later.

For the current build:

1. Fix character front/back readability.
2. Make the stick visibly swing forward.
3. Keep the WebMCP tools simple and blindfold-safe.
4. Do not manufacture difficulty by making movement or orientation ambiguous.
5. Use Day 3 playtests to study natural-language ambiguity and recovery.

## Future social version

A later multiplayer version can place multiple human guides around the same blindfolded AI player. Not every round needs a designated traitor. Unreliability can emerge from limited viewpoints, mistakes, incentives, or optional deception.

The desired feeling is:

> "I cannot see anything. Three people are shouting different directions. Who do I believe?"

That is the watermelon-smashing game, not a hidden UI puzzle.
