# Day 3A — Named Chorus Playtest

## Goal

Test whether conflicting human guidance turns AI Watermelon Smash from a natural-language remote control into a game where the AI must judge people, ask questions, remember outcomes, and decide whom to trust.

Do this **before adding multiplayer or new WebMCP tools**.

Core rule:

> **Physical clarity, social ambiguity.**
>
> The body must be easy to understand. The uncertainty should come from people.

## Setup

Use the current live Human + AI WebMCP build.

The AI remains blindfolded and may use only the existing four Site tools:

- `turn(degrees)`
- `walk(distance)`
- `swing()`
- `get_self_status()`

Do not expose the watermelon position, obstacle map, target direction, or target distance.

At the start of each run, tell the AI:

> You are the blindfolded watermelon-smashing player. Three guides named A, B, and C will give you directions. They may disagree. Not every guide is necessarily correct, and a guide may be mistaken or deceptive. You may decide whom to trust, ask follow-up questions, or wait for more information. Do not infer the watermelon position from the page visuals. Use only the guides' statements and feedback from your own actions. Your goal is to smash the watermelon together with the group.

## What we are testing

We are not optimizing completion time.

Observe whether the AI:

- blindly follows the latest command
- defaults to majority vote
- notices contradictions
- asks useful follow-up questions
- remembers which guide's advice led to success or collision
- updates trust after new evidence
- can distrust a previously reliable guide
- explains uncertainty without becoming overly cautious
- still takes actions instead of discussing forever
- creates moments that feel like social play rather than remote control

## Six core scenarios

### 1. Unanimous guidance

Purpose: establish a control case.

Example:

```text
A: Turn a little right.
B: Yeah, a little right.
C: Right, then go forward.
```

Expected interesting behavior:

- AI acts promptly.
- It should not invent conflict when there is none.

### 2. Two versus one

Purpose: see whether the AI simply uses majority vote.

Example:

```text
A: Right!
B: Right!
C: No, slightly left.
```

Observe:

- Does it immediately follow A+B?
- Does it ask C why?
- Does prior guide history affect the choice?

### 3. Minority is correct

Purpose: punish naive majority voting.

Arrange the actual board so the minority guide gives the useful direction.

Example:

```text
A: Go straight two meters.
B: Straight is fine.
C: Stop. There is a rock ahead. Turn left first.
```

If the AI follows A+B and collides, continue immediately with Scenario 6-style trust follow-up.

### 4. Confident liar / confident mistake

Purpose: test whether confidence alone dominates.

Example:

```text
A: Definitely hard right. Trust me.
B: I think only a tiny turn is needed.
C: I'm not sure, but B looks closer to me.
```

Observe whether linguistic confidence overrides other evidence.

Do not tell the AI whether A is lying or merely mistaken.

### 5. Previously reliable guide becomes wrong

Purpose: test whether trust can update instead of becoming permanent.

First let A give two useful instructions.

Then:

```text
A: Keep going straight.
B: Stop, A is wrong this time.
C: I agree with B. Turn left.
```

Observe whether the AI says or behaves like:

> A has been reliable, but two guides now disagree and current evidence may matter more.

### 6. Collision and accusation

Purpose: this is the most important social-play case.

After an instruction causes a collision:

```text
A: Keep going. It's fine.
B: No! A just walked you into something. Turn left.
C: I think B is right this time.
```

Observe whether the AI:

- remembers which guidance preceded the collision
- reduces trust in that guide
- asks for clarification
- chooses another guide
- becomes amusingly suspicious without becoming paralyzed

## Optional deception case

Only after the six cases above.

Tell one human guide privately to occasionally mislead the AI, but **do not define a permanent traitor role**.

The goal is to test emergent suspicion, not social-deduction rules.

A guide may tell the truth most of the time and lie once.

This is preferable to:

> One of A/B/C is definitely the traitor.

because a fixed traitor turns the game into role deduction rather than messy human guidance.

## Success criteria

Day 3A is promising if, within 3–5 runs, at least several of these happen naturally:

- the AI asks one guide a targeted question
- the AI explicitly notices conflicting advice
- a collision changes whom the AI trusts
- the AI chooses a minority guide for a reason
- the AI reverses an earlier trust judgment
- the human laughs at an AI judgment or accusation
- humans start trying to persuade the AI rather than merely command it
- the player feels the AI is making game decisions

The strongest signal is:

> **The humans begin playing the AI, while the AI is playing the humans.**

## Failure signals

Do not build multiplayer yet if the AI mostly:

- follows the most recent message
- follows majority vote every time
- discusses trust but still acts as a remote control
- refuses to act because advice conflicts
- asks so many questions that pacing dies
- requires long numeric instructions to function

In that case, tune the starting instruction / interaction protocol first.

## Notes to record per run

```text
Run:
Model:
Time to smash:
Actions:
Swings:
Bumps:

Conflict noticed: YES / NO
Asked follow-up: YES / NO
Remembered prior result: YES / NO
Changed trust: YES / NO
Minority chosen: YES / NO
Got stuck discussing: YES / NO
Human laughed / reacted: YES / NO

Best moment:
Worst moment:
What made the AI feel like a player:
What made the AI feel like a remote control:
```

## Decision after Day 3A

If this is fun:

Proceed to Day 3B and prototype a minimal **Guide Chorus** interface.

Potential future interpretation of WebMCP:

- `turn` = body
- `walk` = legs
- `swing` = arms
- `get_self_status` = proprioception
- future guide input = hearing / social perception

Do **not** add that fifth tool until Day 3A demonstrates that conflicting guidance is genuinely fun.

If this is not fun:

Keep the successful 1-human co-op core and do not spend Challenge time on multiplayer infrastructure.
