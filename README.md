# Hogar Studio

**Open-source AI-powered interior design platform.** Upload your floor plan, digitize it with AI, place furniture with real dimensions, generate photorealistic renders in any style, view in 3D/VR, and share designs with friends.

> **"Hogar"** means "home" in Spanish. Design yours.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## What Can You Do?

- **Digitize a floor plan** — Upload an image, AI extracts walls, rooms, doors, windows. Or trace them manually.
- **Design your space** — Place furniture with real-world dimensions, generate AI renders in 8+ styles
- **See it in 3D** — Walk through your apartment in 3D, VR headsets supported
- **Share and get opinions** — Share renders with friends, collect reactions and comments
- **Build the community** — Create and publish custom styles, furniture, and color palettes

## Quick Start

```bash
docker compose up -d
# Open http://localhost:3100
# Demo: demo@hogar.dev / demo123
```

**Free AI setup:** Get a [Gemini API key](https://aistudio.google.com/apikey) (no credit card) → Settings > AI Providers → paste → done.

## Community: Create & Share

Hogar Studio is built for creators. Everyone can contribute:

### Create Design Styles
Define AI prompts that generate specific aesthetics — Tropical, Industrial, Japandi, Art Deco, or anything you imagine. Share them in the Marketplace.

### Add Furniture
Create custom furniture with real dimensions. Import from product URLs (IKEA, Amazon, Wayfair) — AI extracts dimensions automatically. Share your furniture sets.

### Build Packages
Create `hogar-package.json` files with curated style + furniture collections. Drop them in `packages/` or submit a PR.

```json
{
  "schemaVersion": 1,
  "id": "tropical-paradise",
  "name": "Tropical Paradise",
  "type": "bundle",
  "styles": [{ "id": "tropical", "prompt": "tropical interior, rattan, plants..." }],
  "furniture": [{ "type": "hammock", "defaultWidth": 3.0, "defaultDepth": 1.2 }]
}
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

## Features

| Feature | Description |
|---------|-------------|
| **AI Floor Plan Digitization** | Upload image → AI extracts walls, rooms, doors, windows |
| **Manual Model Creation** | Trace walls on the image, define rooms, add openings |
| **2D Floor Plan Editor** | Konva.js canvas with real-world measurements (meters) |
| **3D Room Viewer** | Three.js with orbit/walk-through camera + WebXR VR |
| **360 Panoramas** | AI-generated equirectangular panoramas |
| **AI Design Generation** | 8+ styles, per-room rendering, 6 perspectives |
| **Custom Furniture** | Create, import from URL, import from photo |
| **Custom Styles & Palettes** | Create your own design aesthetics + color schemes |
| **Social Sharing** | Public share pages with comments and reactions |
| **AI Recommendations** | Design improvement suggestions |
| **Community Marketplace** | Publish and discover styles, furniture, palettes |
| **Package System** | Open-source extensible packages for community content |
| **Multi-Provider AI** | Gemini (free), OpenAI, Anthropic, Replicate, Local models |
| **Guest Mode** | Try everything without signing up |
| **Bilingual** | English and Spanish |

## Tech Stack

**Frontend:** Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui
**2D Editor:** Konva.js · react-konva
**3D/VR:** Three.js · @react-three/fiber · @react-three/xr
**Database:** PostgreSQL 16 · Prisma 7
**Auth:** NextAuth v5
**Storage:** MinIO (S3-compatible)
**AI:** Gemini · OpenAI · Anthropic · Replicate
**i18n:** next-intl (EN/ES)

## Environment Variables

Copy `.env.example` to `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `GEMINI_API_KEY` | Recommended | Free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `OPENAI_API_KEY` | Optional | GPT-4o + DALL-E 3 |
| `ANTHROPIC_API_KEY` | Optional | Claude for analysis |
| `REPLICATE_API_TOKEN` | Optional | SDXL design renders |

## Development

```bash
npm install && npx prisma generate && npx prisma migrate dev
npx tsx prisma/seed.ts   # Create demo user
npm run dev              # http://localhost:3000
npx vitest run           # Run tests
```

## Architecture

```
hogar-app     → Next.js 16 (port 3100)
hogar-db      → PostgreSQL 16 (port 5432)
hogar-storage → MinIO S3 (port 9000)
hogar-redis   → Redis 7 (port 6379)
```

## Contributing

We welcome all contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Creating and sharing design styles
- Adding furniture to the community
- Building style & furniture packages
- Contributing code
- Reporting bugs and requesting features

## License

[MIT](LICENSE) — use it, modify it, share it.
