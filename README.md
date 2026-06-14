# Training App

A client-facing training app built with [Payload CMS](https://payloadcms.com) and Next.js. Coaches manage workout plans in the Payload admin panel; clients log their sets through a mobile-friendly web interface.

## Features

- Workout plan hierarchy: Plan → Microcycle → Workout → Exercise
- Per-set logging with flexible tracking types (reps, weight, time, RIR, etc.)
- Polish and English UI (next-intl)
- Client authentication via Payload

## Tech stack

- **Next.js** (App Router)
- **Payload CMS** — content and auth
- **PostgreSQL** via `@payloadcms/db-postgres`
- **Tailwind CSS**
- **next-intl** — i18n (Polish / English)

## Getting started

### Requirements

- Node.js 18+
- PostgreSQL database

### Setup

```bash
git clone https://github.com/your-username/training-app
cd training-app
npm install
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/training_app
PAYLOAD_SECRET=your-long-random-secret-here
```

### Run

```bash
npm run dev
```

The app is available at `http://localhost:3000`.
The Payload admin panel is at `http://localhost:3000/admin`.

### First-time setup

1. Open `/admin` and create your first user account (becomes the super-admin)
2. Create a **Client** collection record for each athlete
3. Build a **Plan** and assign it to the client
4. The client logs in at `/` using their email and password set in the admin

## Project structure

```
src/
├── app/
│   ├── [locale]/(frontend)/   # Client-facing app
│   └── (payload)/             # Payload admin routes
├── collections/               # Payload collection configs
├── i18n/                      # next-intl routing and request config
└── messages/                  # Translation files (pl.json, en.json)
messages/
├── pl.json
└── en.json
```

## License

MIT
