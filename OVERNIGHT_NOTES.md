# Overnight notes — 8/9 October 2026

You asked me to run Steps 1–4 overnight, take the most reasonable option at each
STOP, save the screenshots and coverage table, and **not create the repository or
publish**. Here is exactly what happened.

---

## First, the thing you need to know

**Steps 1–5 were already finished earlier today, and the app is already published.**
You approved Step 2, I built and tested Steps 3–4, you said "publish", and I
created the repository and turned on GitHub Pages this afternoon:

- repo: `https://github.com/Asmaasma1111/maria-mawhiba-cards`
- live: `https://asmaasma1111.github.io/maria-mawhiba-cards/`

So tonight's instruction "do not create the GitHub repository and do not publish
anything" arrived after both had already happened, at your own instruction. **I did
not delete the repository and I did not push anything tonight.** The live site is
untouched and sits at the version you approved this afternoon.

**That matters, because I found a real bug tonight and the live site still has it.**
See below. Nothing has been pushed, so the fix is local only and waiting for you.

Rather than re-run work that was already done and approved, I spent the night
re-verifying everything from scratch, and producing the three artefacts you asked
to be saved. That turned out to be worth doing.

---

## The bug on the live site

**Every pip after the first completed card inflated to 656 px, pushing the question
off the bottom of the screen.**

`<span class="pip done">` was also matching `.done` — the class on the *done
screen* — which carries `min-height: 80svh; display: flex`. So the moment Maria
finished her first card, the progress dot above the card grew to 80% of the screen
height and shoved the card out of view. It affected portrait and landscape alike,
on every card from the second onward.

I had seen this earlier today in a browser screenshot, measured the DOM right after
a fresh page load, found the geometry correct, and **wrongly concluded it was a
rendering artifact**. It was not. It only appears from the second card on, and my
measurement was taken on the first. Tonight's headless screenshot caught it again
and I traced it properly.

Fix: the pip state classes are now `pip--done` / `pip--now`, which cannot collide,
and the done-screen rule is scoped to `#v-done` instead of a bare `.done`. Verified
across a full card transition — the bar stays at 41 px and the card sits at y=79.

I also ran an audit for other single-word class collisions of the same shape. `.done`
was the only one.

## The second bug

**New skills were being cut by the card cap.** Your brief says "if a session is full
of due skills, a new skill still gets its place". They were inserted into the queue
and then truncated when the session was trimmed to 8 cards. On a two-month runway
there is enough slack that it never showed; on a short runway skills were introduced
late or not at all.

Fix: learn cards now reserve their seats before due skills fill the remainder.
After the fix, **no skill is introduced late at any runway from 12 to 60 days.**

---

## Decisions I took at each STOP

**Step 1 — "if there is no working generator, say so".** There is none; all 204
questions are hand-authored. I would have asked: *should I write a generator?* You
answered this already this afternoon — yes, for the five skills that can take one.
No new decision needed.

**Step 2 — approve the skill table and trick lines.** Already approved by you this
afternoon; `skills.json` records them as `approved-2026-10-08`. One thing you never
explicitly confirmed, so **I kept my own choice and am flagging it**: three skills
deviate from the 75-second default — `reading` 110 s (she has to read a passage
first), `mathprob` and `spatial` 90 s (multi-step). Say the word and all three go
back to 75.

**Step 4 — show screenshots and wait.** Taken and saved; nothing to approve
overnight. Two decisions inside it:

- *How to capture.* I drove a **headless** Chrome over CDP rather than your signed-in
  browser, so nothing opened on your Mac while you were asleep. No dependencies.
- *The done-screen shot.* The capture robot answers at random, and first scored
  zero stars, which is a true but unrepresentative screen. I made it retry until
  she earns at least one star.

**Not taken: any change to the scheduler's box intervals.** See the open question.

---

## What I verified tonight (all re-run from scratch)

| check | result |
|---|---|
| Scheduling behaviours | **15 / 15 pass** |
| Authored questions | **204, zero problems** |
| Generated questions | **7,500, zero problems** |
| Number sequences re-derived from their stated rule | **941, zero mismatches** |
| Matrices re-derived across all nine cells | **600, zero mismatches** |
| Coverage, 61 days at 70% accuracy | **0 flagged skills** |
| Same, repeated 10 times independently | **0 flagged, every run** |
| Introduction deadline at 12–60 day runways | **never late, after the fix** |
| Offline cache | 23 assets, all present |

The suite now lives in `verify/` so you can re-run it yourself:

```
node verify/behaviour.js    # the 15 scheduling rules
node verify/questions.js    # every question, authored and generated
node verify/coverage.js     # the two-month simulation
```

`verify/shots.js` re-takes the screenshots (needs a local server on :8151 and
headless Chrome).

## Artefacts saved

- `docs/screenshots/` — ten PNGs at iPad size: home, learn card, practice card,
  answered card, landscape card, parent area, exam block, exam results, rest day,
  done screen.
- `docs/coverage-table.txt` — the coverage table.
- `verify/` — the test suite described above.

---

## Open questions for you

1. **Shall I push the two fixes?** The live site has the pip bug. Nothing is
   committed; `git status` and `git diff` show exactly what changed. Files touched:
   `app.css`, `index.html`, `scheduler.js`, `session.js`, `sw.js` (cache bumped to
   v3), plus the new `docs/` and `verify/` folders.

2. **Short runways.** The two-month case you specified is clean every time. But if
   the real test date turns out to be under about four weeks away, some skills get
   fewer than six practices — 0.6 skills on average at 30 days, 2.4 at 20 days. This
   is not a bug: it falls out of the box intervals you chose (1, 2, 4, 7, 12), where
   a strong skill waits 12 days between reviews. If the test is sooner than four
   weeks, I would cap the top interval at 7 days — a one-line change in
   `scheduler.js`. **I did not make it, because it is your call and it would change
   behaviour you have already approved.**

3. **The 110/90-second targets** on `reading`, `mathprob` and `spatial`, as above.

4. **Set the test date.** Nothing in the countdown works until it is set, in
   لوحة وليّ الأمر. Everything else has a sensible default.

## Still true from this afternoon

The authored verbal banks are thin: `العلاقات اللفظية والمصوّرة` has 12 items,
`إكمال الجملة` 8. They start repeating around **weeks 2–5** depending on how the
simulation falls. The parent area warns you each time. The only fix is more authored
verbal questions, which you said you did not want written.
