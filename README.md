# NodeHire

NodeHire is an open-source, AI-assisted interview preparation workspace for software, data, QA, business analysis, DevOps, security, and other technology roles.

Phase 1 establishes authentication, anonymous demo sessions, and reusable interview prep contexts. AI analysis is intentionally introduced in later phases.

## Getting started

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```sh
pnpm check
pnpm test:e2e
```

## Stack

- Next.js App Router and TypeScript
- Tailwind CSS and shadcn/ui
- Supabase Auth and PostgreSQL
- Vitest and Playwright
- Vercel

## License

MIT
