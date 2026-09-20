# WWE Era Trivia (2009–2018)

A lean, mobile-first WWE trivia game built with Next.js 14, TypeScript and Tailwind CSS. Multiple-choice play is fully local and requires no API calls. Free-text grading uses deterministic local matching first and can optionally fall back to Hugging Face.

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
