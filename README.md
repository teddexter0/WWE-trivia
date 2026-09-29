# WWE Era Trivia (2009–2018)

> **Live demo:** [wwe-trivia.vercel.app](https://wwe-trivia.vercel.app)

A lean, mobile-first WWE trivia game built with Next.js 14, TypeScript and Tailwind CSS. Each round automatically mixes 80% five-option multiple choice with 20% forgiving free-text prompts. Local grading handles punctuation, missing filler words, partial names and minor typos before optionally falling back to Hugging Face.

Five-option questions follow a deliberate arcade pattern: the authored distractors provide close alternatives, while the final option is drawn from the nearest available level/domain pool. This avoids runtime AI calls and keeps every round fast and free.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Data status

The current repository includes a 30-question demo bank sourced only from the supplied assessment blueprint. The blueprint describes a 500-item matrix but does not contain the 500 hand-written Q&A records. Replace `lib/questions.ts` with the full verified bank before production seeding.

The seed script deliberately refuses to seed fewer than 500 questions unless `ALLOW_DEMO_SEED=true`, preventing a demo bank from being mistaken for the production dataset.

## Optional free services

- Firebase Spark plan: shared question rotation, anonymous sessions and leaderboards.
- Hugging Face: ambiguous free-text grading after the local matcher. With no token, local grading remains available and no AI request is made.
- Vercel Hobby: deployment for a personal, non-commercial project.

Copy `.env.example` to `.env.local` only when you want to connect those services. Never commit secret values.

## Trademark note

This is an independent fan project and is not affiliated with or endorsed by WWE. WWE and its marks are property of their respective owners.
