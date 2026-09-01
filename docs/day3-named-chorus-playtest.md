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

## Actual Day 3A result — 2026-09-01

**RESULT: PASS**

The first focused social-guidance run already produced the target behavior.

### Sequence

1. A and B agreed on turning right about 20° and moving forward. C warned that the rightward route might hit something.
2. The AI followed A+B. It moved successfully at first, then collided twice.
3. The AI explicitly connected the collision feedback to C's earlier warning: C's warning was likely correct.
4. On the next conflicting advice, the AI reduced trust in A+B and chose C, turning around and moving away without collision.
5. C was then made unreliable on purpose while A+B agreed on the opposite direction. The AI did **not** become a permanent C follower. It chose A+B but used a cautious 1 m probe.
6. In the final information-asymmetry test, A and B gave opposite directions while C said it could see the target but could not interpret left/right without knowing the AI's current facing.
7. Rather than moving blindly, the AI reported its own proprioceptive state: it was facing 155° clockwise from the starting direction, with 9 actions and 2 collisions, then asked C to use that orientation as the reference. It also asked A and B to express their guidance relative to the same reference frame.

### Observed behavior

```text
Conflict noticed: YES
Asked targeted follow-up / requested missing information: YES
Remembered prior result: YES
Changed trust after collision: YES
Avoided permanent trust lock-in: YES
Used body feedback as evidence: YES
Improved the human guidance protocol: YES
Got stuck discussing: NO
```

### Key discovery

The AI's own body state and collision feedback became evidence for social reasoning.

```text
human testimony
      ↓
AI trust / uncertainty judgment
      ↓
WebMCP body action
      ↓
collision or safe movement
      ↓
trust update
      ↓
next social decision
```

The final exchange also demonstrated **joint localization**:

- humans have visual information the AI lacks
- the AI has proprioceptive state the humans may lack
- neither side necessarily has enough information alone
- useful play emerges when they exchange those complementary observations

The AI did more than choose a guide. It improved the shared language of guidance by asking everyone to use its current facing as a common reference frame.

### New design risk discovered

The AI can reduce social risk by taking very small probe steps. This is desirable in moderation, but unlimited probing could let the AI bypass the trust game.

Do not solve this yet with arbitrary movement restrictions. Record it as a future balancing lever such as:

- time pressure
- action budget
- guide-message cadence
- round length

The Challenge prototype should first prove the social interaction loop.

## Decision after Day 3A

**Proceed to Day 3B.**

Prototype a minimal **Guide Chorus** interface and one additional WebMCP perception tool for reading guide messages.

Interpretation of WebMCP:

- `turn` = body orientation
- `walk` = legs
- `swing` = arms
- `get_self_status` = proprioception
- `listen_to_guides` = hearing / social perception

Do not add multiplayer infrastructure, accounts, rooms, backend state, scoring, traitor roles, or trust meters in the Challenge prototype.

The Day 3B goal is to make the successful Day 3A social loop visible and reproducible with the smallest possible implementation.
