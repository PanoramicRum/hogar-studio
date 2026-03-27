# Contributing to Hogar Studio

Welcome! Hogar Studio is an open-source AI-powered interior design platform, and we'd love your help making it better. Whether you're a designer, developer, or just someone who loves decorating spaces — there's a way for you to contribute.

## Ways to Contribute

### 1. Create & Share Design Styles
The easiest way to contribute — no coding required!

Create a custom style in the app (Settings > AI Providers, then use the Style Creator in any project). Great styles get featured in the Marketplace.

**Style ideas:**
- Regional styles (Mediterranean, Japanese, Costa Rican, Nordic)
- Era-inspired (Art Deco, Mid-Century, Victorian, Y2K)
- Mood-based (Cozy Reading Nook, Energizing Home Office, Zen Meditation Space)
- Budget-focused (IKEA Hacker, Thrift Store Chic, DIY Modern)

### 2. Add Furniture to the Community
Create custom furniture with real dimensions and share them:
- Go to any project > Elements > Create Custom
- Enter accurate dimensions (width, depth, height in meters)
- Add product URLs from real stores
- Publish to the Marketplace for others to use

### 3. Create Style & Furniture Packages
For developers and designers who want to contribute a curated set:

```bash
# Create a new package
mkdir packages/my-awesome-style
```

Create `packages/my-awesome-style/hogar-package.json`:
```json
{
  "schemaVersion": 1,
  "id": "my-awesome-style",
  "name": "My Awesome Style Pack",
  "type": "style",
  "version": "1.0.0",
  "description": "A curated collection of amazing interior design styles",
  "author": { "name": "Your Name", "url": "https://github.com/you" },
  "license": "MIT",
  "tags": ["modern", "cozy"],
  "styles": [
    {
      "id": "cozy-cabin",
      "name": "Cozy Cabin",
      "nameI18n": { "en": "Cozy Cabin", "es": "Cabana Acogedora" },
      "prompt": "cozy mountain cabin interior, warm wood paneling, stone fireplace, plaid textiles, ambient warm lighting, professional photography",
      "negativePrompt": "cold, sterile, modern, blurry",
      "color": "#8B4513"
    }
  ]
}
```

See `packages/_built-in/hogar-package.json` for a complete example.

### 4. Contribute Code

#### Setting Up Development

```bash
# Clone the repo
git clone https://github.com/YOUR_ORG/hogar-studio.git
cd hogar-studio

# Start the dev environment
docker compose up -d

# Install dependencies locally (for IDE support)
npm install
npx prisma generate

# Run tests
npx vitest run

# The app is at http://localhost:3100
# Demo login: demo@hogar.dev / demo123
```

#### Code Architecture

```
src/
  app/                    # Next.js App Router pages & API routes
    [locale]/             # i18n pages (en/es)
    api/                  # REST API endpoints
  components/             # React components
    editor/               # 2D floor plan editor (Konva.js)
    viewer3d/             # 3D viewer (Three.js)
    designs/              # AI design generation UI
    elements/             # Furniture management
    layout/               # Navbar, Sidebar, Footer
    packages/             # Package system UI
    marketplace/          # Community marketplace
    settings/             # Settings pages
  lib/                    # Shared utilities
    ai-providers.ts       # Multi-provider AI abstraction
    ai-keys.ts            # User API key management
    packages/             # Package loader & registry
    geometry.ts           # Math utilities for editor
  stores/                 # Zustand state management
  types/                  # TypeScript type definitions
packages/                 # Community style & furniture packages
prisma/                   # Database schema & migrations
```

#### Pull Request Guidelines

1. **Fork** the repo and create a branch from `main`
2. **Write tests** for new functionality (`npx vitest run`)
3. **Type-check** your code (`npx tsc --noEmit`)
4. **Keep PRs focused** — one feature or fix per PR
5. **Update translations** if adding new UI text (both `messages/en.json` and `messages/es.json`)
6. **Add package entries** if creating new styles or furniture

#### Areas We Need Help With

- **Translations** — Add more languages beyond English and Spanish
- **Accessibility** — ARIA labels, keyboard navigation, screen reader support
- **Mobile UX** — Touch gestures for the 2D editor
- **3D Models** — GLTF furniture models to replace colored boxes
- **AI Prompts** — Better prompts for specific regional styles
- **Testing** — More unit tests, E2E tests with Playwright
- **Documentation** — API docs, component storybook

### 5. Report Bugs & Request Features

- **Bug reports**: Open an issue with steps to reproduce
- **Feature requests**: Open an issue describing the use case
- **Questions**: Use Discussions for questions

## Code of Conduct

Be kind, inclusive, and constructive. We're building a creative tool — let's keep the community creative and welcoming.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
