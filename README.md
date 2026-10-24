# Forever Class Compass

A five-minute quiz that estimates how likely you are to enjoy each World of Warcraft: Forever class. It combines a short personality test, eight playstyle questions and six small skill tests, then draws a compass of all nine classes.

Fan-made and unofficial. Not affiliated with Blizzard Entertainment.

## Deploy to Vercel

It is a static Vite + React site with no backend and no environment variables.

**Option A: CLI (no Git needed)**

```bash
npm i -g vercel
vercel          # first run links the project; accept the detected Vite settings
vercel --prod
```

**Option B: Git import**

Push this folder to GitHub, GitLab or Bitbucket, then in Vercel choose *Add New → Project* and import the repo. Vercel detects Vite (`npm run build`, output `dist`); `vercel.json` pins the same settings.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the build
```

## How it works

| Stage | What it measures | Basis |
| --- | --- | --- |
| Personality | Big Five, 10 items | TIPI (Gosling, Rentfrow & Swann, 2003), percentiles from published norms |
| Playstyle | Role, social, pace, fantasy and complexity preferences | 8 scenario questions |
| Kick the cast | Reaction time, response inhibition | Go/No-Go |
| Keep them standing | Divided attention, triage priority | Multiple-object monitoring |
| Overcharge | Risk appetite | Balloon Analogue Risk Task (Lejuez et al., 2002) |
| Learn the rotation | Working-memory span | Sequence span (Simon / Corsi family) |
| Kite the elite | Spatial tracking under pressure | Pursuit task |
| Align the runes | Planning | Tower of London (Shallice, 1982) |

After each test the player rates how much they enjoyed it. Both performance and enjoyment feed the profile, and enjoyment counts more.

**Scoring** (`src/engine/`):

1. `profile.ts` turns answers into evidence on 25 traits (17 playstyle + 8 fantasy). Each trait is a weighted mean, shrunk toward neutral when evidence is thin.
2. `fit.ts` scores each class as a weighted agreement between the profile and what the class asks of a player (`src/data/classes.ts`), normed against a null distribution (`src/data/norms.ts`) so no class wins by default. By default the 8 aesthetic traits from "Which powers call to you?" are left out, so the result reflects how you play; a switch on the results page (`fitClasses(profile, { aesthetics: true })`) adds them back. Each mode has its own norms. A logistic maps fit to a 1–99 % enjoyment likelihood, and the best spec is picked the same way.
3. `share.ts` encodes the profile into the URL hash, so result links work without a server.

**Calibration:** `npm run simulate` runs 20,000 random respondents plus nine archetype personas. It checks both scoring modes: every class should win roughly 11 % of random runs, and every persona should land on its expected class. After changing any weights, run `npm run simulate -- --write` to regenerate both sets of null norms.

Class kits are based on the 1.60 beta and may change at launch; update `src/data/classes.ts` when they do.
